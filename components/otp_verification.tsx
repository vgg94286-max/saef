"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface OTPVerificationProps {
  email: string,
  user_id: string,
  onVerified: () => void
  onBack: () => void
}

export function OTPVerification({ email, user_id, onVerified, onBack }: OTPVerificationProps) {
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [showOtp, setShowOtp] = useState(false)
  const [successCountdown, setSuccessCountdown] = useState(3)

  useEffect(() => { sendOtp() }, [])

  useEffect(() => {
    if (resendCountdown <= 0) return
    const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCountdown])

  useEffect(() => {
    if (!success) return
    const interval = setInterval(() => {
      setSuccessCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          // Delay the parent state update to next tick
          setTimeout(() => onVerified(), 0)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [success])

  const sendOtp = async () => {
    try {
      setIsSending(true)
      setError("")
      setShowOtp(true)

      const response = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, user_id }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "فشل إرسال الكود")
        return
      }

      setResendCountdown(60)

      
    } catch (err) {
      setError("حدث خطأ في إرسال الكود")
      console.error(err)
    } finally { setIsSending(false) }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp || otp.length !== 6) {
      setError("يجب إدخال كود من 6 أرقام")
      return
    }

    try {
      setIsLoading(true)
      setError("")
      const response = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otpCode: otp, user_id }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "فشل التحقق من الكود")
        setOtp("")
        return
      }

      setSuccess(true)
      setOtp("")
     
    } catch (err) {
      setError("حدث خطأ في التحقق من الكود")
      console.error(err)
    } finally { setIsLoading(false) }
  }

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">تم التحقق!</h2>
          <p className="text-muted-foreground">تم التحقق من بريدك الإلكتروني بنجاح</p>
          <p className="text-sm text-muted-foreground mb-4">
            سيتم تحويلك خلال {successCountdown} ثوانٍ...
          </p>

        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">تحقق من بريدك الإلكتروني</CardTitle>
        <CardDescription className="text-muted-foreground">
          تم إرسال كود التحقق إلى {email}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerify} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-destructive">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="otp" className="text-foreground">كود التحقق</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="text-center text-2xl tracking-widest font-mono text-foreground placeholder:text-muted-foreground"
              disabled={isLoading || isSending}
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              أدخل الكود المكون من 6 أرقام رجاءا
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isLoading || isSending || otp.length !== 6}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "جاري التحقق..." : "تحقق من الكود"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full text-foreground border border-muted-foreground hover:bg-primary/10"
            disabled={resendCountdown > 0 || isSending}
            onClick={sendOtp}
          >
            {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {resendCountdown > 0 ? `إعادة الإرسال خلال ${resendCountdown}s` : "إعادة إرسال الكود"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full text-foreground hover:bg-primary/10"
            onClick={onBack}
            disabled={isLoading}
          >
            العودة
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
