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
      // 1. جلب بيانات النادي والمستخدم المرتبط بالبطولة
      const queryData = await client.query(`
        SELECT * FROM public.champ_sendpulse_data($1)
        
      `, [id]);

      if (queryData.rows.length === 0) {
        throw new Error("NOT_FOUND");
      }

      const data = queryData.rows[0];

      // 2. تحديث حالة البطولة
      await client.query(`
        UPDATE public.championships
        SET status = 'تمت الموافقة'
        WHERE championships_id = $1
      `, [id]);

      return data;
    });

    // 3. إعداد محتوى البريد الإلكتروني
    const emailHtml = `
      <div dir="rtl" style="font-family: sans-serif; text-align: right; line-height: 1.6;">
        <h2 style="color: #1B4332;">مرحباً بنادي ${result.club_name}،</h2>
        <p>نود إبلاغكم بأنه تمت <strong>الموافقة</strong> على طلب إقامة البطولة المقرر إنطلاقها بتاريخ: <strong>${new Date(result.start_date).toLocaleDateString('ar-EG')}</strong>.</p>
        <p>نتمنى لكم تنظيماً موفقاً وبطولة ناجحة.</p>
        <br/>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #666;">هذا البريد مرسل آلياً من نظام الاتحاد السعودي للفروسية والبولو.</p>
      </div>
    `;

    if (result.email) {
      sendPulseEmail({
        to: result.email,
        subject: "الموافقة على طلب إقامة بطولة - الاتحاد السعودي للفروسية والبولو",
        html: emailHtml,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "البطولة غير موجودة" }, { status: 404 });
    }
    console.error("Error approving championship:", error);
    return NextResponse.json({ error: "فشل في قبول البطولة" }, { status: 500 });
  }
}