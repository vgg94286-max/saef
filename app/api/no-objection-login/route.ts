import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { NoObjectionJWTPayload } from "@/types/auth";

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
      SELECT * FROM public.get_verified_no_objection_by_email(${email})
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "البريد الإلكتروني غير مسجل" },
        { status: 400 }
      );
    }

    const user = result[0];

    const payload: NoObjectionJWTPayload = {
      user_id: user.user_id,
      role: "requester",
      
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
        national_id: user.national_id,
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