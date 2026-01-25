import React, { useRef } from "react";

export default function UploadPanel({ onFile, filename }) {
  const inputRef = useRef(null);

  return (
    <div className="card">
      <div className="cardRow">
        <div>
          <div className="cardTitle">1) Upload Search Terms report (CSV)</div>
          <div className="cardHint">
            Export from Google Ads → Search terms → Download.
          </div>
          {filename ? <div className="pill">Loaded: {filename}</div> : null}
        </div>

        <div className="actions">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
            }}
          />
          <button className="btn" onClick={() => inputRef.current?.click()}>
            Choose CSV
          </button>
        </div>
      </div>
    </div>
  );
}
