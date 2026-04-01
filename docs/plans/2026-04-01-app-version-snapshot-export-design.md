# 应用版本快照导出补齐设计文档

## 一、项目背景
### 1.1 项目架构

应用版本时间线页面位于 `rainbond-ui/src/pages/AppVersion/index.js`，应用导出入口位于 `rainbond-console/console/views/center_pool/app_export.py`，导出元数据组装逻辑位于 `rainbond-console/console/services/app_import_and_export_service.py`。

当前快照导出链路如下：

```text
rainbond-ui AppVersion 时间线
    ↓ POST /console/enterprise/{enterprise_id}/app-models/export
rainbond-console CenterAppExportView
    ↓ AppExportService.__get_app_metata()
region builder export_app
    ↓ rainbond-oam export.{RAM|DC|HELM|SLG}
离线包 + component-images.tar
```

### 1.2 现有基础

当前已经具备：

- 应用市场本地组件库导出弹窗，支持 `rainbond-app`、`docker-compose`、`helm-chart`、`slug` 四类导出方式
- 应用版本时间线上的快照导出入口
- Console 侧统一的应用导出接口与导出状态查询接口
- Region builder 侧对多种导出格式的实际打包能力

当前存在两个问题：

1. 应用版本时间线页只把快照导出写死成 `rainbond-app`，没有复用本地组件库的多格式导出弹窗，见 `rainbond-ui/src/pages/AppVersion/index.js`
2. 快照导出的镜像 tar 为空。根因是快照版本模板没有走“镜像发布/分享”链路，模板中的组件通常只有 `image`，而导出打包只认 `share_image`，导致导出镜像列表为空，见 `rainbond-console/console/services/app_import_and_export_service.py` 与 `rainbond-oam/pkg/export/util.go`

### 1.3 核心需求

- 应用版本时间线中的快照导出，必须支持与本地组件库一致的多种导出方式
- 快照导出不能依赖“先发布镜像再导出”
- 对于已经存在的历史快照版本，也必须能在导出时补齐镜像信息，不能要求用户重新创建快照
- 镜像类导出包中的 `component-images.tar` 不能再出现空包
- 现有发布记录导出、本地组件库导出链路不能被破坏

## 二、用户旅程（MUST — 禁止跳过）
### 2.1 用户操作流程

1. 用户进入应用版本时间线页面
2. 用户在任意一个快照版本节点点击 `导出`
3. 系统弹出与“应用市场-本地组件库”一致的导出弹窗
4. 用户在弹窗中查看当前快照支持的导出格式与历史导出状态
5. 用户选择 `rainbond-app`、`DockerComposeApp`、`Helm Chart` 或 `slug` 进行导出
6. 系统开始导出，并在导出完成后提供下载入口
7. 用户下载离线包，确认其中的镜像 tar 不为空，可以在目标环境继续导入安装

### 2.2 页面原型

本次涉及的页面与交互：

- `AppVersion` 页面时间线节点操作区
  - 当前的单一“导出快照版本”按钮，改为打开多格式导出弹窗
- 快照导出弹窗
  - 复用本地组件库同款 `AppExporter`
  - 显示各导出格式的状态、导出按钮、下载按钮
  - 固定当前快照版本，不需要在时间线页再维护一套单独的导出状态 UI

### 2.3 外部系统交互

- 前端继续调用 `rainbond-console` 的应用导出接口
- `rainbond-console` 继续调用 region builder 导出任务
- 不新增第三方系统交互
- 不新增新的导出后端服务

## 三、整体架构设计
### 3.1 系统架构图

```text
AppVersion 时间线导出按钮
    ↓ 打开 AppExporter 弹窗
AppExporter
    ↓ queryExport / appExport
CenterAppExportView
    ↓ AppExportService.__get_app_metata()
    ↓ 补齐 snapshot app_template 中缺失的 share_image
builder export_app
    ↓ rainbond-oam SaveComponents / SavePlugins
导出包（含 component-images.tar）
```

### 3.2 核心流程

#### 3.2.1 前端导出入口统一

- 时间线快照节点不再维护“仅支持 rainbond-app”的单独导出动作
- 改为直接复用现有 `AppExporter` 弹窗
- 快照场景下只需把：
  - `app_id` 设为隐藏模板 `template_id`
  - `version` 设为当前快照版本
  - `team_name / regionName` 继续沿用当前团队与集群

#### 3.2.2 快照导出元数据补齐

推荐在 `AppExportService.__get_app_metata()` 中做导出前归一化，而不是要求快照模板事先存好完整的导出字段。

归一化规则：

- 对 `apps` 中的每个组件：
  - 若已有 `share_image`，保持不变
  - 若没有 `share_image`，但有 `image`，则将 `share_image` 回填为当前 `image`
- 对 `plugins` 中的每个插件：
  - 若已有 `share_image`，保持不变
  - 若没有 `share_image`，但有 `image`，则将 `share_image` 回填为当前 `image`
- 其它导出元数据（描述、版本说明、图片、helm 参数）保持原样

这样可以同时覆盖：

- 旧快照版本
- 新快照版本
- 没有做“镜像发布/分享”的场景

#### 3.2.3 导出镜像打包行为

`rainbond-oam` 在打包镜像时只读取 `share_image`：

- `SaveComponents()` 遍历 `component.ShareImage`
- `slug` 导出也通过 `component.ShareImage` 反查镜像层内容

因此本次修复的关键不是新增导出格式，而是保证快照导出前的元数据里一定存在可用的 `share_image`。

### 3.3 方案选型

#### 方案 A：前端复用本地组件库导出弹窗，后端在导出时补齐 `share_image`（推荐）

- 优点：直接覆盖当前用户正在使用的历史快照
- 优点：不要求快照先做镜像发布
- 优点：改动集中在 UI 入口和 Console 元数据组装层，风险可控
- 优点：不需要修改 region builder 或新增数据库字段

#### 方案 B：创建快照时就把 `share_image` 写入快照模板

- 优点：新快照数据更完整
- 缺点：历史快照仍然无法导出
- 缺点：会影响快照 diff 语义，容易引入额外行为变化

#### 方案 C：在 Go 导出层把 `image` 当作 `share_image` 的兜底

- 优点：修复点靠近最终打包逻辑
- 缺点：快照页仍然只有单一导出方式
- 缺点：问题暴露过晚，Console 返回的模板数据依旧不完整

最终选择方案 A。

## 四、数据模型设计
### 4.1 新增数据库表

无新增数据库表。

### 4.2 数据关系

继续复用以下现有数据：

- `RainbondCenterAppVersion.app_template`
  - 保存快照版本模板
- `RainbondCenterAppVersion.version`
  - 保存快照版本号
- `RainbondCenterApp`
  - 隐藏模板 `app_id`
- `AppExportRecord`
  - 记录多种导出格式的导出状态与下载地址

本次不改动物理表结构，只在导出运行时对 `app_template` 做只读归一化处理。

## 五、API设计
### 5.1 接口列表

不新增接口，复用现有接口：

- `GET /console/enterprise/{enterprise_id}/app-models/export`
  - 查询指定快照版本的导出状态
- `POST /console/enterprise/{enterprise_id}/app-models/export`
  - 触发指定快照版本的导出任务

### 5.2 请求/响应结构

请求结构保持不变：

```json
{
  "app_id": "hidden-template-id",
  "app_versions": ["0.0.1"],
  "format": "rainbond-app"
}
```

响应结构保持不变，前端复用现有 `AppExporter` 状态展示：

- `rainbond_app`
- `docker_compose`
- `helm_chart`
- `slug`

接口语义补充：

- 当导出的是快照隐藏模板版本时，服务端必须自动补齐缺失的 `share_image`
- 快照导出不再要求模板必须先经过发布链路

## 六、核心实现设计
### 6.1 关键逻辑

#### 6.1.1 rainbond-ui：快照页复用 AppExporter

在 `src/pages/AppVersion/index.js` 中：

- 新增 `buildSnapshotExportData(version)`，组装 `AppExporter` 所需的 `app` 数据
- 时间线的快照节点点击 `导出` 时，不再直接调用 `appExport(format='rainbond-app')`
- 改为打开 `AppExporter`
- 快照版本固定为当前节点版本，不在时间线页自己维护导出状态按钮

#### 6.1.2 rainbond-console：导出前补齐镜像字段

在 `console/services/app_import_and_export_service.py` 中新增模板归一化逻辑：

- 深拷贝 `app_template`
- 遍历 `apps/plugins`
- 对缺失 `share_image` 但存在 `image` 的组件或插件做回填
- 返回补齐后的模板再继续写入 `annotations`、`helm_chart`

实现要求：

- 只对导出元数据生效，不回写数据库
- 已有 `share_image` 的版本优先级更高，不覆盖现有值
- 归一化过程必须幂等

### 6.2 复用现有代码

- 复用 `rainbond-ui/src/pages/EnterpriseShared/AppExporter.js`
- 复用 `rainbond-console/console/views/center_pool/app_export.py`
- 复用 `AppExportService.get_export_status()` 的现有导出格式与状态聚合逻辑
- 复用 builder 侧现有 `rainbond-app / docker-compose / helm-chart / slug` 导出能力

## 七、实施计划
### 跨层覆盖检查（MUST）
- [ ] Go (rainbond): 不涉及 — 继续复用现有导出打包能力
- [ ] Python (console): 需要 — 导出前补齐快照模板中的 `share_image`
- [ ] React (rainbond-ui): 需要 — 时间线导出入口改为复用 `AppExporter`
- [ ] Plugin: 不涉及

### Sprint 1: console 快照导出元数据修复
#### Task 1.1: 为快照导出元数据补齐增加测试
- 仓库：rainbond-console
- 文件：`console/tests/app_import_and_export_service_test.py`
- 实现内容：
  - 验证当组件只有 `image` 没有 `share_image` 时，导出 metadata 会自动回填 `share_image`
  - 验证当插件只有 `image` 没有 `share_image` 时，导出 metadata 也会自动回填 `share_image`
  - 验证已有 `share_image` 时不会被覆盖
- 验收标准：
  - 新增测试先失败，修复后通过

#### Task 1.2: 实现导出前模板归一化
- 仓库：rainbond-console
- 文件：`console/services/app_import_and_export_service.py`
- 实现内容：
  - 新增组件导出模板归一化 helper
  - 在 `__get_app_metata()` 中调用
- 验收标准：
  - 导出 metadata 中组件具备可用的 `share_image`
  - 历史快照不需要重建即可导出镜像

### Sprint 2: UI 快照导出入口对齐本地组件库
#### Task 2.1: 时间线快照导出切换为弹窗模式
- 仓库：rainbond-ui
- 文件：`src/pages/AppVersion/index.js`
- 实现内容：
  - 新增快照版 `exporterAppData` 组装逻辑
  - 用 `AppExporter` 替换当前单格式导出动作
- 验收标准：
  - 时间线快照点击 `导出` 后，能看到与本地组件库一致的多格式导出弹窗

#### Task 2.2: 保持快照版本上下文正确透传
- 仓库：rainbond-ui
- 文件：`src/pages/AppVersion/index.js`
- 实现内容：
  - 固定快照导出版本为当前节点版本
  - 继续透传当前团队、集群、企业 ID
- 验收标准：
  - 同一应用不同快照节点打开导出弹窗时，导出版本正确
  - `queryExport` 能按当前快照版本返回 `rainbond-app / docker-compose / helm-chart / slug` 对应状态
  - `helm-chart` 导出仍能走 `AppExporter` 里的 dry-run 校验路径

## 八、关键参考代码
| 功能 | 文件 | 说明 |
|------|------|------|
| 时间线快照导出入口 | `rainbond-ui/src/pages/AppVersion/index.js` | 当前仅支持 `rainbond-app` |
| 本地组件库导出弹窗 | `rainbond-ui/src/pages/EnterpriseShared/AppExporter.js` | 已具备多种导出方式 |
| 导出接口 | `rainbond-console/console/views/center_pool/app_export.py` | 查询状态与触发导出 |
| 导出 metadata 组装 | `rainbond-console/console/services/app_import_and_export_service.py` | 本次修复主入口 |
| 镜像打包逻辑 | `rainbond-oam/pkg/export/util.go` | 只读取 `ShareImage` |
| slug 导出逻辑 | `rainbond-oam/pkg/export/slug.go` | 通过 `ShareImage` 定位 slug 镜像层 |
