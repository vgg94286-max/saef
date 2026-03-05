import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    // Call the PostgreSQL function we created
    const visits = await sql`SELECT * FROM public.get_all_visit_requests()`;

    return NextResponse.json(visits);
  } catch (error) {
    console.error("Error fetching visit requests:", error);
    return NextResponse.json(
      { error: "فشل في جلب طلبات الزيارة" },
      { status: 500 }
    );
  }
}