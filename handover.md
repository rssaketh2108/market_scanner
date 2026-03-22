# Handover — Market Scanner

## What This App Does
A personal stock market scanner that ranks all US-listed equities by value investing signals, grouped by industry. Shows all raw metrics + a composite score. No buy/sell verdicts.

## Current State (2026-03-21)
Initial scaffolding is complete. The app has not been run yet — no dependencies installed, no data fetched.

### Backend (FastAPI)
- `main.py`: API routes (`/status`, `/industries`, `/stocks/{industry}`, `/refresh`)
- `data_fetcher.py`: Fetches ~7k tickers from NASDAQ screener, parallel yfinance fetching (20 threads), 24h disk cache
- `metrics.py`: Computes all metrics + composite score

### Frontend (React/Vite)
- `App.jsx`: Industry sidebar, polls backend until ready, triggers stock fetch on industry select
- `StockTable.jsx`: Sortable table with all metrics, color-coded cells (green/yellow/red)

## Metrics Implemented
P/E, Forward P/E, P/B, P/S, PEG, EV/EBITDA, Debt/Equity, Current Ratio, Quick Ratio, ROE, ROA, Net Margin, Operating Margin, FCF Yield, EPS Growth, Revenue Growth, Graham Number, Graham Margin of Safety, 52-week Position, Dividend Yield

## Next Steps
See TODO.md

## How to Run (once dependencies are installed)
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```
Frontend: http://localhost:5173 — proxies `/api/*` to FastAPI on port 8000.
