# AI Roadmap Technology Spectrum Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a structured, verifiable technology spectrum to every numbered AI roadmap topic and create a central cross-domain technology index.

**Architecture:** Insert one tailored `核心技术要点与扩展谱系` section between the learning map and vertical workflow of each `00-24` document. Keep detailed explanations in one canonical topic and use links for cross-domain references. Build `技术索引.md` after topic tables so the index reflects actual content rather than an aspirational list.

**Tech Stack:** Markdown, relative links, Ruby validation, `rg`, Git whitespace checks.

---

### Task 1: Foundations and data spectrum

**Files:** `00`, `01-05`, `19` under `docs/ai-roadmap`.

- [ ] Add tailored tables covering Python/data tooling, mathematics, classical ML, MLP/CNN/RNN/LSTM/GRU/Attention/Transformer/GNN/generative families, PyTorch primitives, and data systems.
- [ ] Verify every table contains required and advanced levels and concrete mastery evidence.

### Task 2: Model-domain spectrum

**Files:** `06-08`, `13`, `17`, `22-24`.

- [ ] Add NLP, CV, LLM, multimodal, embodied/autonomous, recommendation, temporal, and speech technology families.
- [ ] Make ConvLSTM canonical in `23` and compare it with CNN+LSTM, 3D CNN, TCN, PredRNN, spatiotemporal GNN, and temporal Transformer.
- [ ] Verify cross-domain ownership and prerequisites.

### Task 3: Training, systems, governance, and career spectrum

**Files:** `09-12`, `14-16`, `18`, `20-21`.

- [ ] Add pre-training, post-training, transfer, RAG/Agent, evaluation, MLOps, distributed performance, safety, research, and portfolio skill spectra.
- [ ] Distinguish algorithms, parameter-update methods, frameworks, infrastructure, and evidence artifacts.

### Task 4: Central technology index

**Files:** Create `docs/ai-roadmap/技术索引.md`; modify global and category READMEs.

- [ ] Index canonical terms, aliases, primary topic, related topics, level, and one-line purpose.
- [ ] Add navigation links and explain canonical ownership.

### Task 5: Completeness review

**Files:** All Markdown under `docs/ai-roadmap`.

- [ ] Confirm `00-24` each contains exactly one spectrum section, required/advanced levels, and a valid table.
- [ ] Run targeted coverage checks for CNN, RNN, LSTM, GRU, Transformer, GNN, ConvLSTM, MoE, LoRA, RAG, SLAM, ASR, recommendation, and time-series families.
- [ ] Validate recursive local links, table shape, placeholders, trailing whitespace, and `git diff --check`.
- [ ] Read every new spectrum table and repair shallow, duplicated, or misplaced entries before completion.
