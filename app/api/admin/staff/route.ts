import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    // Calling your updated function
    const staff = await sql`SELECT * FROM public.get_all_staff()`;
    return NextResponse.json(staff);
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json({ error: "فشل في جلب الموظفين" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { staff_id, current_status } = await req.json();
    const newStatus = current_status === 'مفعل' ? 'معطل' : 'مفعل';

    await sql`
      UPDATE public.staff 
      SET status = ${newStatus} 
      WHERE staff_id = ${staff_id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "فشل في تحديث الحالة" }, { status: 500 });
  }
}