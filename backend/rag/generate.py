from langchain_community.llms import Ollama
from langchain_core.prompts import PromptTemplate

def generate_answer(question: str, context: str) -> str:
    # Use Llama3 as the language model
    llm = Ollama(model="llama3")
    
    # Define a prompt template that strictly limits response to context and supports multilingual queries
    template = """You are an agricultural expert AI assistant.
Answer the user's question based ONLY on the following context. 
If the context is in Hindi, read and comprehend the Hindi text. 
You MUST reply in the EXACT SAME LANGUAGE as the user's question (e.g., if the user asks in Hindi, answer in Hindi).
If you cannot answer the question based on the provided context alone, reply honestly indicating that you don't know based on the documents.

Context:
{context}

Question:
{question}

Answer:"""
    
    prompt = PromptTemplate(
        template=template,
        input_variables=["context", "question"]
    )
    
    # Format the prompt and send securely to Ollama
    chain = prompt | llm
    
    response = chain.invoke({
        "context": context,
        "question": question
    })
    
    return response
