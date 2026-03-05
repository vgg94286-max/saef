"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Footer } from "@/components/footer"
import { NewLeaveRequestForm } from "@/components/leave-request-forms/new-request-form"
import { PreviousRequestsForm } from "@/components/leave-request-forms/previous-requests-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"

export default function LeaveRequestPage() {
  const [activeTab, setActiveTab] = useState("new")

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PageHeader 
        title="طلب تفرغ" 
        description="خدمة تمكّن الفرسان والمحكمين من إصدار طلبات تفرغ رسمية يمكن تقديمها لجهة عملهم"
      />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl">
            <Card className="border-border bg-card shadow-sm">
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="mb-6 grid w-full grid-cols-2 bg-secondary">
                    <TabsTrigger 
                      value="new" 
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      طلب جديد
                    </TabsTrigger>
                    <TabsTrigger 
                      value="previous"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      الطلبات السابقة
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="new" className="mt-0">
                    <NewLeaveRequestForm />
                  </TabsContent>
                  
                  <TabsContent value="previous" className="mt-0">
                    <PreviousRequestsForm />
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
