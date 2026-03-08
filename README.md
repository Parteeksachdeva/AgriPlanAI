# 🌾 AgriPlanAI

> **AI-Powered Agricultural Decision Support System for Indian Farmers**

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![XGBoost](https://img.shields.io/badge/XGBoost-EB5B2D?style=for-the-badge)](https://xgboost.readthedocs.io/)

AgriPlanAI is an intelligent agricultural platform that helps Indian farmers make data-driven decisions about crop selection, yield prediction, market pricing, and sustainable farming practices. Built with modern ML models and an intuitive interface.

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd AgriPlanAI

# Setup Backend
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Setup Frontend
cd ../frontend
npm install  # or: yarn install / pnpm install

# Run the application
# Terminal 1 - Backend
cd backend && uvicorn main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend && npm run dev
```

Visit `http://localhost:5173` to access the application.

---

## ✨ Features

### 🤖 AI-Powered Crop Recommendations

- **Smart Crop Suggestions**: ML-based recommendations considering soil (N, P, K), climate, and rainfall.
- **Yield Prediction**: Accurate yield forecasts in tonnes per hectare.
- **Revenue Estimation**: Expected income based on predicted yield and market prices.
- **Regional Suitability**: Crops categorized as Traditional, Common, or Rare for your state.
- **Risk Indicators**: Multi-dimensional risk scoring (Low/Medium/High) based on volatility and predictability.

### 💰 Market Intelligence

- **Real-time Agmarknet Integration**: Prices updated from live market data across Indian mandis.
- **Real-time Price Forecasting**: Predict prices 7-30 days ahead using enhanced ML models.
- **Nearby Mandi Comparison**: Find the best market to sell your produce with real-time distance sorting.
- **Seasonal Trends**: Know the best months to sell for maximum profit.

### 🌱 Sustainable Farming & Soil Health

- **Soil Amendment Recommendations**: Precise nitrogen, phosphorus, and potassium correction plans.
- **Crop Rotation Planner**: 3-year rotation plans with soil health impact scores.
- **Soil Recovery Plans**: Nitrogen-fixing crop recommendations based on current soil depletion.
- **Environmental Suitability**: Checks for rainfall, pH, and climate compatibility.

### 💬 Intelligent Chatbot

- **Multilingual Support**: Fully accessible in **English** and **Hindi**.
- **RAG-based Q&A**: Ask questions about crops, farming practices, and government schemes.
- **Document Intelligence**: Powered by ICAR documents and agricultural knowledge base.

### 📊 Comprehensive Analysis

- **AI Explanation**: Understand why a crop is recommended (feature importance/SHAP values).
- **Profit Calculator**: Calculate net profit after costs (seeds, labor, fertilizer, pesticides).
- **Crop Calendar**: Visual sowing/harvesting timeline customized for your region.
- **Crop Comparison**: Side-by-side comparison of multiple crops.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AgriPlanAI                               │
│  (Multilingual: English, Hindi)                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐         ┌─────────────────────────────────┐  │
│  │   Frontend   │◄───────►│           Backend               │  │
│  │(React + i18n)│  HTTP   │         (FastAPI)               │  │
│  └──────────────┘         └─────────────────────────────────┘  │
│         │                           │                          │
│         ▼                           ▼                          │
│  ┌──────────────┐         ┌─────────────────────────────────┐  │
│  │  FormScreen  │         │      ML Models (XGBoost)        │  │
│  │ ResultScreen │         │  • Crop Recommendation          │  │
│  │  Components  │         │  • Yield Prediction (Enhanced)  │  │
│  │ (Charts, UI) │         │  • Price Forecasting (Realtime) │  │
│  └──────────────┘         └─────────────────────────────────┘  │
│                                       │                          │
│                                       ▼                          │
│                           ┌─────────────────────────────────┐  │
│                           │      RAG System (ChromaDB)      │  │
│                           │  • Document Ingestion           │  │
│                           │  • Context Retrieval            │  │
│                           │  • LLM Answer Generation        │  │
│                           └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
AgriPlanAI/
├── 📂 backend/                    # FastAPI Backend
│   ├── 📄 main.py                 # API endpoints & orchestration
│   ├── 📄 model_enhanced.py       # Updated ML models
│   ├── 📄 price_prediction.py     # Real-time Mandi price forecasting
│   ├── 📄 rotation_planner.py     # Crop rotation logic
│   ├── 📄 weather_service.py      # Climate data integration
│   ├── 📂 rag/                    # RAG System
│   │   ├── 📄 ingest.py           # Document ingestion
│   │   ├── 📄 retrieve.py         # Context retrieval
│   │   └── 📄 generate.py         # LLM answer generation
│   ├── 📂 data/                   # Datasets (CSV/JSON)
│   │   ├── 📄 mandi_prices_enhanced.csv # Real Agmarknet scrapped historical data
│   │   ├── 📄 model1_training.csv # Crop recommendation training data
│   │   ├── 📄 nutrient_requirements.json # Soil amendment data
│   │   └── 📄 crop_metadata.json  # Regional suitability & details
│   └── 📄 requirements.txt        # Python dependencies
│
├── 📂 frontend/                   # React Frontend
│   ├── 📂 src/
│   │   ├── 📂 i18n/               # Internationalization (en/hi)
│   │   ├── 📂 components/         # Reusable features
│   │   │   ├── 📄 SoilRecommendations.tsx # Amendment logic
│   │   │   ├── 📄 PricePrediction.tsx # Real-time prices
│   │   │   ├── 📄 ProfitCalculator.tsx # Net profit math
│   │   │   └── 📄 AIExplanation.tsx   # Feature importance
│   │   ├── 📂 pages/              # Main screens
│   │   │   ├── 📄 WelcomeScreen.tsx # Onboarding tour
│   │   │   └── 📄 ResultScreen.tsx # Dashboard
│   │   └── 📄 App.tsx             # Main routing
│   └── 📄 package.json            # Node dependencies
└── 📄 README.md                   # This file
```

---

## 🔌 API Endpoints

### Core Prediction

| Endpoint           | Method | Description                                   |
| ------------------ | ------ | --------------------------------------------- |
| `/predict`         | POST   | Get crop recommendations with yield & revenue |
| `/api/ai-analysis` | POST   | Get detailed AI analysis for a crop           |

### Price Intelligence (Real-time)

| Endpoint                   | Method | Description                                           |
| -------------------------- | ------ | ----------------------------------------------------- |
| `/api/price-prediction`    | POST   | Predict future mandi prices using live Agmarknet data |
| `/api/market-insights`     | GET    | Market analysis & volatility trends                   |
| `/api/nearby-mandi-prices` | GET    | Compare nearby mandis for current rates               |

### Crop Planning & Soil

| Endpoint                  | Method | Description                   |
| ------------------------- | ------ | ----------------------------- |
| `/api/rotation-plan`      | POST   | Get crop rotation suggestions |
| `/api/soil-recovery-plan` | POST   | Soil recovery recommendations |

---

## 🧠 Machine Learning Models

### Model 1: Crop Recommendation (XGBoost Classifier)

- **Input**: Soil nutrients (N, P, K), pH, temperature, humidity, rainfall
- **Output**: Top-N recommended crops with probabilities
- **Features**: 7 numerical features
- **Classes**: 22 crop types

### Model 2: Yield Prediction (XGBoost Regressor)

- **Input**: Soil & climate data + crop type
- **Output**: Predicted yield (tonnes/hectare)
- **Features**: Crop-encoded + environmental features

### Model 3: Price Prediction (XGBoost Regressor)

- **Input**: State, crop/commodity, seasonal features
- **Output**: Predicted mandi price (INR/quintal)
- **Data**: Scraped and real-time historical mandi prices from [Agmarknet](https://agmarknet.gov.in/)

---

## 🛠️ Technology Stack

### Backend

- **FastAPI** - High-performance Python web framework.
- **XGBoost & Scikit-learn** - Gradient boosting for ML predictions.
- **ChromaDB & LangChain** - RAG system for intelligent chatbot responses.
- **Pandas/Numpy** - Real-time market data processing.

### Frontend

- **React 18 & TypeScript** - Type-safe UI development.
- **Tailwind CSS & shadcn/ui** - Premium design system.
- **i18next** - Multi-language support (English/Hindi).
- **Recharts** - Dynamic data visualization.

---

## 📊 Data Sources

To ensure accurate and actionable insights, AgriPlanAI utilizes data from trusted agricultural and meteorological sources:

- **[Agmarknet](https://agmarknet.gov.in/)**: Official source for real-time and **scrapped** historical Mandi price data across India.
- **[Kaggle Crop Dataset](https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset)**: Primary training data for the crop recommendation engine.
- **[ICAR](https://icar.org.in/)**: Knowledge base for the RAG-powered farming assistant.
- **IMD**: Source for regional climate and rainfall historical trends.

---

## � Environment Configuration

### Backend (.env)

```env
# OpenAI API Key for RAG chatbot
OPENAI_API_KEY=your_api_key_here

# ChromaDB settings
CHROMA_PERSIST_DIR=./chroma_db
```

### Frontend (.env.development)

```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## 🧪 Development

### Running Tests

```bash
# Backend tests
cd backend
python -m pytest

# Frontend tests
cd frontend
npm run test
```

### Training Models

```bash
cd backend
python scripts/test_models.py
```

### Ingesting Documents (RAG)

```bash
cd backend
python -c "from rag.ingest import ingest_documents; ingest_documents()"
```

---

## �🚢 Deployment

### Docker (Recommended)

```bash
# Build and run with Docker Compose
docker-compose up --build
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- **ICAR** - For agricultural research documents.
- **Agmarknet** - For the market data that empowers farmers to get better prices.
- **Kaggle** - For the foundational crop recommendation dataset.

---

<p align="center">
  <strong>Made with ❤️ for Indian Farmers</strong>
</p>
