import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";

export async function POST(req: Request) {
  const { staff_id, permission_ids } = await req.json();

  try {
    return await withTransaction(async (client) => {
      // 1. Remove all current permissions
      await client.query(
        "DELETE FROM public.staff_permissions WHERE staff_id = $1",
        [staff_id]
      );

      // 2. Insert the new selection
      if (permission_ids.length > 0) {
        const values = permission_ids.map((p_id: string) => `('${staff_id}', '${p_id}')`).join(',');
        await client.query(
          `INSERT INTO public.staff_permissions (staff_id, perm_id) VALUES ${values}`
        );
      }

      return NextResponse.json({ success: true });
    });
  } catch (error) {
    return NextResponse.json({ error: "فشل في تحديث الصلاحيات" }, { status: 500 });
  }
}