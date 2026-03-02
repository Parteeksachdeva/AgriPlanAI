import os
from langchain_chroma import Chroma
import boto3
from langchain_aws import BedrockEmbeddings
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROMA_PATH = os.path.join(BASE_DIR, "chroma_db")

# Shared embeddings client — created once, reused across requests
_embeddings = None

def _get_embeddings():
    global _embeddings
    if _embeddings is None:
        bedrock_client = boto3.client(service_name="bedrock-runtime", region_name="us-east-1")
        # cohere.embed-multilingual-v3 handles English and Hindi natively —
        # no translation step needed.
        _embeddings = BedrockEmbeddings(client=bedrock_client, model_id="cohere.embed-multilingual-v3")
    return _embeddings

def get_relevant_context(question: str) -> str:
    if not os.path.exists(CHROMA_PATH) or not os.listdir(CHROMA_PATH):
        return ""

    db = Chroma(persist_directory=CHROMA_PATH, embedding_function=_get_embeddings())
    retriever = db.as_retriever(search_kwargs={"k": 3})
    docs = retriever.invoke(question)
    return "\n\n---\n\n".join([doc.page_content for doc in docs])
