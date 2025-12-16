export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">Configurações</p>
        <h1 className="text-3xl font-bold">Preferências da conta</h1>
        <p className="text-muted-foreground">
          Ajuste notificações, membros e dados da organização em um só lugar.
        </p>
      </header>
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Configurações básicas</h2>
        <p className="text-sm text-muted-foreground">
          Em breve você poderá editar informações da conta e permissões de acesso.
        </p>
      </section>
    </div>
  );
}
