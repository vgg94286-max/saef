"use client";

import useSWR, { mutate } from "swr";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle  } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, FileText, CheckCircle2, XCircle, ExternalLink, Loader2 } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function CertRequestsPage() {
  const { data, isLoading } = useSWR("/api/admin/cert-requests", fetcher);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Award className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">طلبات الشهادات</h1>
          <p className="text-sm text-muted-foreground">إصدار ومراجعة شهادات المشاركة في البطولات</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead className="text-right px-4">الاسم الكامل</TableHead>
              <TableHead className="text-right px-4">رقم الهوية</TableHead>
              <TableHead className="text-right px-4">تاريخ الطلب</TableHead>
              <TableHead className="text-right px-4">الحالة</TableHead>
              <TableHead className="text-right px-4">التحكم</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton columns={5} />
            ) : data?.map((req: any) => (
              <TableRow key={req.request_id}>
                <TableCell className="px-4 font-medium">{req.full_name}</TableCell>
                <TableCell className="px-4 font-mono text-xs">{req.national_id}</TableCell>
                <TableCell className="px-4 text-muted-foreground text-xs">
                  {new Date(req.created_at).toLocaleDateString("ar-SA")}
                </TableCell>
                <TableCell className="px-4"><StatusBadge status={req.req_status} /></TableCell>
                <TableCell className="px-4">
                  <Button variant="outline" size="sm" onClick={() => { setSelectedId(req.request_id); setDetailOpen(true); }}>
                    <FileText className="h-3.5 w-3.5 ml-1" /> تفاصيل
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CertDetailModal requestId={selectedId} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
}

function CertDetailModal({ requestId, open, onOpenChange }: any) {
  const { data, isLoading } = useSWR(requestId && open ? `/api/admin/cert-requests/${requestId}` : null, fetcher);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-right flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-600" /> تفاصيل طلب الشهادة
          </DialogTitle>
        </DialogHeader>
        {isLoading || !data ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <div className="space-y-6 pt-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <DetailBox label="الاسم الرباعي" value={data.full_name} />
              <DetailBox label="رقم الهوية" value={data.national_id} />
              <DetailBox label="البريد الإلكتروني" value={data.email} className="col-span-2" />
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-700 font-bold mb-1">اسم البطولة</p>
              <p className="font-semibold">{data.championship_name}</p>
            </div>
            {data.licence_card && (
              <a href={data.licence_card} target="_blank" className="flex items-center justify-center gap-2 w-full p-3 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors border border-slate-200">
                <ExternalLink className="h-4 w-4" /> عرض ملف بطاقة الفارس
              </a>
            )}
            
            {/* تم تحديث مكون الأزرار لاستقبال الملاحظة */}
            <ActionButtons 
              requestId={requestId} 
              status={data.req_status} 
              endpoint="cert-requests" 
              onOpenChange={onOpenChange} 
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailBox({ label, value, className = "" }: any) {
  return (
    <div className={className}>
      <p className="text-[10px] text-muted-foreground mb-0.5 font-bold uppercase">{label}</p>
      <p className="text-sm font-medium text-slate-900">{value || "—"}</p>
    </div>
  );
}

// المكون المحدث مع States سبب الرفض
function ActionButtons({ requestId, status, endpoint, onOpenChange }: any) {
  const [acting, setActing] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  async function handleAction(action: "approve" | "reject") {
    if (action === "reject" && !rejectReason.trim()) return;

    setActing(true);
    try {
      await fetch(`/api/admin/${endpoint}/${requestId}/${action}`, { 
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: action === "reject" ? rejectReason : null })
      });
      mutate(`/api/admin/${endpoint}`);
      onOpenChange(false);
      // Reset
      setShowRejectInput(false);
      setRejectReason("");
    } finally { 
      setActing(false); 
    }
  }

  if (status !== "قيد المراجعة") return null;

  return (
    <div className="pt-4 border-t">
      {!showRejectInput ? (
        <div className="flex gap-3">
          <Button 
            onClick={() => handleAction("approve")} 
            disabled={acting} 
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="ml-1 h-4 w-4" />}
            قبول
          </Button>
          <Button 
            onClick={() => setShowRejectInput(true)} 
            disabled={acting} 
            variant="outline" 
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <XCircle className="ml-1 h-4 w-4" />
            رفض
          </Button>
        </div>
      ) : (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="space-y-1">
            <label className="text-xs font-bold text-red-600">سبب الرفض *</label>
            <textarea
              className="w-full min-h-[80px] p-2 text-sm rounded-md border border-red-200 focus:ring-1 focus:ring-red-500 outline-none"
              placeholder="اكتب سبب الرفض هنا..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant="destructive" 
              className="flex-1" 
              onClick={() => handleAction("reject")}
              disabled={acting || !rejectReason.trim()}
            >
              {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : "تأكيد الرفض"}
            </Button>
            <Button 
              variant="ghost" 
              className="flex-1" 
              onClick={() => setShowRejectInput(false)}
              disabled={acting}
            >
              إلغاء
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function TableSkeleton({ columns }: { columns: number }) {
  return Array.from({ length: 5 }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: columns }).map((_, j) => (
        <TableCell key={j} className="px-4"><Skeleton className="h-4 w-24" /></TableCell>
      ))}
    </TableRow>
  ));
}