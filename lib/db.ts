import postgres, { Sql } from "postgres";

export const sql: Sql = postgres(process.env.DATABASE_URL!);