import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await sql`
      UPDATE public.leave_request
      SET req_status = 'مرفوض'
      WHERE request_id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error rejecting leave request:", error);
    return NextResponse.json(
      { error: "فشل في رفض الطلب" },
      { status: 500 }
    );
  }
}