import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const rows  = await sql`
      SELECT * FROM public.get_all_championships()
    `;

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching championships:", error);
    return NextResponse.json(
      { error: "فشل في جلب طلبات البطولات" },
      { status: 500 }
    );
  }
}