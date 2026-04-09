
import { getSession } from "@/lib/session"
import LeaveRequestPage from "./client"
import { redirect } from "next/navigation"


export default async function LeaveReqPage() {  
 const session = await getSession();

  if (!session) {
    redirect("/requests");
  }

    return <LeaveRequestPage />
}