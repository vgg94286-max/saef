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
import { Eye, FileText, CheckCircle2, XCircle, ImageIcon, ExternalLink, Loader2 } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type VisitFiles = {
  licenseUrl: string;
  clubUrls: string[];
};

type VisitRequest = {
  visit_id: string;
  club_name: string;
  status: string;
  created_at: string;
};

type VisitDetail = VisitRequest & {
  license_file: string | null;
  license_end_date: string | null;
  images: { img_id: string; image_url: string }[];
};

export default function VisitRequestsPage() {
  const { data, isLoading } = useSWR<VisitRequest[]>(
    "/api/admin/visit-requests",
    fetcher
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
          <Eye className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">طلبات الزيارة</h1>
          <p className="text-sm text-muted-foreground">ادارة ومراجعة طلبات الزيارة المقدمة من الاندية</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead className="text-right font-semibold px-4">اسم النادي</TableHead>
              <TableHead className="text-right font-semibold px-4">تاريخ الطلب</TableHead>
              <TableHead className="text-right font-semibold px-4">الحالة</TableHead>
              <TableHead className="text-right font-semibold px-4">تفاصيل</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-4"><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="px-4"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="px-4"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="px-4"><Skeleton className="h-8 w-16" /></TableCell>
                </TableRow>
              ))
            ) : data && data.length > 0 ? (
              data.map((req) => (
                <TableRow key={req.visit_id}>
                  <TableCell className="px-4 font-medium">{req.club_name}</TableCell>
                  <TableCell className="px-4 text-muted-foreground">
                    {new Date(req.created_at).toISOString().split("T")[0]}
                  </TableCell>
                  <TableCell className="px-4"><StatusBadge status={req.status} /></TableCell>
                  <TableCell className="px-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => {
                        setSelectedId(req.visit_id);
                        setDetailOpen(true);
                      }}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      تفاصيل
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  لا توجد طلبات زيارة
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Modal */}
      <VisitDetailModal
        visitId={selectedId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
function VisitDetailModal({
  visitId,
  open,
  onOpenChange,
}: {
  visitId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isLoading } = useSWR<VisitDetail>(
    visitId && open ? `/api/admin/visit-requests/${visitId}` : null,
    fetcher
  );
  const { data: files } = useSWR<VisitFiles>(
    visitId && open ? `/api/get-from-s3/${visitId}` : null,
    fetcher
  );
  const [acting, setActing] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  async function handleAction(action: "approve" | "reject") {
    if (!visitId) return;
    if (action === "reject" && !rejectReason.trim()) return;

    setActing(true);
    try {
      await fetch(`/api/admin/visit-requests/${visitId}/${action}`, {
        method: "PATCH",
        body: JSON.stringify({ note: action === "reject" ? rejectReason : null }),
      });
      mutate("/api/admin/visit-requests");
      onOpenChange(false);
      setShowRejectInput(false);
      setRejectReason("");
    } finally {
      setActing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right">تفاصيل طلب الزيارة</DialogTitle>
        </DialogHeader>

        {isLoading || !data ? (
          <div className="flex flex-col gap-3 py-6">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Info Section */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">اسم النادي</p>
                <p className="text-sm font-semibold">{data.club_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">الحالة</p>
                <StatusBadge status={data.status} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">تاريخ الطلب</p>
                <p className="text-sm">{new Date(data.created_at).toISOString().split("T")[0]}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">انتهاء الرخصة</p>
                <p className="text-sm">
                  {data.license_end_date
                    ? new Date(data.license_end_date).toISOString().split("T")[0]
                    : "غير متوفر"}
                </p>
              </div>
            </div>

            {/* License Section */}
            {files?.licenseUrl && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">رخصة نافس</p>
                <a
                  href={files.licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
                >
                  <ExternalLink className="h-4 w-4" />
                  عرض رخصة نافس
                </a>
              </div>
            )}

            {/* Images Section */}
            {files?.clubUrls && files.clubUrls.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5" />
                  صور الزيارة ({files.clubUrls.length})
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {files.clubUrls.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
                    >
                      <img
                        src={url}
                        alt="صورة الزيارة"
                        className="w-full h-36 object-cover"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Section */}
            {data.status === "قيد المراجعة" && (
              <div className="pt-4 border-t border-border">
                {!showRejectInput ? (
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => handleAction("approve")}
                      disabled={acting}
                      className="gap-1.5 flex-1 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      قبول الطلب
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowRejectInput(true)}
                      disabled={acting}
                      className="gap-1.5 flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 "
                    >
                      <XCircle className="h-4 w-4" />
                      رفض الطلب
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-red-600">سبب الرفض *</label>
                      <textarea
                        required
                        className="w-full min-h-[80px] p-2 text-sm rounded-md border border-red-200 focus:ring-1 focus:ring-red-500 outline-none"
                        placeholder="اكتب سبب الرفض هنا... (سيظهر للنادي)"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleAction("reject")}
                        disabled={acting || !rejectReason.trim()}
                      >
                        {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : "تأكيد الرفض النهائي"}
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
