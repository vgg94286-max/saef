
import { getSession } from "@/lib/session"
import LeaveRequestPageLogged from "./client"

export default async function LeaveReqPage() {
  const session = await getSession()

  return <LeaveRequestPageLogged session={session} />
}