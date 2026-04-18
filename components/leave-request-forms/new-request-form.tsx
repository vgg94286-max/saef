"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, User, Award, Building2, Phone, Mail, Hash, Map, Trophy, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { OTPVerification } from "@/components/otp_verification"

// Updated Schema based on your new DB columns
const newRequestSchema = z.object({
  name: z.string().min(2, "الاسم الرباعي مطلوب"),
  nationalId: z.string().length(10, "رقم الهوية يجب أن يكون 10 أرقام"),
  employment_name: z.string().min(2, "جهة العمل مطلوبة"),
  phone: z.string().min(10, "رقم الجوال مطلوب (10 أرقام)"),
  email: z.string().email("بريد إلكتروني غير صحيح"),
  rider_id: z.string().length(8, "رقم الفارس يجب أن يكون 8 أرقام"),
  requester_type: z.enum(["مدرب", "حكم", "فارس"], { 
    required_error: "يرجى اختيار نوع مقدم الطلب" 
  }),
  region: z.string().min(1, "يرجى اختيار المنطقة"),
  cham_name: z.string().min(1, "يرجى اختيار البطولة"),
  employment_student_num: z.string().min(5, "الرقم الوظيفي/الجامعي مطلوب (5 أرقام على الأقل)"),
})

interface Region {
  id: number;
  nameAr: string;
}

type NewRequestFormData = z.infer<typeof newRequestSchema>

export function NewLeaveRequestForm({ defaultNationalId, defaultEmail }: { defaultNationalId?: string, defaultEmail?: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [showOTP, setShowOTP] = useState(false)
  const [email, setEmail] = useState("")
  const [userId, setUserId] = useState("")
  const [formData, setFormData] = useState<NewRequestFormData | null>(null)
  
  // Data for dropdowns
  const [regions, setRegions] = useState<Region[]>([]);
  const [championships, setChampionships] = useState<{champ_id: number, champ_name: string}[]>([])

  
  const { toast } = useToast()
  const router = useRouter()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<NewRequestFormData>({
    resolver: zodResolver(newRequestSchema),
    defaultValues: {
      nationalId: defaultNationalId,
      email: defaultEmail
    }
  })

  


useEffect(() => {
  const loadData = async () => {
    try {
      // Fetch both sources at once
      const [regRes, champRes] = await Promise.all([
        fetch("/data/regions.json"),
        fetch("/api/public_champ")
      ]);

      const regData = await regRes.json();
      const champData = await champRes.json();

      // 1. Set Regions (handling your specific JSON format)
      const formattedRegions: Region[] = regData.map((reg: any) => ({
        id: reg.region_id,
        nameAr: reg.name.ar
      }));
      setRegions(formattedRegions);

      // 2. Set Championships
      // Ensure champData is the array returned from your SELECT query
      setChampionships(champData);

    } catch (err) {
      console.error("Error loading dropdown data:", err);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "تعذر تحميل قائمة المناطق أو البطولات",
        variant: "destructive",
      });
    }
  };

  loadData();
}, [toast]); // Added toast to dependency array for safety

  const onSubmit = async (data: NewRequestFormData) => {
    setIsLoading(true)
    setEmail(data.email)
    setFormData(data)

    try {
      // Create user first
      const res = await fetch("/api/insert-new-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, role: "requester" }),
      })

      const result = await res.json()

      if (res.status === 400) {
    toast({
      title: "البريد الالكتروني مسجل مسبقاً",
      description: "يرجى تسجيل الدخول عن طريق صفحة متابعة الطلبات السابقة ثم انشاء طلب جديد من هناك",
      variant: "destructive",
    })
    return
  }

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
      const res = await fetch("/api/insert-leave-req-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: formData.name,
          national_id: formData.nationalId,
          employment_name: formData.employment_name,
          phone: formData.phone,
          email: formData.email,
          rider_id: Number(formData.rider_id),
          requester_type: formData.requester_type,
          region: formData.region,
          cham_name: formData.cham_name,
          employment_student_num: formData.employment_student_num ? Number(formData.employment_student_num) : null,
          user_id: userId,
        }),
      })
      if (!res.ok) throw new Error("فشل إرسال البيانات")
      toast({ title: "نجاح", description: "تم إنشاء طلب التفرغ بنجاح" })
      router.push("/leave_req_home")
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
      setShowOTP(false)
    }
  }
  
const onInvalid = (errors: any) => {
  console.error("FORM VALIDATION FAILED:", errors);
};

  return (
    <>
      {!showOTP && (
        // This function runs ONLY when validation fails




        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-5" dir="rtl">
          <div className="grid gap-5 md:grid-cols-2">
            {/* Name */}
            <div className="space-y-2">
              <Label>الاسم الرباعي</Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input {...register("name")} className="pr-10" />
              </div>
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
  <Label>رقم الهوية الوطنية</Label>
  <div className="relative">
    {/* Ensure the name here matches "nationalId" in your Zod schema */}
    <Input 
      {...register("nationalId")} 
      maxLength={10} 
      placeholder="10xxxxxxxx"
      
       
    />
  </div>
  {errors.nationalId && (
    <p className="text-xs text-destructive">{errors.nationalId.message}</p>
  )}
</div>

            {/* Rider ID (8 digits) */}
            <div className="space-y-2">
              <Label>رقم الفارس (8 أرقام)</Label>
              <div className="relative">
                <Hash className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input {...register("rider_id")} maxLength={8} placeholder="00000000" className="pr-10" />
              </div>
              {errors.rider_id && <p className="text-xs text-destructive">{errors.rider_id.message}</p>}
            </div>

            {/* Requester Type */}
            <div className="space-y-2">
              <Label>نوع مقدم الطلب</Label>
              {/* Requester Type */}
<Select onValueChange={(v) => setValue("requester_type", v as any, { shouldValidate: true })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="فارس">فارس</SelectItem>
                  <SelectItem value="حكم">حكم</SelectItem>
                  <SelectItem value="مدرب">مدرب</SelectItem>
                </SelectContent>
              </Select>
              {errors.requester_type && <p className="text-xs text-destructive">{errors.requester_type.message}</p>}
            </div>

           {/* Employment Name */}
<div className="space-y-2">
  <Label>المسمى الوظيفي</Label>
  <div className="relative">
    <Building2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input {...register("employment_name")} className="pr-10" />
  </div>
  {errors.employment_name && <p className="text-xs text-destructive">{errors.employment_name.message}</p>}
</div>

{/* Student Number (REQUIRED) */}
<div className="space-y-2">
  <Label>الرقم الوظيفي / الجامعي</Label>
  <div className="relative">
    <GraduationCap className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input {...register("employment_student_num")} className="pr-10" />
  </div>
  {errors.employment_student_num && (
    <p className="text-xs text-destructive">{errors.employment_student_num.message}</p>
  )}
</div>

            {/* Region (Dropdown) */}
<div className="space-y-2">
  <Label>المنطقة الادارية لجهة العمل</Label>
  {/* Region */}
<Select onValueChange={(v) => setValue("region", v, { shouldValidate: true })}>
    <SelectTrigger className="w-full pr-10">
       {/* Added icon back for consistency */}
      <Map className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <SelectValue placeholder="اختر المنطقة" />
    </SelectTrigger>
    <SelectContent>
      {regions.map((reg) => (
        <SelectItem key={reg.id} value={reg.nameAr}>
          {reg.nameAr}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  {errors.region && <p className="text-xs text-destructive">{errors.region.message}</p>}
</div>

 {/* Championship Name */}
<div className="space-y-2 md:col-span-2">
  <Label>اسم البطولة</Label>
  <Select onValueChange={(v) => setValue("cham_name", v, { shouldValidate: true })}>
    <SelectTrigger className={errors.cham_name ? "border-destructive" : ""}>
      <Trophy className="ml-2 h-4 w-4 text-muted-foreground" />
      <SelectValue placeholder="اختر البطولة" />
    </SelectTrigger>
    <SelectContent>
      {Array.from(new Set(championships.map(c => c.champ_name))).map((name, index) => (
        <SelectItem key={`champ-${index}`} value={name}>
          {name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  {errors.cham_name && <p className="text-xs text-destructive">{errors.cham_name.message}</p>}
</div>
            
            {/* Phone & Email (Readonly logic remains) */}
            <div className="space-y-2">
                <Label>رقم الجوال</Label>
                <Input {...register("phone")} className="text-right" />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input {...register("email")} className="bg-slate-50" />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
          </div>

          <Button type="submit" className="w-full bg-emerald-800 hover:bg-emerald-900" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : "إرسال طلب التفرغ"}
          </Button>
        </form>
      )}

      {showOTP && (
        <OTPVerification
          email={email}
          user_id={userId}
          onVerified={handleOTPVerify}
          onBack={() => setShowOTP(false)}
        />
      )}
    </>
  )
}