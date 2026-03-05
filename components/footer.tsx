import Image from "next/image"

export function Footer() {
  return (
    <footer dir="rtl" className="border-t bg-card py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <Image
            src="/saef.png"
            alt="الاتحاد السعودي للفروسية"
            width={140}
            height={140}
            className="h-14 w-14"
          />

          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} الاتحاد السعودي للفروسية. جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </footer>
  )
}
