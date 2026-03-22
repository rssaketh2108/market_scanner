# CLAUDE.md — Project Rules & Conventions

## Planning & Complexity
- **Any task with 3+ stages must be done in Plan Mode** before writing a single line of code.
- For simple fixes: take the simplest route. Do not rewrite working code.
- For complex tasks: pause and ask "what is the most elegant solution to this?" — then implement that. Not the first solution that comes to mind.
- Always discuss approach with the user before creating new files or making large structural changes.
- Do not create markdown files without user approval.

## Agent Discipline
- **Use subagents liberally.** The main agent's context window is a scarce resource — protect it.
- Delegate implementation, research, and exploration tasks to subagents wherever possible.
- Main agent coordinates; subagents execute.

## Git & Feature Workflow
- Every new feature must be developed on its own branch (e.g. `feature/metric-filters`).
- Workflow for every feature:
  1. **Implementer subagent**: implements the feature, pushes the branch, opens a PR to `main`.
  2. **Reviewer subagent**: reviews the PR, leaves comments, approves or requests changes.
  3. **Implementer subagent**: addresses review comments if any, then merges **only after reviewer approval**.
- Never push directly to `main`.
- Never merge without code review approval.

## Code Style
- No over-engineering. No premature abstractions.
- Do not add docstrings, comments, or type hints to code you didn't change.
- Three similar lines of code is better than a premature abstraction.
- No feature flags, backwards-compatibility shims, or unused exports.

## Stack
- **Backend**: Python + FastAPI + yfinance + pandas
- **Frontend**: React (Vite) — no UI framework, plain CSS
- **Data**: yfinance (15-min delayed, free). No paid data sources unless user decides otherwise.

## Project Structure
```
market_scanner/
  backend/
    main.py          # FastAPI app + routes
    data_fetcher.py  # yfinance fetching + disk caching
    metrics.py       # metric calculations + composite score
    cache/           # auto-generated, gitignored
  frontend/
    src/
      App.jsx / App.css
      components/
        StockTable.jsx / StockTable.css
```

## Data
- All US-listed stocks fetched from NASDAQ screener API.
- Data is cached to `backend/cache/stocks_data.json` for 24 hours to avoid hammering yfinance.
- On startup, backend loads data in a background thread. Frontend polls `/api/status` until ready.

## Metrics
- All value investing metrics are computed in `metrics.py`.
- Composite score = equal-weighted average of normalized (0–1) metrics, scaled to 0–100.
- Normalization is global (across all stocks), not per-industry.
- Rankings are per-industry, sorted by composite score descending by default.

## Do Not
- Do not add buy/sell/hold verdicts — show raw signals only.
- Do not add broker integrations.
- Do not switch data providers without discussing first.
