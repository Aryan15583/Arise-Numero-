import { ImageResponse } from "next/og";
import { BrandIcon } from "@/components/BrandIcon";

// 512×512 app icon — used by the web app manifest (Android "Add to Home screen").
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<BrandIcon size={512} />, size);
}
