import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { ClubDashboard } from "@/components/dashboards/ClubDashboard";

type Club = {
  club_id: string;
  club_name: string;
  account_status: string;
};

type VisitRequest = {
  id: string;
  status: string;
  created_at: string;
  note: string | null;
  report_text: string | null;
};

type Tournament = {
  id: string;
  status: string;
  created_at: string;
  note: string | null;
};

export default async function Page() {
  const session = await getSession();

  if (!session?.user_id) {
    redirect("/clubs");
  }

  const userId = session.user_id;

  const club = (await sql`
    SELECT club_id, club_name, account_status
    FROM public.clubs
    WHERE user_id = ${userId}
  `) as Club[];

  if (!club[0]) {
    redirect("/");
  }

  const clubId = club[0].club_id;

  // جلب طلبات الزيارة مع ملاحظاتها وتقاريرها عبر LEFT JOIN
  const visitRequests = (await sql`
    SELECT * from public.get_club_visits(${clubId})
        
  `) as VisitRequest[];

  // جلب البطولات مع ملاحظاتها
  const tournaments = (await sql`
    SELECT 
        championships_id::text as id, 
        status, 
        created_at, 
        note
    FROM public.championships
    WHERE club_id = ${clubId}
    ORDER BY created_at DESC
  `) as Tournament[];

  return (
    <ClubDashboard
      data={{
        club: club[0],
        visitRequests,
        tournaments,
      }}
    />
  );
}