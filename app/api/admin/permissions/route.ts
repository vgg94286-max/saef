import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const permissions = await sql`
      SELECT perm_id, perm_name 
      FROM public.permissions 
      ORDER BY perm_name ASC
    `;

    return NextResponse.json(permissions);
  } catch (error) {
    console.error("Error fetching permissions list:", error);
    return NextResponse.json(
     []
    );
  }
}