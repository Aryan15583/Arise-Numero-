"use client";

// Last-resort boundary: only used if the root layout itself crashes, so it can't
// rely on any site styles or components.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#1a1228", color: "#f0eafa", textAlign: "center", padding: "20vh 24px" }}>
        <h1 style={{ color: "#d4b47a" }}>Arise Numero</h1>
        <p>Something went wrong on our side. Please try again in a moment.</p>
        <button
          onClick={reset}
          style={{ marginTop: 16, padding: "10px 20px", borderRadius: 8, border: 0, background: "#b8975a", color: "#1a1228", fontWeight: 700, cursor: "pointer" }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
