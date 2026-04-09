import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const championships = await sql`SELECT champ_id, champ_name FROM public.public_champ ORDER BY champ_name ASC`;
    return NextResponse.json(championships);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch championships" }, { status: 500 });
  }
}