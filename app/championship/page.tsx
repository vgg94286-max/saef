import { PageHeader } from "@/components/page-header"
import { Footer } from "@/components/footer"
import { ChampionshipForm } from "@/components/championship-form"
import {getSession} from "@/lib/session"
import { redirect } from "next/navigation"

export default async function ChampionshipPage() {
  
  const session = await getSession()
  if (!session || session.role !== "club") {
    redirect("/")
  }

  const clubId = session?.club_id

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PageHeader
        title="إنشاء بطولة خاصة"
        description="أنشئ بطولتك الخاصة بإضافة الحكام والأشواط والجوائز"
      />

      <main className="flex-1 py-10">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <ChampionshipForm clubId={clubId} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
