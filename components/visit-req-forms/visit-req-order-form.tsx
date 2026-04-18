"use client"

import { useState , useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Mail, Upload, CalendarIcon, Check, ChevronsUpDown} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OTPVerification } from "@/components/otp_verification"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format, isBefore, startOfDay } from "date-fns"
import { ar } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from 'next/navigation'
import { useUploadThing } from "@/lib/uploadthing"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"

/* ------------------ Schema ------------------ */

const MAX_SIZE = 30 * 1024 * 1024 // 30MB
const ALLOWED_LICENSE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
]
type VisitReqOrderFormProps = {
  defaultClubName?: string
  defaultEmail?: string
}

const registerSchema = z.object({
  email: z.string().email("يرجى إدخال بريد إلكتروني صحيح"),
  clubName: z.string().min(2, "اسم النادي مطلوب"),
  licenseExpiry: z.date({ required_error: "يرجى اختيار تاريخ انتهاء الرخصة" }),
  city: z.string().min(1, "يرجى اختيار المدينة"),
  nafesLicense: z
    .instanceof(File)
    .refine(file => file.size <= MAX_SIZE, "الحد الأقصى 30 ميجابايت ")
    .refine(file => ALLOWED_LICENSE_TYPES.includes(file.type), "نوع الملف غير مدعوم"),
  clubImages: z
    .array(z.instanceof(File))
    .min(1, "يرجى رفع صورة واحدة على الأقل")
    .refine(files => files.every(file => file.size <= MAX_SIZE), "يجب أن يكون حجم كل صورة أقل من 30 ميجابايت"),
})

type RegisterFormData = z.infer<typeof registerSchema>

/* ------------------ Component ------------------ */

export function VisitReqOrderForm({ defaultClubName, defaultEmail }: VisitReqOrderFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showOTP, setShowOTP] = useState(false)
  const [email, setEmail] = useState( defaultEmail || "" )
  const [userId, setUserId] = useState<string | null>(null)
  const [licenseFile, setLicenseFile] = useState<File | null>(null)
  const [clubFiles, setClubFiles] = useState<File[]>([])
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false)
  const [lastFormData, setLastFormData] = useState<RegisterFormData | null>(null)
  const [open, setOpen] = useState(false)
  // التعديل 2: منطق المدن
  const [cities, setCities] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const { toast } = useToast()
  const { startUpload } = useUploadThing("clubSubmission")
  const { register, handleSubmit, setValue, formState: { errors }, watch } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
     defaultValues: {
      clubName: defaultClubName || "", // prefill if available
      email: defaultEmail || "", // prefill if available
      city: "", // default empty, user must select
    },
  })
  const selectedCity = watch("city")

  useEffect(() => {
    fetch("/data/cities.json")
      .then(res => res.json())
      .then(data => setCities(data))
      .catch(err => console.error("Error loading cities", err))
  }, [])

  const filteredCities = useMemo(() => {
    const uniqueCityNames = Array.from(new Set(cities.map((c: any) => c.name.ar)))
    if (!searchTerm) return uniqueCityNames.slice(0, 50)
    return uniqueCityNames.filter((name: any) => name.includes(searchTerm)).slice(0, 50)
  }, [searchTerm, cities])

  /* ------------------ Submit ------------------ */

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setLastFormData(data)
    setEmail(data.email)

    try {
      // Create user first
      const res = await fetch("/api/insert-new-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, role: "club" }),
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

  /* ------------------ OTP ------------------ */

 const handleOTPVerify = async () => {
  if (!userId || !lastFormData || !licenseFile || clubFiles.length === 0) return

  setIsLoading(true)

  try {
    const metadata = {
      userId,
      clubName: lastFormData.clubName,
      city: lastFormData.city,
      licenseExpiry: lastFormData.licenseExpiry.toISOString(),
      email: lastFormData.email,
    }

    // Upload license first
    const licenseUpload = await startUpload([licenseFile], metadata)
    if (!licenseUpload || !licenseUpload[0])
      throw new Error("فشل رفع الرخصة")

    // Upload club images
    const clubUploads = await startUpload(clubFiles, metadata)
    if (!clubUploads)
      throw new Error("فشل رفع الصور")

    const licenseUrl = licenseUpload[0].ufsUrl
    const clubUrls = clubUploads.map(f => f.ufsUrl)

    // Save to DB
    const dbRes = await fetch("/api/submit-visit-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        clubName: lastFormData.clubName,
        licenseExpiry: lastFormData.licenseExpiry.toISOString(),
        email: lastFormData.email,
        city: lastFormData.city,
        licenseUrl,
        clubUrls,
      }),
    })

    const dbResult = await dbRes.json()
    if (!dbRes.ok) throw new Error(dbResult.error)

    toast({
      title: "تم",
      description: "تم إنشاء النادي وطلب الزيارة بنجاح",
    })

    setShowOTP(false)
    router.push("/club-dashboard")

  } catch (err: any) {
    console.error(err)
    toast({
      title: "خطأ",
      description: err.message || "حدث خطأ أثناء رفع الملفات",
      variant: "destructive",
    })
  } finally {
    setIsLoading(false)
  }
}

  const handleBackFromOtp = () => setShowOTP(false)



  return (
    <>
      {!showOTP && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Club Name */}
          <div className="space-y-2">
            <Label htmlFor="clubName">اسم النادي</Label>
            <Input id="clubName" placeholder="أدخل اسم النادي" {...register("clubName")} />
            {errors.clubName && <p className="text-sm text-destructive">{errors.clubName.message}</p>}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="example@domain.com"
                className="pr-10 text-left placeholder:text-right"
                dir="ltr"
                {...register("email")}
              />
            </div>
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
  <Label>المدينة</Label>
  <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between font-normal text-right"
      >
        {selectedCity ? selectedCity : "اختر المدينة"}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
      <Command>
        {/* Command handles the search automatically, no need for your own searchTerm state unless you are fetching from an API */}
        <CommandInput placeholder="ابحث عن مدينة..." className="text-right h-9" />
        <CommandEmpty>لم يتم العثور على مدينة.</CommandEmpty>
        <CommandGroup>
          <ScrollArea className="h-[200px]">
            {allCities.map((cityName, index) => (
              <CommandItem
                key={index}
                value={cityName}
                onSelect={(currentValue) => {
                  setValue("city", currentValue, { shouldValidate: true })
                  setOpen(false) // Close popover after selection
                }}
                className="text-right"
              >
                {cityName}
                <Check
                  className={cn(
                    "mr-auto h-4 w-4",
                    selectedCity === cityName ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
          </ScrollArea>
        </CommandGroup>
      </Command>
    </PopoverContent>
  </Popover>
  {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
</div>

          {/* License Expiry & Uploads */}
          <div className="space-y-2">
            <Label>تاريخ انتهاء رخصة نافس</Label>
            <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" className={cn("w-full justify-start text-right font-normal", !date && "text-muted-foreground")}>
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: ar }) : "اختر تاريخاً"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => {
                    if (!newDate) return
                    setDate(newDate)
                    setValue("licenseExpiry", newDate, { shouldValidate: true })
                    setIsDatePopoverOpen(false)
                  }}
                  disabled={(d) => isBefore(startOfDay(d), startOfDay(new Date()))}
                  locale={ar}
                />
              </PopoverContent>
            </Popover>
            {errors.licenseExpiry && <p className="text-sm text-destructive">{errors.licenseExpiry.message}</p>}
          </div>

          {/* License File */}
          <div className="space-y-2">
            <Label>رخصة نافس</Label>
            <div onClick={() => document.getElementById("nafesUpload")?.click()} className="relative cursor-pointer rounded-lg border border-dashed border-border p-4 hover:bg-muted transition">
              <Upload className="absolute right-4 top-4 h-5 w-5 text-muted-foreground" />
              <input
                id="nafesUpload"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setLicenseFile(file)
                  setValue("nafesLicense", file, { shouldValidate: true })
                }}
              />
              {licenseFile ? (
                <div className="pr-10 text-sm">
                  <p className="font-medium">{licenseFile.name}</p>
                  <button type="button" className="mt-2 text-destructive text-xs" onClick={(e) => { e.stopPropagation(); setLicenseFile(null); setValue("nafesLicense", undefined as any) }}>إزالة الملف</button>
                </div>
              ) : (
                <div className="pr-10 text-sm text-muted-foreground">
                  اضغط لرفع الملف
                  <p className="text-xs mt-1">الصيغ المسموحة: PDF, DOCX, JPG, PNG — الحد الأقصى 30 ميجابايت</p>
                </div>
              )}
            </div>
            {errors.nafesLicense && <p className="text-sm text-destructive">{errors.nafesLicense.message}</p>}
          </div>

          {/* Club Images */}
          <div className="space-y-2">
            <Label>صور من مرافق النادي</Label>
            <div onClick={() => document.getElementById("clubUpload")?.click()} className="relative cursor-pointer rounded-lg border border-dashed border-border p-4 hover:bg-muted transition">
              <Upload className="absolute right-4 top-4 h-5 w-5 text-muted-foreground" />
              <input
                id="clubUpload"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  if (!files.length) return
                  const updated = [...clubFiles, ...files]
                  setClubFiles(updated)
                  setValue("clubImages", updated, { shouldValidate: true })
                }}
              />
              {clubFiles.length > 0 ? (
                <div className="space-y-2 pr-10 text-sm">
                  {clubFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between rounded bg-muted px-2 py-1">
                      <span className="truncate">{file.name}</span>
                      <button type="button" className="text-destructive text-xs" onClick={(e) => {
                        e.stopPropagation()
                        const updated = clubFiles.filter((_, i) => i !== index)
                        setClubFiles(updated)
                        setValue("clubImages", updated, { shouldValidate: true })
                      }}>إزالة</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pr-10 text-sm text-muted-foreground">
                  اضغط لرفع الصور
                  <p className="text-xs mt-1">جميع صيغ الصور مسموحة — الحد الأقصى 30 ميجابايت لكل صورة</p>
                </div>
              )}
            </div>
            {errors.clubImages && <p className="text-sm text-destructive">{errors.clubImages.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              "إرسال"
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