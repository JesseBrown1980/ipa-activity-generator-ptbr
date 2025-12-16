export default function PlansPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">Planos</p>
        <h1 className="text-3xl font-bold">Planos de intervenção</h1>
        <p className="text-muted-foreground">
          Centralize objetivos, sessões e atividades futuras neste espaço.
        </p>
      </header>
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Nenhum plano cadastrado ainda</h2>
        <p className="text-sm text-muted-foreground">
          Em breve você poderá criar, revisar e compartilhar planos de aula personalizados.
        </p>
      </section>
    </div>
  );
}
