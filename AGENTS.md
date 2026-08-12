# Repository Guidelines

## Project Structure & Module Organization

This repository contains independent modules rather than one root build:

- `zero-ai-alibaba/`: primary Spring Boot application. Java lives in `src/main/java/com/sdecloud/springai/alibaba`, resources in `src/main/resources`, and tests in `src/test/java`. Its Vue/TypeScript client is in `frontend/`; `study/` is reference material.
- `zero-ai-boot/`: smaller Spring Boot/Spring AI prototype with the standard Maven `src/main` and `src/test` layout.
- `zero-ai-study/`: Python exercises (`00-setup/` through `09-engineering/`), a FastAPI service in `app/src/study_api`, and a React/Vite dashboard in `web/`.
- `docs/`: architecture and plans. `openspec/` holds spec-driven workflow configuration.

Run commands from the module they target; there is no root aggregator build.

## Build, Test, and Development Commands

- `cd zero-ai-alibaba && mvn spring-boot:run`: start the main API on port 8080.
- `cd zero-ai-alibaba && mvn clean test`: compile and run backend tests.
- `cd zero-ai-alibaba/frontend && pnpm install && pnpm dev`: run the Vue client on port 3000 with API proxying.
- `pnpm build` (in either frontend): create a production bundle.
- `cd zero-ai-study/app && PYTHONPATH=src uvicorn study_api.main:app --reload`: run the study API.
- `cd zero-ai-study && python 00-setup/check_env.py`: validate the local Python/Hugging Face setup.

Use JDK 17+, Maven 3.8+, Node 18+, pnpm, and a Python virtualenv.

## Coding Style & Naming Conventions

Java uses 4 spaces, PascalCase classes, camelCase members, and the module's existing package namespace. Vue/React/TypeScript uses 2 spaces; use PascalCase components and camelCase composables, stores, and API helpers. Python follows PEP 8 with 4 spaces and snake_case names. No repository-wide formatter or linter is configured; match neighboring files and avoid unrelated reformatting.

## Testing Guidelines

Java tests use JUnit 5; name classes `*Tests.java` and mirror production packages. Add focused tests for controllers, services, and configuration. Frontend and Python test runners are not configured, so include manual verification in the PR. `zero-ai-alibaba/test-api.sh` provides a running-service smoke test. No coverage threshold is enforced.

## Commit & Pull Request Guidelines

History uses short Conventional Commit prefixes such as `feat:` and `chore:`. Write an imperative summary, for example `feat: add RAG document upload`, and keep each commit logical. PRs should identify affected modules, explain configuration or dependency changes, list verification commands, and link the issue/spec. Include screenshots for UI changes and request/response samples for APIs.

## Security & Configuration

Never commit API keys, tokens, `.env` files, logs, model outputs, or generated `target/`, `dist/`, and `node_modules/`. Start from `.env.example` and prefer variables such as `AI_DASHSCOPE_API_KEY`.
