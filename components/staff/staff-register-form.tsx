"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Mail, Lock, User, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OTPVerification } from "@/components/otp_verification"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const schema = z.object({
  staffName: z.string().min(2, "اسم الموظف مطلوب"),

  email: z.string().email("يرجى إدخال بريد إلكتروني صحيح"),

  committee: z.string().min(1, "يرجى اختيار اللجنة"), // الحقل الجديد

  password: z.string().min(8, "8 أحرف على الأقل"),
})
const COMMITTEES = [
  "لجنة التقاط الأوتاد",
  "لجنة الترويض",
  "لجنة سباقات القدرة والتحمل",
  "لجنة قفز الحواجز",
  "لجنة البولو",
  "لجنة الرماية من على ظهر الخيل",
  "أخرى"
]

type FormData = z.infer<typeof schema>

export function StaffRegisterForm() {
  const [showOTP, setShowOTP] = useState(false)
  const [email, setEmail] = useState("")
  const [userId, setUserId] = useState<string | null>(null)
 
  const [lastFormData, setLastFormData] = useState<FormData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const { register, handleSubmit,setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      committee: ""
    }
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setLastFormData(data)
     try {
      // Create user first
      const res = await fetch("/api/insert-new-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, role: "staff" }),
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
      setEmail(data.email)
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

    try {
      const res = await fetch("/api/staff/create-staff-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: lastFormData?.email,
          password: lastFormData?.password,
          staffName: lastFormData?.staffName,
          committee: lastFormData?.committee,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        toast({ title: "خطأ", description: result.error, variant: "destructive" })
        return
      }


        toast({
          title: "نجاح",
          description: "تم إنشاء حساب الموظف بنجاح! سيتم تحويلك إلى لوحة التحكم",
        })
      
      setUserId(result.userId)
      setShowOTP(false)
      router.push("/staff-portal/portal")
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => setShowOTP(false)

  return (
    <>
      {!showOTP && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Staff Name */}
          <div className="space-y-2">
            <Label>اسم الموظف</Label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pr-10" {...register("staffName")} />
            </div>
            {errors.staffName && <p className="text-sm text-destructive">{errors.staffName.message}</p>}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label>البريد الإلكتروني</Label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pr-10" dir="ltr" {...register("email")} />
            </div>
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>اللجنة التي ينتمي إليها الموظف</Label>
            <div className="relative">
              <Users className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
              <Select onValueChange={(v) => setValue("committee", v, { shouldValidate: true })}>
                <SelectTrigger className="w-full pr-10">
                  <SelectValue placeholder="اختر اللجنة" />
                </SelectTrigger>
                <SelectContent>
                  {COMMITTEES.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {errors.committee && <p className="text-sm text-destructive">{errors.committee.message}</p>}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label>كلمة المرور</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="password" className="pr-10" {...register("password")} />
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الإرسال...
              </>
            ) : "إنشاء حساب موظف"}
          </Button>
        </form>
      )}

      {showOTP && (
        <OTPVerification
          email={email}
          user_id={userId!}
          onVerified={handleOTPVerify}
          onBack={handleBack}
        />
      )}
    </>
  )
}