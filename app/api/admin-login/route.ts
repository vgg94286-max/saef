
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {AdminJWTPayload} from "@/types/auth"






export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;
    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    
    // Check credentials
    const admins = await sql`
  SELECT * FROM users WHERE email = ${email} AND role = 'admin'
`;



    
    if (admins.length === 0) {
      return NextResponse.json({ error: "الايميل أو كلمة المرور خاطئة" }, { status: 401 });
    }   

    const passwordMatch = await bcrypt.compare(password, admins[0].password_hash);
    if (!passwordMatch) {
      return NextResponse.json({ error: "الايميل أو كلمة المرور خاطئة" }, { status: 401 });
    }
    
        const payload: AdminJWTPayload = {
          user_id:admins[0].user_id,
          role: "admin",
          
        };
    
        const token = jwt.sign(payload, process.env.JWT_SECRET!, {
          expiresIn: "1d",
        });
    
        const res = NextResponse.json({
          message: "تم تسجيل الدخول",
          
        });
    
        res.cookies.set("session", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 24 * 60 * 60,
        });
        return res;

    
    } catch (error) {
        console.error("حصل خطأ اثناء تسجيل الدخول", error);
        return Response.json({ error: "حصل خطأ اثناء تسجيل الدخول" }, { status: 500 });
    }
}