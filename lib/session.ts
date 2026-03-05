import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import type { AppJWTPayload } from "@/types/auth"

export async function getSession(): Promise<AppJWTPayload | null> {
  const cookiesStore =  await cookies()
  const token = cookiesStore.get("session")?.value
  if (!token) return null

  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as AppJWTPayload
  } catch {
    return null
  }
}