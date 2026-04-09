"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"

interface PageHeaderProps {
  title: string
  description: string
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground">
            <ArrowRight className="h-5 w-5" />
            <span className="text-sm font-medium">العودة للرئيسية</span>
          </Link>
          <Image
            src="/Saef.png"
            alt="الاتحاد السعودي للفروسية والبولو"
            width={200}
            height={200}
            className="h-25 w-25"
          />
        </div>
      </div>
      <div className="bg-gradient-to-b from-secondary/50 to-background py-8 md:py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">
            {title}
          </h1>
          <p className="text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </header>
  )
}
