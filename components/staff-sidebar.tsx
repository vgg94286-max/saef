"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ClipboardList, Users, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/staff/portal", label: "جميع الطلبات", icon: ClipboardList },
  { href: "/staff/portal", hash: "#committees", label: "لجاني", icon: Users },
];

export function StaffSidebar({ staffName }: { staffName?: string }) {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 right-0 z-40 flex h-screen w-64 flex-col border-l border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/SAEF%20LOGO%20Main%20Version%20Arabic%20English%20Gradient%20Horizontal%20RGB-GhMRo2vxCVeXYHqDU773uKZHjfJnVk.png"
          alt="شعار الاتحاد السعودي للفروسية"
          className="h-10 w-auto brightness-0 invert"
        />
      </div>

      {/* Title */}
      <div className="px-5 py-4 border-b border-sidebar-border">
        <p className="text-xs font-semibold text-sidebar-primary tracking-wide">بوابة الموظف</p>
        <p className="text-[10px] text-sidebar-foreground/50 mt-0.5">Staff Portal</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          <li>
            <Link
              href="/staff/portal"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                pathname === "/staff/portal"
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <ClipboardList className="h-4.5 w-4.5 shrink-0" />
              جميع الطلبات واللجان
            </Link>
          </li>
          <li>
            <Link
              href="/admin/visit-requests"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
            >
              <Home className="h-4.5 w-4.5 shrink-0" />
              لوحة تحكم الادارة
            </Link>
          </li>
        </ul>
      </nav>

      {/* Staff name */}
      {staffName && (
        <div className="border-t border-sidebar-border px-5 py-4">
          <p className="text-xs text-sidebar-foreground/60">الموظف:</p>
          <p className="text-sm font-medium text-sidebar-foreground mt-0.5">{staffName}</p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-sidebar-border px-5 py-3">
        <p className="text-[10px] text-sidebar-foreground/40 text-center">
          الاتحاد السعودي للفروسية
        </p>
      </div>
    </aside>
  );
}
