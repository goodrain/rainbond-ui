# 工作空间应用版本详情差异设计文档

## 一、项目背景
### 1.1 项目架构

本次需求覆盖 Rainbond 两层链路：

- `rainbond-console`：为应用快照详情补充“相较上一个快照”的字段级差异数据
- `rainbond-ui`：在应用版本时间线的 `查看详情` 抽屉中展示组件级变更明细

本次不涉及 `rainbond` Go 仓库，差异计算基于 console 已存储的应用快照模板完成。

### 1.2 现有基础

当前工作空间应用版本页已经具备以下能力：

- 在 `rainbond-ui/src/pages/AppVersion/index.js` 展示应用快照版本时间线
- 在时间线卡片上显示相较上一个快照的组件增删改计数
- 通过 `GET /console/teams/{team}/groups/{group_id}/app-versions/{version_id}` 获取快照模板详情

当前缺口：

- `查看详情` 仅展示基础信息和包含组件，缺少实际变更内容
- 后端只返回组件级增删改摘要，不返回字段级差异
- 用户无法知道组件具体变更了哪些 `env / 端口 / 卷 / 探针`

### 1.3 核心需求

1. 在版本 `查看详情` 中展示“该版本较上一个版本”的变更明细
2. 支持展示组件新增、删除、修改三类变化
3. 对于组件修改，至少展示以下字段的具体变化：
   - 环境变量
   - 端口
   - 存储卷
   - 探针
4. 首个快照没有上一个版本时，明确展示“无可对比版本”

## 二、用户旅程（MUST — 禁止跳过）
### 2.1 用户操作流程

- 用户如何配置/触发该功能？
  - 用户进入 `工作空间 -> 应用 -> 应用版本`
  - 在版本时间线中选择某个快照
  - 点击 `查看详情`
- 用户如何查看状态/结果？
  - 抽屉顶部仍展示版本基础信息
  - 抽屉中新增“版本变更”区域
  - 用户可以直接看到新增组件、删除组件，以及修改组件内的字段级变更
- 管理员/审批人如何操作？
  - 沿用当前工作空间应用权限模型，无新增审批流

### 2.2 页面原型

- 页面一：应用版本时间线
  - 维持现有时间线卡片结构
  - `查看详情` 入口保留
- 页面二：版本详情抽屉
  - 区块一：基础信息
  - 区块二：版本变更摘要
  - 区块三：新增组件
  - 区块四：删除组件
  - 区块五：修改组件明细
    - 每个组件下按 `环境变量 / 端口 / 存储卷 / 探针` 分组展示新增、删除、修改内容

### 2.3 外部系统交互

- 无新增第三方系统交互
- 差异计算仅依赖 console 中保存的快照模板
- 不联动 region，不新增异步任务

## 三、整体架构设计
### 3.1 系统架构图

```text
rainbond-ui AppVersion Drawer
    └─ GET 快照详情
          ↓ HTTP
rainbond-console /console/teams/{team}/groups/{group_id}/app-versions/{version_id}
          ├─ 查询目标快照
          ├─ 查询上一个快照
          ├─ 计算组件级摘要 diff
          └─ 计算字段级 detail diff（env / port / volume / probe）
```

### 3.2 核心流程

#### 3.2.1 查看版本差异

1. 用户点击某个快照的 `查看详情`
2. 前端读取该快照详情对象并渲染抽屉
3. console 在详情接口中定位当前快照的上一个快照
4. console 计算：
   - 组件新增列表
   - 组件删除列表
   - 组件修改列表
   - 每个修改组件的字段级差异
5. 前端按分组渲染变更内容

#### 3.2.2 首个快照

1. 用户查看最早的首个快照
2. console 查不到上一个快照
3. 详情接口返回空差异结构并标记 `has_previous_version=false`
4. 前端展示“该版本是首个快照，无可对比版本”

## 四、数据模型设计
### 4.1 新增数据库表

本次不新增数据库表。

### 4.2 数据关系

涉及现有表：

- `app_version_template_relation`
  - 维护工作空间应用与隐藏模板的绑定关系
- `rainbond_center_app_version`
  - 保存应用快照版本

差异来源：

1. 当前快照的 `app_template`
2. 同一隐藏模板下时间上紧邻的上一个快照 `app_template`

字段级 diff 仅基于快照模板内的组件配置计算，不读取运行时状态。

## 五、API设计
### 5.1 接口列表

#### 5.1.1 继续复用 console API

- `GET /console/teams/{team_name}/groups/{group_id}/app-versions/{version_id}`

#### 5.1.2 返回结构扩展

- 在详情响应中新增：
  - `previous_version`
  - `has_previous_version`
  - `diff_summary`
  - `component_diff_details`

### 5.2 请求/响应结构

#### 5.2.1 详情响应核心结构

```json
{
  "bean": {
    "version_id": 12,
    "version": "1.0.3",
    "previous_version": "1.0.2",
    "has_previous_version": true,
    "diff_summary": {
      "has_changes": true,
      "added_count": 1,
      "removed_count": 0,
      "updated_count": 2,
      "added_components": ["worker"],
      "removed_components": [],
      "updated_components": ["web", "api"]
    },
    "component_diff_details": {
      "added_components": [
        {
          "component_name": "worker"
        }
      ],
      "removed_components": [],
      "updated_components": [
        {
          "component_name": "web",
          "field_changes": [
            {
              "field_key": "service_env_map_list",
              "field_label": "环境变量",
              "added": [],
              "removed": [],
              "updated": [
                {
                  "identity": "DEBUG",
                  "before": {"attr_name": "DEBUG", "attr_value": "false"},
                  "after": {"attr_name": "DEBUG", "attr_value": "true"}
                }
              ]
            }
          ]
        }
      ]
    }
  }
}
```

## 六、核心实现设计
### 6.1 关键逻辑

#### 6.1.1 后端字段级 diff 计算

- 在 `console/services/app_version_service.py` 中新增组件字段差异计算方法
- 先按组件标识构造 `component map`
- 对于修改组件，按以下字段分别计算列表项增删改：
  - `service_env_map_list`
  - `port_map_list`
  - `service_volume_map_list`
  - `probes`
- 每类字段使用稳定主键识别条目，避免仅因顺序变化产生误报：
  - 环境变量：`attr_name`
  - 端口：`container_port + protocol + port_alias`
  - 存储卷：`volume_name + volume_path`
  - 探针：`probe_id` 优先，无 `probe_id` 时回退 `mode + port + path + cmd`

#### 6.1.2 差异比较边界

- 继续忽略运行时无关字段：
  - `ID`
  - `create_time`
  - `update_time`
  - `upgrade_time`
  - `is_change`
- 不计算以下范围的字段级差异：
  - 插件配置
  - 网关规则
  - K8s 属性
  - 应用级资源
- 这些字段仍通过现有组件级摘要反映“组件被修改”，但不在首版详情中展开

#### 6.1.3 前端详情展示

- 保持现有详情抽屉入口不变
- 在基础信息下方新增“版本变更”区域
- 展示顺序：
  1. 对比基线说明
  2. 摘要统计
  3. 新增组件
  4. 删除组件
  5. 修改组件字段明细
- 对于没有上一个快照或没有任何变更的场景展示明确空态文案

### 6.2 复用现有代码

- 复用当前快照列表摘要 diff：
  - `rainbond-console/console/services/app_version_service.py`
- 复用前端时间线详情抽屉：
  - `rainbond-ui/src/pages/AppVersion/index.js`
- 复用已有快照详情请求：
  - `rainbond-ui/src/services/api.js`

## 七、实施计划
### 跨层覆盖检查（MUST）

- [ ] Go (rainbond): 不涉及 — 差异数据完全基于 console 已存快照模板计算
- [ ] Python (console): 需要 — 扩展快照详情接口返回字段级 diff，并补测试
- [ ] React (rainbond-ui): 需要 — 在详情抽屉展示字段级差异
- [ ] Plugin: 不涉及 — 与插件前后端无关

### Sprint 1: 快照字段级差异详情

#### Task 1.1: console 生成字段级差异数据
- 仓库：`rainbond-console`
- 文件：
  - `console/services/app_version_service.py`
  - `console/tests/app_version_test.py`
- 实现内容：
  - 为快照详情补充上一版本定位
  - 计算组件增删改摘要
  - 计算 env、端口、卷、探针的字段级差异
- 验收标准：
  - 详情接口返回 `previous_version`
  - 修改组件能返回字段级新增、删除、修改项
  - 首个快照返回空差异结构

#### Task 1.2: UI 展示版本字段级差异
- 仓库：`rainbond-ui`
- 文件：
  - `src/pages/AppVersion/index.js`
  - `src/pages/AppVersion/index.less`
- 实现内容：
  - 在详情抽屉渲染摘要和字段级变更
  - 为新增/删除/修改项提供清晰分组与文案
- 验收标准：
  - 详情抽屉可看到相较上一个快照的变更
  - 修改组件可展开查看 env、端口、卷、探针差异
  - 无对比版本或无变化时有清晰提示

## 八、关键参考代码
| 功能 | 文件 | 说明 |
|------|------|------|
| 应用版本详情页 | `rainbond-ui/src/pages/AppVersion/index.js` | 当前工作空间应用版本时间线与详情抽屉 |
| 快照服务 | `rainbond-console/console/services/app_version_service.py` | 快照列表、详情、摘要 diff 核心逻辑 |
| 快照接口入口 | `rainbond-console/console/views/app_version.py` | 快照详情接口 |
| 组件快照结构来源 | `rainbond-console/console/services/share_services.py` | 快照模板中组件字段结构 |
