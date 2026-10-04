export type SocialLink = { label: string; href: string };

// Social/contact links come from environment variables, and only the ones that are
// actually set are shown — no more dead "#" links in the footer. Set any of:
//   NEXT_PUBLIC_INSTAGRAM_URL, NEXT_PUBLIC_FACEBOOK_URL, NEXT_PUBLIC_PINTEREST_URL
//   NEXT_PUBLIC_WHATSAPP_NUMBER  (digits with country code, e.g. 919876543210)
export function getSocialLinks(): SocialLink[] {
  const links: SocialLink[] = [];
  const add = (label: string, url: string | undefined) => {
    const value = url?.trim();
    if (value && /^https?:[/][/]/i.test(value)) links.push({ label, href: value });
  };
  add("Instagram", process.env.NEXT_PUBLIC_INSTAGRAM_URL);
  add("Facebook", process.env.NEXT_PUBLIC_FACEBOOK_URL);
  add("Pinterest", process.env.NEXT_PUBLIC_PINTEREST_URL);

  const whatsapp = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/[^0-9]/g, "");
  if (whatsapp.length >= 8) links.push({ label: "WhatsApp", href: `https://wa.me/${whatsapp}` });
  return links;
}
