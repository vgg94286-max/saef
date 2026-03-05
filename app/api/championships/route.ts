import { NextResponse } from "next/server"
import { z } from "zod"
import { sql } from "@/lib/db"

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
  ambulance: z.boolean(),
  agreed_on_terms: z.boolean().refine((v) => v, "Must agree to terms"),
  judges: z.array(judgeSchema).min(1),
  rounds: z.array(roundSchema).min(1),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const data = bodySchema.parse(json)

    const championshipId = await sql.begin(async (tx) => {
      /* championship */
      const [championship] = await tx`
        INSERT INTO championships (club_id, date, ambulance, agreed_on_terms)
        VALUES (${data.club_id}, ${data.date}, ${data.ambulance}, ${data.agreed_on_terms})
        RETURNING championships_id
      `

      const champId = championship.championships_id

      /* judges */
      await tx`
        INSERT INTO championship_judges (championship_id, judge_name)
        VALUES ${sql(data.judges.map(j => [champId, j.judge_name]))}
      `

      /*  rounds + prizes */
      for (const round of data.rounds) {
        const [r] = await tx`
          INSERT INTO rounds (championship_id, name)
          VALUES (${champId}, ${round.name})
          RETURNING round_id
        `

        if (round.prizes.length > 0) {
          await tx`
            INSERT INTO prizes (round_id, position, amount)
            VALUES ${sql(round.prizes.map(p => [r.round_id, p.position, p.amount]))}
          `
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