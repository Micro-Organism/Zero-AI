# zero-ai-study API（FastAPI）

学习进度看板后端，模块在 `src/study_api/`。

## 依赖安装（conda base + 清华镜像）

```bash
conda activate base
cd zero-ai-study/app
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt
```

## 启动

```bash
conda activate base
cd zero-ai-study/app
PYTHONPATH=src uvicorn study_api.main:app --reload --host 0.0.0.0 --port 8000
```

- API 文档：http://localhost:8000/docs  
- 设计说明：`../docs/web-app-design.md`
