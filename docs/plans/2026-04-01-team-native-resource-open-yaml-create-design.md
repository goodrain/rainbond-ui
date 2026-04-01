# Rainbond 团队原生资源按 YAML 原样创建设计文档

## 一、项目背景
### 1.1 项目架构

本次需求覆盖 Rainbond 团队资源中心的三层链路：

- `rainbond-ui`
  - 页面入口：`/team/:teamName/region/:regionName/resource-center`
  - YAML 创建入口：`src/pages/ResourceCenter/index.js`
  - 团队原生资源服务：`src/services/teamResource.js`
- `rainbond-console`
  - 团队原生资源代理视图：`console/views/team_resources.py`
  - region API 客户端：`www/apiclient/regionapi.py`
  - region HTTP 基础客户端：`www/apiclient/regionapibaseclient.py`
- `rainbond`
  - 团队原生资源控制器：`api/controller/ns_resource.go`
  - 团队原生资源处理器：`api/handler/ns_resource.go`

当前资源中心的团队原生资源创建语义仍然是“在某个资源分类下创建一个指定 GVR 的资源”，并不是真正意义上的“Kubernetes YAML 原样导入”。

### 1.2 现有基础

当前已有能力如下：

- 前端支持在资源中心弹出 YAML 编辑框并直接提交：`rainbond-ui/src/pages/ResourceCenter/index.js`
- 前端创建请求支持以 `application/yaml` 原样透传：`rainbond-ui/src/services/teamResource.js`
- console 已支持将原始请求体透传给 region：`rainbond-console/console/views/team_resources.py`
- region 已支持基于 query 中的 `group/version/resource` 创建单个 namespace-scoped 资源：`rainbond/api/controller/ns_resource.go`、`rainbond/api/handler/ns_resource.go`

当前限制点也比较明确：

1. `rainbond-ui` 创建时仍会根据当前 tab 或首个 YAML 文档推断目标资源类型，隐式限制用户输入。
2. `rainbond` 的 `CreateNsResource` 只解码第一个 YAML 文档，并且依赖前端传入的单一 `group/version/resource`。
3. `rainbond-console` 当前把创建结果统一包装成 `200 success`，无法表达“部分成功”或逐条失败明细。
4. 创建完成后前端会直接关闭弹窗，无法承载多资源导入的详细结果展示。

### 1.3 核心需求

本次需要将团队资源中心中的“工作负载 / 容器组 / 网络 / 配置 / 存储”等原生资源创建入口统一改造成如下语义：

1. 用户提交 YAML 时，不再限制资源类型和资源个数。
2. 多文档 YAML 按文档顺序逐条创建，不因前一条失败而中断后续创建。
3. 若 YAML 中包含 `Service` 等跨分类资源，即使入口来自“工作负载”页也必须一起创建。
4. 若 YAML 中包含 `cluster-scoped` 资源，也允许创建，不再只限制在团队 namespace 内的 namespaced 资源。
5. 创建结束后要给出详细结果，不是“直接关闭弹窗 + 统一成功提示”。
6. 若某条资源创建失败，要把真实错误原因返回给前端，并在结果页逐条展示。

## 二、用户旅程（MUST — 禁止跳过）
### 2.1 用户操作流程

- 用户如何配置/触发该功能？
  - 用户进入团队资源中心任一原生资源页签，如“工作负载”“容器组”“网络”，点击“新建资源”。
  - 用户在 YAML 编辑页中粘贴或上传单文档/多文档 YAML。
- 用户如何查看状态/结果？
  - 点击“创建”后弹窗不关闭，进入“创建结果”页。
  - 结果页顶部展示总览：总资源数、成功数、失败数、是否部分成功。
  - 结果列表按 YAML 原顺序展示每条资源的 `Kind / Name / Namespace / Scope / 结果 / 错误原因`。
  - 用户可点击“返回修改 YAML”继续修正失败项，也可点击“刷新列表”同步当前资源中心数据。
- 管理员/审批人如何操作？
  - 无新增审批流，沿用团队资源中心当前权限模型。

### 2.2 页面原型

- 页面一：资源中心原生资源列表页
  - 入口：`/team/:teamName/region/:regionName/resource-center?tab={workload|pod|network|config|storage}`
  - 关键交互：点击“新建资源”打开 YAML 弹窗
- 页面二：YAML 创建弹窗第一页
  - 主要区域：YAML 编辑器
  - 说明文案：支持多文档 YAML，按内容顺序创建资源，不限制资源类型和数量
  - 操作按钮：取消、创建
- 页面三：YAML 创建弹窗第二页（创建结果）
  - 顶部摘要：`共创建 N 个资源，X 个成功，Y 个失败`
  - 结果列表：逐条显示创建结果
  - 底部按钮：关闭、返回修改 YAML、刷新列表

### 2.3 外部系统交互

- 资源中心请求通过 console 转发到 region API。
- region 通过 Kubernetes discovery + dynamic client 解析每条 YAML 的真实资源类型并执行创建。
- 对于 namespaced 资源，最终创建到 YAML 指定 namespace 或团队默认 namespace。
- 对于 cluster-scoped 资源，直接创建到集群作用域。

## 三、整体架构设计
### 3.1 系统架构图

```text
rainbond-ui ResourceCenter YAML Modal
    ├─ Step 1: 编辑 YAML
    └─ Step 2: 查看创建结果
            ↓ HTTP
rainbond-console /console/teams/{team}/regions/{region}/ns-resources
            ↓ HTTP
rainbond /v2/tenants/{tenant}/ns-resources
            ├─ 解析多文档 YAML
            ├─ 逐条解析 apiVersion/kind -> GVR
            ├─ 判断 namespaced / cluster-scoped
            ├─ 顺序创建，失败不中断
            └─ 汇总批量创建结果
            ↓
Kubernetes API Server
```

### 3.2 核心流程

#### 3.2.1 创建请求流程

1. 前端提交整段 YAML，不再以当前 tab 强行限制目标 GVR。
2. console 将原始 YAML 和 `source` 透传给 region。
3. region 逐个解码 YAML 文档：
   - 读取 `apiVersion`
   - 读取 `kind`
   - 通过 discovery / RESTMapper 解析真实 `GVR`
   - 判断该资源是否 `namespaced`
4. region 逐条执行创建：
   - `namespaced` 且 YAML 未显式声明 namespace：补团队 namespace
   - `namespaced` 且 YAML 已显式声明 namespace：保留原值
   - `cluster-scoped`：不写 namespace
5. 每条资源创建成功或失败后都写入结果列表。
6. 全部处理完成后统一返回批量创建摘要。

#### 3.2.2 结果展示流程

1. 前端点击“创建”后进入结果页并显示 loading 状态。
2. 若返回 `200`：结果页展示“全部成功”。
3. 若返回 `207`：结果页展示“部分成功”，并逐条列出失败项。
4. 若返回 `4xx/5xx` 且带批量结果体：结果页展示“全部失败”或“请求失败”，仍显示逐条失败详情。
5. 用户可保留原 YAML 退回编辑页修正后重试。

#### 3.2.3 列表刷新语义

本次只放开“创建行为”，不重构资源中心现有列表查询模型：

- 资源中心现有列表仍以当前 tab 和现有查询维度为主。
- 若创建的是 `cluster-scoped` 资源，或创建到了非团队默认 namespace，该资源不一定出现在当前 tab 列表。
- 因此“创建结果页”是这次交互中的最终回执载体，负责完整展示所有资源的创建结果。

## 四、数据模型设计
### 4.1 新增数据库表

本次不新增数据库表。

原因：

- 该需求本质上是一次 Kubernetes 资源导入/创建能力增强。
- 创建结果只需要作为接口响应返回，不需要落库持久化。
- 资源的真实状态仍以 Kubernetes API 为准。

### 4.2 数据关系

本次新增的是“批量创建结果结构”，不新增数据库关系。

建议新增/扩展的响应结构：

```json
{
  "message": "共创建 3 个资源，2 个成功，1 个失败",
  "summary": {
    "total": 3,
    "success_count": 2,
    "failure_count": 1,
    "partial_success": true
  },
  "results": [
    {
      "index": 1,
      "api_version": "apps/v1",
      "kind": "Deployment",
      "name": "demo-web",
      "namespace": "team-a",
      "resource_scope": "namespaced",
      "success": true,
      "message": "created",
      "created_object": {}
    },
    {
      "index": 2,
      "api_version": "v1",
      "kind": "Service",
      "name": "demo-web",
      "namespace": "team-a",
      "resource_scope": "namespaced",
      "success": false,
      "message": "services \"demo-web\" already exists"
    },
    {
      "index": 3,
      "api_version": "rbac.authorization.k8s.io/v1",
      "kind": "ClusterRoleBinding",
      "name": "demo-binding",
      "namespace": "",
      "resource_scope": "cluster",
      "success": true,
      "message": "created",
      "created_object": {}
    }
  ]
}
```

补充约束：

- `index` 与 YAML 文档顺序一一对应。
- `name` 缺失时前端退化显示 `文档 #index`。
- `message` 保留 Kubernetes 原始错误文本，不再做二次抽象。

## 五、API设计
### 5.1 接口列表

#### 5.1.1 继续复用

- `POST /console/teams/{team}/regions/{region}/ns-resources`
- `POST /v2/tenants/{tenant}/ns-resources`
- `PUT /console/teams/{team}/regions/{region}/ns-resources/{name}`
- `PUT /v2/tenants/{tenant}/ns-resources/{name}`

#### 5.1.2 需要扩展

- `POST /v2/tenants/{tenant}/ns-resources`
  - 从“单资源创建”扩展为“按 YAML 文档顺序的批量创建”
  - 创建目标不再只依赖 query 中的 `group/version/resource`
- `POST /console/teams/{team}/regions/{region}/ns-resources`
  - 透传 `200 / 207 / 4xx / 5xx`
  - 透传结构化 `summary/results`
- `POST /console/teams/{team}/regions/{region}/ns-resources`
  - UI 侧对 query 中 `group/version/resource` 改为可选兼容字段，旧调用仍可保留，新流程不再依赖

### 5.2 请求/响应结构

#### 5.2.1 创建请求

请求体仍直接使用 YAML 文本：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: demo-web
spec: {}
---
apiVersion: v1
kind: Service
metadata:
  name: demo-web
spec: {}
```

query 兼容策略：

- `source` 继续保留，用于标记 `rainbond.io/source`
- `group/version/resource` 对新批量创建链路改为“兼容旧调用但不再作为真实创建目标”

#### 5.2.2 创建响应

- 全部成功：HTTP `200`
- 部分成功：HTTP `207`
- 全部失败：HTTP `400` 或 `500`

响应体统一带批量结果对象：

```json
{
  "code": 207,
  "msg": "partial success",
  "msg_show": "共创建 3 个资源，2 个成功，1 个失败",
  "data": {
    "bean": {
      "message": "共创建 3 个资源，2 个成功，1 个失败",
      "summary": {
        "total": 3,
        "success_count": 2,
        "failure_count": 1,
        "partial_success": true
      },
      "results": []
    }
  }
}
```

console 透传要求：

- `200/207` 直接转为同状态码 `Response`
- `4xx/5xx` 也要尽量保留 region 返回的 `bean.summary/results`
- 若 region 发生的是网络类错误、无法拿到结构化 body，则退化为普通错误提示

## 六、核心实现设计
### 6.1 关键逻辑

#### 6.1.1 Go：按对象自身 GVK 解析资源目标

`rainbond/api/handler/ns_resource.go` 中的 `CreateNsResource` 将从“单个 namespace-scoped 资源创建”重构为“多资源 YAML 创建入口”：

1. 使用 `YAMLOrJSONDecoder` 循环读取所有非空文档。
2. 每个文档先解码为 `unstructured.Unstructured`。
3. 根据对象自身的 `apiVersion/kind`，结合 cluster discovery / RESTMapper 解析出：
   - 实际 `GVR`
   - 是否 `Namespaced`
4. 若是 `namespaced`：
   - `metadata.namespace` 为空则补团队 namespace
   - 不为空则保留 YAML 原值
5. 若是 `cluster-scoped`：
   - 清空 namespace，直接使用 cluster 级 dynamic client 创建
6. 延续现有 `rainbond.io/source` 标记逻辑，对所有可写对象注入 label。
7. 单条失败后收集错误文本，继续处理下一条。
8. 最终按成功数/失败数构造统一结果对象。

#### 6.1.2 Go：HTTP 状态与错误承载

`rainbond/api/controller/ns_resource.go` 需要从“只返回单对象成功或单错误失败”调整为：

- 成功数等于总数：`ReturnSuccess`
- 失败数大于 0 且成功数大于 0：自定义返回 `207`
- 全部失败：返回 `400` 或 `500`，但 body 中仍带完整批量结果

为避免 `httputil.ReturnBcodeError` 丢失批量结果，需要新增一个适用于该场景的结构化返回分支，而不是仅依赖 `error.Error()`。

#### 6.1.3 Console：透传非 200 批量结果

当前 `console/views/team_resources.py` 会把 region 创建结果统一包装成 `200 success`，需要改成：

1. `POST /ns-resources` 按 region 原始 HTTP 状态返回。
2. 对 `200/207`，直接透传 `bean`、`msg_show` 和状态码。
3. 对 `4xx/5xx`，若 region 返回了结构化批量结果，则仍返回 `MessageResponse` 或等价 `Response`，保留 `bean.summary/results`。
4. 为支持第 3 点，`RegionInvokeApi.post_tenant_ns_resource` 与基础 client 需要允许该接口拿到非 2xx 的原始响应体，而不是过早抛弃明细。

#### 6.1.4 UI：从“直接成功关闭”改成“两步结果页”

`rainbond-ui/src/pages/ResourceCenter/index.js` 中的 YAML 创建交互改为：

1. 删除 `resolveCreateResourceParams` 对首个 YAML 文档和当前 tab 的隐式类型限制。
2. 点击“创建”后切换到结果页，不立即关闭弹窗。
3. 调用 `teamResources/createResource` 时支持：
   - `callback`：处理 `200/207`
   - `handleError`：处理 `4xx/5xx` 但仍能展示批量结果
4. 结果页展示：
   - 总览 banner
   - 逐条资源结果
   - 失败原因原文
5. 保留原始 YAML，支持从结果页返回编辑页后再次重试。

#### 6.1.5 UI：结果页与列表页职责分离

由于本次不改现有列表页查询模型，前端需要明确分离两个概念：

- 列表页：展示当前 tab 已支持的资源集合
- 结果页：展示本次 YAML 实际创建过的所有资源，包括
  - 其他分类资源（如工作负载入口中创建出的 `Service`）
  - 其他 namespace 的 namespaced 资源
  - cluster-scoped 资源

### 6.2 复用现有代码

- 复用 `rainbond-ui` 现有 YAML 编辑器、弹窗框架、上传 YAML 逻辑
- 复用 `rainbond-console` 现有 region API 透传链路和统一响应封装
- 复用 `rainbond` 现有 dynamic client、tenant namespace 解析、source label 注入能力
- 复用现有 `update` 单资源编辑链路，不在本次扩展为批量更新

## 七、实施计划
### 跨层覆盖检查（MUST）

- [x] Go (rainbond): 需要 — 重构团队原生资源创建为按 YAML 多文档批量创建，并支持 cluster-scoped 资源
- [x] Python (console): 需要 — 透传 region 的批量创建结果与 207/非 200 状态
- [x] React (rainbond-ui): 需要 — 新建资源弹窗改为“编辑 YAML -> 创建结果”，去掉类型/数量限制
- [ ] Plugin frontend (rainbond-enterprise-base): 不涉及 — 本次不改插件前端
- [ ] Plugin backend (rainbond-plugin-template): 不涉及 — 本次不改插件后端

### Sprint 1: region 批量创建能力
#### Task 1.1: 重构 region 创建入口为批量结果返回
- 仓库：`rainbond`
- 文件：`api/controller/ns_resource.go:54`
- 文件：`api/handler/ns_resource.go:112`
- 实现内容：创建批量创建结果结构，按文档顺序解码并返回 `200/207/4xx/5xx`
- 验收标准：单文档和多文档 YAML 都能返回结构化创建结果

#### Task 1.2: 解析 GVK 到真实 GVR 并支持 cluster-scoped
- 仓库：`rainbond`
- 文件：`api/handler/ns_resource.go:112`
- 文件：`api/handler/cluster_resource.go:20`
- 实现内容：基于 discovery / RESTMapper 解析资源元信息，区分 namespaced / cluster-scoped 并执行创建
- 验收标准：`Deployment + Service + ClusterRoleBinding` 可在同一份 YAML 中顺序执行

#### Task 1.3: 为批量创建补充回归测试
- 仓库：`rainbond`
- 文件：`api/handler/ns_resource_test.go:1`
- 文件：`api/controller/ns_resource.go:54`
- 实现内容：新增多文档、部分成功、cluster-scoped、namespace 回填等测试
- 验收标准：新增测试先红后绿，且 `go test` 通过

### Sprint 2: console 结果透传
#### Task 2.1: 让团队资源视图保留 region 原始状态码和结果体
- 仓库：`rainbond-console`
- 文件：`console/views/team_resources.py:169`
- 文件：`www/apiclient/regionapi.py:3701`
- 实现内容：创建接口不再统一包装成 `200 success`，透传批量结果和状态码
- 验收标准：前端可拿到 `200/207/4xx/5xx` 的结构化结果

#### Task 2.2: 为非 2xx 批量结果保留 body 明细
- 仓库：`rainbond-console`
- 文件：`www/apiclient/regionapibaseclient.py:154`
- 文件：`console/exception/main.py:35`
- 实现内容：为该接口保留非 2xx body 中的 `bean.summary/results`，避免错误路径丢失批量结果
- 验收标准：全部失败时前端仍能展示逐条失败原因

#### Task 2.3: 为团队原生资源创建补充 console 测试
- 仓库：`rainbond-console`
- 文件：`console/tests/team_resources_test.py:431`
- 文件：`console/tests/regionapibaseclient_test.py:17`
- 实现内容：新增 207 透传、非 2xx body 透传、原始错误原因保留测试
- 验收标准：Django 单测通过

### Sprint 3: 资源中心两步创建交互
#### Task 3.1: 去掉前端创建目标推断限制
- 仓库：`rainbond-ui`
- 文件：`src/pages/ResourceCenter/index.js:393`
- 文件：`src/services/teamResource.js:24`
- 实现内容：创建请求不再依赖当前 tab/首个文档的 `group/version/resource` 推断
- 验收标准：任意 tab 下提交多资源 YAML 都能发起创建

#### Task 3.2: 改造 DVA model 以承接 207 和错误结果
- 仓库：`rainbond-ui`
- 文件：`src/models/teamResources.js:105`
- 文件：`src/utils/request.js:260`
- 实现内容：`createResource` 支持 success + partial + error 三种结果分支，并向页面回调批量结果
- 验收标准：部分成功不会误报“创建成功”，全部失败仍能展示结果页

#### Task 3.3: 新建资源弹窗改为“两步结果页”
- 仓库：`rainbond-ui`
- 文件：`src/pages/ResourceCenter/index.js:521`
- 实现内容：新增结果页状态、结果总览、逐条失败明细、返回修改 YAML、刷新列表
- 验收标准：点击创建后弹窗停留在结果页，交互连续，错误信息详细可读

## 八、关键参考代码
| 功能 | 文件 | 说明 |
|------|------|------|
| 资源中心 YAML 创建入口 | `rainbond-ui/src/pages/ResourceCenter/index.js` | 当前前端创建入口与弹窗逻辑 |
| 团队原生资源前端服务 | `rainbond-ui/src/services/teamResource.js` | 当前创建请求透传位置 |
| 团队原生资源 DVA model | `rainbond-ui/src/models/teamResources.js` | 当前创建 effect 与回调入口 |
| 团队原生资源 console 视图 | `rainbond-console/console/views/team_resources.py` | 当前统一包装 200 的代理逻辑 |
| region API 客户端 | `rainbond-console/www/apiclient/regionapi.py` | 团队资源创建调用入口 |
| region HTTP 状态处理 | `rainbond-console/www/apiclient/regionapibaseclient.py` | 当前非 2xx 响应处理逻辑 |
| 团队原生资源控制器 | `rainbond/api/controller/ns_resource.go` | 当前 region 创建 HTTP 入口 |
| 团队原生资源处理器 | `rainbond/api/handler/ns_resource.go` | 当前单资源创建与 namespace 注入逻辑 |
