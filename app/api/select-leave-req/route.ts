// app/api/leave-requests/route.ts
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session"; 
import { AppJWTPayload } from "@/types/auth"; 

export async function GET(req: Request) {
  try {
    const session = (await getSession()) as AppJWTPayload | null;

    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    // Role check
    if (session.role !== "requester") {
      return NextResponse.json({ error: "غير مصرح لهذا الدور" }, { status: 403 });
    }

    const userId = session.user_id;

    // Fetch from 3 tables concurrently
    const [leaveRequests, noObjRequests, certRequests] = await Promise.all([
      // 1. Leave Requests
      sql`
        SELECT * FROM public.leave_request 
        WHERE user_id = ${userId} 
        ORDER BY created_at DESC
      `,
      // 2. No Objection Requests
      sql`
        SELECT * FROM public.request_no_obj 
        WHERE user_id = ${userId} 
        ORDER BY created_at DESC
      `,
      // 3. Certificate Requests
      sql`
        SELECT * FROM public.request_cert 
        WHERE user_id = ${userId} 
        ORDER BY created_at DESC
      `
    ]);

    return NextResponse.json({ 
      leaveRequests, 
      noObjRequests, 
      certRequests 
    });

  } catch (err: any) {
    console.error("Error fetching multi-table requests:", err);
    return NextResponse.json(
      { error: err.message || "حدث خطأ أثناء جلب البيانات" },
      { status: 500 }
    );
  }
}