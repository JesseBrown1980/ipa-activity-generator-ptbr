export default function StudentsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">Estudantes</p>
        <h1 className="text-3xl font-bold">Lista de estudantes</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie estudantes vinculados à sua organização.
        </p>
      </header>
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Nenhum estudante encontrado</h2>
        <p className="text-sm text-muted-foreground">
          Adicione estudantes para acompanhar progresso e histórico de atividades.
        </p>
      </section>
    </div>
  );
}
