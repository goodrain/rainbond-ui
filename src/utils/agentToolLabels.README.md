# 维护 AI 助手工具调用的中文标签

本文档说明 `agentToolLabels.js` 的工作机制和维护流程。这张表决定了 AI 助手抽屉里"工具调用"卡片显示什么——是 `rainbond_get_component_summary` 还是 `查看组件概况`。

## 为什么需要它

Rainbond MCP 后端把所有功能暴露成工具（`rainbond_*_*` 命名），由 LLM 选择调用。这些名字是给程序读的。直接展示给用户：

- 实现细节泄露（用户看到内部 API 名）
- 中英混杂、可读性差（"`rainbond_manage_component_envs` operation=create"）
- 多操作工具语义不明（同一个 `manage_component_envs` 可能在新增/删除/查看，名字看不出来）

`agentToolLabels.js` 负责把工具名 + 输入参数翻译成一句中文短语显示给用户。

## 三层映射策略

按优先级从高到低：

### 1. `OPERATION_VERB` × `NOUN_BY_TOOL` refiner（最高优先级）

针对"一个工具承载多个操作"的场景，看 `input.operation` 改写动词。

例：

```js
formatToolLabel('rainbond_manage_component_envs', { operation: 'create' })
// → '新增环境变量'

formatToolLabel('rainbond_operate_app', { operation: 'restart' })
// → '重启组件'
```

支持的 operation 值在 `OPERATION_VERB`。需要新增动词时往里加：

```js
const OPERATION_VERB = {
  // ...
  pause: '暂停',  // 新增一行
};
```

`NOUN_BY_TOOL` 决定"管理什么"。新工具如果属于多操作类，需要添加：

```js
const NOUN_BY_TOOL = {
  // ...
  rainbond_manage_component_secrets: '密钥',
};
```

### 2. `BASE_LABELS` 表（精修标签）

针对单一意图工具，直接映射成完整中文短语：

```js
const BASE_LABELS = {
  rainbond_get_component_summary: '查看组件概况',
  rainbond_install_app_model: '安装应用模板',
};
```

适用于绝大多数工具。每条都是 **一句话** 的精修翻译，约 4–8 个汉字。

### 3. `humanizeUnknownTool` 启发式兜底

工具名没在前两层命中时（典型场景：上游 rainbond-console 刚加了新工具，本仓库还没来得及同步），按 `rainbond_<verb>_<noun>` 拆解并翻译动词。

例：`rainbond_query_brand_new_thing` → `查询 brand new thing`

不漂亮，但**不会暴露原始 ID**，且语义大致正确。这是为了让上游加工具时不会立刻造成 UI 退化。

## 什么时候需要更新这张表

### 触发条件

只要满足下面任意一条就要改 `agentToolLabels.js`：

1. **rainbond-console 加了新 MCP tool**，且 copilot 端会调用它
2. **rainbond-console 改了已有 tool 的 `operation` 枚举**（多操作分支）
3. **测试时看到抽屉里出现了"查看 xxx xxx"这种 heuristic 拼起来的标签**——说明这条工具应该精修一下

### 不需要更新的场景

- 上游加了 tool 但 copilot 不会调用（比如纯 admin 后端用的）→ 没必要管
- 已有 tool 改了内部实现但工具名 / operation 枚举没变 → 不需要动

## 操作步骤

### 添加单个工具

1. 打开 `src/utils/agentToolLabels.js`
2. 在 `BASE_LABELS` 里按现有分组（read-only / listing / creation / build-install-deploy / mutation-lifecycle / app-share / app-upgrade / multi-operation 等）找到合适位置
3. 加一行 `rainbond_xxx_yyy: '中文短语',`
4. 同步在 `agentToolLabels.node.test.js` 加一条 assert（可选，但推荐核心工具补上）

### 添加多操作工具

1. `BASE_LABELS` 里加一条作为"无 operation 时的兜底标签"，通常用"管理 xxx"
2. `NOUN_BY_TOOL` 里加 `rainbond_xxx_yyy: '名词'`
3. 验证 `OPERATION_VERB` 是否覆盖该工具会用到的所有 operation 值；少则补
4. 测试加 assert 覆盖关键 operation 分支

### 验证覆盖率

```bash
# 列出 copilot 实际引用的全部 MCP tool 名
grep -rohE "rainbond_[a-z_]+" \
  ~/code/rainbond-copilot/dist-server \
  ~/code/rainbond-copilot/src \
  | sort -u > /tmp/tools-all.txt

# 列出本表已映射的工具
grep -oE "rainbond_[a-z_]+:" \
  ~/code/rainbond-ui/src/utils/agentToolLabels.js \
  | sed 's/://' | sort -u > /tmp/tools-mapped.txt

# 列出还没映射的（忽略尾部截断噪声 rainbond_get_ / rainbond_query_ 等）
comm -23 /tmp/tools-all.txt /tmp/tools-mapped.txt
```

如果差异列表里出现真实工具名（不是 `rainbond_get_` 这种半截字符串），就该补。

## 测试

```bash
cd ~/code/rainbond-ui
node --test src/utils/agentToolLabels.node.test.js
```

测试覆盖：

- 已知工具命中 BASE_LABELS
- 多操作工具按 `input.operation` 改写
- 未知工具走 heuristic 兜底
- 空输入返回安全默认值
- BASE_LABELS 至少有 30 条（防误删）

## 命名规范

为保持一致风格：

| 工具家族 | 示例标签 |
|---|---|
| `get_*` | `查看 xxx` |
| `list_*` / `query_*` | `查询 xxx 列表` |
| `create_*` | `创建 xxx` |
| `delete_*` | `删除 xxx` |
| `update_*` | `更新 xxx` |
| `install_*` | `安装 xxx` |
| `build_*` | `构建 xxx` |
| `manage_*`（无 operation） | `管理 xxx` |
| `manage_*` + operation | 按 OPERATION_VERB 翻译动词 + NOUN_BY_TOOL 名词 |
| `operate_*` + operation | 同上 |
| `rollback_*` | `回滚 xxx` |
| `upgrade_*` | `升级 xxx` |

控制在 4–8 个汉字内，避免长句。

## 不要做的

- 不要在标签里塞参数细节（"查看应用 ${appId} 的概况"这种）。参数显示交给 trace card 的 `detail` 区域，title 保持简洁。
- 不要罗列动词之外的修饰（"快速查看组件概况"、"立即"、"详细"）。
- 不要在标签里出现工具名本身（`rainbond_*` / `mcp_*`）。
- 不要硬编码 enterprise / team / region 等业务名词作为标签的一部分。

## 未来演进

当前是手工维护的客户端表。两条可能的演进路径，先记下来：

### 选项 A：MCP 工具描述携带 display_name

在 rainbond-console 的 MCP 工具注册处，给每个 tool 在 `inputSchema` 旁加一个 `description` 或 `x-display-label`。前端从 `tools/list` 接口拿到后渲染。

**优点**：单一事实源，三仓库不再各自维护。
**缺点**：MCP spec 没有标准的 display_name 字段；要么塞在 description 前缀里、要么扩展自定义字段。description 也是给 LLM 看的，混业务文案进去会污染 LLM 路由质量。

### 选项 B：copilot server 做映射并塞进 SSE 事件

`chat.trace` 事件 publishing 时，server 端把 `tool_name` 转成 `tool_label` 一并发给前端。

**优点**：rainbond-ui 只渲染、不维护。
**缺点**：copilot 也是 vendored 状态，server 还是要维护映射表，只是换了个仓库放。

**目前不做**：手动表 100 条左右，维护成本可控；上游加新工具的频率每月几个，偶尔补一行成本可接受。当映射表超过 200 条 / 上游变更频率显著上升时，再评估方案 A。

## 参考

- 表的具体实现：`src/utils/agentToolLabels.js`
- 测试：`src/utils/agentToolLabels.node.test.js`
- 接入点：`src/models/agentTraceHelpers.js` 的 `buildTraceContent`
- 渲染层：`src/components/AgentHost/index.js` 的 `renderTraceMessage`（读 `trace.title`）
