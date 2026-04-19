import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { sendPulseEmail } from "@/lib/sendpulse";

export async function PATCH(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        // استقبال الملاحظة من جسم الطلب
        const { note } = await _req.json();

        if (!note || note.trim() === "") {
            return NextResponse.json({ error: "سبب الرفض مطلوب" }, { status: 400 });
        }

        const result = await withTransaction(async (client) => {
            // 1. جلب البيانات الضرورية قبل التحديث لإرسال الإيميل
            const queryData = await client.query(`
                SELECT 
                    email, 
                    full_name, 
                    championship_name
                FROM public.request_cert 
                WHERE request_id = $1
            `, [id]);

            if (queryData.rows.length === 0) {
                throw new Error("NOT_FOUND");
            }

            const requestData = queryData.rows[0];

            // 2. تحديث حالة الطلب إلى 'مرفوض' وإضافة الملاحظة
            await client.query(`
                UPDATE public.request_cert
                SET req_status = 'مرفوض', 
                    note = $1
                WHERE request_id = $2
            `, [note, id]);

            return requestData;
        });

        // 3. إعداد محتوى البريد الإلكتروني مع الملاحظة
        const emailHtml = `
            <div dir="rtl" style="font-family: sans-serif; text-align: right; line-height: 1.6; color: #1A1A1A;">
                <h2 style="color: #C53030;">مرحباً ${result.full_name}،</h2>
                <p>نود إفادتكم بأنه تعذر قبول طلب الشهادة الخاص بكم بخصوص بطولة: <strong>${result.championship_name}</strong>.</p>
                
                <div style="background-color: #FFF5F5; border-right: 4px solid #C53030; padding: 15px; margin: 20px 0; color: #C53030; border-radius: 4px;">
                    <strong>سبب الرفض المذكور:</strong><br/>
                    ${note}
                </div>

                <p>يمكنكم مراجعة حسابكم في المنصة لتعديل البيانات المطلوبة وإعادة تقديم الطلب مرة أخرى.</p>
                <br/>
                <hr style="border: 0; border-top: 1px solid #EEE;" />
                <p style="font-size: 12px; color: #666; text-align: center;">هذا البريد مرسل آلياً من نظام الاتحاد السعودي للفروسية والبولو.</p>
            </div>
        `;

        // 4. إرسال الإيميل في الخلفية
        if (result.email) {
            sendPulseEmail({
                to: result.email,
                subject: "تحديث بشأن طلب الشهادة - الاتحاد السعودي للفروسية والبولو",
                html: emailHtml,
            });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        if (error.message === "NOT_FOUND") {
            return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
        }
        
        console.error("Error rejecting certification request:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء معالجة رفض الطلب" },
            { status: 500 }
        );
    }
}