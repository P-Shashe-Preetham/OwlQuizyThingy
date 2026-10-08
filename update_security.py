import sys

security_content = """# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| `main`  | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in OwlQuizyThingy, please do NOT create a public issue. Instead, report it directly to the repository maintainers via a private GitHub Security Advisory or direct contact if specified. Please allow up to 48 hours for an initial response.

### Security Guarantees & Remediation Baseline

OwlQuizyThingy enforces the following security controls:

1. **Credential Isolation**: All manager passwords and credentials must be injected via environment variables (`MANAGER_PASSWORD`). Hardcoded default passwords in repository code are strictly prohibited.
2. **Server-Side Authorization**: Every privileged manager Socket.IO event requires active, authenticated session validation (`isAuthenticatedManager`).
3. **Runtime Payload Validation**: All incoming Socket.IO events are validated using Zod schemas at the server boundary.
4. **CORS Restrictions**: Cross-Origin Resource Sharing is strictly constrained to configured origins (`CORS_ORIGIN`).
5. **Payload & Rate Limits**: WebSockets enforce a maximum 1MB HTTP buffer size and auth rate limiting per IP address.

## Secret Handling

- **Development**: Do not commit `.env` or any files containing real secrets, access tokens, or service account keys.
- **Service Accounts**: Base64-encoded JSON representations of Firebase service accounts (`FIREBASE_SERVICE_ACCOUNT`) should only be provided as environment variables at runtime.

## Production Credential Policy

- Default credentials must never be deployed in a production environment.
- Any exposed or compromised credentials must be rotated immediately using the instructions in `docs/runbooks/credential-rotation.md`.
- No team member should have direct access to production secrets in plaintext; use a secure secrets manager integrated with the deployment pipeline.

## Security Testing Expectations

- Security testing and vulnerability scanning must be run as part of the CI/CD pipeline (e.g., CodeQL, Trivy, Gitleaks).
- Changes that touch authentication flows, authorization logic, or socket payload validation must be thoroughly reviewed and require passing integration tests demonstrating proper enforcement.
- Do not bypass security tools unless explicitly approved via a documented security decision.
"""

with open("SECURITY.md", "w") as f:
    f.write(security_content)

print("SECURITY.md updated.")
