# How does RAG work?

An interactive Retrieval-Augmented Generation (RAG) demo built with Next.js, the Vercel AI SDK, and Anthropic Claude. Designed to visualize how RAG works, not just what it produces.

## How It Works

1. **Indexing**: On first request, markdown documents in `docs/` are chunked by paragraph and embedded using OpenAI's `text-embedding-3-small` model (or TF-IDF locally if no API key is set).
2. **Retrieval**: When you ask a question, it's embedded and compared against all chunks using cosine similarity. The top 3 most relevant chunks are retrieved.
3. **Augmented Generation**: Retrieved chunks are injected into the system prompt as context, and Claude generates a response grounded in that context with `[Source N]` citations.

### Local Mode (no API key)

The app works without any API key. In this mode:
- **Retrieval** uses TF-IDF vectors instead of OpenAI embeddings
- **Generation** is replaced with a short note (the pipeline visualization in the sidebar shows the full retrieval results)
- The full RAG pipeline (chunking, vectorization, similarity search, retrieval) still runs end-to-end

## Features

- **4-step pipeline visualization** — sidebar shows: query term analysis, similarity landscape chart, retrieved source cards, and augmentation step
- **Interactive hover highlighting** — hover any word in the chat (question or response) to see where it appears in the retrieved source chunks, and vice versa
- **Query term analysis** — each word is weighted by importance (TF-IDF or heuristic) and color-coded, with counts of which sources contain it
- **Similarity landscape** — animated bar chart showing cosine similarity scores for all chunks, with the top 3 highlighted
- **Source citations** — LLM responses include `[Source N]` badges linked to retrieved chunks
- **"How it works" explainer** — modal with a step-by-step RAG pipeline diagram
- **Mobile support** — collapsible retrieval summary panel on small screens

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

- **Next.js 16** (App Router, TypeScript, Tailwind CSS)
- **Vercel AI SDK** (`ai` + `@ai-sdk/react`) with custom `data-*` stream parts for sources, scores, and query terms
- **Anthropic Claude** (via Vercel AI Gateway) for chat generation
- **OpenAI text-embedding-3-small** (via Vercel AI Gateway) for embeddings
- **In-memory vector store** with cosine similarity — no external database needed
- **TF-IDF fallback** — full pipeline runs locally without any API keys
