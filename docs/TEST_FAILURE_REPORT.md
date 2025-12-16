# Relatório de falhas de testes

## Comandos executados
- `node -v`
- `npm -v`
- `npm install`
- `npm run lint`
- `npm run test -- --reporter=verbose`
- `npm run build`

## Saídas e erros observados
### `node -v`
```
v22.21.0
```

### `npm -v`
```
npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.
11.4.2
```

### `npm install`
```
npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.
npm error code E403
npm error 403 403 Forbidden - GET https://registry.npmjs.org/@auth%2fprisma-adapter
npm error 403 In most cases, you or one of your dependencies are requesting
npm error 403 a package version that is forbidden by your security policy, or
npm error 403 on a server you do not have access to.
```
O comando falhou com erro 403 ao baixar `@auth/prisma-adapter`, impedindo a instalação das dependências.

### `npm run lint`
```
npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.
> ipa-activity-generator-ptbr@0.1.0 lint
> next lint

sh: 1: next: not found
```
Falha porque o binário `next` não está disponível (dependências não instaladas).

### `npm run test -- --reporter=verbose`
```
npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.
> ipa-activity-generator-ptbr@0.1.0 test
> vitest --reporter=verbose

sh: 1: vitest: not found
```
Falha imediatamente porque o binário `vitest` não está disponível (dependências não instaladas).
Nenhum arquivo de teste foi executado.

### `npm run build`
```
npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.
> ipa-activity-generator-ptbr@0.1.0 build
> next build

sh: 1: next: not found
```
Falha porque o binário `next` não está disponível (dependências não instaladas).

## Resumo das falhas
- **Instalação de dependências:** falhou (erro 403 ao baixar `@auth/prisma-adapter`).
- **Lint:** falhou devido à ausência do binário `next` após a falha de instalação.
- **Testes unitários (Vitest):** não executaram; falha imediata por ausência do binário `vitest`.
- **Build:** falhou devido à ausência do binário `next`.

## Lista de arquivos de teste com falha
- Nenhum arquivo de teste específico foi executado; a execução falhou antes de iniciar os testes por falta de dependências.

## Tipo das falhas
- Instalação de dependências bloqueada.
- Lint, testes unitários e build falharam por falta de dependências após a falha de instalação.
