# NPM Install Fix

## Passos executados
1. Removi configurações de proxy do npm (`npm config delete proxy` e `npm config delete https-proxy`).
2. Limpei variáveis de ambiente de proxy para a sessão (`unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy` e equivalentes do npm/yarn).
3. Ajustei o registro do npm para o oficial (`npm config set registry https://registry.npmjs.org/`).
4. Reexecutei a instalação com `npm install --registry https://registry.npmjs.org/`.

## Resultado
- A instalação continuou falhando: o npm não conseguiu alcançar `https://registry.npmjs.org/@hookform/resolvers` devido a `ENETUNREACH`, indicando indisponibilidade de rede sem o proxy configurado.
- Como a instalação não concluiu, não foi possível rodar `npm run build`, `npm run lint` ou `npm run test`.
