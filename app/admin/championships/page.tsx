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
import { Separator } from "@/components/ui/separator";
import { Trophy, FileText, CheckCircle2, XCircle, Ambulance, Award, Users } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Championship = {
  championships_id: string;
  club_name: string;
  date: string;
  status: string;
  created_at: string;
};

type Prize = { prize_id: string; position: string; amount: number };
type Round = { round_id: string; name: string; round_order: number; prizes: Prize[] };
type Judge = { judge_id: string; judge_name: string };

type ChampDetail = Championship & {
  ambulance: boolean;
  judges: Judge[];
  rounds: Round[];
  total_prizes: number;
};

export default function ChampionshipsPage() {
  const { data, isLoading } = useSWR<Championship[]>(
    "/api/admin/championships",
    fetcher
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
          <Trophy className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">طلبات البطولات الخاصة</h1>
          <p className="text-sm text-muted-foreground">ادارة ومراجعة طلبات البطولات الخاصة</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead className="text-right font-semibold px-4">اسم النادي</TableHead>
              <TableHead className="text-right font-semibold px-4">تاريخ البطولة</TableHead>
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
              data.map((ch) => (
                <TableRow key={ch.championships_id}>
                  <TableCell className="px-4 font-medium">{ch.club_name}</TableCell>
                  <TableCell className="px-4 text-muted-foreground">
                    {new Date(ch.date).toISOString().split("T")[0]}
                  </TableCell>
                  <TableCell className="px-4"><StatusBadge status={ch.status} /></TableCell>
                  <TableCell className="px-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => {
                        setSelectedId(ch.championships_id);
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
                  لا توجد طلبات بطولات
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ChampDetailModal
        champId={selectedId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}

function ChampDetailModal({
  champId,
  open,
  onOpenChange,
}: {
  champId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isLoading } = useSWR<ChampDetail>(
    champId && open ? `/api/admin/championships/${champId}` : null,
    fetcher
  );
  const [acting, setActing] = useState(false);

  async function handleAction(action: "approve" | "reject") {
    if (!champId) return;
    setActing(true);
    try {
      await fetch(`/api/admin/championships/${champId}/${action}`, {
        method: "PATCH",
      });
      mutate("/api/admin/championships");
      onOpenChange(false);
    } finally {
      setActing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right">تفاصيل البطولة</DialogTitle>
        </DialogHeader>

        {isLoading || !data ? (
          <div className="flex flex-col gap-3 py-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Basic Info */}
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
                <p className="text-xs text-muted-foreground mb-1">تاريخ البطولة</p>
                <p className="text-sm">{new Date(data.date).toISOString().split("T")[0]}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">اسعاف</p>
                <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${data.ambulance ? "text-emerald-600" : "text-red-500"}`}>
                  <Ambulance className="h-4 w-4" />
                  {data.ambulance ? "متوفر" : "غير متوفر"}
                </span>
              </div>
            </div>

            <Separator />

            {/* Judges */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                الحكام ({data.judges.length})
              </p>
              {data.judges.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.judges.map((j) => (
                    <span
                      key={j.judge_id}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium"
                    >
                      {j.judge_name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">لا يوجد حكام</p>
              )}
            </div>

            <Separator />

            {/* Rounds & Prizes */}
            <div>
              <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5" />
                الاشواط والجوائز
              </p>
              {data.rounds.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {data.rounds.map((round) => (
                    <div key={round.round_id} className="rounded-lg border border-border p-3">
                      <p className="text-sm font-semibold mb-2">{round.name}</p>
                      {round.prizes.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {round.prizes.map((prize) => (
                            <div key={prize.prize_id} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{prize.position}</span>
                              <span className="font-semibold text-foreground">
                                {Number(prize.amount).toLocaleString("ar-SA")} ر.س
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">لا يوجد جوائز</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">لا يوجد اشواط</p>
              )}
            </div>

            {/* Total */}
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">اجمالي الجوائز</span>
              <span className="text-lg font-bold text-primary">
                {data.total_prizes.toLocaleString("ar-SA")} ر.س
              </span>
            </div>

            {/* Actions */}
            {data.status === "قيد المراجعة" && (
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
