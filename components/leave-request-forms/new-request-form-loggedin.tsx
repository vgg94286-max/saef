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

export function NewLeaveRequestFormLogged({ defaultNationalId, defaultEmail }: { defaultNationalId?: string, defaultEmail?: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [showOTP, setShowOTP] = useState(false)
  const [email, setEmail] = useState("")
  const [userId, setUserId] = useState("")
  const [formData, setFormData] = useState<NewRequestFormData | null>(null)

  const [autoFilled, setAutoFilled] = useState({
    name: false,
    nationalId: false,
    phone: false,
    email: false,
  });

  // دالة مساعدة لفك القفل عن الحقول في حال حدوث خطأ أو تغيير الرقم
  const unlockFields = () => {
    setAutoFilled({ name: false, nationalId: false, phone: false , email: false});
  };

  // Data for dropdowns
  const [regions, setRegions] = useState<Region[]>([]);
  const [championships, setChampionships] = useState<{ champ_id: number, champ_name: string }[]>([])


  const { toast } = useToast()
  const router = useRouter()

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<NewRequestFormData>({
    resolver: zodResolver(newRequestSchema),
    
  })

  // 2. إنشاء حالات (States) خاصة بالتحقق الفوري
  const [isCheckingRider, setIsCheckingRider] = useState(false);
  const [riderError, setRiderError] = useState("");

  // 3. مراقبة قيمة حقل rider_id
  const watchedRiderId = watch("rider_id");

  useEffect(() => {
    if (watchedRiderId && watchedRiderId.length === 8) {
      const checkRiderId = async () => {
        setIsCheckingRider(true);
        setRiderError("");
        try {
          const checkRes = await fetch(`/api/check-riderid`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: watchedRiderId })
          });

          if (checkRes.status === 404) {
            setRiderError("رقم الفارس غير صحيح أو لا يوجد");
            unlockFields();
          } else if (!checkRes.ok) {
            setRiderError("حدث خطأ أثناء التحقق من رقم الفارس");
            unlockFields();
          } else {
            // جلب البيانات الخام
            const rawData = await checkRes.json();



            // معالجة البيانات: إذا كانت مصفوفة نأخذ العنصر الأول، وإذا كانت مغلفة بـ data نأخذها
            const riderData = Array.isArray(rawData) ? rawData[0] : rawData.data || rawData;

            // تتبع الحقول التي تم العثور عليها لقفلها
            const lockedState = { name: false, nationalId: false, phone: false, email: false };

            // تعبئة الحقول باستخدام setValue الخاصة بـ react-hook-form
            if (riderData?.arabicFullName) {
              setValue("name", riderData.arabicFullName, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
              lockedState.name = true;
            }
            if (riderData?.nationalId) {
              setValue("nationalId", riderData.nationalId, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
              lockedState.nationalId = true;
            }
            if (riderData?.mobile) {
              // بعض الـ APIs تعيد الرقم مع مفتاح الدولة 966، يمكنك تنظيفه هنا إذا أردت
              setValue("phone", riderData.mobile, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
              lockedState.phone = true;
            }
            if (riderData?.email) {
              setValue("email", riderData.email, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
              lockedState.email = true;
            }


            setAutoFilled(lockedState);

            toast({
              title: "تم التحقق بنجاح",
              
              variant: "default",
            });
          }
        } catch (err) {
          console.error("Fetch error:", err);
          setRiderError("فشل الاتصال بالخادم للتحقق من الرقم");
          unlockFields();
        } finally {
          setIsCheckingRider(false);
        }
      };

      checkRiderId();
    } else {
      setRiderError("");
      unlockFields();
    }
  }, [watchedRiderId, setValue, toast]);




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

    // منع الإرسال إذا كان الفحص الفوري قد عثر على خطأ مسبقاً
    if (riderError) {
      toast({
        title: "تنبيه",
        description: riderError,
        variant: "destructive",
      });
      return;
    }


    setIsLoading(true);
    setEmail(data.email);
    setFormData(data);

    try {


      // 2. إذا نجح التحقق، نقوم بفحص المستخدم أو إنشائه
      const res = await fetch("/api/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, role: "requester" }),
      });

      const result = await res.json().catch(() => ({ error: "خطأ في معالجة بيانات المستخدم" }));

      // معالجة حالة البريد المسجل مسبقاً (خطأ منطقي 400)
      if (res.status === 400) {
        toast({
          title: "البريد الالكتروني مسجل مسبقاً",
          description: "يرجى تسجيل الدخول لمتابعة طلباتك السابقة أو إنشاء طلب جديد",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (res.status === 404) {
        toast({
          title: "البريد الالكتروني غير مسجل",
          description: "يرجى التحقق من البريد الالكتروني أو إنشاء حساب جديد",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error(result.error || "فشل التحقق من البريد الإلكتروني");
      }

      // 3. نجاح جميع العمليات
      setUserId(result.userId);
      setShowOTP(true);

    } catch (err: any) {
      // إمساك أي خطأ (من رقم الفارس أو من التحقق من المستخدم)
      toast({
        title: "حدث خطأ",
        description: err.message || "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

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
          employment_student_num: formData.employment_student_num ? formData.employment_student_num : null,
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


  return (
    <>
      {!showOTP && (
        // This function runs ONLY when validation fails




        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" dir="rtl">
          <div className="grid gap-5 md:grid-cols-2">

            {/* Rider ID (8 digits) */}
            <div className="space-y-2">
              <Label>رقم العضوية</Label>
              <div className="relative">
                <Hash className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  {...register("rider_id")}
                  maxLength={8}
                  placeholder="00000000"
                  className="pr-10"
                />
                {isCheckingRider && (
                  <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
              </div>
              {/* عرض الخطأ الفوري الخاص بالـ API أو خطأ الـ Zod Schema */}
              {riderError ? (
                <p className="text-xs text-destructive">{riderError}</p>
              ) : errors.rider_id ? (
                <p className="text-xs text-destructive">{errors.rider_id.message}</p>
              ) : null}
            </div>
            {/* Name */}
            <div className="space-y-2">
              <Label>الاسم الرباعي</Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  {...register("name")}
                  className={`pr-10 ${autoFilled.name ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""}`}
                  readOnly={autoFilled.name}
                />
              </div>
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>رقم الهوية الوطنية</Label>
              <div className="relative">
                <Input
                  {...register("nationalId")}
                  maxLength={10}
                  placeholder="10xxxxxxxx"
                  className={autoFilled.nationalId ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""}
                  readOnly={autoFilled.nationalId}
                />
              </div>
              {errors.nationalId && (
                <p className="text-xs text-destructive">{errors.nationalId.message}</p>
              )}
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
              <Label>المسمى الوظيفي / جهة العمل</Label>
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
              <Label>المنطقة</Label>
              {/* Region */}
              <Select onValueChange={(v) => setValue("region", v, { shouldValidate: true })}>
                <SelectTrigger className="w-full pr-10">

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
              <Input
                {...register("phone")}
                className={`text-right ${autoFilled.phone ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""}`}
                readOnly={autoFilled.phone}
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input 
                {...register("email")} 
                className={autoFilled.email ? "bg-slate-100 text-slate-500 cursor-not-allowed text-right" : ""}
                readOnly={autoFilled.email}
              />
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