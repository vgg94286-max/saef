import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { LeaveRequesterJWTPayload } from "@/types/auth";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const result = await sql`
      SELECT * FROM get_verified_leave_by_email(${email})
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "البريد الإلكتروني غير مسجل" },
        { status: 400 }
      );
    }

    const user = result[0];

    const payload: LeaveRequesterJWTPayload = {
      user_id: user.user_id,
      role: "leave_requester",
      national_id: user.national_id,
      name: user.full_name,
      email: user.email,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    const res = NextResponse.json({
      user: {
        user_id: user.user_id,
        email: user.email,
        name: user.full_name,
      },
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
    console.error("Error during leave requester login:", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء تسجيل الدخول" },
      { status: 500 }
    );
  }
}