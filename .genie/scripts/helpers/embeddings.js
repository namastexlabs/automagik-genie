#!/usr/bin/env node

/**
 * Embeddings Helper
 *
 * Local semantic similarity for deduplication.
 * Uses transformers.js with all-MiniLM-L6-v2 (85MB, CPU-only).
 *
 * Usage:
 *   genie helper embeddings compare --text "..." --file path.md --section "Section"
 *   genie helper embeddings cache --file path.md --section "Section"
 *   genie helper embeddings clear-cache
 *
 * Output (JSON):
 *   {
 *     "matches": [
 *       {"text": "...", "similarity": 0.87, "line": 123, "recommendation": "MERGE"}
 *     ],
 *     "max_similarity": 0.87,
 *     "action": "merge_or_skip"
 *   }
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
  let startLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headerMatch = line.match(/^(#{1,6})\s+(.+)/);

    if (headerMatch) {
      const level = headerMatch[1].length;
      const title = headerMatch[2].trim();

      if (title.includes(sectionName) || title === sectionName) {
        inSection = true;
        sectionLevel = level;
        startLine = i + 1;
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
  if (similarity > 0.85) return 'MERGE (strong overlap)';
  if (similarity > 0.70) return 'EVALUATE (related content)';
  return 'APPEND (different concept)';
}

/**
 * Get action based on max similarity
 */
function getAction(maxSim) {
  if (maxSim > 0.85) return 'merge_or_skip';
  if (maxSim > 0.70) return 'evaluate';
  return 'append';
}

/**
 * Compare text to section (with caching)
 */
async function compareToSection(newText, filePath, sectionName) {
  // Stage 1: Check for exact match with grep (fast)
  const exactMatch = fs.readFileSync(filePath, 'utf-8').includes(newText);
  if (exactMatch) {
    return {
      matches: [
        {
          text: newText,
          similarity: 1.0,
          line: -1,
          recommendation: 'EXACT DUPLICATE (found by grep)'
        }
      ],
      max_similarity: 1.0,
      action: 'skip'
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
      console.error('Cache read failed, rebuilding:', err.message);
    }
  }

  // Extract section lines
  const sectionLines = extractSection(filePath, sectionName);

  if (sectionLines.length === 0) {
    return {
      matches: [],
      max_similarity: 0,
      action: 'append',
      error: `Section "${sectionName}" not found in ${filePath}`
    };
  }

  // Compute embeddings (use cache if available)
  let embeddings = [];

  if (cached && cached.embeddings && cached.embeddings.length === sectionLines.length) {
    embeddings = cached.embeddings;
  } else {
    console.error('Computing embeddings for section (this may take a moment)...');
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
    }, null, 2));
  }

  // Get new text embedding
  const newEmbedding = await getEmbedding(newText);

  // Calculate similarities
  const similarities = embeddings.map(item => ({
    text: item.text,
    line: item.line,
    similarity: cosineSimilarity(newEmbedding, item.embedding)
  }));

  // Sort by similarity and get top matches
  similarities.sort((a, b) => b.similarity - a.similarity);
  const topMatches = similarities.slice(0, 5).filter(m => m.similarity > 0.65);

  const matches = topMatches.map(m => ({
    text: m.text,
    similarity: parseFloat(m.similarity.toFixed(3)),
    line: m.line,
    recommendation: getRecommendation(m.similarity)
  }));

  const maxSim = similarities.length > 0 ? similarities[0].similarity : 0;

  return {
    matches,
    max_similarity: parseFloat(maxSim.toFixed(3)),
    action: getAction(maxSim)
  };
}

/**
 * Cache section embeddings
 */
async function cacheSection(filePath, sectionName) {
  const sectionLines = extractSection(filePath, sectionName);

  if (sectionLines.length === 0) {
    console.error(`ERROR: Section "${sectionName}" not found in ${filePath}`);
    process.exit(1);
  }

  console.error(`Caching ${sectionLines.length} items from "${sectionName}"...`);

  const embeddings = [];
  for (const item of sectionLines) {
    const emb = await getEmbedding(item.text);
    embeddings.push({ text: item.text, line: item.line, embedding: emb });
    process.stderr.write('.');
  }
  console.error(' done!');

  const cachePath = getCachePath(filePath, sectionName);
  fs.writeFileSync(cachePath, JSON.stringify({
    file: filePath,
    section: sectionName,
    model: 'Xenova/all-MiniLM-L6-v2',
    updated: new Date().toISOString(),
    embeddings
  }, null, 2));

  console.log(JSON.stringify({
    cached: embeddings.length,
    file: filePath,
    section: sectionName,
    cache_path: cachePath
  }, null, 2));
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
    console.log(JSON.stringify({ cleared: files.length }));
  } else {
    console.log(JSON.stringify({ cleared: 0 }));
  }
}

/**
 * Main
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'compare') {
    const text = args.find(a => a.startsWith('--text='))?.split('=')[1];
    const file = args.find(a => a.startsWith('--file='))?.split('=')[1];
    const section = args.find(a => a.startsWith('--section='))?.split('=')[1];

    if (!text || !file || !section) {
      console.error('Usage: embeddings compare --text="..." --file=path.md --section="Section Name"');
      process.exit(1);
    }

    const result = await compareToSection(text, file, section);
    console.log(JSON.stringify(result, null, 2));

  } else if (command === 'cache') {
    const file = args.find(a => a.startsWith('--file='))?.split('=')[1];
    const section = args.find(a => a.startsWith('--section='))?.split('=')[1];

    if (!file || !section) {
      console.error('Usage: embeddings cache --file=path.md --section="Section Name"');
      process.exit(1);
    }

    await cacheSection(file, section);

  } else if (command === 'clear-cache') {
    clearCache();

  } else {
    console.error('Usage:');
    console.error('  embeddings compare --text="..." --file=path.md --section="Section"');
    console.error('  embeddings cache --file=path.md --section="Section"');
    console.error('  embeddings clear-cache');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
