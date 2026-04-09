"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Trophy, Plus, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminChampionshipsPage() {
    const { data: championships, isLoading } = useSWR("/api/admin/public_champ", fetcher);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newChampName, setNewChampName] = useState("");
    const { toast } = useToast();

    // إنشاء بطولة جديدة
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newChampName.trim()) return;
        
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/admin/public_champ", {
                method: "POST",
                body: JSON.stringify({ champ_name: newChampName }),
            });
            if (!res.ok) throw new Error();
            
            toast({ title: "تم بنجاح", description: "تمت إضافة البطولة العامة بنجاح" });
            mutate("/api/admin/public_champ");
            setIsAddOpen(false);
            setNewChampName("");
        } catch (error) {
            toast({ title: "خطأ", description: "فشل في إضافة البطولة", variant: "destructive" });
        } finally { setIsSubmitting(false); }
    };

    // حذف بطولة
    const handleDelete = async (id: number) => {
        if (!confirm("هل أنت متأكد من حذف هذه البطولة؟")) return;

        try {
            const res = await fetch(`/api/admin/public_champ?id=${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error();
            
            toast({ title: "تم الحذف", description: "تمت إزالة البطولة من النظام" });
            mutate("/api/admin/public_champ");
        } catch (error) {
            toast({ title: "خطأ", description: "فشل في حذف البطولة", variant: "destructive" });
        }
    };

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-[#1B4332]">إدارة البطولات المعتمدة</h1>
                    <p className="text-sm text-muted-foreground">إضافة وحذف مسميات البطولات التي تظهر للمستخدمين</p>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#1B4332] gap-2">
                            <Plus className="h-4 w-4" /> إضافة بطولة جديدة
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="text-right">إضافة مسمى بطولة</DialogTitle>
                            <DialogDescription className="sr-only">أدخل اسم البطولة الجديدة</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 pt-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-[#1B4332]">اسم البطولة *</label>
                                <Input 
                                    required 
                                    value={newChampName} 
                                    onChange={e => setNewChampName(e.target.value)} 
                                    placeholder="مثال: بطولة المملكة لقفز الحواجز"
                                />
                            </div>
                            <Button disabled={isSubmitting} className="w-full bg-[#1B4332]">
                                {isSubmitting ? <Loader2 className="animate-spin" /> : "حفظ البطولة"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-xl bg-card overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[100px] text-right">ID</TableHead>
                            <TableHead className="text-right">اسم البطولة</TableHead>
                            <TableHead className="w-[100px] text-center">الإجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={3} className="text-center py-10">جاري التحميل...</TableCell></TableRow>
                        ) : championships?.length === 0 ? (
                            <TableRow><TableCell colSpan={3} className="text-center py-10 text-muted-foreground">لا توجد بطولات مضافة</TableCell></TableRow>
                        ) : (
                            championships?.map((champ: any) => (
                                <TableRow key={champ.champ_id}>
                                    <TableCell className="font-mono text-xs">{champ.champ_id}</TableCell>
                                    <TableCell className="font-medium text-[#1B4332]">
                                        <div className="flex items-center gap-2">
                                            <Trophy className="h-4 w-4 text-amber-500" />
                                            {champ.champ_name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleDelete(champ.champ_id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}