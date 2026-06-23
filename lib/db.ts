
import { neon, Pool, type PoolClient } from "@neondatabase/serverless";


export const sql = neon(process.env.NEON_URL_TEST!);

function getPool() {
  return new Pool({
    connectionString: process.env.NEON_URL_TEST!,
  });
}


export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await fn(client);

    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end(); 
  }
}