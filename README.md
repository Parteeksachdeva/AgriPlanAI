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
- **Smart Crop Suggestions**: ML-based recommendations considering soil (N, P, K), climate, and rainfall
- **Yield Prediction**: Accurate yield forecasts in tonnes per hectare
- **Revenue Estimation**: Expected income based on predicted yield and market prices
- **Regional Suitability**: Crops categorized as Traditional, Common, or Rare for your state

### 💰 Mandi Price Prediction
- **Real-time Price Forecasting**: Predict prices 7-30 days ahead
- **Market Insights**: Price trends, volatility analysis, and stability metrics
- **Nearby Mandi Comparison**: Find the best market to sell your produce
- **Seasonal Trends**: Know the best months to sell for maximum profit

### 🌱 Sustainable Farming
- **Crop Rotation Planner**: 3-year rotation plans with soil health impact
- **Soil Recovery Plans**: Nitrogen-fixing crop recommendations
- **Environmental Suitability**: Checks for rainfall, pH, and climate compatibility

### 💬 Intelligent Chatbot
- **RAG-based Q&A**: Ask questions about crops, farming practices, and government schemes
- **Document Intelligence**: Powered by ICAR documents and agricultural knowledge base

### 📊 Comprehensive Analysis
- **AI Explanation**: Understand why a crop is recommended (feature importance)
- **Profit Calculator**: Calculate net profit after costs
- **Crop Calendar**: Visual sowing/harvesting timeline
- **Crop Comparison**: Side-by-side comparison of multiple crops

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AgriPlanAI                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐         ┌─────────────────────────────────┐  │
│  │   Frontend   │◄───────►│           Backend               │  │
│  │   (React)    │  HTTP   │         (FastAPI)               │  │
│  └──────────────┘         └─────────────────────────────────┘  │
│         │                           │                          │
│         ▼                           ▼                          │
│  ┌──────────────┐         ┌─────────────────────────────────┐  │
│  │  FormScreen  │         │      ML Models (XGBoost)        │  │
│  │ ResultScreen │         │  • Crop Recommendation          │  │
│  │  Components  │         │  • Yield Prediction             │  │
│  └──────────────┘         │  • Price Prediction             │  │
│                           └─────────────────────────────────┘  │
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
│   ├── 📄 model.py                # ML models (XGBoost)
│   ├── 📄 price_prediction.py     # Mandi price forecasting
│   ├── 📄 rotation_planner.py     # Crop rotation logic
│   ├── 📂 rag/                    # RAG System
│   │   ├── 📄 ingest.py           # Document ingestion
│   │   ├── 📄 retrieve.py         # Context retrieval
│   │   ├── 📄 generate.py         # LLM answer generation
│   │   └── 📄 ocr_ingest.py       # OCR for PDF documents
│   ├── 📂 data/                   # Training datasets
│   │   ├── 📄 model1_training.csv # Crop recommendation data
│   │   ├── 📄 model2_training.csv # Price prediction data
│   │   ├── 📄 crop_metadata.json  # Crop information
│   │   └── 📄 rotation_data.json  # Rotation planning data
│   ├── 📂 chroma_db/              # Vector database storage
│   └── 📄 requirements.txt        # Python dependencies
│
├── 📂 frontend/                   # React Frontend
│   ├── 📂 src/
│   │   ├── 📂 pages/              # Main screens
│   │   │   ├── 📄 FormScreen.tsx  # Input form
│   │   │   └── 📄 ResultScreen.tsx # Results display
│   │   ├── 📂 components/         # Reusable components
│   │   │   ├── 📄 CropRotationPlanner.tsx
│   │   │   ├── 📄 PricePrediction.tsx
│   │   │   ├── 📄 AIExplanation.tsx
│   │   │   ├── 📄 ProfitCalculator.tsx
│   │   │   ├── 📄 CropCalendar.tsx
│   │   │   ├── 📄 CropComparison.tsx
│   │   │   ├── 📄 SoilRecommendations.tsx
│   │   │   ├── 📄 ResultChatbot.tsx
│   │   │   └── 📄 Header.tsx
│   │   ├── 📂 lib/                # Utilities & data
│   │   │   ├── 📄 crop_calendar_data.ts
│   │   │   ├── 📄 crop_costs.ts
│   │   │   ├── 📄 soil_data.ts
│   │   │   └── 📄 utils.ts
│   │   ├── 📄 App.tsx             # Main app component
│   │   ├── 📄 api.ts              # API client
│   │   └── 📄 types.ts            # TypeScript types
│   └── 📄 package.json            # Node dependencies
│
└── 📄 README.md                   # This file
```

---

## 🔌 API Endpoints

### Core Prediction
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/predict` | POST | Get crop recommendations with yield & revenue |
| `/api/ai-analysis` | POST | Get detailed AI analysis for a crop |

### Price Intelligence
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/price-prediction` | POST | Predict future mandi prices |
| `/api/price-history/{commodity}/{state}` | GET | Historical price data |
| `/api/market-insights/{commodity}/{state}` | GET | Market analysis & volatility |
| `/api/seasonal-trends/{commodity}/{state}` | GET | Best months to sell |
| `/api/nearby-mandi-prices/{commodity}/{state}` | GET | Compare nearby mandis |

### Crop Planning
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/rotation-plan` | POST | Get crop rotation suggestions |
| `/api/soil-recovery-plan` | POST | Soil recovery recommendations |

### Chatbot
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ask` | POST | Ask farming questions (RAG-powered) |

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
- **Data**: Historical mandi prices from Agmarknet

---

## 🛠️ Technology Stack

### Backend
- **FastAPI** - High-performance Python web framework
- **XGBoost** - Gradient boosting for ML models
- **scikit-learn** - Data preprocessing & pipelines
- **ChromaDB** - Vector database for RAG
- **LangChain** - LLM integration for chatbot
- **pandas/numpy** - Data manipulation

### Frontend
- **React 18** - UI library with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Modern UI components
- **Recharts** - Data visualization
- **React Router** - Client-side routing

### Data Sources
- **Kaggle Crop Dataset** - Training data for crop recommendation
- **Agmarknet** - Historical mandi prices
- **ICAR Documents** - Agricultural knowledge base

---

## 📝 Environment Configuration

### Backend (.env)
```env
# OpenAI API Key for RAG chatbot (optional)
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

## 🚢 Deployment

### Docker (Recommended)
```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Manual Deployment
1. **Backend**: Deploy to any ASGI server (Uvicorn, Gunicorn)
2. **Frontend**: Build static files (`npm run build`) and serve with Nginx
3. **Environment**: Set production environment variables

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- **Python**: Follow PEP 8, use type hints
- **TypeScript**: Enable strict mode, use interfaces for types

---

## 📜 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- **ICAR** - Agricultural research documents
- **Agmarknet** - Market price data
- **Kaggle** - Crop recommendation dataset

---

<p align="center">
  <strong>Made with ❤️ for Indian Farmers</strong>
</p>
