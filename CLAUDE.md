# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AgriPlanAI is a crop recommendation system for Indian farmers. Farmers enter their field conditions (soil NPK, rainfall, season, state) and receive ranked crop recommendations with predicted yield and expected revenue, based on real mandi (wholesale market) prices.

## Architecture

### Backend (`backend/`) — FastAPI + Python ML

**Three-model prediction pipeline** (all trained at startup from CSVs):

1. **Model 1a** (`CropRecommendationModel`) — XGBClassifier, inputs: N/P/K/temp/humidity/pH/rainfall → top-N crop probabilities
2. **Model 1b** (`YieldPredictionModel`) / `StateAwareYieldModel` (enhanced) — XGBRegressor → yield in t/ha per crop
3. **Model 2** (`PricePredictionModel`) / `EnhancedPricePredictionModel` (enhanced) — XGBRegressor → mandi price in INR/quintal

**Revenue formula:** `yield(t/ha) × area(ha) × 10(quintals/t) × price(INR/quintal) × penalty`

**Key files:**
- `main.py` — FastAPI app, all API endpoints, pipeline orchestration
- `model.py` — base `CropRecommendationModel`, `YieldPredictionModel`, `PricePredictionModel`
- `model_enhanced.py` — `StateAwareYieldModel`, `EnhancedPricePredictionModel` (preferred at runtime)
- `price_prediction.py` — `MandiPricePredictor` (time-series price predictions, mandi comparisons)
- `rotation_planner.py` — crop rotation compatibility logic
- `weather_service.py` — weather data integration
- `rag/` — RAG pipeline: `ingest.py` (PDF → ChromaDB), `retrieve.py` (context lookup), `generate.py` (Claude 3 Haiku via AWS Bedrock)

**Data files** (in `data/`):
- `model1_training.csv` / `model1_training_enhanced.csv` — Kaggle crop dataset (55 crops)
- `model2_training_extended.csv` — Agmarknet mandi prices
- `state_crop_yields.csv` — DES state-level yield data

**Model caching:** Trained models are serialized to `model_cache/` via `joblib`. Cache is invalidated when data files are newer than the cache.

**RAG chatbot:** Uses ChromaDB (`chroma_db/`) with agricultural PDFs (including ICAR reports). Answers are generated via AWS Bedrock (Claude 3 Haiku). Supports English and Hindi responses.

### Frontend (`frontend/`) — React + TypeScript + Vite

Three-page SPA: `WelcomeScreen` → `FormScreen` → `ResultScreen`

- `src/api.ts` — all backend calls; uses `VITE_API_URL` env var (default: `http://localhost:8000`)
- `src/types.ts` — shared TypeScript types (`PredictionFormData`, `PredictionResult`, `CropResult`)
- `src/i18n/` — bilingual support (English/Hindi); `LanguageContext.tsx` provides `t()` hook; language persisted in `localStorage`
- `src/lib/` — static lookup data: `crop_costs.ts`, `crop_calendar_data.ts`, `crop_risk_data.ts`, `soil_data.ts`
- `src/components/` — result screen components: `AIExplanation`, `CropCalendar`, `CropComparison`, `CropRotationPlanner`, `PricePrediction`, `ProfitCalculator`, `SoilRecommendations`, `ResultChatbot`
- UI: Tailwind CSS + shadcn/ui (`components.json`)

## Development Commands

### Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend trains all models on startup (~30–60s locally). API available at `http://localhost:8000`.

Ingest new PDFs into RAG:
```bash
cd backend
python -m rag.ingest
```

### Frontend

```bash
cd frontend
pnpm install
pnpm dev        # dev server at http://localhost:5173
pnpm build      # tsc + vite build
pnpm lint       # eslint
```

`VITE_API_URL` in `frontend/.env.development` points to `http://localhost:8000` by default.

## AWS Deployment

- **Backend**: AWS App Runner (ECR image) — see `docs/deploy-backend.md`
- **Frontend**: AWS Amplify — see `docs/deploy-frontend.md`
- **CI/CD**: `.github/workflows/deploy-backend.yml` and `deploy-frontend.yml`
- On container startup, `backend/start.sh` syncs `data/`, `docs/`, `chroma_db/`, `model_cache/` from S3 bucket `agriplanai-data` before starting uvicorn. This means model training is skipped in production (cache loaded from S3).

## AWS Credentials

Always use AWS credentials from `backend/.env`. Never hardcode credentials or use a different profile. When running AWS CLI commands or boto3 locally, source from that file:

```bash
export $(grep -v '^#' backend/.env | xargs)
```

## Key Design Constraints

- `chromadb==0.5.3` is pinned — do NOT upgrade to 0.5.5 (conflicts with `langchain-chroma==0.1.3`)
- Enhanced models (`model_enhanced.py`) are used when available; original models (`model.py`) are fallbacks — never remove the fallback path
- Crop names between Model 1 (Kaggle) and Model 2 (Agmarknet) may not match exactly; `thefuzz` is used for fuzzy matching
- Suitability labels (`traditional`, `common`, `rare`) affect ranking: multipliers are 2.0 / 1.2 / 0.7
- The `/predict` endpoint always fetches top 25 crops from classifier internally (even if `top_n=5`) to allow seasonal filtering before returning the final `top_n`
- Only services listed in `allowed_services.txt` may be used on AWS — no NAT Gateway, no ECS+ALB
