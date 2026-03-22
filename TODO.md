# TODO

## Immediate (not yet done)
- [ ] Install dependencies and do a first run end-to-end
- [ ] Validate NASDAQ screener API response shape (may change without notice)
- [ ] Verify yfinance field names are correct for all metrics (some may return None unexpectedly)
- [ ] Test composite score distribution — ensure it spreads meaningfully across 0–100

## Short Term
- [ ] Add metric threshold filters in the UI (e.g. "only show P/E < 15")
- [ ] Add search/filter by ticker or company name
- [ ] Show data freshness timestamp in UI
- [ ] Handle stocks with mostly-null metrics gracefully (exclude from ranking?)

## Medium Term
- [ ] Decide on weighting for composite score (currently equal weight)
- [ ] Add ROIC (requires computing from raw financials, not directly in yfinance info)
- [ ] Consider adding insider buying signal
- [ ] Persist user's sort/filter preferences (localStorage)

## Later / To Discuss
- [ ] Upgrade to real-time data source if 15-min delay becomes a pain point
- [ ] Add historical composite score chart per company
- [ ] Add watchlist / saved companies feature
