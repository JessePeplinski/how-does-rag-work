import Chat from './chat';

export default function Page() {
  return (
    <>
      <Chat />

      {/* SEO/GEO: server-rendered content for search engines and AI crawlers */}
      <div className="sr-only">
        <article>
          <h1>How does RAG work? — Interactive Retrieval-Augmented Generation Demo</h1>

          <section>
            <h2>What is Retrieval-Augmented Generation (RAG)?</h2>
            <p>
              RAG is an AI architecture pattern that enhances large language model (LLM) responses
              by grounding them in external knowledge retrieved at query time. Instead of relying
              solely on the model's training data, RAG systems fetch relevant documents from a
              knowledge base and include them as context in the prompt sent to the LLM. This reduces
              hallucination, enables knowledge currency, and supports source attribution.
            </p>
          </section>

          <section>
            <h2>How the RAG Pipeline Works</h2>
            <h3>Step 1: Document Indexing</h3>
            <p>
              Documents (markdown files, PDFs, web pages) are split into smaller chunks — typically
              by paragraph or fixed token count with overlap. Each chunk is converted into a dense
              vector embedding using a model like OpenAI's text-embedding-3-small. These vectors
              capture semantic meaning in a high-dimensional space where similar concepts are close together.
            </p>

            <h3>Step 2: Query Embedding and Similarity Search</h3>
            <p>
              When a user asks a question, it is embedded using the same model. The query vector is
              compared against all stored chunk vectors using cosine similarity — a metric that
              measures directional alignment between vectors. The most similar chunks are retrieved,
              typically the top 3-5 results.
            </p>

            <h3>Step 3: Context Augmentation</h3>
            <p>
              Retrieved chunks are injected into the LLM's system prompt as additional context,
              labeled with source attribution (e.g., [Source 1], [Source 2]). This grounds the
              model's response in factual, retrieved information rather than just training data.
            </p>

            <h3>Step 4: Generation with Citations</h3>
            <p>
              The LLM generates a response that references the provided context and includes
              [Source N] citations, allowing users to verify information against the original documents.
            </p>
          </section>

          <section>
            <h2>Key Concepts Demonstrated</h2>
            <ul>
              <li>Document chunking strategies (paragraph-based splitting)</li>
              <li>Vector embeddings and embedding models</li>
              <li>Cosine similarity for semantic search</li>
              <li>TF-IDF as a baseline retrieval method</li>
              <li>In-memory vector stores vs. dedicated vector databases</li>
              <li>System prompt augmentation for grounded generation</li>
              <li>Source citation and attribution in LLM responses</li>
              <li>Query term analysis and importance weighting</li>
            </ul>
          </section>

          <section>
            <h2>Interactive Features</h2>
            <p>
              This demo includes a 4-step pipeline visualization showing query term analysis,
              a similarity landscape chart comparing all chunks, retrieved source cards with
              full text previews, and bidirectional hover highlighting that connects words
              in the chat to their occurrences in source documents. It runs fully locally
              without an API key using TF-IDF fallback for embeddings.
            </p>
          </section>

          <section>
            <h2>Technology Stack</h2>
            <p>
              Built with Next.js 16, the Vercel AI SDK, Anthropic Claude for generation,
              OpenAI text-embedding-3-small for embeddings, and an in-memory vector store
              with cosine similarity. Uses custom AI SDK data stream parts to send retrieval
              metadata (sources, similarity scores, query term weights) alongside the LLM response.
            </p>
          </section>

          <section>
            <h2>Knowledge Base Topics</h2>
            <p>
              The demo knowledge base covers four AI/ML topics: Retrieval-Augmented Generation
              (architecture, indexing, query phases), Vector Databases (similarity metrics,
              HNSW, pgvector, Pinecone), Prompt Engineering (few-shot, chain-of-thought,
              system prompts), and AI Agents (ReAct pattern, tool use, multi-agent systems).
            </p>
          </section>
        </article>
      </div>
    </>
  );
}
