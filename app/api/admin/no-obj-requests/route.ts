import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const rows = await sql`
      SELECT * FROM public.get_all_no_obj_requests()
    `;

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching no-objection requests:", error);
    return NextResponse.json(
      { error: "فشل في جلب طلبات عدم الممانعة" },
      { status: 500 }
    );
  }
}