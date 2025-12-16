import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

type StudentPageProps = {
  params: { id: string };
};

export default async function StudentDetailPage({ params }: StudentPageProps) {
  const session = await auth();

  if (!session?.user?.orgId) {
    notFound();
  }

  const student = await prisma.student.findFirst({
    where: { id: params.id, orgId: session.user.orgId },
  });

  if (!student) {
    notFound();
  }

  const createdAtLabel = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(student.createdAt);

  const displayLabel = student.displayName?.trim()
    ? student.displayName.trim()
    : "Sem nome exibido";

  const notesContent = student.notes?.trim();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">Estudante</p>
        <h1 className="text-3xl font-bold">{displayLabel}</h1>
        <p className="text-muted-foreground">
          Código pseudônimo: <span className="font-semibold">{student.code}</span>
        </p>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
            Criado em {createdAtLabel}
          </span>
          <Link href="/dashboard/students" className="text-primary hover:underline">
            Voltar para a lista
          </Link>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Notas e contexto</CardTitle>
            <CardDescription>
              Registre observações relevantes sem incluir dados pessoais do estudante.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {notesContent ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{notesContent}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma anotação adicionada ainda. Use este espaço para acompanhar
                necessidades e preferências de aprendizagem.
              </p>
            )}
            <div className="text-xs text-muted-foreground">
              As anotações são visíveis apenas para a equipe da organização.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Identificador seguro</CardTitle>
            <CardDescription>
              Código gerado automaticamente, sem dados pessoais.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border bg-muted px-3 py-2 text-center text-lg font-semibold">
              {student.code}
            </div>
            <p className="text-sm text-muted-foreground">
              Compartilhe este código com sua equipe para relacionar atividades,
              gravações e planos ao estudante de forma pseudonimizada.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Últimas gravações</CardTitle>
            <CardDescription>
              Em breve você verá aqui as sessões mais recentes vinculadas a este estudante.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Nenhuma gravação disponível ainda. Quando houver envios, eles aparecerão aqui para consulta rápida.
            </p>
            <Button asChild variant="secondary">
              <Link href="/dashboard/recordings">Ir para gravações</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Planos recentes</CardTitle>
            <CardDescription>
              Consulte rapidamente planos pedagógicos associados a este estudante.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Você ainda não adicionou planos relacionados. Crie ou vincule planos para acompanhar progresso e próximos passos.
            </p>
            <Button asChild>
              <Link href="/dashboard/plans">Criar ou revisar planos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
