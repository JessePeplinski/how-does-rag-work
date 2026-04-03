# CLAUDE.md

## Project Overview

"How does RAG work?" — an interactive visualization of the full RAG pipeline for job application portfolio.

## Commands

- `npm run dev` — start dev server (http://localhost:3000)
- `npm run build` — production build (use to verify no type errors)
- `npm run lint` — ESLint

## Architecture

- `docs/*.md` — knowledge base documents (4 markdown files on AI/ML topics)
- `lib/knowledge-base.ts` — document loading, chunking, embedding (OpenAI or TF-IDF fallback), cosine similarity search
- `lib/types.ts` — shared types: `ChatUIMessage`, `RetrievedSource`, `ChunkScoreData`, `QueryTermData`
- `app/api/chat/route.ts` — RAG pipeline API: retrieve chunks, analyze query terms, stream response via `createUIMessageStream` with custom `data-sources`, `data-scores`, `data-queryTerms` parts
- `app/api/stats/route.ts` — returns doc/chunk counts from knowledge base
- `app/page.tsx` — all UI: chat, sidebar pipeline visualization, hover interactions, mobile summary, "How it works" modal

## Key Patterns

- **AI SDK custom data parts**: sources, scores, and query terms are sent as `data-*` stream chunks via `createUIMessageStream<ChatUIMessage>`, rendered in `message.parts` on the client
- **Bidirectional hover**: `HoveredTermContext` (React context) connects query term chips, source card text, and chat message words — hovering any one highlights matches in the others
- **Local fallback**: when `AI_GATEWAY_API_KEY` is unset or `"your_key_here"`, uses TF-IDF vectors for retrieval and skips LLM generation. Checked in `initializeKnowledgeBase()`
- **Lazy init**: knowledge base embeds on first API request, not at build time

## Environment

- `AI_GATEWAY_API_KEY` — Vercel AI Gateway key (optional, enables real embeddings + Claude)

## Deployment

- Vercel (auto-deploys from `main` via Git integration)
- GitHub: https://github.com/JessePeplinski/how-does-rag-work
- Production URL: https://how-does-rag-work.vercel.app (pending rename)
