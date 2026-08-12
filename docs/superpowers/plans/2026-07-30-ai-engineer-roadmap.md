# AI Engineer Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a detailed Python-first AI engineer roadmap with fast-scan summaries, tables, vertical workflows, horizontal extensions, technical comparisons, practice projects, and acceptance criteria.

**Architecture:** Create `docs/ai-roadmap/` as the canonical route. Keep `zero-ai-study/` as the existing fine-tuning lab; link to it instead of duplicating its runbooks. Every numbered topic uses the same headings so readers can scan and compare subjects quickly.

**Tech Stack:** Markdown, relative Markdown links, existing `zero-ai-study` learning material, `rg`, and Git whitespace checks.

---

## File Map

| Group | Files | Purpose |
|---|---|---|
| Navigation | `README.md`, `00-能力地图与学习顺序.md` | Entry point, 12-month order, dependencies, and branch decisions |
| Foundations | `01` through `05` | Python AI engineering, mathematics, ML, deep learning, and PyTorch |
| Model domains | `06` through `08` | NLP, CV, LLM, and generative AI |
| Model lifecycle | `09` through `11` | Pre-training, fine-tuning/alignment, and transfer learning |
| Systems | `12` through `16` | RAG/Agent, multimodal, evaluation, MLOps, distributed performance |
| Expansion | `17`, `18` | RL/robotics and portfolio/job preparation |
| Integration | `docs/02-微调学习计划.md`, `zero-ai-study/docs/推荐阅读.md` | Cross-links to the roadmap |

## Required Topic Contract

Each numbered document must contain the following headings, a concise overview table, and a technology-comparison table.

```text
# [Topic] 路线
## 快速概览
## 学习地图（表格）
## 纵向：从原理到交付的完整闭环
## 横向：与其他技术的连接
## 技术对比与选型
## Step by Step
## 最小项目与验收标准
## 常见误区与面试达标
## 下一步
```

The lifecycle documents `09`, `10`, and `11` must all include one identical comparison table with: concept, starting weights, data scale, objective, compute cost, output artifact, and typical use.

### Task 1: Create route navigation

**Files:**
- Create: `docs/ai-roadmap/README.md`
- Create: `docs/ai-roadmap/00-能力地图与学习顺序.md`

- [ ] Write `README.md` with the reader profile, four-layer capability model, reading rules, phase table, links to every topic, and a `今天开始` action.
- [ ] Write `00` with six two-month phases, prerequisite table, time allocation, milestones, and a decision table for LLM, CV/multimodal, or robotics specialization.
- [ ] Run `rg -n '^# |^## |\[.*\](.*)' docs/ai-roadmap/README.md docs/ai-roadmap/00-*.md`.
- [ ] Confirm the output shows titles, tables, and links in both files.

### Task 2: Create common foundations

**Files:**
- Create: `docs/ai-roadmap/01-Python与AI工程基础.md`
- Create: `docs/ai-roadmap/02-数学基础.md`
- Create: `docs/ai-roadmap/03-机器学习路线.md`
- Create: `docs/ai-roadmap/04-神经网络与深度学习路线.md`
- Create: `docs/ai-roadmap/05-PyTorch技术路线.md`

- [ ] Apply the topic contract to all five files.
- [ ] In `01`, compare `uv`/`venv`, test automation/manual scripts, and FastAPI/Spring Boot responsibility boundaries.
- [ ] In `02`, map linear algebra, derivatives, probability, statistics, and optimization to ML operations.
- [ ] In `03` and `04`, cover data splits, leakage, bias-variance, metrics, neural networks, backpropagation, regularization, and diagnostics.
- [ ] In `05`, cover tensors, autograd, modules, Dataset/DataLoader, loops, checkpoints, GPU placement, OOM debugging, and PyTorch/TensorFlow/PaddlePaddle comparison.
- [ ] Run `for f in docs/ai-roadmap/0[1-5]-*.md; do printf '%s ' "$f"; rg -c '^\\|.*\\|$' "$f"; done` and confirm every file has table rows.

### Task 3: Create model-domain documents

**Files:**
- Create: `docs/ai-roadmap/06-NLP技术路线.md`
- Create: `docs/ai-roadmap/07-CV技术路线.md`
- Create: `docs/ai-roadmap/08-大模型与生成式AI路线.md`

- [ ] Apply the topic contract to the three files.
- [ ] In `06`, compare bag-of-words, embeddings, encoder models, decoder models, and Transformer tasks.
- [ ] In `07`, compare classification, detection, segmentation, and vision-language work; state CV is a planned branch rather than an LLM prerequisite.
- [ ] In `08`, explain tokenization, Transformer, autoregressive generation, context windows, inference, model families, and the relationship among training, transfer learning, RAG, and Agent.
- [ ] Run `rg -n 'PyTorch|Transformer|\u6a2a\u5411|\u7eb5\u5411|\u4e0b\u4e00\u6b65' docs/ai-roadmap/0[6-8]-*.md` and confirm every file names dependencies and follow-up work.

### Task 4: Create the model-lifecycle verticals

**Files:**
- Create: `docs/ai-roadmap/09-预训练完整技术路线.md`
- Create: `docs/ai-roadmap/10-微调与对齐完整技术路线.md`
- Create: `docs/ai-roadmap/11-迁移学习完整技术路线.md`

- [ ] In `09`, cover corpus/legal source, cleaning/deduplication, tokenizer, objective, packing, distributed concepts, checkpoints, and educational tiny-model practice.
- [ ] In `10`, cover instruction data, templates, SFT, full fine-tuning/PEFT, LoRA/QLoRA, preference alignment, evaluation, merging, quantization, and links to `../../zero-ai-study/docs/learning-path.md` and `../02-微调学习计划.md`.
- [ ] In `11`, cover feature extraction, frozen layers, partial unfreezing, full fine-tuning, domain adaptation, and catastrophic forgetting using both LLM and CV examples.
- [ ] Add the required shared lifecycle comparison table to all three files.
- [ ] Run `rg -n '\u9884\u8bad\u7ec3|\u5fae\u8c03|\u8fc1\u79fb\u5b66\u4e60|\u8d77\u59cb\u6743\u91cd|\u6570\u636e\u89c4\u6a21' docs/ai-roadmap/0[9]-*.md docs/ai-roadmap/1[01]-*.md` and confirm all lifecycle distinctions are present.

### Task 5: Create applications and engineering systems

**Files:**
- Create: `docs/ai-roadmap/12-RAG与Agent路线.md`
- Create: `docs/ai-roadmap/13-多模态路线.md`
- Create: `docs/ai-roadmap/14-模型评测与算法工程化.md`
- Create: `docs/ai-roadmap/15-模型部署与MLOps.md`

- [ ] In `12`, cover ingestion, chunking, embeddings, vector retrieval, reranking, generation, tool calling, control loops, guardrails, and compare RAG/fine-tuning plus workflow/Agent.
- [ ] In `13`, cover CLIP-style alignment, VLM processing, multimodal tuning, and evaluation links to CV and LLM foundations.
- [ ] In `14`, cover baselines, splits, offline/online metrics, error analysis, experiment and version management, monitoring, safety, cost, and reports.
- [ ] In `15`, cover FastAPI, batch/online inference, Docker, CI/CD, registry, monitoring, rollback, governance, and Java/Python service boundaries.
- [ ] Run `rg -n 'RAG|Agent|\u8bc4\u6d4b|FastAPI|Docker|Java|Python' docs/ai-roadmap/1[2-5]-*.md` and confirm the system boundaries are explicit.

### Task 6: Create advanced expansion and portfolio documents

**Files:**
- Create: `docs/ai-roadmap/16-分布式训练与性能优化.md`
- Create: `docs/ai-roadmap/17-强化学习与机器人路线.md`
- Create: `docs/ai-roadmap/18-作品集与求职规划.md`

- [ ] In `16`, cover GPU memory, mixed precision, checkpointing, accumulation, quantization, FlashAttention, DeepSpeed/FSDP, parallelism, and vLLM selection.
- [ ] In `17`, cover MDP, value/policy methods, simulation, perception-planning-control, ROS 2, imitation learning, VLA, sim-to-real, and a post-foundation entry plan.
- [ ] In `18`, define six evidence-bearing artifacts: ML baseline, PyTorch project, LLM fine-tuning report, RAG/Agent service, evaluation/deployment study, and one specialization project.
- [ ] Run `rg -n '\u9879\u76ee|\u9a8c\u6536|\u9762\u8bd5|\u5bf9\u6bd4|\u6a2a\u5411|\u7eb5\u5411' docs/ai-roadmap/1[6-8]-*.md` and confirm project, acceptance, comparison, and expansion content.

### Task 7: Integrate and validate the documentation tree

**Files:**
- Modify: `docs/02-微调学习计划.md`
- Modify: `zero-ai-study/docs/推荐阅读.md`

- [ ] Add a `在完整 AI 路线中的位置` section to `docs/02-微调学习计划.md` with links to the lifecycle topics `09`, `10`, and `11`.
- [ ] Add an internal-resource row to `zero-ai-study/docs/推荐阅读.md` that links to `../../docs/ai-roadmap/README.md` and the fine-tuning topic as next reading after Steps 1-5.
- [ ] Run the required-section check:

```bash
for f in docs/ai-roadmap/[0-9][0-9]-*.md; do
  for h in '快速概览' '横向' '纵向' '技术对比' 'Step by Step' '验收标准'; do rg -q "$h" "$f" || exit 1; done
done
printf 'section-contract: ok\n'
```

- [ ] Run `git diff --check` and `rg -n 'T''ODO|T''BD|待''定|占''位' docs/ai-roadmap docs/02-微调学习计划.md zero-ai-study/docs/推荐阅读.md`.
- [ ] Commit only the roadmap and planned cross-link files with `git add docs/ai-roadmap docs/02-微调学习计划.md zero-ai-study/docs/推荐阅读.md && git commit -m "docs: add AI engineer learning roadmap"`.
