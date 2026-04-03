# RAG Demo

A minimal Retrieval-Augmented Generation (RAG) demo built with Next.js, the Vercel AI SDK, and Anthropic Claude.

## How It Works

1. **Indexing**: On first request, markdown documents in `docs/` are chunked by paragraph and embedded using OpenAI's `text-embedding-3-small` model (or TF-IDF locally if no API key is set).
2. **Retrieval**: When you ask a question, it's embedded and compared against all chunks using cosine similarity. The top 3 most relevant chunks are retrieved.
3. **Augmented Generation**: Retrieved chunks are injected into the system prompt as context, and Claude generates a response grounded in that context with `[Source N]` citations.

### Local Mode (no API key)

The app works without any API key. In this mode:
- **Retrieval** uses TF-IDF vectors instead of OpenAI embeddings
- **Generation** is replaced with a formatted display of the retrieved chunks and their similarity scores
- The full RAG pipeline (chunking, vectorization, similarity search, retrieval) still runs end-to-end

## Architecture

```
docs/*.md → lib/knowledge-base.ts → In-memory vector store
                                          ↓
User query → app/api/chat/route.ts → embed query → search → augment prompt → stream response
                                          ↓
                                    app/page.tsx (chat UI with source citations)
```

## Knowledge Base

The demo includes 4 pre-loaded documents:

- **RAG Explanation** — What RAG is, how it works, why it matters
- **Vector Databases** — Similarity search, embedding spaces, popular vector DBs
- **Prompt Engineering** — Few-shot, chain-of-thought, system prompts, structured output
- **AI Agents** — ReAct pattern, tool use, multi-agent systems

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. **(Optional)** Add your Vercel AI Gateway API key to `.env.local` for full mode with real embeddings and LLM generation:
   ```
   AI_GATEWAY_API_KEY=your_key_here
   ```
   Without this, the app runs in local mode using TF-IDF retrieval.

3. Run the dev server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Next.js** (App Router)
- **Vercel AI SDK** (`ai` + `@ai-sdk/react`)
- **Anthropic Claude** (via Vercel AI Gateway) for chat generation
- **OpenAI text-embedding-3-small** (via Vercel AI Gateway) for embeddings
- **In-memory vector store** with cosine similarity — no external database needed
