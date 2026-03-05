import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { StaffJWTPayload } from "@/types/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "البريد الإلكتروني وكلمة المرور مطلوبة" },
        { status: 400 }
      );
    }

    //join users + staff
    const result = await sql`
      SELECT * FROM public.get_verified_staff_by_email(${email})
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "بيانات تسجيل الدخول غير صحيحة" },
        { status: 400 }
      );
    }

    const user = result[0]

  

  
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return NextResponse.json(
        { error: "بيانات تسجيل الدخول غير صحيحة" },
        { status: 400 }
      );
    }

    
    const payload: StaffJWTPayload = {
      user_id: user.user_id,
      role: "staff",
      staff_id: user.staff_id,
      staff_name: user.staff_name,
     
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    const res = NextResponse.json({
      user: {
        user_id: user.user_id,
        email: user.email,
        staff_id: user.staff_id,
        staff_name: user.staff_name
      }
    });

    res.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;

  } catch (error) {
    console.error("Error during staff login:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تسجيل الدخول" },
      { status: 500 }
    );
  }
}