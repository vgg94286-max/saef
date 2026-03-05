import { sql } from "@/lib/db";

import { Resend } from "resend"


const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(request: Request) {
  try {
    const { email, user_id} = await request.json()

    if (!email || !user_id) {
      return Response.json({ error: "Email and user ID are required" }, { status: 400 })
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()

    // OTP expires in 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
    const created_at = new Date(Date.now())
    

    // Delete any existing unverified OTP for this email
    await sql`DELETE FROM otp WHERE userid = ${user_id} AND email = ${email} AND verified = FALSE`

    // Insert new OTP
    const result = await sql`
      INSERT INTO otp (userid, email, otp_code, expires_at, create_at, verified)
      VALUES (${user_id}, ${email}, ${otpCode}, ${expiresAt},${created_at}, FALSE)
      RETURNING userid, otp_code, expires_at
    `

    // In production, send OTP via email service
    // For now, we'll return it in development
   
        await resend.emails.send({
            from: "contact@zuhdmedia.site",
            to: `${email}`,
            subject: "رمز التحقق الخاص بك",
            html: `
            <div style="font-family: 'Tajawal', Arial, sans-serif; color: #333; direction: rtl; text-align: right;">
                <h2>رمز التحقق الخاص بك</h2>
                <p>استخدم الرمز التالي لتأكيد بريدك الإلكتروني:</p>
                <h1 style="letter-spacing: 3px; text-align: center;">${otpCode}</h1>
                <p>سينتهي صلاحية هذا الرمز خلال <strong>10 دقائق</strong>.</p>
                <p>إذا لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة.</p>
                <br>
                <p>مع التحية،<br>اللجنة الفنية لاتحاد الفروسية</p>
            </div>
            `,
        })
    

    return Response.json({
      success: true,
      message: "OTP sent successfully",
      
      otp: otpCode,
    })
  } catch (error) {
    console.error("[OTP Error]", error)
    return Response.json({ error: "Failed to send OTP" }, { status: 500 })
  }
}
