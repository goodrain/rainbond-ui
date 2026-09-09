import { getPluginBaseId } from './pluginArchUtils';
import { ReactComponent as BrainCircuitIcon } from '../assets/platform-plugins/lucide/brain-circuit.svg';
import { ReactComponent as DatabaseIcon } from '../assets/platform-plugins/lucide/database.svg';
import { ReactComponent as BotMessageSquareIcon } from '../assets/platform-plugins/lucide/bot-message-square.svg';
import { ReactComponent as GalleryHorizontalEndIcon } from '../assets/platform-plugins/lucide/gallery-horizontal-end.svg';
import { ReactComponent as WorkflowIcon } from '../assets/platform-plugins/lucide/workflow.svg';
import { ReactComponent as GpuIcon } from '../assets/platform-plugins/lucide/gpu.svg';
import { ReactComponent as ShieldCodeIcon } from '../assets/platform-plugins/lucide/shield-code.svg';
import { ReactComponent as DatabaseBackupIcon } from '../assets/platform-plugins/lucide/database-backup.svg';
import { ReactComponent as MonitorCogIcon } from '../assets/platform-plugins/lucide/monitor-cog.svg';
import { ReactComponent as SirenIcon } from '../assets/platform-plugins/lucide/siren.svg';
import { ReactComponent as ScrollTextIcon } from '../assets/platform-plugins/lucide/scroll-text.svg';
import { ReactComponent as BlocksIcon } from '../assets/platform-plugins/lucide/blocks.svg';
import { ReactComponent as ChartColumnIcon } from '../assets/platform-plugins/lucide/chart-column.svg';

// Display metadata only. Installation state, versions and app links come from the cluster.
const OFFLINE_PLATFORM_PLUGINS = {
  'rainbond-ai-engine': {
    plugin_name: 'AI大模型',
    description: 'Rainbond 大模型平台能让企业在私有化环境中一键部署开源大模型，自动将其转化为兼容 OpenAI 标准的 API，并提供可视化的 GPU 监控与在线调试能力。',
    app_level: 'free',
    icon: BrainCircuitIcon
  },
  'rainbond-databases': {
    plugin_name: '数据库插件',
    description: '支持 MySQL、PostgreSQL、Redis、RabbitMQ 数据库组件的一键创建与统一管理，提供版本规格配置、存储扩容、连接信息注入、监控、参数配置、备份恢复等能力，并支持多实例高可用部署，满足应用数据库的创建、运行和日常运维需求。',
    app_level: 'free',
    icon: DatabaseIcon
  },
  'rainbond-agent': {
    plugin_name: 'AI助手',
    description: '帮你解答 Rainbond 的使用问题、通过镜像、源码等方式安装和部署应用，还可以帮你查看服务状态，定位问题并给出处理建议。',
    app_level: 'free',
    icon: BotMessageSquareIcon
  },
  'rainbond-vm': {
    plugin_name: '虚拟机',
    description: '虚拟机插件能让企业直接在平台内导入 qcow2 镜像部署并管理虚拟机，支持资源热更新、多虚拟机拓扑编排，以及将整套虚拟机应用打包为模板进行离线交付与恢复。',
    app_level: 'free',
    icon: GalleryHorizontalEndIcon
  },
  'rainbond-enterprise-pipeline': {
    plugin_name: '流水线',
    description: '流水线是专为 Rainbond 平台设计的 CI/CD 解决方案，它将应用部署、灰度发布、通知等过程自动化，提供可视化的流水线编排能力',
    app_level: 'enterprise',
    icon: WorkflowIcon
  },
  'rainbond-gpu': {
    plugin_name: 'GPU管理',
    description: 'GPU资源调度与管理模块，支持AI训练/推理任务加速、显存监控、多卡分配策略，提升计算资源利用率',
    app_level: 'enterprise',
    icon: GpuIcon
  },
  'rainbond-sourcescan': {
    plugin_name: '源码扫描',
    description: '提供代码质量和安全检测工具，通过集成 SonarQube 代码分析引擎，对代码进行自动化扫描，发现潜在的质量问题和安全漏洞',
    app_level: 'enterprise',
    icon: ShieldCodeIcon
  },
  'rainbond-recovery': {
    plugin_name: '灾备恢复',
    description: '备份恢复插件，用于集群的备份恢复。',
    app_level: 'enterprise',
    icon: DatabaseBackupIcon
  },
  'rainbond-observability': {
    plugin_name: '监控中心',
    description: '提供集群级、应用级、组件级的网关监控，以及集群级的节点监控',
    app_level: 'enterprise',
    icon: MonitorCogIcon
  },
  'rainbond-enterprise-alarm': {
    plugin_name: '告警中心',
    description: '实时异常检测与智能告警系统，支持自定义阈值规则、多通道通知（邮件/钉钉/Webhook），保障业务连续性',
    app_level: 'enterprise',
    icon: SirenIcon
  },
  'rainbond-enterprise-logs': {
    plugin_name: '日志中心',
    description: '提供平台、组件级的日志分析与检索，默认收集标准stdin/stdout日志',
    app_level: 'enterprise',
    icon: ScrollTextIcon
  },
  'rainbond-enterprise-base': {
    plugin_name: '基础功能扩展',
    description: '平台基础功能扩展，集成了应用备份、个性化视觉配置及审计日志等核心模块。',
    app_level: 'enterprise',
    icon: BlocksIcon
  },
  'rainbond-bill': {
    plugin_name: '计量计费',
    description: '资源用量精细化计量与成本管理工具，支持按团队、应用、组件维度统计CPU/内存/存储消耗，生成费用报表与趋势分析',
    app_level: 'enterprise',
    icon: ChartColumnIcon
  }
};

const PLUGIN_ALIASES = {
  pipeline: 'rainbond-enterprise-pipeline',
  'rainbond-pipeline': 'rainbond-enterprise-pipeline',
  'rainbond-source-scan': 'rainbond-sourcescan',
  'source-scan': 'rainbond-sourcescan'
};

export function getOfflinePlatformPluginMetadata(plugin = {}) {
  const baseId = getPluginBaseId(plugin.plugin_id || plugin.name);
  const pluginId = PLUGIN_ALIASES[baseId] || baseId;
  return Object.prototype.hasOwnProperty.call(OFFLINE_PLATFORM_PLUGINS, pluginId)
    ? OFFLINE_PLATFORM_PLUGINS[pluginId]
    : undefined;
}
