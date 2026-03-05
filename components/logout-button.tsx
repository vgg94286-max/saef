
"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { logout } from "@/lib/logout";

export default function LogoutButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={logout}
      className="flex items-center gap-2"
    >
      <LogOut className="h-4 w-4" />
      تسجيل الخروج
    </Button>
  );
}