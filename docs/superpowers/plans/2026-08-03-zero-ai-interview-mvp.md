# Zero AI Interview MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable personal AI career workspace that supports login, resume evidence management, recruitment CRUD, explainable job matching, targeted resume generation, file import/export, insights, and model configuration.

**Architecture:** Use a modular FastAPI monolith with SQLAlchemy and versioned REST APIs, plus a React/TypeScript/Vite/Ant Design frontend. Structured career facts and immutable resume versions are authoritative; AI analysis is optional, provider-configurable, persisted as tasks, and always produces editable drafts.

**Tech Stack:** Python 3.11+, FastAPI, Pydantic, SQLAlchemy 2, Alembic, pytest, HTTPX, pypdf, python-docx, React 18, TypeScript, Vite, Ant Design, React Router, TanStack Query, Vitest, Testing Library.

---

## File Map

### Backend

```text
zero-ai-interview/backend/
  pyproject.toml
  .env.example
  alembic.ini
  alembic/env.py
  alembic/versions/0001_initial.py
  src/career_workspace/
    main.py
    api/router.py
    core/config.py
    core/database.py
    core/errors.py
    core/pagination.py
    core/security.py
    models/base.py
    models/entities.py
    schemas/auth.py
    schemas/common.py
    schemas/resume.py
    schemas/recruitment.py
    schemas/matching.py
    schemas/system.py
    services/audit.py
    services/auth.py
    services/dashboard.py
    services/documents.py
    services/export.py
    services/llm.py
    services/matching.py
    services/tasks.py
    api/routes/auth.py
    api/routes/dashboard.py
    api/routes/resumes.py
    api/routes/recruitment.py
    api/routes/matching.py
    api/routes/files.py
    api/routes/insights.py
    api/routes/system.py
  tests/
    conftest.py
    test_auth.py
    test_resume_api.py
    test_recruitment_api.py
    test_matching.py
    test_files.py
    test_system.py
```

### Frontend

```text
zero-ai-interview/frontend/
  package.json
  tsconfig.json
  vite.config.ts
  index.html
  src/
    main.tsx
    App.tsx
    api/client.ts
    api/types.ts
    auth/AuthProvider.tsx
    auth/ProtectedRoute.tsx
    layout/AppLayout.tsx
    layout/AppLayout.scss
    components/PageHeader.tsx
    components/StatusTag.tsx
    components/TaskProgress.tsx
    components/ResumePreview.tsx
    pages/LoginPage.tsx
    pages/DashboardPage.tsx
    pages/ResumeLibraryPage.tsx
    pages/MasterResumePage.tsx
    pages/RecruitmentPage.tsx
    pages/MatchingPage.tsx
    pages/TargetedResumePage.tsx
    pages/InsightsPage.tsx
    pages/FilesTasksPage.tsx
    pages/SystemSettingsPage.tsx
    styles/global.scss
    styles/variables.scss
  tests/
    setup.ts
    LoginPage.test.tsx
    RecruitmentPage.test.tsx
```

## Task 1: Project Skeleton and Health Contract

**Files:**
- Create: `zero-ai-interview/backend/pyproject.toml`
- Create: `zero-ai-interview/backend/src/career_workspace/main.py`
- Create: `zero-ai-interview/backend/src/career_workspace/core/config.py`
- Create: `zero-ai-interview/backend/src/career_workspace/api/router.py`
- Create: `zero-ai-interview/backend/tests/test_health.py`
- Create: `zero-ai-interview/frontend/package.json`
- Create: `zero-ai-interview/frontend/src/main.tsx`
- Create: `zero-ai-interview/frontend/src/App.tsx`
- Modify: `zero-ai-interview/README.md`

- [ ] **Step 1: Write the backend health test**

```python
def test_health(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "zero-ai-interview"}
```

- [ ] **Step 2: Run the test and verify failure**

Run: `cd zero-ai-interview/backend && pytest tests/test_health.py -v`

Expected: FAIL because the application package does not exist.

- [ ] **Step 3: Implement FastAPI bootstrap and dependencies**

Create a `pyproject.toml` with runtime dependencies for FastAPI, Uvicorn, SQLAlchemy, Alembic, Pydantic Settings, multipart uploads, HTTPX, pypdf, python-docx, and development dependencies for pytest and Ruff. Configure `src` package discovery and a `pytest` test path.

Implement `/api/v1/health`, CORS for Vite development URLs, and root metadata linking `/docs` and the health endpoint.

- [ ] **Step 4: Scaffold the React application**

Use the same React/Vite/Ant Design baseline as `zero-ai-study/web`, adding TanStack Query and Vitest. Render a temporary application shell that calls the health endpoint and displays an explicit online/offline state.

- [ ] **Step 5: Verify both builds**

Run:

```bash
cd zero-ai-interview/backend && pytest -q
cd zero-ai-interview/frontend && pnpm install && pnpm build
```

Expected: backend tests PASS and Vite production build completes.

- [ ] **Step 6: Commit**

```bash
git add zero-ai-interview
git commit -m "feat: scaffold AI career workspace"
```

## Task 2: Database, Authentication, and API Foundations

**Files:**
- Create: `zero-ai-interview/backend/src/career_workspace/core/database.py`
- Create: `zero-ai-interview/backend/src/career_workspace/core/security.py`
- Create: `zero-ai-interview/backend/src/career_workspace/core/errors.py`
- Create: `zero-ai-interview/backend/src/career_workspace/core/pagination.py`
- Create: `zero-ai-interview/backend/src/career_workspace/models/base.py`
- Create: `zero-ai-interview/backend/src/career_workspace/models/entities.py`
- Create: `zero-ai-interview/backend/src/career_workspace/schemas/auth.py`
- Create: `zero-ai-interview/backend/src/career_workspace/services/auth.py`
- Create: `zero-ai-interview/backend/src/career_workspace/api/routes/auth.py`
- Create: `zero-ai-interview/backend/tests/conftest.py`
- Create: `zero-ai-interview/backend/tests/test_auth.py`

- [ ] **Step 1: Write authentication tests**

Cover initialization of the single user, successful login, invalid password, `/auth/me`, logout, and access to a protected endpoint after logout.

```python
def test_login_sets_session_cookie(client, seeded_user):
    response = client.post("/api/v1/auth/login", json={"username": "admin", "password": "change-me"})
    assert response.status_code == 200
    assert "career_session" in response.cookies
```

- [ ] **Step 2: Run tests and verify failure**

Run: `cd zero-ai-interview/backend && pytest tests/test_auth.py -v`

Expected: FAIL because database and auth modules do not exist.

- [ ] **Step 3: Implement database and security**

Use SQLAlchemy declarative models with UUID string IDs, timestamps, `user_id`, status, and `deleted_at`. Default development configuration uses SQLite; `DATABASE_URL` supports the remote relational database without code changes.

Implement password hashing with `hashlib.scrypt`, constant-time comparison, and HMAC-signed session tokens stored in an HttpOnly cookie. Session tokens include user ID and expiry and are rejected when expired or tampered with.

- [ ] **Step 4: Implement auth routes and common API errors**

Expose:

```text
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
POST /api/v1/auth/change-password
```

Use one response error contract:

```json
{"error":{"code":"invalid_credentials","message":"用户名或密码错误","details":null}}
```

- [ ] **Step 5: Run authentication tests**

Run: `cd zero-ai-interview/backend && pytest tests/test_auth.py -v`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add zero-ai-interview/backend
git commit -m "feat: add single-user authentication"
```

## Task 3: Career Evidence and Resume Versioning

**Files:**
- Create: `zero-ai-interview/backend/src/career_workspace/schemas/resume.py`
- Create: `zero-ai-interview/backend/src/career_workspace/services/audit.py`
- Create: `zero-ai-interview/backend/src/career_workspace/api/routes/resumes.py`
- Create: `zero-ai-interview/backend/tests/test_resume_api.py`

- [ ] **Step 1: Write resume CRUD and version tests**

Test work experiences, project experiences, skills, career profile, resume creation, immutable version creation, version listing, restoration, pagination, search, and soft deletion.

```python
def test_resume_version_is_snapshot(auth_client, master_resume):
    created = auth_client.post(f"/api/v1/resumes/{master_resume['id']}/versions", json={"note": "initial"})
    assert created.status_code == 201
    snapshot = created.json()["snapshot"]
    assert snapshot["resume"]["title"] == master_resume["title"]
```

- [ ] **Step 2: Run tests and verify failure**

Run: `cd zero-ai-interview/backend && pytest tests/test_resume_api.py -v`

- [ ] **Step 3: Implement schemas and endpoints**

Expose protected CRUD APIs for:

```text
/career-profile
/work-experiences
/project-experiences
/skills
/resumes
/resumes/{id}/versions
/resumes/{id}/restore/{version_id}
```

Resume content references selected evidence IDs and ordering. Creating a version serializes all referenced facts into an immutable JSON snapshot.

- [ ] **Step 4: Add audit records and concurrency checks**

Record create, update, restore, archive, export, and permanent delete actions. Updates accept an integer `version` and return HTTP 409 on stale writes.

- [ ] **Step 5: Run focused and full tests**

Run:

```bash
cd zero-ai-interview/backend
pytest tests/test_resume_api.py -v
pytest -q
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add zero-ai-interview/backend
git commit -m "feat: add career evidence and resume versions"
```

## Task 4: Recruitment Research CRUD and Requirement Extraction Baseline

**Files:**
- Create: `zero-ai-interview/backend/src/career_workspace/schemas/recruitment.py`
- Create: `zero-ai-interview/backend/src/career_workspace/api/routes/recruitment.py`
- Create: `zero-ai-interview/backend/tests/test_recruitment_api.py`

- [ ] **Step 1: Write company, job, and requirement tests**

Cover company CRUD, job posting CRUD, server-side pagination, keyword and status filters, requirement CRUD, batch archive, soft delete, and deterministic baseline extraction.

```python
def test_extract_requirements_classifies_required_and_preferred(auth_client, job_posting):
    response = auth_client.post(f"/api/v1/job-postings/{job_posting['id']}/extract")
    assert response.status_code == 200
    kinds = {item["kind"] for item in response.json()["requirements"]}
    assert "required" in kinds
    assert "preferred" in kinds
```

- [ ] **Step 2: Run tests and verify failure**

Run: `cd zero-ai-interview/backend && pytest tests/test_recruitment_api.py -v`

- [ ] **Step 3: Implement recruitment endpoints**

Expose:

```text
/companies
/job-postings
/job-postings/{id}/requirements
/job-postings/{id}/extract
/job-postings/batch/archive
```

The baseline extractor recognizes explicit sections and markers such as 必须、熟练、优先、加分、职责、学历 and categorizes requirements into `required`, `preferred`, `soft_skill`, `company_specific`, `responsibility`, and `domain`.

- [ ] **Step 4: Verify pagination and duplicate handling**

Use normalized company/title/source/content fingerprints to return a duplicate warning without silently discarding data.

- [ ] **Step 5: Run tests and commit**

```bash
cd zero-ai-interview/backend && pytest -q
git add zero-ai-interview/backend
git commit -m "feat: add recruitment research module"
```

## Task 5: Explainable Matching and Targeted Resume Drafts

**Files:**
- Create: `zero-ai-interview/backend/src/career_workspace/schemas/matching.py`
- Create: `zero-ai-interview/backend/src/career_workspace/services/matching.py`
- Create: `zero-ai-interview/backend/src/career_workspace/api/routes/matching.py`
- Create: `zero-ai-interview/backend/tests/test_matching.py`

- [ ] **Step 1: Write deterministic scoring tests**

```python
def test_required_requirement_has_more_weight_than_preferred():
    score = calculate_match_score([
        EvidenceScore(kind="required", strength=4),
        EvidenceScore(kind="preferred", strength=0),
    ])
    assert score.total >= 70
    assert score.breakdown[0].weight > score.breakdown[1].weight
```

Also test no-evidence gaps, company-specific requirements excluded from technical score, manual evidence overrides, and targeted drafts retaining source evidence IDs.

- [ ] **Step 2: Run tests and verify failure**

Run: `cd zero-ai-interview/backend && pytest tests/test_matching.py -v`

- [ ] **Step 3: Implement matching service**

Use deterministic weights and evidence strengths 0-4. AI may suggest mappings later, but the service owns the final score. Persist per-requirement evidence, explanation, gap priority, and manual override reason.

- [ ] **Step 4: Implement matching APIs**

Expose:

```text
POST /matching-projects
GET  /matching-projects
GET  /matching-projects/{id}
POST /matching-projects/{id}/recalculate
PUT  /matching-projects/{id}/evidence/{requirement_id}
POST /matching-projects/{id}/targeted-resume
```

- [ ] **Step 5: Run tests and commit**

```bash
cd zero-ai-interview/backend && pytest -q
git add zero-ai-interview/backend
git commit -m "feat: add explainable job matching"
```

## Task 6: Files, Parsing, Tasks, and Export

**Files:**
- Create: `zero-ai-interview/backend/src/career_workspace/services/documents.py`
- Create: `zero-ai-interview/backend/src/career_workspace/services/tasks.py`
- Create: `zero-ai-interview/backend/src/career_workspace/services/export.py`
- Create: `zero-ai-interview/backend/src/career_workspace/api/routes/files.py`
- Create: `zero-ai-interview/backend/tests/test_files.py`

- [ ] **Step 1: Write upload and parsing tests**

Test TXT/Markdown/JSON extraction, DOCX extraction, PDF extraction with a fixture, duplicate hashes, illegal extension rejection, path traversal filenames, file download, soft delete, task retry, and Markdown/JSON/DOCX resume export.

- [ ] **Step 2: Run tests and verify failure**

Run: `cd zero-ai-interview/backend && pytest tests/test_files.py -v`

- [ ] **Step 3: Implement safe file storage**

Normalize generated storage names, retain original display names, enforce configured MIME and size limits, hash file bytes, and store only relative storage keys in the database.

- [ ] **Step 4: Implement document parsing and tasks**

Support TXT, Markdown, JSON, DOCX, and PDF directly. Image files create an OCR task; when a local OCR engine is unavailable, return an actionable `ocr_unavailable` state while retaining the original image for manual transcription.

- [ ] **Step 5: Implement exports**

Generate JSON, Markdown, DOCX, and print-ready HTML. The frontend print view is the supported PDF workflow through the browser's Save as PDF command.

- [ ] **Step 6: Run tests and commit**

```bash
cd zero-ai-interview/backend && pytest -q
git add zero-ai-interview/backend
git commit -m "feat: add file workflows and resume exports"
```

## Task 7: Configurable OpenAI-Compatible AI Provider

**Files:**
- Create: `zero-ai-interview/backend/src/career_workspace/schemas/system.py`
- Create: `zero-ai-interview/backend/src/career_workspace/services/llm.py`
- Create: `zero-ai-interview/backend/src/career_workspace/api/routes/system.py`
- Create: `zero-ai-interview/backend/tests/test_system.py`

- [ ] **Step 1: Write provider tests**

Use HTTPX mock transport to test connection success, timeout, HTTP 429, invalid JSON, valid structured extraction, disabled providers, and missing API-key environment variables.

- [ ] **Step 2: Run tests and verify failure**

Run: `cd zero-ai-interview/backend && pytest tests/test_system.py -v`

- [ ] **Step 3: Implement provider configuration**

Store display name, base URL, model, API-key environment variable name, timeout, retry count, temperature, max output, and enabled/default flags. Never store the API key value in the database or API response.

- [ ] **Step 4: Implement structured generation**

Send OpenAI-compatible chat completion requests, request JSON output, validate against Pydantic schemas, persist execution metadata, and return editable drafts. Add endpoints to analyze a job posting and suggest resume evidence mappings.

- [ ] **Step 5: Run tests and commit**

```bash
cd zero-ai-interview/backend && pytest -q
git add zero-ai-interview/backend
git commit -m "feat: add configurable AI providers"
```

## Task 8: Dashboard and Insight APIs

**Files:**
- Create: `zero-ai-interview/backend/src/career_workspace/services/dashboard.py`
- Create: `zero-ai-interview/backend/src/career_workspace/api/routes/dashboard.py`
- Create: `zero-ai-interview/backend/src/career_workspace/api/routes/insights.py`
- Create: `zero-ai-interview/backend/tests/test_dashboard.py`

- [ ] **Step 1: Write aggregation tests**

Test resume completeness, recruitment count, targeted resume count, unresolved gaps, recent matches, required/preferred skill frequencies, and repeated gaps.

- [ ] **Step 2: Implement dashboard and insight queries**

Return stable DTOs instead of database rows. Empty databases return zeros and empty arrays, not errors.

- [ ] **Step 3: Run tests and commit**

```bash
cd zero-ai-interview/backend && pytest -q
git add zero-ai-interview/backend
git commit -m "feat: add dashboard and career insights"
```

## Task 9: Frontend Authentication and Application Shell

**Files:**
- Create: `zero-ai-interview/frontend/src/api/client.ts`
- Create: `zero-ai-interview/frontend/src/api/types.ts`
- Create: `zero-ai-interview/frontend/src/auth/AuthProvider.tsx`
- Create: `zero-ai-interview/frontend/src/auth/ProtectedRoute.tsx`
- Create: `zero-ai-interview/frontend/src/pages/LoginPage.tsx`
- Create: `zero-ai-interview/frontend/src/layout/AppLayout.tsx`
- Create: `zero-ai-interview/frontend/src/layout/AppLayout.scss`
- Create: `zero-ai-interview/frontend/src/styles/global.scss`
- Create: `zero-ai-interview/frontend/src/styles/variables.scss`
- Create: `zero-ai-interview/frontend/tests/LoginPage.test.tsx`

- [ ] **Step 1: Write login UI test**

Test required fields, invalid credentials, successful navigation, session restoration, and logout.

- [ ] **Step 2: Run test and verify failure**

Run: `cd zero-ai-interview/frontend && pnpm test --run LoginPage`

- [ ] **Step 3: Implement auth and shell**

Build the confirmed grouped sidebar navigation, responsive drawer, page header, account menu, API health state, and route protection. Use cookie credentials on every API request.

- [ ] **Step 4: Verify**

Run:

```bash
cd zero-ai-interview/frontend
pnpm test --run
pnpm build
```

- [ ] **Step 5: Commit**

```bash
git add zero-ai-interview/frontend
git commit -m "feat: add career workspace application shell"
```

## Task 10: Frontend Resume and Recruitment Workspaces

**Files:**
- Create: `zero-ai-interview/frontend/src/components/PageHeader.tsx`
- Create: `zero-ai-interview/frontend/src/components/StatusTag.tsx`
- Create: `zero-ai-interview/frontend/src/components/ResumePreview.tsx`
- Create: `zero-ai-interview/frontend/src/pages/ResumeLibraryPage.tsx`
- Create: `zero-ai-interview/frontend/src/pages/MasterResumePage.tsx`
- Create: `zero-ai-interview/frontend/src/pages/RecruitmentPage.tsx`
- Create: `zero-ai-interview/frontend/tests/RecruitmentPage.test.tsx`

- [ ] **Step 1: Write recruitment page test**

Test loading, empty state, keyword filtering, server pagination, create/edit drawer, soft delete confirmation, import action, and error display.

- [ ] **Step 2: Implement resume pages**

Provide tabbed evidence CRUD, master resume composition, version history, preview, restore, import, export, and printable view. Use stable drawers/modals and do not nest cards.

- [ ] **Step 3: Implement recruitment pages**

Provide table search/filter/sort/pagination, company and job forms, original JD viewer, extracted requirement editor, duplicate warnings, batch archive, and matching-project action.

- [ ] **Step 4: Test and commit**

```bash
cd zero-ai-interview/frontend && pnpm test --run && pnpm build
git add zero-ai-interview/frontend
git commit -m "feat: add resume and recruitment workspaces"
```

## Task 11: Frontend Matching, Targeted Resume, Insights, and System Pages

**Files:**
- Create: `zero-ai-interview/frontend/src/components/TaskProgress.tsx`
- Create: `zero-ai-interview/frontend/src/pages/DashboardPage.tsx`
- Create: `zero-ai-interview/frontend/src/pages/MatchingPage.tsx`
- Create: `zero-ai-interview/frontend/src/pages/TargetedResumePage.tsx`
- Create: `zero-ai-interview/frontend/src/pages/InsightsPage.tsx`
- Create: `zero-ai-interview/frontend/src/pages/FilesTasksPage.tsx`
- Create: `zero-ai-interview/frontend/src/pages/SystemSettingsPage.tsx`

- [ ] **Step 1: Implement dashboard**

Render completeness, recruitment count, targeted resumes, unresolved gaps, six-step workflow, recent matches, pending tasks, and clear empty states.

- [ ] **Step 2: Implement matching flow**

Build a guided workflow that selects a job and resume version, shows requirement/evidence rows, permits manual evidence strength overrides, recalculates score, and generates a targeted draft.

- [ ] **Step 3: Implement targeted resume and print view**

Show source evidence for each generated section, allow editing, create immutable versions, export formats, and apply print CSS for A4 pages.

- [ ] **Step 4: Implement insights, tasks, and settings**

Show skill frequencies and repeated gaps, task progress and retry actions, model configuration without exposing keys, Prompt metadata, tags, audit records, and recycle-bin entries.

- [ ] **Step 5: Test and commit**

```bash
cd zero-ai-interview/frontend && pnpm test --run && pnpm build
git add zero-ai-interview/frontend
git commit -m "feat: complete career matching workspace"
```

## Task 12: Database Migration, End-to-End Verification, and Documentation

**Files:**
- Create: `zero-ai-interview/backend/alembic.ini`
- Create: `zero-ai-interview/backend/alembic/env.py`
- Create: `zero-ai-interview/backend/alembic/versions/0001_initial.py`
- Create: `zero-ai-interview/backend/.env.example`
- Create: `zero-ai-interview/frontend/.env.example`
- Modify: `zero-ai-interview/README.md`
- Modify: `.gitignore`

- [ ] **Step 1: Add migration and environment examples**

Include safe placeholders only:

```dotenv
DATABASE_URL=sqlite:///./data/zero-ai-interview.db
SESSION_SECRET=replace-with-a-long-random-secret
INITIAL_USERNAME=admin
INITIAL_PASSWORD=change-me
UPLOAD_DIR=./data/uploads
```

Never include the user-provided remote password.

- [ ] **Step 2: Add ignore rules**

Ignore `.env`, `.superpowers/`, Python caches, SQLite databases, uploads, frontend build output, and dependencies without hiding committed example files.

- [ ] **Step 3: Run backend verification**

```bash
cd zero-ai-interview/backend
python -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
alembic upgrade head
pytest -q
```

Expected: migration succeeds and all tests PASS.

- [ ] **Step 4: Run frontend verification**

```bash
cd zero-ai-interview/frontend
pnpm install
pnpm test --run
pnpm build
```

Expected: tests PASS and build succeeds.

- [ ] **Step 5: Start both applications and run the end-to-end workflow**

```bash
cd zero-ai-interview/backend && uvicorn career_workspace.main:app --reload --port 8100
cd zero-ai-interview/frontend && pnpm dev --host 127.0.0.1 --port 3100
```

Verify login, recruitment creation, requirement extraction, career evidence creation, resume version, matching calculation, targeted draft, export download, task retry, settings, mobile layout, and A4 print preview.

- [ ] **Step 6: Commit**

```bash
git add .gitignore zero-ai-interview
git commit -m "docs: add AI career workspace runbook"
```

## Self-Review Result

- Spec coverage: every first-version module in the approved design maps to Tasks 1-12.
- Scope control: public registration, teams, billing, scraping, automated job submission, and external Agent actions remain excluded.
- Type consistency: resume versions are immutable snapshots; matching projects reference a job posting and resume version; targeted drafts preserve evidence IDs.
- Security: secrets remain environment-only, uploaded names are normalized, user ownership is checked, and AI content is treated as untrusted input.
- Verification: backend, frontend, integration, build, responsive, print, and end-to-end checks are explicitly included.
