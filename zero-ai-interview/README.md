# Zero AI Interview

个人单用户 AI 求职工作台，围绕以下闭环构建：

```text
录入招聘信息 → 提取岗位能力 → 完善主简历 → 生成岗位定制简历 → 检查匹配度 → 导出/打印
```

## 功能概览

| 模块 | 已实现能力 |
| --- | --- |
| 登录与账户 | 单用户登录、HttpOnly 会话、修改密码、未来多用户数据隔离字段 |
| 经历素材库 | 工作经历、项目经历、技能证据的增删改查、搜索、分页、软删除 |
| 我的主简历 | 主简历创建与编排、关联职业证据、不可变版本、预览、DOCX/Markdown/JSON 导出、A4 打印 |
| 招聘信息 | 招聘原文增删改查、搜索、分页、基线能力提取、要求明细 |
| 求职匹配 | 确定性加权评分、逐项解释、证据强度和能力缺口 |
| 定制简历 | 从主简历版本派生、保留来源、独立版本、导出和打印 |
| 文件与任务 | TXT/MD/JSON/DOCX/PDF/图片上传、文本解析、下载、删除、任务状态查看 |
| 洞察与学习 | 招聘技能频率、开放能力缺口、学习行动建议 |
| 系统管理 | OpenAI 兼容服务配置、连接测试、账户安全、审计日志 |

## 技术架构

| 层级 | 技术 |
| --- | --- |
| 前端 | React 18、TypeScript、Vite、Ant Design、TanStack Query |
| 后端 | FastAPI、SQLAlchemy 2、Pydantic、HTTPX |
| 数据库 | 默认 SQLite；通过 `DATABASE_URL` 可切换 PostgreSQL/MySQL 等关系型数据库 |
| 文档处理 | pypdf、python-docx；图片当前标记为 `ocr_pending`，预留 OCR 接入 |
| AI 接口 | OpenAI 兼容 `/models` 与 `/chat/completions` 协议，API Key 仅从环境变量读取 |

## 本地启动

环境要求：Python 3.11+、Node.js 18+、pnpm。

### 1. 启动后端

```bash
cd zero-ai-interview/backend
python -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
cp .env.example .env
alembic upgrade head
uvicorn career_workspace.main:app --reload --port 8100
```

后端地址：`http://127.0.0.1:8100`，接口文档：`http://127.0.0.1:8100/docs`。

首次启动的默认账号为 `admin`，默认密码为 `change-me`。登录后应立即在“系统管理 → 账户安全”中修改密码，并在 `.env` 中替换 `SESSION_SECRET`。

### 2. 启动前端

```bash
cd zero-ai-interview/frontend
pnpm install
cp .env.example .env
pnpm dev
```

浏览器访问 `http://127.0.0.1:3100`。Vite 会将 `/api` 代理到后端 `8100` 端口。

## 数据库切换

本地默认使用：

```dotenv
DATABASE_URL=sqlite:///./data/zero-ai-interview.db
```

使用远程数据库时，只在本地 `.env` 中设置连接串，不要提交账号或密码。例如：

```dotenv
DATABASE_URL=postgresql+psycopg://user:password@host:port/zero_ai
```

切换数据库驱动时需要额外安装相应 Python 驱动。应用启动仍保留 `create_all` 作为开发期兜底，正式环境应以 Alembic 迁移为准。

## 配置 AI 服务

1. 在后端 `.env` 中设置密钥，例如 `DASHSCOPE_API_KEY=...`。
2. 打开“系统管理 → AI 服务”，填写兼容服务的 Base URL、模型名和密钥环境变量名。
3. 点击“测试”验证 `/models` 接口。
4. 系统只保存环境变量名称，不保存或返回真实密钥。

## 验证命令

```bash
cd zero-ai-interview/backend
.venv/bin/pytest -q
.venv/bin/ruff check src tests

cd ../frontend
pnpm test --run
pnpm build
```

## 当前边界

- AI 连接和通用 Chat Completions 客户端已经具备，业务分析目前默认使用可解释的确定性基线，后续再逐项接入 AI 草稿任务。
- PDF/DOCX/TXT 等可直接解析；图片会保留并进入 `ocr_pending` 状态，尚未绑定具体 OCR 服务。
- 当前面向个人单用户，但所有核心业务表都带有 `user_id`，可继续扩展为多用户。
