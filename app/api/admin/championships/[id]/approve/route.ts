import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Update the championship status safely using parameter
    await sql`
      UPDATE public.championships
      SET status = 'تمت الموافقة'
      WHERE championships_id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error approving championship:", error);
    return NextResponse.json(
      { error: "فشل في قبول البطولة" },
      { status: 500 }
    );
  }
}