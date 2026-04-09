import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { note } = await _req.json();

    if (!note) {
      return NextResponse.json({ error: "سبب الرفض مطلوب" }, { status: 400 });
    }

    await sql`
      UPDATE public.request_no_obj
      SET req_status = 'مرفوض' , note = ${note}
      WHERE request_id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error rejecting no-objection request:", error);
    return NextResponse.json(
      { error: "فشل في رفض الطلب" },
      { status: 500 }
    );
  }
}