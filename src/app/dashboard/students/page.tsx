"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Student {
  id: string;
  code: string;
  displayName: string | null;
  notes: string | null;
  createdAt: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [notes, setNotes] = useState("");

  const hasResults = useMemo(() => students.length > 0, [students]);

  const fetchStudents = useCallback(
    async (searchTerm: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();

        if (searchTerm.trim()) {
          params.set("search", searchTerm.trim());
        }

        const response = await fetch(
          `/api/students${params.toString() ? `?${params.toString()}` : ""}`
        );

        const data = (await response.json()) as
          | { students: Student[] }
          | { error: string };

        if (!response.ok || "error" in data) {
          setError("error" in data ? data.error : "Não foi possível carregar os estudantes.");
          setStudents([]);
          return;
        }

        setStudents(data.students);
      } catch (err) {
        console.error(err);
        setError("Não foi possível carregar os estudantes.");
        setStudents([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const handle = setTimeout(() => {
      void fetchStudents(search);
    }, 300);

    return () => clearTimeout(handle);
  }, [fetchStudents, search]);

  const resetForm = () => {
    setDisplayName("");
    setNotes("");
    setFormError(null);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim() || "",
          notes: notes.trim() || undefined,
        }),
      });

      const data = (await response.json()) as { student?: Student; error?: string };

      if (!response.ok || data.error) {
        setFormError(data.error ?? "Não foi possível criar o estudante.");
        return;
      }

      resetForm();
      setIsDialogOpen(false);
      setStudents((previous) => [data.student as Student, ...previous]);
    } catch (err) {
      console.error(err);
      setFormError("Não foi possível criar o estudante agora.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">Estudantes</p>
        <h1 className="text-3xl font-bold">Lista de estudantes</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie estudantes vinculados à sua organização.
        </p>
      </header>

      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="w-full max-w-md space-y-1">
          <Label className="sr-only" htmlFor="student-search">
            Buscar estudantes por código ou nome exibido
          </Label>
          <Input
            id="student-search"
            placeholder="Buscar por código ou nome exibido"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            A busca é feita pelo código gerado ou pelo nome exibido que você definiu.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>Criar estudante</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo estudante</DialogTitle>
              <DialogDescription>
                Crie um identificador pseudônimo. O código é gerado automaticamente.
              </DialogDescription>
            </DialogHeader>

            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="displayName">Nome exibido (opcional)</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  placeholder="Apelido ou identificador"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  maxLength={120}
                />
                <p className="text-xs text-muted-foreground">
                  Não utilize dados pessoais. Este nome é apenas para referência interna.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Resumo das necessidades e preferências de aprendizagem"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  maxLength={2000}
                />
              </div>

              {formError ? (
                <p className="text-sm text-destructive" role="alert">
                  {formError}
                </p>
              ) : null}

              <DialogFooter>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Criando..." : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Estudantes cadastrados</h2>
          <span className="text-sm text-muted-foreground">
            {isLoading ? "Carregando..." : `${students.length} encontrado(s)`}
          </span>
        </div>

        {error ? (
          <Card>
            <CardContent className="py-6">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !hasResults && !error ? (
          <Card>
            <CardHeader>
              <CardTitle>Nenhum estudante encontrado</CardTitle>
              <CardDescription>
                Crie estudantes para acompanhar progresso e histórico de atividades.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {students.map((student) => {
            const displayLabel = student.displayName?.trim()
              ? student.displayName.trim()
              : "Sem nome exibido";

            return (
              <Card key={student.id} className="flex flex-col justify-between">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span>{displayLabel}</span>
                    <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">
                      {student.code}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    {student.notes?.trim()
                      ? student.notes.trim().slice(0, 140) +
                        (student.notes.trim().length > 140 ? "..." : "")
                      : "Sem anotações adicionadas."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-0">
                  <div className="text-xs text-muted-foreground">
                    Criado em {new Date(student.createdAt).toLocaleDateString("pt-BR")}
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/students/${student.id}`}>
                      Ver detalhes
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
