# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| `main`  | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in OwlQuizThingy, please do NOT create a public issue. Instead, report it directly to the repository maintainers.

### Security Guarantees & Remediation Baseline

OwlQuizThingy enforces the following security controls:

1. **Credential Isolation**: All manager passwords and credentials must be injected via environment variables (`MANAGER_PASSWORD`). Hardcoded default passwords in repository code are strictly prohibited.
2. **Server-Side Authorization**: Every privileged manager Socket.IO event requires active, authenticated session validation (`isAuthenticatedManager`).
3. **Runtime Payload Validation**: All incoming Socket.IO events are validated using Zod schemas at the server boundary.
4. **CORS Restrictions**: Cross-Origin Resource Sharing is strictly constrained to configured origins (`CORS_ORIGIN`).
5. **Payload & Rate Limits**: WebSockets enforce a maximum 1MB HTTP buffer size and auth rate limiting per IP address.
