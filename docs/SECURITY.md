# Segurança

## Modelo de ameaças
- **Acesso não autorizado**: risco de exposição de atividades ou dados de estudantes. Mitigação: autenticação obrigatória, RBAC granular e revisão de permissões por recurso.
- **Exposição de áudio e prompts**: interceptação de tráfego ou logs. Mitigação: TLS em trânsito, evitar logging de conteúdo sensível e aplicar políticas de retenção curtas.
- **Injeção de prompt ou XSS**: entradas maliciosas via UI ou prompts. Mitigação: sanitização/escape em renderização, validação de parâmetros e revisão de prompts.
- **Elevação de privilégio**: bypass de regras de autorização. Mitigação: middleware centralizado de autorização, testes automatizados de RBAC e auditoria de ações administrativas.
- **Disponibilidade/abuso de API**: uso excessivo do serviço de geração. Mitigação: rate limiting, chaves de API por usuário e monitoramento de consumo.

## Autenticação e sessão (previstos)
- Suporte a provedores seguros (ex.: OAuth2/OIDC) com renovação de tokens e revogação.
- Sessões curtas com refresh tokens, cookies `HttpOnly`/`Secure` e proteção contra CSRF.
- Associação de sessão a device/fingerprint leve para reduzir replay.

## Princípios de mitigação
- Mínimo privilégio e segregação de funções (professor vs. administrador).
- Sem PII obrigatória; preferir pseudônimos e identificadores técnicos.
- Criptografia em repouso para segredos e blobs opcionais de áudio.
- Logs sem dados sensíveis, com trilhas de auditoria para ações críticas.
