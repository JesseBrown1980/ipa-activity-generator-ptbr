# IPA Activity Generator (PT-BR)

Aplicação para gerar atividades em Alfabeto Fonético Internacional (AFI/IPA) voltadas a professores de Educação Especial, com opção futura de captura de áudio dos estudantes para acompanhamento pedagógico.

> Não é uma ferramenta diagnóstica. Serve apenas como apoio educacional.

## Desenvolvimento local
1. Instale as dependências do projeto: `npm install`.
2. Configure as variáveis de ambiente necessárias.
3. Execute as migrações do Prisma: `npx prisma migrate dev`.
4. Rode a aplicação em modo dev: `npm run dev`.
5. Após mudanças, valide com `npm run lint`, `npm run test` (Vitest)
   e `npm run build`.

### Testes
- Unitários: `npm run test` (Vitest, inclui validação de esquemas e helpers)
- E2E opcional: `npm run test:e2e` (Playwright, habilite com `E2E_RUN=true` e
  um backend disponível)

## Variáveis de ambiente (placeholders)
- `OPENAI_API_KEY`: chave para a Responses API.
- `NEXT_PUBLIC_APP_URL`: URL base da aplicação.
- `AUDIO_CAPTURE_ENABLED`: `true`/`false` para habilitar captura de áudio opcional.
- `DATABASE_URL`: conexão para armazenamento de dados.
- `AUTH_SECRET`: segredo usado pelo NextAuth para assinar tokens.

## Fluxo de autenticação
- Login e sessão são gerenciados pelo NextAuth com adaptador Prisma e JWT.
- Autenticação via credenciais (e-mail/senha) com hash usando `bcryptjs`.
- Novos cadastros usam o endpoint `POST /api/auth/register`, que cria a organização
  e o usuário inicial com papel `ADMIN` em uma transação atômica.
- As rotas `/dashboard` e `/capture` são protegidas via middleware e redirecionam
  usuários não autenticados para `/login`.

## Segurança
- Limites simples em memória para desenvolvimento: `/api/auth/login`,
  `/api/auth/register` e `/api/plans/generate` usam a política definida em
  `src/lib/rate-limit.ts`.
- Para produção, configure um limitador com Redis (ex.: Upstash): crie um cliente
  Redis usando `REDIS_URL` e replique a lógica de `applyRateLimit` para
  compartilhar contadores entre instâncias antes de responder 429.
- Uploads de áudio aceitam apenas `audio/webm`, `audio/wav` ou `audio/mpeg`, com
  limite de 10MB validado no cliente e no backend.

## Regra "Não quebre o repositório"
- Faça commits pequenos e incrementais.
- Após cada etapa, execute lint e build para garantir integridade.
