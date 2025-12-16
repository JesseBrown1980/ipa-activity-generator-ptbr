"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RecordingStudent {
  id: string;
  code: string;
  displayName: string | null;
}

interface RecordingUser {
  id: string;
  email: string;
}

interface Recording {
  id: string;
  storageKey: string;
  mimeType: string;
  durationMs?: number | null;
  createdAt: string;
  student: RecordingStudent;
  createdBy: RecordingUser;
}

interface StudentOption {
  id: string;
  label: string;
}

interface Filters {
  studentId: string;
  startDate: string;
  endDate: string;
}

export default function RecordingsClient() {
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [filters, setFilters] = useState<Filters>({
    studentId: "",
    startDate: "",
    endDate: "",
  });
  const [appliedFilters, setAppliedFilters] = useState<Filters>({
    studentId: "",
    startDate: "",
    endDate: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrls, setDownloadUrls] = useState<Record<string, string>>({});
  const [downloadErrors, setDownloadErrors] = useState<Record<string, string>>({});

  const hasResults = useMemo(() => recordings.length > 0, [recordings]);

  const fetchStudents = useCallback(async () => {
    try {
      const response = await fetch("/api/students");
      const payload = (await response.json()) as
        | { students: RecordingStudent[] }
        | { error: string };

      if (!response.ok || "error" in payload) {
        throw new Error(
          "error" in payload ? payload.error : "Não foi possível carregar estudantes."
        );
      }

      const studentOptions = payload.students.map((student) => ({
        id: student.id,
        label: student.displayName?.trim() || student.code,
      }));

      setStudents(studentOptions);
    } catch (err) {
      console.error(err);
      setStudents([]);
    }
  }, []);

  const fetchRecordings = useCallback(async (filterParams: Filters) => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();

      if (filterParams.studentId) {
        queryParams.set("studentId", filterParams.studentId);
      }

      if (filterParams.startDate) {
        queryParams.set("startDate", filterParams.startDate);
      }

      if (filterParams.endDate) {
        queryParams.set("endDate", filterParams.endDate);
      }

      const response = await fetch(
        `/api/recordings${
          queryParams.toString() ? `?${queryParams.toString()}` : ""
        }`
      );

      const payload = (await response.json()) as
        | { recordings: Recording[] }
        | { error: string };

      if (!response.ok || "error" in payload) {
        throw new Error(
          "error" in payload ? payload.error : "Não foi possível carregar as gravações."
        );
      }

      setRecordings(payload.recordings);
    } catch (err) {
      console.error(err);
      setRecordings([]);
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar as gravações agora."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestDownloadUrl = useCallback(async (recording: Recording) => {
    setDownloadErrors((prev) => {
      const { [recording.id]: _removed, ...rest } = prev;
      return rest;
    });

    try {
      const response = await fetch("/api/storage/sign-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: recording.storageKey }),
      });

      const payload = (await response.json()) as
        | { downloadUrl: string }
        | { error: string };

      if (!response.ok || "error" in payload) {
        throw new Error(
          "error" in payload ? payload.error : "Não foi possível gerar o link de reprodução."
        );
      }

      setDownloadUrls((prev) => ({ ...prev, [recording.id]: payload.downloadUrl }));
    } catch (err) {
      console.error(err);
      setDownloadErrors((prev) => ({
        ...prev,
        [recording.id]: "Falha ao gerar a URL de reprodução.",
      }));
    }
  }, []);

  useEffect(() => {
    void fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    void fetchRecordings(appliedFilters);
  }, [appliedFilters, fetchRecordings]);

  useEffect(() => {
    const pending = recordings.filter(
      (recording) => !downloadUrls[recording.id] && !downloadErrors[recording.id]
    );

    if (!pending.length) {
      return;
    }

    pending.forEach((recording) => {
      void requestDownloadUrl(recording);
    });
  }, [downloadErrors, downloadUrls, recordings, requestDownloadUrl]);

  const formatDuration = (durationMs?: number | null) => {
    if (!durationMs || durationMs <= 0) {
      return "—";
    }

    const totalSeconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");

    return `${minutes}:${seconds}`;
  };

  const resetFilters = () => {
    setFilters({ studentId: "", startDate: "", endDate: "" });
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">Gravações</p>
        <h1 className="text-3xl font-bold">Gravações e análises</h1>
        <p className="text-muted-foreground">
          Reúna gravações de sessões e prepare-se para gerar transcrições e insights.
        </p>
      </header>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Filtrar gravações</CardTitle>
          <CardDescription>
            Selecione um estudante ou intervalo de datas para reduzir a lista exibida.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
            onSubmit={(event) => {
              event.preventDefault();
              setAppliedFilters(filters);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="student-filter">Estudante</Label>
              <Select
                value={filters.studentId}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, studentId: value }))}
              >
                <SelectTrigger id="student-filter">
                  <SelectValue placeholder="Todos os estudantes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date">Início</Label>
              <Input
                id="start-date"
                type="date"
                value={filters.startDate}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, startDate: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">Fim</Label>
              <Input
                id="end-date"
                type="date"
                value={filters.endDate}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, endDate: event.target.value }))
                }
              />
            </div>

            <div className="flex items-end gap-3">
              <Button className="w-full" type="submit">
                Aplicar filtros
              </Button>
              <Button
                className="w-full"
                type="button"
                variant="outline"
                onClick={() => {
                  resetFilters();
                  setAppliedFilters({ studentId: "", startDate: "", endDate: "" });
                }}
              >
                Limpar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <section className="rounded-lg border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Carregando gravações...</p>
        </section>
      ) : hasResults ? (
        <div className="space-y-4">
          {recordings.map((recording) => {
            const downloadUrl = downloadUrls[recording.id];
            const playbackError = downloadErrors[recording.id];

            return (
              <article
                key={recording.id}
                className="rounded-lg border bg-card p-5 shadow-sm"
                aria-label={`Gravação de ${recording.student.displayName || recording.student.code}`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{recording.student.code}</Badge>
                      <span className="font-semibold">
                        {recording.student.displayName?.trim() || "Nome não informado"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Enviado em {new Date(recording.createdAt).toLocaleString("pt-BR")}
                      {" · "}Duração: {formatDuration(recording.durationMs)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Registrado por {recording.createdBy.email}
                    </p>
                  </div>
                  <div className="w-full max-w-md space-y-2">
                    {downloadUrl ? (
                      <audio className="w-full" controls src={downloadUrl} />
                    ) : playbackError ? (
                      <div className="space-y-2 text-sm text-destructive">
                        <p role="alert">{playbackError}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void requestDownloadUrl(recording)}
                        >
                          Tentar novamente
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Gerando link seguro para reprodução...
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <section className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Nenhuma gravação encontrada</h2>
          <p className="text-sm text-muted-foreground">
            Ajuste os filtros ou envie novas gravações para vê-las listadas aqui.
          </p>
        </section>
      )}
    </div>
  );
}
