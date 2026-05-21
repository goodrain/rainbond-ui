# AgentHost SSE 结束自动聚焦设计文档

## 一、项目背景
### 1.1 项目架构
rainbond-ui 是 React 16.8 + UMI 3.5 + DVA 2.4 前端。AgentHost 作为全局 AI 助手面板挂载在应用入口，输入框状态由 `agent.sending`、待审批状态和面板可见性共同决定。

### 1.2 现有基础
AgentHost 的输入框位于 `src/components/AgentHost/index.js`，SSE 流结束后 DVA model 会把 `agent.sending` 从 `true` 更新为 `false`，输入框随之从 disabled 恢复为可编辑。

### 1.3 核心需求
当 SSE 连接断开且本次会话结束后，如果 AgentHost 面板仍可见并且没有待处理审批，自动聚焦输入框，让用户可以直接继续输入。

## 二、整体架构设计
### 2.1 系统架构图
```
SSE run.status terminal
  -> agent model 更新 sending=false
  -> AgentHost componentDidUpdate 检测 true -> false
  -> TextArea ref focus()
```

### 2.2 核心流程
在 AgentHost 组件内保存 TextArea ref。每次组件更新时比较前后 `agent.sending`，仅当从发送中变为非发送中、面板可见且输入框未被待审批禁用时，调度一次输入框聚焦。

## 三、数据模型设计
### 3.1 新增数据库表
无。

### 3.2 数据关系
无新增 DVA 状态。焦点是纯 UI 行为，不写入全局 model。

## 四、API设计
### 4.1 接口列表
无新增接口。

### 4.2 请求/响应结构
无变化。

## 五、核心实现设计
### 5.1 关键逻辑
- 在 `AgentHost` 中新增 `composerRef` 和 `setComposerRef`。
- 新增 `focusComposerInput`，兼容 Ant Design 3 `TextArea` 实例的 `focus()` 以及底层 `textArea.focus()`。
- 在 `componentDidUpdate` 中监听 `prevSending && !sending`，同时要求 `visible === true` 且没有 `sessionPendingApprovals`。
- 使用 `window.requestAnimationFrame` 延后到 DOM disabled 状态更新后再聚焦。

### 5.2 复用现有代码
复用现有 `agent.sending`、`agent.visible`、`agent.sessionPendingApprovals` 状态，不改服务层和 DVA 流程。

## 六、实施计划
### Sprint 1: AgentHost 聚焦体验
#### Task 1.1: 增加输入框 ref 与聚焦逻辑
- 文件：`src/components/AgentHost/index.js`
- 实现内容：在发送结束、面板可见、无待审批时聚焦 TextArea。
- 验收标准：代码编译通过；发送结束后输入框自动获得焦点；面板关闭或待审批时不抢焦点。

## 七、关键参考代码
| 功能 | 文件 | 说明 |
|------|------|------|
| AgentHost 面板与输入框 | `src/components/AgentHost/index.js` | 渲染 TextArea 并接收 agent 状态 |
| SSE 终态更新 | `src/models/agent.js` | run 结束后更新 `sending=false` |
| SSE 读取 | `src/services/agentStream.js` | 终态状态关闭读取循环 |
