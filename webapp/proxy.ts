import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/auth";

// Protects every /admin page (not the API routes, which check for
// themselves via requireAdmin — this only guards the React pages so an
// unauthenticated visitor is bounced to the login screen before any admin
// UI ever renders). Server-rendered admin pages that show personal data
// additionally call requireAdminPage(), because this only checks the cookie's
// signature, not whether the session has since been revoked.
//
// (Next.js 16 renamed the "middleware" file convention to "proxy".)
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/admin/login") return NextResponse.next();

  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const valid = await verifyAdminToken(token);

  if (!valid) {
    const loginUrl = new URL("/admin/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
