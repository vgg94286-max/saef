import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { sendPulseEmail } from "@/lib/sendpulse";

// تحديث الدالة لتشمل أنواع الملفات الإضافية
function getExtensionFromMime(mimeType: string | null): string {
    switch (mimeType) {
        case 'application/pdf': 
            return 'pdf';
        case 'application/msword': 
            return 'doc';
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 
            return 'docx';
        case 'image/jpeg': 
            return 'jpg';
        case 'image/png': 
            return 'png';
        case 'image/webp': 
            return 'webp';
        default: 
            return 'file'; // امتداد افتراضي في حال عدم المطابقة
    }
}

export async function PATCH(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const result = await withTransaction(async (client) => {
            // جلب بيانات النادي والمستخدم عبر JOIN
           const queryData = await client.query(
    `SELECT * FROM get_visit_request_details($1);`, 
    [id]
);

const commiteFile = await client.query(
    `SELECT * FROM public.visit_reports WHERE visit_request_id = $1;`, 
    [id]
);
const visitNote = await client.query(
    `SELECT note FROM public.visit_requests WHERE visit_id = $1;`, 
    [id]
);
            if (queryData.rows.length === 0) {
                throw new Error("NOT_FOUND");
            }

            const data = queryData.rows[0];

            // 1. تحديث حالة طلب الزيارة
            await client.query(`
                UPDATE public.visit_requests 
                SET status = 'تمت الموافقة' 
                WHERE visit_id = $1
            `, [id]);

            // 2. تحديث حالة حساب النادي
            await client.query(`
                UPDATE public.clubs
                SET account_status = 'مفعل'
                WHERE club_id = $1
            `, [data.club_id]);

            return {
                club_name: data.club_name,
                email: data.email,
                license_file: commiteFile.rows[0]?.report_text || null
                , note: visitNote.rows[0]?.note || null
            };
        });

        // تحديد نوع الملف برمجياً (حتى لو كان الرابط لا يحتوي على امتداد)
        let finalExtension = 'pdf';
        try {
            const fileCheck = await fetch(result.license_file, { method: 'HEAD' });
            const contentType = fileCheck.headers.get('content-type');
            finalExtension = getExtensionFromMime(contentType);
        } catch (e) {
            console.error("Mime type detection failed, using default:", e);
        }

        const attachmentName = `Visit_Documents_${id}.${finalExtension}`;

        // محتوى البريد الإلكتروني
        const emailHtml = `
            <div dir="rtl" style="font-family: sans-serif; text-align: right; line-height: 1.6;">
                <h2 style="color: #1B4332;">مرحباً ${result.club_name}،</h2>
                <p>تمت الموافقة على طلب الزيارة الخاص بكم بنجاح، وحسابكم الآن <strong>مفعل</strong>.</p>
              
                
                ${result.license_file ? '<p>تجدون المستندات المرفقة مع هذا البريد للاطلاع والحفظ.</p>' : ''}
                <br/>
                <hr style="border: 0; border-top: 1px solid #eee;" />
                <p style="font-size: 12px; color: #666;">تم إرسال هذا البريد آلياً من نظام الاتحاد السعودي للفروسية والبولو</p>
            </div>
        `;

        // إرسال الإشعار عبر SendPulse (عملية خلفية)
        sendPulseEmail({
            to: result.email,
            subject: "تأكيد الموافقة وتفعيل الحساب - الاتحاد السعودي للفروسية والبولو",
            html: emailHtml,
            attachmentUrl: result.license_file,
            attachmentName: attachmentName 
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        if (error.message === "NOT_FOUND") {
            return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
        }
        
        console.error("Patch Error:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء معالجة عملية الموافقة" },
            { status: 500 }
        );
    }
}