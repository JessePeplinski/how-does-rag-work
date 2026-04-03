import {
  streamText,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from 'ai';
import {
  initializeKnowledgeBase,
  findRelevantChunks,
  getAllChunkScores,
  isUsingLocalEmbeddings,
} from '@/lib/knowledge-base';
import type { ChatUIMessage, RetrievedSource } from '@/lib/types';

export async function POST(req: Request) {
  const { messages }: { messages: ChatUIMessage[] } = await req.json();

  await initializeKnowledgeBase();

  // Extract the latest user message for retrieval
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  const query =
    lastUserMessage?.parts?.find((p): p is { type: 'text'; text: string } => p.type === 'text')
      ?.text ?? '';

  // RAG: retrieve relevant chunks and all scores
  const [relevantChunks, allScores] = await Promise.all([
    findRelevantChunks(query, 3),
    getAllChunkScores(query, 3),
  ]);

  // Prepare sources data for the client
  const sources: RetrievedSource[] = relevantChunks.map((chunk) => ({
    title: chunk.metadata.title,
    sourceFile: chunk.metadata.sourceFile,
    similarity: chunk.similarity,
    text: chunk.text,
  }));

  // Build context string with source attribution
  const context = relevantChunks
    .map(
      (chunk, i) =>
        `[Source ${i + 1}: ${chunk.metadata.title} (${chunk.metadata.sourceFile}), similarity: ${chunk.similarity.toFixed(3)}]\n${chunk.text}`,
    )
    .join('\n\n---\n\n');

  if (isUsingLocalEmbeddings()) {
    const fallbackText = buildFallbackResponse();
    const stream = createUIMessageStream<ChatUIMessage>({
      execute: ({ writer }) => {
        writer.write({ type: 'data-sources', data: sources });
        writer.write({ type: 'data-scores', data: allScores });
        const partId = 'fallback-text';
        writer.write({ type: 'text-start', id: partId });
        writer.write({ type: 'text-delta', id: partId, delta: fallbackText });
        writer.write({ type: 'text-end', id: partId });
      },
    });
    return createUIMessageStreamResponse({ stream });
  }

  const stream = createUIMessageStream<ChatUIMessage>({
    execute: async ({ writer }) => {
      writer.write({ type: 'data-sources', data: sources });
      writer.write({ type: 'data-scores', data: allScores });

      const result = streamText({
        model: 'anthropic/claude-sonnet-4.6',
        system: `You are a helpful AI assistant with access to a knowledge base about AI/ML topics.
Answer questions based on the provided context. When you use information from the context, cite the source using [Source N] notation.
If the context doesn't contain relevant information, say so honestly and answer based on your general knowledge, noting that the answer is not from the knowledge base.

Context from knowledge base:
${context}`,
        messages: await convertToModelMessages(messages),
      });

      writer.merge(result.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({ stream });
}

function buildFallbackResponse(): string {
  return `Running in local mode (no API key). Retrieved chunks are shown in the Retrieval Pipeline panel on the left. With an API key, Claude would synthesize a natural-language answer from these chunks with [Source N] citations.`;
}
