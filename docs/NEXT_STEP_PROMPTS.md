# NEXT STEP PROMPTS

Use estes prompts pequenos no GitHub Copilot/Codex para avançar com segurança.

1. **Desbloquear instalação npm 403**
```
Revise .npmrc e variáveis de proxy para garantir acesso ao registry npmjs.org; reproduza `npm install` e registre o pacote que falha (@auth/prisma-adapter). Adicione logs e, se preciso, force `npm config delete proxy`/`https-proxy` no script de CI local (não commitar segredos).
```
2. **Corrigir DATABASE_URL vs provider**
```
Abra prisma/schema.prisma e alinhe `datasource db` ao banco real: usar Postgres local (compose) ou trocar provider para sqlite se o objetivo for arquivo .tmp/dev.db. Atualize .env.local.example com valor compatível e descreva no README.
```
3. **Aplicar consentimento no backend de gravação**
```
Em /api/storage/sign-upload e /api/recordings, antes de criar URL ou registro, carregue o último consentimento do estudante e recuse se audioAllowed for falso ou ausente. Retorne 403 com mensagem clara.
```
4. **Criar endpoint de registro de consentimento**
```
Adicione POST/PATCH em /api/students/[id]/consent para salvar Consent com audioAllowed/shareForResearch/signedAt/signedByUserId. Valide com Zod e restrinja a membros da org.
```
5. **Enforçar RBAC nas rotas protegidas**
```
Use requireRole em /api/students*, /api/recordings e geração de planos para limitar operações de cadastro a ADMIN; TEACHER apenas leitura. Retorne 403 quando papel não autorizado.
```
6. **Endurecer driver de armazenamento local**
```
No lib/storage/index.ts, adicione assinatura temporária (token/HMAC com expiração) às URLs do driver local, evitando acesso público. Documente que só é para desenvolvimento.
```
7. **Implementar geração de planos via OpenAI Responses API**
```
No endpoint /api/plans/generate, valide entrada (targetIpa, idade, necessidades) com o schema ActivityPlan, chame o cliente OpenAI no servidor usando model configurável e retorne JSON estruturado. Mantenha a chave apenas server-side.
```
8. **Validar uploads no backend**
```
Em sign-upload e sign-download, revalide tamanho/tipo do arquivo (MAX_AUDIO_FILE_BYTES, ALLOWED_AUDIO_MIME_TYPES) e negue chaves que não pertençam à org. Adicione logs de auditoria mínimos.
```
9. **Gating opcional para E2E**
```
Atualize package.json e CI para rodar `npm run test:e2e` somente quando E2E_RUN=true, mantendo playwright.config.ts intacto.
```
10. **Cobertura de testes para consentimento/RBAC**
```
Adicione testes Vitest cobrindo requireRole (roles permitidos/negados) e novos endpoints de consentimento, mockando Prisma e auth(). Garanta reset do rate limit nos testes.
```
