import { NextResponse } from "next/server";
import {sql} from "@/lib/db";

export async function GET() {
  try {
    const  rows  = await sql`
      SELECT * FROM get_all_leave_requests()
    `;

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    return NextResponse.json(
      { error: "فشل في جلب طلبات التفرغ" },
      { status: 500 }
    );
  }
}