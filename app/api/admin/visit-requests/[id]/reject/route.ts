import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await sql`
      UPDATE visit_requests 
      SET status = 'مرفوض' 
      WHERE visit_id = ${id}
    `;
     const club_id = await sql`
          SELECT club_id FROM visit_requests WHERE visit_id = ${id}
        `;
        
        await sql`
          UPDATE clubs
          SET account_status = 'معطل'
          WHERE club_id = ${club_id[0].club_id}
        `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error rejecting visit request:", error);
    return NextResponse.json(
      { error: "فشل في رفض الطلب" },
      { status: 500 }
    );
  }
}