import pandas as pd
import numpy as np


# ---------------------------------------------------------------------------
# Derived metric calculations
# ---------------------------------------------------------------------------

def _graham_number(eps, book_value):
    """Graham Number = sqrt(22.5 * EPS * BVPS). Requires both > 0."""
    if eps and book_value and eps > 0 and book_value > 0:
        return (22.5 * eps * book_value) ** 0.5
    return None


def _fcf_yield(free_cash_flow, market_cap):
    if free_cash_flow and market_cap and market_cap > 0:
        return free_cash_flow / market_cap
    return None


def _graham_margin(price, graham_number):
    """How far below Graham Number the current price is (positive = undervalued)."""
    if price and graham_number and graham_number > 0:
        return (graham_number - price) / graham_number
    return None


def _52wk_low_proximity(price, low):
    """
    % above 52-week low. 0 means AT the low (most undervalued signal).
    We treat lower = better when scoring.
    """
    if price and low and low > 0:
        return (price - low) / low
    return None


def _52wk_position(price, low, high):
    """Position within 52-week range: 0 = at low, 1 = at high."""
    if price and low and high and high > low:
        return (price - low) / (high - low)
    return None


# ---------------------------------------------------------------------------
# Normalisation helper
# ---------------------------------------------------------------------------

def _normalize(series: pd.Series, higher_is_better: bool = True) -> pd.Series:
    """Min-max normalise to [0, 1], clipping at 5th/95th percentile."""
    valid = series.dropna()
    if len(valid) < 2:
        return pd.Series(np.nan, index=series.index)

    lo = valid.quantile(0.05)
    hi = valid.quantile(0.95)
    if hi == lo:
        return pd.Series(0.5, index=series.index)

    clipped = series.clip(lo, hi)
    norm = (clipped - lo) / (hi - lo)
    return norm if higher_is_better else (1 - norm)


# ---------------------------------------------------------------------------
# Main entry points
# ---------------------------------------------------------------------------

# Metrics used in composite score and their direction (higher raw = better?)
SCORE_METRICS: dict[str, bool] = {
    "pe_ratio": False,          # lower P/E → cheaper
    "forward_pe": False,
    "pb_ratio": False,
    "ps_ratio": False,
    "peg_ratio": False,         # lower PEG → better value relative to growth
    "ev_to_ebitda": False,
    "debt_to_equity": False,    # lower leverage → safer
    "current_ratio": True,      # higher → more liquid
    "quick_ratio": True,
    "roe": True,
    "roa": True,
    "profit_margin": True,
    "operating_margin": True,
    "fcf_yield": True,
    "earnings_growth": True,
    "graham_margin": True,      # more upside vs Graham Number
    "52wk_position": False,     # closer to 52-week low → more undervalued
}


def compute_metrics(stocks_data: list[dict]) -> pd.DataFrame:
    df = pd.DataFrame(stocks_data)
    if df.empty:
        return df

    # --- Derived metrics ---
    df["graham_number"] = df.apply(
        lambda r: _graham_number(r.get("trailing_eps"), r.get("book_value")), axis=1
    )
    df["fcf_yield"] = df.apply(
        lambda r: _fcf_yield(r.get("free_cash_flow"), r.get("market_cap")), axis=1
    )
    df["graham_margin"] = df.apply(
        lambda r: _graham_margin(r.get("price"), r.get("graham_number")), axis=1
    )
    df["52wk_proximity"] = df.apply(
        lambda r: _52wk_low_proximity(r.get("price"), r.get("fifty_two_week_low")), axis=1
    )
    df["52wk_position"] = df.apply(
        lambda r: _52wk_position(
            r.get("price"), r.get("fifty_two_week_low"), r.get("fifty_two_week_high")
        ),
        axis=1,
    )

    # --- Composite score (global normalisation across all stocks) ---
    norm_cols = []
    for metric, higher_is_better in SCORE_METRICS.items():
        if metric not in df.columns:
            continue
        col = f"_norm_{metric}"
        df[col] = _normalize(df[metric], higher_is_better)
        norm_cols.append(col)

    df["composite_score"] = df[norm_cols].mean(axis=1) * 100

    # Drop internal norm columns
    df.drop(columns=norm_cols, inplace=True)

    return df


def get_industry_rankings(df: pd.DataFrame) -> dict[str, list[dict]]:
    """Return stocks ranked by composite_score per industry."""
    result: dict[str, list[dict]] = {}
    for industry, group in df.groupby("industry"):
        ranked = group.sort_values("composite_score", ascending=False, na_position="last")
        # Replace NaN/inf with None for JSON serialisation
        clean = ranked.replace({float("nan"): None, float("inf"): None, float("-inf"): None})
        result[str(industry)] = clean.to_dict(orient="records")
    return result
