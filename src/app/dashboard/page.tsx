export default async function DashboardPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">Visão geral</p>
        <h1 className="text-3xl font-bold">Bem-vindo(a) ao painel</h1>
        <p className="text-muted-foreground">
          Acompanhe rapidamente os planos, estudantes e gravações da sua organização.
        </p>
      </header>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Resumo</h2>
          <p className="text-sm text-muted-foreground">
            Breve visão do progresso. Em breve você verá aqui indicadores e atalhos úteis.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Atalhos</h2>
          <p className="text-sm text-muted-foreground">
            Links rápidos para áreas principais do painel. Mais opções serão adicionadas.
          </p>
        </div>
      </section>
    </div>
  );
}
