"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Mail, ClipboardCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OTPVerification } from "@/components/otp_verification"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

const loginSchema = z.object({
  email: z.string().email("يرجى إدخال بريد إلكتروني صحيح"),
})

type LoginFormData = z.infer<typeof loginSchema>

export function PreviousRequestsForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showOTP, setShowOTP] = useState(false)
  const [email, setEmail] = useState("")
  const [userId, setUserId] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // Phase 1: Check if user exists and send OTP
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setEmail(data.email)

    try {
      const res = await fetch("/api/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Using "leave" role to distinguish from "club"
        body: JSON.stringify({ email: data.email, role: "requester" }), 
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

      setUserId(result.userId)
      setShowOTP(true)
    } catch (err) {
      toast({ title: "خطأ", description: (err as Error).message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  
  const handleOTPVerify = async () => {
    try {
      const res = await fetch("/api/leave-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

      toast({
        title: "نجاح",
        description: "تم التحقق بنجاح! يتم الآن توجيهك لطلبات التفرغ الخاصة بك.",
      })

      setShowOTP(false)
      router.push("/leave_req_home") 
    } catch (err) {
      toast({
        title: "خطأ",
        description: (err as Error).message || "حدث خطأ أثناء تسجيل الدخول",
        variant: "destructive",
      })
      setShowOTP(false)
      
    }
  }

  const handleBackFromOtp = () => setShowOTP(false)

  return (
    <div className="w-full max-w-md mx-auto p-4">
      {!showOTP && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <ClipboardCheck className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold">متابعة طلبات التفرغ</h2>
            <p className="text-sm text-muted-foreground">أدخل بريدك الإلكتروني لمتابعة حالة طلباتك السابقة</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="leave-email">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="leave-email"
                  type="email"
                  placeholder="example@domain.com"
                  className="pr-10 text-left placeholder:text-right"
                  dir="ltr"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full bg-[#1B4332] hover:bg-[#2D6A4F]" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التحقق...
                </>
              ) : (
                "متابعة"
              )}
            </Button>
          </form>
        </div>
      )}

      {showOTP && (
        <OTPVerification
          email={email}
          user_id={userId!}
          onVerified={handleOTPVerify}
          onBack={handleBackFromOtp}
        />
      )}
    </div>
  )
}