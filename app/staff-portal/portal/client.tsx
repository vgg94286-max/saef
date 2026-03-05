"use client";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import useSWR from "swr";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useSWRConfig } from "swr";
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";

import {
    ClipboardList,
    Eye,
    UserCheck,
    Trophy,
    Users,
    FileText,
    ExternalLink,
    ImageIcon,
    Ambulance,
    Shield,
    MapPin,
    ChevronLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast"

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/* ---------- Types ---------- */
type Prize = { prize_id: string; position: string; amount: number };
type Round = { round_id: string; name: string; round_order: number; prizes: Prize[] };
type Judge = { judge_id: string; judge_name: string };
type ChampDetail = Championship & {
    ambulance: boolean;
    judges: Judge[];
    rounds: Round[];
    total_prizes: number;
};

type VisitRequest = {
    visit_id: number;
    club_name: string;
    status: string;
    created_at: string;
    license_file: string | null;
    license_end_date: string | null;
    request_type: "visit";
};

type LeaveRequest = {
    request_id: number;
    full_name: string;
    national_id: string;
    status: string;
    employer: string | null;
    phone: string | null;
    email: string | null;
    height_cm: number | null;
    weight_kg: number | null;
    salary: number | null;
    marital_status: string | null;
    national_address: string | null;
    created_at: string;
    request_type: "leave";
};

type Championship = {
    championships_id: number;
    club_name: string;
    date: string;
    status: string;
    ambulance: boolean;
    created_at: string;
    request_type: "championship";
};

type RequestsData = {
    visit_requests: VisitRequest[];
    leave_requests: LeaveRequest[];
    championships: Championship[];
};

type CommitteeMember = { role: string; staff_name: string };
type CommitteeImage = { img_id: number; image_url: string };
type StaffCommittee = {
    committee_id: number;
    visit_request_id: number;
    committee_status: string;
    committee_created_at: string;
    role: string;
    club_name: string;
    visit_status: string;
    visit_created_at: string;
    license_file: string | null;
    license_end_date: string | null;
    members: CommitteeMember[];
    images: CommitteeImage[];
};

const LEAVE_LABELS: Record<string, string> = {
    full_name: "الاسم الكامل",
    national_id: "رقم الهوية",
    employer: "جهة العمل",
    phone: "الهاتف",
    email: "البريد الالكتروني",
    marital_status: "الحالة الاجتماعية",
    national_address: "العنوان الوطني",
    height_cm: "الطول (سم)",
    weight_kg: "الوزن (كجم)",
    salary: "الراتب",


};

/* ---------- Page ---------- */

export default function StaffPortalPage() {
    const { data: me, isLoading } = useSWR("/api/auth/me", fetcher);
    const router = useRouter()

    if (isLoading) {
        return (
            <div className="space-y-4 max-w-7xl mx-auto px-4 py-6">
                {Array.from({ length: 3 }).map((_, idx) => (
                    <Skeleton key={`comm-skel-${idx}`} className="h-44 w-full rounded-xl" />
                ))}
            </div>
        );
    }

    if (!me?.user_id) {
        router.push("/")
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" dir="rtl">
            {/* Header Styled with Federation Colors */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-[#2D6A4F] to-[#1B4332] shadow-sm shrink-0">
                    <ClipboardList className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-[#1B4332]">بوابة الموظف</h1>
                    <p className="text-sm text-muted-foreground">
                        مرحباً، <span className="font-bold text-[#40916C]">{me.staff_name}</span>
                    </p>
                </div>
            </div>

            <Tabs defaultValue="requests" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 max-w-md bg-secondary/20 p-1 rounded-xl">
                    <TabsTrigger
                        value="requests"
                        className="font-bold data-[state=active]:bg-[#1B4332] data-[state=active]:text-white transition-all"
                    >
                        جميع الطلبات
                    </TabsTrigger>
                    <TabsTrigger
                        value="committees"
                        className="font-bold data-[state=active]:bg-[#1B4332] data-[state=active]:text-white transition-all"
                    >
                        لجاني الميدانية
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="requests" className="space-y-6">
                    <AllRequestsSection userId={String(me.user_id)} />
                </TabsContent>

                <TabsContent value="committees">
                    <MyCommitteesSection userId={String(me.user_id)} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function SubmitReportModal({
    committee,
    open,
    onOpenChange,
}: {
    committee: StaffCommittee | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [reportText, setReportText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { mutate } = useSWRConfig(); // Import this from 'swr'
    const {toast} = useToast()

    async function handleSubmit() {
        if (!committee || !reportText.trim()) return;

        console.log({
  visit_request_id: committee.visit_request_id,
  committee_id: committee.committee_id,
  report_text: reportText,
});

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/staff/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    visit_request_id: committee.visit_request_id,
                    committee_id: committee.committee_id,
                    report_text: reportText,
                }),
            });

            if (!res.ok) throw new Error();

            // Refresh data and close
            toast({
      title: "تم",
      description: "تم رفع التقرير بنجاح",
    })
            mutate(`/api/staff/committees`);// Or your specific key
            onOpenChange(false);
            setReportText("");
        } catch (err) {
             toast({
          title: "خطأ",
          description: (err as Error).message || "حدث خطأ غير متوقع",
          variant: "destructive",
        })
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-[#1B4332]">رفع تقرير اللجنة - {committee?.club_name}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Textarea
                        placeholder="اكتب التقرير الميداني هنا..."
                        className="min-h-[200px] text-right"
                        value={reportText}
                        onChange={(e) => setReportText(e.target.value)}
                    />
                </div>
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !reportText.trim()}
                    className="bg-[#1B4332] hover:bg-[#2D6A4F] gap-2"
                >
                    {isSubmitting ? "جاري الإرسال..." : "إرسال التقرير النهائي"}
                    <Send className="h-4 w-4 rotate-180" />
                </Button>
            </DialogContent>
        </Dialog>
    );
}

/* ========== All Requests Section ========== */

function AllRequestsSection({ userId }: { userId: string }) {
    const { data, isLoading } = useSWR<RequestsData>(`/api/staff/requests?user_id=${userId}`, fetcher);
    const [activeTab, setActiveTab] = useState<"visit" | "leave" | "championship">("visit");

    const [selectedVisit, setSelectedVisit] = useState<VisitRequest | null>(null);
    const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
    const [selectedChamp, setSelectedChamp] = useState<Championship | null>(null);

    const counts = useMemo(() => ({
        visit: data?.visit_requests.length || 0,
        leave: data?.leave_requests.length || 0,
        championship: data?.championships.length || 0,
    }), [data]);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-3 -mx-4 px-4 lg:mx-0 lg:px-0 no-scrollbar">
                <div className="flex gap-2 min-w-max">
                    <RequestTypeButton active={activeTab === "visit"} icon={<Eye className="h-4 w-4" />} label="طلبات الزيارة" count={counts.visit} onClick={() => setActiveTab("visit")} />
                    <RequestTypeButton active={activeTab === "leave"} icon={<UserCheck className="h-4 w-4" />} label="طلبات التفرغ" count={counts.leave} onClick={() => setActiveTab("leave")} />
                    <RequestTypeButton active={activeTab === "championship"} icon={<Trophy className="h-4 w-4" />} label="طلبات البطولات" count={counts.championship} onClick={() => setActiveTab("championship")} />
                </div>
            </div>

            <div className="lg:hidden flex items-center gap-1 text-[10px] text-muted-foreground mb-2">
                <ChevronLeft className="h-3 w-3" />
                <span>اسحب الجدول لليسار لمشاهدة التفاصيل</span>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    {activeTab === "visit" && (
                        <Table className="min-w-[700px]">
                            <TableHeader className="bg-[#f0f7f4]">
                                <TableRow>
                                    <TableHead className=" text-[#1B4332] font-bold">اسم النادي</TableHead>
                                    <TableHead className=" text-[#1B4332] font-bold">تاريخ الطلب</TableHead>
                                    <TableHead className=" text-[#1B4332] font-bold">انتهاء الرخصة</TableHead>
                                    <TableHead className=" text-[#1B4332] font-bold">الحالة</TableHead>
                                    <TableHead className="text-center text-[#1B4332] font-bold">الإجراء</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? <SkeletonRows cols={5} /> : data?.visit_requests.map((vr) => (
                                    <TableRow key={vr.visit_id} className="hover:bg-[#f8faf9]">
                                        <TableCell className="font-bold text-[#2D6A4F]">{vr.club_name}</TableCell>
                                        <TableCell className="text-muted-foreground">{formatDate(vr.created_at)}</TableCell>
                                        <TableCell className="text-muted-foreground">{vr.license_end_date ? formatDate(vr.license_end_date) : "---"}</TableCell>
                                        <TableCell><StatusBadge status={vr.status} /></TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="outline" size="sm" className="border-[#40916C] text-[#40916C] hover:bg-[#40916C] hover:text-white" onClick={() => setSelectedVisit(vr)}>تفاصيل</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}

                    {activeTab === "leave" && (
                        <Table className="min-w-[800px]">
                            <TableHeader className="bg-[#f0f7f4]">
                                <TableRow>
                                    <TableHead className=" text-[#1B4332] font-bold">الاسم</TableHead>
                                    <TableHead className=" text-[#1B4332] font-bold">رقم الهوية</TableHead>
                                    <TableHead className=" text-[#1B4332] font-bold">جهة العمل</TableHead>
                                    <TableHead className=" text-[#1B4332] font-bold">تاريخ الطلب</TableHead>
                                    <TableHead className=" text-[#1B4332] font-bold">الحالة</TableHead>
                                    <TableHead className="text-center text-[#1B4332] font-bold">الإجراء</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? <SkeletonRows cols={6} /> : data?.leave_requests.map((lr) => (
                                    <TableRow key={lr.request_id} className="hover:bg-[#f8faf9]">
                                        <TableCell className="font-bold text-[#2D6A4F]">{lr.full_name}</TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground">{lr.national_id}</TableCell>
                                        <TableCell>{lr.employer || "---"}</TableCell>
                                        <TableCell className="text-muted-foreground">{formatDate(lr.created_at)}</TableCell>
                                        <TableCell><StatusBadge status={lr.status} /></TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="outline" size="sm" className="border-[#40916C] text-[#40916C] hover:bg-[#40916C] hover:text-white" onClick={() => setSelectedLeave(lr)}>تفاصيل</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}

                    {activeTab === "championship" && (
                        <Table className="min-w-[700px]">
                            <TableHeader className="bg-[#f0f7f4]">
                                <TableRow>
                                    <TableHead className=" text-[#1B4332] font-bold">اسم النادي</TableHead>
                                    <TableHead className=" text-[#1B4332] font-bold">تاريخ البطولة</TableHead>

                                    <TableHead className=" text-[#1B4332] font-bold">الحالة</TableHead>
                                    <TableHead className="text-center text-[#1B4332] font-bold">الإجراء</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? <SkeletonRows cols={5} /> : data?.championships.map((ch) => (
                                    <TableRow key={ch.championships_id} className="hover:bg-[#f8faf9]">
                                        <TableCell className="font-bold text-[#2D6A4F]">{ch.club_name}</TableCell>
                                        <TableCell className="text-muted-foreground">{formatDate(ch.date)}</TableCell>

                                        <TableCell><StatusBadge status={ch.status} /></TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="outline" size="sm" className="border-[#40916C] text-[#40916C] hover:bg-[#40916C] hover:text-white" onClick={() => setSelectedChamp(ch)}>تفاصيل</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>

            <VisitDetailDialog visit={selectedVisit} onClose={() => setSelectedVisit(null)} />
            <LeaveDetailDialog leave={selectedLeave} onClose={() => setSelectedLeave(null)} />
            <ChampDetailDialog
                champId={selectedChamp ? String(selectedChamp.championships_id) : null}
                open={!!selectedChamp}
                onOpenChange={(open) => !open && setSelectedChamp(null)}
            />
        </div>
    );
}

/* ========== My Committees Section ========== */

function MyCommitteesSection({ userId }: { userId: string }) {
    const { data, isLoading } = useSWR<StaffCommittee[]>(`/api/staff/committees?user_id=${userId}`, fetcher);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [selectedCommittee, setSelectedCommittee] = useState<StaffCommittee | null>(null);
    const [reportOpen, setReportOpen] = useState(false);

    if (isLoading) return <div className="space-y-4">{[1, 2].map(i => <Skeleton key={i} className="h-44 w-full rounded-xl" />)}</div>;
    if (!data?.length) return <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed border-border text-muted-foreground font-bold">لا توجد لجان مسجلة حالياً</div>;

    return (
        <div className="grid grid-cols-1 gap-6">
            {data.map((c) => (
                <Card key={c.committee_id} className="overflow-hidden border-border hover:border-[#40916C]/40 transition-all shadow-md">
                    <CardHeader className="bg-gradient-to-l from-[#f0f7f4] to-transparent pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-[#1B4332]/10 flex items-center justify-center shrink-0">
                                    <MapPin className="h-5 w-5 text-[#1B4332]" />
                                </div>
                                <div>
                                    <CardTitle className="text-base text-[#1B4332]">{c.club_name}</CardTitle>
                                    <p className="text-xs text-muted-foreground">{c.committee_id}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 self-start sm:self-center">
                                <RoleBadge role={c.role} />
                                <StatusBadge status={c.committee_status} />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            <InfoItem label="تاريخ التعيين" value={formatDate(c.committee_created_at)} />
                            <InfoItem label="تاريخ طلب الزيارة" value={formatDate(c.visit_created_at)} />
                            <InfoItem label="حالة الزيارة"><StatusBadge status={c.visit_status} /></InfoItem>
                            <div className="space-y-1">
                                <p className="text-[10px] text-[#40916C] uppercase font-black">رابط الملف</p>
                                {c.license_file ? (
                                    <a href={c.license_file} target="_blank" className="text-xs text-[#1B4332] font-bold hover:underline flex items-center gap-1">
                                        <ExternalLink className="h-3 w-3" /> استعراض رخصة نافس
                                    </a>
                                ) : <p className="text-xs font-medium text-muted-foreground">---</p>}
                            </div>
                        </div>

                        <Separator className="my-4" />

                        <div className="space-y-3">
                            <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                <Users className="h-4 w-4 text-[#40916C]" /> أعضاء اللجنة ({c.members.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {c.members.map((m, idx) => (
                                    <div key={idx} className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium ${m.role === 'رئيس' ? 'bg-[#1B4332]/10 text-[#1B4332] border border-[#1B4332]/20' : 'bg-muted text-muted-foreground'}`}>
                                        {m.staff_name} <span className="text-[10px] opacity-70">({m.role})</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {c.images && c.images.length > 0 && (
                            <div className="mt-6">
                                <Button variant="secondary" size="sm" className="w-full sm:w-auto gap-2 bg-[#f0f7f4] text-[#1B4332] hover:bg-[#D8F3DC]" onClick={() => setExpandedId(expandedId === c.committee_id ? null : c.committee_id)}>
                                    <ImageIcon className="h-4 w-4" />
                                    {expandedId === c.committee_id ? "إخفاء الصور الميدانية" : `عرض الصور الميدانية (${c.images.length})`}
                                </Button>
                                {expandedId === c.committee_id && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-4">
                                        {c.images.map((img) => (
                                            <a key={img.img_id} href={img.image_url} target="_blank" className="aspect-square rounded-lg overflow-hidden border border-border">
                                                <img src={img.image_url} alt="Visit" className="w-full h-full object-cover hover:scale-110 transition-transform" />
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {c.role === "رئيس" && c.committee_status !== "تم رفع التقرير" && (
                            <div className="mt-6">
                                <Button
                                    onClick={() => {
                                        setSelectedCommittee(c);
                                        setReportOpen(true);
                                    }}
                                    className="bg-[#1B4332] hover:bg-[#2D6A4F] gap-2"
                                >
                                    <FileText className="h-4 w-4" />
                                    رفع التقرير
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
            <SubmitReportModal
                committee={selectedCommittee}
                open={reportOpen}
                onOpenChange={setReportOpen}
            />
        </div>
    );


}

/* ========== Dialog Components ========== */

function VisitDetailDialog({ visit, onClose }: { visit: VisitRequest | null; onClose: () => void }) {
    if (!visit) return null;
    return (
        <Dialog open={!!visit} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-[#1B4332]">
                        <Eye className="h-5 w-5" /> تفاصيل طلب الزيارة
                    </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-4 py-4">
                    <InfoItem label="اسم النادي" value={visit.club_name} />
                    <InfoItem label="تاريخ التقديم" value={formatDate(visit.created_at)} />
                    <InfoItem label="انتهاء الرخصة" value={visit.license_end_date ? formatDate(visit.license_end_date) : "غير متوفر"} />
                    <InfoItem label="الحالة"><StatusBadge status={visit.status} /></InfoItem>
                    {visit.license_file && (
                        <a href={visit.license_file} target="_blank" className="flex items-center justify-center gap-2 p-3 rounded-lg bg-[#1B4332] text-white text-sm font-bold shadow-sm">
                            <ExternalLink className="h-4 w-4" /> فتح ملف الرخصة الرسمي
                        </a>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function LeaveDetailDialog({ leave, onClose }: { leave: LeaveRequest | null; onClose: () => void }) {
    if (!leave) return null;
    return (
        <Dialog open={!!leave} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-[#1B4332]">
                        <UserCheck className="h-5 w-5" /> تفاصيل طلب التفرغ
                    </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4">
                    {Object.entries(LEAVE_LABELS).map(([key, label]) => (
                        <InfoItem key={key} label={label} value={String(leave[key as keyof LeaveRequest] || "---")} />
                    ))}
                    <InfoItem label="الحالة"><StatusBadge status={leave.status} /></InfoItem>
                    <InfoItem label="تاريخ الطلب" value={formatDate(leave.created_at)} />
                </div>
            </DialogContent>
        </Dialog>
    );
}

import { Award } from "lucide-react"; // Added Award icon

function ChampDetailDialog({
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-[#1B4332]">
                        <Trophy className="h-5 w-5" /> تفاصيل البطولة
                    </DialogTitle>
                </DialogHeader>

                {isLoading || !data ? (
                    <div className="flex flex-col gap-3 py-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-4 w-full rounded-md" />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col gap-5 mt-4">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-6">
                            <InfoItem label="اسم النادي" value={data.club_name} />
                            <InfoItem label="الحالة">
                                <StatusBadge status={data.status} />
                            </InfoItem>
                            <InfoItem label="تاريخ البطولة" value={formatDate(data.date)} />
                            <InfoItem label="إسعاف">
                                <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${data.ambulance ? "text-emerald-600" : "text-red-500"}`}>
                                    <Ambulance className="h-4 w-4" />
                                    {data.ambulance ? "متوفر" : "غير متوفر"}
                                </span>
                            </InfoItem>
                        </div>

                        <Separator />

                        {/* Judges */}
                        <div className="space-y-3">
                            <p className="text-xs font-black text-[#40916C] uppercase flex items-center gap-1.5">
                                <Users className="h-4 w-4" /> الحكام ({data.judges.length})
                            </p>
                            {data.judges.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {data.judges.map((j) => (
                                        <span
                                            key={j.judge_id}
                                            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[#f0f7f4] text-[#1B4332] border border-[#B7E4C7] text-xs font-bold"
                                        >
                                            {j.judge_name}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic px-2">لا يوجد حكام مسجلين</p>
                            )}
                        </div>

                        <Separator />

                        {/* Rounds & Prizes */}
                        <div className="space-y-4">
                            <p className="text-xs font-black text-[#40916C] uppercase flex items-center gap-1.5">
                                <Award className="h-4 w-4" /> الأشواط والجوائز
                            </p>
                            {data.rounds.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {data.rounds.map((round) => (
                                        <div key={round.round_id} className="rounded-xl border border-border bg-card p-4 shadow-sm hover:border-[#40916C]/30 transition-colors">
                                            <p className="text-sm font-black text-[#1B4332] mb-3 border-b pb-2">{round.name}</p>
                                            {round.prizes.length > 0 ? (
                                                <div className="space-y-2">
                                                    {round.prizes.map((prize) => (
                                                        <div key={prize.prize_id} className="flex items-center justify-between text-xs">
                                                            <span className="text-muted-foreground font-medium">{prize.position}</span>
                                                            <span className="font-bold text-[#2D6A4F]">
                                                                {Number(prize.amount).toLocaleString("ar-SA")} ر.س
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-muted-foreground">لا يوجد جوائز محددة لهذا الشوط</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic px-2">لا يوجد أشواط مسجلة</p>
                            )}
                        </div>

                        {/* Total Footer */}
                        <div className="rounded-xl bg-[#1B4332] p-4 flex items-center justify-between shadow-lg">
                            <span className="text-sm font-bold text-white/90">إجمالي الجوائز المالية</span>
                            <span className="text-xl font-black text-white">
                                {data.total_prizes.toLocaleString("ar-SA")} ر.س
                            </span>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

/* ========== Helpers & Utility Components ========== */

function RequestTypeButton({ active, icon, label, count, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${active
                    ? "bg-[#1B4332] text-white border-[#1B4332] shadow-md"
                    : "bg-white text-muted-foreground border-border hover:border-[#40916C]/50 hover:text-[#1B4332]"
                }`}
        >
            {icon} {label}
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${active ? "bg-white/20" : "bg-muted"}`}>{count}</span>
        </button>
    );
}

function RoleBadge({ role }: { role: string }) {
    const isLeader = role === "رئيس" || role === "قائد";
    return (
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase ${isLeader ? "bg-[#1B4332] text-white border border-[#1B4332]" : "bg-[#D8F3DC] text-[#1B4332] border border-[#B7E4C7]"}`}>
            {isLeader && <Shield className="h-3 w-3" />} {role}
        </span>
    );
}

function InfoItem({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <p className="text-[10px] text-[#40916C] uppercase font-black tracking-wider">{label}</p>
            {children || <p className="text-sm font-semibold text-[#1B4332]">{value || "---"}</p>}
        </div>
    );
}

function SkeletonRows({ cols }: { cols: number }) {
    return (
        <>
            {[1, 2, 3].map((rowIdx) => (
                <TableRow key={`row-${rowIdx}`}>
                    {Array.from({ length: cols }).map((_, colIdx) => (
                        <TableCell key={`col-${colIdx}`}>
                            <Skeleton className="h-4 w-full" />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

function formatDate(dateStr: string) {
    if (!dateStr) return "---";
    try {
        return new Date(dateStr).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
    } catch {
        return dateStr;
    }
}