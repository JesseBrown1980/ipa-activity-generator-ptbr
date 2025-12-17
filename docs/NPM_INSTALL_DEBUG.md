# Diagnóstico de falha no `npm install`

## 1. Versões de Node e npm
```
v22.21.0
npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.
11.4.2
```

## 2. Configurações do npm
```
registry = https://registry.npmjs.org/
proxy = null
https-proxy = http://proxy:8080
strict-ssl = true
```

## 3. Arquivos `.npmrc`
```
Repositorio: .npmrc not found
Usuário: ~/.npmrc not found
```

## 4. Variáveis de ambiente relacionadas a proxy
```
no_proxy=localhost,127.0.0.1,::1
NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/envoy-mitmproxy-ca-cert.crt
YARN_HTTP_PROXY=http://proxy:8080
https_proxy=http://proxy:8080
ELECTRON_GET_USE_PROXY=true
CODEX_PROXY_CERT=/usr/local/share/ca-certificates/envoy-mitmproxy-ca-cert.crt
npm_config_http_proxy=http://proxy:8080
NO_PROXY=localhost,127.0.0.1,::1
HTTPS_PROXY=http://proxy:8080
HTTP_PROXY=http://proxy:8080
http_proxy=http://proxy:8080
SSL_CERT_FILE=/usr/local/share/ca-certificates/envoy-mitmproxy-ca-cert.crt
PIP_CERT=/usr/local/share/ca-certificates/envoy-mitmproxy-ca-cert.crt
REQUESTS_CA_BUNDLE=/usr/local/share/ca-certificates/envoy-mitmproxy-ca-cert.crt
GRADLE_OPTS=-Dhttp.proxyHost=proxy -Dhttp.proxyPort=8080 -Dhttps.proxyHost=proxy -Dhttps.proxyPort=8080
YARN_HTTPS_PROXY=http://proxy:8080
npm_config_https_proxy=http://proxy:8080
```

## 5. Testes de acesso direto ao registry
```
npm ping --registry https://registry.npmjs.org/
 -> 403 Forbidden - GET https://registry.npmjs.org/-/ping

npm view next version --registry https://registry.npmjs.org/
 -> 403 Forbidden - GET https://registry.npmjs.org/next
```

## 6. Tentativa de instalação
```
npm ci
 -> falhou: é necessário um package-lock.json

npm install
 -> falhou com ERESOLVE (conflito de dependências: react 19.0.0-rc.1 vs react-hook-form@7.68.0)
```

## Conclusão
A infraestrutura está forçando o uso de um proxy HTTP (`http://proxy:8080`), configurado via variáveis de ambiente e detectado pelo npm como `https-proxy`. As chamadas diretas ao registry `https://registry.npmjs.org/` retornam 403, indicando bloqueio no proxy. O erro de dependências durante `npm install` ocorre depois da tentativa inicial de uso do registry, mas o problema raiz de conectividade é o bloqueio 403 imposto pelo proxy externo; é necessário liberar o acesso ao registry ou ajustar a configuração de proxy/SSL para permitir tráfego HTTPS ao npm.
