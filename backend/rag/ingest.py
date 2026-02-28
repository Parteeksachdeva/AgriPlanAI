import os
from langchain_community.document_loaders import PyPDFDirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import OllamaEmbeddings
from langchain_chroma import Chroma

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS_DIR = os.path.join(BASE_DIR, "docs")
CHROMA_PATH = os.path.join(BASE_DIR, "chroma_db")

def ingest_documents():
    # Check if DB already exists to avoid re-ingestion
    if os.path.exists(CHROMA_PATH) and os.listdir(CHROMA_PATH):
        print(f"Chroma DB already exists at {CHROMA_PATH}. Skipping ingestion.")
        return

    print(f"Loading documents from {DOCS_DIR}...")
    if not os.path.exists(DOCS_DIR):
        os.makedirs(DOCS_DIR)
        print(f"Created {DOCS_DIR} directory. Please add PDFs and run ingestion again if needed.")
        return

    # PDFPlumber parses complex/foreign fonts much better than PyPDF
    from langchain_community.document_loaders import PDFPlumberLoader
    
    documents = []
    for filename in os.listdir(DOCS_DIR):
        if filename.endswith('.pdf'):
            file_path = os.path.join(DOCS_DIR, filename)
            loader = PDFPlumberLoader(file_path)
            documents.extend(loader.load())
    
    if not documents:
        print("No documents found in the docs directory. Skipping ingestion.")
        return

    print(f"Loaded {len(documents)} documents. Splitting into chunks...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=100
    )
    chunks = text_splitter.split_documents(documents)
    print(f"Split into {len(chunks)} chunks.")

    print("Initializing embeddings and creating Chroma DB...")
    embeddings = OllamaEmbeddings(model="nomic-embed-text")
    
    # Store in Chroma DB
    Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=CHROMA_PATH
    )
    print("Ingestion complete. Vector database saved to disk.")

if __name__ == "__main__":
    ingest_documents()
