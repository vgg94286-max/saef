import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    // Call the PostgreSQL function get_all_staff()
    const staff = await sql`
      SELECT * FROM public.get_all_staff()
    `;

    return NextResponse.json(staff);
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { error: "فشل في جلب الموظفين" },
      { status: 500 }
    );
  }
}