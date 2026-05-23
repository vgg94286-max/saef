import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sendPulseEmail } from "@/lib/sendpulse";

export async function PATCH(
    req: Request, 
    { params }: { params: Promise<{ id: string }> } // <-- التعديل هنا: Promise
) {
    try {
        const { id } = await params; 
        const { visit_date } = await req.json();
        
        // 1. فحص وجود لجنة للزيارة المحددة باستخدام id
        const committeeCheck = await sql`SELECT committee_id FROM committees WHERE visit_request_id = ${id}`;
        if (committeeCheck.length === 0) {
            return NextResponse.json({ error: "لا يمكن تحديد موعد لأنه لم يتم تشكيل لجنة لهذه الزيارة بعد." }, { status: 400 });
        }

        // 2. تحديث التاريخ في قاعدة البيانات
        await sql`UPDATE visit_requests SET visit_date = ${visit_date} WHERE visit_id = ${id}`;

        // 3. جلب إيميلات اللجنة وإيميل النادي
        const emails = await sql`
           -- استعلام يجلب ايميلات أعضاء اللجنة
           SELECT u.email FROM users u 
           JOIN committee_members cm ON cm.user_id = u.user_id 
           WHERE cm.committee_id = ${committeeCheck[0].committee_id}
           UNION
           -- يجلب ايميل النادي صاحب الطلب
           SELECT u.email FROM users u
           JOIN clubs c ON c.user_id = u.user_id
           JOIN visit_requests vr ON vr.club_id = c.club_id
           WHERE vr.visit_id = ${id}
        `;

        // 4. إرسال الإيميلات
        for (const user of emails) {
            await sendPulseEmail({
                to: user.email,
                subject: "تم تحديد موعد للزيارة الميدانية",
                html: `<h1>تم تحديد موعد الزيارة</h1><p>موعد الزيارة الميدانية للنادي هو: <strong>${visit_date}</strong>.</p>`
            });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e); // مفيد لاكتشاف الأخطاء في الخادم
        return NextResponse.json({ error: "Failed to schedule visit" }, { status: 500 });
    }
}