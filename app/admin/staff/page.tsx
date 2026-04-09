"use client";

import useSWR, { mutate } from "swr";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Trash2, ShieldCheck, UserCheck, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react";

const permLabels: Record<string, string> = {
  view_leave_requests: "تصفح طلبات التفرغ",
  view_championships: "تصفح البطولات الخاصة",
  view_visit_requests: "تصفح طلبات الزيارة",
  view_no_objection: "تصفح خطابات عدم الممانعة",
  view_request_cert: "تصفح طلبات المشاهد",
};
const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function StaffPage() {
  const { data: staffList, isLoading } = useSWR("/api/admin/staff", fetcher);
  const { data: allPermissions } = useSWR("/api/admin/permissions", fetcher);

  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [permTarget, setPermTarget] = useState<any>(null);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [savingPerms, setSavingPerms] = useState(false);

  const { toast } = useToast();

  // 1. Delete Logic (Original)
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      await fetch(`/api/admin/staff/${deleteTarget.user_id}`, { method: "DELETE" });
      mutate("/api/admin/staff");
      setDeleteTarget(null);
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في حذف الموظف", variant: "destructive" });
    } finally {
      toast({ title: "نجاح", description: "تم حذف الموظف بنجاح" });
      setDeleting(false);
    }
  }

  // 2. Status Toggle Logic
  async function toggleStatus(staff: any) {
    await fetch("/api/admin/staff", {
      method: "PATCH",
      body: JSON.stringify({ staff_id: staff.staff_id, current_status: staff.status }),
    });
    mutate("/api/admin/staff");
  }

  // 3. Permission Management
  async function savePermissions() {
    if (!permTarget) return;
    setSavingPerms(true);
    try {
      await fetch("/api/admin/staff/permissions", {
        method: "POST",
        body: JSON.stringify({
          staff_id: permTarget.staff_id,
          permission_ids: selectedPerms
        }),
      });
      mutate("/api/admin/staff");
      setPermTarget(null);
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في تحديث الصلاحيات", variant: "destructive" });


    } finally {
      toast({ title: "نجاح", description: "تم تحديث الصلاحيات بنجاح" });
      setSavingPerms(false);
    }
  }

  return (
    <div className="p-4 rtl text-right" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
          <Briefcase className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">موظفي الاتحاد</h1>
          <p className="text-sm text-muted-foreground">إدارة الحسابات والصلاحيات</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead className="text-right">الموظف</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-center">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <SkeletonRows /> : staffList?.map((staff: any) => (
              <TableRow key={staff.staff_id}>
                <TableCell>
                  <div className="font-medium">{staff.staff_name}</div>
                  <div className="text-xs text-muted-foreground">{staff.email}</div>
                </TableCell>
                <TableCell>
                  <Badge className={staff.status === 'مفعل' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                    {staff.status}
                  </Badge>
                </TableCell>
                <TableCell className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-amber-200 text-amber-700"
                    onClick={() => {
                      // 1. Set the target staff
                      setPermTarget(staff);
                      // 2. Pre-fill the selectedPerms state with the staff's existing IDs
                      setSelectedPerms(staff.permission_ids || []);
                    }}
                  >
                    <ShieldCheck className="h-4 w-4 ml-1" /> الصلاحيات
                  </Button>

                  <Button variant="outline" size="sm" onClick={() => toggleStatus(staff)}
                    className={staff.status === 'مفعل' ? "border-orange-200 text-orange-600" : "border-emerald-200 text-emerald-600"}>
                    {staff.status === 'مفعل' ? <UserX className="h-4 w-4 ml-1" /> : <UserCheck className="h-4 w-4 ml-1" />}
                    {staff.status === 'مفعل' ? 'تعطيل' : 'تفعيل'}
                  </Button>

                  <Button variant="outline" size="sm" className="border-red-200 text-red-600" onClick={() => setDeleteTarget(staff)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Permission Modal */}
      <Dialog open={!!permTarget} onOpenChange={() => setPermTarget(null)}>
        <DialogContent className="text-right" dir="rtl">
          <DialogHeader><DialogTitle>تعديل صلاحيات {permTarget?.staff_name}</DialogTitle></DialogHeader>
          <div className="py-4 space-y-3">
  {/* نستخدم التحقق للتأكد أنها مصفوفة، وإذا لم تكن نستخدم مصفوفة فارغة [] */}
  {(Array.isArray(allPermissions) ? allPermissions : []).map((p: any) => (
    <div key={p.perm_id} className="flex items-center gap-2">
      <Checkbox
        id={p.perm_id}
        checked={selectedPerms.includes(p.perm_id)}
        onCheckedChange={(checked) => {
          setSelectedPerms(prev =>
            checked ? [...prev, p.perm_id] : prev.filter(id => id !== p.perm_id)
          );
        }}
      />
      <label htmlFor={p.perm_id} className="text-sm font-medium leading-none cursor-pointer">
        {permLabels[p.perm_name] || p.perm_name}
      </label>
    </div>
  ))}
  
  
</div>
          <DialogFooter>
            <Button
              onClick={savePermissions}
              disabled={savingPerms}
              className="w-full sm:w-auto"
            >
              {savingPerms ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                "حفظ التغييرات"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              هل انت متأكد من حذف الموظف{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.staff_name}
              </span>
              ؟ سيتم حذف حساب المستخدم بالكامل ولا يمكن التراجع عن هذا الاجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>الغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SkeletonRows() {
  return <>{[1, 2, 3].map(i => <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-12 w-full" /></TableCell></TableRow>)}</>
}




