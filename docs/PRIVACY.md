# Privacidade

## Princípios
- Não coletar PII por padrão; identificação de estudantes deve usar pseudônimos ou IDs técnicos.
- Consentimento explícito para qualquer armazenamento de áudio ou dados sensíveis.
- Minimizar retenção: logs e blobs temporários devem expirar rapidamente, com processos de limpeza automáticos.
- Permitir exclusão sob demanda de registros vinculados a estudantes ou atividades.

## Captura e processamento de áudio
- A captura é opcional e desabilitada por padrão.
- Quando habilitada, armazenar apenas metadados essenciais (duração, qualidade) e descartar o conteúdo de áudio após processamento ou expiração.
- Proteger o trânsito com TLS e limitar o acesso via RBAC.

## Retenção e deleção
- Definir prazos curtos para retenção de áudio e sessões de geração; eliminar dados após uso pedagógico.
- Registrar consentimentos e timestamps para auditoria mínima, sem incluir conteúdo sensível.
- Oferecer ferramentas administrativas para remoção de dados de estudantes mediante solicitação.
