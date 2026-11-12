# Integration gateway — API contract (Phase 5)

The React prototype never talks to SMTP, IMAP, OpenWA or an OCR engine directly, and it never stores their
credentials. Real integrations go through a small backend service you run — the **integration gateway** — which
holds the secrets and forwards requests.

```
Browser (React)  ──HTTPS JSON──►  Integration gateway  ──►  SMTP server / IMAP server / OpenWA / OCR engine
                                   (secrets in env vars)
```

**No gateway is included in this repository.** Until `VITE_INTEGRATION_GATEWAY_URL` is set, every channel runs in
Demo mode; choosing "Real / backend" mode without a gateway shows **API integration pending** — never "Connected".

## Configuration

| Where | Variable | Purpose |
|---|---|---|
| Frontend `.env.local` | `VITE_INTEGRATION_GATEWAY_URL` | Base URL of the gateway, e.g. `https://gateway.example.com` (no trailing slash) |
| Gateway env | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SECURE` | Outgoing mail |
| Gateway env | `IMAP_HOST`, `IMAP_PORT`, `IMAP_USER`, `IMAP_PASSWORD`, `IMAP_TLS` | Shared inbox |
| Gateway env | `OPENWA_BASE_URL`, `OPENWA_API_KEY` | OpenWA server + its `X-API-Key` |
| Gateway env | `OCR_PROVIDER`, provider keys | OCR engine (Tesseract service, Google Vision, AWS Textract …) |
| Gateway env | `ALLOWED_ORIGIN` | CORS origin of the prototype (exact match) |

**Secrets.** Prefer gateway environment variables. The settings screens have password / API-key fields only so an
operator can hand a new secret to the gateway once: the browser sends it in the `PUT …/settings` body, then clears the
field. It is never written to LocalStorage, never echoed back, and never logged. A gateway that only uses env vars
should ignore those fields.

## Conventions

* JSON in/out, `Content-Type: application/json` (except `/ocr/process`, which is `multipart/form-data`).
* Header `X-Bellomassi-User: <prototype user id>` identifies the acting user for the gateway's audit log.
  **It is not authentication.** A production gateway must sit behind real auth (session cookie / OAuth / mTLS).
* Errors: non-2xx with `{ "message": "human readable" }`. The UI shows the message as-is.
* Client timeout: 15 s (60 s for OCR).
* Honest statuses: the UI marks a channel *Connected* only when the gateway returns the field named below.

## Email

| Method & path | Body | Success response |
|---|---|---|
| `PUT /email/settings` | `{ smtp: {host, port, username, encryption, fromEmail, fromName, replyTo, password?}, imap: {host, port, username, encryption, folder, password?} }` | `{ ok: true }` |
| `POST /email/smtp/test` | — | `{ connected: true, message? }` (anything else = failed) |
| `POST /email/imap/test` | — | `{ connected: true, message? }` |
| `POST /email/send` | `{ messageId, from:{email,name}, replyTo?, to[], cc[], bcc[], subject, text, attachments:[{documentId,name}] }` | `{ accepted: true, providerMessageId?, delivered? }` |
| `POST /email/imap/connect` | `{ folder }` | `{ connected: true }` |
| `POST /email/imap/disconnect` | — | `{ ok: true }` |
| `GET /email/imap/messages?folder=INBOX&limit=100` | — | `{ messages: [{ uid, folder, from, fromName, to[], subject, text, date, seen, flagged }] }` |
| `POST /email/imap/messages/:uid/flags` | `{ seen: boolean }` | `{ ok: true }` |

`accepted: true` is recorded as **Sent (accepted by provider)** — *not* delivered. Only `delivered: true` (from a
delivery report / DSN the gateway has actually received) becomes **Delivered**. Attachments are referenced by
`documentId`; the prototype keeps files in browser IndexedDB, so a production gateway must fetch them from backend
document storage.

## WhatsApp (OpenWA)

The gateway forwards to OpenWA's REST API (verified against OpenWA `openapi.json` v0.25.0) and adds the
`X-API-Key: $OPENWA_API_KEY` header.

| Gateway path | Forwards to OpenWA | Response used by the UI |
|---|---|---|
| `PUT /openwa/settings` `{ baseUrl, apiEndpoint, sessionName, apiKey? }` | — (gateway config) | `{ ok: true }` |
| `GET /openwa/health` | `GET /api/health` | 2xx = reachable |
| `GET /openwa/sessions/:name` | `GET /api/sessions/{id}` | `{ status, phone?, pushName? }` — `status` ∈ created, initializing, qr_ready, authenticating, **ready**, disconnected, action_required, failed |
| `POST /openwa/sessions/:name/start` | `POST /api/sessions/{id}/start` | 2xx |
| `POST /openwa/sessions/:name/stop` | `POST /api/sessions/{id}/stop` | 2xx |
| `GET /openwa/sessions/:name/qr` | `GET /api/sessions/{id}/qr` | `{ qrCode }` (data URL) |
| `POST /openwa/sessions/:name/messages/send-text` `{ chatId, text }` | same path under `/api` | `{ messageId }` |

* `chatId` is `<country code + number>@c.us`, e.g. `919876543210@c.us` (built by `validatePhoneNumber`).
* The UI shows **Connected** only when the session endpoint returns `status: "ready"`.
* OpenWA's `201` on send means "handed to the session" — recorded as **Sent (accepted by provider)**, never Delivered.
  Delivery/read receipts need OpenWA webhooks → gateway → (future) push to the app; not implemented in Phase 5.

## OCR

`POST /ocr/process` — `multipart/form-data`: `file` (pdf/jpg/png/webp ≤ 5 MB), `documentType` (e.g. `VEH_INSURANCE`),
`fields` (JSON array of field keys). Response: `{ fields: { <key>: value }, confidence: 0..1 }`.
Results are always reviewed by a person before a document is verified.

## Minimal gateway checklist

1. Run behind HTTPS with authentication; map the authenticated user to a Bellomassi role server-side.
2. Restrict CORS to `ALLOWED_ORIGIN`.
3. Load secrets from env / a secret manager; never return them in responses or logs.
4. Rate-limit `/email/send` and `/openwa/.../send-text`; add idempotency on `messageId`.
5. Store documents in backend object storage (S3/Blob) and serve them by `documentId`.

## AI providers (Phase 6)

Local, keyless providers can be called **directly** from the browser (OpenJarvis on `http://localhost:8000`, Ollama on
`http://localhost:11434`) — the server must allow the app origin (`OPENJARVIS_CORS_ORIGINS` / `OLLAMA_ORIGINS`).
Anything that needs an API key, and every cloud provider (Gemini, OpenAI-compatible), goes through the gateway.

OpenJarvis endpoints used (verified in the OpenJarvis source, `server/routes.py` and `server/api_routes.py`):
`GET /health` → `{status:"ok"}` · `GET /v1/info` → `{model, agent, engine}` · `GET /v1/models` → `{data:[{id}]}` ·
`POST /v1/chat/completions` (OpenAI format) · `POST /v1/speech/transcribe` (multipart `file`, `language`) →
`{text, language, confidence}` · `POST /v1/speech/synthesize` `{text, voice_id?, speed?}` → `audio/wav`.
Auth: `Authorization: Bearer $OPENJARVIS_API_KEY` when the server sets a key (gateway mode only).

| Gateway path | Body | Success response |
|---|---|---|
| `PUT /ai/settings` | `{ provider, endpoint?, model?, apiKey? }` | `{ ok: true }` — key stored by the gateway only |
| `GET /ai/health?provider=OPENJARVIS` | — | `{ ok: true, model, engine, models[] }` |
| `POST /ai/chat` | `{ provider, endpoint?, model?, messages:[{role,content}], temperature, maxTokens }` | `{ content, model }` |
| `POST /ai/speech/synthesize` | `{ text, voice_id?, speed? }` | `{ audioBase64, mimeType }` |
| `POST /ai/speech/transcribe` | multipart `file`, `language?` | `{ text, confidence? }` |

The UI shows **Connected** only after `/ai/health` (or the direct OpenJarvis/Ollama health + model calls) succeed.
Messages sent to a provider contain the user's question and, when data sharing is "summaries", a short
permission-filtered JSON summary of the tool result — never raw collections.

## Backend ML forecasting (Phase 6)

| Gateway path | Body | Success response |
|---|---|---|
| `POST /ml/forecast` | `{ target, granularity, horizonPeriods, model, history:{keys[], values[]}, confidenceLevel }` | `{ model, modelName, version, predictions:[{key,value,lower?,upper?}], metrics?, backtest?, notes? }` |
| `GET /ml/models/:code` | — | `{ ready: true, version, trainedAt? }` |

Suggested implementation: statsmodels (ETS / SARIMAX), scikit-learn regressors, Prophet where the deployment allows.
Backend metrics must come from a real holdout; the UI stores and shows exactly what is returned.
