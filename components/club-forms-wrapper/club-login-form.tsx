"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Mail } from "lucide-react"
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

export function ClubLoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showOTP, setShowOTP] = useState(false)
  const [email, setEmail] = useState("")
  const [userId, setUserId] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setEmail(data.email)

    try {
      
      const res = await fetch("/api/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email , role: "club" }),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

      setUserId(result.userId)
      setShowOTP(true)
    } catch (err) {

      toast ({ title: "خطأ", description: (err as Error).message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOTPVerify = async () => {
    
    try {
      const res = await fetch("/api/club-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email}),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
        
       toast({
          title: "نجاح",
          description: "تم تسجيل الدخول بنجاح! "
          
        })

  

    setShowOTP(false)
    router.push("/club-dashboard")
      } catch (err) {
        toast({
          title: "خطأ",
          description: (err as Error).message || "حدث خطأ غير متوقع أثناء التحقق",
          variant: "destructive",
        })
       setShowOTP(false) 
       router.push("/clubs")

      }
    
  }

  const handleBackFromOtp = () => setShowOTP(false)

  return (
    <>
      {!showOTP && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="login-email">البريد الإلكتروني</Label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="login-email"
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

          <Button type="submit" className="w-full" disabled={isLoading}>
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
      )}

      {showOTP && (
        <OTPVerification
          email={email}
          user_id={userId!}
          onVerified={handleOTPVerify}
          onBack={handleBackFromOtp}
        />
      )}
    </>
  )
}