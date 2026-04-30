// Map raw Rainbond MCP tool names + their input shape to short user-facing
// Chinese labels. The agent trace card shows these instead of identifiers like
// `rainbond_get_component_summary`, which leak implementation details and feel
// hostile to non-developer users.
//
// Strategy:
// 1. Look up the tool name in BASE_LABELS (the high-value list).
// 2. For tools whose semantics depend on `input.operation` (the manage_* and
//    operate_app families), refine the label via OPERATION_LABEL_REFINERS.
// 3. Anything not covered falls back to a heuristic that strips the
//    `rainbond_` prefix and humanizes the verb so the trace stays readable
//    even when a brand-new tool ships before this table is updated.
//
// Keep this file purely declarative — no React, no lucide imports — so the
// node:test suite (`agentTraceHelpers.node.test.js` and friends) can require
// it without bringing in a UMI runtime.

const BASE_LABELS = {
  // Read-only inspection
  rainbond_get_app_detail: '查看应用详情',
  rainbond_get_app_publish_candidates: '查询发布候选',
  rainbond_get_app_upgrade_info: '查看应用升级信息',
  rainbond_get_app_version_overview: '查看版本中心概览',
  rainbond_get_app_version_snapshot_detail: '查看快照详情',
  rainbond_get_component_build_logs: '查看构建日志',
  rainbond_get_component_build_source: '查看构建源',
  rainbond_get_component_check_result: '查看组件检测结果',
  rainbond_get_component_detail: '查看组件详情',
  rainbond_get_component_events: '查看组件事件',
  rainbond_get_component_logs: '查看运行日志',
  rainbond_get_component_pods: '查看组件 Pod',
  rainbond_get_component_summary: '查看组件概况',
  rainbond_get_copy_app_info: '查看应用复制信息',
  rainbond_get_current_user: '查看当前用户',
  rainbond_get_package_upload_status: '查询包上传状态',
  rainbond_get_pod_detail: '查看 Pod 详情',
  rainbond_get_region_detail: '查看集群详情',
  rainbond_get_region_node_detail: '查看集群节点详情',
  rainbond_get_team_apps: '查询团队应用',
  rainbond_get_yaml_app_check_result: '查看 YAML 应用检测结果',

  // Listing / queries
  rainbond_list_app_share_events: '查询发布事件',
  rainbond_list_app_share_records: '查询发布记录',
  rainbond_list_app_version_rollback_records: '查询回滚记录',
  rainbond_list_app_version_snapshots: '查询应用快照列表',
  rainbond_query_app_model_versions: '查询模板版本',
  rainbond_query_app_monitor: '查询应用监控',
  rainbond_query_app_monitor_range: '查询监控时段',
  rainbond_query_app_upgrade_records: '查询升级记录',
  rainbond_query_apps: '查询应用列表',
  rainbond_query_cloud_app_models: '查询云市场模板',
  rainbond_query_cloud_markets: '查询云市场列表',
  rainbond_query_components: '查询应用组件',
  rainbond_query_enterprises: '查询企业列表',
  rainbond_query_local_app_models: '查询本地模板',
  rainbond_query_region_nodes: '查询集群节点',
  rainbond_query_region_rbd_components: '查询集群 Rainbond 组件',
  rainbond_query_regions: '查询集群列表',
  rainbond_query_teams: '查询团队列表',

  // Creation
  rainbond_create_app: '创建应用',
  rainbond_create_app_from_snapshot_version: '从快照创建应用',
  rainbond_create_app_from_yaml: '从 YAML 创建应用',
  rainbond_create_app_share_record: '创建发布草稿',
  rainbond_create_app_upgrade_record: '创建升级记录',
  rainbond_create_app_version_snapshot: '创建应用快照',
  rainbond_create_component: '创建组件',
  rainbond_create_component_from_image: '从镜像创建组件',
  rainbond_create_component_from_local_package: '从本地包创建组件',
  rainbond_create_component_from_package: '从安装包创建组件',
  rainbond_create_component_from_source: '从源码创建组件',
  rainbond_create_gateway_rules: '创建网关规则',
  rainbond_create_region: '创建集群',

  // Build / install / deploy
  rainbond_build_component: '构建组件',
  rainbond_build_helm_app: '构建 Helm 应用',
  rainbond_check_component: '检测组件',
  rainbond_check_helm_app: '检测 Helm 应用',
  rainbond_check_yaml_app: '检测 YAML 应用',
  rainbond_install_app_by_market: '从应用市场安装',
  rainbond_install_app_model: '安装应用模板',
  rainbond_upgrade_app: '升级应用',

  // Mutation / lifecycle
  rainbond_change_component_image: '更换组件镜像',
  rainbond_close_apps: '关闭应用',
  rainbond_copy_app: '复制应用',
  rainbond_delete_app: '删除应用',
  rainbond_delete_component: '删除组件',
  rainbond_delete_region: '删除集群',
  rainbond_horizontal_scale_component: '水平伸缩组件',
  rainbond_rollback_app_upgrade_record: '回滚升级',
  rainbond_rollback_app_version_snapshot: '回滚到快照',
  rainbond_update_region: '更新集群',
  rainbond_vertical_scale_component: '垂直伸缩组件',

  // Multi-operation managers (refined by input.operation below)
  rainbond_bind_component_volume: '绑定组件存储',
  rainbond_handle_component_ports: '操作组件端口',
  rainbond_manage_component_autoscaler: '管理自动伸缩',
  rainbond_manage_component_connection_envs: '管理连接信息',
  rainbond_manage_component_dependency: '管理组件依赖',
  rainbond_manage_component_envs: '管理环境变量',
  rainbond_manage_component_ports: '管理组件端口',
  rainbond_manage_component_probe: '管理探针',
  rainbond_manage_component_storage: '管理存储',
  rainbond_operate_app: '操作组件运行状态',
  rainbond_update_component_envs: '更新环境变量',
};

// Operation suffixes refine the verb when the same tool covers create / read /
// update / delete in one entry point. Keys are the lowercased operation value;
// values map to a short Chinese verb that replaces "管理" / "操作" in the base
// label.
const OPERATION_VERB = {
  create: '新增',
  create_volume: '新增存储',
  add: '新增',
  insert: '新增',
  update: '更新',
  patch: '更新',
  modify: '修改',
  delete: '删除',
  remove: '删除',
  destroy: '删除',
  summary: '查看',
  describe: '查看',
  list: '查看',
  get: '查看',
  read: '查看',
  enable_inner: '启用对内访问',
  enable_outer: '启用对外访问',
  enable_outer_only: '仅启用对外访问',
  disable_inner: '禁用对内访问',
  disable_outer: '禁用对外访问',
  start: '启动',
  stop: '停止',
  restart: '重启',
  deploy: '部署',
  rollback: '回滚',
  upgrade: '升级',
  scale: '伸缩',
};

const NOUN_BY_TOOL = {
  rainbond_manage_component_autoscaler: '自动伸缩',
  rainbond_manage_component_connection_envs: '连接信息',
  rainbond_manage_component_dependency: '组件依赖',
  rainbond_manage_component_envs: '环境变量',
  rainbond_manage_component_ports: '组件端口',
  rainbond_manage_component_probe: '探针',
  rainbond_manage_component_storage: '组件存储',
  rainbond_handle_component_ports: '组件端口',
  rainbond_operate_app: '组件',
};

function refineByOperation(toolName, input) {
  if (!input || typeof input !== 'object') {
    return null;
  }
  const op =
    typeof input.operation === 'string'
      ? input.operation.toLowerCase()
      : typeof input.action === 'string'
        ? input.action.toLowerCase()
        : '';
  if (!op) {
    return null;
  }
  const verb = OPERATION_VERB[op];
  const noun = NOUN_BY_TOOL[toolName];
  if (!verb || !noun) {
    return null;
  }
  return `${verb}${noun}`;
}

function humanizeUnknownTool(toolName) {
  if (!toolName || typeof toolName !== 'string') {
    return '工具调用';
  }
  if (!toolName.startsWith('rainbond_')) {
    return toolName;
  }
  const remainder = toolName.slice('rainbond_'.length);
  const segments = remainder.split('_').filter(Boolean);
  if (segments.length === 0) {
    return toolName;
  }
  const verb = segments[0].toLowerCase();
  const verbMap = {
    get: '查看',
    list: '查询',
    query: '查询',
    create: '新增',
    update: '更新',
    delete: '删除',
    rollback: '回滚',
    upgrade: '升级',
    install: '安装',
    build: '构建',
    operate: '操作',
    manage: '管理',
    handle: '操作',
    check: '检测',
    bind: '绑定',
    close: '关闭',
    copy: '复制',
    change: '修改',
    horizontal: '水平伸缩',
    vertical: '垂直伸缩',
  };
  const verbLabel = verbMap[verb] || verb;
  const nounLabel = segments.slice(1).join(' ');
  return nounLabel ? `${verbLabel} ${nounLabel}` : verbLabel;
}

function formatToolLabel(toolName, input) {
  if (!toolName) {
    return '工具调用';
  }
  const refined = refineByOperation(toolName, input);
  if (refined) {
    return refined;
  }
  if (Object.prototype.hasOwnProperty.call(BASE_LABELS, toolName)) {
    return BASE_LABELS[toolName];
  }
  return humanizeUnknownTool(toolName);
}

module.exports = {
  formatToolLabel,
  // exported for tests
  BASE_LABELS,
  humanizeUnknownTool,
};
