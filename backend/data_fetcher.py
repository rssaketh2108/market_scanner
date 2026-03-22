import yfinance as yf
import pandas as pd
import requests
import json
import os
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed

CACHE_FILE = os.path.join(os.path.dirname(__file__), "cache", "stocks_data.json")
CACHE_DURATION_HOURS = 24


def get_all_tickers() -> list[str]:
    """Fetch all US-listed stock tickers from NASDAQ screener."""
    url = "https://api.nasdaq.com/api/screener/stocks"
    params = {"tableonly": "true", "limit": 25, "offset": 0, "download": "true"}
    headers = {"User-Agent": "Mozilla/5.0 (compatible; MarketScanner/1.0)"}

    response = requests.get(url, params=params, headers=headers, timeout=30)
    response.raise_for_status()
    data = response.json()
    rows = data["data"]["rows"]
    return [row["symbol"] for row in rows if row.get("symbol")]


def fetch_stock_data(ticker: str) -> dict | None:
    """Fetch fundamental data for a single ticker via yfinance."""
    try:
        info = yf.Ticker(ticker).info
        if not info or info.get("quoteType") != "EQUITY":
            return None

        price = info.get("currentPrice") or info.get("regularMarketPrice")
        if not price:
            return None

        return {
            "ticker": ticker,
            "name": info.get("longName", ticker),
            "sector": info.get("sector") or "Unknown",
            "industry": info.get("industry") or "Unknown",
            "market_cap": info.get("marketCap"),
            "price": price,
            # Valuation ratios
            "pe_ratio": info.get("trailingPE"),
            "forward_pe": info.get("forwardPE"),
            "pb_ratio": info.get("priceToBook"),
            "ps_ratio": info.get("priceToSalesTrailingTwelveMonths"),
            "peg_ratio": info.get("pegRatio"),
            "ev_to_ebitda": info.get("enterpriseToEbitda"),
            # Financial health
            "debt_to_equity": info.get("debtToEquity"),
            "current_ratio": info.get("currentRatio"),
            "quick_ratio": info.get("quickRatio"),
            # Profitability
            "roe": info.get("returnOnEquity"),
            "roa": info.get("returnOnAssets"),
            "profit_margin": info.get("profitMargins"),
            "operating_margin": info.get("operatingMargins"),
            # Cash flow
            "free_cash_flow": info.get("freeCashflow"),
            # Growth
            "earnings_growth": info.get("earningsGrowth"),
            "revenue_growth": info.get("revenueGrowth"),
            # Graham number inputs
            "book_value": info.get("bookValue"),
            "trailing_eps": info.get("trailingEps"),
            # 52-week range
            "fifty_two_week_low": info.get("fiftyTwoWeekLow"),
            "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
            # Dividend
            "dividend_yield": info.get("dividendYield"),
        }
    except Exception:
        return None


def fetch_all_stocks(max_workers: int = 20) -> list[dict]:
    """Fetch data for all tickers in parallel."""
    tickers = get_all_tickers()
    print(f"[data_fetcher] Fetching data for {len(tickers)} tickers...")
    results = []

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(fetch_stock_data, t): t for t in tickers}
        for i, future in enumerate(as_completed(futures), 1):
            result = future.result()
            if result:
                results.append(result)
            if i % 500 == 0:
                print(f"[data_fetcher] Progress: {i}/{len(tickers)}")

    print(f"[data_fetcher] Done. Got data for {len(results)} stocks.")
    return results


def get_cached_or_fetch() -> list[dict]:
    """Return cached data if still fresh, otherwise fetch and cache."""
    os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)

    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, "r") as f:
            cache = json.load(f)
        cached_time = datetime.fromisoformat(cache["timestamp"])
        if datetime.now() - cached_time < timedelta(hours=CACHE_DURATION_HOURS):
            print("[data_fetcher] Using cached data.")
            return cache["data"]

    data = fetch_all_stocks()
    with open(CACHE_FILE, "w") as f:
        json.dump({"timestamp": datetime.now().isoformat(), "data": data}, f)
    return data
