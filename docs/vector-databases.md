# Vector Databases and Similarity Search

## What are Vector Databases?

Vector databases are specialized storage systems designed to efficiently index and query high-dimensional vector data. Unlike traditional databases that search by exact matches or range queries on scalar values, vector databases excel at finding the most similar items based on mathematical distance in embedding space.

## Embeddings and Vector Space

An embedding is a dense numerical representation of data (text, images, audio) in a continuous vector space. Embedding models like OpenAI's text-embedding-3-small or Cohere's embed-v3 convert text into vectors of fixed dimensions (e.g., 1536 dimensions). In this space, semantically similar concepts are positioned close together, while dissimilar concepts are far apart.

For example, the embeddings for "dog" and "puppy" would be close together, while "dog" and "quantum physics" would be far apart. This property enables semantic search, which goes beyond keyword matching to understand meaning.

## Similarity Metrics

Several mathematical functions measure how close two vectors are:

### Cosine Similarity
Measures the cosine of the angle between two vectors. Values range from -1 (opposite) to 1 (identical direction). This is the most common metric for text embeddings because it focuses on direction rather than magnitude, making it robust to differences in text length.

### Euclidean Distance (L2)
Measures the straight-line distance between two points in vector space. Smaller values indicate more similar vectors. Best when the magnitude of vectors carries meaningful information.

### Dot Product
Calculates the sum of element-wise products. Similar to cosine similarity but also considers vector magnitude. Useful when both direction and magnitude are important.

## Popular Vector Databases

### Purpose-Built Vector Databases
- **Pinecone**: Fully managed, serverless vector database. Known for ease of use and scalability.
- **Weaviate**: Open-source vector database with built-in vectorization modules and hybrid search.
- **Qdrant**: Open-source, written in Rust, with strong filtering capabilities alongside vector search.
- **Chroma**: Lightweight, open-source, designed for AI applications. Great for prototyping.
- **Milvus**: Open-source, highly scalable, supports billions of vectors.

### Vector Extensions for Traditional Databases
- **pgvector**: PostgreSQL extension that adds vector similarity search. Ideal for teams already using Postgres.
- **Redis Vector Similarity**: Adds vector search to Redis, combining it with caching and real-time capabilities.

## Indexing Algorithms

Vector databases use specialized indexing algorithms for fast approximate nearest neighbor (ANN) search:

- **HNSW (Hierarchical Navigable Small World)**: Graph-based algorithm offering excellent recall and speed. Most popular for production workloads.
- **IVF (Inverted File Index)**: Partitions vectors into clusters and searches only relevant clusters. Good balance of speed and accuracy.
- **Product Quantization (PQ)**: Compresses vectors to reduce memory usage while maintaining reasonable search quality.

## In-Memory vs. Persistent Storage

For small datasets (thousands of documents), in-memory vector search with brute-force cosine similarity is perfectly adequate. You simply store embeddings in an array and compute similarity against all vectors for each query. This approach has zero infrastructure overhead and is ideal for demos and prototypes.

For larger datasets (millions of documents), purpose-built vector databases with ANN indexing become necessary for acceptable query latency.

## Hybrid Search

Many modern systems combine vector similarity search with traditional keyword search (BM25) to get the best of both worlds. This hybrid approach catches both semantic matches and exact keyword matches, improving retrieval quality in RAG systems.
