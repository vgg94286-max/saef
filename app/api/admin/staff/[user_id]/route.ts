import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await params;

  try {
    return await withTransaction(async (client) => {
      // 1. Delete staff first due to Foreign Key dependencies
      await client.query(
        "DELETE FROM public.staff WHERE user_id = $1",
        [user_id]
      );

      // 2. Delete the actual login user
      const result = await client.query(
        "DELETE FROM public.users WHERE user_id = $1",
        [user_id]
      );

      if (result.rowCount === 0) {
        throw new Error("الموظف غير موجود");
      }

      return NextResponse.json({ success: true });
    });
  } catch (error: any) {
    console.error("Error deleting staff:", error);
    return NextResponse.json(
      { error: error.message || "فشل في حذف الموظف" },
      { status: 500 }
    );
  }
}