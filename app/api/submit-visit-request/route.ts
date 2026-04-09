import { withTransaction } from "@/lib/db";
import jwt from "jsonwebtoken";
import { ClubJWTPayload } from "@/types/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, clubName, licenseExpiry, email, licenseUrl, clubUrls, city } = body;
    const is_verified = true;

    if (!userId || !clubName || !licenseExpiry || !email || !licenseUrl || !Array.isArray(clubUrls) || !city)
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });

    const result = await withTransaction(async (tx) => {
      // 1. تحديث حالة التحقق للمستخدم
      await tx.query(
        `UPDATE public.users SET is_verified = $1 WHERE user_id = $2::uuid`,
        [is_verified, userId]
      );

      // 2. إدخال النادي أو جلبه إذا كان موجوداً (ON CONFLICT)
      // نفترض أن هناك Unique Constraint على عمود user_id في جدول clubs
      const insertedClub = await tx.query(
        `INSERT INTO public.clubs (user_id, club_name, license_end_date, city)
         VALUES ($1::uuid, $2, $3, $4)
         ON CONFLICT (user_id) DO UPDATE SET club_name = EXCLUDED.club_name
         RETURNING club_id`,
        [userId, clubName, licenseExpiry, city]
      );

      const clubId = insertedClub.rows[0]?.club_id;
      if (!clubId) throw new Error("Failed to process club");

      // 3. إدخال طلب الزيارة
      const insertedVisitReq = await tx.query(
        `INSERT INTO public.visit_requests (club_id, license_file)
         VALUES ($1, $2)
         RETURNING visit_id`,
        [clubId, licenseUrl]
      );

      const visitId = insertedVisitReq.rows[0]?.visit_id;
      if (!visitId) throw new Error("Failed to insert visit request");

      // 4. إدخال الصور باستخدام unnest بشكل آمن
      if (clubUrls.length > 0) {
        await tx.query(
          `INSERT INTO public.visit_images (visit_request_id, image_url)
           SELECT $1, unnest($2::text[])`,
          [visitId, clubUrls]
        );
      }

      return { clubId, visitId };
    });

    // بقية الكود (JWT وإرسال الكوكيز) تظل كما هي...
    const { clubId, visitId } = result;
    const payload: ClubJWTPayload = { user_id: userId, role: "club", club_id: clubId, club_name: clubName, email };
    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "7d" });

    const res = NextResponse.json({ message: "تمت العملية بنجاح", clubId, visitId });
    res.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err) {
    console.error("Error in submit-visit-request:", err);
    return NextResponse.json({ error: "حدث خطأ أثناء معالجة الطلب" }, { status: 500 });
  }
}