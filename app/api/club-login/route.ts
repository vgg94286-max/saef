import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { ClubJWTPayload } from "@/types/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const result = await sql`
      SELECT * FROM public.get_verified_club_by_email(${email})
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "البريد الإلكتروني غير مسجل" },
        { status: 400 }
      );
    }
     const payload: ClubJWTPayload = {
          user_id: result[0].user_id,
          role: "club",
          club_id: result[0].club_id,
          club_name: result[0].club_name,
            email: email
        };
    
        const token = jwt.sign(payload, process.env.JWT_SECRET!, {
          expiresIn: "7d",
        });
    


    const res = NextResponse.json({
      user: {
        user_id: result[0].user_id,
        email: result[0].email,
      },
      club: {
        club_id:result[0].club_id,
        club_name: result[0].club_name,

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
    console.error("Error during club login:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تسجيل الدخول" },
      { status: 500 }
    );
  }
}