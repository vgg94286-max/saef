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
            // 1. جلب بيانات صاحب الطلب قبل التحديث
            const queryData = await client.query(`
                SELECT 
                    email, 
                    full_name
                FROM public.leave_request 
                WHERE request_id = $1
            `, [id]);

            if (queryData.rows.length === 0) {
                throw new Error("NOT_FOUND");
            }

            const requestData = queryData.rows[0];

            // 2. تحديث حالة الطلب وإضافة الملاحظة
            await client.query(`
                UPDATE public.leave_request
                SET req_status = 'مرفوض', 
                    note = $1
                WHERE request_id = $2
            `, [note, id]);

            return requestData;
        });

        // 3. إعداد محتوى البريد الإلكتروني للرفض
        const emailHtml = `
            <div dir="rtl" style="font-family: sans-serif; text-align: right; line-height: 1.6; color: #1A1A1A;">
                <h2 style="color: #C53030;">مرحباً ${result.full_name}،</h2>
                <p>نود إفادتكم بأنه تعذر قبول طلب التفرغ الخاص بكم.</p>
                
                <div style="background-color: #FFF5F5; border-right: 4px solid #C53030; padding: 15px; margin: 20px 0; color: #C53030; border-radius: 4px;">
                    <strong>سبب الرفض المذكور:</strong><br/>
                    ${note}
                </div>

                
                <br/>
                <hr style="border: 0; border-top: 1px solid #EEE;" />
                <p style="font-size: 12px; color: #666; text-align: center;">هذا البريد مرسل آلياً من نظام الاتحاد السعودي للفروسية والبولو.</p>
            </div>
        `;

        // 4. إرسال الإيميل (Background task)
        if (result.email) {
            sendPulseEmail({
                to: result.email,
                subject: "تحديث بشأن طلب التفرغ - الاتحاد السعودي للفروسية والبولو",
                html: emailHtml,
            });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        if (error.message === "NOT_FOUND") {
            return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
        }
        
        console.error("Error rejecting leave request:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء معالجة رفض الطلب" },
            { status: 500 }
        );
    }
}