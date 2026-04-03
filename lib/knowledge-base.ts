import { embed, embedMany, cosineSimilarity } from 'ai';
import fs from 'fs';
import path from 'path';

export interface DocumentChunk {
  text: string;
  embedding: number[];
  metadata: {
    sourceFile: string;
    title: string;
  };
}

let knowledgeBase: DocumentChunk[] = [];
let initialized = false;
let usingLocalEmbeddings = false;

function chunkDocument(text: string): string[] {
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);

  const chunks: string[] = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > 1500 && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)/m);
  return match ? match[1].trim() : 'Untitled';
}

/**
 * Simple TF-IDF-like local embedding fallback.
 * Builds a bag-of-words vector using term frequency across the corpus.
 * No API key required.
 */
function buildVocabulary(texts: string[]): string[] {
  const termSet = new Set<string>();
  for (const text of texts) {
    for (const word of tokenize(text)) {
      termSet.add(word);
    }
  }
  return Array.from(termSet);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function textToTfIdfVector(text: string, vocabulary: string[], idf: number[]): number[] {
  const words = tokenize(text);
  const termFreq = new Map<string, number>();
  for (const word of words) {
    termFreq.set(word, (termFreq.get(word) || 0) + 1);
  }

  return vocabulary.map((term, i) => {
    const tf = (termFreq.get(term) || 0) / (words.length || 1);
    return tf * idf[i];
  });
}

let vocabulary: string[] = [];
let idf: number[] = [];

export function isUsingLocalEmbeddings(): boolean {
  return usingLocalEmbeddings;
}

let docCount = 0;

export function getKnowledgeBaseStats(): { docCount: number; chunkCount: number } {
  return { docCount, chunkCount: knowledgeBase.length };
}

export async function initializeKnowledgeBase(): Promise<void> {
  if (initialized) return;

  const docsDir = path.join(process.cwd(), 'docs');
  const files = fs.readdirSync(docsDir).filter((f) => f.endsWith('.md'));
  docCount = files.length;

  const allChunks: { text: string; metadata: { sourceFile: string; title: string } }[] = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(docsDir, file), 'utf-8');
    const title = extractTitle(content);
    const chunks = chunkDocument(content);

    for (const chunk of chunks) {
      allChunks.push({
        text: chunk,
        metadata: { sourceFile: file, title },
      });
    }
  }

  const hasApiKey = !!process.env.AI_GATEWAY_API_KEY && process.env.AI_GATEWAY_API_KEY !== 'your_key_here';

  if (hasApiKey) {
    // Use real embeddings via AI Gateway
    const { embeddings } = await embedMany({
      model: 'openai/text-embedding-3-small',
      values: allChunks.map((c) => c.text),
    });

    knowledgeBase = allChunks.map((chunk, i) => ({
      ...chunk,
      embedding: embeddings[i],
    }));

    usingLocalEmbeddings = false;
    console.log(`Knowledge base initialized with API embeddings: ${knowledgeBase.length} chunks from ${files.length} documents`);
  } else {
    // Fallback: local TF-IDF embeddings
    const texts = allChunks.map((c) => c.text);
    vocabulary = buildVocabulary(texts);

    // Compute IDF: log(N / (1 + df))
    const N = texts.length;
    const docFreq = new Array(vocabulary.length).fill(0);
    for (const text of texts) {
      const words = new Set(tokenize(text));
      vocabulary.forEach((term, i) => {
        if (words.has(term)) docFreq[i]++;
      });
    }
    idf = docFreq.map((df) => Math.log(N / (1 + df)));

    knowledgeBase = allChunks.map((chunk) => ({
      ...chunk,
      embedding: textToTfIdfVector(chunk.text, vocabulary, idf),
    }));

    usingLocalEmbeddings = true;
    console.log(`Knowledge base initialized with local TF-IDF: ${knowledgeBase.length} chunks from ${files.length} documents (no API key)`);
  }

  initialized = true;
}

export async function findRelevantChunks(
  query: string,
  topK: number = 3,
): Promise<(DocumentChunk & { similarity: number })[]> {
  let queryEmbedding: number[];

  if (usingLocalEmbeddings) {
    queryEmbedding = textToTfIdfVector(query, vocabulary, idf);
  } else {
    const result = await embed({
      model: 'openai/text-embedding-3-small',
      value: query,
    });
    queryEmbedding = result.embedding;
  }

  const scored = knowledgeBase.map((chunk) => ({
    ...chunk,
    similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  scored.sort((a, b) => b.similarity - a.similarity);

  return scored.slice(0, topK);
}

export interface ChunkScore {
  title: string;
  sourceFile: string;
  similarity: number;
  selected: boolean;
}

export async function getAllChunkScores(
  query: string,
  topK: number = 3,
): Promise<ChunkScore[]> {
  let queryEmbedding: number[];

  if (usingLocalEmbeddings) {
    queryEmbedding = textToTfIdfVector(query, vocabulary, idf);
  } else {
    const result = await embed({
      model: 'openai/text-embedding-3-small',
      value: query,
    });
    queryEmbedding = result.embedding;
  }

  const scored = knowledgeBase.map((chunk) => ({
    title: chunk.metadata.title,
    sourceFile: chunk.metadata.sourceFile,
    similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
    selected: false,
  }));

  scored.sort((a, b) => b.similarity - a.similarity);

  // Mark the top K as selected
  for (let i = 0; i < Math.min(topK, scored.length); i++) {
    scored[i].selected = true;
  }

  return scored;
}

export interface QueryTermInfo {
  original: string;
  normalized: string;
  weight: number;
  foundInSources: number[];
}

/**
 * Analyze which query terms appear in which source chunks and how important they are.
 * Works in both TF-IDF and embedding mode (in embedding mode, uses word overlap heuristic).
 */
export function analyzeQueryTerms(
  query: string,
  topChunks: { text: string }[],
): QueryTermInfo[] {
  // Split the query preserving original words while also getting normalized forms
  const rawWords = query.split(/\s+/).filter((w) => w.length > 0);
  const seen = new Set<string>();
  const results: QueryTermInfo[] = [];

  for (const word of rawWords) {
    const normalized = word.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalized.length <= 2 || seen.has(normalized)) continue;
    seen.add(normalized);

    // Compute importance weight
    let weight = 0.5; // default
    if (usingLocalEmbeddings && vocabulary.length > 0) {
      const vocabIdx = vocabulary.indexOf(normalized);
      if (vocabIdx !== -1 && idf[vocabIdx] !== undefined) {
        const maxIdf = Math.max(...idf);
        weight = maxIdf > 0 ? idf[vocabIdx] / maxIdf : 0.5;
      }
    } else {
      // For embedding mode: use a simple heuristic based on word rarity
      // Common words get lower weight
      const commonWords = new Set([
        'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
        'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'some',
        'them', 'than', 'its', 'over', 'such', 'that', 'this', 'with', 'will',
        'each', 'from', 'they', 'does', 'how', 'what', 'when', 'where', 'which',
        'who', 'why', 'use', 'used', 'using',
      ]);
      weight = commonWords.has(normalized) ? 0.15 : 0.7;
    }

    // Check which top chunks contain this term
    const foundInSources: number[] = [];
    const termRegex = new RegExp(`\\b${normalized}`, 'i');
    for (let i = 0; i < topChunks.length; i++) {
      if (termRegex.test(topChunks[i].text)) {
        foundInSources.push(i);
      }
    }

    // Boost weight if the term appears in sources
    if (foundInSources.length > 0) {
      weight = Math.min(weight * 1.3, 1.0);
    }

    results.push({ original: word, normalized, weight, foundInSources });
  }

  return results;
}
