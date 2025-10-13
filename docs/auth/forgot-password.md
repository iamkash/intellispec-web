## Forgot Password Flow

This document explains how the self-service password reset feature works and how to configure it.

### Overview

1. **User request** – From the login screen a user submits the "Forgot password" form with their email.  
2. **API endpoint** – `POST /api/auth/forgot-password` issues a reset token if the account exists.  
3. **Token persistence** – Tokens are stored in `password_reset_tokens`, hashed with SHA-256, and invalidated on use.  
4. **Notification** – `EmailService` sends the reset link (console logging by default).  
5. **Reset link** – The email points to `{APP_BASE_URL}{PASSWORD_RESET_PATH}?token=<token>&tenant=<slug>`.  
6. **Link validation** – `GET /api/auth/reset-password/:token` confirms the token is valid.  
7. **Password update** – `POST /api/auth/reset-password` hashes the new password and updates the user.

### API Contracts

| Endpoint | Method | Body / Params | Notes |
| --- | --- | --- | --- |
| `/api/auth/forgot-password` | `POST` | `{ "email": string, "tenantSlug"?: string }` | Always returns 200 with a neutral message. |
| `/api/auth/reset-password/:token` | `GET` | – | Validates a token and returns masked email + expiry. |
| `/api/auth/reset-password` | `POST` | `{ "token": string, "password": string }` | Requires password ≥ 8 characters. |

### Environment Variables

| Variable | Description | Example |
| --- | --- | --- |
| `APP_BASE_URL` | Fully-qualified base URL of the React app. | `https://app.intellispec.com` |
| `FRONTEND_PORT` | Optional local override to produce `http://localhost:<port>` when `APP_BASE_URL` is unset. | `4001` |
| `PASSWORD_RESET_PATH` | Path segment appended to the base URL for reset links. | `/reset-password` |
| `PASSWORD_RESET_TOKEN_TTL_MINUTES` | How long a token remains valid. | `60` |
| `EMAIL_TRANSPORT` | `console`, `smtp`, or `disable`. | `smtp` |
| `SMTP_*` or `SMTP_URI` | SMTP connection details when `EMAIL_TRANSPORT=smtp`. | `SMTP_URI=smtps://user:pass@email.example.com` |
| `PASSWORD_RESET_FROM` | Email "from" header. | `notifications@intellispec.com` |

If `EMAIL_TRANSPORT=console`, messages are emitted to the API logs and no network call is made—ideal for local development. Setting the transport to `smtp` enables real delivery via nodemailer.

### Operational Notes

- Tokens are hashed at rest and soft-deleted once used.  
- Every request is logged via the shared audit trail.  
- Responses never disclose whether an email exists to avoid account enumeration.  
- Set `ENFORCE_AUTH=true` in production; the reset endpoints work without auth but still run inside the shared framework.

### Manual Verification

1. Update `.env` with the desired `APP_BASE_URL` and mail transport settings.  
2. Restart `npm run api` after mutating env vars.  
3. Submit `Forgot password` in the UI and confirm the console or SMTP delivery.  
4. Follow the link, ensure the reset page accepts the token, and that `POST /api/auth/reset-password` updates credentials.

### Troubleshooting

- **Email shows `localhost`** – Set `APP_BASE_URL` (or `FRONTEND_PORT`) to match the public UI host.  
- **Token invalid immediately** – Check `PASSWORD_RESET_TOKEN_TTL_MINUTES` and verify API server clock drift.  
- **SMTP failures** – Swap back to `EMAIL_TRANSPORT=console` to isolate app issues vs mail provider configuration.
