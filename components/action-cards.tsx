"use client"

import Link from "next/link"
import { ArrowRight, Building2, FileText, Users, Flag } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const actions = [
  {
    title: "طلب زيارة",
    description:
      "خدمة تمكّن الأندية من رفع طلبات زيارة رسمية لاعتمادها من قبل الاتحاد ",
    cta: "اطلب الآن",
    href: "/visit-req",
    icon: Building2,
  },
  {
    title: "دخول الأندية",
    description:
      "خدمة تمكّن الأندية المسجلة من متابعة طلبات الزيارة و رفع طلبات إنشاء البطولات الخاصة إلكترونيًا بكل سهولة",
    cta: "دخول",
    href: "/clubs",
    icon: Flag,
  },
  {
    title: "طلب تفرغ",
    description:
      "خدمة تتيح للفرسان والمحكمين إصدار طلبات تفرغ رسمية معتمدة.",
    cta: "اطلب الآن",
    href: "/leave-request",
    icon: FileText,
  },
  {
    title: "دخول موظفي الاتحاد",
    description:
      "منصة داخلية لموظفي الاتحاد لمتابعة وإدارة الطلبات بكفاءة.",
    cta: "تسجيل الدخول",
    href: "/staff",
    icon: Users,
  },
]

export function ActionCards() {
  return (
    <section id="serv" dir="rtl" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="mb-14 text-center">
          <h2 className="mb-4 text-2xl md:text-3xl font-bold">
            الخدمات الرئيسية
          </h2>
          <p className="text-muted-foreground">
            اختر الخدمة المناسبة للمتابعة
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {actions.map((action) => (
            <Link key={action.href} href={action.href} className="group">
              <Card className="h-full border transition-all duration-300 hover:border-primary hover:shadow-md">
                <CardHeader className="pb-4">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <action.icon className="h-7 w-7" />
                  </div>

                  <CardTitle className="text-xl font-bold">
                    {action.title}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <CardDescription className="mb-6 text-base leading-relaxed">
                    {action.description}
                  </CardDescription>

                  <div className="flex items-center gap-2 font-medium text-primary">
                    <span>{action.cta}</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
