import { NextRequest, NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import {  RequesterJWTPayload } from "@/types/auth";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
       full_name,
          national_id,
          championship_name,
          email,
          knight_license_url,
          user_id
    } = body;

    if (
      !full_name ||
      !national_id ||
      !championship_name ||
      !email ||
      !knight_license_url ||
      
      !user_id
    ) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة" },
        { status: 400 }
      );
    }

    const inserted = await withTransaction(async (tx) => {
      // Update user
      await tx.query(
        `UPDATE public.users
         SET is_verified = true
         WHERE user_id = $1`,
        [user_id]
      );

      // Insert leave request
      const result = await tx.query(
        `INSERT INTO public.request_cert (
          full_name,
          national_id,
          championship_name,
          email,
          licence_card,
          user_id
        )
        VALUES (
          $1,$2,$3,$4,$5,$6
        )
        RETURNING *`,
        [
          full_name,
          national_id,
          championship_name,
          email,
          knight_license_url,
          user_id,
        ]
      );

      return result.rows;
    });

    const payload: RequesterJWTPayload = {
      user_id: inserted[0].user_id,
      role: "requester",
      name: inserted[0].full_name,
      email: inserted[0].email,
      national_id: inserted[0].national_id,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    const res = NextResponse.json({
      message: "تم إنشاء طلب المشهد بنجاح",
      user_id: inserted[0].user_id,
    });

    res.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;

  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "حدث خطأ" },
      { status: 500 }
    );
  }
}