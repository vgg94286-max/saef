"use client";

import useSWR, { mutate } from "swr";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserCheck, FileText, CheckCircle2, XCircle, Trophy, Briefcase } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// تحديث الأنواع لتطابق قاعدة البيانات الجديدة
type LeaveRequest = {
  request_id: number;
  full_name: string;
  national_id: string;
  req_status: string;
  created_at: string;
  requester_type: string;
};

type LeaveDetail = LeaveRequest & {
  employment_name: string | null;
  phone: string | null;
  email: string | null;
  rider_id: number | null;
  region: string | null;
  employment_student_num: number | null;
  cham_name: string | null;
};

// تحديث التسميات (Labels) لتطابق الحقول الجديدة
const DETAIL_LABELS: Record<string, string> = {
  full_name: "الاسم الرباعي",
  national_id: "رقم الهوية",
  requester_type: "نوع المتقدم",
  employment_name: "المسمى الوظيفي / جهة العمل",
  employment_student_num: "الرقم الوظيفي / الجامعي",
  phone: "رقم الجوال",
  email: "البريد الإلكتروني",
  rider_id: "رقم الفارس",
  region: "المنطقة",
  cham_name: "اسم البطولة",
};

export default function LeaveRequestsPage() {
  const { data, isLoading } = useSWR<LeaveRequest[]>(
    "/api/admin/leave-requests",
    fetcher
  );
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <UserCheck className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">إدارة طلبات التفرغ</h1>
          <p className="text-sm text-muted-foreground">مراجعة ومعالجة طلبات الفرسان والحكام والمدربين</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead className="text-right font-semibold px-4">الاسم</TableHead>
              
              <TableHead className="text-right font-semibold px-4">تاريخ الطلب</TableHead>
              <TableHead className="text-right font-semibold px-4">الحالة</TableHead>
              <TableHead className="text-right font-semibold px-4">تفاصيل</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-4"><Skeleton className="h-4 w-28" /></TableCell>
                  
                  <TableCell className="px-4"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="px-4"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="px-4"><Skeleton className="h-8 w-16" /></TableCell>
                </TableRow>
              ))
            ) : data && data.length > 0 ? (
              data.map((req) => (
                <TableRow key={req.request_id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="px-4 font-medium">{req.full_name}</TableCell>
                  
                  <TableCell className="px-4 text-muted-foreground">
                    {new Date(req.created_at).toISOString().split("T")[0]}
                  </TableCell>
                  <TableCell className="px-4"><StatusBadge status={req.req_status} /></TableCell>
                  <TableCell className="px-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs hover:bg-emerald-50 hover:text-emerald-700"
                      onClick={() => {
                        setSelectedId(req.request_id);
                        setDetailOpen(true);
                      }}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      عرض
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  لا توجد طلبات تفرغ حالياً
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <LeaveDetailModal
        requestId={selectedId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}

function LeaveDetailModal({
  requestId,
  open,
  onOpenChange,
}: {
  requestId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isLoading } = useSWR<LeaveDetail>(
    requestId && open ? `/api/admin/leave-requests/${requestId}` : null,
    fetcher
  );

  // --- States الجديدة للتحكم في الرفض ---
  const [acting, setActing] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  async function handleAction(action: "approve" | "reject") {
    if (!requestId) return;
    if (action === "reject" && !rejectReason.trim()) return;

    setActing(true);
    try {
      await fetch(`/api/admin/leave-requests/${requestId}/${action}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: action === "reject" ? rejectReason : null }),
      });
      
      mutate("/api/admin/leave-requests");
      onOpenChange(false);
      
      // Reset States
      setShowRejectInput(false);
      setRejectReason("");
    } catch (error) {
      console.error("Error updating leave request:", error);
    } finally {
      setActing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-right flex items-center gap-2">
            <Trophy className="h-5 w-5 text-emerald-600" />
            تفاصيل طلب التفرغ 
          </DialogTitle>
        </DialogHeader>

        {isLoading || !data ? (
          <div className="flex flex-col gap-3 py-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-6 py-4">
            {/* قسم المعلومات الشخصية */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
              <DetailBox label={DETAIL_LABELS.full_name} value={data.full_name} />
              <DetailBox label={DETAIL_LABELS.national_id} value={data.national_id} />
              <DetailBox label={DETAIL_LABELS.requester_type} value={data.requester_type} />
              <DetailBox label={DETAIL_LABELS.phone} value={data.phone} />
              <DetailBox label={DETAIL_LABELS.email} value={data.email} className="col-span-2" />
            </div>

            {/* قسم بيانات العمل والفروسية */}
            <div className="grid grid-cols-2 gap-4">
              <DetailBox label={DETAIL_LABELS.employment_name} value={data.employment_name} />
              <DetailBox label={DETAIL_LABELS.employment_student_num} value={data.employment_student_num} />
              <DetailBox label={DETAIL_LABELS.region} value={data.region} />
              <DetailBox label={DETAIL_LABELS.rider_id} value={data.rider_id} />
            </div>

            {/* قسم البطولة */}
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
              <p className="text-xs text-emerald-700 font-bold mb-1 uppercase tracking-wider">
                {DETAIL_LABELS.cham_name}
              </p>
              <p className="text-sm font-semibold text-emerald-900 leading-relaxed">
                {data.cham_name || "غير محدد"}
              </p>
            </div>

            {/* الحالة والتاريخ */}
            <div className="flex items-center justify-between px-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">تاريخ الطلب:</span>
                <span className="font-medium font-mono">{new Date(data.created_at).toISOString().split("T")[0]}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">الحالة الحالية:</span>
                <StatusBadge status={data.req_status} />
              </div>
            </div>

            {/* أزرار التحكم المعدلة */}
            {data.req_status === "قيد المراجعة" && (
              <div className="pt-4 border-t border-border">
                {!showRejectInput ? (
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => handleAction("approve")}
                      disabled={acting}
                      className="gap-1.5 flex-1 bg-emerald-700 hover:bg-emerald-800 font-bold"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      اعتماد الطلب
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowRejectInput(true)}
                      disabled={acting}
                      className="gap-1.5 flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <XCircle className="h-4 w-4" />
                      رفض الطلب
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-red-600">سبب رفض التفرغ *</label>
                      <textarea
                        required
                        className="w-full min-h-[80px] p-2 text-sm rounded-md border border-red-200 focus:ring-1 focus:ring-red-500 outline-none"
                        placeholder="يرجى كتابة سبب عدم قبول طلب التفرغ..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="destructive"
                        className="flex-1 font-bold"
                        onClick={() => handleAction("reject")}
                        disabled={acting || !rejectReason.trim()}
                      >
                        {acting ? "جاري المعالجة..." : "تأكيد الرفض النهائي"}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowRejectInput(false);
                          setRejectReason("");
                        }}
                        disabled={acting}
                      >
                        إلغاء
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// مكون فرعي لعرض البيانات بشكل منظم
function DetailBox({ label, value, className = "" }: { label: string; value: any; className?: string }) {
  return (
    <div className={className}>
      <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-900 truncate">
        {value != null && value !== "" ? String(value) : "—"}
      </p>
    </div>
  );
}