"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, User, Sparkles, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserStore } from "@/store/useUserStore";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/generate",
    label: "AI Generator",
    icon: Sparkles,
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, clear } = useUserStore();
  const router = useRouter();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      clear();
      router.push("/auth/signin");
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to log out. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <aside className="hidden w-64 flex-col border-r border-slate-200 bg-gradient-to-b from-slate-50 to-white shadow-lg md:flex" style={{ position: 'relative', zIndex: 50 }}>
      <div className="flex h-16 items-center px-6 bg-gradient-to-r from-indigo-600 to-purple-600">
        <h1 className="text-2xl font-bold text-white tracking-tight">Genify AI</h1>
      </div>

      <ScrollArea className="flex-1">
        <nav className="space-y-2 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = mounted ? pathname === item.href : false;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full flex items-center justify-start px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer hover:scale-[1.02] ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                    : "text-slate-700 hover:bg-slate-100 hover:text-indigo-600"
                }`}
              >
                <Icon className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-slate-200 bg-slate-50/50 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm">
          <Avatar className="ring-2 ring-indigo-200">
            <AvatarImage src="" alt={user?.email || "User"} />
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-semibold text-slate-900">
              {user?.email || "User"}
            </p>
            <p className="truncate text-xs text-slate-500">
              {user?.id ? `ID: ${user.id.slice(0, 20)}...` : "Not logged in"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}

