"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

type TopbarProps = {
  userEmail?: string;
};

export function Topbar({ userEmail }: TopbarProps) {
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut({ callbackUrl: "/login" });
    });
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur">
      <div className="space-y-0.5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Navegação
        </p>
        <p className="text-base font-semibold">Painel</p>
      </div>
      <div className="flex items-center gap-4">
        {userEmail ? (
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {userEmail}
          </span>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          disabled={isPending}
        >
          <LogOut className="mr-2 h-4 w-4" aria-hidden />
          {isPending ? "Saindo..." : "Sair"}
        </Button>
      </div>
    </header>
  );
}
