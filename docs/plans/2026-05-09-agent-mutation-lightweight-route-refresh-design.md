# Rainbond UI Agent 轻量跳转与刷新设计文档

## 一、项目背景

### 1.1 项目架构

当前 Agent 在 `rainbond-ui` 中已经具备一套前端本地的 MCP 路由策略能力，核心由以下几部分组成：

- `src/utils/agentMutationRouteMap.js`
- `src/models/agent.js`
- `src/components/AgentHost/RootShell.js`
- 组件详情页的 `refresh` / `subTab` URL 同步机制

该机制已经覆盖组件环境变量、端口、依赖、存储、探针、弹性伸缩、应用/组件创建删除等高频操作，并通过审批事件与 trace 事件驱动页面跳转和刷新。

### 1.2 现有基础

当前 `rainbond-ui` 已实现的能力偏“组件页中心”：

- 在审批前跳到目标组件页或应用页
- 在执行成功后根据 `refresh` query 或 remount 机制刷新组件相关 tab
- 对 `advancedSettings` 内部 `subTab` 已支持 URL 化

但对于以下三类 Rainbond MCP 操作，现有设计仍未形成与业务页面一致的轻量策略：

- 版本中心与发布链路
- 应用网关链路
- 应用升级链路

同时，已有初版计划更偏“前后双向纠正路由”，例如从版本中心跳发布步骤、从升级页跳记录详情页。这种策略虽然完整，但会增加前端 route policy 复杂度，也不符合当前业务对“少跳转、少打断”的要求。

### 1.3 核心需求

本次设计目标不是继续扩展复杂路由编排，而是收敛成更轻量的策略：

1. `build_component` 不纳入本轮范围，不做任何 Agent 跳转策略
2. 版本中心与发布链路：
   - 不做前后页面来回跳转
   - 只刷新当前页面
3. 网关链路：
   - 审批前跳到应用网关页
   - 执行成功后刷新当前网关页
4. 升级链路：
   - 审批前跳到应用升级页
   - 执行成功后刷新当前升级页

本次设计重点是让 Agent 与 `rainbond-console` 的 MCP 输出、`rainbond-ui` 的既有业务页面、以及当前前端路由策略层保持一致，并尽量减少新状态、新协议和新跳转分支。

## 二、整体架构设计

### 2.1 系统架构图

```text
Rainbond Copilot / MCP tool call
    ↓
rainbond-console MCPQueryService
    ↓
Agent SSE approval / trace event
    ↓
rainbond-ui agent model
    ↓
local route policy (frontend only)
    ↓
router jump + refresh query bump
    ↓
业务页面自行重拉数据
```

### 2.2 核心流程

统一采用以下流程：

1. Agent 收到 `approval_requested`
2. 前端识别当前 MCP 是否属于轻量跳转范围
3. 若属于：
   - 版本中心/发布：不切路由，仅记录“待刷新”
   - 网关：如当前不在应用网关页，则跳转到 `/apps/:appID/gateway`
   - 升级：如当前不在应用升级页，则跳转到 `/apps/:appID/upgrade`
4. Agent 执行 MCP，前端从 `trace` 中提取 tool output
5. MCP 成功完成后：
   - 不做复杂 post-success 目的地推导
   - 只在当前目标页 bump `refresh=<timestamp>`
6. 页面检测 `refresh` 变化后自行重拉数据

本次不做：

- `build_component` 特殊跳转
- 发布步骤页之间的自动切换
- 升级记录详情页的自动落点
- 回滚 drawer / 发布 drawer 的 URL 化
- 全局事件总线

## 三、数据模型设计

### 3.1 新增数据库表

无。

本次设计完全基于前端既有 Agent 状态与 console 既有接口，不引入数据库或后端表结构改动。

### 3.2 数据关系

本次使用的数据关系主要来自 `rainbond-console` MCP 返回值与 UI 既有页面数据源的一致性：

- 版本中心页面与 MCP 共用：
  - `app-versions`
  - `app-version-rollback-records`
  - `share/record`
  - `share/:share_id/info`
  - `share/:share_id/events`
- 网关页面与 MCP 共用：
  - `gateway-http-route`
  - `batch-gateway-http-route`
  - `api-gateway` / `proxy-pass/gateway` 代理能力
- 升级页面与 MCP 共用：
  - `last-upgrade-record`
  - `upgrade-records`
  - `upgrade-records/:id/upgrade`
  - `upgrade-records/:id/deploy`
  - `upgrade-records/:id/rollback`

因此本次设计只需要在前端建立“tool -> route -> refresh behavior”映射，不需要新增持久化关系。

## 四、API设计

### 4.1 接口列表

#### 版本中心与发布链路

MCP 对应 console 实现：

- `rainbond_create_app_version_snapshot`
- `rainbond_delete_app_version_snapshot`
- `rainbond_rollback_app_version_snapshot`
- `rainbond_delete_app_version_rollback_record`
- `rainbond_create_app_share_record`
- `rainbond_delete_app_share_record`
- `rainbond_submit_app_share_info`
- `rainbond_start_app_share_event`
- `rainbond_complete_app_share`
- `rainbond_giveup_app_share`

相关 console 路由：

- `/console/teams/:team/groups/:group_id/app-versions/overview`
- `/console/teams/:team/groups/:group_id/app-versions`
- `/console/teams/:team/groups/:group_id/app-versions/:version_id`
- `/console/teams/:team/groups/:group_id/app-versions/:version_id/rollback`
- `/console/teams/:team/groups/:group_id/app-version-rollback-records`
- `/console/teams/:team/groups/:group_id/app-version-rollback-records/:record_id`
- `/console/teams/:team/groups/:group_id/share/record`
- `/console/teams/:team/share/:share_id/info`
- `/console/teams/:team/share/:share_id/events`
- `/console/teams/:team/share/:share_id/giveup`

对应 UI 页面：

- `/team/:teamName/region/:regionName/apps/:appID/version`
- `/team/:teamName/region/:regionName/apps/:appID/share/:shareId/one`
- `/team/:teamName/region/:regionName/apps/:appID/share/:shareId/two`

设计策略：

- 不新增 Agent 级“前后目的地推导”
- 只刷新当前所在版本中心/发布页面

#### 网关链路

MCP 对应 console 实现：

- `rainbond_create_gateway_rules`

相关 console 路由：

- `/console/teams/:tenantName/gateway-http-route`
- `/console/teams/:tenantName/batch-gateway-http-route`
- `/console/api-gateway/v1/:tenantName/...`
- `/console/v2/proxy-pass/gateway/:tenantName/...`

对应 UI 页面：

- `/team/:teamName/region/:regionName/apps/:appID/gateway`

设计策略：

- 审批前若不在应用网关页，则跳到应用网关页
- 成功后刷新当前网关页
- 不细分 route/service/certificate 的自动 tab 定位

#### 升级链路

MCP 对应 console 实现：

- `rainbond_create_app_upgrade_record`
- `rainbond_execute_app_upgrade_record`
- `rainbond_deploy_app_upgrade_record`
- `rainbond_rollback_app_upgrade_record`
- `rainbond_upgrade_app`

相关 console 路由：

- `/console/teams/:tenantName/groups/:app_id/last-upgrade-record`
- `/console/teams/:tenantName/groups/:app_id/upgrade-records`
- `/console/teams/:tenantName/groups/:record_group/upgrade-records/:record_id`
- `/console/teams/:tenantName/groups/:app_id/upgrade-records/:record_id/upgrade`
- `/console/teams/:tenantName/groups/:app_id/upgrade-records/:record_id/deploy`
- `/console/teams/:tenantName/groups/:group_id/upgrade-records/:record_id/rollback`

对应 UI 页面：

- `/team/:teamName/region/:regionName/apps/:appID/upgrade`
- 现有升级记录详情页存在，但本次不作为 Agent 自动跳转目的地

设计策略：

- 审批前若不在升级页，则跳到应用升级页
- 成功后刷新当前升级页
- 不进入升级记录详情页

### 4.2 请求/响应结构

本次前端路由策略只依赖下列最小字段：

- 通用上下文：
  - `team_name`
  - `region_name`
  - `app_id`
- 发布链路补充：
  - `share_id`
- 版本中心补充：
  - `version_id`
  - `record_id`
- 升级补充：
  - `record_id`
  - `upgrade_group_id`

但本次策略不要求前端从返回结果中推导精确目标子页面，只需要：

- 识别当前工具属于哪一类
- 找到目标基础页
- 在成功后触发 refresh

因此返回结构的要求明显低于此前复杂设计，不需要：

- 创建后新资源主路由推导
- 回滚记录详情主路由推导
- 发布步骤页自动串联推导

## 五、核心实现设计

### 5.1 关键逻辑

#### 1. 路由策略层收敛

在 `agentMutationRouteMap.js` 中新增三类轻量策略：

- `page-refresh-only`
- `jump-then-refresh`
- `ignored`

映射规则如下：

- `ignored`
  - `rainbond_build_component`
- `page-refresh-only`
  - 所有版本中心/发布链路工具
- `jump-then-refresh`
  - `rainbond_create_gateway_rules`
  - 所有升级链路工具

#### 2. 版本中心/发布链路

判断当前路由是否属于以下集合：

- `/apps/:appID/version`
- `/apps/:appID/share/:shareId/one`
- `/apps/:appID/share/:shareId/two`

若属于，则不改 pathname，仅 bump `refresh` query。

若不属于，则不主动跳转。这样可以避免 Agent 在版本中心和发布步骤之间来回切页。

#### 3. 网关链路

审批前：

- 若当前不在 `/apps/:appID/gateway`
- 则跳转到该路由

成功后：

- 若当前已在 `/apps/:appID/gateway`
- 则 bump `refresh`

#### 4. 升级链路

审批前：

- 若当前不在 `/apps/:appID/upgrade`
- 则跳转到该路由

成功后：

- 在当前升级页 bump `refresh`

不再根据返回中的 `record_id`、`upgrade_group_id` 自动进入升级详情页。

#### 5. 页面刷新机制

本次设计要求对应页面支持通过 URL 的 `refresh` query 重新拉数：

- `AppVersion`
- `Group/Gateway`
- `Upgrade`

实现原则：

- 若页面已经在 `componentDidMount` 中拉取数据，则在 `componentDidUpdate` 中比较 `location.search` 或解析后的 `refresh`
- 当 `refresh` 变化时，调用同一套本地 fetch 方法
- 不引入全局事件总线

### 5.2 复用现有代码

优先复用以下既有能力：

- Agent 审批与 trace 事件接入：
  - `src/models/agent.js`
- 当前前端路由跳转执行点：
  - `src/components/AgentHost/RootShell.js`
- query 解析工具：
  - `src/utils/global.js`
- 组件页已有 refresh query 方案：
  - `src/components/SlidePanel/components/components.js`
  - `src/pages/Component/advancedSettings.js`

版本中心、网关、升级页则复用各自现有数据获取方法：

- `AppVersion`
  - `fetchAppVersionOverview`
  - `fetchSnapshotVersions`
  - `fetchPublishRecords`
  - `fetchRollbackRecords`
  - `fetchUpgradeRecords`
- `Group/Gateway`
  - `fetchAppDetail`
  - 页面内部已有网关列表/能力加载逻辑
- `Upgrade`
  - `fetchAppDetail`
  - `getApplication`
  - `getUpgradeRecordsList`
  - `getUpgradeRecordsHelmList`
  - `fetchAppLastUpgradeRecord`

## 六、实施计划

### Sprint 1: 轻量路由策略落地

#### Task 1.1: 收敛 Agent MCP 路由策略

- 文件：`/Users/guox/Desktop/newagent/rainbond-ui/src/utils/agentMutationRouteMap.js`
- 实现内容：
  - 新增版本中心/发布、网关、升级三组 MCP 的轻量策略
  - 明确 `rainbond_build_component` 为忽略项
- 验收标准：
  - route map 中不再为上述三组工具定义复杂 post-success 目的地推导

#### Task 1.2: 扩展 Agent 事件处理为“当前页刷新优先”

- 文件：`/Users/guox/Desktop/newagent/rainbond-ui/src/models/agent.js`
- 实现内容：
  - 对 `page-refresh-only` 工具在成功后只设置 refresh intent
  - 对 `jump-then-refresh` 工具在成功后跳目标基础页并设置 refresh intent
- 验收标准：
  - 版本中心/发布工具不会在成功后切换 pathname
  - 网关/升级工具只落到基础页

#### Task 1.3: 根壳层执行轻量跳转

- 文件：`/Users/guox/Desktop/newagent/rainbond-ui/src/components/AgentHost/RootShell.js`
- 实现内容：
  - 支持“仅刷新当前路由”与“跳基础页后刷新”
  - 统一通过 query `refresh=<timestamp>` 驱动
- 验收标准：
  - 相同页面不会重复 push
  - 当前页可直接刷新

### Sprint 2: 页面级 refresh 支持

#### Task 2.1: 版本中心页支持 query refresh

- 文件：`/Users/guox/Desktop/newagent/rainbond-ui/src/pages/AppVersion/index.js`
- 实现内容：
  - 监听 `location` 或 `refresh` 变化
  - 变化时重拉 overview / snapshots / publish records / rollback records / upgrade records
- 验收标准：
  - 不切页时也能看到 Agent 操作结果

#### Task 2.2: 应用网关页支持 query refresh

- 文件：`/Users/guox/Desktop/newagent/rainbond-ui/src/pages/Group/Gateway.js`
- 实现内容：
  - 监听 `refresh` 变化并重拉当前页所需数据
- 验收标准：
  - 创建网关规则后当前页可见结果刷新

#### Task 2.3: 升级页支持 query refresh

- 文件：`/Users/guox/Desktop/newagent/rainbond-ui/src/pages/Upgrade/index.js`
- 实现内容：
  - 监听 `refresh` 变化并重拉升级列表/应用详情/最新记录
- 验收标准：
  - 创建/执行/部署/回滚升级后，升级页能自动刷新

## 七、关键参考代码

| 功能 | 文件 | 说明 |
|------|------|------|
| 现有 Agent 路由策略 | `/Users/guox/Desktop/newagent/rainbond-ui/src/utils/agentMutationRouteMap.js` | 当前组件页/应用页的跳转与刷新策略 |
| Agent 审批与 trace 处理 | `/Users/guox/Desktop/newagent/rainbond-ui/src/models/agent.js` | 审批前跳转、trace 后刷新意图都在这里汇总 |
| 根壳执行跳转 | `/Users/guox/Desktop/newagent/rainbond-ui/src/components/AgentHost/RootShell.js` | 统一实际执行 router push |
| 组件页 refresh 方案 | `/Users/guox/Desktop/newagent/rainbond-ui/src/components/SlidePanel/components/components.js` | 现成的 refresh query + remount 模式 |
| 版本中心页面 | `/Users/guox/Desktop/newagent/rainbond-ui/src/pages/AppVersion/index.js` | 本次版本中心/发布链路的主要承接页 |
| 网关页面 | `/Users/guox/Desktop/newagent/rainbond-ui/src/pages/Group/Gateway.js` | 网关规则创建后的基础承接页 |
| 升级页面 | `/Users/guox/Desktop/newagent/rainbond-ui/src/pages/Upgrade/index.js` | 应用升级链路的基础承接页 |
| 升级详情页 | `/Users/guox/Desktop/newagent/rainbond-ui/src/pages/Upgrade/UpgradeInfo/index.js` | 现有详情页存在，但本次不作为自动跳转目标 |
| console MCP 分发 | `/Users/guox/Desktop/newagent/rainbond-console/console/services/mcp_query_service.py` | MCP tool 到 console service 的统一入口 |
| console 版本/升级路由 | `/Users/guox/Desktop/newagent/rainbond-console/console/urls/__init__.py` | UI 反查 console 能力时的主要依据 |

## 附录：本次明确不纳入范围

- `rainbond_build_component` 的任何 Agent 跳转逻辑
- 发布步骤页之间的自动切换
- 升级记录详情页的自动跳转
- drawer、tab 的 URL 化增强
- 新的后端接口、console 协议变更、copilot 协议变更

## 附录二：可直接编码的接入清单

本附录把本次范围内的工具直接收敛成前端可实现的策略项，方便后续直接写入 `agentMutationRouteMap.js` 与页面 refresh 判断逻辑。

### A. route policy 分类

建议新增以下三类策略类型：

- `ignored`
  - 前后都不做 Agent 路由处理
- `page-refresh-only`
  - 不改当前 pathname
  - 只在当前页追加或替换 `refresh=<timestamp>`
- `jump-then-refresh`
  - 审批前若不在目标基础页，则跳转到目标基础页
  - 成功后在该基础页追加或替换 `refresh=<timestamp>`

### B. tool -> policy 映射

#### B.1 版本中心与发布链路

这组全部使用 `page-refresh-only`。

| Tool | policy | 目标页约束 | 成功后行为 |
|------|--------|------------|------------|
| `rainbond_create_app_version_snapshot` | `page-refresh-only` | 当前应位于 `/apps/:appID/version` | 刷新当前页 |
| `rainbond_delete_app_version_snapshot` | `page-refresh-only` | 当前应位于 `/apps/:appID/version` | 刷新当前页 |
| `rainbond_rollback_app_version_snapshot` | `page-refresh-only` | 当前应位于 `/apps/:appID/version` | 刷新当前页 |
| `rainbond_delete_app_version_rollback_record` | `page-refresh-only` | 当前应位于 `/apps/:appID/version` | 刷新当前页 |
| `rainbond_create_app_share_record` | `page-refresh-only` | 当前可能位于 `/apps/:appID/version` | 刷新当前页 |
| `rainbond_delete_app_share_record` | `page-refresh-only` | 当前可能位于 `/apps/:appID/version` | 刷新当前页 |
| `rainbond_submit_app_share_info` | `page-refresh-only` | 当前可能位于 `/apps/:appID/share/:shareId/one` | 刷新当前页 |
| `rainbond_start_app_share_event` | `page-refresh-only` | 当前可能位于 `/apps/:appID/share/:shareId/two` | 刷新当前页 |
| `rainbond_complete_app_share` | `page-refresh-only` | 当前可能位于 `/apps/:appID/share/:shareId/two` 或 `/apps/:appID/version` | 刷新当前页 |
| `rainbond_giveup_app_share` | `page-refresh-only` | 当前可能位于 `/apps/:appID/share/:shareId/one` 或 `/two` | 刷新当前页 |

实现说明：

- 不为这组工具做 post-success route 推导
- 即使 `create_app_share_record` 返回了 `share_id`，本次也不自动切换到 share step 页面
- Agent 只负责提醒当前页面重新读取数据

#### B.2 应用网关链路

这组使用 `jump-then-refresh`。

| Tool | policy | pre-action route | 成功后行为 |
|------|--------|------------------|------------|
| `rainbond_create_gateway_rules` | `jump-then-refresh` | `/team/:teamName/region/:regionName/apps/:appID/gateway` | 刷新当前网关页 |

实现说明：

- 只保证落到应用网关基础页
- 不根据 `protocol=http/tcp` 自动切换内部 tab
- 不根据规则类型区分 `route/service/certificate`

#### B.3 应用升级链路

这组使用 `jump-then-refresh`。

| Tool | policy | pre-action route | 成功后行为 |
|------|--------|------------------|------------|
| `rainbond_create_app_upgrade_record` | `jump-then-refresh` | `/team/:teamName/region/:regionName/apps/:appID/upgrade` | 刷新当前升级页 |
| `rainbond_execute_app_upgrade_record` | `jump-then-refresh` | `/team/:teamName/region/:regionName/apps/:appID/upgrade` | 刷新当前升级页 |
| `rainbond_deploy_app_upgrade_record` | `jump-then-refresh` | `/team/:teamName/region/:regionName/apps/:appID/upgrade` | 刷新当前升级页 |
| `rainbond_rollback_app_upgrade_record` | `jump-then-refresh` | `/team/:teamName/region/:regionName/apps/:appID/upgrade` | 刷新当前升级页 |
| `rainbond_upgrade_app` | `jump-then-refresh` | `/team/:teamName/region/:regionName/apps/:appID/upgrade` | 刷新当前升级页 |

实现说明：

- 本次不进入 `/upgrade/:upgradeGroupID/record/:recordID`
- 不根据 record 状态、upgrade_group_id、record_id 做复杂落点推导
- 统一以升级首页作为 Agent 观察面

### C. route resolver 直接规则

建议在前端 route map 中新增以下基础 resolver：

#### C.1 版本中心 route

```text
/team/:teamName/region/:regionName/apps/:appID/version
```

用途：

- 仅做页面识别
- 本次不作为强制 pre-action 跳转目标

#### C.2 发布步骤 route

```text
/team/:teamName/region/:regionName/apps/:appID/share/:shareId/one
/team/:teamName/region/:regionName/apps/:appID/share/:shareId/two
```

用途：

- 仅做页面识别
- 本次不在 Agent 层做步骤跳转

#### C.3 网关基础页 route

```text
/team/:teamName/region/:regionName/apps/:appID/gateway
```

用途：

- `rainbond_create_gateway_rules` 的统一 pre-action route

#### C.4 升级基础页 route

```text
/team/:teamName/region/:regionName/apps/:appID/upgrade
```

用途：

- 所有升级类工具的统一 pre-action route

### D. Agent 状态字段使用建议

本次不建议新增过多状态字段，只复用现有：

- `pendingMutationTool`
- `pendingMutationRoute`
- `pendingMutationNavigationKey`
- `pendingMutationRefreshKey`

处理建议：

#### D.1 page-refresh-only

- 审批前：
  - 不写 `pendingMutationRoute`
  - 可只记录 `pendingMutationTool`
- 成功后：
  - 仅写 `pendingMutationRefreshKey`

#### D.2 jump-then-refresh

- 审批前：
  - 写 `pendingMutationRoute`
  - 写 `pendingMutationNavigationKey`
- 成功后：
  - 清空 route intent
  - 写 `pendingMutationRefreshKey`

### E. 页面 refresh 落地清单

#### E.1 AppVersion

文件：

- `/Users/guox/Desktop/newagent/rainbond-ui/src/pages/AppVersion/index.js`

建议在 `componentDidUpdate` 中新增：

- 解析当前 `location.search` 中的 `refresh`
- 与上一次的 `refresh` 对比
- 若变化则执行：
  - `fetchAppVersionOverview()`
  - `fetchSnapshotVersions()`
  - `fetchPublishRecords()`
  - `fetchRollbackRecords()`
  - `fetchUpgradeRecords()`

#### E.2 Group/Gateway

文件：

- `/Users/guox/Desktop/newagent/rainbond-ui/src/pages/Group/Gateway.js`

建议在 `componentDidUpdate` 中新增：

- 解析 `refresh`
- 若变化则重拉：
  - `fetchAppDetail()`
  - 当前页内部依赖的 gateway 数据

注意：

- 页面当前有多套网关实现分支
- refresh 时只需要触发当前展示分支重新请求

#### E.3 Upgrade

文件：

- `/Users/guox/Desktop/newagent/rainbond-ui/src/pages/Upgrade/index.js`

建议在 `componentDidUpdate` 中新增：

- 解析 `refresh`
- 若变化则重拉：
  - `fetchAppDetail()`
  - `getApplication()` 或 `getUpgradeRecordsHelmList()`
  - `getUpgradeRecordsList()`
  - `fetchAppLastUpgradeRecord()`

### F. 编码顺序建议

1. 更新 `agentMutationRouteMap.js`
2. 调整 `agent.js` 中 trace 成功后的 route / refresh 分支
3. 更新 `RootShell.js` 的“仅 refresh 当前页”能力
4. 为 `AppVersion` 加 refresh 响应
5. 为 `Group/Gateway` 加 refresh 响应
6. 为 `Upgrade` 加 refresh 响应

### G. 验收用例

#### G.1 版本中心

- 在 `/apps/:appID/version` 页面触发：
  - `rainbond_create_app_version_snapshot`
  - `rainbond_delete_app_version_snapshot`
- 预期：
  - 页面不切换
  - 当前页面刷新

#### G.2 发布步骤页

- 在 `/apps/:appID/share/:shareId/one` 页面触发：
  - `rainbond_submit_app_share_info`
- 在 `/apps/:appID/share/:shareId/two` 页面触发：
  - `rainbond_start_app_share_event`
  - `rainbond_complete_app_share`
- 预期：
  - 页面不切换
  - 当前页面刷新

#### G.3 网关

- 从任意非网关应用页触发 `rainbond_create_gateway_rules`
- 预期：
  - 审批前跳到 `/apps/:appID/gateway`
  - 成功后刷新该页

#### G.4 升级

- 从任意非升级应用页触发：
  - `rainbond_create_app_upgrade_record`
  - `rainbond_execute_app_upgrade_record`
  - `rainbond_deploy_app_upgrade_record`
  - `rainbond_rollback_app_upgrade_record`
  - `rainbond_upgrade_app`
- 预期：
  - 审批前跳到 `/apps/:appID/upgrade`
  - 成功后刷新该页
