import { NextResponse } from "next/server";
import {sql} from "@/lib/db";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await sql 
      `UPDATE championships SET status = 'مرفوض' WHERE championships_id = ${id}`;
      
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error rejecting championship:", error);
    return NextResponse.json(
      { error: "فشل في رفض البطولة" },
      { status: 500 }
    );
  }
}
