# AI Roadmap Categories and Extensions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize the AI roadmap by capability domain and add six detailed extension routes for data engineering, AI safety, research reading, recommendation systems, time series, and speech AI.

**Architecture:** Keep `README.md` and `00-能力地图与学习顺序.md` as the global entry. Move numbered topics into five category directories while preserving their current numbers, then add `19-24` as extensions. Each category gets a local README containing its internal order, dependencies, and project outcomes.

**Tech Stack:** Markdown, relative links, Ruby link validation, `rg`, Git whitespace checks.

---

### Task 1: Reorganize existing topics

**Files:** Move `01-18` into `01-基础与数据` through `05-成长与求职`.

- [ ] Create five category directories and move each existing topic according to ownership.
- [ ] Recalculate relative Markdown links after the move.
- [ ] Verify no local link is broken.

### Task 2: Add category navigation

**Files:** Create one `README.md` in each category directory; modify the global `README.md` and `00`.

- [ ] Add category overview, internal sequence, prerequisites, outputs, and links.
- [ ] Update global navigation to explain category order versus global topic numbers.
- [ ] Add extension placement to the 12-month plan without forcing every specialization into the core path.

### Task 3: Add foundations and governance extensions

**Files:** Create `19-数据工程与特征工程路线.md`, `20-AI安全与治理路线.md`, and `21-论文阅读与技术跟踪路线.md`.

- [ ] Apply the topic contract, comparisons, projects, and acceptance criteria to all three.
- [ ] Cover batch/stream data, SQL, validation, feature stores, privacy, threat modeling, red teaming, governance, paper triage, reproduction, and evidence tracking.

### Task 4: Add model-domain extensions

**Files:** Create `22-推荐系统路线.md`, `23-时序预测路线.md`, and `24-语音AI路线.md`.

- [ ] Apply the topic contract to all three.
- [ ] Cover retrieval/ranking/feedback loops, temporal splitting/backtesting, and ASR/TTS/audio representation respectively.
- [ ] State prerequisites and when each branch should be selected.

### Task 5: Integrate and verify

**Files:** Modify `docs/02-微调学习计划.md` and `zero-ai-study/docs/推荐阅读.md` only where moved links require updates.

- [ ] Validate every local Markdown link and table shape recursively.
- [ ] Confirm `01-24` exist exactly once and every topic satisfies the required heading contract.
- [ ] Scan for placeholders and trailing whitespace, then run `git diff --check`.
