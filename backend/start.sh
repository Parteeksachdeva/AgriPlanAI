#!/bin/bash
set -e

echo "Syncing data from S3..."
aws s3 sync s3://agriplanai-data/data/      /app/data/      --quiet
aws s3 sync s3://agriplanai-data/docs/      /app/docs/      --quiet
aws s3 sync s3://agriplanai-data/chroma_db/ /app/chroma_db/ --quiet
aws s3 sync s3://agriplanai-data/model_cache/ /app/model_cache/ --quiet

echo "Starting API..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
