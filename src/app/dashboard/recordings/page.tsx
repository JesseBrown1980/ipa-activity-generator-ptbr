export default function RecordingsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">Gravações</p>
        <h1 className="text-3xl font-bold">Gravações e análises</h1>
        <p className="text-muted-foreground">
          Reúna gravações de sessões e prepare-se para gerar transcrições e insights.
        </p>
      </header>
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Nenhuma gravação enviada</h2>
        <p className="text-sm text-muted-foreground">
          Quando você adicionar áudios ou vídeos, eles aparecerão aqui para revisão.
        </p>
      </section>
    </div>
  );
}
