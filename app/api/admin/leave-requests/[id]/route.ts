import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const leaveRequests = await sql`
      SELECT *
      FROM leave_request
      WHERE request_id = ${id}
    `;

    if (leaveRequests.length === 0) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    return NextResponse.json(leaveRequests[0]);
  } catch (error) {
    console.error("Error fetching leave request:", error);
    return NextResponse.json(
      { error: "فشل في جلب تفاصيل الطلب" },
      { status: 500 }
    );
  }
}