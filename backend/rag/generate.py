import boto3
from langchain_aws import ChatBedrock
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv
from .search import (
    search_agricultural_info,
    format_search_results_for_llm,
    should_search_internet,
    search_government_schemes,
)

load_dotenv()

def generate_answer(
    question: str, 
    context: str, 
    language: str = "en", 
    has_pdf_context: bool = True,
    form_data: dict = None
) -> str:
    # Use Anthropic Claude 3 Haiku via AWS Bedrock
    bedrock_client = boto3.client(service_name="bedrock-runtime", region_name="us-east-1")
    llm = ChatBedrock(client=bedrock_client, model_id="anthropic.claude-3-haiku-20240307-v1:0")
    
    # Language-specific instructions - VERY STRICT
    if language == "hi":
        lang_instruction = """CRITICAL: You MUST reply ONLY in HINDI using Devanagari script.
DO NOT use English words. Write entirely in Hindi (हिंदी)."""
        farmer_persona = """You are a helpful and friendly agricultural expert AI assistant named "Kisan Mitra" (किसान मित्र).
Your goal is to help Indian farmers with practical, easy-to-understand advice.
- Use simple language that farmers can understand
- Be encouraging and supportive
- Provide actionable advice they can implement
- When discussing numbers, use ₹ for rupees and common Indian units
- Reference Indian agricultural practices and context"""
    else:
        lang_instruction = """CRITICAL: You MUST reply ONLY in ENGLISH.
DO NOT use Hindi or any other language. Write entirely in English."""
        farmer_persona = """You are a helpful and friendly agricultural expert AI assistant named "Kisan Mitra".
Your goal is to help Indian farmers with practical, easy-to-understand advice.
- Use simple language that farmers can understand
- Be encouraging and supportive
- Provide actionable advice they can implement
- When discussing numbers, use ₹ for rupees and common Indian units
- Reference Indian agricultural practices and context"""
    
    # Check if we need internet search
    internet_context = ""
    if should_search_internet(question):
        # Determine what to search for
        state = form_data.get('state', '') if form_data else ''
        
        # Search for schemes if query is about government benefits
        if any(kw in question.lower() for kw in ['scheme', 'yojana', 'subsidy', 'sarkar', 'योजना', 'सब्सिडी']):
            search_results = search_government_schemes(state=state)
        else:
            # General agricultural search
            search_results = search_agricultural_info(question)
        
        internet_context = format_search_results_for_llm(search_results)
    
    # Build combined context
    combined_context = ""
    if has_pdf_context and context and context.strip():
        combined_context += f"PDF Documents Context:\n{context}\n\n"
    if context and context.strip():
        combined_context += f"Current Farm Data:\n{context}\n\n"
    if internet_context:
        combined_context += f"{internet_context}\n\n"
    
    if not combined_context.strip():
        combined_context = "No additional context available. Answer based on your agricultural knowledge."
    
    # Unified template for all responses
    template = """{farmer_persona}

{lang_instruction}

Use the following context to answer the farmer's question. If the context doesn't contain the answer, use your general agricultural knowledge to provide helpful advice.

{combined_context}

Farmer's Question:
{question}

CRITICAL LANGUAGE RULE:
- If the language instruction says ENGLISH: Write your ENTIRE response in English only. No Hindi words.
- If the language instruction says HINDI: Write your ENTIRE response in Hindi only. No English words.

Instructions for your response:
1. Be friendly and address the farmer respectfully
2. Give practical, actionable advice
3. If mentioning prices, use ₹ (rupees)
4. If the question is about government schemes, provide specific details about eligibility and how to apply
5. Keep the response concise but informative
6. End with an encouraging note

Your Response (in the specified language ONLY):"""
    
    prompt = PromptTemplate(
        template=template,
        input_variables=["farmer_persona", "lang_instruction", "combined_context", "question"]
    )
    
    chain = prompt | llm
    response = chain.invoke({
        "farmer_persona": farmer_persona,
        "combined_context": combined_context,
        "question": question,
        "lang_instruction": lang_instruction
    })
    
    # Ensure proper UTF-8 encoding for the response
    answer = response.content
    if isinstance(answer, str):
        answer = answer.encode('utf-8', errors='ignore').decode('utf-8')
    
    return answer
