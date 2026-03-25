# Rainbond 资源中心页面拆分设计文档

## 一、项目背景
### 1.1 项目架构

本次工作只涉及 `rainbond-ui` 前端仓库的资源中心页面：

- 路由入口：`/team/:teamName/region/:regionName/resource-center`
- 页面主文件：`src/pages/ResourceCenter/index.js`
- 详情页与日志、终端、Helm 升级弹窗已存在

### 1.2 现有基础

当前 `ResourceCenter/index.js` 已经承载以下职责：

- 资源 tab 导航与主视觉区域
- 6 类资源列表渲染
- YAML 新建/编辑弹窗
- Helm 安装/升级向导
- Helm 详情/回滚辅助弹窗
- 数据获取、删除、跳转、表单状态、安装流程控制

### 1.3 核心需求

1. 在不改变传参、dispatch、路由、交互和页面行为的前提下拆分 `index.js`
2. 将页面拆成更清晰的“容器层 + 展示层”
3. 保持现有 Ant Design 3、class component 风格
4. 降低后续维护成本，便于定位 tab 逻辑与 Helm 逻辑

## 二、整体架构设计
### 2.1 系统架构图

```text
ResourceCenter/index.js
  ├─ 页面状态与行为编排
  ├─ 路由跳转 / dispatch / CRUD / Helm 流程控制
  ├─ tabs/*
  │   ├─ WorkloadTab
  │   ├─ PodTab
  │   ├─ NetworkTab
  │   ├─ ConfigTab
  │   ├─ StorageTab
  │   └─ HelmTab
  ├─ components/*
  │   ├─ 页面公共展示组件
  │   └─ Helm 相关弹窗组件
  └─ constants.js / helpers.js
```

### 2.2 核心流程

重构后保持原有流程不变：

1. 主页面初始化读取 URL query
2. `index.js` 继续持有全部 state 与所有 handler
3. 各 tab 组件只接收数据与回调，不持有业务状态
4. Helm 弹窗组件只负责渲染，安装/升级/回滚仍由 `index.js` 提供回调

## 三、数据模型设计
### 3.1 新增数据库表

无。

### 3.2 数据关系

无后端数据结构变更，仅前端组件关系重组：

- `constants.js`：tab 元数据、默认值、资源映射
- `helpers.js`：版本比较、表格滚动、状态统计等纯函数
- `tabs/*`：列表渲染层
- `components/HelmModals.js`：Helm 弹窗展示层

## 四、API设计
### 4.1 接口列表

本次不新增接口，不改接口参数。

### 4.2 请求/响应结构

保持完全不变。

## 五、核心实现设计
### 5.1 关键逻辑

- `index.js` 保留：
  - 生命周期
  - URL 参数解析
  - `fetchTabData`
  - YAML 创建/编辑逻辑
  - Helm 安装/升级/回滚逻辑
  - 各类跳转与删除逻辑
- 下沉：
  - tab 表格列定义与列表渲染
  - 侧边导航、Hero、内容头部
  - YAML 弹窗头
  - Helm 各展示弹窗

### 5.2 复用现有代码

- 复用现有 `utils.js`、`helmValues.js`
- 复用现有 `styles`、服务层、DVA model
- 复用现有 `HelmUpgradeModal`、详情页等既有能力

## 六、实施计划
### Sprint 1: 页面结构拆分
#### Task 1.1: 提取常量与纯函数
- 文件：`src/pages/ResourceCenter/constants.js`
- 文件：`src/pages/ResourceCenter/helpers.js`
- 实现内容：迁移 tab 元数据、默认值、版本比较和表格辅助函数
- 验收标准：主页面无行为变化

#### Task 1.2: 提取公共展示组件
- 文件：`src/pages/ResourceCenter/components/*.js`
- 实现内容：拆分导航、Hero、工具栏、空状态、YAML 头部、Helm 弹窗
- 验收标准：UI 表现不变

#### Task 1.3: 提取 6 个 tab 视图
- 文件：`src/pages/ResourceCenter/tabs/*.js`
- 实现内容：拆分 workload/pod/network/config/storage/helm 列表渲染
- 验收标准：点击、删除、跳转、筛选逻辑保持不变

#### Task 1.4: 收敛 index.js 容器职责
- 文件：`src/pages/ResourceCenter/index.js`
- 实现内容：只保留状态、调度和主渲染装配
- 验收标准：代码结构清晰，构建通过

## 七、关键参考代码
| 功能 | 文件 | 说明 |
|------|------|------|
| 资源中心主页面 | `src/pages/ResourceCenter/index.js` | 当前待拆分主文件 |
| Helm values 选择 | `src/pages/ResourceCenter/helmValues.js` | 预览文件优先级逻辑 |
| 资源状态映射 | `src/pages/ResourceCenter/utils.js` | 状态、工作负载类型映射 |
