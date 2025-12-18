# AUDIT EXTRACT

## Resumo executivo
Status: **Amarelo** — a base de Next.js + Prisma + NextAuth está estruturada, com hashing de senha, validação por Zod, rate limit e fluxo de upload assinado para áudios. Ainda faltam camadas críticas: a geração de planos via IA é só placeholder, o driver de armazenamento cai para modo local inseguro, não há verificação de consentimento nem RBAC fino no backend, e os fluxos de teste/CI dependem de dependências não instaladas (não executadas nesta auditoria).

## What fails now
- Ainda faltam camadas críticas: a geração de planos via IA é só placeholder, o driver de armazenamento cai para modo local inseguro, não há verificação de consentimento nem RBAC fino no backend, e os fluxos de teste/CI dependem de dependências não instaladas (não executadas nesta auditoria).

## Top 10 correções priorizadas (menor esforço → maior)
1. Acrescentar checagem de consentimento (audioAllowed/shareForResearch) em `/api/storage/sign-upload` e `/api/recordings` para bloquear uploads sem autorização.
2. Aplicar RBAC com `requireRole` nas rotas de estudantes/gravações/planos (ex.: apenas ADMIN cria/edita; TEACHER apenas lê/grava quando autorizado).
3. Endurecer driver local de storage: habilitar somente em dev, adicionar token/HMAC com expiração ou remover fallback automático em produção.
4. Adicionar endpoint para registrar/atualizar consentimento (POST/PATCH em `/api/students/[id]/consent`) com auditoria de quem assinou e data.
5. Implementar validação adicional de uploads: reconfirmar MIME/tamanho no backend, rejeitar keys fora do padrão e registrar logs de auditoria.
6. Definir constraints adicionais no Prisma (unicidade Membership por org/usuário; cascades ou ON DELETE RESTRICT onde fizer sentido; índice para Recording). Migrar DB conforme ajustes.
7. Implementar geração de planos IA com schema `ActivityPlan`, chamada server-side ao OpenAI Responses API, e persistir planos vinculados à org/usuário.
8. Persistir rate limiting (Redis/Upstash) e aumentar janelas para fluxos sensíveis (auth/upload), com métricas básicas de abuso.
9. Ajustar storage S3 para exigir envs completos em produção (bucket/region/credenciais) e considerar criptografia/expiração curta para URLs.
10. Criar cobertura automatizada (Vitest/Playwright) para consentimento, RBAC e upload, e condicionar e2e a variável de ambiente (ex.: `E2E_RUN`).

## Notas sobre npm/proxy/registry
- Estado atual: Dependências não instaladas por orientação; nenhum teste/lint/build executado nesta auditoria.
