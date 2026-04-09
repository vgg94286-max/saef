import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await sql`
      UPDATE public.request_cert
      SET req_status = 'مقبول'
      WHERE request_id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error approving certification request:", error);
    return NextResponse.json(
      { error: "فشل في قبول الطلب" },
      { status: 500 }
    );
  }
}