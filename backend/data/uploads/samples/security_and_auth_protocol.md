# Security & Authentication Protocol Specification

## 1. Authentication Standards & JWT Specifications
TechDoc AI utilizes JSON Web Tokens (JWT) conforming to RFC 7519 with HMAC-SHA256 (HS256) signature verification. Access tokens have an expiration window of 60 minutes, while refresh tokens remain valid for 14 days with sliding-window rotation.

## 2. Role-Based Access Control (RBAC) Matrix
- **Admin**: Full read, write, delete permissions on all documents, users, and audit logs.
- **Engineer**: Upload, index, search, and chat with technical documents in assigned collections.
- **Viewer**: Read-only query and citation inspection capabilities.

## 3. Cryptographic and Password Hashing Requirements
- Passwords must be hashed using bcrypt with work factor >= 12 or PBKDF2/SHA-256.
- Plaintext passwords or unencrypted secrets must never be committed to source repositories or printed in stdout logs.
- All client-to-server and inter-service communications require TLS 1.3.

## 4. Rate Limiting & Denial of Service Protection
- Public endpoints: 60 requests per minute per IP address.
- AI Generation endpoints: 20 queries per minute per authenticated user to prevent compute resource exhaustion.
- Upload limits: Maximum file size 25MB with strict MIME-type and magic byte validation.
