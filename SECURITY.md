# Security

Hundred binds to `127.0.0.1` by default. Do not change the default host to `0.0.0.0`.

API keys live in `.env` on the server only.

- Never put `JEV_API_KEY` in `VITE_` variables, browser storage, or WebSocket payloads.
- Never log API keys.
- Report vulnerabilities privately to the maintainers rather than opening a public issue with secrets.
