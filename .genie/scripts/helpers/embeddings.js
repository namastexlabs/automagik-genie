#!/usr/bin/env node

/**
 * Embeddings Helper - Learning Deduplication
 *
 * Checks if new learning already exists in target section.
 * Uses transformers.js with all-MiniLM-L6-v2 (85MB, CPU-only).
 *
 * Usage:
 *   genie helper embeddings "new learning text" file.md "Section Name"
 *
 * Output: Top matches with similarity scores and recommendations
 *   0.85+ = DUPLICATE (merge or skip)
 *   0.70-0.85 = RELATED (evaluate carefully)
 *   <0.70 = DIFFERENT (safe to append)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Lazy load transformers (only when needed)
let pipeline = null;
let embedder = null;

async function initEmbedder() {
  if (!embedder) {
    const { pipeline: pipelineImport } = await import('@xenova/transformers');
    pipeline = pipelineImport;
    // Use all-MiniLM-L6-v2 for sentence embeddings
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embedder;
}

/**
 * Compute cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Get embedding for text
 */
async function getEmbedding(text) {
  const model = await initEmbedder();
  const output = await model(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

/**
 * Extract section content from markdown file
 */
function extractSection(filePath, sectionName) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const sectionLines = [];
  let inSection = false;
  let sectionLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headerMatch = line.match(/^(#{1,6})\s+(.+)/);

    if (headerMatch) {
      const level = headerMatch[1].length;
      const title = headerMatch[2].trim();

      if (title.includes(sectionName) || title === sectionName) {
        inSection = true;
        sectionLevel = level;
        continue;
      } else if (inSection && level <= sectionLevel) {
        // Hit next section at same/higher level, stop
        break;
      }
    }

    if (inSection && line.trim()) {
      // Skip code blocks and markdown formatting
      if (!line.startsWith('```') && !line.startsWith('---')) {
        sectionLines.push({ text: line.trim(), line: i + 1 });
      }
    }
  }

  return sectionLines;
}

/**
 * Get cache path for file + section
 */
function getCachePath(filePath, sectionName) {
  const hash = crypto.createHash('md5')
    .update(filePath + ':' + sectionName)
    .digest('hex');

  const cacheDir = path.join(process.cwd(), '.genie', '.cache', 'embeddings');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  return path.join(cacheDir, `${hash}.json`);
}

/**
 * Get recommendation based on similarity score
 */
function getRecommendation(similarity) {
  if (similarity >= 0.85) return 'DUPLICATE';
  if (similarity >= 0.70) return 'RELATED';
  return 'DIFFERENT';
}

/**
 * Compare new learning to section (with caching)
 */
async function compareToSection(newText, filePath, sectionName) {
  // Stage 1: Check for exact match with grep (fast)
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  if (fileContent.includes(newText)) {
    return {
      stage: 1,
      exact_match: true,
      recommendation: 'DUPLICATE (exact match via grep)'
    };
  }

  // Stage 2: Semantic comparison (thorough)
  const cachePath = getCachePath(filePath, sectionName);
  let cached = null;

  // Try to load cache
  if (fs.existsSync(cachePath)) {
    try {
      cached = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    } catch (err) {
      // Cache invalid, will rebuild
    }
  }

  // Extract section lines
  const sectionLines = extractSection(filePath, sectionName);

  if (sectionLines.length === 0) {
    return {
      error: `Section "${sectionName}" not found in ${filePath}`,
      recommendation: 'CHECK SECTION NAME'
    };
  }

  // Compute embeddings (use cache if available)
  let embeddings = [];

  if (cached && cached.embeddings && cached.embeddings.length === sectionLines.length) {
    embeddings = cached.embeddings;
  } else {
    for (const item of sectionLines) {
      const emb = await getEmbedding(item.text);
      embeddings.push({ text: item.text, line: item.line, embedding: emb });
    }

    // Save cache
    fs.writeFileSync(cachePath, JSON.stringify({
      file: filePath,
      section: sectionName,
      model: 'Xenova/all-MiniLM-L6-v2',
      updated: new Date().toISOString(),
      embeddings
    }));
  }

  // Get new text embedding
  const newEmbedding = await getEmbedding(newText);

  // Calculate similarities
  const similarities = embeddings.map(item => ({
    text: item.text,
    line: item.line,
    similarity: cosineSimilarity(newEmbedding, item.embedding)
  }));

  // Sort by similarity and get top matches (threshold 0.65)
  similarities.sort((a, b) => b.similarity - a.similarity);
  const topMatches = similarities.slice(0, 5).filter(m => m.similarity >= 0.65);

  if (topMatches.length === 0) {
    return {
      stage: 2,
      matches: [],
      max_similarity: similarities[0]?.similarity || 0,
      recommendation: 'DIFFERENT (no similar content found)'
    };
  }

  const maxSim = topMatches[0].similarity;
  const overallRec = getRecommendation(maxSim);

  return {
    stage: 2,
    matches: topMatches.map(m => ({
      similarity: parseFloat(m.similarity.toFixed(3)),
      line: m.line,
      text: m.text.substring(0, 80) + (m.text.length > 80 ? '...' : ''),
      recommendation: getRecommendation(m.similarity)
    })),
    max_similarity: parseFloat(maxSim.toFixed(3)),
    recommendation: overallRec
  };
}

/**
 * Clear cache
 */
function clearCache() {
  const cacheDir = path.join(process.cwd(), '.genie', '.cache', 'embeddings');
  if (fs.existsSync(cacheDir)) {
    const files = fs.readdirSync(cacheDir);
    for (const file of files) {
      fs.unlinkSync(path.join(cacheDir, file));
    }
    console.log(`Cleared ${files.length} cached embeddings`);
  } else {
    console.log('No cache to clear');
  }
}

/**
 * Main
 */
async function main() {
  const args = process.argv.slice(2);

  // Help flag
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log('Usage:');
    console.log('  genie helper embeddings "new learning text" file.md "Section Name"');
    console.log('');
    console.log('Purpose: Check if new learning already exists in target section');
    console.log('');
    console.log('Output: Top matches with similarity scores and recommendations');
    console.log('  0.85+ = DUPLICATE (merge or skip)');
    console.log('  0.70-0.85 = RELATED (evaluate carefully)');
    console.log('  <0.70 = DIFFERENT (safe to append)');
    console.log('');
    console.log('Commands:');
    console.log('  genie helper embeddings "text" file.md "Section"  # Check for duplicates');
    console.log('  genie helper embeddings clear-cache               # Clear cache');
    console.log('');
    console.log('Example:');
    console.log('  genie helper embeddings \\');
    console.log('    "Never rewrite entire sections" \\');
    console.log('    .genie/spells/learn.md \\');
    console.log('    "Grow-and-Refine Protocol"');
    return;
  }

  // Clear cache command
  if (args[0] === 'clear-cache') {
    clearCache();
    return;
  }

  // Default: compare text to section
  const text = args[0];
  const file = args[1] || '.genie/spells/learn.md';
  const section = args[2] || 'Grow-and-Refine Protocol';

  if (!text) {
    console.error('Usage: genie helper embeddings "text" [file.md] ["Section Name"]');
    console.error('  Defaults: file=.genie/spells/learn.md, section="Grow-and-Refine Protocol"');
    process.exit(1);
  }

  if (!fs.existsSync(file)) {
    console.error(`File not found: ${file}`);
    process.exit(1);
  }

  const result = await compareToSection(text, file, section);
  console.log(JSON.stringify(result, null, 2));
}

main().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
