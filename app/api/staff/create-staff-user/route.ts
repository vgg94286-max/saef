import { sql, withTransaction } from "@/lib/db"
import { NextResponse } from "next/server"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { StaffJWTPayload } from "@/types/auth"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, staffName, committee } = body

    if (!email || !password || !staffName || !committee) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة" },
        { status: 400 }
      )
    }

    const existing = await sql`
      SELECT user_id 
      FROM public.users 
      WHERE email = ${email} 
        AND role = 'staff' 
        AND is_verified = true
    `

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "المستخدم موجود مسبقاً" },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const result = await withTransaction(async (tx) => {

      const userRes = await tx.query(
        `UPDATE public.users
         SET is_verified = true,
             password_hash = $1
         WHERE email = $2 AND role = 'staff'
         RETURNING user_id`,
        [passwordHash, email]
      )

      if (userRes.rows.length === 0) {
        throw new Error("USER_NOT_FOUND")
      }

      const userId = userRes.rows[0].user_id

      const staffRes = await tx.query(
        `INSERT INTO public.staff (user_id, staff_name, b_committee)
         VALUES ($1, $2, $3)
         RETURNING staff_id, staff_name`,
        [userId, staffName, committee]
      )

      return {
        userId,
        staff: staffRes.rows[0],
      }
    })

    const payload: StaffJWTPayload = {
      user_id: result.userId,
      role: "staff",
      staff_name: result.staff.staff_name,
      staff_id: result.staff.staff_id,
      committee: result.staff.b_committee,
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    })

    const res = NextResponse.json({
      success: true,
      userId: result.userId,
    })

    res.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })

    return res

  } catch (err: any) {
    if (err.message === "USER_NOT_FOUND") {
      return NextResponse.json(
        { error: "المستخدم غير موجود" },
        { status: 404 }
      )
    }

    console.error(err)
    return NextResponse.json(
      { error: "فشلت عملية إنشاء المستخدم" },
      { status: 500 }
    )
  }
}