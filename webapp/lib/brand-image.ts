import { readFile } from "node:fs/promises";
import path from "node:path";

// The logo seal as a data URL, for generated images (link previews) that
// can't fetch files from the site while rendering.
export async function logoSealDataUrl(): Promise<string> {
  const file = await readFile(path.join(process.cwd(), "public/assets/brand/logo-badge-160.png"));
  return `data:image/png;base64,${file.toString("base64")}`;
}
