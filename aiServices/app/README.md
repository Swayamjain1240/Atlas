# Private AI worker package boundary

The B.2 module groups are represented by the sibling directories:
`api`, `config`, `ingestion`, `embeddings`, `rag`, `llm`, `vectorstore`,
`services` and `utils`. B.2 implements the worker configuration, internal
authentication, health, embedding and local Ollama boundaries. Ingestion, RAG
and vector persistence remain intentionally empty until their later phases.
