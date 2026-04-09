"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import{useToast} from "@/hooks/use-toast"


import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, User, Award as IdCard, Building2, Phone, Mail, Ruler, Weight, DollarSign, Heart, MapPin , Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { OTPVerification } from "@/components/otp_verification"
import { useUploadThing } from "@/lib/uploadthing"

const MAX_SIZE = 30 * 1024 * 1024 // 30MB
const ALLOWED_LICENSE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
]



const newRequestSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  nationalId: z.string().length(10, "رقم الهوية يجب أن يكون 10 أرقام").regex(/^\d+$/, "رقم الهوية يجب أن يحتوي على أرقام فقط"),
  email: z.string().email("يرجى إدخال بريد إلكتروني صحيح"),
  campionshipName: z.string().min(1, "اسم البطولة مطلوب"),
  knightLicense: z
      .instanceof(File)
      .refine(file => file.size <= MAX_SIZE, "الحد الأقصى 30 ميجابايت ")
      .refine(file => ALLOWED_LICENSE_TYPES.includes(file.type), "نوع الملف غير مدعوم"),
 

})

type NewRequestFormData = z.infer<typeof newRequestSchema>

export function NewLeaveRequestForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showOTP, setShowOTP] = useState(false)
  const [email, setEmail] = useState("")
  const [userId, setUserId] = useState("")
  const [knightLicenseFile, setKnightLicenseFile] = useState<File | null>(null)
  const [formData, setFormData] = useState<NewRequestFormData | null>(null)
  const { toast } = useToast()
  const { startUpload } = useUploadThing("knightLicenseSubmission")

  const role = "requester"

  const router = useRouter()


  const { register, handleSubmit, setValue, formState: { errors } } = useForm<NewRequestFormData>({
    resolver: zodResolver(newRequestSchema),
  })

  
  const onSubmit = async (data: NewRequestFormData) => {
    setIsLoading(true)
    setEmail(data.email)
    setFormData(data)

    try {
      // Create user first
      const res = await fetch("/api/insert-new-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, role: role }),
      })

      const result = await res.json()
      if (!res.ok) {
        toast({
          title: "خطأ",
          description: result.error || "حدث خطأ غير متوقع",
          variant: "destructive",
        })
        return
      }

      setUserId(result.user.user_id)
      setShowOTP(true) 
    } catch (err) {
       toast({
          title: "خطأ",
          description: (err as Error).message || "حدث خطأ غير متوقع",
          variant: "destructive",
        })
    } finally {
      setIsLoading(false)
    }
  }


  const handleOTPVerify = async () => {
    if (!formData || !userId || !knightLicenseFile) return
    setIsLoading(true)
    try {

      const metadata = {
      userId,
      fullName: formData.name,
      
      email: formData.email,
    }

    // Upload license first
    const licenseUpload = await startUpload([knightLicenseFile], metadata)
    if (!licenseUpload || !licenseUpload[0])
      throw new Error("فشل رفع البطاقة. يرجى المحاولة مرة أخرى.")

    const licenseUrl = licenseUpload[0].ufsUrl

      const res = await fetch("/api/insert-req-cert-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: formData.name,
          national_id: formData.nationalId,
          championship_name: formData.campionshipName,
          email: formData.email,
          knight_license_url: licenseUrl,
          user_id: userId,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

        toast({
          title: "نجاح",
          description: "تم إنشاء طلب المشهد بنجاح",
        })
      router.push("/leave_req_home")

    } catch (err) {
        toast({
          title: "خطأ",
          description: (err as Error).message || "حدث خطأ غير متوقع",
          variant: "destructive",
        })
    } finally {
      setIsLoading(false)
      setShowOTP(false)
    }
  }

  const handleBackFromOtp = () => {
    setShowOTP(false)
  }

  return (
    <>
      {!showOTP && (
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">الاسم الرباعي</Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="name" placeholder="الاسم الكامل" {...register("name")} className="pr-10" />
              </div>
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            {/* National ID */}
            <div className="space-y-2">
              <Label htmlFor="nationalId">رقم الهوية</Label>
              <div className="relative">
                <IdCard className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="nationalId" placeholder="1234567890" maxLength={10} {...register("nationalId")} className="pr-10"   />
              </div>
              {errors.nationalId && <p className="text-sm text-destructive">{errors.nationalId.message}</p>}
            </div>

            
            {/* Email */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input  id="email" placeholder="example@domain.com" {...register("email")} className="pr-10 text-left placeholder:text-right" dir="ltr"   />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

           

            {/* National Address */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="campionshipName">اسم البطولة التي تم المشاركة فيها</Label>
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="campionshipName" placeholder="اسم البطولة"  {...register("campionshipName")} className="pr-10 text-left placeholder:text-right uppercase" dir="ltr" />
              </div>
              
              {errors.campionshipName && <p className="text-sm text-destructive">{errors.campionshipName.message}</p>}
            </div>
          </div>

           <div className="space-y-2">
                      <Label>ارفاق بطاقة الفارس</Label>
                      <div onClick={() => document.getElementById("knightUpload")?.click()} className="relative cursor-pointer rounded-lg border border-dashed border-border p-4 hover:bg-muted transition">
                        <Upload className="absolute right-4 top-4 h-5 w-5 text-muted-foreground" />
                        <input
                          id="knightUpload"
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            setKnightLicenseFile(file)
                            setValue("knightLicense", file, { shouldValidate: true })
                          }}
                        />
                        {knightLicenseFile ? (
                          <div className="pr-10 text-sm">
                            <p className="font-medium">{knightLicenseFile.name}</p>
                            <button type="button" className="mt-2 text-destructive text-xs" onClick={(e) => { e.stopPropagation(); setKnightLicenseFile(null); setValue("knightLicense", undefined as any) }}>إزالة الملف</button>
                          </div>
                        ) : (
                          <div className="pr-10 text-sm text-muted-foreground">
                            اضغط لرفع الملف
                            <p className="text-xs mt-1">الصيغ المسموحة: PDF, DOCX, JPG, PNG — الحد الأقصى 30 ميجابايت</p>
                          </div>
                        )}
                      </div>
                      {errors.knightLicense && <p className="text-sm text-destructive">{errors.knightLicense.message}</p>}
                    </div>

          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري إرسال الطلب...
              </>
            ) : (
              "إرسال الطلب"
            )}
          </Button>
        </form>
      )}

      {showOTP && (
        <OTPVerification
          email={email}
          user_id={userId}
          onVerified={handleOTPVerify}
          onBack={handleBackFromOtp}
        />
      )}
    </>
  )
}
