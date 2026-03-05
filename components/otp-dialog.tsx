"use client"

import { useState, useRef, type KeyboardEvent, type ClipboardEvent } from "react"
import { Loader2, Mail } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface OTPDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  email: string
  onVerify: (otp: string) => Promise<void>
}

export function OTPDialog({ open, onOpenChange, email, onVerify }: OTPDialogProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState("")
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return
    
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError("")

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").slice(0, 6)
    const newOtp = [...otp]
    
    for (let i = 0; i < pastedData.length; i++) {
      if (/^\d$/.test(pastedData[i])) {
        newOtp[i] = pastedData[i]
      }
    }
    
    setOtp(newOtp)
    
    // Focus the next empty input or the last one
    const nextEmptyIndex = newOtp.findIndex(val => !val)
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus()
    } else {
      inputRefs.current[5]?.focus()
    }
  }

  const handleVerify = async () => {
    const otpString = otp.join("")
    
    if (otpString.length !== 6) {
      setError("يرجى إدخال رمز التحقق كاملاً")
      return
    }

    setIsVerifying(true)
    try {
      await onVerify(otpString)
      setOtp(["", "", "", "", "", ""])
    } catch {
      setError("رمز التحقق غير صحيح")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    // Resend OTP logic
    console.log("[v0] Resending OTP to:", email)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">تحقق من بريدك الإلكتروني</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            تم إرسال رمز التحقق إلى
            <br />
            <span className="font-medium text-foreground" dir="ltr">{email}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex justify-center gap-2" dir="ltr">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="h-12 w-12 text-center text-lg font-semibold"
              />
            ))}
          </div>
          
          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}

          <Button 
            onClick={handleVerify} 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isVerifying}
          >
            {isVerifying ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري التحقق...
              </>
            ) : (
              "تأكيد"
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              لم تستلم الرمز؟ <span className="font-medium text-primary">إعادة الإرسال</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
