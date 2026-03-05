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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Trash2 } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type StaffMember = {
  staff_id: string;
  user_id: string;
  staff_name: string;
};

export default function StaffPage() {
  const { data, isLoading } = useSWR<StaffMember[]>(
    "/api/admin/staff",
    fetcher
  );
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/staff/${deleteTarget.user_id}`, {
        method: "DELETE",
      });
      mutate("/api/admin/staff");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
          <Briefcase className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">موظفي الاتحاد</h1>
          <p className="text-sm text-muted-foreground">عرض وادارة موظفي الاتحاد</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead className="text-right font-semibold px-4">اسم الموظف</TableHead>
              <TableHead className="text-right font-semibold px-4">اجراء</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-4"><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell className="px-4"><Skeleton className="h-8 w-16" /></TableCell>
                </TableRow>
              ))
            ) : data && data.length > 0 ? (
              data.map((staff) => (
                <TableRow key={staff.staff_id}>
                  <TableCell className="px-4 font-medium">{staff.staff_name}</TableCell>
                  <TableCell className="px-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => setDeleteTarget(staff)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      حذف
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-12 text-muted-foreground">
                  لا يوجد موظفين
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
