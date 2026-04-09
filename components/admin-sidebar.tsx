"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Eye,
  UserCheck,
  Trophy,
  Users,
  Briefcase,
  Menu,
  Globe,
  Award,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";

const NAV_ITEMS = [
  { href: "/admin/visit-requests", label: "طلبات الزيارة", icon: Eye },
  { href: "/admin/leave-requests", label: "طلبات التفرغ", icon: UserCheck },
  { href: "/admin/request_cert", label: "طلبات المشاهد", icon: Award },
  { href: "/admin/request_no_obj", label: "طلبات عدم الممانعة", icon: Globe },
  { href: "/admin/championships", label: "طلبات البطولات الخاصة", icon: Trophy },
  { href: "/admin/clubs", label: "الأندية", icon: Building2 },
  { href: "/admin/committees", label: "اللجان", icon: Users },
  { href: "/admin/staff", label: "موظفي الاتحاد", icon: Briefcase },
  { href: "/admin/public_champ", label: "البطولات المعتمدة", icon: Trophy },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Helper component for the internal navigation list
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground rtl">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
        <img
          src="/Saef.png"
          alt="شعار الاتحاد السعودي للفروسية"
          className="h-10 w-auto"
        />
      </div>

      {/* Title */}
      <div className="px-5 py-4 border-b border-sidebar-border">
        <p className="text-xs font-semibold text-sidebar-primary tracking-wide">
          لوحة تحكم الإدارة
        </p>
        <p className="text-[10px] text-sidebar-foreground/50 mt-0.5">
          Admin Dashboard
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)} // Close drawer on link click
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="h-4.5 w-4.5 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-5 py-4">
        <p className="text-[10px] text-sidebar-foreground/40 text-center">
          الاتحاد السعودي للفروسية والبولو
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* MOBILE TRIGGER (Visible only on small screens) */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-sidebar border-sidebar-border">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="p-0 w-64 border-l-sidebar-border">
            {/* الإصلاح هنا: إضافة Header مع عنوان ووصف مخفيين */}
            <SheetHeader className="sr-only">
              <SheetTitle>قائمة التنقل</SheetTitle>
              <SheetDescription>قائمة روابط الإدارة للوصول السريع</SheetDescription>
            </SheetHeader>

            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* DESKTOP SIDEBAR (Visible only on lg screens and up) */}
      <aside className="hidden lg:flex fixed top-0 right-0 z-40 h-screen w-64 flex-col border-l border-sidebar-border bg-sidebar text-sidebar-foreground">
        <SidebarContent />
      </aside>
    </>
  );
}