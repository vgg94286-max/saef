"use client"

import { PageHeader } from "@/components/page-header"
import { Footer } from "@/components/footer"
import { ClubLoginForm } from "@/components/club-forms-wrapper/club-login-form"

import { Card, CardContent } from "@/components/ui/card"

export default function ClubsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PageHeader 
        title="دخول الأندية" 
        description="خدمة تمكّن الأندية المسجلة من متابعة طلبات الزيارة و رفع طلبات إنشاء البطولات الخاصة إلكترونيًا بكل سهولة"
      />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-md">
            <Card className="border-border bg-card shadow-sm">
              <CardContent className="p-6 space-y-6">
                
                
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-semibold">تسجيل الدخول</h2>
                  <p className="text-sm text-muted-foreground">
                    أدخل ايميل النادي للوصول إلى لوحة التحكم
                  </p>
                </div>

                <ClubLoginForm />

              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}