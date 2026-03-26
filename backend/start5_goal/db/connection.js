import { Pool } from "pg";
import { createHttpError } from "../shared/errors.js";

let pool;

function buildPoolConfig() {
  const connectionString =
    String(process.env.START5_GOAL_DATABASE_URL || process.env.DATABASE_URL || "").trim();

  if (!connectionString) {
    throw createHttpError(
      500,
      "Defina START5_GOAL_DATABASE_URL ou DATABASE_URL para usar o backend Start5 Goal."
    );
  }

  return {
    connectionString,
    ssl: /^(1|true|yes|on)$/i.test(String(process.env.START5_GOAL_DATABASE_SSL || "").trim())
      ? { rejectUnauthorized: false }
      : undefined,
  };
}

export function getPgPool() {
  if (!pool) {
    pool = new Pool(buildPoolConfig());
  }

  return pool;
}

export async function query(text, params = []) {
  return getPgPool().query(text, params);
}

export async function withTransaction(callback) {
  const client = await getPgPool().connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
