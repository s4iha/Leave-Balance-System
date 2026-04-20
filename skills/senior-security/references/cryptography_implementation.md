---
name: "cryptography_implementation"
description: "Cryptography implementation guidance for Leave Balance System data and credential protection."
author: "Leave Balance System"
version: "1.0.0"
category: "references"
---

# Cryptography Implementation (LBS)

## Scope
Apply these rules when introducing or reviewing encryption, hashing, token handling, and secret usage in LBS.

## Mandatory Controls

### Credential protection
- Use one-way password hashing (bcrypt or Argon2) for stored credentials.
- Never store plaintext passwords or reversible credential data.
- Apply secure comparison methods for secrets.

### Data in transit
- Assume HTTPS/TLS is required for all client-to-server and service-to-service paths.
- Avoid sending sensitive fields in query strings.

### Data at rest
- Encrypt high-sensitivity fields when business requirements demand it.
- Keep key material outside source code and repository files.
- Rotate keys/tokens through environment-managed secret processes.

### Logging and audit
- Do not log secrets, tokens, password hashes, or raw cryptographic material.
- Keep audit logs focused on change metadata, actor, and action type.

## Implementation Guidance
- Treat current auth implementation as demo baseline, not production-grade crypto architecture.
- Prefer centralized cryptographic utilities instead of per-route custom primitives.
- Validate algorithm choices for compatibility with Node.js runtime and deployment environment.

## Anti-Patterns
- Homegrown encryption algorithms.
- Hard-coded keys in code, tests, or config files.
- Using weak hash functions for credential storage.

## Source of Truth
- `docs/08-security-compliance.md`
- `AGENT.md`
