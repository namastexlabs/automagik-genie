#!/usr/bin/env node

/**
 * Embeddings Helper
 *
 * Compare semantic similarity between two files.
 * Uses transformers.js with all-MiniLM-L6-v2 (85MB, CPU-only).
 *
 * Usage:
 *   genie helper embeddings file1 file2
 *
 * Output: Similarity score (0-1)
 *   0.95+ = duplicate concept
 *   0.80-0.95 = related content
 *   0.70-0.80 = loosely related
 *   <0.70 = different topics
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
 * Read file and clean content (remove markdown noise)
 */
function readAndClean(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Remove code blocks, frontmatter, excessive whitespace
  return content
    .replace(/^---[\s\S]*?---/m, '') // Remove frontmatter
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/#{1,6}\s+/g, '') // Remove markdown headers
    .replace(/\n{3,}/g, '\n\n') // Normalize whitespace
    .trim();
}

/**
 * Get cache path for file
 */
function getCachePath(filePath) {
  const hash = crypto.createHash('md5')
    .update(filePath)
    .digest('hex');

  const cacheDir = path.join(process.cwd(), '.genie', '.cache', 'embeddings');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  return path.join(cacheDir, `${hash}.json`);
}

/**
 * Compare two files semantically (with caching)
 */
async function compareFiles(file1, file2) {
  // Read and clean both files
  const content1 = readAndClean(file1);
  const content2 = readAndClean(file2);

  // Check cache for file1
  const cache1Path = getCachePath(file1);
  let embedding1 = null;

  if (fs.existsSync(cache1Path)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cache1Path, 'utf-8'));
      if (cached.content === content1) {
        embedding1 = cached.embedding;
      }
    } catch (err) {
      // Cache invalid, will recompute
    }
  }

  if (!embedding1) {
    embedding1 = await getEmbedding(content1);
    fs.writeFileSync(cache1Path, JSON.stringify({
      file: file1,
      content: content1,
      embedding: embedding1,
      updated: new Date().toISOString()
    }));
  }

  // Check cache for file2
  const cache2Path = getCachePath(file2);
  let embedding2 = null;

  if (fs.existsSync(cache2Path)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cache2Path, 'utf-8'));
      if (cached.content === content2) {
        embedding2 = cached.embedding;
      }
    } catch (err) {
      // Cache invalid, will recompute
    }
  }

  if (!embedding2) {
    embedding2 = await getEmbedding(content2);
    fs.writeFileSync(cache2Path, JSON.stringify({
      file: file2,
      content: content2,
      embedding: embedding2,
      updated: new Date().toISOString()
    }));
  }

  // Calculate similarity
  const similarity = cosineSimilarity(embedding1, embedding2);

  return parseFloat(similarity.toFixed(3));
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
    console.log('  genie helper embeddings file1 file2');
    console.log('');
    console.log('Output: Similarity score (0-1)');
    console.log('  0.95+ = duplicate concept');
    console.log('  0.80-0.95 = related content');
    console.log('  0.70-0.80 = loosely related');
    console.log('  <0.70 = different topics');
    console.log('');
    console.log('Commands:');
    console.log('  genie helper embeddings file1 file2    # Compare files');
    console.log('  genie helper embeddings clear-cache    # Clear cache');
    return;
  }

  // Clear cache command
  if (args[0] === 'clear-cache') {
    clearCache();
    return;
  }

  // Default: compare two files
  const file1 = args[0];
  const file2 = args[1];

  if (!file1 || !file2) {
    console.error('Usage: genie helper embeddings file1 file2');
    process.exit(1);
  }

  if (!fs.existsSync(file1)) {
    console.error(`File not found: ${file1}`);
    process.exit(1);
  }

  if (!fs.existsSync(file2)) {
    console.error(`File not found: ${file2}`);
    process.exit(1);
  }

  const similarity = await compareFiles(file1, file2);
  console.log(similarity);
}

main().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
