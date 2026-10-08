"use client";

import { useRef, useState } from "react";

const MAX_IMAGES = 4;
const MAX_EDGE = 1600; // px — plenty for a 2× zoom on the product page
const MAX_BYTES = 4 * 1024 * 1024; // after resizing; matches the server limit

// Shrinks big phone photos before upload so pages stay fast. Falls back to the
// original file if the browser can't decode it (the server still validates it).
async function prepareImage(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= 1.5 * 1024 * 1024) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff"; // JPEG has no transparency — put see-through areas on white
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    // JPEG keeps photos small (a 1600px PNG can be several MB).
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

async function uploadOne(file: File): Promise<string> {
  const body = new FormData();
  const prepared = await prepareImage(file);
  if (prepared.size > MAX_BYTES) throw new Error(`"${file.name}" is still over 4 MB after resizing — try a smaller photo.`);
  body.append("file", prepared, prepared === file ? file.name : file.name.replace(/\.\w+$/, "") + ".jpg");
  const res = await fetch("/api/admin/uploads", { method: "POST", body });
  if (res.status === 401) {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/admin/login";
    throw new Error("Session expired. Please log in again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Upload failed.");
  return data.url as string;
}

/**
 * Up to 4 product images. The first one is the main image used on product
 * cards and as the first photo on the product page.
 */
export function ProductImageManager({
  images,
  onChange,
  onError,
}: {
  images: string[];
  onChange: (update: (prev: string[]) => string[]) => void;
  onError: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [urlInput, setUrlInput] = useState("");
  const slotsLeft = MAX_IMAGES - images.length - uploading;

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const files = Array.from(list);
    if (files.length > slotsLeft) {
      onError(`You can add ${slotsLeft} more image${slotsLeft === 1 ? "" : "s"} (max ${MAX_IMAGES} per product).`);
    }
    const accepted = files.slice(0, Math.max(0, slotsLeft)).filter((f) => {
      if (!/^image\/(jpeg|png|webp)$/.test(f.type)) {
        onError(`"${f.name}" isn't a JPEG, PNG or WebP image.`);
        return false;
      }
      if (f.size > MAX_BYTES * 4) {
        onError(`"${f.name}" is too large.`);
        return false;
      }
      return true;
    });
    if (inputRef.current) inputRef.current.value = "";
    if (accepted.length === 0) return;

    setUploading((n) => n + accepted.length);
    for (const file of accepted) {
      try {
        const url = await uploadOne(file);
        onChange((prev) => [...prev, url].slice(0, MAX_IMAGES));
      } catch (err) {
        onError(err instanceof Error ? err.message : `Could not upload "${file.name}".`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  function move(i: number, dir: -1 | 1) {
    onChange((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function makeMain(i: number) {
    onChange((prev) => [prev[i], ...prev.filter((_, k) => k !== i)]);
  }

  function addUrl() {
    const url = urlInput.trim();
    if (!url) return;
    if (!(url.startsWith("/") && !url.startsWith("//")) && !/^https:\/\/\S+$/.test(url)) {
      onError("Use a site path like /assets/products/x.jpg or a full https:// URL.");
      return;
    }
    if (images.length >= MAX_IMAGES) {
      onError(`A product can have at most ${MAX_IMAGES} images.`);
      return;
    }
    onChange((prev) => [...prev, url].slice(0, MAX_IMAGES));
    setUrlInput("");
  }

  return (
    <div className="img-manager">
      <div className="img-manager-grid">
        {images.map((src, i) => (
          <div className={`img-tile ${i === 0 ? "is-main" : ""}`} key={`${src}-${i}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Product image ${i + 1}`} />
            {i === 0 ? <span className="img-tile-badge">Main</span> : (
              <button type="button" className="img-tile-badge img-tile-badge--btn" onClick={() => makeMain(i)}>Set as main</button>
            )}
            <div className="img-tile-actions">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move image ${i + 1} left`}>←</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label={`Move image ${i + 1} right`}>→</button>
              <button type="button" className="img-tile-remove" onClick={() => onChange((prev) => prev.filter((_, k) => k !== i))} aria-label={`Remove image ${i + 1}`}>✕</button>
            </div>
          </div>
        ))}
        {Array.from({ length: uploading }).map((_, i) => (
          <div className="img-tile img-tile--loading" key={`up-${i}`}><span>Uploading…</span></div>
        ))}
        {slotsLeft > 0 && (
          <button type="button" className="img-tile img-tile--add" onClick={() => inputRef.current?.click()}>
            <span className="img-tile-plus" aria-hidden="true">+</span>
            <span>Upload image</span>
            <small>{slotsLeft} of {MAX_IMAGES} left</small>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="img-manager-url">
        <input
          className="form-input"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addUrl();
            }
          }}
          placeholder="…or add by URL: /assets/products/x.jpg or https://…"
          disabled={images.length >= MAX_IMAGES}
        />
        <button type="button" className="btn btn-sm btn-outline" onClick={addUrl} disabled={images.length >= MAX_IMAGES}>Add</button>
      </div>
      <p className="form-hint">
        Up to {MAX_IMAGES} images — JPEG, PNG or WebP. The first image is the main photo on the shop and product page.
        Square photos around 1200×1200 look best; large photos are resized automatically.
      </p>
    </div>
  );
}
