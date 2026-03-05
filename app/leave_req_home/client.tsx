"use client";

import useSWR from "swr";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { PageHeader } from "@/components/page-header-d&f"
import { Footer } from "@/components/footer"
import { useRouter } from "next/navigation";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function LeaveRequestsPage() {
  const { data, error, isLoading } = useSWR("/api/select-leave-req", fetcher);
  const [selected, setSelected] = useState<any | null>(null);

  const statusLabels: Record<string, string> = {
    approved: "تمت الموافقة",
    rejected: "مرفوض",
    pending: "قيد المراجعة",
  };

  const router = useRouter();

  return (
    <div>
    <PageHeader></PageHeader>
    <div className="container mx-auto px-4 py-10 space-y-10">
    
      <h1 className="text-3xl font-bold text-foreground text-center mb-2">
  أهلاً {data?.leaveRequests?.[0]?.full_name.split(" ")[0] || "بك"}، هذه صفحة طلبات التفرغ الخاصة بك
</h1>
<h2 className="text-xl text-muted-foreground text-center mb-4">
  طلبات التفرغ
</h2>

      {/* New Request Button */}
      <Card className="bg-primary/5">
        <CardHeader>
          <CardTitle className="text-foreground">تقديم طلب جديد</CardTitle>
          <CardDescription className="text-muted-foreground">
            اضغط على الزر أدناه للانتقال إلى نموذج تقديم طلب جديد
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => router.push("/leave-request-logged") }
          >
            تقديم طلب جديد
          </Button>
        </CardContent>
      </Card>

      {/* Previous Requests */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground mb-2">طلبات سابقة</h2>

        {isLoading ? (
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <p className="text-red-500">حدث خطأ أثناء جلب البيانات</p>
        ) : !data?.leaveRequests?.length ? (
          <p className="text-muted-foreground">لا توجد طلبات سابقة</p>
        ) : (
          data.leaveRequests.map((req: any) => (
            <Card key={req.id} className="bg-white/5">
              <CardHeader>
                <CardTitle className="text-foreground">{req.full_name}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {req.email} | {req.national_id} | {req.employer}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    req.req_status === "approved"
                      ? "bg-green-100 text-green-800"
                      : req.req_status === "rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {statusLabels[req.req_status] || req.req_status}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-foreground border-muted-foreground"
                  onClick={() => setSelected(req)}
                >
                  عرض التفاصيل
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Details Modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تفاصيل الطلب</DialogTitle>
            <DialogClose asChild>
              <Button size="sm" variant="ghost" className="absolute top-3 left-3 p-1">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </DialogHeader>
          {selected && (
            <div className="space-y-2 mt-4 text-sm">
              <p><strong>الاسم الكامل:</strong> {selected.full_name}</p>
              <p><strong>الهوية الوطنية:</strong> {selected.national_id}</p>
              <p><strong>جهة العمل:</strong> {selected.employer}</p>
              <p><strong>البريد الإلكتروني:</strong> {selected.email}</p>
              <p><strong>الهاتف:</strong> {selected.phone}</p>
              <p><strong>الطول (سم):</strong> {selected.height_cm}</p>
              <p><strong>الوزن (كجم):</strong> {selected.weight_kg}</p>
              <p><strong>الراتب:</strong> {selected.salary}</p>
              <p><strong>الحالة الاجتماعية:</strong> {selected.marital_status}</p>
              <p><strong>العنوان الوطني:</strong> {selected.national_address}</p>
              <p><strong>تاريخ الطلب:</strong> {new Date(selected.created_at).toLocaleDateString("ar-SA")}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
        
    </div>
    <Footer />
    </div>
  );
}