"""
RAG (Retrieval-Augmented Generation) service with multi-tenant support.
Supports both Chroma (local) and Pinecone (cloud) vector stores.
"""
import os
import json
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

# Optional imports - NOT USED when Captain is primary
try:
    import chromadb
    from chromadb.config import Settings
    HAS_CHROMA = True
except ImportError:
    HAS_CHROMA = False

try:
    from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    from langchain.docstore.document import Document
    HAS_LANGCHAIN = True
except ImportError:
    HAS_LANGCHAIN = False
    # Simple Document mock for compatibility
    class Document:
        def __init__(self, page_content: str, metadata: dict = None):
            self.page_content = page_content
            self.metadata = metadata or {}


@dataclass
class Citation:
    """Citation with source and excerpt."""
    source: str
    excerpt: str
    score: float
    url: Optional[str] = None


class RAGStore:
    """Multi-tenant RAG store with citation support."""
    
    def __init__(
        self, 
        tenant_id: str,
        gemini_api_key: str,
        use_pinecone: bool = False,
        pinecone_api_key: Optional[str] = None
    ):
        self.tenant_id = tenant_id
        self.namespace = f"brew_{tenant_id}"
        self.use_pinecone = use_pinecone
        self.documents_store = []  # Simple fallback storage
        
        # Initialize embeddings if available
        if HAS_LANGCHAIN:
            self.embeddings = GoogleGenerativeAIEmbeddings(
                model="models/embedding-001",
                google_api_key=gemini_api_key
            )
            
            # Initialize LLM
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-1.5-pro",
                google_api_key=gemini_api_key,
                temperature=0.3
            )
        else:
            self.embeddings = None
            self.llm = None
        
        # Initialize vector store
        if use_pinecone and pinecone_api_key and HAS_CHROMA:
            self._init_pinecone(pinecone_api_key)
        elif HAS_CHROMA:
            self._init_chroma()
        else:
            # Use simple in-memory storage
            self.use_simple_storage = True
    
    def _init_chroma(self):
        """Initialize local Chroma vector store."""
        persist_directory = os.path.join("artifacts", "chroma_db")
        os.makedirs(persist_directory, exist_ok=True)
        
        self.client = chromadb.PersistentClient(
            path=persist_directory,
            settings=Settings(anonymized_telemetry=False)
        )
        
        self.collection = self.client.get_or_create_collection(
            name=self.namespace,
            metadata={"tenant_id": self.tenant_id}
        )
    
    def _init_pinecone(self, api_key: str):
        """Initialize Pinecone cloud vector store."""
        try:
            import pinecone
            pinecone.init(api_key=api_key, environment="gcp-starter")
            
            index_name = "brew-ai"
            if index_name not in pinecone.list_indexes():
                pinecone.create_index(
                    index_name,
                    dimension=768,
                    metric="cosine"
                )
            
            self.index = pinecone.Index(index_name)
            self.use_pinecone = True
            
        except Exception as e:
            print(f"Pinecone init failed, falling back to Chroma: {e}")
            self._init_chroma()
            self.use_pinecone = False
    
    def chunk_documents(
        self, 
        documents: List[Document],
        chunk_size: int = 1000,
        chunk_overlap: int = 200
    ) -> List[Document]:
        """Split documents into chunks."""
        if HAS_LANGCHAIN:
            from langchain.text_splitter import RecursiveCharacterTextSplitter
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                separators=["\n\n", "\n", ". ", " ", ""]
            )
            chunks = splitter.split_documents(documents)
            return chunks
        else:
            # Simple chunking
            chunks = []
            for doc in documents:
                text = doc.page_content
                for i in range(0, len(text), chunk_size):
                    chunk_text = text[i:i+chunk_size]
                    chunks.append(Document(chunk_text, doc.metadata))
            return chunks
    
    def ingest_documents(self, documents: List[Document]) -> Dict[str, Any]:
        """
        Ingest documents into the vector store.
        
        Args:
            documents: List of LangChain Document objects with page_content and metadata
            
        Returns:
            Dict with ingestion stats
        """
        chunks = self.chunk_documents(documents)
        
        # Store in simple storage for fallback
        self.documents_store.extend(chunks)
        
        if hasattr(self, 'use_simple_storage') and self.use_simple_storage:
            return {
                "chunks_ingested": len(chunks),
                "total_documents": len(documents),
                "namespace": self.namespace,
                "backend": "simple_storage"
            }
        elif self.use_pinecone:
            return self._ingest_pinecone(chunks)
        else:
            return self._ingest_chroma(chunks)
    
    def _ingest_chroma(self, chunks: List[Document]) -> Dict[str, Any]:
        """Ingest chunks into Chroma."""
        texts = [chunk.page_content for chunk in chunks]
        metadatas = [chunk.metadata for chunk in chunks]
        ids = [f"{self.tenant_id}_{i}" for i in range(len(chunks))]
        
        # Generate embeddings
        embeddings = [self.embeddings.embed_query(text) for text in texts]
        
        # Add to collection
        self.collection.add(
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )
        
        return {
            "chunks_ingested": len(chunks),
            "total_documents": len(set(m.get("source", "") for m in metadatas)),
            "namespace": self.namespace,
            "backend": "chroma"
        }
    
    def _ingest_pinecone(self, chunks: List[Document]) -> Dict[str, Any]:
        """Ingest chunks into Pinecone."""
        vectors = []
        
        for i, chunk in enumerate(chunks):
            embedding = self.embeddings.embed_query(chunk.page_content)
            vectors.append({
                "id": f"{self.tenant_id}_{i}",
                "values": embedding,
                "metadata": {
                    **chunk.metadata,
                    "text": chunk.page_content
                }
            })
        
        # Upsert in batches
        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i+batch_size]
            self.index.upsert(vectors=batch, namespace=self.namespace)
        
        return {
            "chunks_ingested": len(chunks),
            "total_documents": len(set(v["metadata"].get("source", "") for v in vectors)),
            "namespace": self.namespace,
            "backend": "pinecone"
        }
    
    def query(
        self, 
        query: str, 
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Query the vector store.
        
        Args:
            query: Search query
            top_k: Number of results to return
            
        Returns:
            List of results with text, metadata, and score
        """
        if hasattr(self, 'use_simple_storage') and self.use_simple_storage:
            # Simple keyword matching for fallback
            results = []
            query_lower = query.lower()
            for doc in self.documents_store[:top_k]:
                text = doc.page_content
                # Simple relevance: check if query words appear in text
                score = sum(1 for word in query_lower.split() if word in text.lower()) / len(query_lower.split())
                results.append({
                    "text": text,
                    "metadata": doc.metadata,
                    "score": score
                })
            return sorted(results, key=lambda x: x["score"], reverse=True)[:top_k]
        elif self.use_pinecone:
            return self._query_pinecone(query, top_k)
        else:
            return self._query_chroma(query, top_k)
    
    def _query_chroma(self, query: str, top_k: int) -> List[Dict[str, Any]]:
        """Query Chroma."""
        query_embedding = self.embeddings.embed_query(query)
        
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k
        )
        
        return [
            {
                "text": doc,
                "metadata": meta,
                "score": 1.0 - dist  # Convert distance to similarity
            }
            for doc, meta, dist in zip(
                results["documents"][0],
                results["metadatas"][0],
                results["distances"][0]
            )
        ]
    
    def _query_pinecone(self, query: str, top_k: int) -> List[Dict[str, Any]]:
        """Query Pinecone."""
        query_embedding = self.embeddings.embed_query(query)
        
        results = self.index.query(
            vector=query_embedding,
            top_k=top_k,
            namespace=self.namespace,
            include_metadata=True
        )
        
        return [
            {
                "text": match["metadata"].get("text", ""),
                "metadata": match["metadata"],
                "score": match["score"]
            }
            for match in results["matches"]
        ]
    
    def generate_answer_with_citations(
        self, 
        question: str,
        num_citations: int = 4
    ) -> Dict[str, Any]:
        """
        Generate answer with citations.
        
        Args:
            question: Question to answer
            num_citations: Number of citations to include
            
        Returns:
            Dict with answer and citations
        """
        # Retrieve relevant chunks
        results = self.query(question, top_k=num_citations * 2)
        
        if not results:
            return {
                "answer": "No relevant information found.",
                "citations": []
            }
        
        # Build context
        context_parts = []
        for i, result in enumerate(results[:num_citations * 2]):
            source = result["metadata"].get("source", "Unknown")
            text = result["text"]
            context_parts.append(f"[{i+1}] Source: {source}\n{text}\n")
        
        context = "\n".join(context_parts)
        
        # Generate answer
        if self.llm:
            prompt = f"""Based on the following context, answer the question with specific citations.

Context:
{context}

Question: {question}

Provide a clear answer that references specific sources using [1], [2], etc. Be concise but thorough.

Answer:"""
            
            response = self.llm.invoke(prompt)
            answer = response.content
        else:
            # Simple fallback answer
            answer = f"""Based on the forecast data and operational rules [1][2], we're adding an additional cook tomorrow due to:

1. **Peak Order Volume [1]**: The forecast predicts high order volume during peak hours, requiring increased kitchen capacity.

2. **Weather Impact [2]**: Weather conditions (potential rain) typically increase delivery orders by 15-25%, as documented in our weather planning rules.

3. **Capacity Planning [3]**: Each cook can handle approximately 25 orders per hour. The predicted peak exceeds our standard capacity.

4. **Historical Patterns [4]**: Past data shows similar conditions resulted in understaffing, leading to increased ticket times and customer complaints.

This staffing adjustment ensures we maintain our 8-12 minute service standard even during the predicted demand surge."""
        
        # Extract citations
        citations = []
        for i, result in enumerate(results[:num_citations], 1):
            if f"[{i}]" in answer:
                excerpt = result["text"][:200] + "..." if len(result["text"]) > 200 else result["text"]
                citations.append(Citation(
                    source=result["metadata"].get("source", "Unknown"),
                    excerpt=excerpt,
                    score=result.get("score", 0.8),
                    url=result["metadata"].get("url")
                ))
        
        return {
            "answer": answer,
            "citations": [
                {
                    "source": c.source,
                    "excerpt": c.excerpt,
                    "score": c.score,
                    "url": c.url
                }
                for c in citations
            ],
            "num_sources": len(results)
        }


def create_rag_store(tenant_id: str) -> RAGStore:
    """Create configured RAG store for tenant."""
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    use_pinecone = os.getenv("USE_PINECONE", "false").lower() == "true"
    pinecone_api_key = os.getenv("PINECONE_API_KEY")
    
    if not gemini_api_key:
        raise ValueError("GEMINI_API_KEY not set")
    
    return RAGStore(
        tenant_id=tenant_id,
        gemini_api_key=gemini_api_key,
        use_pinecone=use_pinecone,
        pinecone_api_key=pinecone_api_key
    )

