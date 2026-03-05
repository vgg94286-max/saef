"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import{useToast} from "@/hooks/use-toast"


import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, User, Award as IdCard, Building2, Phone, Mail, Ruler, Weight, DollarSign, Heart, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { OTPVerification } from "@/components/otp_verification"
import { redirect } from "next/navigation"



const nationalAddressRegex = /^[A-Za-z]{4}[0-9]{4}$/

const newRequestSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  nationalId: z.string().length(10, "رقم الهوية يجب أن يكون 10 أرقام").regex(/^\d+$/, "رقم الهوية يجب أن يحتوي على أرقام فقط"),
  employer: z.string().min(2, "جهة العمل مطلوبة"),
  phone: z.string().min(10, "رقم الجوال مطلوب").regex(/^[0-9]+$/, "رقم الجوال يجب أن يحتوي على أرقام فقط"),
  email: z.string().email("يرجى إدخال بريد إلكتروني صحيح"),
  height: z.string().min(1, "الطول مطلوب"),
  weight: z.string().min(1, "الوزن مطلوب"),
  salary: z.string().min(1, "الراتب مطلوب"),
  maritalStatus: z.string().min(1, "الحالة الاجتماعية مطلوبة"),
  nationalAddress: z.string().regex(nationalAddressRegex, "العنوان الوطني يجب أن يكون 4 أحرف إنجليزية متبوعة بـ 4 أرقام (مثال: ABCD1234)"),
})
type LeaverFormProps = {
  defaultNationalId?: string
  defaultEmail?: string
}
type NewRequestFormData = z.infer<typeof newRequestSchema>

export function NewLeaveRequestFormLogged( { defaultNationalId, defaultEmail }: LeaverFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showOTP, setShowOTP] = useState(false)
  const [email, setEmail] = useState("")
  const [userId, setUserId] = useState("")
  const [formData, setFormData] = useState<NewRequestFormData | null>(null)
  const { toast } = useToast()

  const role = "leave_requester"

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
      const res = await fetch("/api/check-user", {
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

      setUserId(result.userId)
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
    if (!formData || !userId) return
    setIsLoading(true)
    try {
      const res = await fetch("/api/insert-leave-req-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: formData.name,
          national_id: formData.nationalId,
          employer: formData.employer,
          phone: formData.phone,
          email: formData.email,
          height_cm: Number(formData.height),
          weight_kg: Number(formData.weight),
          salary: Number(formData.salary),
          marital_status: formData.maritalStatus,
          national_address: formData.nationalAddress,
          user_id: userId,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

        toast({
          title: "نجاح",
          description: "تم إنشاء طلب التفرغ بنجاح",
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
              <Label htmlFor="name">الاسم</Label>
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
                <Input id="nationalId" placeholder="1234567890" maxLength={10} {...register("nationalId")} className="pr-10" defaultValue={defaultNationalId} readOnly />
              </div>
              {errors.nationalId && <p className="text-sm text-destructive">{errors.nationalId.message}</p>}
            </div>

            {/* Employer */}
            <div className="space-y-2">
              <Label htmlFor="employer">جهة العمل</Label>
              <div className="relative">
                <Building2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="employer" placeholder="اسم جهة العمل" {...register("employer")} className="pr-10" />
              </div>
              {errors.employer && <p className="text-sm text-destructive">{errors.employer.message}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الجوال</Label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="phone" placeholder="05xxxxxxxx" {...register("phone")} className="pr-10" />
              </div>
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input  id="email" placeholder="example@domain.com" {...register("email")} className="pr-10 text-left placeholder:text-right" dir="ltr" defaultValue={defaultEmail} readOnly />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            {/* Height */}
            <div className="space-y-2">
              <Label htmlFor="height">الطول (سم)</Label>
              <div className="relative">
                <Ruler className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="height" placeholder="170" type="number" {...register("height")} className="pr-10" />
              </div>
              {errors.height && <p className="text-sm text-destructive">{errors.height.message}</p>}
            </div>

            {/* Weight */}
            <div className="space-y-2">
              <Label htmlFor="weight">الوزن (كجم)</Label>
              <div className="relative">
                <Weight className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="weight" placeholder="70" type="number" {...register("weight")} className="pr-10" />
              </div>
              {errors.weight && <p className="text-sm text-destructive">{errors.weight.message}</p>}
            </div>

            {/* Salary */}
            <div className="space-y-2">
              <Label htmlFor="salary">الراتب (ريال)</Label>
              <div className="relative">
                <DollarSign className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="salary" placeholder="10000" type="number" {...register("salary")} className="pr-10" />
              </div>
              {errors.salary && <p className="text-sm text-destructive">{errors.salary.message}</p>}
            </div>

            {/* Marital Status */}
            <div className="space-y-2">
              <Label htmlFor="maritalStatus">الحالة الاجتماعية</Label>
              <div className="relative">
                <Heart className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
                <Select onValueChange={(value) => setValue("maritalStatus", value)}>
                  <SelectTrigger className="pr-10">
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem defaultChecked value="أعزب">أعزب</SelectItem>
                    <SelectItem value="متزوج">متزوج</SelectItem>
                    <SelectItem value="مطلق">مطلق</SelectItem>
                    <SelectItem value="أرمل">أرمل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {errors.maritalStatus && <p className="text-sm text-destructive">{errors.maritalStatus.message}</p>}
            </div>

            {/* National Address */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nationalAddress">العنوان الوطني المختصر</Label>
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="nationalAddress" placeholder="ABCD1234" maxLength={8} {...register("nationalAddress")} className="pr-10 text-left placeholder:text-right uppercase" dir="ltr" />
              </div>
              <p className="text-xs text-muted-foreground">
                4 أحرف إنجليزية متبوعة بـ 4 أرقام (مثال: ABCD1234)
              </p>
              {errors.nationalAddress && <p className="text-sm text-destructive">{errors.nationalAddress.message}</p>}
            </div>
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
