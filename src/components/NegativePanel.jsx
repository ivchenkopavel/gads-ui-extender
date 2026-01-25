import React from "react";
import MatchTypeSelect from "./MatchTypeSelect.jsx";

export default function NegativePanel({
  items,
  formattedLines,
  onRemove,
  onChangeMatchType,
}) {
  async function copyToClipboard() {
    const text = formattedLines.filter(Boolean).join("\n");
    await navigator.clipboard.writeText(text);
    alert("Copied to clipboard ✅");
  }

  return (
    <div className="card stickyCard">
      <div className="cardRow">
        <div>
          <div className="cardTitle">Negative keywords</div>
          <div className="cardHint">
            Defaults: <b>full term → exact</b>, <b>word → broad</b>. You can change each item.
          </div>
        </div>

        <div className="actions">
          <button className="btn" onClick={copyToClipboard} disabled={!items.length}>
            Copy list
          </button>
        </div>
      </div>

      {!items.length ? (
        <div className="empty">No negatives yet. Add some from the table.</div>
      ) : (
        <div className="negList">
          {items.map((x, idx) => (
            <div key={x.id} className="negItem negItemRed">
              <div className="negLeft">
                <div className="mono">{formattedLines[idx]}</div>
                <div className="subSmall">raw: {x.text}</div>
              </div>

              <div className="negRight">
                <MatchTypeSelect
                  value={x.matchType}
                  onChange={(v) => onChangeMatchType(x.id, v)}
                  size="sm"
                />
                <button className="iconBtn danger" onClick={() => onRemove(x.id)}>
                  x
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


