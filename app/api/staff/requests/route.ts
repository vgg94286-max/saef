import { NextResponse } from "next/server";
import {sql} from "@/lib/db";

// GET /api/staff/requests?user_id=<staff_user_id>
// Returns all visit, leave, and championship requests viewable by this staff member
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "user_id مطلوب" }, { status: 400 });
  }

  try {
    // Visit requests
    const visitRequests  = await sql`
      select * from get_all_visit_requests_for_staff()
    `;

    // Leave requests
    const leaveRequests  = await sql`
      select * from get_all_leave_requests_for_staff()
    `;

    // Championship requests
    const championships  = await sql`
      select * from get_all_championships()
    `;
      

    return NextResponse.json({
      visit_requests: visitRequests,
      leave_requests: leaveRequests,
      championships,
    });
  } catch (error) {
    console.error("Error fetching staff requests:", error);
    return NextResponse.json(
      { error: "فشل في جلب الطلبات" },
      { status: 500 }
    );
  }
}
