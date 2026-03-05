"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Footer } from "@/components/footer"
import { StaffLoginForm } from "@/components/staff/staff-login-form"
import { StaffRegisterForm } from "@/components/staff/staff-register-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"

export default function StaffPage() {
  const [activeTab, setActiveTab] = useState("login")

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PageHeader 
        title="دخول موظفي الاتحاد" 
        description="خدمة تتيح لموظفي الاتحاد متابعة جميع الطلبات الواردة وإدارتها بكفاءة"
      />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-md">
            <Card className="border-border bg-card shadow-sm">
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="mb-6 grid w-full grid-cols-2 bg-secondary">
                    <TabsTrigger 
                      value="login" 
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      تسجيل الدخول
                    </TabsTrigger>
                    <TabsTrigger 
                      value="register"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      إنشاء حساب موظف
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login" className="mt-0">
                    <StaffLoginForm />
                  </TabsContent>
                  
                  <TabsContent value="register" className="mt-0">
                    <StaffRegisterForm />
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
