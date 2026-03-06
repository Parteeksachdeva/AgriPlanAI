# AgriPlanAI — Backend AWS Deployment Plan (App Runner)

## Architecture Overview

```
Internet
   │
   ▼
AWS App Runner  (HTTPS endpoint, auto-scaling, built-in load balancing)
  └── Pulls image from ECR
  └── Reads secrets from Secrets Manager
  └── Reads/writes training data from S3
  └── Calls Amazon Bedrock (RAG)
  └── Logs to CloudWatch
```

**Services used (all in allowed_services.txt):**
- AWS App Runner — container hosting
- Amazon ECR — Docker image registry
- Amazon S3 — training data, chroma_db, model cache
- AWS Secrets Manager — API keys
- Amazon Bedrock — Claude 3 Haiku + Cohere embeddings (RAG)
- AmazonCloudWatch — logs
- AWS IAM — roles/policies (base service, always allowed)

---

## Step 1 — Build & Push Docker Image to ECR

```bash
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_DEFAULT_REGION="us-east-1"
ECR_URI="030269767837.dkr.ecr.us-east-1.amazonaws.com/agriplanai-backend"

# Create ECR repo (already created)
aws ecr create-repository --repository-name agriplanai-backend --region us-east-1

# Login, build (linux/amd64 for App Runner), tag, push
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin "030269767837.dkr.ecr.us-east-1.amazonaws.com"

cd backend/
docker build --platform linux/amd64 -t agriplanai-backend:latest .
docker tag agriplanai-backend:latest "${ECR_URI}:latest"
docker push "${ECR_URI}:latest"
```

---

## Step 2 — S3 Data Bucket

```bash
# Create bucket (already created)
aws s3 mb s3://agriplanai-data --region us-east-1
aws s3api put-public-access-block \
    --bucket agriplanai-data \
    --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Upload training data, docs, chroma_db, model_cache
aws s3 sync backend/data/        s3://agriplanai-data/data/
aws s3 sync backend/docs/        s3://agriplanai-data/docs/
aws s3 sync backend/chroma_db/   s3://agriplanai-data/chroma_db/
aws s3 sync backend/model_cache/ s3://agriplanai-data/model_cache/
```

The `backend/start.sh` syncs from S3 at container startup:
```bash
#!/bin/bash
set -e
echo "Syncing data from S3..."
aws s3 sync s3://agriplanai-data/data/        /app/data/        --quiet
aws s3 sync s3://agriplanai-data/docs/        /app/docs/        --quiet
aws s3 sync s3://agriplanai-data/chroma_db/   /app/chroma_db/   --quiet
aws s3 sync s3://agriplanai-data/model_cache/ /app/model_cache/ --quiet
echo "Starting API..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
```

---

## Step 3 — Secrets Manager

```bash
aws secretsmanager create-secret \
    --name agriplanai/backend \
    --region us-east-1 \
    --secret-string '{
        "AWS_ACCESS_KEY_ID": "AKIA...",
        "AWS_SECRET_ACCESS_KEY": "...",
        "SERPAPI_KEY": "...",
        "NEWSAPI_KEY": "...",
        "OPENWEATHER_API_KEY": "..."
    }'

# To update an existing secret with new keys:
# aws secretsmanager put-secret-value \
#     --secret-id agriplanai/backend \
#     --secret-string '{...updated JSON...}'
```

---

## Step 4 — IAM Role for App Runner

App Runner needs a role to pull from ECR and access AWS services.

```bash
# Instance role (what the running container can do)
aws iam create-role \
    --role-name AgriPlanAI-AppRunner-InstanceRole \
    --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [{"Effect": "Allow", "Principal": {"Service": "tasks.apprunner.amazonaws.com"}, "Action": "sts:AssumeRole"}]
    }'

aws iam put-role-policy \
    --role-name AgriPlanAI-AppRunner-InstanceRole \
    --policy-name AgriPlanAI-AppRunner-Policy \
    --policy-document '{
        "Version": "2012-10-17",
        "Statement": [
            {"Effect": "Allow", "Action": ["s3:GetObject","s3:ListBucket","s3:PutObject","s3:DeleteObject"], "Resource": ["arn:aws:s3:::agriplanai-data","arn:aws:s3:::agriplanai-data/*"]},
            {"Effect": "Allow", "Action": ["bedrock:InvokeModel","bedrock:InvokeModelWithResponseStream"], "Resource": "*"},
            {"Effect": "Allow", "Action": ["secretsmanager:GetSecretValue"], "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:agriplanai/*"},
            {"Effect": "Allow", "Action": ["logs:CreateLogGroup","logs:CreateLogStream","logs:PutLogEvents"], "Resource": "*"}
        ]
    }'

# Access role (App Runner uses this to pull from ECR)
aws iam create-role \
    --role-name AgriPlanAI-AppRunner-AccessRole \
    --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [{"Effect": "Allow", "Principal": {"Service": "build.apprunner.amazonaws.com"}, "Action": "sts:AssumeRole"}]
    }'

aws iam attach-role-policy \
    --role-name AgriPlanAI-AppRunner-AccessRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess
```

---

## Step 5 — Create App Runner Service

```bash
aws apprunner create-service \
    --service-name agriplanai-backend \
    --source-configuration '{
        "ImageRepository": {
            "ImageIdentifier": "030269767837.dkr.ecr.us-east-1.amazonaws.com/agriplanai-backend:latest",
            "ImageConfiguration": {
                "Port": "8000",
                "RuntimeEnvironmentVariables": {
                    "AWS_DEFAULT_REGION": "us-east-1",
                    "AWS_REGION": "us-east-1",
                    "PYTHONUNBUFFERED": "1"
                }
            },
            "ImageRepositoryType": "ECR"
        },
        "AutoDeploymentsEnabled": true,
        "AuthenticationConfiguration": {
            "AccessRoleArn": "arn:aws:iam::030269767837:role/AgriPlanAI-AppRunner-AccessRole"
        }
    }' \
    --instance-configuration '{
        "Cpu": "2 vCPU",
        "Memory": "4 GB",
        "InstanceRoleArn": "arn:aws:iam::030269767837:role/AgriPlanAI-AppRunner-InstanceRole"
    }' \
    --health-check-configuration '{
        "Protocol": "HTTP",
        "Path": "/",
        "Interval": 20,
        "Timeout": 10,
        "HealthyThreshold": 1,
        "UnhealthyThreshold": 5
    }' \
    --auto-scaling-configuration-arn "" \
    --region us-east-1
```

App Runner provides an HTTPS URL automatically:
```
https://xxxxxxxxxx.us-east-1.awsapprunner.com
```

> App Runner handles TLS, load balancing, and auto-scaling automatically.
> No VPC, NAT gateway, ALB, or ACM certificate needed.

---

## Step 6 — Upload Training Data to S3

```bash
aws s3 sync backend/data/        s3://agriplanai-data/data/
aws s3 sync backend/docs/        s3://agriplanai-data/docs/
aws s3 sync backend/chroma_db/   s3://agriplanai-data/chroma_db/
aws s3 sync backend/model_cache/ s3://agriplanai-data/model_cache/
```

### Required Data Files in `agriplanai-data/data/`

All of the following must be present for the full feature set to work:

| File | Used by |
|---|---|
| `model1_training.csv` | Crop classifier (base, Kaggle dataset) |
| `model1_training_enhanced.csv` | Crop classifier (state-aware enhanced) |
| `model2_training_extended.csv` | Mandi price predictor (extended Agmarknet data) |
| `state_crop_yields.csv` | DES state-level yield lookup |
| `state_yield_data_enhanced.csv` | `StateAwareYieldModel` — enhanced yield lookup |
| `mandi_prices_enhanced.csv` | `EnhancedPricePredictionModel` — state-commodity prices |
| `crop_metadata.json` | Season/rainfall/pH ranges, traditional states |
| `nutrient_requirements.json` | ICAR crop NPK requirements (rotation planner) |
| `rotation_data.json` | Crop rotation compatibility matrix |

---

## New Features Requiring Runtime Dependencies

These features were added after initial deployment. Each requires additional env vars and/or data files.

### Enhanced ML Models (`model_enhanced.py`)
- `StateAwareYieldModel` — uses `state_yield_data_enhanced.csv` for state-aware yield predictions
- `EnhancedPricePredictionModel` — uses `mandi_prices_enhanced.csv` for commodity-state price lookup
- Loaded automatically at startup; `model.py` classes are fallbacks if enhanced data files are absent

### Weather Service (`weather_service.py`)
- Calls OpenWeatherMap API for current/forecast weather per Indian state
- Requires `OPENWEATHER_API_KEY` in Secrets Manager
- Falls back gracefully to climate normals if key is absent or API is unreachable

### Crop Rotation Planner (`rotation_planner.py`)
- Reads `rotation_data.json` + `nutrient_requirements.json` from `data/`
- No external API needed

### Internet Search in RAG (`rag/search.py` / `rag/generate.py`)
- Augments chatbot answers with SerpAPI (Google Search) and NewsAPI (agricultural news)
- Requires `SERPAPI_KEY` + `NEWSAPI_KEY` in Secrets Manager
- Returns empty list gracefully if keys are absent — chatbot still works from ChromaDB context

---

## API Endpoints Reference

| Method | Endpoint | Feature group |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/predict` | Core prediction pipeline |
| `POST` | `/api/ask` | RAG chatbot (ChromaDB + Bedrock) |
| `POST` | `/api/price-prediction` | Mandi price time-series forecast |
| `GET` | `/api/price-history/{commodity}/{state}` | Historical mandi price data |
| `GET` | `/api/market-insights/{commodity}/{state}` | Market trend insights |
| `POST` | `/api/ai-analysis` | AI narrative analysis of recommendations |
| `POST` | `/api/rotation-plan` | Crop rotation plan generator |
| `POST` | `/api/soil-recovery-plan` | Soil nutrient recovery recommendations |
| `GET` | `/api/seasonal-trends/{commodity}/{state}` | Seasonal price patterns |
| `GET` | `/api/nearby-mandi-prices/{commodity}/{state}` | Nearest mandi price comparison |
| `GET` | `/api/model-data-quality` | Model training data quality metrics |
| `GET` | `/api/weather/current/{state}` | Current weather for state |
| `GET` | `/api/weather/forecast/{state}` | Weather forecast (default 7 days) |
| `GET` | `/api/weather/yield-adjustment/{state}/{crop}` | Weather-based yield adjustment factor |
| `GET` | `/api/weather/seasonal-outlook/{state}` | Seasonal weather outlook |

---

## Step 7 — CI/CD with GitHub Actions

The target `.github/workflows/deploy-backend.yml` should use App Runner (not ECS). The current file in the repo still references ECS — it needs to be updated to match the YAML below.

`AutoDeploymentsEnabled: true` means pushing a new image to ECR triggers App Runner automatically. The manual `start-deployment` step below is a fallback.

```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - '.github/workflows/deploy-backend.yml'

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: agriplanai-backend

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          cd backend
          docker build --platform linux/amd64 -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

      # App Runner auto-deploys when ECR image is updated (AutoDeploymentsEnabled: true).
      # The step below is a manual fallback only.
      - name: Trigger App Runner deployment (fallback)
        run: |
          aws apprunner start-deployment \
            --service-arn ${{ secrets.APP_RUNNER_SERVICE_ARN }} \
            --region us-east-1
```

### Required GitHub Secrets

| Secret | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM user key |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret |
| `APP_RUNNER_SERVICE_ARN` | `arn:aws:apprunner:us-east-1:030269767837:service/agriplanai-backend/52fd95971e7a4a8ab4978ae8ac84a9bb` |

---

## Cost Estimate (Monthly)

| Service | Config | Est. Cost |
|---|---|---|
| App Runner | 2 vCPU / 4 GB, active hours | ~$40–70 |
| ECR | ~2 GB image | ~$0.20 |
| S3 | ~15 GB data | ~$1 |
| Bedrock | Per request | ~$1–5 |
| Secrets Manager | 6 secrets | ~$3 |
| CloudWatch | Logs | ~$1 |
| **Total** | | **~$45–80/mo** |

> ~$45–80/mo vs ~$125/mo for ECS+NAT+ALB. No NAT Gateway ($35/mo saved).

---

## Deployment Checklist

- [ ] ECR repository created, image pushed (linux/amd64)
- [ ] S3 bucket `agriplanai-data` created
- [ ] All data files uploaded (including `model1_training_enhanced.csv`, `mandi_prices_enhanced.csv`, `state_yield_data_enhanced.csv`, `crop_metadata.json`, `nutrient_requirements.json`, `rotation_data.json`)
- [ ] `model_cache/` uploaded to S3 (so container skips retraining on startup)
- [ ] `chroma_db/` uploaded to S3 (RAG vector store)
- [ ] Secrets Manager secret `agriplanai/backend` contains: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `OPENWEATHER_API_KEY`, `SERPAPI_KEY`, `NEWSAPI_KEY`
- [ ] IAM `AgriPlanAI-AppRunner-InstanceRole` created with S3/Bedrock/Secrets permissions
- [ ] IAM `AgriPlanAI-AppRunner-AccessRole` created with ECR access policy
- [ ] App Runner service created with `AutoDeploymentsEnabled: true`
- [ ] App Runner health check passes (`/` returns 200)
- [ ] Backend URL confirmed: `https://rppd9c8vep.us-east-1.awsapprunner.com`
- [ ] Frontend `VITE_API_URL` set to App Runner URL
- [ ] GitHub Actions secrets `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `APP_RUNNER_SERVICE_ARN` added
- [ ] `.github/workflows/deploy-backend.yml` updated to use App Runner (not ECS)
- [ ] CORS in `main.py` updated with production frontend URL
