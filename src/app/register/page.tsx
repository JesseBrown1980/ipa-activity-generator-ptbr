"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const orgName = (formData.get("orgName") as string) ?? "";
    const email = (formData.get("email") as string) ?? "";
    const password = (formData.get("password") as string) ?? "";

    startTransition(async () => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgName, email, password }),
      });

      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível criar sua conta.");
        return;
      }

      setMessage(data.message ?? "Conta criada com sucesso.");
      setTimeout(() => router.push("/login"), 500);
    });
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg items-center px-4 py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Criar conta</CardTitle>
          <CardDescription>
            Cadastre sua organização e receba acesso ao painel administrativo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="orgName">Organização</Label>
              <Input
                id="orgName"
                name="orgName"
                placeholder="Escola, centro ou grupo"
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={64}
                required
                disabled={isPending}
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {message ? <p className="text-sm text-green-600">{message}</p> : null}
            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending ? "Criando conta..." : "Registrar"}
            </Button>
          </form>
          <p className="text-sm text-muted-foreground">
            Já tem acesso? {" "}
            <Link className="underline" href="/login">
              Entre aqui
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
