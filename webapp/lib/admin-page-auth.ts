import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, decodeAdminToken } from "./auth";
import { getSessionVersion } from "./admin-session";

/**
 * Full admin check for server-rendered admin PAGES (the API routes use requireAdmin
 * instead). The proxy/middleware only verifies the cookie's signature — it can't
 * reach the database — so a session revoked via "Sign Out All Other Sessions"
 * would still pass it. Pages that render personal data must do this check too.
 */
export async function requireAdminPage(): Promise<void> {
  const token = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
  const payload = await decodeAdminToken(token);
  if (!payload || payload.v !== (await getSessionVersion())) redirect("/admin/login");
}
