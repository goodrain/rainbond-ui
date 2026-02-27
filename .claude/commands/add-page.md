# 新增页面

引导开发者在 rainbond-ui 新增一个页面。

## 请提供以下信息

1. 页面名称和路径（例如：`/team/:teamName/apps/:appId/something`）
2. 页面功能描述
3. 需要调用哪些 API？
4. 是否需要状态管理（DVA model）？

## 实施步骤

### 1. 创建页面组件
- 目录：`src/pages/YourPage/`
- 创建 `index.js` 作为主组件
- 使用 class 组件 + `@connect` 装饰器（DVA 模式）
- 使用 Ant Design 3.x 组件（注意不是 v4/v5）

### 2. 添加路由
- 文件：`config/router.config.js`
- 在合适的位置添加路由配置

### 3. 添加 API 调用
- 文件：`src/services/api.js`（或对应的 service 文件）
- 使用 `request()` 函数发送请求
- API 路径以 `${apiconfig.baseUrl}/console/...` 开头

### 4. 添加 DVA Model（如需状态管理）
- 文件：`src/models/yourModel.js`
- 定义 namespace、state、effects、reducers
- effects 中使用 `yield call(serviceFunction, payload)` 调用 API
- reducers 中更新 state

### 5. 添加国际化
- 中文：`src/locales/zh-CN/` 下对应文件
- 英文：`src/locales/en-US/` 下对应文件

### 6. 验证
```bash
yarn build
```

## 注意事项

- 使用 Ant Design 3.19 的 API，不要使用 v4+ 的写法
- 使用 class 组件而非函数组件（项目约定）
- 通过 DVA dispatch 调用 API，不要在组件中直接调用 service
