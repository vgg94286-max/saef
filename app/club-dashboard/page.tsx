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
  status: string;
  created_at: string;
};

type Tournament = {
  status: string;
  created_at: string;
};

export default async function Page() {
  // Get session (your custom function)
  const session = await getSession();

  if (!session?.user_id) {
    redirect("/clubs");
  }

  const userId = session.user_id;

  // Get club info
  const club: Club[] = await sql`
    SELECT club_id, club_name, account_status
    FROM clubs
    WHERE user_id = ${userId}
  `;

  if (!club[0]) {
    redirect("/clubs");
  }

  const clubId = club[0].club_id;

  // Get visit requests
  const visitRequests: VisitRequest[] = await sql`
    SELECT status, created_at
    FROM visit_requests
    WHERE club_id = ${clubId}
    ORDER BY created_at DESC
  `;

  // Get championships
  const tournaments: Tournament[] = await sql`
    SELECT status, created_at
    FROM championships
    WHERE club_id = ${clubId}
    ORDER BY created_at DESC
  `;

  
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