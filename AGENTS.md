# AGENTS

## Contexto do projeto
- Objetivo: "IPA Activity Generator" em PT-BR para professores de Educação Especial, não é uma ferramenta diagnóstica.
- Stack técnica: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui. Integração com Node OpenAI SDK usando a Responses API.
- Idioma de saída: PT-BR (exceto trechos de código).

## Regras de qualidade
- Após qualquer mudança, execute `npm run lint`, `npm run test` (se existir) e `npm run build`; corrija eventuais falhas.

## Privacidade
- Não registrar ou armazenar dados pessoais de estudantes.
- Sem analytics habilitado por padrão.

## Convenções de código
- Prefira componentes pequenos e reutilizáveis.
- Garanta acessibilidade na UI.
- Use nomes de arquivos claros e descritivos.
- Evite e remova código morto.

## Comandos úteis
- Instalar dependências: `npm install`
- Desenvolvimento: `npm run dev`
- Lint: `npm run lint`
- Testes (se houver): `npm run test`
- Build: `npm run build`

## Definition of Done
- [ ] Documentação atualizada conforme necessário.
- [ ] Lint/testes/build executados e passando.
- [ ] Regras de privacidade revisadas.
- [ ] Revisão rápida para acessibilidade e componentes pequenos.
