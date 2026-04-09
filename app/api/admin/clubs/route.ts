import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
    try {
        const rows = await sql`SELECT * FROM public.get_all_clubs_admin()`;
        return NextResponse.json(rows);
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch clubs" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { email, club_name, city, account_status, license_end_date } = await req.json();
        await sql`
            SELECT public.create_club_final(
                ${email}, ${club_name}, ${city}, ${account_status}, ${license_end_date || null}
            )
        `;
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Failed to create club" }, { status: 500 });
    }
}

// تحديث حالة الحساب
export async function PATCH(req: Request) {
    try {
        const { club_id, new_status } = await req.json();
        await sql`
            UPDATE clubs 
            SET account_status = ${new_status} 
            WHERE club_id = ${club_id}
        `;
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
    }
}