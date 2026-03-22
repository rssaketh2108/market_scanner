import "./FilterBar.css";

export default function FilterBar({ filters, onChange }) {
  const set = (key, val) => onChange({ ...filters, [key]: val });
  const hasActive = Object.values(filters).some((v) => v !== "");

  return (
    <div className="filter-bar">
      <span className="filter-label">Filters:</span>
      <label className="filter-item">
        Max P/E
        <input type="number" min="0" value={filters.pe_ratio_max ?? ""} onChange={(e) => set("pe_ratio_max", e.target.value)} placeholder="—" />
      </label>
      <label className="filter-item">
        Max P/B
        <input type="number" min="0" value={filters.pb_ratio_max ?? ""} onChange={(e) => set("pb_ratio_max", e.target.value)} placeholder="—" />
      </label>
      <label className="filter-item">
        Min ROE %
        <input type="number" value={filters.roe_min ?? ""} onChange={(e) => set("roe_min", e.target.value)} placeholder="—" />
      </label>
      <label className="filter-item">
        Max D/E
        <input type="number" min="0" value={filters.de_max ?? ""} onChange={(e) => set("de_max", e.target.value)} placeholder="—" />
      </label>
      <label className="filter-item">
        Min Score
        <input type="number" min="0" max="100" value={filters.score_min ?? ""} onChange={(e) => set("score_min", e.target.value)} placeholder="—" />
      </label>
      {hasActive && (
        <button className="filter-clear" onClick={() => onChange({})}>Clear</button>
      )}
    </div>
  );
}
