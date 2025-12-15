# IPA Activity Generator (PT-BR)

Aplicação para gerar atividades em Alfabeto Fonético Internacional (AFI/IPA) voltadas a professores de Educação Especial, com opção futura de captura de áudio dos estudantes para acompanhamento pedagógico.

> Não é uma ferramenta diagnóstica. Serve apenas como apoio educacional.

## Desenvolvimento local
1. Instale dependências do projeto (passo a documentar quando o código estiver disponível).
2. Configure variáveis de ambiente necessárias.
3. Execute o servidor de desenvolvimento.

*(Detalhes completos serão adicionados conforme os módulos forem implementados.)*

## Variáveis de ambiente (placeholders)
- `OPENAI_API_KEY`: chave para a Responses API.
- `NEXT_PUBLIC_APP_URL`: URL base da aplicação.
- `AUDIO_CAPTURE_ENABLED`: `true`/`false` para habilitar captura de áudio opcional.
- `DATABASE_URL`: conexão para armazenamento de dados.

## Regra "Não quebre o repositório"
- Faça commits pequenos e incrementais.
- Após cada etapa, execute lint e build para garantir integridade.
