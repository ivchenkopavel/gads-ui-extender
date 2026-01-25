import React, { useMemo, useState } from "react";
import { tokenizeSearchTerm } from "../features/report/tokenize.js";

export default function ReportTable({
  columns,
  rows,
  searchTermColumnName,
  markedRowIds,
  negativeMap,
  defaultMatchType, // shown in hint only (useful UX)
  onAddFullTerm,
  onRemoveFullTerm,
  onToggleWord,
}) {
  const [filter, setFilter] = useState("");

  const visibleRows = useMemo(() => {
    if (!filter.trim()) return rows;
    const q = filter.toLowerCase();
    return rows.filter((r) => (r.searchTerm || "").toLowerCase().includes(q));
  }, [rows, filter]);

  const hasData = columns?.length && rows?.length;

  function isInNegatives(text) {
    const key = String(text || "").trim().toLowerCase();
    return key && negativeMap?.has(key);
  }

  function renderCell(row, colName) {
    if (colName === searchTermColumnName) {
      const term = row[colName] ?? "";
      const tokens = tokenizeSearchTerm(term);

      return (
        <div>
          <div style={{ fontWeight: 650, marginBottom: 6 }}>{term}</div>

          {tokens.length ? (
            <div className="chips">
              {tokens.map((w, idx) => {
                const inList = isInNegatives(w);

                // Toggle behavior: click adds; click again removes
                return (
                  <button
                    key={`${w}-${idx}`}
                    className={`chip ${inList ? "chipOn" : ""}`}
                    title={inList ? "Remove from negatives" : "Add to negatives"}
                    onClick={() => onToggleWord(w)}
                  >
                    {w}
                    {inList ? <span className="chipX">×</span> : null}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="hintSmall">
            Tip: new negatives use default match type: <b>{defaultMatchType}</b>
          </div>
        </div>
      );
    }

    return row[colName] ?? "";
  }

  return (
    <div className="card">
      <div className="cardRow">
        <div>
          <div className="cardTitle">2) Search terms</div>
          <div className="cardHint">
            Row <b>+</b> adds the whole term. Click a <b>word chip</b> to add/remove that word.
            Added items are highlighted in red.
          </div>
        </div>

        <input
          className="input"
          placeholder="Filter search terms…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {!hasData ? (
        <div className="empty">Upload a CSV to render the report table here.</div>
      ) : (
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 90 }}>Actions</th>
                {columns.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {visibleRows.map((r) => {
                const fullTermInList = isInNegatives(r.searchTerm);
                const isMarked = markedRowIds?.has(r.__rowId) || fullTermInList;

                return (
                  <tr key={r.__rowId} className={isMarked ? "rowMarkedRed" : ""}>
                    <td>
                      <button
                        className="iconBtn"
                        title="Add whole term to negative list"
                        onClick={() => onAddFullTerm(r.searchTerm, r.__rowId)}
                      >
                        +
                      </button>

                      <button
                        className={`iconBtn danger ${fullTermInList ? "" : "iconBtnDisabled"}`}
                        title="Remove whole term from negative list"
                        disabled={!fullTermInList}
                        onClick={() => onRemoveFullTerm(r.searchTerm, r.__rowId)}
                      >
                        x
                      </button>
                    </td>

                    {columns.map((c) => (
                      <td key={c}>{renderCell(r, c)}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


