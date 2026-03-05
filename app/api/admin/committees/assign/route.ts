import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

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
    // Use a transaction to ensure atomicity
    await sql.begin(async (tx) => {
      // Create committee
      const [committee] = await tx`
        INSERT INTO public.committees (visit_request_id, status, created_at)
        VALUES (${visit_request_id}, 'بانتظار زيارة اللجنة', NOW())
        RETURNING committee_id
      `;
      const committeeId = committee.committee_id;

      // Add leader
      await tx`
        INSERT INTO public.committee_members (committee_id, user_id, role)
        VALUES (${committeeId}, ${leader_user_id}, 'رئيس')
      `;

      // Add members in a single query
      if (member_user_ids.length > 0) {
        await tx`
    INSERT INTO public.committee_members (committee_id, user_id, role)
    VALUES ${sql(member_user_ids.map(userId => [committeeId, userId, 'عضو']))}
  `;
      }

      // Update visit request status
      await tx`
        UPDATE public.visit_requests
        SET status = 'قيد المراجعة'
        WHERE visit_id = ${visit_request_id}
      `;

      return committeeId;
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