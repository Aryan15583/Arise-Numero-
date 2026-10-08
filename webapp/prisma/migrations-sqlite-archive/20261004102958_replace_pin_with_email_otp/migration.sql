-- CreateTable
CREATE TABLE "admin_login_codes" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'current',
    "code_hash" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- The hard-coded-PIN login is gone. Remove the old bcrypt PIN hash so a
-- 4-digit PIN (trivially crackable offline) doesn't linger in the database.
DELETE FROM "admin_settings" WHERE "key" = 'admin_pin_hash';
