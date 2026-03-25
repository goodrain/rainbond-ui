# Rainbond 资源中心页面样式统一设计文档

## 一、项目背景
### 1.1 项目架构

本次工作仅涉及 `rainbond-ui` 前端仓库内的 K8S 资源中心相关页面与组件：

- `src/pages/ResourceCenter/index.js`
- `src/pages/ResourceCenter/WorkloadDetail.js`
- `src/pages/ResourceCenter/PodDetail.js`
- `src/pages/ResourceCenter/ServiceDetail.js`
- `src/pages/ResourceCenter/HelmDetail.js`
- `src/pages/ResourceCenter/components/*`
- `src/pages/ResourceCenter/tabs/*`

### 1.2 现有基础

当前资源中心已有完整功能，但页面样式存在以下问题：

- 页面未统一使用 `PageHeaderLayout`
- `index.less`、`detail.less` 中仍有较多硬编码颜色、字号、行高
- `tabs/*` 和 Helm 相关弹窗中仍存在大量内联样式
- 主题色、字体层级、状态色与 `config/theme.js` 没有完全对齐

### 1.3 核心需求

1. 整个 K8S 资源中心相关页面统一使用 `PageHeaderLayout` 包裹
2. 所有颜色、字号、行高、字体颜色尽量使用 `theme.js` 对应变量
3. 优先使用 less 中的全局主题变量，如 `@primary-color`
4. 不改变页面参数、数据流、交互和业务逻辑

## 二、整体架构设计
### 2.1 系统架构图

```text
PageHeaderLayout
  └─ ResourceCenter / Detail Pages
       ├─ 页面内容结构
       ├─ tabs/*
       ├─ components/*
       └─ index.less / detail.less / modal less
```

### 2.2 核心流程

1. 为资源中心主页面与详情页增加 `PageHeaderLayout`
2. 保持页面主体内容结构不变，仅外层统一包裹
3. 将硬编码视觉样式迁移到 less
4. 将 less 中的视觉值统一替换为主题变量
5. 对仍需动态样式的场景，改为“className + 状态修饰类”的方式

## 三、数据模型设计
### 3.1 新增数据库表

无。

### 3.2 数据关系

无数据模型变更，仅样式层变更。

## 四、API设计
### 4.1 接口列表

不新增接口。

### 4.2 请求/响应结构

不变。

## 五、核心实现设计
### 5.1 关键逻辑

- 页面级统一：
  - `PageHeaderLayout`
  - `title`
  - `content`
  - `titleSvg`
- 样式统一：
  - `@primary-color`
  - `@success-color`
  - `@warning-color`
  - `@error-color`
  - `@heading-color`
  - `@text-color`
  - `@text-color-secondary`
  - `@border-color-base`
  - `@rbd-*` 字号与行高变量
- 组件级统一：
  - 清除 tabs / 弹窗 / 详情页中的内联主题样式
  - 使用 less class 替代颜色、字号、行高的硬编码

### 5.2 复用现有代码

- 复用 `PageHeaderLayout`
- 复用 `pageHeaderSvg`
- 复用现有 `index.less`、`detail.less`
- 不动 DVA model、service、路由与交互逻辑

## 六、实施计划
### Sprint 1: 页面外壳统一
#### Task 1.1: 接入 PageHeaderLayout
- 文件：`src/pages/ResourceCenter/*.js`
- 实现内容：为主页面和详情页统一包裹 `PageHeaderLayout`
- 验收标准：页面布局正常，无逻辑回归

#### Task 1.2: 页面级 less 主题化
- 文件：`src/pages/ResourceCenter/index.less`
- 文件：`src/pages/ResourceCenter/detail.less`
- 实现内容：替换硬编码颜色、字号、行高
- 验收标准：主要视觉均使用主题变量

#### Task 1.3: tabs 和组件主题化
- 文件：`src/pages/ResourceCenter/tabs/*`
- 文件：`src/pages/ResourceCenter/components/*`
- 实现内容：将内联主题样式迁移到 less
- 验收标准：不再依赖内联硬编码颜色和字号

#### Task 1.4: 验证
- 文件：无
- 实现内容：运行构建与现有节点测试
- 验收标准：`yarn build` 通过

## 七、关键参考代码
| 功能 | 文件 | 说明 |
|------|------|------|
| 页面外壳 | `src/layouts/PageHeaderLayout.js` | 标准页面包装器 |
| 页头 SVG | `src/utils/pageHeaderSvg.js` | 资源中心可复用页头图标 |
| 主题变量 | `config/theme.js` | 全局颜色、字号、行高来源 |
