import { NextResponse } from "next/server";
import { sql, withTransaction } from "@/lib/db";

export async function POST(req: Request) {
  const { visit_request_id, leader_user_id, member_user_ids } = await req.json();

  if (!visit_request_id || !leader_user_id || !Array.isArray(member_user_ids)) {
    return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 });
  }

  const existingCommitteeForVisit = await sql`
    SELECT committee_id FROM public.committees WHERE visit_request_id = ${visit_request_id} AND status = 'بانتظار زيارة اللجنة'
  `;

  if (existingCommitteeForVisit.length > 0) {
    return NextResponse.json(
      { error: "تم تعيين لجنة لهذا الطلب بالفعل" },
      { status: 400 }
    );
  }
  try {
    await withTransaction(async (client) => {
  // Check existing
  const existing = await client.query(
    `SELECT committee_id FROM public.committees 
     WHERE visit_request_id = $1 AND status = 'بانتظار زيارة اللجنة'`,
    [visit_request_id]
  );

  if (existing.rows.length > 0) {
    throw new Error("ALREADY_EXISTS");
  }

  // Create committee
  const committeeRes = await client.query(
    `INSERT INTO public.committees (visit_request_id, status, created_at)
     VALUES ($1, 'بانتظار زيارة اللجنة', NOW())
     RETURNING committee_id`,
    [visit_request_id]
  );

  const committeeId = committeeRes.rows[0].committee_id;

  // Add leader
  await client.query(
    `INSERT INTO public.committee_members (committee_id, user_id, role)
     VALUES ($1, $2, 'رئيس')`,
    [committeeId, leader_user_id]
  );

  // ✅ Add members in ONE query
  if (member_user_ids.length > 0) {
    const values: any[] = [];
    const placeholders: string[] = [];

    member_user_ids.forEach((userId, index) => {
      const baseIndex = index * 3;
      placeholders.push(
        `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3})`
      );
      values.push(committeeId, userId, "عضو");
    });

    await client.query(
      `INSERT INTO public.committee_members (committee_id, user_id, role)
       VALUES ${placeholders.join(", ")}`,
      values
    );
  }

  // Update visit request
  await client.query(
    `UPDATE public.visit_requests
     SET status = 'قيد المراجعة'
     WHERE visit_id = $1`,
    [visit_request_id]
  );
});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error assigning committee:", error);
    return NextResponse.json(
      { error: "فشل في تعيين اللجنة" },
      { status: 500 }
    );
  }
}