import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { StaffJWTPayload } from "@/types/auth"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, staffName } = body

    if (!email || !password || !staffName) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 })
    }



    const domain = email?.split("@")[1]

    if (domain !== "saef.org.sa") {
      return NextResponse.json(
        { error: "يجب استخدام بريد saef.org.sa فقط" },
        { status: 400 }
      )
    }


    const existing = await sql`
      SELECT user_id FROM public.users WHERE email = ${email} AND role = 'staff' AND is_verified = true
    `

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "المستخدم موجود مسبقاً" },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)


    const result = await sql.begin(async (tx) => {
      await tx` 
      update public.users set is_verified = true where email = ${email} and role = 'staff'`

      const userRes = await tx`
        update public.users set password_hash = ${passwordHash} where email = ${email} and role = 'staff'
        RETURNING user_id
      `

      const userId = userRes[0].user_id

      const staffRes = await tx`
        INSERT INTO public.staff (user_id, staff_name)
        VALUES (${userId}, ${staffName})
        RETURNING staff_id , staff_name

      `

      return { userId, staffRes: staffRes[0] }
    })

    const payload: StaffJWTPayload = {
      user_id: result.userId,
      role: "staff",
      staff_name: result.staffRes.staff_name,
      staff_id: result.staffRes.staff_id

    };

    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });



    const res = NextResponse.json({
      success: true,
      userId: result,
    })
    res.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "فشلت عملية إنشاء المستخدم" }, { status: 500 })
  }
}