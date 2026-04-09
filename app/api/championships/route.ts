import { NextResponse } from "next/server"
import { z } from "zod"
import { withTransaction } from "@/lib/db"

/* ---------- Validation ---------- */
const prizeSchema = z.object({
  position: z.string().min(1),
  amount: z.coerce.number().min(0),
})

const roundSchema = z.object({
  name: z.string().min(1),
  prizes: z.array(prizeSchema).min(1),
})

const judgeSchema = z.object({
  judge_name: z.string().min(2),
})

const bodySchema = z.object({
  club_id: z.string().min(1),
  date: z.string().min(1),
  end_date: z.string().min(1),  
  ambulance: z.boolean(),
  agreed_on_terms: z.boolean().refine((v) => v, "Must agree to terms"),
  judges: z.array(judgeSchema).min(1),
  rounds: z.array(roundSchema).min(1),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const data = bodySchema.parse(json)

    const championshipId = await withTransaction(async (tx) => {

      /* championship */
      const championshipRes = await tx.query(
        `INSERT INTO public.championships (club_id, date, end_date, ambulance, agreed_on_terms)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING championships_id`,
        [data.club_id, data.date, data.end_date, data.ambulance, data.agreed_on_terms]
      )

      const champId = championshipRes.rows[0].championships_id

      /* ---------- judges (SINGLE QUERY) ---------- */
      if (data.judges.length > 0) {
        const values: any[] = []
        const placeholders: string[] = []

        data.judges.forEach((j, i) => {
          const base = i * 2
          placeholders.push(`($${base + 1}, $${base + 2})`)
          values.push(champId, j.judge_name)
        })

        await tx.query(
          `INSERT INTO public.championship_judges (championship_id, judge_name)
           VALUES ${placeholders.join(", ")}`,
          values
        )
      }

      /* ---------- rounds + prizes ---------- */
      for (const round of data.rounds) {
        const roundRes = await tx.query(
          `INSERT INTO public.rounds (championship_id, name)
           VALUES ($1, $2)
           RETURNING round_id`,
          [champId, round.name]
        )

        const roundId = roundRes.rows[0].round_id

        /* prizes (SINGLE QUERY) */
        if (round.prizes.length > 0) {
          const values: any[] = []
          const placeholders: string[] = []

          round.prizes.forEach((p, i) => {
            const base = i * 3
            placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3})`)
            values.push(roundId, p.position, p.amount)
          })

          await tx.query(
            `INSERT INTO public.prizes (round_id, position, amount)
             VALUES ${placeholders.join(", ")}`,
            values
          )
        }
      }

      return champId
    })

    return NextResponse.json(
      { success: true, championship_id: championshipId },
      { status: 201 }
    )

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: error.flatten() },
        { status: 400 }
      )
    }

    console.error(error)
    return NextResponse.json(
      { error: "حدث خطأ في الخادم" },
      { status: 500 }
    )
  }
}