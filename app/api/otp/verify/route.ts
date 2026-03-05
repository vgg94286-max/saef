import { sql } from "@/lib/db";

import { NextRequest } from "next/server";
import { NextResponse } from "next/server";



export async function POST(request: NextRequest) {
  try {
    const { email, otpCode, user_id } = await request.json()

    if (!email || !otpCode || !user_id) {
      return NextResponse.json({ error: "Email, OTP code, and User ID are required" }, { status: 400 })
    }

   

    // Find OTP record
    const records = await sql`
      SELECT * FROM otp 
      WHERE userid = ${user_id} AND email = ${email} AND otp_code = ${otpCode} AND verified = FALSE
      ORDER BY create_at DESC
      LIMIT 1
    `

    if (!records || records.length === 0) {
      return NextResponse.json({ error: "Invalid OTP code" }, { status: 400 })
    }

    const otpRecord = records[0]

    // Check if OTP is expired
    if (new Date() > new Date(otpRecord.expires_at)) {
      return NextResponse.json({ error: "OTP has expired" }, { status: 400 })
    }

    // Mark OTP as verified
    await sql`
      UPDATE otp SET verified = TRUE 
      WHERE userid = ${user_id}
    `
    const playerInfo = await sql`
                      SELECT user_id, email,role
                      FROM users
                      WHERE email = ${email}
                      LIMIT 1
                    `;

    if (playerInfo.length === 0) {
      return NextResponse.json(
        { error: "User record not found" },
        { status: 404 }
      );
    }

    const user = playerInfo[0];



    const res = NextResponse.json({
      success: true,
      message: "OTP verified successfully",
    })
    
    return res;
  } catch (error) {
    console.error("[OTP Verification Error]", error)
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 })
  }
}
