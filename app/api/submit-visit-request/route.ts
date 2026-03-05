import { sql } from "@/lib/db";
import jwt from "jsonwebtoken";
import { ClubJWTPayload } from "@/types/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, clubName, licenseExpiry, email, licenseUrl, clubUrls } = body;
    const is_verified = true;
    if (!userId || !clubName || !licenseExpiry || !email || !licenseUrl || !Array.isArray(clubUrls))
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });

    const result = await sql.begin(async (tx) => {

      await tx`
        UPDATE users SET is_verified = ${is_verified} WHERE user_id = ${userId}
      `;
      // Insert club
      const insertedClub = await tx`
        INSERT INTO clubs (user_id, club_name, license_end_date)
        VALUES (${userId}, ${clubName}, ${licenseExpiry})
        RETURNING club_id
      `;
      const clubId = insertedClub[0]?.club_id;
      if (!clubId) throw new Error("Failed to insert club");

      // 2️⃣ Insert visit request
      const insertedVisitReq = await tx`
        INSERT INTO visit_requests (club_id, license_file)
        VALUES (${clubId}, ${licenseUrl})
        RETURNING visit_id
      `;
      const visitId = insertedVisitReq[0]?.visit_id;
      if (!visitId) throw new Error("Failed to insert visit request");

      // 3️⃣ Insert visit images
      if (clubUrls.length > 0) {
        await tx`
          INSERT INTO visit_images (visit_request_id, image_url)
          SELECT ${visitId}, unnest(${clubUrls}::text[])
        `;
      }

      return { clubId, visitId }; // returned after commit
    });

    const { clubId, visitId } = result;

    // JWT AFTER successful transaction
    const payload: ClubJWTPayload = {
      user_id: userId,
      role: "club",
      club_id: clubId,
      club_name: clubName,
      email
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    const res = NextResponse.json({
      message: "تم إنشاء النادي وطلب الزيارة بنجاح",
      clubId,
      visitId,
    });

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
    return NextResponse.json({ error: "فشل انشاء طلب الزيارة" }, { status: 500 });
  }
}