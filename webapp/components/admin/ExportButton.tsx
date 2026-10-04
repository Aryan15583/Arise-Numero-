// A file download, not a page navigation — so a plain <a download> (not next/link) is correct.
export function ExportButton({ type }: { type: "orders" | "bookings" | "messages" | "subscribers" }) {
  return (
    <a className="btn btn-outline" href={`/api/admin/export/${type}`} download>
      ⬇ Export CSV
    </a>
  );
}
