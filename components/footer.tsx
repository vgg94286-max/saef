import Image from "next/image"

export function Footer() {
  return (
    <footer dir="rtl" className="border-t bg-card py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <Image
            src="/Saef.png"
            alt="الاتحاد السعودي للفروسية"
             width={200}
            height={200}
            className="h-18 w-18"
          />

         <p
  dir="rtl"
  className="text-sm text-muted-foreground text-center"
>
  © {new Date().getFullYear()} الاتحاد السعودي للفروسية والبولو. جميع الحقوق محفوظة
</p>
        </div>
      </div>
    </footer>
  )
}
