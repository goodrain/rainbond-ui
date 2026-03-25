# 工作空间应用版本删除设计文档

## 一、项目背景
### 1.1 项目架构

本次需求覆盖 Rainbond 两层链路：

- `rainbond-console`：提供工作空间应用快照版本删除接口与删除规则校验
- `rainbond-ui`：在工作空间应用版本时间线中提供历史版本删除入口

本次不涉及 `rainbond` Go 仓库，快照版本数据存储和删除逻辑均位于 `rainbond-console`。

### 1.2 现有基础

当前工作空间应用版本页已经具备以下能力：

- 在 `rainbond-ui/src/pages/AppVersion/index.js` 展示应用快照版本时间线
- 通过 `GET /console/teams/{team}/groups/{group_id}/app-versions` 获取快照列表
- 通过 `GET /console/teams/{team}/groups/{group_id}/app-versions/{version_id}` 获取快照详情
- 通过 `POST /console/teams/{team}/groups/{group_id}/app-versions/{version_id}/rollback` 执行快照回滚

当前缺口：

- 历史快照版本没有删除入口
- 后端没有快照删除接口
- 当前版本不能删除的业务规则尚未固化在后端

### 1.3 核心需求

1. 工作空间应用视图中的应用版本支持删除
2. 仅允许删除历史版本
3. 当前版本不可删除
4. 不对“被未完成发布流程引用”的历史版本做额外保护，删除后后续报错可接受

## 二、用户旅程（MUST — 禁止跳过）
### 2.1 用户操作流程

- 用户如何配置/触发该功能？
  - 用户进入 `工作空间 -> 应用 -> 应用版本`
  - 在版本时间线中找到某个历史快照
  - 点击 `删除`
- 用户如何查看状态/结果？
  - 删除前看到确认弹窗，明确提示删除后不可恢复
  - 删除成功后时间线立即刷新，目标历史版本从列表中消失
  - 若删除失败，页面显示错误提示
- 管理员/审批人如何操作？
  - 沿用当前工作空间应用权限模型，无新增审批流程

### 2.2 页面原型

- 页面一：应用版本页
  - 当前版本卡片：维持现有 `查看详情 / 发布 / 回滚`
  - 历史版本卡片：新增 `删除`
- 页面二：删除确认弹窗
  - 标题：`删除历史版本`
  - 内容：`删除后该历史版本将无法再查看、发布或回滚，且不可恢复。`
  - 操作：`取消` / `确认删除`

### 2.3 外部系统交互

- 无新增第三方系统交互
- 删除逻辑仅操作 console 数据库中的隐藏模板版本记录
- 不联动删除发布流程记录，不主动修复未完成发布流程的引用关系

## 三、整体架构设计
### 3.1 系统架构图

```text
rainbond-ui AppVersion
    └─ DELETE 历史快照
          ↓ HTTP
rainbond-console /console/teams/{team}/groups/{group_id}/app-versions/{version_id}
          ├─ 校验快照属于当前应用
          ├─ 校验不是当前最新快照
          └─ 删除 RainbondCenterAppVersion 记录
```

### 3.2 核心流程

#### 3.2.1 删除历史版本

1. 用户在应用版本时间线中点击某个历史版本的 `删除`
2. 前端弹出确认框
3. 用户确认后调用删除接口
4. console 校验当前 `version_id` 是否存在且属于当前应用的隐藏模板
5. console 查找该应用最新快照
6. 若待删版本是最新快照，则返回 400
7. 若待删版本是历史快照，则删除记录并返回成功
8. 前端收到成功响应后刷新概览与时间线

#### 3.2.2 删除失败

1. 当前版本触发删除请求
2. console 返回 400，提示当前版本不允许删除
3. 前端保留当前页面状态并显示错误提示

## 四、数据模型设计
### 4.1 新增数据库表

本次不新增数据库表。

### 4.2 数据关系

涉及现有表：

- `app_version_template_relation`
  - 维护工作空间应用与隐藏模板的绑定关系
- `rainbond_center_app_version`
  - 保存应用快照版本

删除规则基于以下关系：

1. 通过 `group_id` 找到隐藏模板 `app_model_id`
2. 在 `rainbond_center_app_version` 中查询该隐藏模板下的所有快照版本
3. 以当前列表排序规则认定最新快照
4. 只允许删除非最新快照

## 五、API设计
### 5.1 接口列表

#### 5.1.1 新增 console API

- `DELETE /console/teams/{team_name}/groups/{group_id}/app-versions/{version_id}`

#### 5.1.2 继续复用

- `GET /console/teams/{team_name}/groups/{group_id}/app-versions/overview`
- `GET /console/teams/{team_name}/groups/{group_id}/app-versions`
- `GET /console/teams/{team_name}/groups/{group_id}/app-versions/{version_id}`

### 5.2 请求/响应结构

#### 5.2.1 删除成功响应

```json
{
  "code": 200,
  "msg": "success",
  "msg_show": "删除成功"
}
```

#### 5.2.2 删除失败响应

```json
{
  "code": 400,
  "msg": "current snapshot can not delete",
  "msg_show": "当前版本不允许删除"
}
```

## 六、核心实现设计
### 6.1 关键逻辑

#### 6.1.1 后端删除校验

- 在 `console/services/app_version_service.py` 新增删除方法
- 只允许删除 `source=app_version` 的隐藏模板快照
- 若 `version_id` 不存在，返回 404
- 若待删版本是当前最新快照，返回 400
- 其余历史快照直接删除

#### 6.1.2 前端删除入口

- 仅在历史版本节点显示 `删除`
- 当前版本节点不显示删除按钮
- 删除成功后重新请求：
  - 版本概览
  - 快照时间线

#### 6.1.3 交互约束

- 不增加批量删除
- 不增加“已发布/被引用”检查
- 不增加软删除或回收站

### 6.2 复用现有代码

- 复用 `AppVersion` 页现有的快照时间线结构：
  - `rainbond-ui/src/pages/AppVersion/index.js:331`
  - `rainbond-ui/src/pages/AppVersion/index.js:936`
- 复用 console 应用版本服务：
  - `rainbond-console/console/services/app_version_service.py:236`
  - `rainbond-console/console/views/app_version.py:17`
- 复用 Ant Design `Modal.confirm` 和现有 `notification` 提示模式

## 七、实施计划
### 跨层覆盖检查（MUST）

- [ ] Go (rainbond): 不涉及 — 本次快照版本删除完全在 console 数据模型内完成
- [ ] Python (console): 需要 — 新增快照删除 view 和 service 删除逻辑
- [ ] React (rainbond-ui): 需要 — 新增历史版本删除按钮、确认弹窗、删除后刷新
- [ ] Plugin: 不涉及 — 与插件前后端无关

### Sprint 1: 快照删除能力

#### Task 1.1: console 增加快照删除接口
- 仓库：`rainbond-console`
- 文件：
  - `console/views/app_version.py:17`
  - `console/services/app_version_service.py:236`
  - `console/urls/__init__.py:1166`
- 实现内容：
  - 在快照详情路由上补 `DELETE`
  - 新增删除历史快照的 service 方法
  - 校验当前版本不可删除
- 验收标准：
  - 删除历史快照返回 200
  - 删除当前快照返回 400
  - 删除后列表接口不再返回被删除版本

#### Task 1.2: UI 增加历史版本删除交互
- 仓库：`rainbond-ui`
- 文件：
  - `src/services/api.js:523`
  - `src/pages/AppVersion/index.js:331`
  - `src/pages/AppVersion/index.js:936`
- 实现内容：
  - 新增删除快照 service
  - 在历史版本操作区显示删除按钮
  - 增加确认弹窗和删除后的数据刷新
- 验收标准：
  - 当前版本不显示删除按钮
  - 历史版本点击删除后弹确认框
  - 删除成功后列表刷新且提示成功

## 八、关键参考代码
| 功能 | 文件 | 说明 |
|------|------|------|
| 应用版本时间线页 | `rainbond-ui/src/pages/AppVersion/index.js` | 当前工作空间应用版本视图 |
| 快照列表/详情/回滚 API | `rainbond-console/console/views/app_version.py` | 现有应用快照接口入口 |
| 快照服务 | `rainbond-console/console/services/app_version_service.py` | 应用快照查询、创建、回滚逻辑 |
| 组件构建版本删除参考 | `rainbond-console/console/views/service_version.py` | 现有删除版本接口风格参考 |
