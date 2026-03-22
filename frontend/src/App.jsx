import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import StockTable from "./components/StockTable";
import FilterBar from "./components/FilterBar";
import "./App.css";

const API = "/api";

export default function App() {
  const [status, setStatus] = useState({ loading: true, ready: false });
  const [industries, setIndustries] = useState([]);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [stocksLoading, setStocksLoading] = useState(false);
  const [sortBy, setSortBy] = useState("composite_score");
  const [ascending, setAscending] = useState(false);
  const [filters, setFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  // Poll backend status until ready
  useEffect(() => {
    const poll = async () => {
      try {
        const { data } = await axios.get(`${API}/status`);
        setStatus(data);
        if (!data.ready) setTimeout(poll, 3000);
        else {
          const res = await axios.get(`${API}/industries`);
          setIndustries(res.data.industries);
          if (res.data.industries.length > 0) setSelectedIndustry(res.data.industries[0]);
        }
      } catch {
        setTimeout(poll, 5000);
      }
    };
    poll();
  }, []);

  const fetchStocks = useCallback(async () => {
    if (!selectedIndustry) return;
    setStocksLoading(true);
    try {
      const { data } = await axios.get(
        `${API}/stocks/${encodeURIComponent(selectedIndustry)}`,
        { params: { sort_by: sortBy, ascending, limit: 200 } }
      );
      setStocks(data.stocks);
    } finally {
      setStocksLoading(false);
    }
  }, [selectedIndustry, sortBy, ascending]);

  useEffect(() => { fetchStocks(); }, [fetchStocks]);

  const displayedStocks = stocks.filter((s) => {
    if (filters.pe_ratio_max !== "" && filters.pe_ratio_max != null && s.pe_ratio != null && s.pe_ratio > +filters.pe_ratio_max) return false;
    if (filters.pb_ratio_max !== "" && filters.pb_ratio_max != null && s.pb_ratio != null && s.pb_ratio > +filters.pb_ratio_max) return false;
    if (filters.roe_min !== "" && filters.roe_min != null && s.roe != null && s.roe < +filters.roe_min / 100) return false;
    if (filters.de_max !== "" && filters.de_max != null && s.debt_to_equity != null && s.debt_to_equity > +filters.de_max) return false;
    if (filters.score_min !== "" && filters.score_min != null && s.composite_score != null && s.composite_score < +filters.score_min) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!s.ticker.toLowerCase().includes(q) && !(s.name || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });
  const hasFilters = Object.values(filters).some((v) => v !== "") || !!searchQuery;

  const handleSort = (col) => {
    if (col === sortBy) setAscending((a) => !a);
    else { setSortBy(col); setAscending(false); }
  };

  const handleRefresh = async () => {
    await axios.post(`${API}/refresh`);
    setStatus({ loading: true, ready: false });
    setStocks([]);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <span className="logo">📈 Market Scanner</span>
          <span className="subtitle">Value Investing Signals · US Equities</span>
        </div>
        <div className="header-right">
          {status.loading && <span className="badge loading">Loading data…</span>}
          {status.ready && (
            <span className="badge ready">
              {status.industry_count} industries
            </span>
          )}
          {status.ready && status.last_updated && (
            <span className="freshness-label">
              Updated {new Date(status.last_updated).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button className="btn-refresh" onClick={handleRefresh} title="Force refresh">
            ↺ Refresh
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-title">Industries</div>
          {industries.length === 0 && (
            <div className="muted">{status.loading ? "Loading…" : "No data yet"}</div>
          )}
          {industries.map((ind) => (
            <button
              key={ind}
              className={`industry-btn ${ind === selectedIndustry ? "active" : ""}`}
              onClick={() => setSelectedIndustry(ind)}
            >
              {ind}
            </button>
          ))}
        </aside>

        <main className="main">
          {selectedIndustry && (
            <div className="industry-header">
              <h2>{selectedIndustry}</h2>
              <span className="muted">
                {hasFilters
                  ? `${displayedStocks.length} of ${stocks.length} companies`
                  : `${stocks.length} companies`}
              </span>
            </div>
          )}

          <input
            className="search-input"
            type="text"
            placeholder="Search by ticker or company name…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <FilterBar filters={filters} onChange={setFilters} />

          {stocksLoading && <div className="loading-msg">Loading stocks…</div>}

          {!stocksLoading && stocks.length > 0 && (
            <StockTable
              stocks={displayedStocks}
              sortBy={sortBy}
              ascending={ascending}
              onSort={handleSort}
            />
          )}

          {!stocksLoading && stocks.length === 0 && status.ready && (
            <div className="muted center">No stocks found for this industry.</div>
          )}
        </main>
      </div>
    </div>
  );
}
