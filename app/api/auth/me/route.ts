import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function GET() {
  const cookiesStore =  await cookies()
  const token = cookiesStore.get("session")?.value

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return NextResponse.json(decoded);
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}