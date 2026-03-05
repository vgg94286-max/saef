import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    // Call the PostgreSQL function directly
    const visits = await sql`
      SELECT * FROM get_pending_visit_requests()
    `;

    return NextResponse.json(visits);
  } catch (error) {
    console.error("Error fetching pending visits:", error);
    return NextResponse.json(
      { error: "فشل في جلب الطلبات" },
      { status: 500 }
    );
  }
}