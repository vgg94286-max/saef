
import { getSession } from "@/lib/session"
import VisitReqClient from "./visit-req-client"

export default async function VisitReqPage() {
  const session = await getSession()

  return <VisitReqClient session={session} />
}