
import { getSession } from "@/lib/session"
import NoObjRequestPageLogged from "./client"

export default async function LeaveReqPage() {
  const session = await getSession()

  return <NoObjRequestPageLogged session={session} />
}