"use client";

import useSWR from "swr";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, X, FileText, Send, Award, Clock, Trophy  } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header-d&f";
import { Footer } from "@/components/footer";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/logout-button";

const fetcher = (url: string) => fetch(url).then(res => res.json());

// 1. نافذة طلب التفرغ (Leave Request)
const LeaveRequestContent = ({ data, statusLabels }: any) => (
  <div className="grid grid-cols-2 gap-y-4 gap-x-6 mt-6 text-sm">
    <DetailItem label="الاسم الكامل" value={data.full_name} />
    <DetailItem label="الهوية الوطنية" value={data.national_id} />
    <DetailItem label="المسمى الوظيفي" value={data.employment_name} />
    <DetailItem label="الرقم الوظيفي/الجامعي" value={data.employment_student_num} />
    <DetailItem label="رقم الفارس" value={data.rider_id} />
    <DetailItem label="المنطقة الادارية لجهة العمل" value={data.region} />
    <DetailItem label="نوع المتقدم" value={data.requester_type} />
    <DetailItem label="رقم الجوال" value={data.phone} />
    <div className="col-span-2 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
      <DetailItem label="اسم البطولة" value={data.cham_name} />
    </div>
  </div>
);

// 2. نافذة طلب شهادة (Request Cert)
const CertRequestContent = ({ data, statusLabels }: any) => (
  <div className="grid grid-cols-2 gap-y-4 gap-x-6 mt-6 text-sm">
    <DetailItem label="الاسم الكامل" value={data.full_name} />
    <DetailItem label="الهوية الوطنية" value={data.national_id} />
    <DetailItem label="البريد الإلكتروني" value={data.email} />
    <div className="flex flex-col gap-1">
      <p className="text-xs text-muted-foreground font-medium">بطاقة الفارس</p>
      <a 
        href={data.licence_card} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-emerald-700 hover:text-emerald-900 font-bold underline"
      >
        <FileText className="h-4 w-4" />
        عرض الملف المرفق
      </a>
    </div>
    <div className="col-span-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
      <DetailItem label="اسم البطولة" value={data.championship_name} />
    </div>
  </div>
);

// 3. نافذة طلب عدم ممانعة (Request No Obj)
const NoObjRequestContent = ({ data, statusLabels }: any) => (
  <div className="grid grid-cols-2 gap-y-4 gap-x-6 mt-6 text-sm">
    <DetailItem label="الاسم الكامل" value={data.full_name} />
    <DetailItem label="البريد الإلكتروني" value={data.email} />
    <div className="flex flex-col gap-1">
      <p className="text-xs text-muted-foreground font-medium">بطاقة الفارس</p>
      <a 
        href={data.licence_card} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-emerald-700 hover:text-emerald-900 font-bold underline"
      >
        <FileText className="h-4 w-4" />
        عرض الملف المرفق
      </a>
    </div>
    <div className="col-span-2 bg-amber-50 p-3 rounded-lg border border-amber-100">
      <DetailItem label="الدولة المتوجه إليها" value={data.country_from} />
    </div>
  </div>
);

export default function LeaveRequestsPage() {
  // Matches the API structure from our previous step
  const { data, error, isLoading } = useSWR("/api/select-leave-req", fetcher);
  const [selected, setSelected] = useState<any | null>(null);
  const router = useRouter();

  const statusLabels: Record<string, string> = {
    approved: "مقبول",
    rejected: "مرفوض",
    pending: "قيد المراجعة",
    "قيد المراجعة": "قيد المراجعة", // Handling Arabic DB defaults
  };

  const getStatusColor = (status: string) => {
    if (status === "approved" || status === "مقبول") return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (status === "rejected" || status === "مرفوض") return "bg-rose-100 text-rose-700 border-rose-200";
    return "bg-amber-100 text-amber-700 border-amber-200";
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <div className="flex items-center justify-between bg-white border-b px-6">
        <PageHeader />
        <LogoutButton />
      </div>

      <div className="container mx-auto px-4 py-10 space-y-10 flex-grow" dir="rtl">
        {/* Welcome Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-800">
            أهلاً {data?.leaveRequests?.[0]?.full_name?.split(" ")[0] || "بك"}
          </h1>
          <p className="text-muted-foreground">مرحباً بك في بوابة خدمات الاتحاد السعودي للفروسية والبولو</p>
        </div>

        {/* 3 Main Action Buttons/Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ActionCard 
            title="طلب تفرغ جديد" 
            desc="تقديم طلب تفرغ رسمي للمشاركة في البطولات" 
            icon={<Clock className="w-8 h-8 text-emerald-700" />}
            onClick={() => router.push("/leave-request-logged")}
          />
          <ActionCard 
            title="خطاب عدم ممانعة جديد" 
            desc="اصدار خطاب عدم ممانعة للمشاركات الخارجية" 
            icon={<Send className="w-8 h-8 text-emerald-700" />}
            onClick={() => router.push("/request-no-obj-logged")}
          />
          <ActionCard 
            title="طلب مشهد جديد للحضور والمشاركة" 
            desc="طلب شهادة أو مشهد حضور ومشاركة رسمي من الاتحاد" 
            icon={<Award className="w-8 h-8 text-emerald-700" />}
            onClick={() => router.push("/request-cert-logged")}
          />
        </div>

        {/* Requests List Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-800" />
            سجل الطلبات
          </h2>

          <Tabs defaultValue="leave" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="leave">طلبات التفرغ</TabsTrigger>
              <TabsTrigger value="no-obj">خطابات عدم الممانعة</TabsTrigger>
              <TabsTrigger value="cert">طلبات المشاهد</TabsTrigger>
            </TabsList>

            {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-800" /></div>
            ) : (
              <>
                <TabsContent value="leave">
                  <RequestTable 
                    requests={data?.leaveRequests} 
                    onView={setSelected} 
                    statusLabels={statusLabels} 
                    getStatusColor={getStatusColor} 
                  />
                </TabsContent>
                <TabsContent value="no-obj">
                  <RequestTable 
                    requests={data?.noObjRequests} 
                    onView={setSelected} 
                    statusLabels={statusLabels} 
                    getStatusColor={getStatusColor} 
                  />
                </TabsContent>
                <TabsContent value="cert">
                  <RequestTable 
                    requests={data?.certRequests} 
                    onView={setSelected} 
                    statusLabels={statusLabels} 
                    getStatusColor={getStatusColor} 
                  />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>

   
<Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
  <DialogContent className="max-w-md bg-white overflow-hidden" dir="rtl">
    <DialogHeader className="border-b pb-4 bg-slate-50 -mx-6 -mt-6 p-6">
      <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
        {/* تغيير العنوان حسب نوع الجدول المستهدف */}
        {selected?.cham_name ? "تفاصيل طلب تفرغ" : 
         selected?.championship_name ? "تفاصيل طلب شهادة" : 
         "تفاصيل طلب عدم ممانعة"}
      </DialogTitle>
    </DialogHeader>

    {selected && (
      <>
        {/* اختيار المحتوى بناءً على الحقول الفريدة لكل جدول */}
        {selected.cham_name && <LeaveRequestContent data={selected} />}
        
        {selected.championship_name && <CertRequestContent data={selected} />}
        
        {selected.country_from && <NoObjRequestContent data={selected} />}

        {/* تذييل مشترك لجميع الطلبات */}
        <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-6">
          <DetailItem label="تاريخ الطلب" value={new Date(selected.created_at).toLocaleDateString("ar-SA")} />
          <div className="text-left self-end">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              selected.req_status === "approved" ? "bg-green-100 text-green-700" : 
              selected.req_status === "rejected" ? "bg-red-100 text-red-700" : 
              "bg-yellow-100 text-yellow-700"
            }`}>
              {statusLabels[selected.req_status] || selected.req_status}
            </span>
          </div>
          <div className="col-span-2 mt-2">
            <p className="text-[10px] text-muted-foreground italic text-center">بوابة الاتحاد السعودي للفروسية والبولو</p>
          </div>
        </div>
      </>
    )}
  </DialogContent>
</Dialog>
      </div>
      <Footer />
    </div>
  );
}

// Helper Components
function ActionCard({ title, desc, icon, onClick }: any) {
  return (
    <Card className="hover:shadow-lg transition-all border-t-4 border-t-emerald-800 cursor-pointer group" onClick={onClick}>
      <CardHeader className="flex flex-row items-center space-x-4 space-x-reverse">
        <div className="p-3 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
          {icon}
        </div>
        <div>
          <CardTitle className="text-lg text-emerald-900">{title}</CardTitle>
          <CardDescription className="text-xs">{desc}</CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
}

function RequestTable({ requests, onView, statusLabels, getStatusColor }: any) {
  if (!requests?.length) return <p className="text-center py-10 text-muted-foreground">لا توجد طلبات في هذا القسم</p>;

  return (
    <div className="space-y-3 mt-4">
      {requests.map((req: any) => (
        <Card key={req.request_id || req.id} className="overflow-hidden border-r-4 border-r-emerald-600">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-700">{req.full_name}</h3>
              <p className="text-xs text-muted-foreground">
                {new Date(req.created_at).toLocaleDateString("ar-SA")} | {req.email || "بدون بريد"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(req.req_status)}`}>
                {statusLabels[req.req_status] || req.req_status}
              </span>
              <Button size="sm" variant="ghost" className="text-emerald-800 hover:text-emerald-900 hover:bg-emerald-50" onClick={() => onView(req)}>
                التفاصيل
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">{label}</p>
      <p className="font-semibold text-slate-800">{value}</p>
    </div>
  );
}