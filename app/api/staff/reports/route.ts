import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const { visit_request_id, committee_id, report_text } = await req.json();

        // 1. Validation
        if (!visit_request_id || !committee_id || !report_text) {
            return NextResponse.json(
                { error: "جميع الحقول مطلوبة" },
                { status: 400 }
            );
        }
        // Inside api/reports POST
        const existing = await sql`SELECT id FROM visit_reports WHERE committee_id = ${committee_id}`;
        if (existing.length > 0) {
            return NextResponse.json({ error: "تم رفع تقرير لهذه اللجنة مسبقاً" }, { status: 400 });
        }
        // Transaction
        await sql.begin(async (tx) => {

            // Insert report
            await tx`
        INSERT INTO visit_reports (visit_request_id, committee_id, report_text)
        VALUES (${visit_request_id}, ${committee_id}, ${report_text})
      `;

            // Update committee status
            await tx`
        UPDATE committees
        SET status = 'تم رفع التقرير'
        WHERE committee_id = ${committee_id}
      `;
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