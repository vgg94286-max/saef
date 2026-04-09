import { NextResponse } from "next/server";
import { sql } from "@/lib/db"; // تأكد من المسار الصحيح لملف db.ts الخاص بك

// جلب البطولات
export async function GET() {
    try {
        // نستخدم sql (Neon connection) لجلب البيانات
        const data = await sql`
            SELECT * FROM public.public_champ 
            ORDER BY champ_id DESC
        `;
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Database Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// إضافة بطولة جديدة
export async function POST(req: Request) {
    try {
        const { champ_name } = await req.json();

        if (!champ_name) {
            return NextResponse.json({ error: "اسم البطولة مطلوب" }, { status: 400 });
        }

        const data = await sql`
            INSERT INTO public.public_champ (champ_name) 
            VALUES (${champ_name}) 
            RETURNING *
        `;

        return NextResponse.json(data[0]);
    } catch (error: any) {
        console.error("Database Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// حذف بطولة
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "المعرف مطلوب" }, { status: 400 });
        }

        await sql`
            DELETE FROM public.public_champ 
            WHERE champ_id = ${id}
        `;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Database Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}