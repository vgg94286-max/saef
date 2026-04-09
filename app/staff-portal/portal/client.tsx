"use client";
import { Textarea } from "@/components/ui/textarea";
import { Globe, Send, Award } from "lucide-react";
import useSWR from "swr";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import LogoutButton from "@/components/logout-button";
import { useSWRConfig } from "swr";
import { useRouter } from 'next/navigation'
import { useUploadThing } from "@/lib/uploadthing";
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
    CheckCircle2,
    XCircle,
    FileUp,
    Loader2,
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
type CertRequest = {
    request_id: number;
    full_name: string;
    national_id: string;
    championship_name: string;
    req_status: string;
    licence_card: string | null; // أضف هذا الحقل
    created_at: string;
    request_type: "cert";
};

type NoObjRequest = {
    request_id: number;
    full_name: string;
    country_from: string;
    req_status: string;
    licence_card: string | null; // أضف هذا الحقل
    created_at: string;
    request_type: "no_obj";
};

type LeaveRequest = {
    request_id: number;
    full_name: string;
    national_id: string;
    status: string; // سيتم استخدامه لعرض req_status من الـ API
    employment_name: string | null;
    employment_student_num: number | null;
    phone: string | null;
    email: string | null;
    rider_id: number;
    requester_type: string;
    region: string | null;
    cham_name: string | null;
    created_at: string;
    request_type: "leave";
};

type Championship = {
    championships_id: number;
    club_name: string;
    date: string;
    end_date: string | null;
    status: string;
    ambulance: boolean;
    created_at: string;
    request_type: "championship";
};

type RequestsData = {
    visit_requests: VisitRequest[];
    leave_requests: LeaveRequest[];
    championships: Championship[];
    cert_requests: CertRequest[];
    no_obj_requests: NoObjRequest[];
    permissions: string[];
    status?: string;
};

type CommitteeMember = { role: string; staff_name: string };
type CommitteeImage = { img_id: number; image_url: string };
type StaffCommittee = {
    committee_id: number;
    visit_id: number;
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
    employment_name: "مسمى الوظيفة/الجهة",
    employment_student_num: "الرقم الوظيفي/الجامعي",
    phone: "رقم الهاتف",
    email: "البريد الإلكتروني",
    rider_id: "رقم الفارس",
    requester_type: "نوع مقدم الطلب",
    region: "المنطقة الادارية لجهة العمل",
    cham_name: "اسم البطولة",
};

/* ---------- Page ---------- */

export default function StaffPortalPage() {
    const { data: me, isLoading } = useSWR("/api/auth/me", fetcher);
    const router = useRouter()

     useEffect(() => {
    if (!me?.user_id) {
        router.push("/")
    }
}, [me, router])


    if (isLoading) {
        return (
            <div className="space-y-4 max-w-7xl mx-auto px-4 py-6">
                {Array.from({ length: 3 }).map((_, idx) => (
                    <Skeleton key={`comm-skel-${idx}`} className="h-44 w-full rounded-xl" />
                ))}
            </div>
        );
    }

   
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" dir="rtl">
            {/* Header Styled with Federation Colors */}
            {/* Header Styled with Federation Colors */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
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

                {/* Logout Button */}
                <LogoutButton />
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
    userId,
    onOpenChange,
}: {
    committee: StaffCommittee | null;
    open: boolean;
    userId: string;
    onOpenChange: (open: boolean) => void;
}) {
    const [file, setFile] = useState<File | null>(null);
    const { toast } = useToast();
    const { mutate } = useSWRConfig();

    // إعداد أداة الرفع من UploadThing
    const { startUpload, isUploading } = useUploadThing("staffReportSubmission", {
        onClientUploadComplete: async (res) => {
            const fileUrl = res?.[0].ufsUrl;
            
            // بعد نجاح رفع الملف، نرسل الرابط إلى قاعدة البيانات
            try {
                const response = await fetch("/api/staff/reports", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        visit_request_id: committee?.visit_id,
                        committee_id: committee?.committee_id,
                        report_text: fileUrl, // نرسل الرابط بدلاً من النص
                    }),
                });

                if (!response.ok) throw new Error("فشل حفظ بيانات التقرير");

                toast({ title: "تم الرفع", description: "تم إرسال التقرير بنجاح" });
                mutate(`/api/staff/committees?user_id=${userId}`);
                onOpenChange(false);
                setFile(null);
            } catch (err) {
                toast({ 
                    title: "خطأ", 
                    description: "حدث خطأ أثناء حفظ التقرير", 
                    variant: "destructive" 
                });
            }
        },
        onUploadError: (error) => {
            toast({ title: "خطأ في الرفع", description: error.message, variant: "destructive" });
        },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
        }
    };

    async function handleUpload() {
        if (!file || !committee) return;
        
        await startUpload([file], { 
            userId, 
            committeeId: String(committee.committee_id) 
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-[#1B4332]">رفع تقرير اللجنة النهائي</DialogTitle>
                </DialogHeader>
                
                <div className="py-8 flex flex-col items-center justify-center border-2 border-dashed border-emerald-100 rounded-xl bg-emerald-50/30 gap-4">
                    <input
                        type="file"
                        id="report-upload"
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,image/*"
                    />
                    
                    {file ? (
                        <div className="flex flex-col items-center gap-2">
                            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                            <p className="text-sm font-bold text-[#1B4332]">{file.name}</p>
                            <button 
                                onClick={() => setFile(null)}
                                className="text-xs text-red-500 underline"
                            >
                                تغيير الملف
                            </button>
                        </div>
                    ) : (
                        <label 
                            htmlFor="report-upload"
                            className="flex flex-col items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity"
                        >
                            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                <FileUp className="h-6 w-6 text-[#1B4332]" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-[#1B4332]">اضغط لاختيار ملف التقرير</p>
                                <p className="text-[10px] text-muted-foreground">PDF, Word أو صور (حد أقصى 16MB)</p>
                            </div>
                        </label>
                    )}
                </div>

                <Button
                    onClick={handleUpload}
                    disabled={isUploading || !file}
                    className="bg-[#1B4332] hover:bg-[#2D6A4F] gap-2 w-full h-12"
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            جاري الرفع والمعالجة...
                        </>
                    ) : (
                        <>
                            إرسال التقرير النهائي
                            <Send className="h-4 w-4 rotate-180" />
                        </>
                    )}
                </Button>
            </DialogContent>
        </Dialog>
    );
}

/* ========== All Requests Section ========== */

function AllRequestsSection({ userId }: { userId: string }) {
    const { data, isLoading, error } = useSWR<RequestsData>(`/api/staff/requests?user_id=${userId}`, fetcher);

    const router = useRouter();

    useEffect(() => {
        // If the API returns 403 or the status is disabled, send them away
        if (data?.status === 'معطل' || (error && error.status === 403)) {
            router.push('/staff-portal/blocked');
        }
    }, [data, error, router]);



    const userPerms = data?.permissions || [];

    const [activeTab, setActiveTab] = useState<"visit" | "leave" | "championship" | "cert" | "no_obj">("visit");

    useEffect(() => {
        // This checks if the current activeTab is NOT allowed. If so, it switches to the first allowed one.
        const currentTabPerm = activeTab === 'no_obj' ? 'view_no_objection' :
            activeTab === 'visit' ? 'view_visit_requests' :
                activeTab === 'leave' ? 'view_leave_requests' :
                    activeTab === 'championship' ? 'view_championships' : 'view_request_cert';

        if (userPerms.length > 0 && !userPerms.includes(currentTabPerm)) {
            if (userPerms.includes('view_visit_requests')) setActiveTab("visit");
            else if (userPerms.includes('view_leave_requests')) setActiveTab("leave");
            else if (userPerms.includes('view_championships')) setActiveTab("championship");
            else if (userPerms.includes('view_request_cert')) setActiveTab("cert");
            else if (userPerms.includes('view_no_objection')) setActiveTab("no_obj");
        }
    }, [userPerms, activeTab]);

    const [selectedVisit, setSelectedVisit] = useState<VisitRequest | null>(null);
    const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
    const [selectedChamp, setSelectedChamp] = useState<Championship | null>(null);
    const [selectedCert, setSelectedCert] = useState<CertRequest | null>(null);
    const [selectedNoObj, setSelectedNoObj] = useState<NoObjRequest | null>(null);

    const counts = useMemo(() => ({
        // Use ?.length and wrap the whole access to handle the key being missing
        visit: data?.visit_requests?.length || 0,
        leave: data?.leave_requests?.length || 0,
        championship: data?.championships?.length || 0,
        cert: data?.cert_requests?.length || 0,
        no_obj: data?.no_obj_requests?.length || 0,
    }), [data]);

    if (isLoading) return <div className="p-10 text-center">جاري التحميل...</div>;
    return (
        <div className="space-y-4">
            {userPerms.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center p-12 bg-muted/20 rounded-2xl border-2 border-dashed">
                    <Shield className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                    <h3 className="text-lg font-bold text-[#1B4332]">لا توجد صلاحيات وصول</h3>
                    <p className="text-sm text-muted-foreground">ليس لديك صلاحية لعرض أي طلبات حالياً. يرجى مراجعة المسؤول.</p>
                </div>
            ) : (
                <>
                    <div className="flex items-center gap-2 overflow-x-auto pb-3 -mx-4 px-4 lg:mx-0 lg:px-0 no-scrollbar">
                        <div className="flex gap-2 min-w-max">
                            {userPerms.includes('view_visit_requests') && (
                                <RequestTypeButton active={activeTab === "visit"} icon={<Eye className="h-4 w-4" />} label="طلبات الزيارة" count={counts.visit} onClick={() => setActiveTab("visit")} />
                            )}

                            {userPerms.includes('view_leave_requests') && (
                                <RequestTypeButton active={activeTab === "leave"} icon={<UserCheck className="h-4 w-4" />} label="طلبات التفرغ" count={counts.leave} onClick={() => setActiveTab("leave")} />
                            )}

                            {userPerms.includes('view_championships') && (
                                <RequestTypeButton active={activeTab === "championship"} icon={<Trophy className="h-4 w-4" />} label="طلبات البطولات" count={counts.championship} onClick={() => setActiveTab("championship")} />
                            )}

                            {userPerms.includes('view_request_cert') && (
                                <RequestTypeButton active={activeTab === "cert"} icon={<Award className="h-4 w-4" />} label="طلبات الشهادات" count={counts.cert} onClick={() => setActiveTab("cert")} />
                            )}

                            {userPerms.includes('view_no_objection') && (
                                <RequestTypeButton active={activeTab === "no_obj"} icon={<Globe className="h-4 w-4" />} label="عدم الممانعة" count={counts.no_obj} onClick={() => setActiveTab("no_obj")} />
                            )}
                        </div>
                    </div>

                    <div className="lg:hidden flex items-center gap-1 text-[10px] text-muted-foreground mb-2">
                        <ChevronLeft className="h-3 w-3" />
                        <span>اسحب الجدول لليسار لمشاهدة التفاصيل</span>
                    </div>

                    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            {activeTab === "visit" && userPerms.includes('view_visit_requests') && (
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

                            {activeTab === "leave" && userPerms.includes('view_leave_requests') && (
                                <Table className="min-w-[800px]">
                                    <TableHeader className="bg-[#f0f7f4]">
                                        <TableRow>
                                            <TableHead className="text-[#1B4332] font-bold">الاسم</TableHead>
                                            <TableHead className="text-[#1B4332] font-bold">رقم الفارس</TableHead>
                                            <TableHead className="text-[#1B4332] font-bold">جهة العمل</TableHead>
                                            <TableHead className="text-[#1B4332] font-bold">تاريخ الطلب</TableHead>
                                            <TableHead className="text-[#1B4332] font-bold">الحالة</TableHead>
                                            <TableHead className="text-center text-[#1B4332] font-bold">الإجراء</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? <SkeletonRows cols={6} /> : data?.leave_requests.map((lr) => (
                                            <TableRow key={lr.request_id} className="hover:bg-[#f8faf9]">
                                                <TableCell className="font-bold text-[#2D6A4F]">{lr.full_name}</TableCell>
                                                <TableCell className="font-mono text-xs">{lr.rider_id}</TableCell>
                                                <TableCell>{lr.employment_name || "---"}</TableCell>
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


                            {activeTab === "championship" && userPerms.includes('view_championships') && (
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
                                                <TableCell className="text-muted-foreground text-xs">
                                                    <div className="flex flex-col gap-0.5">
                                                        {/* التحقق من وجود التاريخ الأول */}
                                                        <span>
                                                            من: {ch.date ? formatDate(ch.date) : ""}
                                                        </span>
                                                        {/* التحقق من وجود تاريخ الانتهاء */}
                                                        <span>
                                                            إلى: {ch.end_date ? formatDate(ch.end_date) : ""}
                                                        </span>
                                                    </div>
                                                </TableCell>

                                                <TableCell><StatusBadge status={ch.status} /></TableCell>
                                                <TableCell className="text-center">
                                                    <Button variant="outline" size="sm" className="border-[#40916C] text-[#40916C] hover:bg-[#40916C] hover:text-white" onClick={() => setSelectedChamp(ch)}>تفاصيل</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                            {/* جدول طلبات الشهادات */}
                            {activeTab === "cert" && userPerms.includes('view_request_cert') && (
                                <Table className="min-w-[700px]">
                                    <TableHeader className="bg-[#f0f7f4]">
                                        <TableRow>
                                            <TableHead className="text-[#1B4332] font-bold">الاسم</TableHead>
                                            <TableHead className="text-[#1B4332] font-bold">البطولة</TableHead>
                                            <TableHead className="text-[#1B4332] font-bold">الحالة</TableHead>
                                            <TableHead className="text-center text-[#1B4332] font-bold">الإجراء</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? <SkeletonRows cols={4} /> : data?.cert_requests.map((cr) => (
                                            <TableRow key={cr.request_id} className="hover:bg-[#f8faf9]">
                                                <TableCell className="font-bold text-[#2D6A4F]">{cr.full_name}</TableCell>
                                                <TableCell>{cr.championship_name}</TableCell>
                                                <TableCell><StatusBadge status={cr.req_status} /></TableCell>
                                                <TableCell className="text-center">
                                                    <Button variant="outline" size="sm" className="border-[#40916C] text-[#40916C] hover:bg-[#40916C] hover:text-white" onClick={() => setSelectedCert(cr)}>تفاصيل</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}

                            {/* جدول طلبات عدم الممانعة */}
                            {activeTab === "no_obj" && userPerms.includes('view_no_objection') && (
                                <Table className="min-w-[700px]">
                                    <TableHeader className="bg-[#f0f7f4]">
                                        <TableRow>
                                            <TableHead className="text-[#1B4332] font-bold">الاسم</TableHead>
                                            <TableHead className="text-[#1B4332] font-bold">الدولة</TableHead>
                                            <TableHead className="text-[#1B4332] font-bold">الحالة</TableHead>
                                            <TableHead className="text-center text-[#1B4332] font-bold">الإجراء</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? <SkeletonRows cols={4} /> : data?.no_obj_requests.map((nr) => (
                                            <TableRow key={nr.request_id} className="hover:bg-[#f8faf9]">
                                                <TableCell className="font-bold text-[#2D6A4F]">{nr.full_name}</TableCell>
                                                <TableCell>{nr.country_from}</TableCell>
                                                <TableCell><StatusBadge status={nr.req_status} /></TableCell>
                                                <TableCell className="text-center">
                                                    <Button variant="outline" size="sm" className="border-[#40916C] text-[#40916C] hover:bg-[#40916C] hover:text-white" onClick={() => setSelectedNoObj(nr)}>تفاصيل</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                            {!isLoading && counts[activeTab === 'no_obj' ? 'no_obj' : activeTab] === 0 && (
                                <div className="text-center py-20 text-muted-foreground">
                                    لا توجد طلبات حالية في هذا القسم
                                </div>
                            )}


                        </div>
                    </div>
                </>
            )}
            <VisitDetailDialog visit={selectedVisit} onClose={() => setSelectedVisit(null)} />
            <LeaveDetailDialog leave={selectedLeave} onClose={() => setSelectedLeave(null)} />
            <ChampDetailDialog
                champId={selectedChamp ? String(selectedChamp.championships_id) : null}
                open={!!selectedChamp}
                onOpenChange={(open) => !open && setSelectedChamp(null)}
            />
            <CertDetailDialog cert={selectedCert} onClose={() => setSelectedCert(null)} />
            <NoObjDetailDialog noObj={selectedNoObj} onClose={() => setSelectedNoObj(null)} />

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
                userId={userId}
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
                <DialogHeader className="border-b pb-4">
                    <DialogTitle className="flex items-center gap-2 text-[#1B4332]">
                        <UserCheck className="h-5 w-5" /> تفاصيل طلب التفرغ لمشاركة رياضية
                    </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6">
                    {/* عرض الحقول بناءً على المسميات الجديدة */}
                    {Object.entries(LEAVE_LABELS).map(([key, label]) => (
                        <InfoItem
                            key={key}
                            label={label}
                            value={leave[key as keyof LeaveRequest] ? String(leave[key as keyof LeaveRequest]) : "---"}
                        />
                    ))}

                    <Separator className="sm:col-span-2" />

                    <div className="flex items-center justify-between sm:col-span-2 bg-[#f8faf9] p-4 rounded-xl border border-dashed">
                        <InfoItem label="حالة الطلب الحالي">
                            <StatusBadge status={leave.status} />
                        </InfoItem>
                        <InfoItem label="تاريخ التقديم" value={formatDate(leave.created_at)} />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
function CertDetailDialog({ cert, onClose }: { cert: CertRequest | null; onClose: () => void }) {
    if (!cert) return null;
    return (
        <Dialog open={!!cert} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-[#1B4332]">
                        <Award className="h-5 w-5" /> تفاصيل طلب الشهادة
                    </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-4 py-4 text-right">
                    <InfoItem label="الاسم الكامل" value={cert.full_name} />
                    <InfoItem label="رقم الهوية" value={cert.national_id} />

                    <div className="bg-[#f0f7f4] p-3 rounded-lg border border-[#B7E4C7]">
                        <InfoItem label="اسم البطولة" value={cert.championship_name} />
                    </div>

                    {/* عرض زر ملف بطاقة الفارس إذا توفر */}
                    {cert.licence_card && (
                        <div className="pt-2">
                            <p className="text-[10px] text-[#40916C] uppercase font-black mb-1">المرفقات</p>
                            <a
                                href={cert.licence_card}
                                target="_blank"
                                className="flex items-center justify-center gap-2 w-full p-3 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors border border-slate-200 text-sm font-bold text-slate-700"
                            >
                                <ExternalLink className="h-4 w-4" /> عرض ملف بطاقة الفارس
                            </a>
                        </div>
                    )}

                    <div className="flex justify-between items-center border-t pt-4 mt-2">
                        <InfoItem label="تاريخ الطلب" value={formatDate(cert.created_at)} />
                        <InfoItem label="الحالة"><StatusBadge status={cert.req_status} /></InfoItem>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function NoObjDetailDialog({ noObj, onClose }: { noObj: NoObjRequest | null; onClose: () => void }) {
    if (!noObj) return null;
    return (
        <Dialog open={!!noObj} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-[#1B4332]">
                        <Globe className="h-5 w-5" /> تفاصيل طلب عدم الممانعة
                    </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-4 py-4 text-right">
                    <InfoItem label="اسم الفارس" value={noObj.full_name} />
                    <InfoItem label="الدولة المتوجه إليها" value={noObj.country_from} />
                    {/* زر عرض نسخة الجواز */}
                    {noObj.licence_card && (
                        <a href={noObj.licence_card} target="_blank" className="flex items-center justify-center gap-2 w-full p-3 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors border border-slate-200 text-sm font-bold text-slate-700">
                            <ExternalLink className="h-4 w-4" /> عرض بطاقة الفارس
                        </a>
                    )}
                    <div className="flex justify-between items-center border-t pt-4 mt-2">
                        <InfoItem label="تاريخ الطلب" value={formatDate(noObj.created_at)} />
                        <InfoItem label="الحالة"><StatusBadge status={noObj.req_status} /></InfoItem>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}


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
                            <div className="col-span-2 sm:col-span-1">
                                <p className="text-[10px] text-[#40916C] uppercase font-black tracking-wider mb-1">فترة البطولة</p>
                                <div className="flex items-center gap-2 text-sm font-semibold text-[#1B4332]">
                                    <span>{data.date ? formatDate(data.date) : ""}</span>
                                    <span className="text-muted-foreground font-normal">إلى</span>
                                    <span>{data.end_date ? formatDate(data.end_date) : ""}</span>
                                </div>
                            </div>
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