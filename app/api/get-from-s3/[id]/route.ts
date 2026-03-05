
import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing visitId" }, { status: 400 });

    // License file from DB
    const visitReq = await sql`
      SELECT license_file FROM visit_requests WHERE visit_id = ${id}
    `;
    const licenseUrl = visitReq[0]?.license_file;
    if (!licenseUrl) return NextResponse.json({ error: "License file not found" }, { status: 404 });

    // Club images from DB
    const images = await sql`
      SELECT image_url FROM visit_images WHERE visit_request_id = ${id}
    `;
    const clubUrls = images.map(img => img.image_url);

    return NextResponse.json({ licenseUrl, clubUrls });
  } catch (err) {
    console.error("Error in get-from-s3:", err);
    return NextResponse.json({ error: "Failed to get files" }, { status: 500 });
  }
}