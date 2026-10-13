---
name: nginx-config
description: Nginx como reverse proxy: upstream, TLS, headers de segurança, cache, gzip e rate limit. Use ao criar ou revisar config Nginx.
---

# nginx-config
- `proxy_set_header Host/X-Real-IP/X-Forwarded-For/X-Forwarded-Proto`; timeouts explícitos.
- TLS 1.2+; HSTS; headers `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`.
- `client_max_body_size` coerente com a aplicação.
- Validar com `nginx -t`; reload em servidor remoto só com "sim".
