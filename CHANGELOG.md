# Changelog

All notable changes to the 777c8 Career OS project will be documented in this file.

---

## [1.0.0-RC1] - 2026-06-04

### Added
- **777c8 Interview Intelligence Suite**:
  - AI Coach Chat console with answer scoring (1-100) and actionable bulleted advice.
  - Interactive Flashcard swiper interface.
  - Production Scenario Troubleshooting Playbooks.
  - Revision Cheat Sheets (5-minute, 10-minute, and Interview Day checklists).
- **Career Command Center**:
  - Circular Interview Readiness speedometer gauge widgets.
  - Interactive Skill Gaps and upcoming reminders tables.
  - Timeline activity tracker.
- **Secure Encrypted Backups**:
  - `/system/backup` and `/system/restore` endpoints to securely export and import database snapshots.
  - AES-256 backup file encryption protection.
- **Dockerization**:
  - Root level `docker-compose.yml` to launch full stacks.
  - Dedicated Nginx React SPA setup in the frontend Docker environment.

### Changed
- Refactored `/resumes/generate` tailored engine into a unified 20+ step automation pipeline.
- Provisioned dynamic schema migrations inside `init_db()` to support backward compatibility.
- Decoupled hardcoded ports, routes, models, and fallback providers.
