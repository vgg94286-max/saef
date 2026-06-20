import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db"; // تأكد من مسار الاستيراد الصحيح

export async function POST(req: Request) {
  try {
    const portalApiUrl = process.env.PORTAL_API_URL;
    const authHeader = process.env.AUTH_HEADER_PORTAL_API;

    // 1. جلب البيانات من الـ API الخارجي
    const externalRes = await fetch(`${portalApiUrl}/api/Academies`, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${authHeader}`,
        "Content-Type": "application/json",
      },
    });

    if (!externalRes.ok) throw new Error("Failed to fetch external clubs");
    const externalClubs = await externalRes.json();

    // 2. تنظيف البيانات
    const uniquePayloadMap = new Map();

    for (const extClub of externalClubs) {
      if (!extClub.email || extClub.email.trim() === "") continue;

      const cleanEmail = extClub.email.trim();
      const cleanName = extClub.arabicName?.replace(/[\r\n]+/g, "").trim() || "غير محدد";

      uniquePayloadMap.set(cleanEmail, {
        club_name: cleanName,
        email: cleanEmail,
        city: extClub.city || null,
        category: extClub.category || null,
        expiry_date: extClub.expiryDate || null,
      });
    }

    const payload = Array.from(uniquePayloadMap.values());

    if (payload.length === 0) {
      return NextResponse.json({ success: true, message: "No valid clubs to sync." });
    }

    // 3. تنفيذ جميع عمليات قاعدة البيانات داخل Transaction واحد
    await withTransaction(async (client) => {
      
      // أ. الإدراج والتحديث الأساسي
      // نستخدم $1 لتمرير البيانات كـ Parameter آمن بدلاً من الحقن المباشر
      const syncQuery = `
        WITH data AS (
            SELECT * FROM json_to_recordset($1::json) AS d(
                club_name text, email text, city text, category text, expiry_date date
            )
        ),
        updated_clubs AS (
            UPDATE clubs c
            SET 
                club_name = d.club_name,
                city = d.city,
                category = d.category,
                membership_exp = d.expiry_date
            FROM data d
            JOIN users u ON u.email = d.email
            WHERE c.user_id = u.user_id
            RETURNING u.email
        ),
        new_users_data AS (
            SELECT d.* FROM data d
            LEFT JOIN users u ON u.email = d.email
            WHERE u.user_id IS NULL
        ),
        inserted_users AS (
            INSERT INTO users (email, role, is_verified)
            SELECT nud.email, 'club'::user_role, true 
            FROM new_users_data nud
            RETURNING user_id, email
        ),
        existing_users_without_club AS (
            SELECT u.user_id, d.club_name, d.city, d.category, d.expiry_date
            FROM data d
            JOIN users u ON u.email = d.email
            LEFT JOIN clubs c ON c.user_id = u.user_id
            WHERE c.club_id IS NULL
        ),
        all_users_needing_clubs AS (
            SELECT iu.user_id, nud.club_name, nud.city, nud.category, nud.expiry_date
            FROM inserted_users iu
            JOIN new_users_data nud ON nud.email = iu.email
            UNION ALL
            SELECT user_id, club_name, city, category, expiry_date
            FROM existing_users_without_club
        )
        INSERT INTO clubs (user_id, club_name, city, category, membership_exp, account_status)
        SELECT user_id, club_name, city, category, expiry_date, 'مفعل'
        FROM all_users_needing_clubs;
      `;
      
      await client.query(syncQuery, [JSON.stringify(payload)]);

      // ب. تعطيل الحسابات المنتهية
      await client.query(`
        UPDATE clubs
        SET account_status = 'معطل'
        WHERE membership_exp < CURRENT_DATE 
        AND account_status != 'معطل';
      `);

      // ج. تفعيل الحسابات السارية
      await client.query(`
        UPDATE clubs
        SET account_status = 'مفعل'
        WHERE membership_exp >= CURRENT_DATE 
        AND account_status != 'مفعل';
      `);
      
    }); // هنا يتم تنفيذ COMMIT تلقائياً إذا لم يحدث خطأ، أو ROLLBACK إذا حدث خطأ.

    return NextResponse.json({ 
      success: true, 
      message: `Sync completed successfully as a single transaction. Processed ${payload.length} unique emails.` 
    });

  } catch (e) {
    console.error("Sync Error:", e);
    return NextResponse.json({ error: "Failed to sync clubs" }, { status: 500 });
  }
}