"use client";

import { Button } from "@/components/ui/button";
import {
    Calendar,
    ClipboardList,
    Eye,
    Trophy,
    Plus,
    Building2,
    CheckCircle2,
    Clock,
    XCircle,
    FileText,
} from "lucide-react";
import  AccountStatusBadge from "@/components/club-account-status";
import { useRouter } from "next/navigation";

type VisitRequest = { status: string; created_at: string };
type Tournament = { status: string; created_at: string };

type DashboardData = {
    club: { club_name: string; account_status: string };
    visitRequests: VisitRequest[];
    tournaments: Tournament[];
};

function StatusBadge({ status }: { status: string }) {
    if (status === "قيد المعالجة")
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="h-3 w-3" />
                {status}
            </span>
        );

    if (status === "تمت الموافقة")
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-3 w-3" />
                {status}
            </span>
        );

    if (status === "مرفوض")
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                <XCircle className="h-3 w-3" />
                {status}
            </span>
        );

    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
            {status}
        </span>
    );
}

function TypeBadge({ type }: { type: "visit" | "tournament" }) {
    if (type === "visit") {
        return (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Eye className="h-3.5 w-3.5" />
                طلب زيارة
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Trophy className="h-3.5 w-3.5" />
            بطولة خاصة
        </span>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
    accent,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number;
    accent?: boolean;
}) {
    return (
        <div
            className={`rounded-xl border p-5 flex items-center gap-4 ${accent
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-card-foreground border-border"
                }`}
        >
            <div
                className={`flex items-center justify-center h-11 w-11 rounded-lg ${accent ? "bg-primary-foreground/15" : "bg-secondary"
                    }`}
            >
                <Icon className={`h-5 w-5 ${accent ? "text-primary-foreground" : "text-primary"}`} />
            </div>
            <div>
                <p className={`text-2xl font-bold ${accent ? "text-primary-foreground" : "text-card-foreground"}`}>
                    {value}
                </p>
                <p className={`text-sm ${accent ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
                    {label}
                </p>
            </div>
        </div>
    );
}

export function ClubDashboard({ data }: { data: DashboardData }) {
    const { club, visitRequests, tournaments } = data;
    const isActive = club.account_status === "مفعل";
    const allRequests = [
        ...visitRequests.map((r) => ({ ...r, type: "visit" as const })),
        ...tournaments.map((t) => ({ ...t, type: "tournament" as const })),
    ];
    const router = useRouter();



    return (
        <div className="min-h-screen bg-background">
            {/* Top Header Bar */}
            <header className="bg-card border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo + Title */}
                        <div className="flex items-center gap-4">
                            <img
                                src="/saef.png"
                                alt="شعار الاتحاد السعودي للفروسية"
                                className="h-22 w-auto"
                            />
                            <div className="hidden sm:block h-10 w-px bg-border" />
                            <div className="hidden sm:block">
                                <p className="text-sm font-bold text-foreground">لوحة تحكم الاندية</p>
                                <p className="text-xs text-muted-foreground">Club Dashboard</p>
                            </div>
                        </div>

                        {/* Club info */}
                        <div className="flex items-center gap-3">
                            <div className="text-left">
                                <p className="text-sm font-semibold text-foreground">{club.club_name}</p>
                                <AccountStatusBadge status={club.account_status} />
                            </div>
                            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground">
                                <Building2 className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        icon={ClipboardList}
                        label="اجمالي الطلبات"
                        value={allRequests.length}
                        accent
                    />
                    <StatCard
                        icon={Eye}
                        label="طلبات الزيارة"
                        value={visitRequests.length}
                    />
                    <StatCard
                        icon={Trophy}
                        label="البطولات الخاصة"
                        value={tournaments.length}
                    />

                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 mb-8">
                    <Button className="gap-2" onClick={() => router.push("/visit-req")}>

                        <Plus className="h-4 w-4 hover:cursor-pointer" />
                        انشاء طلب زيارة جديد
                    </Button>

                    <div className="relative group">
                        <Button
                        onClick={() => router.push("/championship")}
                            disabled={!isActive}
                            variant="outline"
                            className="gap-2 hover:cursor-pointer border-primary text-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
                        >
                            <Trophy className="h-4 w-4" />
                            انشاء بطولة خاصة
                        </Button>

                        {!isActive && (
                            <div className="absolute hidden group-hover:block top-12 right-0 z-10 bg-foreground text-background text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
                                {club.account_status === "قيد المراجعة" &&
                                    "لا يمكن طلب بطولة: الحساب تحت المراجعة"}
                                {club.account_status === "معطل" &&
                                    "لا يمكن طلب بطولة: الحساب معطل من الإدارة"}
                            </div>
                        )}
                    </div>
                </div>

                {/* Requests Table */}
                <section className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
                        <FileText className="h-5 w-5 text-primary" />
                        <h2 className="text-base font-bold text-card-foreground">الطلبات</h2>
                        <span className="mr-auto inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                            {allRequests.length}
                        </span>
                    </div>

                    {allRequests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-secondary mb-4">
                                <ClipboardList className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-base font-medium text-foreground mb-1">لا توجد طلبات</p>
                            <p className="text-sm text-muted-foreground">
                                ابدأ بإنشاء طلب زيارة جديد او بطولة خاصة
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border bg-secondary/50">
                                        <th className="text-right text-xs font-semibold text-muted-foreground px-6 py-3">
                                            اسم النادي
                                        </th>
                                        <th className="text-right text-xs font-semibold text-muted-foreground px-6 py-3">
                                            نوع الطلب
                                        </th>
                                        <th className="text-right text-xs font-semibold text-muted-foreground px-6 py-3">
                                            تاريخ الإنشاء
                                        </th>
                                        <th className="text-right text-xs font-semibold text-muted-foreground px-6 py-3">
                                            الحالة
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allRequests.map((req, i) => (
                                        <tr
                                            key={`${req.type}-${i}`}
                                            className="border-b border-border last:border-b-0 hover:bg-secondary/30 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <span className="flex items-center gap-2 text-sm font-medium text-card-foreground">
                                                    <Building2 className="h-4 w-4 text-primary" />
                                                    {club.club_name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <TypeBadge type={req.type} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {new Date(req.created_at).toLocaleDateString("en-US", {
                                                        month: "long",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={req.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {/* Footer */}
                <footer className="mt-10 text-center">
                    <p className="text-xs text-muted-foreground">
                        الاتحاد السعودي للفروسية - Saudi Arabian Equestrian Federation
                    </p>
                </footer>
            </main>
        </div>
    );
}
