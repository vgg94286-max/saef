"use client";

import { useState, useEffect, useMemo, useRef } from "react";

import useSWR, { mutate } from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"



const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminClubsPage() {
    const { data: clubs, isLoading } = useSWR("/api/admin/clubs", fetcher);
    const [cities, setCities] = useState<any[]>([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [cityOpen, setCityOpen] = useState(false)
    const [isSyncing, setIsSyncing] = useState(false); // حالة المزامنة التلقائية
    const { toast } = useToast();




    const filteredCities = useMemo(() => {
        const uniqueCityNames = Array.from(new Set(cities.map((c: any) => c.name.ar)));

        if (!searchTerm) return uniqueCityNames.slice(0, 10);

        return uniqueCityNames
            .filter((name: string) => name.includes(searchTerm))
            .slice(0, 10);
    }, [searchTerm, cities]);
    // Form State
    const [form, setForm] = useState({
        club_name: "",
        email: "",
        city: "",
        account_status: "مفعل",
        license_end_date: ""
    });

    // 1. المزامنة التلقائية (مرة واحدة كل 24 ساعة)
    useEffect(() => {
        const performSync = async () => {
            setIsSyncing(true);
            try {
                const res = await fetch("/api/admin/clubs/sync", { method: "POST" });
                if (res.ok) {
                    mutate("/api/admin/clubs");
                    // حفظ وقت المزامنة الحالي في المتصفح
                    localStorage.setItem("last_club_sync", new Date().toISOString());
                }
            } catch (error) {
                console.error("Auto-sync failed:", error);
            } finally {
                setIsSyncing(false);
            }
        };

        const checkAndSync = () => {
            const lastSync = localStorage.getItem("last_club_sync");
            
            // إذا لم تكن هناك مزامنة سابقة أبداً، قم بالمزامنة
            if (!lastSync) {
                performSync();
                return;
            }

            const lastSyncDate = new Date(lastSync);
            const now = new Date();
            const timeDiff = now.getTime() - lastSyncDate.getTime();
            const hoursDiff = timeDiff / (1000 * 60 * 60);

            // إذا مر 24 ساعة (أو أكثر) على آخر مزامنة
            if (hoursDiff >= 24) {
                performSync();
            }
        };

        // التحقق فوراً عند فتح الصفحة
        checkAndSync();

        // فحص دوري كل ساعة (في حال ترك المسؤول الصفحة مفتوحة لفترة طويلة)
        const intervalId = setInterval(checkAndSync, 60 * 60 * 1000);

        return () => clearInterval(intervalId);
    }, []);

    // جلب المدن من ملف JSON
    useEffect(() => {
        fetch("/data/cities.json")
            .then(res => res.json())
            .then(data => setCities(data))
            .catch(err => console.error("Error loading cities", err));
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/admin/clubs", {
                method: "POST",
                body: JSON.stringify(form)
            });
            if (!res.ok) throw new Error();
            toast({ title: "تم بنجاح", description: "تم إنشاء حساب النادي" });
            mutate("/api/admin/clubs");
            setIsAddOpen(false);
            setForm({ club_name: "", email: "", city: "", account_status: "مفعل", license_end_date: "" });
        } catch (error) {
            toast({ title: "خطأ", description: "فشل في إنشاء الحساب", variant: "destructive" });
        } finally { setIsSubmitting(false); }
    };

   

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-[#1B4332]">إدارة حسابات الأندية</h1>
                        
                        {/* مؤشر المزامنة التلقائية الذكي */}
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100 text-[11px] text-muted-foreground border">
                            <RefreshCw className={`h-3 w-3 text-emerald-600 ${isSyncing ? "animate-spin" : ""}`} />
                            <span>{isSyncing ? "جاري التحديث الآلي..." : "مزامنة كل 30 ث"}</span>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">عرض وتفعيل حسابات الأندية المعتمدة ومزامنتها دورياً</p>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#1B4332] gap-2"><Plus className="h-4 w-4" /> إضافة نادي</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[450px]">
                        <DialogHeader><DialogTitle className="text-right font-bold">إنشاء نادي جديد</DialogTitle></DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 pt-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-[#1B4332]">اسم النادي *</label>
                                <Input required value={form.club_name} onChange={e => setForm({ ...form, club_name: e.target.value })} />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-[#1B4332]">البريد الإلكتروني *</label>
                                <Input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-[#1B4332]">المدينة *</label>
                                    <Popover
                                        open={cityOpen}
                                        onOpenChange={(open) => {
                                            setCityOpen(open);
                                            if (open) setSearchTerm("");
                                        }}
                                    >
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full justify-between"
                                            >
                                                {form.city || "اختر المدينة"}
                                            </Button>
                                        </PopoverTrigger>

                                        <PopoverContent
                                            className="w-[--radix-popover-trigger-width] p-0"
                                            side="bottom"
                                            align="start"
                                            sideOffset={6}
                                            avoidCollisions={false}
                                        >
                                            <Command>
                                                <CommandInput
                                                    placeholder="ابحث عن مدينة..."
                                                    value={searchTerm}
                                                    onValueChange={setSearchTerm}
                                                />

                                                <CommandEmpty>لا توجد نتائج مطابقة.</CommandEmpty>

                                                <CommandGroup className="max-h-56 overflow-y-auto">
                                                    {filteredCities.map((cityName, index) => (
                                                        <CommandItem
                                                            key={`city-opt-${index}`}
                                                            onSelect={() => {
                                                                setForm({ ...form, city: cityName });
                                                                setCityOpen(false);
                                                            }}
                                                        >
                                                            {cityName}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-[#1B4332]">حالة الحساب *</label>
                                    <Select onValueChange={v => setForm({ ...form, account_status: v })} defaultValue="مفعل">
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="قيد المراجعة">قيد المراجعة</SelectItem>
                                            <SelectItem value="مفعل">مفعل</SelectItem>
                                            <SelectItem value="معطل">معطل</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-[#1B4332]">تاريخ انتهاء الرخصة (اختياري)</label>
                                <Input type="date" value={form.license_end_date} onChange={e => setForm({ ...form, license_end_date: e.target.value })} />
                            </div>

                            <Button disabled={isSubmitting} className="w-full bg-[#1B4332] mt-2">
                                {isSubmitting ? <Loader2 className="animate-spin" /> : "إنشاء الحساب الآن"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-xl bg-card overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="text-right">النادي</TableHead>
                            <TableHead className="text-right">المدينة</TableHead>
                            <TableHead className="text-right">التصنيف</TableHead>
                            <TableHead className="text-right">تاريخ انتهاء العضوية</TableHead>
                            
                            <TableHead className="text-right">الرخصة</TableHead>
                            <TableHead className="text-right">الحالة</TableHead>
                            
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? <TableRow><TableCell colSpan={5} className="text-center py-10">جاري التحميل...</TableCell></TableRow> :
                            clubs?.map((club: any) => (
                                <TableRow key={club.club_id}>
                                    <TableCell>
                                        <p className="font-bold text-[#1B4332]">{club.club_name}</p>
                                        <p className="text-[10px] text-muted-foreground">{club.email}</p>
                                    </TableCell>
                                    <TableCell className="text-sm font-medium">{club.city}</TableCell>
                                    <TableCell className="text-sm font-medium">{club.category || "غير مصنف"}</TableCell>
                                    <TableCell className="text-sm font-medium">
                                        {club.membership_exp
                                            ? new Date(club.membership_exp).toISOString().split("T")[0]
                                            : "لا يوجد تاريخ انتهاء للعضوية"}
                                    </TableCell>
                                    <TableCell>
                                        {club.licence_file ? (
                                            <Button variant="ghost" size="sm" className="text-blue-600 gap-1 h-8" asChild>
                                                <a href={club.licence_file} target="_blank"><ExternalLink className="h-3 w-3" /> عرض الملف</a>
                                            </Button>
                                        ) : <span className="text-xs text-muted-foreground italic">لا يوجد ملف</span>}
                                    </TableCell>
                                    <TableCell><StatusBadge status={club.account_status} /></TableCell>
                                    
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}