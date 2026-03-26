# Rainbond 团队设置插件 Tab 集成设计文档

## 一、项目背景
### 1.1 项目架构

本次工作只涉及 `rainbond-ui` 前端仓库内团队设置页与插件中心首页的整合：

- 团队设置页路由：`/team/:teamName/region/:regionName/team`
- 旧插件首页路由：`/team/:teamName/region/:regionName/myplugns`
- 保留的插件详情路由：`/team/:teamName/region/:regionName/myplugns/:pluginId`
- 独立新建路由：`/team/:teamName/region/:regionName/create-plugin`
- 独立应用市场安装路由：`/team/:teamName/region/:regionName/install-plugin`

涉及主文件：

- `config/router.config.js`
- `src/pages/Team/index.js`
- `src/pages/Plugin/index.js`
- `src/pages/Plugin/Create.js`
- `src/pages/Plugin/Install.js`
- `src/pages/Create/market_plugin.js`

### 1.2 现有基础

当前团队设置页 `src/pages/Team/index.js` 已具备以下基础能力：

- 使用 `scope` 驱动页内 tab 切换
- 已接入 `PageHeaderLayout` 的 `tabList`、`tabActiveKey`、`onTabChange`
- 已承载信息、成员、角色等团队管理内容

当前插件体系已具备以下基础能力：

- `src/pages/Plugin/index.js` 同时承担插件首页列表和单插件详情页分流
- 插件首页包含默认插件安装、插件删除、跳转新建、跳转市场安装等能力
- 单插件详情页 `src/pages/Plugin/manage.js` 已有完整版本、配置、构建、使用情况等管理能力
- 新建插件和从应用市场安装插件已经使用独立路由，不依赖插件首页页头结构

### 1.3 核心需求

1. 将“插件首页列表”集成到团队设置页，作为一个新的 tab 展示
2. 废弃旧首页 `/myplugns`，访问旧链接时自动跳转到 `/team/.../team?tab=plugin`
3. 保留 `/myplugns/:pluginId` 详情页独立路由，不并入团队设置页
4. 保留“新建插件”和“从应用市场安装插件”独立路由
5. 统一创建成功、安装成功后的回跳目标为团队设置页的插件 tab
6. 保持现有 DVA model、service、权限体系、交互和数据结构不变

## 二、整体架构设计
### 2.1 系统架构图

```text
Team/index.js
  ├─ 读取 query.tab / scope
  ├─ 构建 Team tabs
  ├─ event -> TeamEventList
  ├─ member -> TeamMemberList
  ├─ role -> EnterprisePluginsPage
  └─ plugin -> PluginListContent

Plugin/index.js
  ├─ pluginId 存在 -> Manage
  └─ pluginId 不存在 -> redirect /team/:teamName/region/:regionName/team?tab=plugin

Plugin/Create.js
  └─ 创建成功 -> /team/:teamName/region/:regionName/team?tab=plugin

Plugin/Install.js
  └─ 复用 Create/market_plugin.js
       └─ 安装成功 -> /team/:teamName/region/:regionName/team?tab=plugin
```

### 2.2 核心流程

新的主流程如下：

1. 用户从团队设置页进入 `plugin` tab 查看插件首页
2. 首页内容由抽离后的可复用组件渲染，不再依赖独立页头
3. 点击“新建插件”仍跳转到独立创建页
4. 点击“从应用市场安装”仍跳转到独立安装页
5. 创建成功或安装成功后，统一回到 `/team/.../team?tab=plugin`
6. 点击某个插件的“管理”按钮时，仍进入 `/myplugns/:pluginId` 独立详情页
7. 历史访问 `/myplugns` 时，自动重定向到团队设置页的插件 tab

## 三、数据模型设计
### 3.1 新增数据库表

无。

### 3.2 数据关系

本次不改后端数据结构，仅调整前端页面组织关系：

- `Team/index.js`：新增基于 query 的 tab 状态承载
- `PluginListContent`：承载原插件首页列表逻辑
- `Plugin/index.js`：只负责首页重定向与详情页分流
- `plugin` model 和 `plugin` service：继续为插件首页和详情页提供数据
- `createApp` model 和 `createApp` service：继续为应用市场安装插件流程提供数据

## 四、API设计
### 4.1 接口列表

本次不新增接口，不修改接口路径与参数：

- `GET /console/teams/{team_name}/plugins/default`
- `POST /console/teams/{team_name}/plugins/default`
- `GET /console/teams/{team_name}/plugins/all`
- `POST /console/teams/{team_name}/plugins`
- `DELETE /console/teams/{team_name}/plugins/{plugin_id}`
- `POST /console/teams/{team_name}/apps/plugins`

### 4.2 请求/响应结构

保持完全不变。

- 插件首页仍使用 `plugin/getDefaultPlugin`、`plugin/getMyPlugins`
- 创建插件仍使用 `plugin/createPlugin`
- 应用市场安装插件仍使用 `createApp/installAppPlugin`
- 单插件详情仍使用现有版本、配置、构建相关接口

## 五、核心实现设计
### 5.1 关键逻辑

- 将 `src/pages/Plugin/index.js` 中首页列表部分抽离为独立内容组件，例如 `PluginListContent`
- `PluginListContent` 只关心插件列表内容、按钮动作和数据获取，不自行包裹 `PageHeaderLayout`
- `Team/index.js` 新增 `plugin` tab，并从 `location.search` 中解析 `tab=plugin`
- 团队设置页中的插件 tab 继续沿用 `team_plugin_manage` 权限控制，避免无权限时显示空 tab
- `src/pages/Plugin/index.js` 在 `pluginId` 为空时不再渲染首页，而是跳转到团队设置页的插件 tab
- 创建成功、应用市场安装成功等原本回跳 `/myplugns` 的路径统一替换为 `/team/.../team?tab=plugin`
- 保持 `/myplugns/:pluginId` 管理详情页完全不变，降低本次改造范围

### 5.2 复用现有代码

- 复用 `src/pages/Plugin/index.js` 现有首页列表逻辑
- 复用 `src/pages/Plugin/manage.js` 单插件详情能力
- 复用 `src/components/CreatePluginForm/index.js`
- 复用 `src/pages/Create/market_plugin.js` 应用市场安装流程
- 复用 `src/layouts/PageHeaderLayout.js` 的 tab 页头能力
- 复用旧入口 `/myplugns` 的路由，通过重定向兼容历史站内跳转和收藏链接

## 六、实施计划
### Sprint 1: 插件首页内容抽离与旧入口兼容
#### Task 1.1: 抽离插件首页内容组件
- 文件：`src/pages/Plugin/index.js:181-647`
- 文件：`src/pages/Plugin/components/PluginListContent.js`
- 实现内容：将插件首页列表、默认插件安装、删除、跳转新建、跳转市场安装的逻辑从页面壳中抽离为可复用内容组件
- 验收标准：插件首页内容可在独立页面和团队设置页内复用，行为不变

#### Task 1.2: 收敛插件路由壳职责
- 文件：`src/pages/Plugin/index.js:651-683`
- 文件：`config/router.config.js:568-603`
- 实现内容：保留 `pluginId` 分流逻辑；无 `pluginId` 时重定向到 `/team/.../team?tab=plugin`；有 `pluginId` 时继续渲染 `Manage`
- 验收标准：访问 `/myplugns` 自动跳转；访问 `/myplugns/:pluginId` 保持原行为

### Sprint 2: 团队设置页接入插件 Tab
#### Task 2.1: Team 页面支持 query tab 驱动
- 文件：`src/pages/Team/index.js:1-414`
- 实现内容：解析 `location.search.tab`，新增 `plugin` tab，按权限控制 tab 可见性，并在 `scope === 'plugin'` 时渲染抽离后的插件首页内容组件
- 验收标准：访问 `/team/.../team?tab=plugin` 时可直接展示插件首页；切换其他 tab 不受影响

#### Task 2.2: 统一创建与安装成功后的回跳目标
- 文件：`src/pages/Plugin/Create.js:16-36`
- 文件：`src/pages/Create/market_plugin.js:495-725`
- 文件：`src/pages/Plugin/Install.js:13-40`
- 实现内容：将创建成功、应用市场安装成功后的返回地址统一改为 `/team/.../team?tab=plugin`
- 验收标准：从团队插件 tab 进入创建页或安装页后，成功完成操作能够回到团队插件 tab

#### Task 2.3: 团队设置 tab 文案与兼容入口对齐
- 文件：`src/locales/zh-CN/team.js`
- 文件：`src/locales/en-US/team.js`
- 实现内容：补充或调整团队设置页插件 tab 文案，确保团队设置页与插件中心术语一致
- 验收标准：中英文下 tab 文案明确，插件入口语义统一

## 七、关键参考代码
| 功能 | 文件 | 说明 |
|------|------|------|
| 团队设置页 | `src/pages/Team/index.js` | 现有 team tabs 容器 |
| 插件首页与详情分流 | `src/pages/Plugin/index.js` | 当前首页列表和详情页路由壳 |
| 单插件详情页 | `src/pages/Plugin/manage.js` | 保留独立详情页 |
| 创建插件页 | `src/pages/Plugin/Create.js` | 成功回跳目标需调整 |
| 应用市场安装插件页 | `src/pages/Plugin/Install.js` | 复用市场安装页面 |
| 市场安装插件逻辑 | `src/pages/Create/market_plugin.js` | 安装成功回跳需调整 |
| 插件服务层 | `src/services/plugin.js` | 首页与详情页接口入口 |
| 创建应用服务层 | `src/services/createApp.js` | 应用市场安装插件接口入口 |
