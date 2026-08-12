"""Local deterministic analysis for reference resumes.

A curated AI/engineering skill bank powers skill extraction and a shallow-to-deep
interview ladder. This keeps the feature usable before any AI provider key is
configured; an optional LLM pass can be layered on later.
"""

import re

LEVELS = [
    ("L1 概念认知", "先讲清是什么、为什么、边界在哪"),
    ("L2 应用落地", "能在代码和项目里真正用起来"),
    ("L3 系统与进阶", "能设计生产级方案并说明取舍"),
    ("L4 深挖与复盘", "能讲指标、失败、边界和复现"),
]

GENERIC_LEVELS = {
    "编程与工程": {
        "L1 概念认知": [
            "这个技能解决什么问题？核心概念和适用边界是什么？",
            "它通常与哪些工具或语言一起出现？",
        ],
        "L2 应用落地": [
            "请用一个最小可运行例子展示它的关键用法。",
            "你在简历项目中如何落地它？关键实现和验证方式是什么？",
        ],
        "L3 系统与进阶": [
            "设计一个使用该技能的生产级方案，说明性能、稳定性和成本取舍。",
            "如果线上服务因它出现问题，你的定位、修复和防止复发步骤是什么？",
        ],
        "L4 深挖与复盘": [
            "什么场景下它不适用或会失败？如何提前检测？",
            "如果从零复盘一次使用，你的指标、失败和优化结论是什么？",
        ],
    },
    "数据与数学": {
        "L1 概念认知": [
            "它的核心定义是什么？用一句话说明它解决什么问题。",
            "它在机器学习训练和评估中扮演什么角色？",
        ],
        "L2 应用落地": [
            "请给出一个具体计算或代码例子，说明它的输入、输出和常见陷阱。",
            "它如何帮助你解释损失、梯度、指标或数据分布？",
        ],
        "L3 系统与进阶": [
            "在数据规模变大后，你会如何优化它的计算或存储？",
            "如何验证你的数学假设在真实数据上成立？",
        ],
        "L4 深挖与复盘": [
            "它的近似假设失效时，会带来哪些偏差或风险？",
            "你如何把一次数据或指标异常归因到具体环节？",
        ],
    },
    "机器学习与深度学习": {
        "L1 概念认知": [
            "这个模型或方法解决什么问题？核心机制是什么？",
            "它的输入、输出、损失和评估指标分别是什么？",
        ],
        "L2 应用落地": [
            "请写出它的最小训练或推理流程，并说明关键超参数。",
            "你在项目中如何选择基线、比较指标并做误差分析？",
        ],
        "L3 系统与进阶": [
            "如何防止过拟合、数据泄漏和分布漂移？给出具体设计。",
            "如果效果不达标，你会先查数据、模型还是指标？为什么？",
        ],
        "L4 深挖与复盘": [
            "什么情况下它不如简单基线？如何用实验证明？",
            "请完整复盘一次实验：改动、复现、指标、失败和结论。",
        ],
    },
    "NLP 与大模型": {
        "L1 概念认知": [
            "这个概念解决什么问题？它位于模型训练或推理的哪个环节？",
            "它和相邻概念（如 Token、Embedding、Attention）有什么关系？",
        ],
        "L2 应用落地": [
            "请给出一个代码或 Prompt 示例，展示它的实际用法。",
            "在你的简历项目中，你如何选择方案并验证效果？",
        ],
        "L3 系统与进阶": [
            "如何控制它的成本、延迟和质量？请给出权衡方案。",
            "面对幻觉、知识过时或格式不稳定，你会如何设计兜底？",
        ],
        "L4 深挖与复盘": [
            "它的边界条件和失败模式是什么？如何建立回归测试？",
            "如果重新实现一次，你会改变哪些数据、模型或评测决策？",
        ],
    },
    "系统与治理": {
        "L1 概念认知": [
            "这个系统能力解决什么问题？核心组件和职责是什么？",
            "它与其他系统（训练、部署、监控）如何衔接？",
        ],
        "L2 应用落地": [
            "请描述一个完整落地流程，并指出关键配置和验收标准。",
            "在项目中你如何保证可复现、可回滚和可观测？",
        ],
        "L3 系统与进阶": [
            "设计高可用方案时，你会如何处理单点、容量和故障恢复？",
            "如何量化上线前后效果并做灰度或 A/B 验证？",
        ],
        "L4 深挖与复盘": [
            "你遇到过的最大故障是什么？如何定位、恢复和复盘？",
            "哪些监控和治理手段能提前发现同类问题？",
        ],
    },
    "方向扩展": {
        "L1 概念认知": [
            "这个方向的典型任务、数据和指标是什么？",
            "它和 LLM 主线的共通能力有哪些？",
        ],
        "L2 应用落地": [
            "请设计一个最小可跑通的项目闭环，并说明评估方式。",
            "你在项目中如何处理数据、模型选择和结果解释？",
        ],
        "L3 系统与进阶": [
            "在真实业务中，你会如何权衡效果、成本和迭代周期？",
            "如何判断这个问题是否适合用该技术解决？",
        ],
        "L4 深挖与复盘": [
            "它的常见失败模式和数据偏置有哪些？",
            "如果从头重做，你会改变哪些关键决策？",
        ],
    },
}

DEFAULT_LEVELS = {
    "L1 概念认知": [
        "这个技能的核心概念是什么？解决什么问题？",
        "它通常和哪些技能一起出现在实际工作中？",
    ],
    "L2 应用落地": [
        "请用一个最小例子展示它的关键用法。",
        "在你的项目里它如何落地？关键实现和结果是什么？",
    ],
    "L3 系统与进阶": [
        "设计一个使用它的生产级方案，明确输入、输出和边界。",
        "相比同类方案，它有什么优势、限制和成本？",
    ],
    "L4 深挖与复盘": [
        "什么情况下它不适用或会失败？如何检测？",
        "如果从零复盘一次使用，你的指标、失败和优化是什么？",
    ],
}


def _entry_levels(name: str, category: str) -> dict[str, list[str]]:
    entry = SKILL_KNOWLEDGE.get(name)
    if entry and entry.get("levels"):
        return entry["levels"]
    return GENERIC_LEVELS.get(category, DEFAULT_LEVELS)


def _ascii_token(alias: str) -> bool:
    return bool(re.fullmatch(r"[a-z0-9+.#_-]+", alias.lower()))


def _alias_hits(text: str, alias: str) -> int:
    alias_l = alias.lower()
    if _ascii_token(alias):
        pattern = rf"(?<![a-z0-9]){re.escape(alias_l)}(?![a-z0-9])"
        return len(re.findall(pattern, text))
    return text.count(alias_l)


def _strip_bullet(line: str) -> str:
    return re.sub(r"^[\s\-•·*◦>]+", "", line).strip()


def _is_heading(line: str) -> bool:
    return bool(
        re.match(
            r"^[#\-*\d.]*\s*(工作经历|工作经验|工作履历|实习经历|"
            r"项目经历|项目经验|专业技能|技能清单|技术栈|技能)[:：]?$",
            line,
        )
    )


def _parse_sections(source_text: str) -> dict:
    lines = [line.strip() for line in source_text.splitlines() if line.strip()]
    sections: dict[str, list[str]] = {}
    current: str | None = None
    for line in lines:
        if _is_heading(line):
            current = line
            sections.setdefault(current, [])
            continue
        if current:
            sections[current].append(line)

    work = []
    current_work = None
    for line in (
        sections.get("工作经历", [])
        or sections.get("工作经验", [])
        or sections.get("工作履历", [])
        or sections.get("实习经历", [])
    ):
        if any(keyword in line for keyword in ("公司", "单位", "就职", "在职")):
            if current_work:
                work.append(current_work)
            current_work = {"company": line, "role": "", "period": "", "description": "", "achievements": []}
            continue
        if not current_work:
            continue
        if line.startswith(("-", "•", "·", "*", "◦", ">")):
            current_work["achievements"].append(_strip_bullet(line))
        elif re.match(r"^\d{4}", line) or "至今" in line:
            current_work["period"] = f"{current_work['period']} {line}".strip()
        elif any(keyword in line for keyword in ("担任", "职位", "岗位", "角色")):
            current_work["role"] = line
        elif not current_work["description"]:
            current_work["description"] = line
    if current_work:
        work.append(current_work)

    projects = []
    current_project = None
    for line in sections.get("项目经历", []) or sections.get("项目经验", []):
        if "项目" in line and len(line) <= 40:
            if current_project:
                projects.append(current_project)
            current_project = {
                "name": line,
                "role": "",
                "background": "",
                "responsibilities": [],
                "achievements": [],
                "technologies": [],
                "metrics": [],
            }
            continue
        if not current_project:
            continue
        if line.startswith(("-", "•", "·", "*", "◦", ">")):
            content = _strip_bullet(line)
            if any(keyword in line for keyword in ("指标", "提升", "%", "耗时", "召回", "精度", "准确率")):
                current_project["metrics"].append(content)
            elif any(keyword in line for keyword in ("负责", "实现", "设计", "开发")):
                current_project["responsibilities"].append(content)
            else:
                current_project["achievements"].append(content)
        elif any(keyword in line for keyword in ("担任", "角色", "负责")):
            current_project["role"] = line
        elif any(keyword in line for keyword in ("技术", "栈", "Python", "PyTorch", "Java")):
            current_project["technologies"].append(line)
        elif not current_project["background"]:
            current_project["background"] = line
    if current_project:
        projects.append(current_project)

    highlights = [_strip_bullet(line) for line in lines if line.startswith(("-", "•", "·", "*", "◦", ">"))]
    highlights.extend(_strip_bullet(line) for line in lines if re.match(r"^\s*\d+[.)、]\s*", line))
    seen = set()
    unique_highlights = []
    for item in highlights:
        if item and item not in seen:
            seen.add(item)
            unique_highlights.append(item)

    return {
        "work_experiences": work,
        "project_experiences": projects,
        "highlights": unique_highlights,
    }


def _infer_level(evidence: str) -> int:
    strong = ("精通", "资深", "专家", "熟练", "深入", "多年", "高级", "十年")
    medium = ("熟悉", "掌握", "应用", "实践", "项目", "负责", "使用", "做过")
    basic = ("了解", "入门", "基础", "学习过", "初步")
    if any(keyword in evidence for keyword in strong):
        return 5
    if any(keyword in evidence for keyword in medium):
        return 4
    if any(keyword in evidence for keyword in basic):
        return 2
    return 3


def _first_hit_line(lines: list[str], aliases: tuple[str, ...]) -> str:
    for line in lines:
        if any(_alias_hits(line.lower(), alias) for alias in aliases):
            return line[:200]
    return ""


def analyze_reference_resume(source_text: str, title: str = "", summary: str = "") -> dict:
    lines = [line.strip() for line in source_text.splitlines() if line.strip()]
    text_lower = source_text.lower()
    detected = []
    for name, entry in SKILL_KNOWLEDGE.items():
        aliases = entry["aliases"]
        count = sum(_alias_hits(text_lower, alias) for alias in aliases)
        if not count:
            continue
        evidence = _first_hit_line(lines, aliases) or summary
        detected.append(
            {
                "name": name,
                "category": entry["category"],
                "level": _infer_level(evidence),
                "count": count,
                "evidence": evidence,
            }
        )
    detected.sort(key=lambda item: (-item["count"], item["name"]))

    sections = _parse_sections(source_text)
    roadmap = []
    for skill in detected:
        levels = _entry_levels(skill["name"], skill["category"])
        roadmap.append(
            {
                "skill": skill["name"],
                "category": skill["category"],
                "levels": [
                    {
                        "level": label,
                        "label": description,
                        "questions": levels.get(label, DEFAULT_LEVELS[label]),
                    }
                    for label, description in LEVELS
                ],
            }
        )
    return {
        "skills": detected,
        "interview_roadmap": roadmap,
        "mode": "local",
        **sections,
    }


def _skill(
    name: str,
    category: str,
    aliases: tuple[str, ...],
    levels: dict[str, list[str]] | None = None,
) -> dict:
    entry: dict = {"category": category, "aliases": aliases}
    if levels:
        entry["levels"] = levels
    return entry


SKILL_KNOWLEDGE: dict[str, dict] = {
    "Python": _skill(
        "Python",
        "编程与工程",
        ("python", "python3"),
        {
            "L1 概念认知": [
                "GIL 是什么？它限制什么、不限制什么？",
                "列表、字典、生成器和装饰器分别适合什么场景？",
            ],
            "L2 应用落地": [
                "写一个带类型标注、日志、异常处理和单测的数据处理函数。",
                "解释 asyncio、多线程、多进程的取舍并给出实际例子。",
            ],
            "L3 系统与进阶": [
                "设计一个可复现的 Python AI 项目：依赖锁定、环境隔离、数据与模型版本如何管理？",
                "线上 Python 服务出现内存增长，你的排查步骤是什么？",
            ],
            "L4 深挖与复盘": [
                "如何用基准和统计判断一段 Python 代码真的更优？",
                "解释引用计数、循环引用和 GC 对服务稳定性的影响。",
            ],
        },
    ),
    "SQL": _skill(
        "SQL",
        "编程与工程",
        ("sql", "mysql", "postgresql", "postgres"),
        {
            "L1 概念认知": [
                "SQL 中 JOIN、GROUP BY 和窗口函数分别解决什么问题？",
                "主键、索引和事务分别保证什么？",
            ],
            "L2 应用落地": [
                "写一个查询，统计每天每个城市的订单量与去重用户数。",
                "如何为一个慢查询加索引，并解释执行计划？",
            ],
            "L3 系统与进阶": [
                "数据量到千万级后，你会如何优化分区、索引和写入？",
                "如何设计一张支持点查和聚合分析的宽表？",
            ],
            "L4 深挖与复盘": [
                "索引失效和统计信息过期会造成什么问题？如何监控？",
                "一次线上慢查询事故，你的定位、修复和复盘是什么？",
            ],
        },
    ),
    "Git": _skill(
        "Git",
        "编程与工程",
        ("git",),
    ),
    "Linux": _skill(
        "Linux",
        "编程与工程",
        ("linux", "shell", "bash", "服务器"),
    ),
    "Docker": _skill(
        "Docker",
        "编程与工程",
        ("docker", "容器化", "容器"),
        {
            "L1 概念认知": [
                "镜像、容器和 Dockerfile 的关系是什么？",
                "容器隔离了什么、又没有隔离什么？",
            ],
            "L2 应用落地": [
                "为一个 FastAPI 服务写 Dockerfile，说明基础镜像和多阶段构建。",
                "如何用 volume、env 和 healthcheck 让容器可运维？",
            ],
            "L3 系统与进阶": [
                "容器镜像如何做安全扫描、依赖最小化和不可变发布？",
                "容器与 Kubernetes 的部署、滚动更新和回滚如何配合？",
            ],
            "L4 深挖与复盘": [
                "容器里的僵尸进程、磁盘增长和时区问题如何处理？",
                "一次容器启动失败，你如何从日志、配置和资源维度排查？",
            ],
        },
    ),
    "FastAPI": _skill(
        "FastAPI",
        "编程与工程",
        ("fastapi",),
        {
            "L1 概念认知": [
                "FastAPI 的路径参数、依赖注入和 Pydantic 校验如何协作？",
                "它和 Flask、Spring Boot 的定位差异是什么？",
            ],
            "L2 应用落地": [
                "设计一个带认证、分页和文件上传的模型服务接口。",
                "如何组织路由、Service 和 Repository 层？",
            ],
            "L3 系统与进阶": [
                "如何为模型服务配置超时、重试、限流和健康检查？",
                "异步接口中，CPU 密集推理和 IO 并发如何取舍？",
            ],
            "L4 深挖与复盘": [
                "如何设计接口回归集，避免模型或 Schema 变更破坏契约？",
                "一次生产接口延迟飙升，你的排查和恢复过程是什么？",
            ],
        },
    ),
    "Testing": _skill(
        "Testing",
        "编程与工程",
        ("pytest", "单测", "单元测试", "测试"),
    ),
    "Java": _skill(
        "Java",
        "编程与工程",
        ("java", "jvm"),
    ),
    "Spring Boot": _skill(
        "Spring Boot",
        "编程与工程",
        ("spring boot", "springboot", "spring"),
    ),
    "NumPy": _skill("NumPy", "数据与数学", ("numpy", "np")),
    "Pandas": _skill("Pandas", "数据与数学", ("pandas",)),
    "Data Engineering": _skill("数据工程", "数据与数学", ("数据工程", "数据管道", "etl", "spark")),
    "Linear Algebra": _skill("线性代数", "数据与数学", ("线性代数", "矩阵", "vector", "矩阵乘法")),
    "Probability & Statistics": _skill("概率统计", "数据与数学", ("概率", "统计", "假设检验", "分布")),
    "Machine Learning": _skill(
        "机器学习",
        "机器学习与深度学习",
        ("机器学习", "machine learning", "ml"),
        {
            "L1 概念认知": [
                "监督、无监督、半监督和强化学习的区别是什么？",
                "训练集、验证集、测试集的分工和泄漏风险是什么？",
            ],
            "L2 应用落地": [
                "为分类任务设计 baseline、特征、模型和指标。",
                "如何做交叉验证、误差分析和超参数调优？",
            ],
            "L3 系统与进阶": [
                "线上数据分布变化时，如何检测并回退到旧模型？",
                "如何设计一个可复现、可对比的实验体系？",
            ],
            "L4 深挖与复盘": [
                "模型效果提升是真实改进还是数据/指标作弊？如何证明？",
                "请完整复盘一个失败项目：假设、证据、取舍和结论。",
            ],
        },
    ),
    "scikit-learn": _skill("scikit-learn", "机器学习与深度学习", ("scikit-learn", "sklearn", "scikit learn")),
    "Feature Engineering": _skill("特征工程", "机器学习与深度学习", ("特征工程", "特征处理", "特征")),
    "Evaluation Metrics": _skill(
        "评测指标",
        "机器学习与深度学习",
        ("评测指标", "评估指标", "precision", "recall", "f1", "auc", "准确率", "召回率"),
    ),
    "Regularization": _skill("正则化", "机器学习与深度学习", ("正则化", "l1", "l2", "dropout", "早停")),
    "Neural Network": _skill(
        "神经网络",
        "机器学习与深度学习",
        ("神经网络", "neural network", "深度学习", "deep learning"),
        {
            "L1 概念认知": [
                "神经元、激活函数、层和损失函数如何构成网络？",
                "前向传播和反向传播分别计算什么？",
            ],
            "L2 应用落地": [
                "写出一个不含框架的 MLP 训练循环。",
                "如何通过损失曲线判断欠拟合、过拟合和梯度异常？",
            ],
            "L3 系统与进阶": [
                "如何选择网络结构、正则化和优化器？",
                "模型在训练集好、验证集差时，你的诊断顺序是什么？",
            ],
            "L4 深挖与复盘": [
                "梯度消失、梯度爆炸和退化问题如何检测与解决？",
                "如果精度提升来自泄漏特征，你会如何发现并修复？",
            ],
        },
    ),
    "Backpropagation": _skill("反向传播", "机器学习与深度学习", ("反向传播", "backprop", "链式法则")),
    "PyTorch": _skill(
        "PyTorch",
        "机器学习与深度学习",
        ("pytorch", "torch"),
        {
            "L1 概念认知": [
                "Tensor、autograd、Dataset 和 DataLoader 分别负责什么？",
                "requires_grad、no_grad、inference_mode、detach 有什么区别？",
            ],
            "L2 应用落地": [
                "不借助 Trainer 写出训练、验证、保存和恢复循环。",
                "如何配置 seed、设备、混合精度和 checkpoint？",
            ],
            "L3 系统与进阶": [
                "按参数、梯度、optimizer state、activation 拆解显存占用。",
                "DDP 和 FSDP 分别切分什么？什么场景选哪个？",
            ],
            "L4 深挖与复盘": [
                "一次训练崩溃或 OOM，你的定位和修复过程是什么？",
                "如何设计实验记录，保证每个 checkpoint 可追溯？",
            ],
        },
    ),
    "GPU": _skill("GPU", "机器学习与深度学习", ("gpu", "cuda", "显卡")),
    "Optimizer": _skill("优化器", "机器学习与深度学习", ("优化器", "sgd", "adam", "adamw", "学习率")),
    "NLP": _skill("NLP", "NLP 与大模型", ("nlp", "自然语言处理")),
    "Tokenization": _skill("分词", "NLP 与大模型", ("分词", "tokenizer", "bpe", "token")),
    "Embedding": _skill("Embedding", "NLP 与大模型", ("embedding", "向量化", "向量")),
    "Attention": _skill(
        "Attention",
        "NLP 与大模型",
        ("attention", "自注意力", "self-attention", "交叉注意力", "cross-attention"),
    ),
    "Transformer": _skill(
        "Transformer",
        "NLP 与大模型",
        ("transformer", "transformers"),
        {
            "L1 概念认知": [
                "Q/K/V 的 shape 和注意力分数如何计算？",
                "self-attention、masked self-attention 和 cross-attention 各用于哪里？",
            ],
            "L2 应用落地": [
                "用 Hugging Face 跑一次文本生成，并解释输入输出。",
                "如何控制 max length、temperature、top-p 和 seed？",
            ],
            "L3 系统与进阶": [
                "解释位置编码、KV Cache 和连续批处理对推理的影响。",
                "Transformer 的显存和延迟瓶颈在哪里？如何优化？",
            ],
            "L4 深挖与复盘": [
                "长文本下注意力失效或上下文丢失，你会如何排查？",
                "如果重训一个小 Transformer，你会固定哪些实验变量？",
            ],
        },
    ),
    "LLM": _skill(
        "LLM",
        "NLP 与大模型",
        ("llm", "大模型", "生成式 ai", "gpt"),
        {
            "L1 概念认知": [
                "大模型为什么能生成连贯文本？自回归生成如何工作？",
                "Prompt、RAG、微调和 Agent 分别解决什么问题？",
            ],
            "L2 应用落地": [
                "设计一个带系统提示、输出校验和失败的 LLM 调用封装。",
                "如何评测一次生成的正确性、格式和成本？",
            ],
            "L3 系统与进阶": [
                "面对幻觉、知识过时和敏感内容，如何设计降级与审核？",
                "如何为 LLM 服务设置缓存、限流、监控和 A/B 实验？",
            ],
            "L4 深挖与复盘": [
                "如何建立回归集，判断 Prompt 或模型升级带来的行为变化？",
                "一次线上回答质量事故，你的归因、恢复和治理是什么？",
            ],
        },
    ),
    "Prompt Engineering": _skill("Prompt Engineering", "NLP 与大模型", ("prompt", "提示词")),
    "RAG": _skill(
        "RAG",
        "NLP 与大模型",
        ("rag", "检索增强"),
        {
            "L1 概念认知": [
                "RAG 的检索、生成和引用链路是什么？",
                "chunk、embedding、hybrid search 和 rerank 各解决什么问题？",
            ],
            "L2 应用落地": [
                "设计一个文档问答系统：解析、切分、向量化、检索和生成。",
                "如何评估检索命中率和生成忠实度？",
            ],
            "L3 系统与进阶": [
                "如何做数据更新、增量索引和版本回滚？",
                "检索不到、答非所问、引用错误分别如何排查？",
            ],
            "L4 深挖与复盘": [
                "如何验证答案没有幻觉，并追溯来源？",
                "一次回答错误，你的归因链路和修正方案是什么？",
            ],
        },
    ),
    "Agent": _skill(
        "Agent",
        "NLP 与大模型",
        ("agent", "智能体", "tool calling", "工具调用"),
        {
            "L1 概念认知": [
                "Agent 的 control loop 由哪些环节组成？",
                "工具、记忆、规划和权限分别承担什么？",
            ],
            "L2 应用落地": [
                "设计一个带工具调用、超时和重试的 Agent 示例。",
                "如何限制 Agent 的操作边界和成本？",
            ],
            "L3 系统与进阶": [
                "如何为 Agent 设计状态恢复、并发控制和审计日志？",
                "Agent 循环失控或工具返回异常时如何兜底？",
            ],
            "L4 深挖与复盘": [
                "如何评测 Agent 在真实任务上的成功率与失败类型？",
                "一次多轮 Agent 失败，你的复现和修正过程是什么？",
            ],
        },
    ),
    "Fine-tuning": _skill(
        "微调",
        "NLP 与大模型",
        ("微调", "fine-tuning", "sft", "supervised fine-tuning"),
        {
            "L1 概念认知": [
                "预训练、微调、迁移学习和全参训练的区别是什么？",
                "微调的目标是什么？什么情况下不该微调？",
            ],
            "L2 应用落地": [
                "设计一次 SFT 实验：数据、模板、训练、评测、合并和量化。",
                "如何划分训练集和固定评测集，防止数据泄漏？",
            ],
            "L3 系统与进阶": [
                "Full FT、LoRA、QLoRA 的显存构成和选型依据是什么？",
                "微调后通用能力退化或格式过拟合，如何诊断？",
            ],
            "L4 深挖与复盘": [
                "如何证明微调带来真实改善而非记忆评测集？",
                "完整复盘一次微调：base vs tuned 的指标与失败归因。",
            ],
        },
    ),
    "LoRA": _skill(
        "LoRA",
        "NLP 与大模型",
        ("lora", "qlora"),
    ),
    "RLHF": _skill("RLHF", "NLP 与大模型", ("rlhf", "人类反馈", "dpo")),
    "Model Evaluation": _skill(
        "模型评测",
        "NLP 与大模型",
        ("模型评测", "评测集", "benchmark", "evaluation"),
    ),
    "MLOps": _skill(
        "MLOps",
        "系统与治理",
        ("mlops", "机器学习平台"),
        {
            "L1 概念认知": [
                "MLOps 覆盖数据、训练、评测、部署、监控哪些环节？",
                "模型版本、数据版本和代码版本如何关联？",
            ],
            "L2 应用落地": [
                "为一个训练实验设计配置、seed、指标、checkpoint 和报告。",
                "如何用 CI/CD 对模型服务做回归测试和发布？",
            ],
            "L3 系统与进阶": [
                "如何设计模型上线、灰度、回滚和下线流程？",
                "数据漂移、特征漂移和预测漂移如何检测？",
            ],
            "L4 深挖与复盘": [
                "一次模型上线后指标恶化，你的归因和回滚策略是什么？",
                "如何让一次实验在三个月后仍可复现？",
            ],
        },
    ),
    "Model Deployment": _skill(
        "模型部署",
        "系统与治理",
        ("模型部署", "部署", "inference", "推理服务"),
        {
            "L1 概念认知": [
                "在线推理、批处理和流式推理分别适合什么场景？",
                "延迟、吞吐、成本和可用性如何定义和权衡？",
            ],
            "L2 应用落地": [
                "把一个模型封装成带健康检查、超时和监控的 API。",
                "如何做模型预热、并发控制和优雅停机？",
            ],
            "L3 系统与进阶": [
                "如何优化 TTFT、TPOT、KV Cache 和 continuous batching？",
                "多模型共享 GPU 时如何做调度和资源隔离？",
            ],
            "L4 深挖与复盘": [
                "线上出现错误率和延迟上升，你的定位与恢复步骤是什么？",
                "如何通过回归集和影子流量预防模型回归？",
            ],
        },
    ),
    "Monitoring": _skill("监控", "系统与治理", ("监控", "prometheus", "grafana", "观测")),
    "AI Safety": _skill("AI 安全", "系统与治理", ("安全", "安全治理", "越狱", "jailbreak")),
    "Kubernetes": _skill("Kubernetes", "系统与治理", ("kubernetes", "k8s", "容器编排")),
    "CV": _skill("计算机视觉", "方向扩展", ("计算机视觉", "computer vision", "cv", "目标检测", "图像分类")),
    "Multimodal": _skill("多模态", "方向扩展", ("多模态", "multimodal")),
    "Recommendation": _skill("推荐系统", "方向扩展", ("推荐", "推荐系统", "recall", "排序")),
    "Time Series": _skill("时序预测", "方向扩展", ("时序", "时间序列", "forecast")),
}
