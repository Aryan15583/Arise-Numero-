import { prisma } from "./db";

const SESSION_VERSION_KEY = "admin_session_version";

export async function getSessionVersion(): Promise<number> {
  const row = await prisma.adminSetting.findUnique({ where: { key: SESSION_VERSION_KEY } });
  const parsed = row ? parseInt(row.value, 10) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Bumps the version, which invalidates every previously issued admin JWT. */
export async function bumpSessionVersion(): Promise<number> {
  const next = (await getSessionVersion()) + 1;
  await prisma.adminSetting.upsert({
    where: { key: SESSION_VERSION_KEY },
    update: { value: String(next) },
    create: { key: SESSION_VERSION_KEY, value: String(next) },
  });
  return next;
}
