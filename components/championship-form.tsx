"use client"

import { useState, useCallback } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Loader2,
  Plus,
  Trash2,
  Trophy,
  Gavel,
  CalendarDays,
  Medal,
  ChevronDown,
  ChevronUp,
  Ambulance,
  FileCheck2,
  ListOrdered,
  CalendarIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { format, isBefore, startOfDay } from "date-fns"
import { ar } from "date-fns/locale"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from 'next/navigation'


const prizeSchema = z.object({
  position: z.string().min(1, "المركز مطلوب"),
  amount: z
    .number({
      required_error: "المبلغ مطلوب",
      invalid_type_error: "المبلغ مطلوب",
    })
    .min(0, "المبلغ يجب أن يكون صفر أو أكثر"),
})

/* ---------- Round schema ---------- */
const roundSchema = z.object({
  name: z.string().min(1, "اسم الشوط مطلوب"),

  prizes: z.array(prizeSchema).min(1, "يجب إضافة مركز واحد على الأقل"),
})

/* ---------- Judge schema ---------- */
const judgeSchema = z.object({
  judge_name: z.string().min(2, "اسم الحكم مطلوب"),
})

/* ---------- Championship schema ---------- */
const championshipSchema = z.object({
  date: z.date({ required_error: "تاريخ البدء مطلوب" }),
  end_date: z.date({ required_error: "تاريخ الانتهاء مطلوب" }),
  ambulance: z.boolean(),
  agreed_on_terms: z.boolean(),
  judges: z.array(judgeSchema).min(1, "يجب إضافة حكم واحد على الأقل"),
  rounds: z.array(roundSchema).min(1, "يجب إضافة شوط واحد على الأقل"),
}).refine((data) => data.end_date >= data.date, {
  message: "تاريخ الانتهاء لا يمكن أن يكون قبل تاريخ البدء",
  path: ["end_date"],
});
type ChampionshipFormData = z.infer<typeof championshipSchema>

/* ====================================================== */

export function ChampionshipForm({ clubId }: { clubId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [expandedRounds, setExpandedRounds] = useState<Record<number, boolean>>({ 0: true })
  const [championshipDate, setChampionshipDate] = useState<Date | undefined>()
  const [isChampionshipDateOpen, setIsChampionshipDateOpen] = useState(false)
  const [isTermsOpen, setIsTermsOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [isStartDateOpen, setIsStartDateOpen] = useState(false)
  const [isEndDateOpen, setIsEndDateOpen] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<ChampionshipFormData>({
    resolver: zodResolver(championshipSchema),
    defaultValues: {
      date: undefined,
      end_date: undefined,
      ambulance: false,
      agreed_on_terms: false,
      judges: [{ judge_name: "" }],
      rounds: [
        {
          name: "",

          prizes: [{ position: "", amount: undefined as any }],
        },
      ],
    },
  })

  /* ---------- Field arrays ---------- */
  const {
    fields: judgeFields,
    append: appendJudge,
    remove: removeJudge,
  } = useFieldArray({ control, name: "judges" })

  const {
    fields: roundFields,
    append: appendRound,
    remove: removeRound,
  } = useFieldArray({ control, name: "rounds" })

  /* ---------- Helpers ---------- */
  const toggleRound = useCallback((idx: number) => {
    setExpandedRounds((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }, [])

  /* ---------- Submit ---------- */
  const onSubmit = async (data: ChampionshipFormData) => {


    setIsLoading(true)
    setSuccessMessage("")
    setErrorMessage("")

    try {
      const res = await fetch("/api/championships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, club_id: clubId }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "حدث خطأ أثناء إنشاء البطولة")
      }

      toast({
        title: "تم إنشاء البطولة بنجاح",
        description: "سيتم مراجعة بيانات البطولة والموافقة عليها في أقرب وقت ممكن.",

      })
      reset()
      setExpandedRounds({ 0: true })
      router.push("/club-dashboard")

    } catch (err: unknown) {
      toast({
        title: "فشل في إنشاء البطولة",
        description:
          err instanceof Error ? err.message : "حدث خطأ أثناء إنشاء البطولة",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  /* ---------- Render ---------- */
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* ---- Success / error alerts ---- */}
      {successMessage && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center text-sm font-medium text-primary">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center text-sm font-medium text-destructive">
          {errorMessage}
        </div>
      )}


      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg text-card-foreground">
                تفاصيل البطولة
              </CardTitle>
              <CardDescription>المعلومات الأساسية للبطولة الخاصة</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Grid لترتيب التواريخ بجانب بعضها في الشاشات الكبيرة */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Start Date */}
            <div className="space-y-2">
              <Label>تاريخ البدء</Label>
              <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn("w-full justify-start text-right font-normal", !startDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP", { locale: ar }) : "اختر تاريخ البدء"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date)
                      setValue("date", date!, { shouldValidate: true })
                      setIsStartDateOpen(false)
                    }}
                    disabled={(d) => isBefore(startOfDay(d), startOfDay(new Date()))}
                    locale={ar}
                  />
                </PopoverContent>
              </Popover>
              {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
            </div>

            {/* End Date - الحقل المضاف */}
            <div className="space-y-2">
              <Label>تاريخ الانتهاء</Label>
              <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn("w-full justify-start text-right font-normal", !endDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP", { locale: ar }) : "اختر تاريخ الانتهاء"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date)
                      setValue("end_date", date!, { shouldValidate: true })
                      setIsEndDateOpen(false)
                    }}
                    // تعطيل التواريخ التي تسبق تاريخ البدء (إذا تم اختياره)
                    disabled={(d) =>
                      isBefore(startOfDay(d), startOfDay(new Date())) ||
                      (startDate ? isBefore(startOfDay(d), startOfDay(startDate)) : false)
                    }
                    locale={ar}
                  />
                </PopoverContent>
              </Popover>
              {errors.end_date && <p className="text-sm text-destructive">{errors.end_date.message}</p>}
            </div>

          </div>
        </CardContent>
      </Card>

      {/* ============================================== */}
      {/* 2. Judges                                      */}
      {/* ============================================== */}
      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border bg-secondary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Gavel className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg text-card-foreground">
                  الحكام
                </CardTitle>
                <CardDescription>
                  أضف حكام البطولة ({judgeFields.length})
                </CardDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendJudge({ judge_name: "" })}
              className="gap-1.5 border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
            >
              <Plus className="h-4 w-4" />
              إضافة حكم
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {judgeFields.map((field, idx) => (
              <div
                key={field.id}
                className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3 transition-colors hover:bg-muted/40"
              >
                <Badge
                  variant="secondary"
                  className="mt-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                >
                  {idx + 1}
                </Badge>
                <div className="flex-1 space-y-1">
                  <Input
                    placeholder={`اسم الحكم ${idx + 1}`}
                    {...register(`judges.${idx}.judge_name`)}
                  />
                  {errors.judges?.[idx]?.judge_name && (
                    <p className="text-sm text-destructive">
                      {errors.judges[idx].judge_name?.message}
                    </p>
                  )}
                </div>
                {judgeFields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-0.5 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeJudge(idx)}
                    aria-label="حذف الحكم"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {errors.judges?.message && (
              <p className="text-sm text-destructive">{errors.judges.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ============================================== */}
      {/* 3. Rounds + Prizes                             */}
      {/* ============================================== */}
      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border bg-secondary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ListOrdered className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg text-card-foreground">
                  جدول البطولة (اسماء الأشواط والمراكز والجوائز)
                </CardTitle>
                <CardDescription>
                  أضف أشواط البطولة وجوائز كل شوط ({roundFields.length})
                </CardDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {

                appendRound({
                  name: "",

                  prizes: [{ position: "", amount: undefined as any }],
                })
                setExpandedRounds((prev) => ({
                  ...prev,
                  [roundFields.length]: true,
                }))
              }}
              className="gap-1.5 border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
            >
              <Plus className="h-4 w-4" />
              إضافة شوط
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {roundFields.map((roundField, rIdx) => (
              <RoundCard
                key={roundField.id}
                roundIndex={rIdx}
                expanded={expandedRounds[rIdx] ?? false}
                onToggle={() => toggleRound(rIdx)}
                register={register}
                control={control}
                errors={errors}
                canDelete={roundFields.length > 1}
                onDelete={() => removeRound(rIdx)}
              />
            ))}
            {errors.rounds?.message && (
              <p className="text-sm text-destructive">{errors.rounds.message}</p>
            )}
          </div>
        </CardContent>

      </Card>
      <Card className="border-border bg-card shadow-sm p-6">
        <div className="flex items-center gap-3">
          <Checkbox
            id="ambulance"
            checked={watch("ambulance")}
            onCheckedChange={(v) => setValue("ambulance", v === true, { shouldValidate: true })}
          />
          {errors.ambulance && (
            <p className="text-sm text-destructive">{errors.ambulance.message}</p>
          )}
          <Label
            htmlFor="ambulance"
            className="flex cursor-pointer items-center gap-2 text-foreground"
          >
            <Ambulance className="h-4 w-4 text-muted-foreground" />
            هل سيتم توفير سيارة إسعاف ؟
          </Label>
        </div>
      </Card>

      {/* ============================================== */}
      {/* Submit & Terms Logic                           */}
      {/* ============================================== */}
      <Popover open={isTermsOpen} onOpenChange={setIsTermsOpen}>
        {/* The Trigger is hidden but provides the positioning context */}
        <PopoverTrigger asChild>
          <div className="h-0 w-full" aria-hidden="true" />
        </PopoverTrigger>

        <PopoverContent
          className="w-[calc(100vw-2rem)] max-w-lg p-6 space-y-4 text-right"
          side="top"
          align="center"
        >
          <div className="flex items-center gap-2 mb-2">
            <FileCheck2 className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-lg text-primary">
              الشروط والأحكام
            </h3>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed border-t pt-4">
            يجب الالتزام الكامل بتطبيق لوائح وأنظمة الاتحاد السعودي للفروسية.
            كما يُمنع منعًا باتًا على أي فارس مشارك في البطولة ممارسة مهام التحكيم
            خلال فترة انعقاد البطولة.
          </p>

          <Button
            type="button" // Use type button to prevent premature native submission
            className="w-full bg-primary text-primary-foreground font-bold h-11"
            onClick={() => {
              setValue("agreed_on_terms", true, { shouldValidate: true });
              setIsTermsOpen(false);
              // Directly trigger the form submission
              handleSubmit(onSubmit)();
            }}
          >
            أوافق على الشروط وإنشاء البطولة
          </Button>
        </PopoverContent>
      </Popover>

      <Button
        type="button" // Change to button so we control the flow manually
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold"
        disabled={isLoading}
        onClick={async (e) => {
          // 1. Check if terms are already agreed
          if (!watch("agreed_on_terms")) {
            setIsTermsOpen(true);
            return;
          }

          // 2. If already agreed, just submit
          handleSubmit(onSubmit)();
        }}
      >
        {isLoading ? (
          <>
            <Loader2 className="ml-2 h-5 w-5 animate-spin" />
            جاري إنشاء البطولة...
          </>
        ) : (
          <>
            <Trophy className="ml-2 h-5 w-5" />
            إنشاء البطولة
          </>
        )}
      </Button>
    </form>
  )
}

/* ====================================================== */
/* RoundCard sub-component                                 */
/* ====================================================== */

function RoundCard({
  roundIndex,
  expanded,
  onToggle,
  register,
  control,
  errors,
  canDelete,
  onDelete,
}: {
  roundIndex: number
  expanded: boolean
  onToggle: () => void
  register: ReturnType<typeof useForm<ChampionshipFormData>>["register"]
  control: ReturnType<typeof useForm<ChampionshipFormData>>["control"]
  errors: ReturnType<typeof useForm<ChampionshipFormData>>["formState"]["errors"]
  canDelete: boolean
  onDelete: () => void
}) {
  const {
    fields: prizeFields,
    append: appendPrize,
    remove: removePrize,
  } = useFieldArray({ control, name: `rounds.${roundIndex}.prizes` })

  return (
    <div className="rounded-xl border border-border bg-muted/10 overflow-hidden transition-shadow hover:shadow-sm">
      {/* Round header – collapsible */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between bg-secondary/40 px-4 py-3 transition-colors hover:bg-secondary/60"
      >
        <div className="flex items-center gap-2">
          <Badge className="bg-primary text-primary-foreground">
            {roundIndex + 1}
          </Badge>
          <span className="font-semibold text-card-foreground">
            الشوط {roundIndex + 1}
          </span>
          <span className="text-xs text-muted-foreground">
            ({prizeFields.length} مراكز)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canDelete && (
            <span
              role="button"
              tabIndex={0}
              className="rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation()
                  onDelete()
                }
              }}
              aria-label="حذف الشوط"
            >
              <Trash2 className="h-4 w-4" />
            </span>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Round body */}
      {expanded && (
        <div className="space-y-5 p-4">
          {/* Round name + order */}
          <div className="space-y-2">
            <div className="space-y-2">
              <Label className="text-foreground">اسم الشوط</Label>
              <Input
                placeholder="مثال: الشوط التمهيدي"
                {...register(`rounds.${roundIndex}.name`)}
              />
              {errors.rounds?.[roundIndex]?.name && (
                <p className="text-sm text-destructive">
                  {errors.rounds[roundIndex].name?.message}
                </p>
              )}
            </div>


          </div>

          <Separator />

          {/* Prizes header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Medal className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                المراكز والجوائز
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => appendPrize({ position: "", amount: undefined as any })}
              className="gap-1 text-primary hover:bg-primary/5 hover:text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              إضافة مركز
            </Button>
          </div>

          {/* Prize rows */}
          <div className="space-y-2">
            {prizeFields.map((pField, pIdx) => (
              <div
                key={pField.id}
                className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
              >
                <Badge
                  variant="outline"
                  className="mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs text-muted-foreground"
                >
                  {pIdx + 1}
                </Badge>
                <div className="grid flex-1 gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Input
                      placeholder="المركز (مثال:المركز الأول)"
                      {...register(
                        `rounds.${roundIndex}.prizes.${pIdx}.position`
                      )}
                    />
                    {errors.rounds?.[roundIndex]?.prizes?.[pIdx]?.position && (
                      <p className="text-xs text-destructive">
                        {
                          errors.rounds[roundIndex].prizes?.[pIdx]?.position
                            ?.message
                        }
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Input
                      type="number"
                      min={0}
                      placeholder="المبلغ (ريال)"
                      {...register(`rounds.${roundIndex}.prizes.${pIdx}.amount`, {
                        valueAsNumber: true,
                      })}
                    />
                    {errors.rounds?.[roundIndex]?.prizes?.[pIdx]?.amount && (
                      <p className="text-xs text-destructive">
                        {
                          errors.rounds[roundIndex].prizes?.[pIdx]?.amount
                            ?.message
                        }
                      </p>
                    )}
                  </div>
                </div>
                {prizeFields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-0.5 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removePrize(pIdx)}
                    aria-label="حذف المركز"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {errors.rounds?.[roundIndex]?.prizes?.message && (
            <p className="text-sm text-destructive">
              {errors.rounds[roundIndex].prizes?.message}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
