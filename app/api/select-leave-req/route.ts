// app/api/leave-requests/route.ts
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session"; 
import {AppJWTPayload } from "@/types/auth"; 

export async function GET(req: Request) {
  try {
    // Get session
    const session = (await getSession()) as AppJWTPayload | null;

    if (!session) {
      return NextResponse.json({ error: "غير مصرح"}, { status: 401 });
    }

    //  Ensure user is a leave requester
    if (session.role !== "leave_requester") {
      return NextResponse.json({ error: "غير مصرح لهذا الدور" }, { status: 403 });
    }

    const userId = session.user_id;

    // Fetch leave requests for this user only
    const leaveRequests = await sql`
      SELECT
        full_name,
        national_id,
        employer,
        email,
        phone,
        height_cm,
        weight_kg,
        salary,
        marital_status,
        national_address,
        req_status,
        created_at
      FROM leave_request
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ leaveRequests });
  } catch (err: any) {
    console.error("Error fetching leave requests:", err);
    return NextResponse.json(
      { error: err.message || "حدث خطأ أثناء جلب البيانات" },
      { status: 500 }
    );
  }
}