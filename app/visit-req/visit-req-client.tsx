"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Footer } from "@/components/footer"
import { VisitReqOrderForm } from "@/components/visit-req-forms/visit-req-order-form"
import { FollowVisitReqForm } from "@/components/visit-req-forms/follow-visit-req-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"

export default function VisitReqPage({ session }: { session: any }) {
  const [activeTab, setActiveTab] = useState("order")


  const clubName =
    session?.role === "club" ? session?.club_name : ""

  const club_email =
    session?.role === "club" ? session?.email : ""

  

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PageHeader
        title="طلبات الزيارة"
        description="قم بإنشاء طلب زيارة أو متابعة طلباتك السابقة"
      />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-md">
            <Card className="border-border bg-card shadow-sm">
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="mb-6 grid w-full grid-cols-2 bg-secondary">
                    <TabsTrigger
                      value="follow"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      متابعة طلبات الزيارة
                    </TabsTrigger>
                    <TabsTrigger
                      value="order"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      إنشاء طلب زيارة
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="order" className="mt-0">
                    {session ? <VisitReqOrderForm defaultClubName={clubName} defaultEmail={club_email} /> : <VisitReqOrderForm defaultClubName={clubName} defaultEmail={club_email} />}
                  </TabsContent>

                  <TabsContent value="follow" className="mt-0">
                    <FollowVisitReqForm />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
