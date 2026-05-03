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
      // 1. جلب بيانات الطلب مباشرة من الجدول
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

      // 2. تحديث حالة الطلب
      await client.query(`
        UPDATE public.request_cert
        SET req_status = 'مقبول'
        WHERE request_id = $1
      `, [id]);

      return requestData;
    });

    // 3. إعداد محتوى البريد الإلكتروني
    const emailHtml = `
      <div dir="rtl" style="font-family: sans-serif; text-align: right; line-height: 1.6;">
        <h2 style="color: #1B4332;">مرحباً ${result.full_name}،</h2>
        <p>تمت <strong>الموافقة</strong> على طلب الشهادة الخاص بك بخصوص بطولة: <strong>${result.championship_name}</strong>.</p>
        <p>يمكنك الآن مراجعة حسابك في المنصة للاطلاع على التفاصيل.</p>
        <br/>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #666;">هذا البريد مرسل آلياً من نظام الاتحاد الفروسي.</p>
      </div>
    `;

    // 4. إرسال البريد عبر SendPulse (سيستخدم التوكن المخزن في الذاكرة)
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
    
    console.error("Error approving request:", error);
    return NextResponse.json(
      { error: "فشل في معالجة طلب القبول" },
      { status: 500 }
    );
  }
}