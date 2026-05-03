import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { sendPulseEmail } from "@/lib/sendpulse";

export async function PATCH(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const result = await withTransaction(async (client) => {
            // 1. جلب بيانات الطلب (الاسم والإيميل)
            const queryData = await client.query(`
                SELECT email, full_name 
                FROM public.request_no_obj 
                WHERE request_id = $1
            `, [id]);

            if (queryData.rows.length === 0) {
                throw new Error("NOT_FOUND");
            }

            const requestData = queryData.rows[0];

            // 2. تحديث الحالة إلى 'مقبول'
            await client.query(`
                UPDATE public.request_no_obj
                SET req_status = 'مقبول'
                WHERE request_id = $1
            `, [id]);

            return requestData;
        });

        // 3. محتوى البريد الإلكتروني للقبول
        const emailHtml = `
            <div dir="rtl" style="font-family: sans-serif; text-align: right; line-height: 1.6;">
                <h2 style="color: #1B4332;">مرحباً ${result.full_name}،</h2>
                <p>تمت <strong>الموافقة</strong> على طلب خطاب عدم الممانعة الخاص بكم بنجاح.</p>
                
                <br/>
                <hr style="border: 0; border-top: 1px solid #eee;" />
                <p style="font-size: 12px; color: #666;">هذا البريد مرسل آلياً من نظام الاتحاد السعودي للفروسية والبولو.</p>
            </div>
        `;

        if (result.email) {
            sendPulseEmail({
                to: result.email,
                subject: "الموافقة على طلب خطاب عدم ممانعة - الاتحاد السعودي للفروسية والبولو",
                html: emailHtml,
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.message === "NOT_FOUND") {
            return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
        }
        return NextResponse.json({ error: "فشل في قبول الطلب" }, { status: 500 });
    }
}