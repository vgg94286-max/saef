
import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
  try {
    // Read cookie
    const cookieHeader = req.headers.get("cookie") || "";
    const tokenMatch = cookieHeader.match(/session=([^;]+)/); 
    if (!tokenMatch) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = tokenMatch[1];

    // Verify JWT
    let payload: any;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = payload.userId;

    //  Get club info
    const club = await sql`
      SELECT club_id, club_name, account_status
      FROM public.clubs
      WHERE user_id = ${userId}
    `;
    if (!club[0]) return NextResponse.json({ error: "Club not found" }, { status: 404 });

    const clubId = club[0].club_id;

    //  Get visit requests
    const visitRequests = await sql`
      SELECT status, created_at
      FROM public.visit_requests
      WHERE club_id = ${clubId}
      ORDER BY created_at DESC
    `;

    // Get private tournaments
    const tournaments = await sql`
      SELECT status, created_at
      FROM public.championships
      WHERE club_id = ${clubId}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({
      club: club[0],
      visitRequests,
      tournaments,
    });
  } catch (err) {
    console.error("Error in club-dashboard API:", err);
    return NextResponse.json({ error: "فشل في جلب بيانات لوحة التحكم" }, { status: 500 });
  }
}