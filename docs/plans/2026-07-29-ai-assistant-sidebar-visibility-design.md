# Rainbond UI AI 助手侧边栏显示设计文档

## 一、项目背景
### 1.1 项目架构
Rainbond UI 使用 React 16.8、UMI 3.5、DVA 2.4 和 Ant Design 3.19。企业侧边栏菜单由 `src/common/enterpriseMenu.js` 生成，企业布局负责聚合各集群已安装插件列表。

### 1.2 现有基础
企业布局已经按集群调用已安装插件接口，并将数据组织为 `{ [regionName]: plugin[] }`。`PluginUtil.getPluginInfo` 支持按插件基名匹配，同时兼容 `-ARM64` 和 `-AMD64` 后缀。

### 1.3 核心需求
只有企业至少一个集群已经安装 `rainbond-agent` 时，企业左侧侧边栏才显示“AI功能 / AI助手配置”。未安装时继续通过顶部 AI 助手入口引导管理员进入扩展中心安装。

## 二、整体架构设计
### 2.1 系统架构图
```text
EnterpriseLayout 聚合各集群插件
  -> getMenuData(pluginList)
    -> PluginUtil.getPluginInfo(pluginList, 'rainbond-agent')
      -> 已安装：显示 AI 助手配置
      -> 未安装：不生成 AI 菜单分组
```

### 2.2 核心流程
菜单生成时先解析已安装 AI 插件所在集群。AI 菜单的显示条件为企业管理员、个性化开关开启且至少存在一个安装集群；跳转继续使用第一个实际安装集群。

## 三、数据模型设计
### 3.1 新增数据库表
无。

### 3.2 数据关系
复用 `EnterpriseLayout.state.pluginList`，键为集群名称，值为该集群已安装插件列表，不新增 DVA state。

## 四、API设计
### 4.1 接口列表
不新增接口。复用企业布局已有的 `GET /console/enterprise/{eid}/regions/{region}/plugins`。

### 4.2 请求/响应结构
不改变现有请求或响应结构。

## 五、核心实现设计
### 5.1 关键逻辑
在 `menuData` 中复用 `PluginUtil.getPluginInfo` 得到 AI 插件集群映射，并将其是否非空加入 AI 菜单分组条件。路径生成函数直接接收解析后的映射，确保显示条件与跳转集群来自同一份数据。

### 5.2 复用现有代码
复用 `PluginUtil.getPluginInfo` 的跨集群查找与架构后缀兼容，不新增插件匹配实现。

## 六、实施计划
### Sprint 1: 收紧 AI 助手侧边栏显示条件
#### Task 1.1: 按已安装插件生成 AI 菜单
- 文件：`src/common/enterpriseMenu.js:9`
- 实现内容：复用已解析的 AI 插件映射生成路径，并要求映射非空才显示 AI 菜单。
- 验收标准：未安装不显示；安装基名或架构后缀版本时显示；路径指向实际安装集群；`yarn build` 通过。

## 七、关键参考代码
| 功能 | 文件 | 说明 |
|------|------|------|
| 企业菜单生成 | `src/common/enterpriseMenu.js` | AI 菜单显示与跳转路径 |
| 插件基名匹配 | `src/utils/pulginUtils.js` | 跨集群查找已安装插件 |
| 插件数据加载 | `src/layouts/EnterpriseLayout.js` | 聚合各集群已安装插件 |

