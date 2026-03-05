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
  SELECT user_id, is_verified FROM users WHERE email = ${email}
`


    if (existing.length > 0) {
      if (existing[0].is_verified) {
        return NextResponse.json(
          { error: "البريد الإلكتروني مسجل مسبقاً" },
          { status: 400 }
        )
      } else {

        await sql` delete from users where email = ${email} and role = ${role} and is_verified = false`

      }
    }
    // Insert user
    const insertedUser = await sql`
      INSERT INTO users (email, role)
      VALUES (${email}, ${role})
      RETURNING user_id, email, role
    `;

    return NextResponse.json({ user: insertedUser[0] });
  } catch (err: any) {
    console.error("Error inserting user:", err);

    return NextResponse.json({ error: "فشل في إنشاء المستخدم" }, { status: 500 });
  }
}