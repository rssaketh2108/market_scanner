import threading
from datetime import datetime
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from data_fetcher import get_cached_or_fetch
from metrics import compute_metrics, get_industry_rankings

app = FastAPI(title="Market Scanner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# In-memory state
# ---------------------------------------------------------------------------
_state: dict = {
    "rankings": None,   # dict[industry -> list[stock]]
    "loading": False,
    "error": None,
    "last_updated": None,
}


def _load():
    _state["loading"] = True
    _state["error"] = None
    try:
        raw = get_cached_or_fetch()
        df = compute_metrics(raw)
        _state["rankings"] = get_industry_rankings(df)
        _state["last_updated"] = datetime.now().isoformat()
    except Exception as e:
        _state["error"] = str(e)
    finally:
        _state["loading"] = False


# Kick off background load at startup
threading.Thread(target=_load, daemon=True).start()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/status")
def status():
    return {
        "loading": _state["loading"],
        "ready": _state["rankings"] is not None,
        "error": _state["error"],
        "industry_count": len(_state["rankings"]) if _state["rankings"] else 0,
        "last_updated": _state["last_updated"],
    }


@app.get("/industries")
def list_industries():
    if not _state["rankings"]:
        return {"industries": [], "loading": _state["loading"]}
    return {"industries": sorted(_state["rankings"].keys()), "loading": False}


@app.get("/stocks/{industry}")
def get_stocks(
    industry: str,
    sort_by: str = Query("composite_score"),
    ascending: bool = Query(False),
    limit: int = Query(200),
):
    if not _state["rankings"]:
        return {"stocks": [], "loading": _state["loading"]}

    stocks = _state["rankings"].get(industry)
    if stocks is None:
        raise HTTPException(status_code=404, detail=f"Industry '{industry}' not found.")

    if sort_by != "composite_score":
        stocks = sorted(
            stocks,
            key=lambda x: (x.get(sort_by) is None, x.get(sort_by) or 0),
            reverse=not ascending,
        )

    return {"stocks": stocks[:limit], "industry": industry, "total": len(stocks)}


@app.post("/refresh")
def refresh():
    if _state["loading"]:
        return {"message": "Already loading, please wait."}
    threading.Thread(target=_load, daemon=True).start()
    return {"message": "Data refresh started."}
