"use client"

import { PageHeader } from "@/components/page-header"
import { Footer } from "@/components/footer"
import { VisitReqOrderFormlogged } from "@/components/visit-req-forms/visit-req-order-form-logged"
import { Card, CardContent } from "@/components/ui/card"

export default function VisitReqPage({ session }: { session: any }) {

  const clubName =
    session?.role === "club" ? session?.club_name : ""

  const clubEmail =
    session?.role === "club" ? session?.email : ""

  return (
    <div className="flex min-h-screen flex-col bg-background">
      
      <PageHeader
        title="طلبات الزيارة"
        description="قم بإنشاء طلب زيارة"
      />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-md">
            
            <Card className="border-border bg-card shadow-sm">
              <CardContent className="p-6">
                <VisitReqOrderFormlogged
                  defaultClubName={clubName}
                  defaultEmail={clubEmail}
                />
              </CardContent>
            </Card>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}