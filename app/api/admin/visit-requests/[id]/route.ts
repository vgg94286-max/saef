import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Get visit request using DB function
    const visits = await sql`
      SELECT * FROM get_visit_request_by_id(${id})
    `;

    if (!visits || visits.length === 0) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    // Get visit images
    const images = await sql`
      SELECT img_id, image_url 
      FROM visit_images 
      WHERE visit_request_id = ${id}
    `;

    return NextResponse.json({ ...visits[0], images });
  } catch (error) {
    console.error("Error fetching visit request:", error);
    return NextResponse.json(
      { error: "فشل في جلب تفاصيل الطلب" },
      { status: 500 }
    );
  }
}