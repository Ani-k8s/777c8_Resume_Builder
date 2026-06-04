# Contributing to 777c8 Career OS

Thank you for contributing! Please follow these guidelines to submit changes.

---

## 🛠️ Local Development Setup

1. Fork and clone the repository.
2. Initialize backend virtual environment and dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
3. Initialize frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

---

## 📋 Code Guidelines

- **TypeScript**: All frontend features must pass Vite compilation without type warnings. Run `npm run build` to verify.
- **Python ORM / SQLite**: When updating SQLAlchemy models:
  - Add corresponding `ALTER TABLE` statements inside `init_db()` in [database.py](file:///d:/Projects/777c8_Resume_Builder/backend/app/core/database.py) wrapped in try-except statements.
  - This ensures that users with existing databases are upgraded automatically without data loss.
- **Strict ATS Truth Enforcement**: Do not alter AI tailoring prompts to permit fabrication. The Master Resume must remain the absolute source of truth.

---

## 🧪 Testing

Before submitting a Pull Request, run the local integration test suite:
```bash
cd backend
$env:PYTHONPATH="."
python scratch/test_phase2_backend.py
```
Ensure all test stages report a success code before committing.
