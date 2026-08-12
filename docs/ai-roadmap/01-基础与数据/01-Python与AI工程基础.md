# Python 与 AI 工程基础路线

> 一句话定位：从“能写 Python”升级到“能用 Python 交付可测试、可复现、可服务化的 AI 代码”。

## 快速概览

| 已有能力 | 需补的 Python AI 能力 | 不需重复投入 |
|---|---|---|
| Java OOP、异常、并发、微服务 | Python 数据模型、科学计算、虚拟环境、脚本/实验组织 | 通用编程思想和设计模式入门 |
| Spring Boot API | FastAPI、Pydantic、模型服务的异步/批处理边界 | 重新学 HTTP/REST 基础 |
| Maven/Gradle 依赖 | `uv`/`venv`、`pyproject.toml`、锁定文件和 CUDA 依赖冲突 | 只背 `pip install` 命令 |
| JUnit/日志/监控 | pytest、数据校验、实验记录和结构化日志 | 把 Notebook 当成唯一产物 |

## 学习地图（表格）

| 层次 | 必备技术 | 掌握标准 |
|---|---|---|
| 语言 | 类型标注、dataclass、生成器、上下文管理、异步 | 能读懂库代码，对 IO/计算边界做正确选择 |
| 数据 | NumPy、Pandas、PyArrow、JSONL/Parquet | 向量化处理，schema 明确，能处理缺失/重复/异常值 |
| 工程 | 包结构、配置、日志、pytest、pre-commit | 核心逻辑不依赖 Notebook，命令可重复运行 |
| 服务 | FastAPI、Pydantic、Uvicorn、HTTPX | 有 schema、超时、错误码、健康检查和批处理 |
| 实验 | seed、配置、数据/模型版本、指标记录 | 新环境可复现一次结果 |

## 核心技术要点与扩展谱系

| 层级 | 技术要点 | 解决的问题 | 前置知识 | 掌握标准 | 关联章节 |
|---|---|---|---|---|---|
| 必会 | 类型、dataclass/Pydantic、异常、日志 | 建立清晰数据契约和可诊断程序 | Python 语法 | 能设计输入模型并定位失败 | [19 数据工程](./19-数据工程与特征工程路线.md) |
| 必会 | NumPy、Pandas/Polars、SQL | 科学计算与结构化数据处理 | 容器、函数 | 能向量化处理并验证 schema | `02-03`、`19` |
| 必会 | pytest、fixture、mock、property test | 防止数据和模型逻辑回归 | 模块/函数 | 核心变换有边界与失败测试 | `14-15` |
| 必会 | uv/venv、pyproject、依赖锁定、Git | 环境与实验复现 | 命令行 | 新环境可按命令重建 | [15 MLOps](../04-系统与治理/15-模型部署与MLOps.md) |
| 进阶 | iterator/generator、multiprocessing、asyncio | 流式数据、CPU 并行和 I/O 并发 | 进程/协程 | 能按瓶颈选择并测量吞吐 | `05`、`19` |
| 进阶 | FastAPI、CLI、Docker、profiling | 将训练/推理封装为工具和服务 | 类型、测试 | 有 schema、观测、性能基准 | `15-16` |

## 纵向：从原理到交付的完整闭环

```text
数据 schema -> 读取/校验 -> 纯函数处理 -> CLI/配置
             -> 单测/集成测试 -> API -> 日志/指标 -> 环境锁定
```

| 环节 | 关键产物 | 质量门禁 |
|---|---|---|
| 数据入口 | Pydantic/dataclass schema | 非法值早失败，错误可定位 |
| 数据处理 | 可组合纯函数 | 输入不被隐式修改，有边界测试 |
| 任务执行 | CLI + YAML/TOML 配置 | 不手改代码切换数据/参数 |
| 服务化 | FastAPI endpoint | 超时、限流、异常和批处理语义明确 |
| 复现 | 锁定依赖 + README | 干净环境按命令可运行 |

## 横向：与其他技术的连接

- **与数学的连接**：用 NumPy 实现矩阵、概率分布和梯度实验。
- **与 PyTorch 的连接**：NumPy array 到 Tensor 的 dtype/device/shape 约束是常见错误源。
- **与数据工程的连接**：Parquet/Arrow 减少大数据集 IO 与类型丢失。
- **与 Java 的连接**：Java 负责业务事务、权限与稳定性；Python 负责数据/模型迭代。跨语言契约用 OpenAPI/gRPC schema 固化。
- **与 MLOps 的连接**：环境、配置、数据版本和指标是后续 CI/CD 的前提。

## 技术对比与选型

| 对比 | 选择建议 | 适用场景 | 注意 |
|---|---|---|---|
| `venv` vs `uv` | 先理解 `venv`，新工程可优先 `uv` | `venv` 通用；`uv` 速度和锁定体验好 | CUDA/PyTorch 需按官方索引选 wheel |
| Notebook vs `.py` | 探索用 Notebook，复用逻辑进包 | EDA/教学 vs 训练/服务 | Notebook 执行顺序不应成为隐式状态 |
| pytest vs 手工脚本 | 可重复判定一律 pytest | 数据校验、指标、API | 训练烟测用小数据/少 steps |
| FastAPI vs Spring Boot | AI 服务优先 FastAPI，业务主服务保留 Java | 模型迭代 vs 业务事务 | 别为了技术栈而强制拆服务 |

## Step by Step

1. **数据实验**：用 NumPy/Pandas 读取 JSONL，输出 schema、缺失值、重复率和长度分布。
2. **包化**：把处理逻辑放入 `src/`，将 Notebook 只作为调用者。
3. **测试**：对空文本、超长文本、Unicode、重复行和非法 schema 加 pytest。
4. **配置**：用 CLI 参数 + 配置文件选择输入/输出，不修改源码。
5. **服务化**：用 FastAPI 暴露 `/validate` 或 `/predict`，加入 schema、健康检查和超时。
6. **复现**：在新虚拟环境中仅按 README 重跑。

## 最小项目与验收标准

**项目：AI 数据集质量检查器**

| 验收项 | 过关标准 |
|---|---|
| 功能 | 支持 JSONL/CSV，输出 schema、空值、重复、长度和标签分布 |
| 工程 | `src/` + `tests/`，有 CLI，关键边界测试通过 |
| 复现 | 依赖锁定，没有硬编码绝对路径和密钥 |
| 交付 | README 包含安装、运行、示例输出和限制 |

## 常见误区与面试达标

- 误区：把 Java 写法逐行翻译为 Python，不利用向量化和生态库。
- 误区：所有逻辑都在 Notebook，不能测试、复用或服务化。
- 面试达标：能解释 GIL 不等于“Python 不能并发”，能区分 IO 并发、多进程和 GPU 计算。
- 面试达标：能说明 FastAPI 模型服务和 Java 业务服务的边界取舍。

## 下一步

进入 [02-数学基础](./02-数学基础.md)，用 NumPy/PyTorch 将数学概念落到可观察实验。
