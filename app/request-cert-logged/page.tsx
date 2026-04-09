
import { getSession } from "@/lib/session"

import RequestCertPageLogged from "./client"

export default async function LeaveReqPage() {
  const session = await getSession()

  return <RequestCertPageLogged session={session} />
}