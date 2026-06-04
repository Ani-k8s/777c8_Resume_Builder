# Security Policy

777c8 Career OS is designed as a local-first application prioritizing privacy, data ownership, and source-of-truth protection.

---

## Supported Versions

| Version | Supported |
| --- | --- |
| 1.0.x | :white_check_mark: Yes |
| < 1.0 | :x: No |

---

## 🔒 Security Architecture

1. **Local Isolation**: All files, resumes, and SQLite database tables are stored locally on your machine. No profile datasets are sent to third-party databases.
2. **AES-256 Cryptography**: Sensitive values (such as AI API keys and resume documents) are encrypted using symmetric **AES-256-GCM**.
3. **Key Derivation**: Keys are derived from your master password using **PBKDF2-HMAC-SHA256** with 100,000 iterations and a random salt.
4. **Transient Storage**: Derived keys are kept strictly in-memory during unlocked sessions. Locking the application immediately purges session keys.
5. **Backup Encryption**: Database backup files exported through the system are fully encrypted under your master password.

---

## Reporting a Vulnerability

If you discover a security vulnerability or have concerns regarding local data isolation:
1. Open an issue on the GitHub tracker (excluding sensitive key details).
2. For private reports, contact the system administrator directly.
3. We will review and provide a patch version within 24-48 hours.
