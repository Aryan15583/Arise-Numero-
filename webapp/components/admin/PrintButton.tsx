"use client";

export function PrintButton() {
  return (
    <button type="button" className="no-print" onClick={() => window.print()} style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid #b8975a", background: "#b8975a", color: "#1a1228", fontWeight: 700, cursor: "pointer" }}>
      🖨 Print / Save as PDF
    </button>
  );
}
