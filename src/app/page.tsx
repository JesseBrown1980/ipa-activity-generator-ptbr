import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-12 sm:px-8">
      <header className="flex flex-col gap-4">
        <Badge className="w-fit" variant="secondary">
          Versão inicial
        </Badge>
        <h1 className="text-4xl font-bold leading-tight text-balance">
          Gerador de atividades a partir de alvos fonéticos (IPA)
        </h1>
        <p className="text-lg text-muted-foreground">
          Ferramenta em Português pensada para professores de Educação Especial. As propostas
          são geradas a partir de alvos de fala em IPA, sempre priorizando privacidade e consentimento.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Como funciona</CardTitle>
            <CardDescription>
              Descreva seus alvos de IPA, o contexto do estudante e receba sugestões de atividades
              acessíveis e inclusivas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ipa">Alvos em IPA</Label>
              <Textarea
                id="ipa"
                placeholder="Ex.: /p/, /b/, contrastes de sonoridade..."
                aria-describedby="ipa-help"
              />
              <p id="ipa-help" className="text-xs text-muted-foreground">
                Informe os fonemas ou combinações que deseja trabalhar. Usamos esses dados somente
                para gerar as propostas.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="idade">Faixa etária</Label>
                <Select>
                  <SelectTrigger id="idade">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3-5">3 a 5 anos</SelectItem>
                    <SelectItem value="6-8">6 a 8 anos</SelectItem>
                    <SelectItem value="9-12">9 a 12 anos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contexto">Contexto</Label>
                <Input id="contexto" placeholder="Sala de recursos, atendimento individual..." />
              </div>
            </div>
            <Button className="w-full sm:w-auto">Gerar atividades</Button>
          </CardContent>
        </Card>

        <Card className="bg-muted/40">
          <CardHeader>
            <CardTitle>Módulo opcional de áudio</CardTitle>
            <CardDescription>
              Se habilitado com consentimento, capta breves amostras para acompanhar avanços
              e ajustar propostas. Desativado por padrão.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              O uso de áudio é sempre opcional e transparente. Nenhum dado é guardado sem permissão
              explícita, e você controla quando gravar e descartar amostras.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  Ver detalhes de consentimento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Consentimento informado</DialogTitle>
                  <DialogDescription>
                    Explique ao estudante e responsáveis como o áudio será usado, por quanto tempo
                    ficará disponível e como pedir a exclusão. Registre o aceite apenas após a concordância.
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
