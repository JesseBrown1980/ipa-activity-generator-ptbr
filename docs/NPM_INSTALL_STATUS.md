# NPM Install Status

## Step 1: Proxy and registry snapshot
```
node -v
v22.21.0

npm -v
npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.
11.4.2

env | grep -i proxy || true
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

npm config get registry
https://registry.npmjs.org/

npm config get proxy
null

npm config get https-proxy
http://proxy:8080

npm config get strict-ssl
true
```

## Step 2: npmrc sources
```
ls -la
... (see full output above)

=== .npmrc ===
registry=https://registry.npmjs.org/
```
No `~/.npmrc` present.

## Step 3: Clean install attempt with proxy env removed
1) Registry reset without proxy env vars:
```
env -u HTTP_PROXY -u HTTPS_PROXY -u http_proxy -u https_proxy \
    -u npm_config_proxy -u npm_config_https_proxy \
    npm config set registry https://registry.npmjs.org/
```

2) Install attempt:
```
env -u HTTP_PROXY -u HTTPS_PROXY -u http_proxy -u https_proxy \
    -u npm_config_proxy -u npm_config_https_proxy \
    npm ci --progress=false
```
Result: `npm ci` failed immediately with EUSAGE because there is no package-lock.json.

3) Follow-up install with verbose logging (still without proxy env vars):
```
env -u HTTP_PROXY -u HTTPS_PROXY -u http_proxy -u https_proxy \
    -u npm_config_proxy -u npm_config_https_proxy \
    npm install --progress=false --verbose
```
Result: repeated `ENETUNREACH` when contacting `https://registry.npmjs.org/...`, eventually falling back to stale cache responses. Final error `ERESOLVE unable to resolve dependency tree` due to `react@19.0.0-rc.1` not satisfying `react-hook-form` peer range.

## Step 4: No-proxy retry
Not executed because failure was ERESOLVE (not a 403). If a 403 appears, rerun with the provided no-proxy commands.

## 403 URL
No 403 responses observed; requests to `https://registry.npmjs.org/...` failed with `ENETUNREACH` before dependency conflict surfaced.

## Proxy source
Proxies are configured via environment variables (`HTTP_PROXY`, `HTTPS_PROXY`, `http_proxy`, `https_proxy`, `npm_config_http_proxy`, `npm_config_https_proxy`). Repository `.npmrc` only pins the registry URL.

## Conclusion
**INSTALL BLOCKED** — npm install without proxy env vars fails: initial `npm ci` cannot run without a lockfile, and `npm install` hits network reachability issues and ultimately aborts with a peer dependency conflict (`react@19.0.0-rc.1` vs `react-hook-form@7.68.0`).
