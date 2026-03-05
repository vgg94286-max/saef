import { sql } from "@/lib/db";
import { NextResponse } from "next/server";


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, role } = body;
    

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }
    const existing = await sql`
  SELECT user_id FROM public.users WHERE email = ${email} AND role = ${role} AND is_verified = true
  
`


  if (existing.length === 0) {
  
    return NextResponse.json(
      { error: "البريد الإلكتروني غير مسجل " },
      { status: 400 }
    )
}
    

    return NextResponse.json({ userId: existing[0].user_id });
  } catch (err: any) {
    console.error("فشل في التحقق من المستخدم:", err);

    return NextResponse.json({ error: "فشل في إنشاء المستخدم" }, { status: 500 });
  }
}