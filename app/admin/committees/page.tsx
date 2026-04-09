"use client";

import useSWR, { mutate } from "swr";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Plus, UserPlus , ExternalLink , FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type PendingVisit = {
  visit_id: string;
  club_name: string;
  created_at: string;
};

type Committee = {
  committee_id: string;
  club_name: string;
  created_at: string;
  status: string;
  report_text?: string;
};

type StaffMember = {
  staff_id: string;
  user_id: string;
  staff_name: string;
};

export default function CommitteesPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">اللجان</h1>
          <p className="text-sm text-muted-foreground">تعيين وادارة لجان الزيارة</p>
        </div>
      </div>

      <Tabs defaultValue="assign" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="assign" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            تعيين لجنة جديدة
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            تصفح اللجان النشطة
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assign">
          <AssignCommitteeTab />
        </TabsContent>

        <TabsContent value="active">
          <ActiveCommitteesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AssignCommitteeTab() {
  const { data, isLoading } = useSWR<PendingVisit[]>(
    "/api/admin/committees/pending-visits",
    fetcher
  );
  const [selectedVisit, setSelectedVisit] = useState<PendingVisit | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);


  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/50">
            <TableHead className="font-semibold px-4">اسم النادي</TableHead>
            <TableHead className="font-semibold px-4">تاريخ الطلب</TableHead>
            <TableHead className="font-semibold px-4">اجراء</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="px-4"><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell className="px-4"><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="px-4"><Skeleton className="h-8 w-28" /></TableCell>
              </TableRow>
            ))
          ) : data && data.length > 0 ? (
            data.map((visit) => (
              <TableRow key={visit.visit_id}>
                <TableCell className="px-4 font-medium">{visit.club_name}</TableCell>
                <TableCell className="px-4 text-muted-foreground">
                  {new Date(visit.created_at).toISOString().split("T")[0]}
                </TableCell>
                <TableCell className="px-4">
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => {
                      setSelectedVisit(visit);
                      setAssignOpen(true);
                    }}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    تعيين لجنة
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                لا توجد طلبات زيارة قيد المعالجة
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <AssignModal
        visit={selectedVisit}
        open={assignOpen}
        onOpenChange={setAssignOpen}
      />
    </div>
  );
}

function AssignModal({
  visit,
  open,
  onOpenChange,
}: {
  visit: PendingVisit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: staffList } = useSWR<StaffMember[]>(
    open ? "/api/admin/staff" : null,
    fetcher
  );
  const [leaderId, setLeaderId] = useState<string>("");
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  function toggleMember(userId: string) {
    setMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  async function handleAssign() {
    if (!visit || !leaderId) return;

    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/committees/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visit_request_id: visit.visit_id,
          leader_user_id: leaderId,
          member_user_ids: Array.from(memberIds),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "فشل تعيين اللجنة");
        toast({ title: "خطأ", description: data.error || "فشل تعيين اللجنة", variant: "destructive" });
        return;
      }

      toast({ title: "نجاح", description: "تم تعيين اللجنة بنجاح!" });
      mutate("/api/admin/committees/pending-visits");
      mutate("/api/admin/committees");

      onOpenChange(false);
      setLeaderId("");
      setMemberIds(new Set());
    } catch (err) {
      alert("فشل الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  }

  const availableMembers = staffList?.filter(
    (s) => String(s.user_id) !== leaderId
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-right">تعيين لجنة زيارة</DialogTitle>
        </DialogHeader>

        {visit && (
          <div className="flex flex-col gap-5">
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground mb-0.5">النادي</p>
              <p className="text-sm font-semibold">{visit.club_name}</p>
            </div>

            {/* Select leader */}
            <div>
              <p className="text-sm font-medium mb-2">رئيس اللجنة</p>
              <Select value={leaderId} onValueChange={setLeaderId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر رئيس اللجنة" />
                </SelectTrigger>
                <SelectContent>
                  {staffList?.map((s) => (
                    <SelectItem key={s.user_id} value={String(s.user_id)}>
                      {s.staff_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Select members */}
            <div>
              <p className="text-sm font-medium mb-2">اعضاء اللجنة</p>
              {availableMembers && availableMembers.length > 0 ? (
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto rounded-lg border border-border p-3">
                  {availableMembers.map((s) => (
                    <label
                      key={s.user_id}
                      className="flex items-center gap-3 cursor-pointer hover:bg-secondary/50 rounded-md px-2 py-1.5 transition-colors"
                    >
                      <Checkbox
                        checked={memberIds.has(s.user_id)}
                        onCheckedChange={() => toggleMember(s.user_id)}
                      />
                      <span className="text-sm">{s.staff_name}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {leaderId ? "لا يوجد موظفين اخرين" : "اختر قائد اللجنة اولا"}
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={handleAssign}
            disabled={submitting || !leaderId}
            className="gap-1.5"
          >
            <UserPlus className="h-4 w-4" />
            تعيين اللجنة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ActiveCommitteesTab() {
  const { data, isLoading } = useSWR<Committee[]>(
    "/api/admin/committees",
    fetcher
  );

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/50">
            <TableHead className=" font-semibold px-4">اسم النادي</TableHead>
            <TableHead className=" font-semibold px-4">تاريخ التعيين</TableHead>
            <TableHead className=" font-semibold px-4">الحالة</TableHead>
            <TableHead className="font-semibold px-4">التقرير</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="px-4"><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell className="px-4"><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="px-4"><Skeleton className="h-6 w-28 rounded-full" /></TableCell>
              </TableRow>
            ))
          ) : data && data.length > 0 ? (
            data.map((cm) => (
              <TableRow key={cm.committee_id}>
                <TableCell className="px-4 font-medium">{cm.club_name}</TableCell>

                <TableCell className="px-4 text-muted-foreground">
                  {new Date(cm.created_at).toISOString().split("T")[0]}
                </TableCell>

                <TableCell className="px-4">
                  <StatusBadge status={cm.status} />
                </TableCell>

                <TableCell className="px-4">
  {cm.status === "تم رفع التقرير" && cm.report_text ? ( // تأكد من استخدام report_url
    <Button 
      size="sm" 
      variant="outline" 
      className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
      asChild
    >
      <a 
        href={cm.report_text} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-1.5"
      >
        <FileText className="h-3.5 w-3.5" />
        عرض التقرير
        <ExternalLink className="h-3 w-3 opacity-50" />
      </a>
    </Button>
  ) : (
    <span className="text-muted-foreground text-xs italic">قيد الانتظار</span>
  )}
</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                لا توجد لجان نشطة
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
