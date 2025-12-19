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
  um backend disponível). No CI, esse flag precisa estar setado para que o
  passo de E2E execute; caso contrário, ele será pulado.

## Variáveis de ambiente

As principais chaves para executar o projeto localmente ou em produção estão
detalhadas abaixo. Use `.env.local.example` como base e ajuste conforme o
ambiente:

| Variável | Descrição | Padrão/observação |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | URL base da aplicação, usada para links absolutos. | `http://localhost:3000` |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | Credenciais para a Responses API. | Vazios por padrão. |
| `DATABASE_URL` | Conexão do banco (PostgreSQL). | Obrigatória para iniciar o app. |
| `AUTH_SECRET` | Segredo usado pelo NextAuth para assinar tokens. | Obrigatório. |
| `AUDIO_CAPTURE_ENABLED` | `true`/`false` para habilitar a captura opcional de áudio. | `true` |
| `STORAGE_DRIVER` | `s3` (produção) ou `local` (apenas desenvolvimento). | `s3` |
| `S3_REGION` / `S3_BUCKET` / `S3_ENDPOINT` | Configurações de bucket para o driver S3. | Necessárias quando `STORAGE_DRIVER=s3`. |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | Credenciais do bucket S3 (ou `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`). | Necessárias quando `STORAGE_DRIVER=s3`. |
| `LOCAL_STORAGE_BASE_URL` | URL de download/upload assinada para o driver local. | `http://localhost:3000/storage` |
| `REDIS_URL` | URL do Redis para rate limiting compartilhado. | Opcional; usa memória se ausente. |
| `E2E_RUN` / `E2E_BASE_URL` | Flags auxiliares para Playwright E2E. | Comentadas por padrão. |

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
