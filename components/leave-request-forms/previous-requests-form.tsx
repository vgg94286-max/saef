"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Mail, FileSearch } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OTPDialog } from "@/components/otp-dialog"

const previousRequestsSchema = z.object({
  email: z.string().email("يرجى إدخال بريد إلكتروني صحيح"),
})

type PreviousRequestsFormData = z.infer<typeof previousRequestsSchema>

export function PreviousRequestsForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showOTP, setShowOTP] = useState(false)
  const [email, setEmail] = useState("")

  const { register, handleSubmit, formState: { errors } } = useForm<PreviousRequestsFormData>({
    resolver: zodResolver(previousRequestsSchema),
  })

  const onSubmit = async (data: PreviousRequestsFormData) => {
    setIsLoading(true)
    setEmail(data.email)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsLoading(false)
    setShowOTP(true)
  }

  const handleOTPVerify = async (otp: string) => {
    console.log("[v0] OTP verified:", otp)
    // Handle OTP verification and fetch previous requests
    await new Promise(resolve => setTimeout(resolve, 1000))
    setShowOTP(false)
    // Show previous requests or redirect
  }

  return (
    <>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <FileSearch className="h-8 w-8 text-primary" />
        </div>
        <p className="text-muted-foreground">
          أدخل بريدك الإلكتروني للاطلاع على طلباتك السابقة
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="previous-email" className="text-foreground">البريد الإلكتروني</Label>
          <div className="relative">
            <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="previous-email"
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

        <Button 
          type="submit" 
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              جاري البحث...
            </>
          ) : (
            "عرض الطلبات السابقة"
          )}
        </Button>
      </form>

      <OTPDialog 
        open={showOTP} 
        onOpenChange={setShowOTP}
        email={email}
        onVerify={handleOTPVerify}
      />
    </>
  )
}
