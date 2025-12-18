# npm install bloqueado

## Resumo
A instalação de dependências falha com erro **403 Forbidden** ao baixar pacotes do registro público do npm, indicando bloqueio por política ou proxy fora do controle do repositório.

## Evidências
- Ambiente com proxies definidos via variáveis de ambiente (`http_proxy`, `https_proxy`, `HTTP_PROXY`, `HTTPS_PROXY`, etc.).
- `.npmrc` do projeto contém apenas o registro padrão do npm.
- Comando `npm install --legacy-peer-deps --progress=false` retorna 403 ao acessar `https://registry.npmjs.org/@auth%2fprisma-adapter`.

### Saída relevante
```
npm error code E403
npm error 403 403 Forbidden - GET https://registry.npmjs.org/@auth%2fprisma-adapter
npm error 403 In most cases, you or one of your dependencies are requesting
npm error 403 a package version that is forbidden by your security policy, or
npm error 403 on a server you do not have access to.
```

## Origem do proxy
- **Variáveis de ambiente**: proxies configurados (`http_proxy`, `https_proxy`, `HTTP_PROXY`, `HTTPS_PROXY`, etc.).
- **.npmrc**: sem configuração de proxy; apenas `registry=https://registry.npmjs.org/`.

## Conclusão
O bloqueio ocorre no ambiente/proxy externo ao repositório. Não há ajustes adicionais no código ou nas configurações do projeto que possam resolver o erro 403 aqui.
