# zero-ai-study 学习看板 — 前后端设计

> 更新：2026-07-29  
> 目标：用 Web 查看学习进度、执行效果、环境/数据检查结果（纯 Python 学习线，不接 Spring AI）

---

## 1. 目标

| 能力 | 说明 |
|------|------|
| 学习进度 | Step 0～5 状态（todo / doing / done），可在页面勾选更新 |
| 执行效果 | 展示微调日志、评估日志是否存在及摘要 |
| 其它情况 | 一键跑环境检查、数据集校验，展示结果 |
| 响应式 | 桌面 / 平板 / 手机可用 |

## 2. 目录约定

```text
zero-ai-study/
├── app/                      # Python 后端（conda base）
│   ├── requirements.txt
│   ├── README.md
│   └── src/
│       └── study_api/        # 模块化包
│           ├── main.py
│           ├── core/
│           ├── api/routes/
│           └── services/
├── web/                      # React + TS + antd + Vite + SCSS（pnpm）
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
├── data/
│   └── progress.json         # 进度持久化
└── …（原有 00-setup～05-export-infer）
```

## 3. 技术选型

| 端 | 技术 | 原因 |
|----|------|------|
| 后端 | FastAPI + Uvicorn | 轻量、类型友好、适合模块化 API |
| 前端 | React 18 + TS + Vite + Ant Design 5 + SCSS | 按你指定栈；antd 适合后台看板 |
| 包管理 | 后端 conda base + 清华 PyPI；前端 pnpm | 按你要求 |
| 通信 | REST JSON，开发期 Vite proxy → `:8000` | 简单可靠 |

## 4. API 设计（v1）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/progress` | 获取全部步骤进度 + 汇总百分比 |
| PUT | `/api/progress/{step_id}` | 更新单步状态 / 备注 |
| POST | `/api/actions/check-env` | 执行环境检查（封装 check_env 逻辑） |
| POST | `/api/actions/validate-dataset` | 校验样例数据集 |
| GET | `/api/overview` | 看板总览：进度 + 产物文件状态 + 最近检查缓存 |

`step_id`: `setup` | `concepts` | `data` | `finetune` | `eval` | `export`

## 5. 前端信息架构

| 路由 | 页面 | 内容 |
|------|------|------|
| `/` | 总览 Dashboard | 进度环、步骤卡片、快捷操作 |
| `/steps` | 学习步骤 | 列表 + 改状态 |
| `/runtime` | 运行与检查 | 环境检查、数据校验结果 |
| `/effects` | 执行效果 | 微调/评估日志存在性与摘要 |

布局：顶栏 + 侧栏（窄屏收起为抽屉），SCSS 变量统一主题（避免默认紫风，用青绿学术风）。

## 6. 启动

```bash
# 后端（conda base + 清华镜像装依赖后）
cd zero-ai-study/app
conda activate base
uvicorn study_api.main:app --reload --host 0.0.0.0 --port 8000

# 前端
cd zero-ai-study/web
pnpm install
pnpm dev   # 默认 http://localhost:5173
```

## 7. 非目标（首版）

- 不在 Web 里直接跑 GPU 微调（仍在 Kaggle/Colab）
- 不接 Spring AI / Java
- 不做用户登录体系
