import nextEnv from "@next/env";

// Load .env / .env.local (DATABASE_URL, BETTER_AUTH_SECRET, …) the way Next does,
// and allow sign-up for this seed run BEFORE importing the auth instance (auth.ts
// reads BETTER_AUTH_ALLOW_SIGNUP at module init to toggle disableSignUp).
nextEnv.loadEnvConfig(process.cwd());
process.env.BETTER_AUTH_ALLOW_SIGNUP = "true";

const ADMIN_NAME = process.env.ADMIN_NAME ?? "Admin";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function main() {
  if (!process.env.DATABASE_URL || !process.env.BETTER_AUTH_SECRET) {
    console.error(
      "DATABASE_URL and BETTER_AUTH_SECRET must be set in apps/web/.env before seeding.",
    );
    process.exit(1);
  }

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be set in apps/web/.env before seeding. " +
        "Choose a strong, unique password — this is the single admin account.",
    );
    process.exit(1);
  }

  // 1. Ensure Better Auth tables exist in PostgreSQL
  const { Pool } = await import("pg");
  const directPool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await directPool.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL UNIQUE,
        "emailVerified" BOOLEAN NOT NULL DEFAULT false,
        "image" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS "session" (
        "id" TEXT PRIMARY KEY,
        "expiresAt" TIMESTAMP NOT NULL,
        "token" TEXT NOT NULL UNIQUE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS "account" (
        "id" TEXT PRIMARY KEY,
        "accountId" TEXT NOT NULL,
        "providerId" TEXT NOT NULL,
        "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "accessToken" TEXT,
        "refreshToken" TEXT,
        "idToken" TEXT,
        "accessTokenExpiresAt" TIMESTAMP,
        "refreshTokenExpiresAt" TIMESTAMP,
        "scope" TEXT,
        "password" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS "verification" (
        "id" TEXT PRIMARY KEY,
        "identifier" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Verified / created Better Auth tables (user, session, account, verification).");

    // Clean up any stale user records for admin emails
    const emailsToSeed = [ADMIN_EMAIL, "reviewer@bytecare.com"].filter(Boolean) as string[];
    for (const em of emailsToSeed) {
      const existing = await directPool.query('SELECT id FROM "user" WHERE email = $1;', [em]);
      if (existing.rows.length > 0) {
        const userId = existing.rows[0].id;
        await directPool.query('DELETE FROM "account" WHERE "userId" = $1;', [userId]);
        await directPool.query('DELETE FROM "session" WHERE "userId" = $1;', [userId]);
        await directPool.query('DELETE FROM "user" WHERE id = $1;', [userId]);
        console.log(`Reset existing admin record: ${em}`);
      }
    }
  } catch (cleanErr) {
    console.warn("Could not check/clean existing user table:", cleanErr);
  } finally {
    await directPool.end();
  }

  const { auth } = await import("../lib/auth");

  const accounts = [
    { name: ADMIN_NAME, email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    { name: "StrategyByte Reviewer", email: "reviewer@bytecare.com", password: ADMIN_PASSWORD },
  ];

  for (const acc of accounts) {
    if (!acc.email) continue;
    try {
      await auth.api.signUpEmail({
        body: {
          name: acc.name,
          email: acc.email,
          password: acc.password,
        },
      });
      console.log(`Admin created successfully: ${acc.email}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (/exist|already/i.test(message)) {
        console.log(`Admin ${acc.email} ready.`);
      } else {
        console.error(`Sign-up error for ${acc.email}:`, message);
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
