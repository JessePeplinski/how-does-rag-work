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

export async function initializeKnowledgeBase(): Promise<void> {
  if (initialized) return;

  const docsDir = path.join(process.cwd(), 'docs');
  const files = fs.readdirSync(docsDir).filter((f) => f.endsWith('.md'));

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
