import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(req: Request) {
    try {
            const portalApiUrl = process.env.PORTAL_API_URL;
    const authHeader = process.env.AUTH_HEADER_PORTAL_API;
        // 1. جلب البيانات من الـ API الخارجي (ضع الرابط الحقيقي الخاص بك هنا)
        const externalRes = await fetch(`${portalApiUrl}/api/Academies`, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${authHeader}`,
        "Content-Type": "application/json",
      },
    });;
        if (!externalRes.ok) throw new Error("Failed to fetch external clubs");
        const externalClubs = await externalRes.json();

        // 2. جلب الأندية الحالية من قاعدة بياناتك للمقارنة
        const internalClubs = await sql`SELECT club_name FROM clubs`;
        
        // إنشاء Set يحتوي على أسماء الأندية الحالية (بحروف صغيرة وبدون مسافات إضافية) لسهولة المقارنة
        const existingNames = new Set(
            internalClubs.map(c => c.club_name.trim())
        );

        let addedCount = 0;

        // 3. مقارنة البيانات وإدخال الجديد فقط
        for (const extClub of externalClubs) {
            // تنظيف الاسم من المسافات المخفية (مثل \n التي ظهرت في بياناتك)
            const cleanName = extClub.arabicName?.trim();
            
            if (!cleanName) continue; // تخطي إذا لم يوجد اسم

            // إذا كان النادي غير موجود مسبقاً في قاعدة بياناتك
            if (!existingNames.has(cleanName)) {
                
                // معالجة البريد الإلكتروني المفقود أو الفارغ (لأن جدول users يتطلب بريد إلكتروني فريد)
                let emailToUse = extClub.email?.trim();
                if (!emailToUse || emailToUse === "") {
                    // توليد بريد مؤقت لتجنب خطأ قاعدة البيانات
                    emailToUse = `pending_${Date.now()}_${Math.random().toString(36).substring(7)}@placeholder.com`;
                }

                // بناءً على طلبك: expiryDate الخارجي يختلف عن license_end_date الداخلي
                // لذلك سنمرر null لتاريخ الرخصة الداخلي، وسنجعل حالة الحساب الافتراضية "مفعل" 
                await sql`
                    SELECT public.create_club_final(
                        ${emailToUse}, 
                        ${cleanName}, 
                        ${extClub.city}, 
                        'مفعل', 
                        NULL
                    )
                `;
                
                addedCount++;
                // إضافة الاسم للـ Set لتجنب تكراره إذا كان مكرراً في الـ API نفسه
                existingNames.add(cleanName); 
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Sync completed. Added ${addedCount} new clubs.` 
        });

    } catch (e) {
        console.error("Sync Error:", e);
        return NextResponse.json({ error: "Failed to sync clubs" }, { status: 500 });
    }
}