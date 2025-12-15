# Arquitetura

## Visão geral do sistema
O "IPA Activity Generator" em PT-BR será uma aplicação web construída em Next.js (App Router) com TypeScript, Tailwind e componentes shadcn/ui. O back-end usará o Node OpenAI SDK com a Responses API para gerar atividades em IPA para professores de Educação Especial. A captura de áudio do estudante será opcional e tratada de forma temporária, sem armazenar PII.

## Principais módulos
- **Interface Web (Next.js/App Router)**: páginas e componentes React para criação e gestão de atividades, fluxo de captura de áudio e visualização de resultados.
- **Serviço de Geração (OpenAI Responses API)**: camada que prepara prompts em PT-BR, aplica regras pedagógicas e recebe as respostas geradas.
- **Gestão de Sessão/Autenticação**: middleware e endpoints para login e controle de acesso (futuro), incluindo RBAC para perfis de professores/administradores.
- **Camada de Dados**: abstração de persistência para atividades, planos, estudantes e registros de áudio/metadados (quando habilitado), com validação de privacidade.
- **Observabilidade**: logs estruturados e métricas mínimas sem dados sensíveis, com possibilidade de toggle para diagnósticos.

## Fluxo de dados (alto nível)
1. Usuário autenticado acessa o painel e solicita a geração de uma atividade IPA em PT-BR.
2. A UI coleta parâmetros pedagógicos e contexto da turma; dados transitam apenas em sessão autenticada.
3. O serviço de geração monta o prompt e chama a Responses API da OpenAI.
4. A resposta é normalizada e entregue à UI; atividade pode ser associada a um plano ou estudante (sem PII obrigatória).
5. (Opcional) A captura de áudio envia streams/trechos para processamento temporário; somente metadados mínimos são persistidos, se configurado.
6. Registros de atividades e permissões são salvos via camada de dados, respeitando RBAC e políticas de retenção.
