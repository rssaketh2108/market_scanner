import "./StockTable.css";

// Column definitions: key, label, format function, color function
const COLUMNS = [
  { key: "ticker",          label: "Ticker",      fmt: (v) => v,                          color: null },
  { key: "name",            label: "Company",     fmt: (v) => v,                          color: null },
  { key: "composite_score", label: "Score",       fmt: fmtNum(1),                         color: colorScore },
  { key: "price",           label: "Price",       fmt: fmtDollar,                         color: null },
  { key: "market_cap",      label: "Mkt Cap",     fmt: fmtLarge,                          color: null },
  { key: "pe_ratio",        label: "P/E",         fmt: fmtNum(1),                         color: colorLow(5, 20) },
  { key: "forward_pe",      label: "Fwd P/E",     fmt: fmtNum(1),                         color: colorLow(5, 20) },
  { key: "pb_ratio",        label: "P/B",         fmt: fmtNum(2),                         color: colorLow(0.5, 3) },
  { key: "ps_ratio",        label: "P/S",         fmt: fmtNum(2),                         color: colorLow(0.5, 5) },
  { key: "peg_ratio",       label: "PEG",         fmt: fmtNum(2),                         color: colorLow(0.5, 2) },
  { key: "ev_to_ebitda",    label: "EV/EBITDA",   fmt: fmtNum(1),                         color: colorLow(4, 15) },
  { key: "debt_to_equity",  label: "D/E",         fmt: fmtNum(2),                         color: colorLow(0, 1) },
  { key: "current_ratio",   label: "Curr. Ratio", fmt: fmtNum(2),                         color: colorHigh(1, 2) },
  { key: "quick_ratio",     label: "Quick Ratio", fmt: fmtNum(2),                         color: colorHigh(0.5, 1.5) },
  { key: "roe",             label: "ROE",         fmt: fmtPct,                            color: colorHigh(0.05, 0.2) },
  { key: "roa",             label: "ROA",         fmt: fmtPct,                            color: colorHigh(0.02, 0.1) },
  { key: "profit_margin",   label: "Net Margin",  fmt: fmtPct,                            color: colorHigh(0, 0.15) },
  { key: "operating_margin",label: "Op. Margin",  fmt: fmtPct,                            color: colorHigh(0, 0.2) },
  { key: "fcf_yield",       label: "FCF Yield",   fmt: fmtPct,                            color: colorHigh(0.02, 0.1) },
  { key: "earnings_growth", label: "EPS Growth",  fmt: fmtPct,                            color: colorHigh(0, 0.2) },
  { key: "revenue_growth",  label: "Rev Growth",  fmt: fmtPct,                            color: colorHigh(0, 0.15) },
  { key: "graham_number",   label: "Graham #",    fmt: fmtDollar,                         color: null },
  { key: "graham_margin",   label: "Graham Mgn",  fmt: fmtPct,                            color: colorHigh(0, 0.3) },
  { key: "52wk_position",   label: "52W Pos",     fmt: (v) => v != null ? `${(v*100).toFixed(0)}%` : "—", color: color52wk },
  { key: "dividend_yield",  label: "Div Yield",   fmt: fmtPct,                            color: null },
];

// --- Formatters ---
function fmtNum(decimals) {
  return (v) => v != null ? (+v).toFixed(decimals) : "—";
}
function fmtPct(v) {
  return v != null ? `${(+v * 100).toFixed(1)}%` : "—";
}
function fmtDollar(v) {
  return v != null ? `$${(+v).toFixed(2)}` : "—";
}
function fmtLarge(v) {
  if (v == null) return "—";
  if (v >= 1e12) return `$${(v / 1e12).toFixed(1)}T`;
  if (v >= 1e9)  return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6)  return `$${(v / 1e6).toFixed(0)}M`;
  return `$${v}`;
}

// --- Color helpers ---
function colorScore(v) {
  if (v == null) return "";
  if (v >= 65) return "green";
  if (v >= 40) return "yellow";
  return "red";
}
function colorHigh(lo, hi) {
  return (v) => {
    if (v == null) return "";
    if (v >= hi) return "green";
    if (v >= lo) return "yellow";
    return "red";
  };
}
function colorLow(lo, hi) {
  return (v) => {
    if (v == null) return "";
    if (v <= lo || v < 0) return "green";   // very cheap or negative handled
    if (v <= hi) return "yellow";
    return "red";
  };
}
function color52wk(v) {
  if (v == null) return "";
  if (v <= 0.1) return "green";
  if (v <= 0.4) return "yellow";
  return "red";
}

export default function StockTable({ stocks, sortBy, ascending, onSort }) {
  return (
    <div className="table-wrapper">
      <table className="stock-table">
        <thead>
          <tr>
            <th className="rank-col">#</th>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                onClick={() => onSort(col.key)}
                className={`sortable ${sortBy === col.key ? "sorted" : ""}`}
              >
                {col.label}
                {sortBy === col.key && (
                  <span className="sort-arrow">{ascending ? " ▲" : " ▼"}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stocks.map((s, i) => (
            <tr key={s.ticker}>
              <td className="rank-col muted">{i + 1}</td>
              {COLUMNS.map((col) => {
                const v = s[col.key];
                const colorClass = col.color ? col.color(v) : "";
                return (
                  <td key={col.key} className={`cell ${colorClass} ${col.key === "ticker" ? "ticker-cell" : ""}`}>
                    {col.fmt(v)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
