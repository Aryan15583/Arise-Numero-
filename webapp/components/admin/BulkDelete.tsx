"use client";

import { useState } from "react";
import { adminFetchJson } from "@/lib/admin-api";

// "Delete" button for admin lists: pressing it shows a tick box on every row,
// you tick the rows you want, then confirm. Used by every admin table.

export type BulkSelect<T> = {
  active: boolean;
  start: () => void;
  stop: () => void;
  isSelected: (item: T) => boolean;
  toggle: (item: T) => void;
  toggleAll: () => void;
  allSelected: boolean;
  /** Ticked rows that are still on the current page. */
  selectedItems: T[];
};

export function useBulkSelect<T>(items: T[], idOf: (item: T) => string): BulkSelect<T> {
  const [active, setActive] = useState(false);
  const [ids, setIds] = useState<Set<string>>(new Set());
  const selectedItems = items.filter((i) => ids.has(idOf(i)));
  const allSelected = items.length > 0 && selectedItems.length === items.length;
  return {
    active,
    start: () => setActive(true),
    stop: () => {
      setActive(false);
      setIds(new Set());
    },
    isSelected: (item) => ids.has(idOf(item)),
    toggle: (item) =>
      setIds((prev) => {
        const next = new Set(prev);
        const id = idOf(item);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    toggleAll: () => setIds(allSelected ? new Set() : new Set(items.map(idOf))),
    allSelected,
    selectedItems,
  };
}

/** The button above the list. Becomes "Delete selected / Cancel" while choosing. */
export function BulkDeleteBar<T>({ bulk, noun, onDelete }: { bulk: BulkSelect<T>; noun: string; onDelete: (items: T[]) => void }) {
  if (!bulk.active) {
    return (
      <button type="button" className="btn btn-outline-danger" onClick={bulk.start}>
        🗑 Delete…
      </button>
    );
  }
  const n = bulk.selectedItems.length;
  return (
    <div className="bulk-bar" role="group" aria-label={`Delete ${noun}s`}>
      <span className="bulk-bar-hint">{n === 0 ? `Tick the ${noun}s to delete` : `${n} selected`}</span>
      <button type="button" className="btn btn-danger" disabled={n === 0} onClick={() => onDelete(bulk.selectedItems)}>
        Delete{n > 0 ? ` (${n})` : ""}
      </button>
      <button type="button" className="btn btn-ghost" onClick={bulk.stop}>Cancel</button>
    </div>
  );
}

/** Header cell with a "select all on this page" box (only while choosing). */
export function SelectAllCell<T>({ bulk }: { bulk: BulkSelect<T> }) {
  if (!bulk.active) return null;
  return (
    <th className="select-cell">
      <input type="checkbox" aria-label="Select all on this page" checked={bulk.allSelected} onChange={bulk.toggleAll} />
    </th>
  );
}

/** Row cell with the item's box (only while choosing). */
export function SelectCell<T>({ bulk, item, label }: { bulk: BulkSelect<T>; item: T; label: string }) {
  if (!bulk.active) return null;
  return (
    <td className="select-cell">
      <input type="checkbox" aria-label={`Select ${label}`} checked={bulk.isSelected(item)} onChange={() => bulk.toggle(item)} />
    </td>
  );
}

/** Confirmation box shown before anything is deleted. */
export function ConfirmDeleteModal({
  title,
  children,
  busy,
  onConfirm,
  onClose,
}: {
  title: string;
  children?: React.ReactNode;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="modal" style={{ maxWidth: 460 }} role="alertdialog" aria-labelledby="confirm-delete-title">
        <div className="modal-header">
          <span className="modal-title" id="confirm-delete-title">{title}</span>
          <button className="modal-close" onClick={onClose} disabled={busy}>✕</button>
        </div>
        <div className="modal-body" style={{ display: "grid", gap: 12, fontSize: "0.9rem" }}>
          {children}
          <p><strong>This can&apos;t be undone.</strong></p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Keep</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={busy}>{busy ? "Deleting…" : "Delete permanently"}</button>
        </div>
      </div>
    </div>
  );
}

/**
 * Deletes items one by one through their existing DELETE endpoints and
 * reports how many succeeded, so one failure doesn't hide the rest.
 */
export async function deleteEach(urls: string[]): Promise<{ deleted: number; failed: number; firstError?: string }> {
  let deleted = 0;
  let failed = 0;
  let firstError: string | undefined;
  for (const url of urls) {
    try {
      await adminFetchJson(url, { method: "DELETE" });
      deleted++;
    } catch (err) {
      failed++;
      firstError ??= err instanceof Error ? err.message : "Could not delete.";
    }
  }
  return { deleted, failed, firstError };
}

/** A generic delete flow for pages whose items each have a DELETE endpoint. */
export function useBulkDelete<T>(opts: {
  items: T[];
  idOf: (item: T) => string;
  urlOf: (item: T) => string;
  noun: string;
  onDone: () => void;
  showToast: (msg: string, type?: "success" | "error") => void;
}) {
  const bulk = useBulkSelect(opts.items, opts.idOf);
  const [confirming, setConfirming] = useState<T[] | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!confirming) return;
    setBusy(true);
    const { deleted, failed, firstError } = await deleteEach(confirming.map(opts.urlOf));
    setBusy(false);
    setConfirming(null);
    bulk.stop();
    if (deleted) opts.showToast(`Deleted ${deleted} ${opts.noun}${deleted === 1 ? "" : "s"}.`);
    if (failed) opts.showToast(`${failed} could not be deleted: ${firstError}`, "error");
    opts.onDone();
  }

  const n = confirming?.length ?? 0;
  const modal = confirming ? (
    <ConfirmDeleteModal
      title={`Delete ${n === 1 ? `this ${opts.noun}` : `${n} ${opts.noun}s`}?`}
      busy={busy}
      onConfirm={run}
      onClose={() => setConfirming(null)}
    />
  ) : null;

  return { bulk, bar: <BulkDeleteBar bulk={bulk} noun={opts.noun} onDelete={setConfirming} />, modal, confirmDelete: setConfirming };
}
