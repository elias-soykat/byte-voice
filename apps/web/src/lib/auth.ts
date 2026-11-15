import { betterAuth } from "better-auth";
import { Pool } from "pg";

const globalForAuth = globalThis as unknown as {
  authPgPool?: Pool;
};

const pool =
  globalForAuth.authPgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes("localhost")
      ? false
      : { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") {
  globalForAuth.authPgPool = pool;
}

// Better Auth server instance. Uses its own Postgres pool against DATABASE_URL
// and manages the user/session/account/verification tables.
// Single-admin: public sign-up is disabled except when the seed script
// flips BETTER_AUTH_ALLOW_SIGNUP=true.
export const auth = betterAuth({
  database: pool,
  emailAndPassword: {
    enabled: true,
    disableSignUp: process.env.BETTER_AUTH_ALLOW_SIGNUP !== "true",
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});
