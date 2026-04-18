import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { sendPulseEmail } from "@/lib/sendpulse";

// Helper for file extensions
function getExtensionFromMime(mimeType: string | null): string {
    switch (mimeType) {
        case 'application/pdf': return 'pdf';
        case 'image/jpeg': return 'jpg';
        case 'image/png': return 'png';
        default: return 'file';
    }
}

export async function PATCH(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { note } = await _req.json();

    try {
        const result = await withTransaction(async (client) => {
            // 1. Get Club/Request details
            const queryData = await client.query(
                `SELECT * FROM get_visit_request_details($1);`, 
                [id]
            );

            // 2. Get the specific report file
            const commiteFile = await client.query(
                `SELECT report_text FROM public.visit_reports WHERE visit_request_id = $1 LIMIT 1;`, 
                [id]
            );

            if (queryData.rows.length === 0) {
                throw new Error("NOT_FOUND");
            }

            const data = queryData.rows[0];

            // 3. Update Request status
            await client.query(`
                UPDATE public.visit_requests 
                SET status = 'مرفوض', 
                    note = $1 
                WHERE visit_id = $2
            `, [note, id]);

            // 4. Update Club status
            await client.query(`
                UPDATE public.clubs
                SET account_status = 'معطل'
                WHERE club_id = $1
            `, [data.club_id]);

            return {
                ...data,
                report_file: commiteFile.rows[0]?.report_text || null
            };
        });

        // 5. Handle Attachment Logic
        let finalExtension = 'pdf';
        let hasAttachment = false;

        if (result.report_file && result.report_file.startsWith('http')) {
            hasAttachment = true;
            try {
                const fileCheck = await fetch(result.report_file, { method: 'HEAD' });
                const contentType = fileCheck.headers.get('content-type');
                finalExtension = getExtensionFromMime(contentType);
            } catch (e) {
                console.error("Mime detection failed:", e);
            }
        }

        const attachmentName = `Rejection_Report_${id}.${finalExtension}`;

        // 6. Email Template
        const emailHtml = `
            <div dir="rtl" style="font-family: sans-serif; text-align: right; line-height: 1.6;">
                <h2 style="color: #bc4749;">مرحباً ${result.club_name}،</h2>
                <p>نود إفادتكم بأنه تم <strong>رفض</strong> طلب الزيارة الخاص بكم.</p>
                
                ${note ? `
                <div style="background-color: #fff5f5; padding: 15px; border-right: 4px solid #bc4749; margin: 15px 0;">
                    <strong style="color: #bc4749;">سبب الرفض:</strong><br/>
                    ${note}
                </div>` : ''}
                
                ${hasAttachment ? '<p>تجدون مرفقاً مع هذا البريد تقرير اللجنة الذي يوضح أسباب القرار.</p>' : ''}
                
                
                <br/>
                <hr style="border: 0; border-top: 1px solid #eee;" />
                <p style="font-size: 12px; color: #666;">تم إرسال هذا البريد آلياً من نظام الاتحاد السعودي للفروسية والبولو</p>
            </div>
        `;

        // 7. Send via SendPulse
        sendPulseEmail({
            to: result.email,
            subject: "تحديث بشأن طلب الزيارة - الاتحاد السعودي للفروسية والبولو",
            html: emailHtml,
            attachmentUrl: hasAttachment ? result.report_file : undefined,
            attachmentName: hasAttachment ? attachmentName : undefined
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        if (error.message === "NOT_FOUND") {
            return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
        }
        console.error("Reject Route Error:", error);
        return NextResponse.json({ error: "فشل في معالجة الرفض" }, { status: 500 });
    }
}