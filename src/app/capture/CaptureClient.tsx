"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

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

type ConsentInfo = {
  audioAllowed: boolean;
  signedAt: string;
};

type CaptureStudent = {
  id: string;
  code: string;
  displayName: string;
  consent: ConsentInfo | null;
};

type CaptureClientProps = {
  initialStudents: CaptureStudent[];
};

type RecordingState = "idle" | "recording" | "uploading";

type ConsentMap = Record<string, ConsentInfo | null>;

export default function CaptureClient({ initialStudents }: CaptureClientProps) {
  const [students, setStudents] = useState<CaptureStudent[]>(initialStudents);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [consentByStudent, setConsentByStudent] = useState<ConsentMap>(() => {
    return initialStudents.reduce<ConsentMap>((map, student) => {
      map[student.id] = student.consent;
      return map;
    }, {});
  });
  const [codeQuery, setCodeQuery] = useState("");
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [isLoadingConsent, setIsLoadingConsent] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number | null>(null);

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId),
    [selectedStudentId, students]
  );

  const selectedConsent = selectedStudentId
    ? consentByStudent[selectedStudentId] ?? null
    : null;

  const canRecord = Boolean(selectedStudent && selectedConsent?.audioAllowed);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [previewUrl]);

  const refreshConsent = async (studentId: string) => {
    setIsLoadingConsent(true);
    try {
      const response = await fetch(`/api/students/${studentId}/consent`);
      if (!response.ok) {
        throw new Error("Falha ao consultar consentimento");
      }

      const payload = (await response.json()) as { consent: ConsentInfo | null };
      setConsentByStudent((prev) => ({ ...prev, [studentId]: payload.consent }));
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível atualizar o consentimento agora.");
    } finally {
      setIsLoadingConsent(false);
    }
  };

  const handleStudentChange = (studentId: string) => {
    setSelectedStudentId(studentId);
    setRecordingDuration(null);
    setPreviewUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });

    void refreshConsent(studentId);
  };

  const handleCodeSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = codeQuery.trim();
    if (!trimmed) {
      return;
    }

    const normalized = trimmed.toUpperCase();
    const localMatch = students.find((student) => student.code === normalized);

    if (localMatch) {
      setSelectedStudentId(localMatch.id);
      void refreshConsent(localMatch.id);
      toast.success("Estudante selecionado pelo código.");
      return;
    }

    try {
      const response = await fetch(`/api/students?search=${encodeURIComponent(trimmed)}`);
      if (!response.ok) {
        throw new Error("Erro ao buscar estudante");
      }
      const payload = (await response.json()) as { students: CaptureStudent[] };
      const found = payload.students.find((student) => student.code === normalized);

      if (!found) {
        toast.error("Nenhum estudante encontrado com esse código.");
        return;
      }

      setStudents((prev) => {
        const exists = prev.some((student) => student.id === found.id);
        return exists ? prev : [...prev, { ...found, consent: null }];
      });
      setSelectedStudentId(found.id);
      setConsentByStudent((prev) => ({ ...prev, [found.id]: null }));
      void refreshConsent(found.id);
      toast.success("Estudante carregado.");
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível localizar o estudante.");
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleStartRecording = async () => {
    if (!selectedStudent) {
      toast.error("Selecione um estudante antes de gravar.");
      return;
    }

    if (!selectedConsent?.audioAllowed) {
      toast.error("Gravação bloqueada sem consentimento de áudio.");
      return;
    }

    if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
      toast.error("Seu navegador não suporta gravação de áudio.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stopStream();
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        const duration = startedAtRef.current
          ? Math.max(0, Date.now() - startedAtRef.current)
          : null;
        startedAtRef.current = null;
        setRecordingDuration(duration);

        setPreviewUrl((prev) => {
          if (prev) {
            URL.revokeObjectURL(prev);
          }
          return URL.createObjectURL(blob);
        });

        setRecordingState("uploading");
        await uploadRecording(blob, duration ?? undefined);
        setRecordingState("idle");
      };

      recorder.start();
      startedAtRef.current = Date.now();
      mediaRecorderRef.current = recorder;
      setRecordingState("recording");
      toast.message("Gravação iniciada", {
        description: "Toque em 'Parar' para enviar o áudio.",
      });
    } catch (error) {
      console.error(error);
      stopStream();
      setRecordingState("idle");
      toast.error("Não foi possível iniciar a gravação.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const uploadRecording = async (blob: Blob, durationMs?: number) => {
    if (!selectedStudent) {
      toast.error("Selecione um estudante antes de enviar.");
      return;
    }

    const mimeType = blob.type || "audio/webm";
    try {
      const signResponse = await fetch("/api/storage/sign-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mimeType, studentId: selectedStudent.id }),
      });

      if (!signResponse.ok) {
        const errorPayload = await signResponse.json().catch(() => null);
        const message = errorPayload?.error ?? "Erro ao preparar o upload.";
        throw new Error(message);
      }

      const { key, uploadUrl, headers } = (await signResponse.json()) as {
        key: string;
        uploadUrl: string;
        headers?: Record<string, string>;
      };

      const uploadHeaders = new Headers(headers ?? {});
      if (!uploadHeaders.has("Content-Type")) {
        uploadHeaders.set("Content-Type", mimeType);
      }

      const uploadResult = await fetch(uploadUrl, {
        method: "PUT",
        headers: uploadHeaders,
        body: blob,
      });

      if (!uploadResult.ok) {
        throw new Error("Falha ao enviar o áudio para o armazenamento.");
      }

      const payload: Record<string, unknown> = {
        storageKey: key,
        mimeType,
        studentId: selectedStudent.id,
      };

      if (durationMs && durationMs > 0) {
        payload.durationMs = Math.round(durationMs);
      }

      const recordingResponse = await fetch("/api/recordings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!recordingResponse.ok) {
        const errorPayload = await recordingResponse.json().catch(() => null);
        const message = errorPayload?.error ?? "Não foi possível registrar a gravação.";
        throw new Error(message);
      }

      toast.success("Gravação enviada com sucesso.");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Não foi possível salvar a gravação."
      );
    }
  };

  const consentStatus = (() => {
    if (!selectedStudentId) {
      return "Selecione um estudante para verificar o consentimento.";
    }

    if (isLoadingConsent) {
      return "Consultando consentimento...";
    }

    if (!selectedConsent) {
      return "Nenhum consentimento registrado para este estudante.";
    }

    return selectedConsent.audioAllowed
      ? "Consentimento para áudio ativo."
      : "Consentimento de áudio negado.";
  })();

  const formattedDuration = useMemo(() => {
    if (!recordingDuration) return null;
    const seconds = Math.round(recordingDuration / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }, [recordingDuration]);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-6">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">Coleta móvel</p>
        <h1 className="text-3xl font-bold">Capturar áudio do estudante</h1>
        <p className="text-muted-foreground">
          Registre gravações breves diretamente no navegador. Certifique-se de que o
          consentimento de áudio está ativo antes de iniciar.
        </p>
      </header>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Selecionar estudante</CardTitle>
          <CardDescription>
            Busque pelo código compartilhado ou escolha na lista da organização.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-2" onSubmit={handleCodeSearch}>
            <Label htmlFor="code">Código do estudante</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="code"
                placeholder="Ex.: ABC123"
                value={codeQuery}
                onChange={(event) => setCodeQuery(event.target.value.toUpperCase())}
                className="sm:max-w-xs"
              />
              <Button type="submit" variant="secondary" className="sm:w-auto">
                Buscar pelo código
              </Button>
            </div>
          </form>

          {students.length > 0 ? (
            <div className="space-y-2">
              <Label>Selecionar da lista</Label>
              <Select
                value={selectedStudentId}
                onValueChange={(value) => handleStudentChange(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Escolha um estudante" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.code} — {student.displayName || "Sem nome"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum estudante cadastrado ainda. Cadastre alunos no painel antes de gravar.
            </p>
          )}

          {selectedStudent ? (
            <div className="rounded-md border bg-muted/50 p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">Selecionado:</span>
                <Badge variant="outline">{selectedStudent.code}</Badge>
                <span className="text-muted-foreground">
                  {selectedStudent.displayName || "Sem nome cadastrado"}
                </span>
              </div>
              <p className="mt-2 text-muted-foreground">{consentStatus}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Gravar áudio</CardTitle>
          <CardDescription>
            Permita o acesso ao microfone do dispositivo. O arquivo será enviado
            diretamente para o armazenamento seguro.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedConsent?.audioAllowed ? (
            <div className="rounded-md border border-dashed bg-muted/40 p-4">
              <p className="text-sm font-semibold">Gravação bloqueada</p>
              <p className="text-sm text-muted-foreground">
                É necessário registrar consentimento de áudio antes de gravar. Confirme com
                o responsável e registre no painel.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" asChild>
                  <Link href="/dashboard/students">Abrir cadastro de estudantes</Link>
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={handleStartRecording}
              disabled={!canRecord || recordingState !== "idle"}
            >
              {recordingState === "recording" ? "Gravando..." : "Iniciar gravação"}
            </Button>
            <Button
              variant="outline"
              onClick={handleStopRecording}
              disabled={recordingState !== "recording"}
            >
              Parar e enviar
            </Button>
          </div>

          <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Status</p>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              <li>
                Estudante: {selectedStudent ? selectedStudent.code : "não selecionado"}
              </li>
              <li>
                Consentimento: {selectedConsent?.audioAllowed ? "autorizado" : "bloqueado"}
              </li>
              <li>Microfone: {recordingState === "recording" ? "gravando" : "pronto"}</li>
              <li>
                Upload: {recordingState === "uploading" ? "enviando" : "aguardando"}
              </li>
              {formattedDuration ? <li>Duração: {formattedDuration}</li> : null}
            </ul>
          </div>

          {previewUrl ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Prévia do áudio</p>
              <audio className="w-full" controls src={previewUrl} />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
