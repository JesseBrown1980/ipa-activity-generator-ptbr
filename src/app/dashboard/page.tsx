import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-12">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">Painel</p>
        <h1 className="text-3xl font-bold">Bem-vindo(a), {session.user.email}</h1>
        <p className="text-muted-foreground">
          Use este espaço para acompanhar planos, gravações e atividades geradas.
        </p>
      </header>
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">
          Em breve você verá aqui os indicadores da sua organização {"("}
          {session.user.orgId ?? "sem organização"}
          {")"}. Perfil atual: {session.user.role ?? "sem papel"}.
        </p>
      </section>
    </main>
  );
}
