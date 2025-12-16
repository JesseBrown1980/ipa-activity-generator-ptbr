"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Mic2,
  Settings
} from "lucide-react";

import { cn } from "@/lib/utils";

export const dashboardNavigation = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { href: "/dashboard/plans", label: "Planos", icon: GraduationCap },
  { href: "/dashboard/students", label: "Estudantes", icon: Users },
  { href: "/dashboard/recordings", label: "Gravações", icon: Mic2 },
  { href: "/dashboard/settings", label: "Configurações", icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden border-r bg-background/80 md:flex md:w-64 md:flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <div>
          <p className="text-sm font-semibold leading-tight">Painel IPA</p>
          <p className="text-xs text-muted-foreground">Acompanhamento rápido</p>
        </div>
      </div>

      <nav
        className="flex-1 space-y-4 px-3 py-6"
        aria-label="Navegação do painel"
      >
        <p className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Menu principal
        </p>
        <ul className="space-y-1">
          {dashboardNavigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    isActive && "bg-muted text-foreground"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon className="h-4 w-4" aria-hidden />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-6 pb-6 text-xs text-muted-foreground">
        Sessões, estudantes e materiais organizados em um só lugar.
      </div>
    </aside>
  );
}
