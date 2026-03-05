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
import { UserCheck, FileText, CheckCircle2, XCircle } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type LeaveRequest = {
  request_id: number;
  full_name: string;
  national_id: string;
  req_status: string;
  created_at: string;
};

type LeaveDetail = LeaveRequest & {
  employer: string | null;
  phone: string | null;
  email: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  salary: number | null;
  marital_status: string | null;
  national_address: string | null;
};

const DETAIL_LABELS: Record<string, string> = {
  full_name: "الاسم الكامل",
  national_id: "رقم الهوية",
  employer: "جهة العمل",
  phone: "الهاتف",
  email: "البريد الالكتروني",
  height_cm: "الطول (سم)",
  weight_kg: "الوزن (كجم)",
  salary: "الراتب",
  marital_status: "الحالة الاجتماعية",
  national_address: "العنوان الوطني",
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
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
          <UserCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">طلبات التفرغ</h1>
          <p className="text-sm text-muted-foreground">ادارة ومراجعة طلبات التفرغ</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead className="text-right font-semibold px-4">الاسم</TableHead>
              <TableHead className="text-right font-semibold px-4">رقم الهوية</TableHead>
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
                  <TableCell className="px-4"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="px-4"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="px-4"><Skeleton className="h-8 w-16" /></TableCell>
                </TableRow>
              ))
            ) : data && data.length > 0 ? (
              data.map((req) => (
                <TableRow key={req.request_id}>
                  <TableCell className="px-4 font-medium">{req.full_name}</TableCell>
                  <TableCell className="px-4 text-muted-foreground font-mono text-xs">{req.national_id}</TableCell>
                  <TableCell className="px-4 text-muted-foreground">
                    {new Date(req.created_at).toISOString().split("T")[0]}
                  </TableCell>
                  <TableCell className="px-4"><StatusBadge status={req.req_status} /></TableCell>
                  <TableCell className="px-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => {
                        setSelectedId(req.request_id);
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
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  لا توجد طلبات تفرغ
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
  const [acting, setActing] = useState(false);

  async function handleAction(action: "approve" | "reject") {
    if (!requestId) return;
    setActing(true);
    try {
      await fetch(`/api/admin/leave-requests/${requestId}/${action}`, {
        method: "PATCH",
      });
      mutate("/api/admin/leave-requests");
      onOpenChange(false);
    } finally {
      setActing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right">تفاصيل طلب التفرغ</DialogTitle>
        </DialogHeader>

        {isLoading || !data ? (
          <div className="flex flex-col gap-3 py-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(DETAIL_LABELS).map(([key, label]) => {
                const value = data[key as keyof LeaveDetail];
                return (
                  <div key={key}>
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    <p className="text-sm font-medium">
                      {value != null ? String(value) : "غير متوفر"}
                    </p>
                  </div>
                );
              })}
              <div>
                <p className="text-xs text-muted-foreground mb-1">الحالة</p>
                <StatusBadge status={data.req_status} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">تاريخ الطلب</p>
                <p className="text-sm">{new Date(data.created_at).toISOString().split("T")[0]}</p>
              </div>
            </div>

            {data.req_status === "قيد المراجعة" && (
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <Button
                  onClick={() => handleAction("approve")}
                  disabled={acting}
                  className="gap-1.5 flex-1"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  قبول
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleAction("reject")}
                  disabled={acting}
                  className="gap-1.5 flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <XCircle className="h-4 w-4" />
                  رفض
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
