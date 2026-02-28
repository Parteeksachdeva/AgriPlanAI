import os
from langchain_chroma import Chroma
import boto3
from langchain_aws import BedrockEmbeddings, ChatBedrock
from dotenv import load_dotenv

# Load AWS credentials
load_dotenv()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROMA_PATH = os.path.join(BASE_DIR, "chroma_db")

def translate_query_to_hindi(query: str) -> str:
    bedrock_client = boto3.client(service_name="bedrock-runtime", region_name="us-east-1")
    llm = ChatBedrock(client=bedrock_client, model_id="anthropic.claude-3-haiku-20240307-v1:0")
    prompt = f"Translate the following English question into formal Hindi suitable for searching the ICAR Indian agricultural report. Use standard agricultural terms like 'रोग प्रतिरोधी' (disease resistant), 'किस्में' (varieties), 'उपज' (yield). Provide ONLY the Hindi translation, no extra text or quotes. Question: '{query}'"
    response = llm.invoke(prompt)
    return response.content.strip()

def is_english(text):
    # Simple heuristic: if most characters are ASCII, assume English
    ascii_count = sum(1 for c in text if ord(c) < 128)
    return (ascii_count / len(text)) > 0.8 if text else False

def get_relevant_context(question: str) -> str:
    # If the DB hasn't been created yet, return empty context
    if not os.path.exists(CHROMA_PATH) or not os.listdir(CHROMA_PATH):
        return ""
        
    # Translate query if it's in English to match the Hindi DB
    search_query = question
    if is_english(question):
        print("Translating English query to Hindi for better vector matching...")
        search_query = translate_query_to_hindi(question)
        print(f"Translated query: {search_query}")

    # Initialize the same embeddings used in ingestion
    bedrock_client = boto3.client(service_name="bedrock-runtime", region_name="us-east-1")
    embeddings = BedrockEmbeddings(client=bedrock_client, model_id="cohere.embed-multilingual-v3")
    
    # Load the persisted Chroma database
    db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embeddings)
    
    # Create a retriever that returns the top 3 most relevant chunks
    retriever = db.as_retriever(search_kwargs={"k": 3})
    
    # Retrieve relevant documents for the TRANSLATED query
    docs = retriever.invoke(search_query)
    
    # Combine the document texts into a single context string
    context_text = "\n\n---\n\n".join([doc.page_content for doc in docs])
    return context_text
