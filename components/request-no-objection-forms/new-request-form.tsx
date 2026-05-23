"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, User, Award as IdCard, Hash, Mail, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OTPVerification } from "@/components/otp_verification"

const newRequestSchema = z.object({
  riderId: z.string().length(8, "رقم الفارس يجب أن يكون 8 أرقام").regex(/^\d+$/, "رقم الفارس يجب أن يحتوي على أرقام فقط"),
  name: z.string().min(2, "الاسم مطلوب"),
  nationalId: z.string().length(10, "رقم الهوية يجب أن يكون 10 أرقام").regex(/^\d+$/, "رقم الهوية يجب أن يحتوي على أرقام فقط"),
  email: z.string().email("يرجى إدخال بريد إلكتروني صحيح"),
  countryName: z.string().min(1, "اسم الدولة مطلوب"),
})





type NewRequestFormData = z.infer<typeof newRequestSchema>

export function NewLeaveRequestForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showOTP, setShowOTP] = useState(false)
  const [email, setEmail] = useState("")
  const [userId, setUserId] = useState("")
  const [formData, setFormData] = useState<NewRequestFormData | null>(null)
  
  // States الخاصة برقم الفارس والجلب التلقائي
  const [isCheckingRider, setIsCheckingRider] = useState(false)
  const [riderError, setRiderError] = useState("")
  const [autoFilled, setAutoFilled] = useState({ name: false, nationalId: false })

  const { toast } = useToast()
  const role = "requester"
  const router = useRouter()

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<NewRequestFormData>({
    resolver: zodResolver(newRequestSchema),
  })

  const watchedRiderId = watch("riderId")

  // دالة مساعدة لفك القفل عن الحقول
  const unlockFields = () => {
    setAutoFilled({ name: false, nationalId: false })
  }

  // التحقق من رقم الفارس وجلب البيانات
  useEffect(() => {
    if (watchedRiderId && watchedRiderId.length === 8) {
      const checkRiderId = async () => {
        setIsCheckingRider(true)
        setRiderError("")
        try {
          const checkRes = await fetch(`/api/check-riderid`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: watchedRiderId })
          })

          if (checkRes.status === 404) {
            setRiderError("رقم الفارس غير صحيح أو لا يوجد")
            unlockFields()
          } else if (!checkRes.ok) {
            setRiderError("حدث خطأ أثناء التحقق من رقم الفارس")
            unlockFields()
          } else {
            const rawData = await checkRes.json()
            const riderData = Array.isArray(rawData) ? rawData[0] : rawData.data || rawData

            const lockedState = { name: false, nationalId: false }

            if (riderData?.arabicFullName) {
              setValue("name", riderData.arabicFullName, { shouldValidate: true, shouldDirty: true, shouldTouch: true })
              lockedState.name = true
            }
            if (riderData?.nationalId) {
              setValue("nationalId", riderData.nationalId, { shouldValidate: true, shouldDirty: true, shouldTouch: true })
              lockedState.nationalId = true
            }

            setAutoFilled(lockedState)

            toast({
              title: "تم التحقق بنجاح",
              description: "تم سحب بيانات الفارس المعتمدة تلقائياً.",
              variant: "default",
            })
          }
        } catch (err) {
          console.error("Fetch error:", err)
          setRiderError("فشل الاتصال بالخادم للتحقق من الرقم")
          unlockFields()
        } finally {
          setIsCheckingRider(false)
        }
      }

      checkRiderId()
    } else {
      setRiderError("")
      unlockFields()
    }
  }, [watchedRiderId, setValue, toast])

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
    if (!formData || !userId) return
    setIsLoading(true)
    try {
      // إرسال البيانات المباشرة بدون رفع ملفات
      const res = await fetch("/api/insert-req-no-obj-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rider_id: formData.riderId,
          full_name: formData.name,
          national_id: formData.nationalId,
          countryName: formData.countryName,
          email: formData.email,
          user_id: userId,
        }),
      })
      
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

      toast({
        title: "نجاح",
        description: "تم إنشاء طلب عدم ممانعة بنجاح",
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
            
            {/* Rider ID */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="riderId">رقم العضوية</Label>
              <div className="relative">
                {isCheckingRider ? (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                ) : (
                  <Hash className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                )}
                <Input
                  id="riderId"
                  placeholder="xxxxxxxx"
                  maxLength={8}
                  {...register("riderId")}
                  className={`pr-10 ${riderError ? "border-destructive" : ""}`}
                />
              </div>
              {riderError && <p className="text-sm text-destructive">{riderError}</p>}
              {errors.riderId && <p className="text-sm text-destructive">{errors.riderId.message}</p>}
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">الاسم</Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  id="name" 
                  placeholder="الاسم الكامل" 
                  {...register("name")} 
                  className={`pr-10 ${autoFilled.name ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""}`}
                  readOnly={autoFilled.name}
                />
              </div>
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            {/* National ID */}
            <div className="space-y-2">
              <Label htmlFor="nationalId">رقم الهوية</Label>
              <div className="relative">
                <IdCard className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  id="nationalId" 
                  placeholder="1234567890" 
                  maxLength={10} 
                  {...register("nationalId")} 
                  className={`pr-10 ${autoFilled.nationalId ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""}`}
                  readOnly={autoFilled.nationalId}
                />
              </div>
              {errors.nationalId && <p className="text-sm text-destructive">{errors.nationalId.message}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input  
                  id="email" 
                  placeholder="example@domain.com" 
                  {...register("email")} 
                  className="pr-10 text-left placeholder:text-right" 
                  dir="ltr"
                />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            {/* Country Name */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="countryName">اسم الدولة التي سيتم المشاركة فيها</Label>
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  id="countryName" 
                  placeholder="اسم الدولة"  
                  {...register("countryName")} 
                  className="pr-10 text-left placeholder:text-right uppercase" 
                  dir="ltr" 
                />
              </div>
              {errors.countryName && <p className="text-sm text-destructive">{errors.countryName.message}</p>}
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