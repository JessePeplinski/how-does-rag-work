# Retrieval-Augmented Generation (RAG)

## What is RAG?

Retrieval-Augmented Generation (RAG) is an AI architecture pattern that enhances large language model (LLM) responses by grounding them in external knowledge retrieved at query time. Instead of relying solely on the model's training data, RAG systems fetch relevant documents from a knowledge base and include them as context in the prompt sent to the LLM.

## How RAG Works

The RAG pipeline consists of two main phases: indexing and querying.

### Indexing Phase

During indexing, documents are prepared for efficient retrieval:

1. **Document Loading**: Raw documents (PDFs, web pages, markdown files, databases) are ingested into the system.
2. **Chunking**: Documents are split into smaller, semantically meaningful pieces called chunks. Common strategies include splitting by paragraph, by a fixed token count with overlap, or by semantic boundaries.
3. **Embedding**: Each chunk is converted into a dense vector (embedding) using an embedding model like OpenAI's text-embedding-3-small. These vectors capture the semantic meaning of the text in a high-dimensional space.
4. **Storage**: The embeddings and their associated text chunks are stored in a vector database or index for fast similarity search.

### Query Phase

When a user asks a question:

1. **Query Embedding**: The user's question is converted into an embedding using the same embedding model.
2. **Retrieval**: The query embedding is compared against all stored chunk embeddings using similarity metrics like cosine similarity. The most similar chunks are retrieved.
3. **Augmentation**: The retrieved chunks are inserted into the LLM's prompt as additional context, typically in the system message or before the user's question.
4. **Generation**: The LLM generates a response grounded in both its training knowledge and the retrieved context.

## Why RAG Matters

RAG addresses several fundamental limitations of standalone LLMs:

- **Knowledge Currency**: LLMs have a training data cutoff. RAG allows them to access up-to-date information without retraining.
- **Hallucination Reduction**: By providing factual context, RAG significantly reduces the tendency of LLMs to generate plausible but incorrect information.
- **Domain Specificity**: Organizations can ground LLM responses in their proprietary data, internal documentation, or specialized knowledge bases.
- **Cost Efficiency**: RAG is far cheaper than fine-tuning a model on new data, and the knowledge base can be updated independently of the model.
- **Transparency**: Retrieved sources can be cited, allowing users to verify the information and understand where answers come from.

## RAG vs. Fine-Tuning

Fine-tuning modifies model weights to encode new knowledge, while RAG provides knowledge at inference time through context injection. RAG is preferred when knowledge changes frequently, when source attribution is important, or when the knowledge base is large. Fine-tuning is better for teaching the model new behaviors, styles, or domain-specific reasoning patterns.

## Common Challenges

- **Chunk Size Trade-offs**: Smaller chunks improve retrieval precision but may lose context. Larger chunks preserve context but may introduce noise.
- **Retrieval Quality**: The system is only as good as its retrieval. Poor embeddings or inappropriate similarity thresholds lead to irrelevant context.
- **Context Window Limits**: LLMs have finite context windows. Stuffing too many retrieved chunks can degrade response quality.
- **Latency**: The retrieval step adds latency to each query compared to a direct LLM call.
