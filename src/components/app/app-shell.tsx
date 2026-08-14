import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Mic,
  PenLine,
  Languages,
  Headphones,
  Library,
  LineChart,
  LogOut,
  Menu,
  X,
  GraduationCap,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const studentLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/lessons", label: "Daily lessons", icon: BookOpen },
  { to: "/speaking", label: "Speaking", icon: Mic },
  { to: "/writing", label: "Writing", icon: PenLine },
  { to: "/vocabulary", label: "Vocabulary", icon: Library },
  { to: "/translation", label: "Translation", icon: Languages },
  { to: "/shadowing", label: "Shadowing", icon: Headphones },
  { to: "/rooms", label: "Speaking rooms", icon: Users },
  { to: "/progress", label: "Progress", icon: LineChart },
  { to: "/profile", label: "Profile", icon: UserRound },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  const nav = (
    <nav aria-label="Student navigation" className="flex flex-1 flex-col gap-1 p-3">
      {studentLinks.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium" }}
        >
          <l.icon className="size-4" aria-hidden />
          {l.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <Link to="/" className="flex items-center gap-2 text-sidebar-foreground">
            <span className="surface-accent flex size-7 items-center justify-center rounded-lg">
              <GraduationCap className="size-4" aria-hidden />
            </span>
            <span className="font-display text-sm">CSE English</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
            className="text-sidebar-foreground lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>
        {nav}
        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="size-4" aria-hidden /> Sign out
          </Button>
        </div>
      </aside>

      {open ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-hidden
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-border px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            className="inline-flex size-10 items-center justify-center rounded-md border border-border"
          >
            <Menu className="size-5" />
          </button>
          <span className="font-display text-sm">CSE Professional English</span>
        </header>
        <main className="flex-1 px-4 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
