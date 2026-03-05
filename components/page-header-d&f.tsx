"use client"


import Image from "next/image"


interface PageHeaderProps {
  title: string
  description: string
}

export function PageHeader() {
  return (
    <header >
      <div className="container mx-auto px-4">
        <div className="flex justify-end">
          
          <Image
            src="/Saef.png"
            alt="الاتحاد السعودي للفروسية"
            width={200}
            height={200}
            className="h-18 w-18"
          />
        </div>
      </div>
      
       
      
    </header>
  )
}
