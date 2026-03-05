import postgres, { Sql } from "postgres";

export const sql: Sql = postgres(process.env.NEON_URL!, {
  ssl: 'require',
  connect_timeout: 30,
  // This forces the session to use UTF8 for Arabic support
  onparameter: (name, value) => {
    if (name === 'client_encoding') return 'UTF8';
  }
});