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
            // 1. جلب البيانات قبل التحديث
            const queryData = await client.query(`
                SELECT email, full_name FROM public.request_no_obj WHERE request_id = $1
            `, [id]);

            if (queryData.rows.length === 0) {
                throw new Error("NOT_FOUND");
            }

            const requestData = queryData.rows[0];

            // 2. تحديث الحالة والملاحظة
            await client.query(`
                UPDATE public.request_no_obj
                SET req_status = 'مرفوض', note = $1
                WHERE request_id = $2
            `, [note, id]);

            return requestData;
        });

        // 3. محتوى البريد الإلكتروني للرفض مع الملاحظة
        const emailHtml = `
            <div dir="rtl" style="font-family: sans-serif; text-align: right; line-height: 1.6;">
                <h2>مرحباً ${result.full_name}،</h2>
                <p>نود إفادتكم بأنه تم <strong>رفض</strong> طلب خطاب عدم الممانعة الخاص بكم.</p>
                
                <div style="background-color: #FFF5F5; border-right: 4px solid #C53030; padding: 15px; margin: 20px 0; color: #C53030; border-radius: 4px;">
                    <strong>سبب الرفض المذكور:</strong><br/>
                    ${note}
                </div>

                <p>يرجى مراجعة الملاحظة أعلاه قبل إعادة التقديم.</p>
                <br/>
                <hr style="border: 0; border-top: 1px solid #EEE;" />
                <p style="font-size: 12px; color: #666;">هذا البريد مرسل آلياً من نظام الاتحاد السعودي للفروسية والبولو.</p>
            </div>
        `;

        if (result.email) {
            sendPulseEmail({
                to: result.email,
                subject: "تحديث بشأن طلب خطاب عدم الممانعة - الاتحاد السعودي للفروسية والبولو",
                html: emailHtml,
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.message === "NOT_FOUND") {
            return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
        }
        return NextResponse.json({ error: "فشل في رفض الطلب" }, { status: 500 });
    }
}