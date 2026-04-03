import {
  streamText,
  UIMessage,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from 'ai';
import {
  initializeKnowledgeBase,
  findRelevantChunks,
  isUsingLocalEmbeddings,
} from '@/lib/knowledge-base';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  await initializeKnowledgeBase();

  // Extract the latest user message for retrieval
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  const query =
    lastUserMessage?.parts?.find((p): p is { type: 'text'; text: string } => p.type === 'text')
      ?.text ?? '';

  // RAG: retrieve relevant chunks
  const relevantChunks = await findRelevantChunks(query, 3);

  // Build context string with source attribution
  const context = relevantChunks
    .map(
      (chunk, i) =>
        `[Source ${i + 1}: ${chunk.metadata.title} (${chunk.metadata.sourceFile}), similarity: ${chunk.similarity.toFixed(3)}]\n${chunk.text}`,
    )
    .join('\n\n---\n\n');

  if (isUsingLocalEmbeddings()) {
    // Fallback: no API key, return a formatted response via the UI message stream protocol
    const fallbackText = buildFallbackResponse(query, relevantChunks);
    const stream = createUIMessageStream({
      execute: ({ writer }) => {
        const partId = 'fallback-text';
        writer.write({ type: 'text-start', id: partId });
        writer.write({ type: 'text-delta', id: partId, delta: fallbackText });
        writer.write({ type: 'text-end', id: partId });
      },
    });
    return createUIMessageStreamResponse({ stream });
  }

  const result = streamText({
    model: 'anthropic/claude-sonnet-4.6',
    system: `You are a helpful AI assistant with access to a knowledge base about AI/ML topics.
Answer questions based on the provided context. When you use information from the context, cite the source using [Source N] notation.
If the context doesn't contain relevant information, say so honestly and answer based on your general knowledge, noting that the answer is not from the knowledge base.

Context from knowledge base:
${context}`,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}

function buildFallbackResponse(
  query: string,
  chunks: { text: string; similarity: number; metadata: { title: string; sourceFile: string } }[],
): string {
  const lines: string[] = [
    `**Running in local mode** (no API key — using TF-IDF retrieval instead of embeddings, no LLM generation)\n`,
    `**Your query:** "${query}"\n`,
    `**Retrieved ${chunks.length} relevant chunks:**\n`,
  ];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    lines.push(
      `---\n\n[Source ${i + 1}] **${chunk.metadata.title}** (${chunk.metadata.sourceFile}) — similarity: ${chunk.similarity.toFixed(3)}\n`,
    );
    // Show first ~300 chars of the chunk
    const preview = chunk.text.length > 300 ? chunk.text.slice(0, 300) + '...' : chunk.text;
    lines.push(preview + '\n');
  }

  lines.push(
    `\n---\n\n*In full mode (with an API key), these chunks would be injected into Claude's system prompt, and the LLM would synthesize a natural-language answer with [Source N] citations.*`,
  );

  return lines.join('\n');
}
