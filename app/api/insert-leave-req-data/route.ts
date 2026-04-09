import { NextRequest, NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { RequesterJWTPayload } from "@/types/auth";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // استخراج الحقول الجديدة بناءً على ما يرسله الـ Form
    const {
      full_name,
      national_id,
      employment_name, // جهة العمل / المسمى
      phone,
      email,
      rider_id,
      requester_type,
      region,
      cham_name,
      employment_student_num,
      user_id,
    } = body;

    // 1. التحقق من وجود الحقول الإجبارية
    if (
      !full_name ||
      !national_id ||
      !employment_name ||
      !phone ||
      !email ||
      !rider_id ||
      !requester_type ||
      !region ||
      !cham_name ||
      !employment_student_num ||
      !user_id
    ) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة" },
        { status: 400 }
      );
    }

    const inserted = await withTransaction(async (tx) => {
      // 2. تحديث حالة المستخدم ليصبح موثقاً
      await tx.query(
        `UPDATE public.users
         SET is_verified = true
         WHERE user_id = $1`,
        [user_id]
      );

      // 3. إدخال بيانات طلب التفرغ بالحقول الجديدة
      // ملاحظة: تأكد أن أسماء الأعمدة في الجدول (Database) تطابق هذه الأسماء
      const result = await tx.query(
        `INSERT INTO public.leave_request (
          full_name,
          national_id,
          employment_name,
          phone,
          email,
          rider_id,
          requester_type,
          region,
          cham_name,
          employment_student_num,
          user_id
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        )
        RETURNING *`,
        [
          full_name,
          national_id,
          employment_name,
          phone,
          email,
          parseInt(rider_id),
          requester_type,
          region,
          cham_name,
          employment_student_num, // إذا كان نصاً في القاعدة اتركه كما هو، إذا كان رقماً استخدم parseInt
          user_id,
        ]
      );

      return result.rows;
    });

    // 4. إنشاء الـ JWT Payload
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

    // 5. إرسال الاستجابة ووضع الكوكيز
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
    console.error("Database Error:", err);
    return NextResponse.json(
      { error: err.message || "حدث خطأ أثناء معالجة الطلب" },
      { status: 500 }
    );
  }
}