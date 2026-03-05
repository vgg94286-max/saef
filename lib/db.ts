import postgres, { Sql } from "postgres";

export const sql: Sql = postgres(process.env.NEON_URL!);