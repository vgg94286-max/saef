import { NextResponse } from "next/server";
import { sql, withTransaction } from "@/lib/db";

export async function POST(req: Request) {
    try {
        // 1. استلام الرابط الجديد بدلاً من النص
        const { visit_request_id, committee_id, report_text } = await req.json();

        // 2. التحقق من الحقول
        if (!visit_request_id || !committee_id || !report_text) {
            return NextResponse.json(
                { error: "جميع الحقول مطلوبة" },
                { status: 400 }
            );
        }

        const existing = await sql`SELECT id FROM public.visit_reports WHERE committee_id = ${committee_id}`;
        if (existing.length > 0) {
            return NextResponse.json({ error: "تم رفع تقرير لهذه اللجنة مسبقاً" }, { status: 400 });
        }

        await withTransaction(async (tx) => {
            
            await tx.query(
                `INSERT INTO public.visit_reports (visit_request_id, committee_id, report_text)
                 VALUES ($1, $2, $3)`,
                [visit_request_id, committee_id, report_text]
            );

            // تحديث حالة اللجنة
            await tx.query(
                `UPDATE public.committees
                 SET status = 'تم رفع التقرير'
                 WHERE committee_id = $1`,
                [committee_id]
            );
        });

        return NextResponse.json({
            message: "تم رفع التقرير بنجاح",
        });

    } catch (error) {
        console.error("Report Submission Error:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء معالجة الطلب" },
            { status: 500 }
        );
    }
}