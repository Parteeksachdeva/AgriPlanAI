import os
from langchain_chroma import Chroma
from langchain_community.embeddings import OllamaEmbeddings

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROMA_PATH = os.path.join(BASE_DIR, "chroma_db")

def get_relevant_context(question: str) -> str:
    # If the DB hasn't been created yet, return empty context
    if not os.path.exists(CHROMA_PATH) or not os.listdir(CHROMA_PATH):
        return ""

    # Initialize the same embeddings used in ingestion
    embeddings = OllamaEmbeddings(model="nomic-embed-text")
    
    # Load the persisted Chroma database
    db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embeddings)
    
    # Create a retriever that returns the top 3 most relevant chunks
    retriever = db.as_retriever(search_kwargs={"k": 3})
    
    # Retrieve relevant documents for the query
    docs = retriever.invoke(question)
    
    # Combine the document texts into a single context string
    context_text = "\n\n---\n\n".join([doc.page_content for doc in docs])
    return context_text
