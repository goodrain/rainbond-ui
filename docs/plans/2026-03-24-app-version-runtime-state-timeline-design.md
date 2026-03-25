# 应用版本当前状态时间线设计文档

## 一、项目背景
### 1.1 项目架构

应用版本中心由 `rainbond-ui` 的 `AppVersion` 页面负责展示，由 `rainbond-console` 的应用快照接口负责提供当前概览、快照列表、快照详情和快照回滚能力。

当前数据链路如下：

```text
rainbond-ui AppVersion 页面
    ↓ GET /console/teams/{team}/groups/{group_id}/app-versions/overview
rainbond-console app_version_service.get_overview()
    ↓ 读取隐藏模板快照版本 + 计算运行态与快照差异
rainbond-ui 组装时间线节点
```

### 1.2 现有基础

当前实现已经具备：

- 快照列表、快照详情、快照回滚接口
- 运行态与快照模板的差异摘要计算：`_summarize_diff`
- 字段级差异明细计算：`_build_component_diff_details`
- 时间线卡片、详情抽屉、发布/导出/回滚/删除操作

当前存在两个问题：

1. `overview.current_version` 直接取最新创建的快照版本，而不是“当前运行态所基于的快照基线”，见 `rainbond-console/console/services/app_version_service.py:409-488`
2. 个人时间线把快照列表的第一个节点硬编码成“当前版本”，无法表达“已回滚到历史快照”或“当前运行态已修改但未形成快照”的状态，见 `rainbond-ui/src/pages/AppVersion/index.js:1173-1185`

### 1.3 核心需求

- 当用户把应用回滚到历史快照 `0.0.2` 后，时间线里的“当前版本”必须提升到 `0.0.2`，而不是继续停留在最新创建快照 `0.0.3`
- 当当前运行态相较当前快照基线存在未快照修改时，时间线最上方需要新增一个临时节点
  - 标签：`当前状态`
  - 标题：`已修改`
  - 不显示版本号
  - 只保留 `查看详情`、`创建快照`
- 发布、导出、回滚等版本型操作仍然绑定在下面的“当前版本”快照基线节点上
- 当前快照基线节点即使不是最新创建快照，也不能被删除

## 二、用户旅程（MUST — 禁止跳过）
### 2.1 用户操作流程

1. 用户进入应用版本中心，默认看到当前应用的个人快照时间线
2. 当运行态与当前快照基线一致时，顶部节点直接展示 `当前版本 {基线版本号}`
3. 用户把应用从 `0.0.3` 回滚到历史快照 `0.0.2`
4. 回滚成功后，时间线中的 `0.0.2` 从历史节点提升为 `当前版本`
5. 用户继续修改当前应用但尚未创建新快照时，时间线最上方插入 `当前状态 / 已修改` 临时节点
6. 用户点击 `查看详情` 可以看到当前运行态相较当前快照基线的差异
7. 用户点击 `创建快照` 将当前修改固化为一个新快照，新快照随后会取代当前基线成为新的 `当前版本`

### 2.2 页面原型

本次涉及的页面与交互：

- `AppVersion` 页面个人版本概览卡片
  - 当前标题从“最新快照版本”改为“当前快照基线版本”
  - 当存在未快照修改时，描述区明确提示“当前状态已修改”
- `AppVersion` 页面版本时间线
  - 新增临时节点：`当前状态 / 已修改`
  - 当前基线节点与历史快照节点分离
  - 当前基线节点禁止删除
- 版本详情抽屉
  - 继续支持历史快照与上一快照的差异详情
  - 新增对“当前状态”节点的详情展示：运行态相较当前基线的差异详情

### 2.3 外部系统交互

- 无新增第三方系统交互
- 无新增 region Go API
- 继续复用现有 console 快照接口和前端调用链

## 三、整体架构设计
### 3.1 系统架构图

```text
当前应用运行态
    ├─ 运行态模板（按当前集群资源实时生成）
    ├─ 快照历史（隐藏模板版本列表）
    └─ 快照回滚记录（AppUpgradeRecord, record_type=rollback）
                  ↓
rainbond-console get_overview()
    ├─ 选择“当前快照基线”
    ├─ 计算运行态 vs 当前基线的差异
    └─ 返回 baseline + latest snapshot + diff detail
                  ↓
rainbond-ui AppVersion
    ├─ 组装临时运行态节点
    ├─ 标记当前基线快照节点
    └─ 渲染历史快照节点与动作按钮
```

### 3.2 核心流程

#### 3.2.1 当前快照基线选择规则

推荐规则：

1. 默认以最新创建的快照版本作为当前基线
2. 若存在“最近一次成功完成的快照回滚记录”，且其完成时间晚于最新快照创建时间，则以该回滚目标快照作为当前基线
3. 若后续又创建了新快照，则新快照重新成为当前基线

这样可以正确表达：

- 新建快照后，当前基线前进
- 回滚到历史快照后，当前基线后退
- 回滚后继续修改但未快照时，基线不变，运行态处于“已修改”

#### 3.2.2 运行态差异计算规则

- `has_changes`
- `change_summary`
- `component_diff_details`

以上三个字段统一改为“当前运行态相较当前快照基线”的差异，而不是“当前运行态相较最新创建快照”的差异。

#### 3.2.3 时间线节点拼装规则

个人时间线节点按如下顺序生成：

1. 如果 `overview.has_changes = true`，先插入一个临时运行态节点
2. 再插入当前快照基线节点
3. 其余快照按创建时间倒序作为历史节点展示

节点动作规则：

- 临时运行态节点：`查看详情`、`创建快照`
- 当前快照基线节点：`查看详情`、`发布`、`导出`、`回滚`
- 历史快照节点：`查看详情`、`发布`、`导出`、`回滚`、`删除`

#### 3.2.4 当前基线节点保护规则

当前快照基线节点即使不是最新创建快照，也必须满足：

- 不能删除
- 仅在 `overview.has_changes = true` 时允许对自己执行“回滚到当前基线”来恢复运行态

### 3.3 方案选型

#### 方案 A：继续把最新创建快照当作当前版本

- 优点：后端改动最少
- 缺点：回滚到历史版本后时间线错误，无法表达“当前基线已回退”

#### 方案 B：运行态临时节点 + 当前基线节点（推荐）

- 优点：能同时表达“当前运行态”和“当前快照基线”
- 优点：回滚后基线回退、修改后临时漂移的状态都能正确展示
- 优点：不需要新增数据库表，只需重算当前基线与运行态差异

#### 方案 C：把回滚记录直接混入快照时间线

- 优点：操作记录完整
- 缺点：时间线会混杂“快照对象”和“操作对象”，用户很难分清哪个节点可发布、哪个节点只是一次回滚任务

最终选择方案 B。

## 四、数据模型设计
### 4.1 新增数据库表

无新增数据库表。

### 4.2 数据关系

继续复用以下现有模型关系：

- `RainbondCenterAppVersion`
  - 保存应用快照历史
- `AppUpgradeRecord`
  - 保存快照回滚任务记录
- `AppUpgradeSnapshot`
  - 保存可恢复的组件快照内容

本次新增的是 `overview` 响应视图模型字段，不改动物理表结构：

- `current_version`
  - 语义改为“当前快照基线版本”
- `current_version_id`
  - 当前快照基线对应的 `RainbondCenterAppVersion.ID`
- `latest_snapshot_version`
  - 最新创建快照版本
- `latest_snapshot_version_id`
  - 最新创建快照 ID
- `component_diff_details`
  - 当前运行态相较当前快照基线的字段级差异详情

## 五、API设计
### 5.1 接口列表

本次不新增接口，调整现有接口语义与返回字段：

- `GET /console/teams/{team_name}/groups/{group_id}/app-versions/overview`
  - 补充当前快照基线信息和运行态差异详情
- `POST /console/teams/{team_name}/groups/{group_id}/app-versions/{version_id}/rollback`
  - 接口路径不变
  - 回滚成功后，后续 `overview` 必须把对应历史快照识别为当前快照基线

### 5.2 请求/响应结构

`GET overview` 推荐返回结构：

```json
{
  "has_template": true,
  "template_id": "hidden-template-id",
  "current_version": "0.0.2",
  "current_version_id": 21,
  "latest_snapshot_version": "0.0.3",
  "latest_snapshot_version_id": 22,
  "snapshot_count": 3,
  "has_changes": true,
  "change_summary": {
    "has_changes": true,
    "added_count": 1,
    "removed_count": 0,
    "updated_count": 2
  },
  "component_diff_details": {
    "added_components": [],
    "removed_components": [],
    "updated_components": []
  }
}
```

字段语义约束：

- `current_version*` 永远代表当前快照基线
- `latest_snapshot_version*` 永远代表最新创建快照
- `change_summary` / `component_diff_details` 永远代表“当前运行态 vs 当前快照基线”

## 六、核心实现设计
### 6.1 关键逻辑

#### 6.1.1 console：重算当前快照基线

在 `app_version_service.get_overview()` 中新增基线选择逻辑：

1. 查询当前应用所有快照版本
2. 查询当前应用最近一次成功完成的快照回滚记录
3. 比较“最新快照创建时间”和“最近成功回滚时间”
4. 选出当前基线快照版本
5. 用当前基线快照模板而不是最新快照模板参与差异计算

#### 6.1.2 console：为运行态节点补足详情数据

`overview` 除现有 `change_summary` 外，再返回 `component_diff_details`，前端可直接复用现有详情抽屉中的组件差异渲染逻辑。

#### 6.1.3 ui：按基线而不是按列表第一项标记“当前版本”

`getPersonalTimeline()` 不再依赖 `index === 0` 判断当前节点，而是：

- 根据 `overview.current_version_id` 标记当前基线快照
- 根据 `overview.has_changes` 决定是否插入“当前状态 / 已修改”节点

#### 6.1.4 ui：节点动作差异化

- 临时运行态节点不显示版本号，不显示发布/导出/回滚/删除
- 当前快照基线节点即使不是列表第一项，也不允许删除
- 当前快照基线节点在 `overview.has_changes = true` 时允许“回滚到当前基线”恢复运行态

#### 6.1.5 ui：详情抽屉双模式

- 快照节点详情：继续沿用“当前快照 vs 上一个快照”的差异说明
- 运行态节点详情：新增“当前运行态 vs 当前快照基线”的差异说明

### 6.2 复用现有代码

- `rainbond-console/console/services/app_version_service.py`
  - `_summarize_diff`
  - `_build_component_diff_details`
- `rainbond-ui/src/pages/AppVersion/index.js`
  - 现有时间线卡片样式、动作按钮
  - 现有版本详情抽屉中的差异明细渲染函数

## 七、实施计划
### 跨层覆盖检查（MUST）

- [ ] Go (rainbond): 不涉及 — 不新增 region API，不改动 region 数据模型
- [ ] Python (console): 需要 — 重算当前快照基线、扩展 overview 响应、补测试
- [ ] React (rainbond-ui): 需要 — 按当前基线重绘时间线、插入临时运行态节点、调整详情和动作按钮
- [ ] Plugin: 不涉及 — 本功能不在插件宿主或插件模板中实现

### Sprint 1: 当前快照基线语义修正

#### Task 1.1: 调整 overview 当前版本语义
- 仓库：rainbond-console
- 文件：`console/services/app_version_service.py:409-488`
- 实现内容：
  - 识别当前快照基线而非最新创建快照
  - 返回 `current_version_id`、`latest_snapshot_version`、`latest_snapshot_version_id`
  - 将差异计算改为基于当前快照基线
- 验收标准：
  - 回滚到历史版本后，overview 返回的 `current_version` 变为回滚目标快照版本

#### Task 1.2: 为运行态节点补充字段级差异详情
- 仓库：rainbond-console
- 文件：`console/services/app_version_service.py:476-488`
- 实现内容：
  - 在 overview 响应中加入 `component_diff_details`
  - 保持结构与快照详情接口返回格式兼容
- 验收标准：
  - 前端无需重新发明差异结构即可渲染“已修改”节点详情

#### Task 1.3: 为基线语义和回滚场景补测试
- 仓库：rainbond-console
- 文件：`console/tests/app_version_test.py:32-220`
- 实现内容：
  - 新增“最新成功回滚记录覆盖最新快照”的测试
  - 新增“最新快照晚于回滚时仍以最新快照为基线”的测试
  - 新增“overview 返回 component_diff_details”的测试
- 验收标准：
  - 新老场景均有回归测试覆盖

### Sprint 2: 个人时间线改为“运行态 + 基线 + 历史”

#### Task 2.1: 重写个人时间线节点组装逻辑
- 仓库：rainbond-ui
- 文件：`src/pages/AppVersion/index.js:1173-1185`
- 实现内容：
  - 不再用 `index === 0` 标记当前版本
  - 用 `overview.current_version_id` 标记当前基线节点
  - 在 `overview.has_changes = true` 时插入“当前状态 / 已修改”临时节点
- 验收标准：
  - 回滚到历史快照后，对应历史快照提升为当前版本节点

#### Task 2.2: 调整时间线动作和删除保护
- 仓库：rainbond-ui
- 文件：`src/pages/AppVersion/index.js:1411-1438`
- 实现内容：
  - 当前基线节点不允许删除
  - 当前基线节点仅在存在未快照修改时允许“回滚到当前基线”
  - 临时运行态节点仅显示 `查看详情`、`创建快照`
- 验收标准：
  - 当前基线即使不是最新创建快照，也不会出现删除按钮

#### Task 2.3: 调整时间线展示文案和样式层次
- 仓库：rainbond-ui
- 文件：`src/pages/AppVersion/index.js:1762-1890`
- 文件：`src/pages/AppVersion/index.less:499-590`
- 实现内容：
  - 为临时运行态节点增加单独的标签、标题和样式
  - 为当前基线节点与历史快照节点保留清晰视觉区分
- 验收标准：
  - “当前状态 / 已修改”和“当前版本 0.0.2”可以在同一时间线里被直观看懂

#### Task 2.4: 详情抽屉支持运行态差异说明
- 仓库：rainbond-ui
- 文件：`src/pages/AppVersion/index.js:1000-1170`
- 实现内容：
  - 为临时运行态节点增加“当前运行态 vs 当前基线”的说明模式
  - 继续复用现有差异摘要和字段级差异渲染函数
- 验收标准：
  - 点击“已修改”节点可以查看当前运行态与基线快照之间的详细差异

## 八、关键参考代码

| 功能 | 文件 | 说明 |
|------|------|------|
| 当前 overview 语义 | `rainbond-console/console/services/app_version_service.py:409-488` | 当前把最新创建快照直接当作 current_version |
| 快照回滚入口 | `rainbond-console/console/services/app_version_service.py:640-687` | 回滚后需要让 overview 识别新的当前基线 |
| 个人模板概览 | `rainbond-ui/src/pages/AppVersion/index.js:580-589` | 当前概览直接展示 overview.current_version |
| 个人时间线组装 | `rainbond-ui/src/pages/AppVersion/index.js:1173-1185` | 当前使用 index===0 判定当前版本 |
| 回滚/删除规则 | `rainbond-ui/src/pages/AppVersion/index.js:1411-1438` | 当前逻辑只按 isLatest 区分 |
| 时间线卡片渲染 | `rainbond-ui/src/pages/AppVersion/index.js:1762-1890` | 需要插入临时运行态节点和新的按钮策略 |
| 时间线样式 | `rainbond-ui/src/pages/AppVersion/index.less:499-590` | 现有仅区分 upgrade/current/history 三种样式 |
| 差异计算测试 | `rainbond-console/console/tests/app_version_test.py:32-220` | 可复用现有 diff 测试结构扩展基线语义测试 |
