import boto3
from langchain_aws import ChatBedrock
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv

load_dotenv()

def generate_answer(question: str, context: str, language: str = "en", has_pdf_context: bool = True) -> str:
    # Use Anthropic Claude 3 Haiku via AWS Bedrock
    bedrock_client = boto3.client(service_name="bedrock-runtime", region_name="us-east-1")
    llm = ChatBedrock(client=bedrock_client, model_id="anthropic.claude-3-haiku-20240307-v1:0")
    
    # Language-specific instructions
    if language == "hi":
        lang_instruction = "You MUST reply in HINDI using Devanagari script (हिंदी में जवाब दें)."
    else:
        lang_instruction = "You MUST reply in ENGLISH."
    
    # If we have PDF context, use it as primary source
    if has_pdf_context and context and context.strip():
        template = """You are an agricultural expert AI assistant.
Answer the user's question based on the following context. 
{lang_instruction}

Context from agricultural documents:
{context}

Question:
{question}

Answer:"""
        
        prompt = PromptTemplate(
            template=template,
            input_variables=["context", "question", "lang_instruction"]
        )
        
        chain = prompt | llm
        response = chain.invoke({
            "context": context,
            "question": question,
            "lang_instruction": lang_instruction
        })
        
    else:
        # No PDF context - act as a normal LLM using screen data
        template = """You are an agricultural expert AI assistant helping a farmer.
The user is asking about their current crop recommendations shown on screen.
Use the provided farm data and crop recommendations to give a helpful, informative answer.
Be conversational and practical. Give specific advice based on the data provided.
{lang_instruction}

Current Farm Data and Recommendations:
{context}

Question:
{question}

Answer:"""
        
        prompt = PromptTemplate(
            template=template,
            input_variables=["context", "question", "lang_instruction"]
        )
        
        chain = prompt | llm
        response = chain.invoke({
            "context": context if context else "No specific data available.",
            "question": question,
            "lang_instruction": lang_instruction
        })
    
    # Ensure proper UTF-8 encoding for the response
    answer = response.content
    if isinstance(answer, str):
        answer = answer.encode('utf-8', errors='ignore').decode('utf-8')
    
    return answer
