import { permanentRedirect, redirect } from "next/navigation";
import { productPath } from "@/lib/seo";

// Old URL shape (/product?id=amethyst-8mm) → clean URL (/product/amethyst-8mm).
// A permanent redirect hands any ranking/links the old URL earned to the new one.
export default async function LegacyProductRedirect({
  searchParams,
}: {
  searchParams: Promise<{ id?: string | string[] }>;
}) {
  const { id } = await searchParams;
  const value = Array.isArray(id) ? id[0] : id;
  if (value) permanentRedirect(productPath(value));
  redirect("/shop");
}
