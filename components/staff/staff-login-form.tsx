"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Mail, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

const loginSchema = z.object({
  email: z.string().email("يرجى إدخال بريد إلكتروني صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
})

type LoginFormData = z.infer<typeof loginSchema>

export function StaffLoginForm() {
  const [isLoading, setIsLoading] = useState(false)

  const { toast } = useToast()
  const router = useRouter()



  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
  try {
    setIsLoading(true)

    const res = await fetch("/api/staff/staff-login", {
      method: "POST",
      body: JSON.stringify({ email: data.email, password: data.password }),
      headers: { "Content-Type": "application/json" }
    })

    const result = await res.json()

    if (!res.ok) {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: result.error,
        variant: "destructive"
      })
      return
    }

    toast({
      title: "تم تسجيل الدخول بنجاح",
      description: "سيتم تحويلك إلى لوحة التحكم",
    })

    router.push("/staff-portal/portal")

    
  } finally {
    setIsLoading(false)
  }
}

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="staff-login-email" className="text-foreground">البريد الإلكتروني</Label>
          <div className="relative">
            <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="staff-login-email"
              type="email"
              placeholder="example@saef.gov.sa"
              className="pr-10 text-left placeholder:text-right"
              dir="ltr"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="staff-login-password" className="text-foreground">كلمة المرور</Label>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="staff-login-password"
              type="password"
              placeholder="••••••••"
              className="pr-10"
              {...register("password")}
            />
          </div>
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              جاري التحقق...
            </>
          ) : (
            "تسجيل الدخول"
          )}
        </Button>
      </form>

    
    </>
  )
}
