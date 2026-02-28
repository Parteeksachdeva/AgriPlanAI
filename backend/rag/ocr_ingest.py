#!/usr/bin/env python3

"""OCR based ingestion for Hindi PDFs.

This script replaces the previous `ingest.py` pipeline for PDFs that use legacy Hindi fonts.
It:
1. Converts each PDF page to an image using `pdf2image`.
2. Runs Tesseract OCR (`pytesseract`) with the Hindi language pack to obtain proper Unicode Devanagari text.
3. Splits the text into chunks (same parameters as before).
4. Generates embeddings via AWS Bedrock (Cohere multilingual v3).
5. Persists the vectors in the Chroma DB (`chroma_db`).

Make sure `tesseract` is installed on the system (e.g., `brew install tesseract` on macOS) and the Hindi language data (`hin`) is available.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
import boto3
from pdf2image import convert_from_path
os.environ["TESSDATA_PREFIX"] = "/opt/homebrew/share/tessdata"
import pytesseract
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_aws import BedrockEmbeddings
from langchain_chroma import Chroma

# Load environment variables (AWS credentials, region, etc.)
load_dotenv()

BASE_DIR = Path(__file__).resolve().parents[2]  # project root
DOCS_DIR = BASE_DIR / "backend" / "docs"
CHROMA_PATH = BASE_DIR / "chroma_db"

# Bedrock client for embeddings
bedrock_client = boto3.client(service_name="bedrock-runtime", region_name=os.getenv("AWS_REGION", "us-east-1"))
embeddings = BedrockEmbeddings(client=bedrock_client, model_id="cohere.embed-multilingual-v3")

# Text splitter (same as before)
text_splitter = RecursiveCharacterTextSplitter(chunk_size=400, chunk_overlap=50)


def ocr_pdf_to_text(pdf_path: Path) -> str:
    """Convert a PDF to a single Unicode string using OCR.
    Returns concatenated text of all pages.
    """
    # Path to poppler utilities (installed via Homebrew)
    POPPLER_PATH = "/opt/homebrew/Cellar/poppler/26.02.0_1/bin"
    # Convert PDF pages to images (PNG format)
    images = convert_from_path(str(pdf_path), fmt="png", poppler_path=POPPLER_PATH)
    page_texts = []
    for i, img in enumerate(images, start=1):
        # Run Tesseract OCR with Hindi language pack
        txt = pytesseract.image_to_string(img, lang="hin")
        page_texts.append(txt)
    return "\n\n".join(page_texts)


def main():
    if not DOCS_DIR.exists():
        raise FileNotFoundError(f"Docs directory not found: {DOCS_DIR}")

    all_text = []
    for pdf_file in DOCS_DIR.glob("*.pdf"):
        print(f"Running OCR on {pdf_file.name} …")
        text = ocr_pdf_to_text(pdf_file)
        all_text.append(text)

    if not all_text:
        print("No PDF files found for OCR ingestion.")
        return

    # Split into chunks
    documents = []
    for idx, txt in enumerate(all_text):
        chunks = text_splitter.create_documents([txt])
        documents.extend(chunks)
    print(f"Created {len(documents)} text chunks.")

    # Store in Chroma
    print("Creating Chroma vector store with Bedrock embeddings …")
    Chroma.from_documents(documents=documents, embedding=embeddings, persist_directory=str(CHROMA_PATH))
    print("Ingestion complete. Vector DB saved to", CHROMA_PATH)


if __name__ == "__main__":
    main()
