import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    // Call the PostgreSQL function directly
    const committees = await sql`
      SELECT * FROM get_committees_with_club()
    `;

    return NextResponse.json(committees);
  } catch (error) {
    console.error("Error fetching committees:", error);
    return NextResponse.json(
      { error: "فشل في جلب اللجان" },
      { status: 500 }
    );
  }
}