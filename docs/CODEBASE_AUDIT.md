# CODEBASE AUDIT

## Resumo executivo
Status: **Amarelo** — a base de Next.js + Prisma + NextAuth está estruturada, com hashing de senha, validação por Zod, rate limit e fluxo de upload assinado para áudios. Ainda faltam camadas críticas: a geração de planos via IA é só placeholder, o driver de armazenamento cai para modo local inseguro, não há verificação de consentimento nem RBAC fino no backend, e os fluxos de teste/CI dependem de dependências não instaladas (não executadas nesta auditoria).

## Mapa de arquitetura
- **Stack principal**: Next.js 15 (App Router) com React 19 RC, TypeScript, Tailwind/shadcn, NextAuth (credenciais + Prisma adapter), Prisma/PostgreSQL, AWS SDK para S3 (presign) e Playwright/Vitest.
- **Rotas de página**: `/` (landing), `/login`, `/register`, `/dashboard` (layout com subpáginas `settings`, `students`, `recordings`, `plans`), `/capture` (fluxo móvel). Todas protegidas por middleware exceto landing/auth.
- **APIs App Router**:
  - **Autenticação**: `/api/auth/[...nextauth]` (NextAuth), `/api/auth/register` (cria org+usuário ADMIN, bcrypt, rate limit).
  - **Estudantes/consentimento**: `/api/students` (GET/POST), `/api/students/[id]` (GET/PATCH/DELETE), `/api/students/[id]/consent` (GET último consentimento).
  - **Gravações**: `/api/storage/sign-upload` (presign de upload), `/api/storage/sign-download` (presign de download), `/api/recordings` (GET/POST registro no DB).
  - **Planos**: `/api/plans/generate` retorna 501 (ainda não implementado).
- **Modelos de dados (Prisma)**: Organization ↔ Membership ↔ User (roles ADMIN/TEACHER); Student (código único por org, nome/notas opcionais) ↔ Consent (audioAllowed/shareForResearch, signedByUserId) ↔ Recording (orgId/studentId/storageKey/mime/duração, autor); Plan (orgId, autor, needs/plan em JSON).
- **Fluxo de áudio**: página `/capture` usa MediaRecorder, valida MIME/tamanho (10MB), obtém URL assinada, envia para storage e registra gravação. Storage provider tenta S3 com presign Put/Get; se faltar config, usa driver "local" sem autenticação (URL query) e cache em memória.
- **Geração de planos (IA)**: schema `ActivityPlan` definido com Zod, mas endpoint devolve 501; não há chamadas ao OpenAI nem persistência de planos.

## Achados de segurança e privacidade
- **Positivos**: senhas hashadas com bcrypt; rate limiting em memória para login/registro/geração; validação por Zod em todas as rotas expostas; chaves de objeto de áudio incluem org/estudante; download verifica prefixo da org; códigos de estudante únicos por organização (pseudonimização).
- **Riscos/ausências**:
  - **Consentimento apenas no cliente**: APIs de upload/gravação não checam consentimento nem se shareForResearch foi negado; qualquer membro autenticado da org pode gravar.
  - **RBAC frouxo**: enum de papéis existe, mas APIs não usam `requireRole`; TEACHER pode criar/alterar estudantes, gravar e baixar áudios sem restrição.
  - **Armazenamento local inseguro**: fallback automático para driver local gera URLs públicas sem assinatura/expiração; risco de exposição de áudio se variáveis S3 faltarem.
  - **Geração de planos sem guardrails**: endpoint retorna 501, sem validação de entrada/saída efetiva nem isolamento de chave OpenAI; potencial risco ao implementar sem checagens.
  - **Faltam constraints**: Membership não tem unicidade (usuário pode repetir na mesma org), Consent não garante único registro atual por estudante, Recording não impõe size/mime no backend além do enum; cascades não definidas.
  - **Proteções adicionais**: rate limit não persistente (multi-instância vulnerável), logs de erro podem vazar stack traces, não há scrubbing de dados sensíveis em logs.
  - **Uploads**: validação de tamanho/tipo só no sign-upload; download aceita qualquer key com prefixo org (sem checar MIME/expiração). Nenhum antivírus ou checagem de duração.
  - **Tests/CI dependem de deps não instaladas**: não executados nesta auditoria (restrição solicitada); risco de regressões ocultas.

## Testes e CI
- **Scripts**: lint/build/test (Vitest) e test:e2e (Playwright) configurados em `package.json`; Prisma seed configurado.
- **Configurações**: Vitest em ambiente Node com alias `@`; Playwright usa Chromium e `E2E_BASE_URL`; CI GitHub Actions roda `npm ci`, lint, vitest e build (sem e2e).
- **Estado atual**: Dependências não instaladas por orientação; nenhum teste/lint/build executado nesta auditoria.

## Top 10 correções priorizadas (menor esforço → maior)
1. Acrescentar checagem de consentimento (audioAllowed/shareForResearch) em `/api/storage/sign-upload` e `/api/recordings` para bloquear uploads sem autorização.
2. Aplicar RBAC com `requireRole` nas rotas de estudantes/gravações/planos (ex.: apenas ADMIN cria/edita; TEACHER apenas lê/grava quando autorizado).
3. Endurecer driver local de storage: habilitar somente em dev, adicionar token/HMAC com expiração ou remover fallback automático em produção.
4. Adicionar endpoint para registrar/atualizar consentimento (POST/PATCH em `/api/students/[id]/consent`) com auditoria de quem assinou e data.
5. Implementar validação adicional de uploads: reconfirmar MIME/tamanho no backend, rejeitar keys fora do padrão e registrar logs de auditoria.
6. Definir constraints adicionais no Prisma (unicidade Membership por org/usuário; cascades ou ON DELETE RESTRICT onde fizer sentido; índice para Recording). Migrar DB conforme ajustes.
7. Implementar geração de planos IA com schema `ActivityPlan`, chamada server-side ao OpenAI Responses API, e persistir planos vinculados à org/usuário.
8. Persistir rate limiting (Redis/Upstash) e aumentar janelas para fluxos sensíveis (auth/upload), com métricas básicas de abuso.
9. Ajustar storage S3 para exigir envs completos em produção (bucket/region/credenciais) e considerar criptografia/expiração curta para URLs.
10. Criar cobertura automatizada (Vitest/Playwright) para consentimento, RBAC e upload, e condicionar e2e a variável de ambiente (ex.: `E2E_RUN`).
