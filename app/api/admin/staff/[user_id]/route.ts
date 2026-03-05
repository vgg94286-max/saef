import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await params;

  try {
    // Delete staff first (FK dependency)
    await sql`
      DELETE FROM public.staff
      WHERE user_id = ${user_id}
    `;

    // Delete user (cascade should handle related tables)
    await sql`
      DELETE FROM public.users
      WHERE user_id = ${user_id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting staff:", error);
    return NextResponse.json(
      { error: "فشل في حذف الموظف" },
      { status: 500 }
    );
  }
}