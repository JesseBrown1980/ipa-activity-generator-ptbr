# Modelo de Dados

## Entidades previstas
- **Usuário**: credenciais de acesso, perfil (professor, administrador), flags de privacidade/consentimento.
- **Estudante**: identificador pseudonimizado, preferências de acessibilidade, vínculo com turmas/planos; nenhum dado PII obrigatório.
- **Plano de Ensino**: metas pedagógicas, habilidades-alvo, sequências de atividades IPA e status de execução.
- **Atividade IPA**: prompt de entrada, instruções pedagógicas, saída gerada (texto IPA), metadados de nível/duração.
- **Sessão de Geração**: histórico de chamadas ao modelo, parâmetros usados, carimbos de data/hora e logs técnicos sem dados sensíveis.
- **Registro de Áudio (opcional)**: referência a blobs temporários, duração e qualidade; conteúdo pode ser descartado após processamento.
- **Permissões/RBAC**: papéis e vínculos entre usuários e recursos (planos, estudantes, atividades).

## Relacionamentos (alto nível)
- Usuário 1..N Planos de Ensino.
- Plano de Ensino 1..N Atividades IPA.
- Plano de Ensino N..M Estudantes (matrículas/associações).
- Atividade IPA pode gerar 0..N Sessões de Geração.
- Estudante pode ter 0..N Registros de Áudio ligados a atividades ou planos.
- Permissões ligam Usuário a Plano/Estudante/Atividade conforme RBAC.

## Considerações de persistência
- Evitar campos de PII; quando indispensável, usar pseudonimização e criptografia em repouso.
- Registrar consentimento e retenção por recurso (ex.: áudio com TTL curto e exclusão automática).
- Indexar por IDs técnicos e datas para facilitar auditoria e limpeza programada.
