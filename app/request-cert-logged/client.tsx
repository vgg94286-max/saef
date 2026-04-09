"use client"

import { PageHeader } from "@/components/page-header"
import { Footer } from "@/components/footer"
import { NewLeaveRequestFormLogged } from "@/components/request-cert-forms/new-request-form-loggedin"
import { Card, CardContent } from "@/components/ui/card"

export default function RequestCertPageLogged({ session }: { session: any }) {
  
  const leaverEmail =
    session?.role === "requester" ? session?.email : ""

  const leaverNationalId =
    session?.role === "requester" ? session?.national_id : ""

  return (
    <div className="flex min-h-screen flex-col bg-background">
      
      <PageHeader
        title="طلب مشهد"
        description="خدمة تمكّن الفرسان والمحكمين من إصدار طلبات مشهد الحضور والإنجازات الرسمية"
      />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl">
            
            <Card className="border-border bg-card shadow-sm">
              <CardContent className="p-6">
                <NewLeaveRequestFormLogged
                  defaultNationalId={leaverNationalId}
                  defaultEmail={leaverEmail}
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