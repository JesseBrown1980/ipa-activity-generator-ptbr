# CODEBASE AUDIT

## Executive summary
Status: **Amarelo** — há boas bases de segurança (hash de senha, validação com Zod, limiter) e fluxos iniciais de áudio/consentimento, mas a instalação está bloqueada por 403 no registry, build/lint/test não rodam por falta de dependências, e a geração de planos via IA ainda não existe (501). O armazenamento local é só um placeholder e não protege os arquivos.

## O que funciona agora
- Autenticação com NextAuth + credenciais, adaptador Prisma e hashing de senha com bcrypt, populando org/role no token e sessão.【F:src/lib/auth.ts†L10-L96】
- Rate limiting em memória para login, registro e geração de planos, retornando 429 e cabeçalhos Retry-After.【F:src/lib/rate-limit.ts†L3-L93】
- CRUD básico de estudantes (criação com código pseudonimizado) e listagem/registro de gravações com validação de tipos e datas via Zod.【F:src/app/api/students/route.ts†L1-L96】【F:src/app/api/recordings/route.ts†L8-L129】
- Pipeline de captura de áudio no cliente com bloqueio por consentimento, checagem de MIME/size (10 MB) e upload assinado seguido de POST para registro.【F:src/app/capture/CaptureClient.tsx†L176-L336】【F:src/lib/upload-validation.ts†L1-L30】
- Middleware protegendo `/dashboard` e `/capture` com redirecionamento para login.【F:middleware.ts†L5-L25】

## O que falha agora (erros exatos)
- `npm install` falha por 403 ao baixar `@auth/prisma-adapter`.【32d7a4†L1-L7】
- `npm run build` falha: `next: not found` (ausência de dependências instaladas).【4704ff†L1-L7】
- `npm run lint` falha: `next: not found`.【075119†L1-L7】
- `npm run test -- --reporter=verbose` falha: `vitest: not found`.【ca289a†L1-L7】
- Geração de planos IA retorna 501 “não disponível neste ambiente”.【F:src/app/api/plans/generate/route.ts†L5-L14】

## Mapa de arquitetura
- **Rotas App Router**: home pública `/` com call-to-action; login `/login`; registro `/register`; painel `/dashboard` (layouts e páginas de settings, students, recordings, plans); captura móvel `/capture`.【F:src/app/page.tsx†L1-L92】【F:src/app/dashboard/layout.tsx†L1-L200】【F:src/app/capture/page.tsx†L1-L57】
- **APIs**: NextAuth (`/api/auth/[...nextauth]`), registro `/api/auth/register`, estudantes CRUD `/api/students` e `/api/students/[id]`, consentimento `/api/students/[id]/consent`, gravações `/api/recordings`, storage presign `/api/storage/sign-upload` e `/sign-download`, geração de planos `/api/plans/generate` (placeholder).【F:src/app/api/auth/[...nextauth]/route.ts†L1-L14】【F:src/app/api/auth/register/route.ts†L1-L62】【F:src/app/api/students/route.ts†L1-L96】【F:src/app/api/students/[id]/route.ts†L1-L95】【F:src/app/api/students/[id]/consent/route.ts†L10-L41】【F:src/app/api/recordings/route.ts†L8-L129】【F:src/app/api/storage/sign-upload/route.ts†L13-L66】【F:src/app/api/storage/sign-download/route.ts†L13-L61】【F:src/app/api/plans/generate/route.ts†L5-L14】
- **Autenticação/autorização**: NextAuth credenciais com JWT; memberships ligam usuário a organização e papel (ADMIN/TEACHER). Middleware protege rotas, mas RBAC fino depende de uso manual de `requireRole`.【F:src/lib/auth.ts†L10-L96】【F:middleware.ts†L5-L25】【F:src/lib/rbac.ts†L1-L13】
- **Modelos Prisma**: Organization, User, Membership (role ADMIN/TEACHER), Student (código único por org, campos opcionais), Consent (audioAllowed/shareForResearch), Plan (needsJson/planJson), Recording (storageKey, mimeType, duration).【F:prisma/schema.prisma†L3-L103】
- **Armazenamento de áudio**: driver S3 com presign (Put/Get) ou fallback local (URL query sem assinatura); chaves de objeto derivadas de org/estudante e MIME. Upload assinado chamado pelo cliente, depois gravação salva no DB. Download exige orgId e chave prefixada.【F:src/lib/storage/index.ts†L31-L124】【F:src/lib/storage/key.ts†L10-L20】【F:src/app/api/storage/sign-upload/route.ts†L13-L66】【F:src/app/api/storage/sign-download/route.ts†L13-L61】【F:src/app/api/recordings/route.ts†L82-L127】
- **Geração de planos**: schema de plano pedagógico definido com Zod, mas endpoint retorna 501 e não chama OpenAI.【F:src/lib/schemas/activity-plan.ts†L1-L34】【F:src/app/api/plans/generate/route.ts†L5-L14】
- **Captura/consentimento**: `/capture` carrega estudantes da org e último consentimento; checa no cliente antes de gravar; API de consentimento só lê (não grava).【F:src/app/capture/page.tsx†L15-L55】【F:src/app/capture/CaptureClient.tsx†L176-L336】【F:src/app/api/students/[id]/consent/route.ts†L10-L41】

## Achados de segurança e privacidade
- Senhas são hashadas com bcrypt na criação e verificadas no login.【F:src/app/api/auth/register/route.ts†L32-L53】【F:src/lib/auth.ts†L34-L41】
- Rate limiting aplicado a login, registro e geração (memória, sem redis), protegendo contra brute force básico.【F:src/app/api/auth/[...nextauth]/route.ts†L5-L13】【F:src/app/api/auth/register/route.ts†L8-L20】【F:src/lib/rate-limit.ts†L3-L93】
- RBAC: há enum de papéis e helper `requireRole`, mas APIs de estudantes/gravações não checam papel — qualquer usuário autenticado da org pode operar.【F:prisma/schema.prisma†L12-L47】【F:src/lib/rbac.ts†L1-L13】【F:src/app/api/students/route.ts†L21-L96】
- Validação de entrada com Zod em registro, estudantes, gravações, storage e plano (schema); uso consistente de mensagens.【F:src/app/api/auth/register/route.ts†L9-L20】【F:src/app/api/students/route.ts†L7-L17】【F:src/app/api/recordings/route.ts†L8-L19】【F:src/app/api/storage/sign-upload/route.ts†L13-L26】【F:src/lib/schemas/activity-plan.ts†L1-L34】
- Consentimento: UI bloqueia sem consentimento e consulta último registro, mas API de upload/recording não valida consentimento server-side; não há endpoint para registrar consentimento (somente leitura).【F:src/app/capture/CaptureClient.tsx†L176-L336】【F:src/app/api/students/[id]/consent/route.ts†L10-L41】【F:src/app/api/storage/sign-upload/route.ts†L13-L66】
- Armazenamento: fallback automático para driver local sem autenticação (URL com query param), inadequado para produção; S3 exige credenciais completas, sem criptografia/TTL configurado.【F:src/lib/storage/index.ts†L31-L124】
- OpenAI: nenhuma chamada no cliente, evitando vazamento de chave, mas recurso ainda não implementado.【F:src/app/api/plans/generate/route.ts†L5-L14】
- PII: estudantes podem ter `displayName` e `notes` opcionais; códigos pseudonimizados reforçam privacidade. Nenhuma coleta de analytics.【F:prisma/schema.prisma†L49-L62】【F:src/app/api/students/route.ts†L7-L96】
- Segredos: `.env.local.example` vazio; não há chaves versionadas. Apenas falha de instalação por registry (não por credenciais expostas).

## Testes e CI
- Scripts: build/lint/test/vitest/playwright definidos em `package.json`.【F:package.json†L5-L56】
- Vitest: ambiente Node, cobertura text+lcov, alias `@` para `src`.【F:vitest.config.ts†L1-L16】
- Playwright: baseURL via `E2E_BASE_URL` (default localhost), único projeto Chromium; não há gate `E2E_RUN`, então `npm run test:e2e` rodaria sempre se chamado.【F:playwright.config.ts†L1-L15】
- CI GitHub Actions: Node 20, `npm ci`, lint, `npm run test -- --runInBand`, build. E2E não incluído.【F:.github/workflows/ci.yml†L1-L33】
- Estado atual: nenhum teste rodou por ausência de dependências (instalação 403).【32d7a4†L1-L7】【4704ff†L1-L7】【075119†L1-L7】【ca289a†L1-L7】

## Top 10 correções priorizadas (menor esforço primeiro)
1. Corrigir acesso ao registry npm para instalar `@auth/prisma-adapter` e demais deps (pode exigir proxy ou mirror).【32d7a4†L1-L7】
2. Ajustar `DATABASE_URL` para usar Postgres (como no schema) ou trocar o provider para SQLite conforme `.env.local` gerado, evitando mismatch.【F:prisma/schema.prisma†L3-L103】
3. Adicionar verificação de consentimento no servidor ao criar gravações (em `sign-upload` ou `/api/recordings`) para não depender só do cliente.【F:src/app/api/recordings/route.ts†L82-L127】【F:src/app/api/storage/sign-upload/route.ts†L13-L66】
4. Implementar endpoint para registrar/atualizar consentimento de áudio (com auditoria de quem assinou) e UI correspondente.【F:src/app/api/students/[id]/consent/route.ts†L10-L41】
5. Introduzir RBAC efetivo nas rotas de estudantes/gravações/planos, usando `requireRole` para limitar ações de TEACHER vs ADMIN.【F:src/lib/rbac.ts†L1-L13】【F:src/app/api/students/route.ts†L21-L96】
6. Endurecer driver de armazenamento local (auth temporária, expiração de URL, caminhos isolados) ou removê-lo em produção.【F:src/lib/storage/index.ts†L81-L124】
7. Finalizar implementação da geração de planos com schema `ActivityPlan`, validação de entrada e chamada server-side à OpenAI Responses API (sem expor chave).【F:src/lib/schemas/activity-plan.ts†L1-L34】【F:src/app/api/plans/generate/route.ts†L5-L14】
8. Adicionar validação de tamanho/tipo no backend de storage/download além do cliente (defesa em profundidade).【F:src/app/api/storage/sign-upload/route.ts†L13-L52】
9. Ampliar limites e persistência do rate limit (Redis/Upstash) para múltiplas instâncias e logs de abuso.【F:src/lib/rate-limit.ts†L3-L93】
10. Criar testes automatizados para consentimento, RBAC e storage (Vitest) e, opcionalmente, fluxos E2E condicionais por `E2E_RUN`.【F:vitest.config.ts†L1-L16】【F:playwright.config.ts†L1-L15】
