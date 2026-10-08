// Shared artwork for the generated app icons (gold diamond on the brand purple).
export function BrandIcon({ size }: { size: number }) {
  const mark = Math.round(size * 0.34);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1a1228 0%, #2d1f4a 100%)",
      }}
    >
      <div style={{ width: mark, height: mark, background: "#d4b47a", transform: "rotate(45deg)", display: "flex" }} />
    </div>
  );
}
