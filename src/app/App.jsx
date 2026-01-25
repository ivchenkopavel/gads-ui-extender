import React, { useMemo, useReducer } from "react";
import UploadPanel from "../components/UploadPanel.jsx";
import ReportTable from "../components/ReportTable.jsx";
import NegativePanel from "../components/NegativePanel.jsx";
import { parseSearchTermsCsv } from "../features/report/parseSearchTermsCsv.js";
import { formatNegative } from "../features/negatives/formatNegative.js";

const initialState = {
  report: {
    columns: [],
    rows: [],
    filename: null,
    searchTermColumnName: null,
  },
  negatives: {
    items: [], // { id, text, matchType }
  },
  ui: {
    markedRowIds: new Set(), // rows that were added as FULL terms
  },
};

function reducer(state, action) {
  switch (action.type) {
    case "REPORT_LOADED": {
      return {
        ...state,
        report: {
          columns: action.payload.columns,
          rows: action.payload.rows,
          filename: action.payload.filename,
          searchTermColumnName: action.payload.searchTermColumnName,
        },
        ui: { ...state.ui, markedRowIds: new Set() },
        negatives: { ...state.negatives, items: [] },
      };
    }

    case "ADD_NEGATIVE": {
      const text = action.payload.text?.trim();
      if (!text) return state;

      const matchType = action.payload.matchType || "phrase";

      // dedupe by text (case-insensitive)
      const exists = state.negatives.items.some(
        (x) => x.text.trim().toLowerCase() === text.toLowerCase()
      );

      const nextMarked = new Set(state.ui.markedRowIds);
      if (action.payload.markRow && action.payload.rowId != null) {
        nextMarked.add(action.payload.rowId);
      }

      if (exists) {
        return { ...state, ui: { ...state.ui, markedRowIds: nextMarked } };
      }

      const nextItems = [
        ...state.negatives.items,
        { id: crypto.randomUUID(), text, matchType },
      ];

      return {
        ...state,
        negatives: { ...state.negatives, items: nextItems },
        ui: { ...state.ui, markedRowIds: nextMarked },
      };
    }

    case "REMOVE_NEGATIVE_BY_TEXT": {
      const text = (action.payload.text || "").trim().toLowerCase();
      if (!text) return state;

      const nextItems = state.negatives.items.filter(
        (x) => x.text.trim().toLowerCase() !== text
      );

      const nextMarked = new Set(state.ui.markedRowIds);
      if (action.payload.unmarkRow && action.payload.rowId != null) {
        nextMarked.delete(action.payload.rowId);
      }

      return {
        ...state,
        negatives: { ...state.negatives, items: nextItems },
        ui: { ...state.ui, markedRowIds: nextMarked },
      };
    }

    case "REMOVE_NEGATIVE": {
      const { id } = action.payload;
      const removed = state.negatives.items.find((x) => x.id === id);
      const nextItems = state.negatives.items.filter((x) => x.id !== id);

      const nextMarked = new Set(state.ui.markedRowIds);
      if (removed) {
        state.report.rows.forEach((r) => {
          if (
            (r.searchTerm || "").trim().toLowerCase() ===
            removed.text.trim().toLowerCase()
          ) {
            nextMarked.delete(r.__rowId);
          }
        });
      }

      return {
        ...state,
        negatives: { ...state.negatives, items: nextItems },
        ui: { ...state.ui, markedRowIds: nextMarked },
      };
    }

    case "UPDATE_NEGATIVE_MATCH_TYPE": {
      const { id, matchType } = action.payload;
      const nextItems = state.negatives.items.map((x) =>
        x.id === id ? { ...x, matchType } : x
      );
      return { ...state, negatives: { ...state.negatives, items: nextItems } };
    }

    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Map for quick lookup by text
  const negativeMap = useMemo(() => {
    const map = new Map();
    for (const item of state.negatives.items) {
      map.set(item.text.trim().toLowerCase(), item);
    }
    return map;
  }, [state.negatives.items]);

  const formattedNegatives = useMemo(() => {
    return state.negatives.items.map((x) => formatNegative(x.text, x.matchType));
  }, [state.negatives.items]);

  async function handleFile(file) {
    const parsed = await parseSearchTermsCsv(file);
    dispatch({
      type: "REPORT_LOADED",
      payload: { ...parsed, filename: file.name },
    });
  }

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <div className="title">Google Ads UI Extender (Prototype)</div>
          <div className="subtitle">
            Upload Search Terms report → collect negative keywords.
          </div>
        </div>
      </header>

      <div className="grid">
        <section className="panel panel-blue">
          <div className="panelTitle">Google Ads UI</div>

          <UploadPanel onFile={handleFile} filename={state.report.filename} />

          <ReportTable
            columns={state.report.columns}
            rows={state.report.rows}
            searchTermColumnName={state.report.searchTermColumnName}
            markedRowIds={state.ui.markedRowIds}
            negativeMap={negativeMap}
            onAddFullTerm={(text, rowId) =>
              dispatch({
                type: "ADD_NEGATIVE",
                payload: {
                  text,
                  rowId,
                  markRow: true,
                  matchType: "exact", // ✅ full phrase default → exact
                },
              })
            }
            onRemoveFullTerm={(text, rowId) =>
              dispatch({
                type: "REMOVE_NEGATIVE_BY_TEXT",
                payload: { text, rowId, unmarkRow: true },
              })
            }
            onToggleWord={(text) => {
              const key = String(text || "").trim().toLowerCase();
              if (!key) return;

              if (negativeMap.has(key)) {
                dispatch({
                  type: "REMOVE_NEGATIVE_BY_TEXT",
                  payload: { text, unmarkRow: false },
                });
              } else {
                dispatch({
                  type: "ADD_NEGATIVE",
                  payload: {
                    text,
                    markRow: false,
                    matchType: "broad", // ✅ single word default → broad
                  },
                });
              }
            }}
          />
        </section>

        <section className="panel panel-yellow">
          <div className="panelTitle">Extension UI</div>

          <div className="stickyWrap">
            <NegativePanel
              items={state.negatives.items}
              formattedLines={formattedNegatives}
              onRemove={(id) =>
                dispatch({ type: "REMOVE_NEGATIVE", payload: { id } })
              }
              onChangeMatchType={(id, matchType) =>
                dispatch({
                  type: "UPDATE_NEGATIVE_MATCH_TYPE",
                  payload: { id, matchType },
                })
              }
            />
          </div>
        </section>
      </div>
    </div>
  );
}


