import { redirect } from "next/navigation"
import { HeroSection } from "@/components/hero-section"
import { ActionCards } from "@/components/action-cards"
import { Footer } from "@/components/footer"
import { getSession } from "@/lib/session"

export default async function Home() {
  const session = await getSession()

  if (session) {
    // Redirect to the correct dashboard based on role
    switch (session.role) {
      case "club":
        redirect("/club-dashboard")
      case "admin":
        redirect("/admin/visit-requests")
      case "requester":
        redirect("/leave_req_home")
      case "staff":
        redirect("/staff-portal/portal")
    }
  }

  // If no session, show landing page
  return (
    <main className="min-h-screen bg-background">
      <HeroSection />
      <ActionCards />
      <Footer />
    </main>
  )
}