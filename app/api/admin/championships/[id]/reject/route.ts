import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { sendPulseEmail } from "@/lib/sendpulse";

export async function PATCH(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const { note } = await _req.json();

        if (!note || note.trim() === "") {
            return NextResponse.json({ error: "سبب الرفض مطلوب" }, { status: 400 });
        }

        const result = await withTransaction(async (client) => {
            // 1. استخدام الدالة الخاصة بك لجلب بيانات النادي والمستخدم
            const queryData = await client.query(`
                SELECT email, club_name FROM champ_sendpulse_data($1)
            `, [id]);

            if (queryData.rows.length === 0) {
                throw new Error("NOT_FOUND");
            }

            const data = queryData.rows[0];

            // 2. تحديث حالة البطولة وإضافة الملاحظة
            await client.query(`
                UPDATE public.championships
                SET status = 'مرفوض', 
                    note = $1
                WHERE championships_id = $2
            `, [note, id]);

            return data;
        });

        // 3. إعداد محتوى البريد الإلكتروني للرفض
        const emailHtml = `
            <div dir="rtl" style="font-family: sans-serif; text-align: right; line-height: 1.6; color: #1A1A1A;">
                <h2 style="color: #C53030;">مرحباً بنادي ${result.club_name}،</h2>
                <p>نحيطكم علماً بأنه تعذر قبول طلب إقامة البطولة المقدم من قبلكم.</p>
                
                <div style="background-color: #FFF5F5; border-right: 4px solid #C53030; padding: 15px; margin: 20px 0; color: #C53030; border-radius: 4px;">
                    <strong>سبب الرفض المذكور:</strong><br/>
                    ${note}
                </div>

                <p>يمكنكم مراجعة المتطلبات وتعديل الطلب عبر المنصة لإعادة التقديم.</p>
                <br/>
                <hr style="border: 0; border-top: 1px solid #EEE;" />
                <p style="font-size: 12px; color: #666; text-align: center;">هذا البريد مرسل آلياً من نظام الاتحاد السعودي للفروسية والبولو.</p>
            </div>
        `;

        // 4. إرسال الإيميل (Background task)
        if (result.email) {
            sendPulseEmail({
                to: result.email,
                subject: "تحديث بشأن طلب إقامة بطولة - الاتحاد السعودي للفروسية والبولو",
                html: emailHtml,
            });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        if (error.message === "NOT_FOUND") {
            return NextResponse.json({ error: "البطولة غير موجودة" }, { status: 404 });
        }
        
        console.error("Error rejecting championship:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء معالجة رفض البطولة" },
            { status: 500 }
        );
    }
}