import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

// GET /api/staff/committees?user_id=<staff_user_id>
// Returns all committees assigned to this staff member with their roles and related visit request details
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "user_id مطلوب" }, { status: 400 });
  }

  try {
    // Get committees where this user is a member
    const committees = await sql`
  SELECT * FROM public.get_staff_committees(${userId})
`;

    // For each committee, get all members
    const enriched = await Promise.all(
      committees.map(async (c) => {
        const members = await sql`
          SELECT * FROM public.get_committee_members(${c.committee_id})
`;


        // Get visit images
        const images = await sql`
          SELECT img_id, image_url FROM public.visit_images WHERE visit_request_id = ${c.visit_id}
        `;

        return { ...c, members, images };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Error fetching staff committees:", error);
    return NextResponse.json(
      { error: "فشل في جلب اللجان" },
      { status: 500 }
    );
  }
}
