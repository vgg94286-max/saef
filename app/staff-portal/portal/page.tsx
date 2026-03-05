import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import StaffPortal  from "./client";


export default async function StaffPortalServerPage() {

 const session = await getSession();

  if (!session) {
    redirect("/staff");
  }


  return <StaffPortal/>
}