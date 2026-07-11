# Zero AI Alibaba Frontend

基于 Vue3 + TypeScript + Ant Design Vue 的前端测试平台

## 技术栈

- Vue 3.4
- TypeScript
- Vite 5
- Vue Router 4
- Pinia 2
- Ant Design Vue 4

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev

# 构建生产版本
pnpm run build
```

**注意：** 如果未安装 pnpm，可以使用 `npm install -g pnpm` 安装，或使用 `npm` 替代 `pnpm`。

## 项目结构

```
frontend/
├── src/
│   ├── api/          # API 接口
│   ├── router/       # 路由配置
│   ├── stores/       # Pinia 状态管理
│   ├── views/        # 页面组件
│   ├── App.vue       # 根组件
│   └── main.ts       # 入口文件
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

