"use client";

import { ShieldAlert, LogOut, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/logout-button";

export default function BlockedPage() {
    return (
        <div className="min-h-screen bg-[#f8faf9] flex items-center justify-center p-4 rtl" dir="rtl">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-red-100 p-8 text-center space-y-6">

                {/* Icon Header */}
                <div className="flex justify-center">
                    <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center animate-pulse">
                        <ShieldAlert className="h-10 w-10 text-red-600" />
                    </div>
                </div>

                {/* Text Content */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-[#1B4332]">الحساب معطل</h1>
                    <p className="text-muted-foreground leading-relaxed">
                        نأسف، لا يمكنك الوصول إلى بوابة الموظفين حالياً. قد يكون الحساب جديداً ولم يتم تفعيله بعد، أو تم تعطيله من قبل الإدارة. يرجى التواصل مع قسم الإدارة لتفعيل الحساب أو الاستفسار عن السبب.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="grid gap-3 pt-4">


                    <div className="w-full">
                        <LogoutButton />
                    </div>
                </div>

                <p className="text-[10px] text-muted-foreground pt-4 uppercase tracking-widest">
                    الاتحاد السعودي للفروسية والبولو - لوحة تحكم الموظفين
                </p>
            </div>
        </div>
    );
}