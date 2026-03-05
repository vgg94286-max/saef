import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // get_championship_basic ()
    const champs = await sql`
      SELECT * FROM public.get_championship_basic(${id})
    `;

    if (champs.length === 0) {
      return NextResponse.json({ error: "البطولة غير موجودة" }, { status: 404 });
    }

    // Judges
    const judges = await sql`
      SELECT judge_id, judge_name
      FROM public.championship_judges
      WHERE championship_id = ${id}
    `;

    // get_championship_rounds
    const rounds = await sql`
      SELECT *
      FROM public.get_championship_rounds(${id})
    `;

    // get_championship_total_prizes
    const totalRows = await sql`
      SELECT public.get_championship_total_prizes(${id}) as total_prizes
    `;

    return NextResponse.json({
      ...champs[0],       // championship basic info
      judges,             // array of judges
      rounds,             // array of rounds with prizes
      total_prizes: Number(totalRows[0].total_prizes), // total prizes
    });
  } catch (error) {
    console.error("Error fetching championship:", error);
    return NextResponse.json(
      { error: "فشل في جلب تفاصيل البطولة" },
      { status: 500 }
    );
  }
}