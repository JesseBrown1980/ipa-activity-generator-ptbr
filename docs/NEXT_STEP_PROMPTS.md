# NEXT STEP PROMPTS

Use estes prompts específicos no GitHub Copilot/Codex para evoluir com segurança.

1. **Bloquear uploads sem consentimento**
```
No arquivo src/app/api/storage/sign-upload/route.ts, antes de gerar a URL, carregue o último consentimento do estudante (orgId + studentId) e retorne 403 se audioAllowed for falso ou inexistente. Reaproveite zod existente.
```
2. **Enforçar RBAC em estudantes/gravações**
```
Aplique requireRole no topo das rotas /api/students*, /api/recordings e /api/storage/sign-* permitindo apenas ADMIN para criar/alterar e TEACHER apenas leitura/listagem. Retorne 403 com mensagem em PT-BR.
```
3. **Endurecer driver local de storage**
```
Em src/lib/storage/index.ts, ajuste createLocalProvider para gerar URLs temporárias com token/HMAC + expiração (ex.: query `expires`, `signature`) e rejeitar quando inválidas. Mantenha driver só quando STORAGE_DRIVER=local.
```
4. **Registrar consentimento no backend**
```
Implemente POST/PATCH em src/app/api/students/[id]/consent/route.ts que cria ou substitui Consent com audioAllowed/shareForResearch/signedAt/signedByUserId (do session.user.id). Valide com Zod e restrinja à org.
```
5. **Persistir rate limit**
```
Crie um provider de rate limit baseado em Redis (ex.: Upstash) que implemente o mesmo contrato de applyRateLimit, com TTL e cabeçalhos Retry-After. Faça fallback para memória somente em dev.
```
6. **Wire da geração de planos com OpenAI**
```
No endpoint /api/plans/generate, valide entrada com ActivityPlanSchema, chame o cliente OpenAI Responses API server-side (key via env) para obter um plano estruturado, e retorne JSON seguindo o schema. Sem dados sensíveis no cliente.
```
7. **Persistir planos gerados**
```
Após gerar o plano, salve em prisma.plan com orgId e createdByUserId do token, armazenando needsJson/planJson. Exponha GET /api/plans para listar apenas da org.
```
8. **Checar tamanho/MIME no backend**
```
Adicione validação de size/mime em /api/storage/sign-upload e /api/recordings usando MAX_AUDIO_FILE_BYTES e ALLOWED_AUDIO_MIME_TYPES antes de salvar. Retorne 400/415 conforme o caso.
```
9. **Gating de E2E no CI**
```
Atualize package.json e .github/workflows/ci.yml para só rodar npm run test:e2e quando E2E_RUN=true, mantendo vitest e lint sempre ativos.
```
10. **Testes de consentimento e RBAC**
```
Crie testes Vitest em src/lib/rbac.test.ts e novos testes para /api/students/[id]/consent que mockam Prisma e auth(), cobrindo cenários de roles não autorizadas e falta de consentimento no upload.
```
11. **Proteção de download de áudio**
```
Em /api/storage/sign-download, adicione verificação de que o storageKey pertence ao estudante/org e valide assinatura/expiração do driver local antes de devolver a URL.
```
12. **Reforçar constraints Prisma**
```
Atualize prisma/schema.prisma com @@unique em Membership (orgId, userId) e considere onDelete=CASCADE/RESTRICT para Consent/Recording. Rode prisma migrate dev e atualize seed.
```
