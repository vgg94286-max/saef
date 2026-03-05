import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { LeaveRequesterJWTPayload } from "@/types/auth";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      full_name,
      national_id,
      employer,
      phone,
      email,
      height_cm,
      weight_kg,
      salary,
      marital_status,
      national_address,
      user_id,
    } = body;

    if (
      !full_name ||
      !national_id ||
      !employer ||
      !phone ||
      !email ||
      !height_cm ||
      !weight_kg ||
      !salary ||
      !marital_status ||
      !national_address ||
      !user_id
    ) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة" },
        { status: 400 }
      );
    }

    
    const inserted = await sql.begin(async (tx) => {
      
      // Update user
      await tx`
        UPDATE public.users
        SET is_verified = true
        WHERE user_id = ${user_id}
      `;

      // Insert leave request
      const result = await tx`
        INSERT INTO public.leave_request (
          full_name,
          national_id,
          employer,
          phone,
          email,
          height_cm,
          weight_kg,
          salary,
          marital_status,
          national_address,
          user_id
        )
        VALUES (
          ${full_name},
          ${national_id},
          ${employer},
          ${phone},
          ${email},
          ${parseInt(height_cm)},
          ${parseInt(weight_kg)},
          ${parseInt(salary)},
          ${marital_status},
          ${national_address.toUpperCase()},
          ${user_id}
        )
        RETURNING *;
      `;

      return result;
    });
   

    const payload: LeaveRequesterJWTPayload = {
      user_id: inserted[0].user_id,
      role: "leave_requester",
      name: inserted[0].full_name,
      email: inserted[0].email,
      national_id: inserted[0].national_id,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    const res = NextResponse.json({
      message: "تم إنشاء طلب التفرغ بنجاح",
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