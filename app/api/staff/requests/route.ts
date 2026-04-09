import { NextResponse } from "next/server";
import { sql } from "@/lib/db";



export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "user_id مطلوب" }, { status: 400 });
  }

  try {

    const staffInfo = await sql`SELECT status FROM public.staff WHERE user_id = ${userId} LIMIT 1`;
    
    if (staffInfo.length === 0) {
        return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    if (staffInfo[0].status === 'معطل') {
        return NextResponse.json({ status: 'معطل' }, { status: 403 });
    }
   
    const permissionsResult = await sql`
      SELECT * FROM get_user_permissions(${userId})
    `;

    const perms = permissionsResult.map(p => p.perm_name);

    const data: any = {
      permissions: perms,
      visit_requests: [],
      leave_requests: [],
      championships: [],
      cert_requests: [],
      no_obj_requests: [],
      
    };


    if (perms.includes('view_visit_requests')) {
      data.visit_requests = await sql`SELECT * FROM public.get_all_visit_requests_for_staff()`;
    }

    if (perms.includes('view_leave_requests')) {
      data.leave_requests = await sql`SELECT * FROM public.get_all_leave_requests_for_staff()`;
    }

    if (perms.includes('view_championships')) {
      data.championships = await sql`SELECT * FROM public.get_all_championships()`;
    }

    if (perms.includes('view_request_cert')) {
      data.cert_requests = await sql`SELECT * FROM public.get_all_cert_requests()`;
    }

    if (perms.includes('view_no_objection')) {
      data.no_obj_requests = await sql`SELECT * FROM public.get_all_no_obj_requests()`;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching staff requests:", error);
    return NextResponse.json({ error: "فشل في جلب الطلبات" }, { status: 500 });
  }
}