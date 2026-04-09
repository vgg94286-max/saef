import React from "react"
import type { Metadata } from 'next'
import { IBM_Plex_Sans_Arabic } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from "@/components/ui/toaster"
import './globals.css'

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'الاتحاد السعودي للفروسية والبولو',
  description: 'الاتحاد السعودي للفروسية والبولو',
  
  icons: {
    icon: [
      {
        url: '/Saef.png',
        type: 'image/png',
      },
      {
        url: '/Saef.png',
        type: 'image/png',
      },
      {
        url: '/Saef.png',
        type: 'image/png',
      },
    ],
    apple: '/Saef.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${ibmPlexArabic.className} antialiased`}>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
