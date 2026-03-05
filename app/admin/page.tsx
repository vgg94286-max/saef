import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"

export default async function AdminPage() {
  const session = await getSession()

  if (!session || !session?.role || session.role !== "admin" ) {
    redirect("/admin-login")
  }

  redirect("/admin/visit-requests")

 
}