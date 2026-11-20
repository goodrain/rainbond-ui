const { deliveryScope } = require('../utils/templateDelivery');

const examples = [
  { key: 'office', app: '办公协同', name: '办公协同套件', applicant: '陈晨',
    versions: [['2.1.0', 'pending', '2026-11-06T00:30:00+08:00'], ['2.0.0', 'approved', '2026-11-05T16:30:00+08:00'], ['1.9.0', 'rejected', '2026-11-04T14:00:00+08:00']] },
  { key: 'orders', app: '订单管理', name: '订单服务平台', applicant: '林远',
    versions: [['1.3.0', 'pending', '2026-11-06T00:10:00+08:00'], ['1.2.0', 'approved', '2026-11-05T10:00:00+08:00']] },
  { key: 'monitor', app: '运维监控', name: '监控与告警', applicant: '周宁', versions: [['1.0.0', 'rejected', '2026-11-05T09:00:00+08:00']] }
];

function sourceFor(enterprise, example) {
  return { enterprise_id: String(enterprise), teamName: 'preview-platform', regionName: 'preview-development',
    team_alias: '研发团队', region_alias: '开发集群', appID: `preview-delivery-${example.key}`, preview_sample: true };
}

function seedDeliveryCenterSamples(listings, deployments, enterprise) {
  const additions = [], jobs = [];
  examples.forEach(example => {
    const source = sourceFor(enterprise, example);
    example.versions.forEach(([version, status, time], index) => {
      const components = [
        { service_id: `${example.key}-web`, name: 'Web 前端', service_alias: `${example.key}-web`, source_type: 'source_code',
          source: `https://example.com/${example.key}/web.git`, branch: 'main', commit: index ? '72bca31' : 'a91fc25' },
        { service_id: `${example.key}-api`, name: '业务服务', service_alias: `${example.key}-api`, source_type: 'source_code',
          source: `https://example.com/${example.key}/api.git`, branch: 'release', commit: index ? '83ed420' : 'b67d901' },
        { service_id: `${example.key}-database`, name: '数据库', service_alias: `${example.key}-database`, source_type: 'docker_run', source: 'mysql:8.0', branch: '', commit: '' }
      ].slice(0, example.key === 'monitor' ? 2 : 3);
      const template = { id: `preview-template-${example.key}-${version}`, scope: deliveryScope(source),
        template_name: example.name, version, description: index ? '稳定版本，包含组件默认配置和安装参数。' : '优化组件资源与默认配置，完善跨环境安装体验。',
        destination: 'local', status: 'published', created_at: time, creator_name: example.applicant,
        service_ids: components.map(component => component.service_id), components, is_platform_plugin: false,
        component_overrides: components.map((component, componentIndex) => ({ service_id: component.service_id, extend_method: 'stateless',
          service_env_map_list: [{ attr_name: 'LOG_LEVEL', attr_value: 'info' }, { attr_name: 'APP_ENV', attr_value: 'production' }],
          extend_method_map: { min_node: 1, max_node: componentIndex === 2 ? 1 : 3, step_node: 1,
            container_cpu: componentIndex === 1 ? 1000 : 500, init_memory: componentIndex === 1 ? 1024 : 512 } })) };
      const comment = status === 'approved' ? '配置和测试结果符合要求，同意上架。' : status === 'rejected' ? '请补充安装说明，并调整数据库默认配置后重新申请。' : '';
      const listing = { id: `preview-listing-${example.key}-${version}`, group_id: `preview-listing-${example.key}`,
        enterprise_id: String(enterprise), source, app_name: example.app, template,
        applicant_id: `preview-applicant-${example.key}`, applicant_name: example.applicant,
        reason: '申请上架该模板，便于项目团队统一安装、交付和升级。', status, submitted_at: time,
        reviewer_name: status === 'pending' ? '' : '平台管理员', reviewed_at: status === 'pending' ? '' : time,
        review_comment: comment, actions: [{ action: 'submit', user_name: example.applicant, time },
          ...(status !== 'pending' ? [{ action: status, user_name: '平台管理员', time, comment }] : [])] };
      additions.push(listing);
      if (status !== 'rejected') jobs.push({ id: `preview-deployment-${example.key}-${version}`, enterprise_id: String(enterprise),
        source, template_id: template.id, template_name: template.template_name, version, listing_id: listing.id, kind: 'test',
        user_id: 'preview-tester', user_name: index ? '测试管理员' : '许嘉', status: index ? 'succeeded' : 'requested', created_at: time,
        target: { team_name: 'preview-quality', team_alias: '测试团队', region_name: 'preview-test', region_alias: '测试集群', app_name: `${example.key}-acceptance-${version}` } });
    });
  });
  const listingIds = new Set(listings.map(item => item.id)), jobIds = new Set(deployments.map(item => item.id));
  const sampleById = new Map(additions.map(item => [item.id, item]));
  const hydrated = listings.map(item => sampleById.has(item.id) && !item.source.team_alias ? { ...item,
    source: { ...item.source, team_alias: sampleById.get(item.id).source.team_alias, region_alias: sampleById.get(item.id).source.region_alias } } : item);
  const freshListings = additions.filter(item => !listingIds.has(item.id));
  const freshJobs = jobs.filter(item => !jobIds.has(item.id));
  return { listings: freshListings.length || hydrated.some((item, index) => item !== listings[index]) ? [...hydrated, ...freshListings] : listings,
    deployments: freshJobs.length ? [...deployments, ...freshJobs] : deployments };
}

function deliverySampleRuntime(scope) {
  const example = examples.find(item => scope && scope.preview_sample === true && scope.appID === `preview-delivery-${item.key}` && scope.teamName === 'preview-platform');
  if (!example) return null;
  return {
    app: { group_id: scope.appID, group_name: example.app },
    resources: { cpu_request: 4000, memory_request: 8192, storage_request: 50 },
    state: { status: 'RUNNING', service_num: example.key === 'monitor' ? 2 : 3, cpu: 1200, memory: 2304, disk: 12 * 1024 * 1024 },
    components: [
      { service_id: `${example.key}-web`, name: 'Web 前端', status: 'running', source_type: 'source_code', source: `https://example.com/${example.key}/web.git`, branch: 'main', commit: 'a91fc25', cpu_millicores: 500, memory_mib: 512, replicas: 2 },
      { service_id: `${example.key}-api`, name: '业务服务', status: 'running', source_type: 'source_code', source: `https://example.com/${example.key}/api.git`, branch: 'release', commit: 'b67d901', cpu_millicores: 1000, memory_mib: 1024, replicas: 2 },
      { service_id: `${example.key}-database`, name: '数据库', status: 'running', source_type: 'docker_run', source: 'mysql:8.0', branch: '', commit: '', cpu_millicores: 500, memory_mib: 512, replicas: 1 }
    ].slice(0, example.key === 'monitor' ? 2 : 3),
    collected_at: new Date().toISOString(),
    events: [
      { operation_type: '应用构建完成', username: example.applicant, create_time: '2026-11-06 00:20' },
      { operation_type: '更新组件配置', username: '林远', create_time: '2026-11-05 17:10' },
      { operation_type: '应用部署完成', username: '测试管理员', create_time: '2026-11-05 16:40' }
    ]
  };
}

function deliverySampleTargets(scope) {
  if (!deliverySampleRuntime(scope)) return null;
  return [
    { team_name: 'preview-platform', team_alias: '研发团队', regions: [{ name: 'preview-development', alias: '开发集群' }] },
    { team_name: 'preview-quality', team_alias: '测试团队', regions: [{ name: 'preview-test', alias: '测试集群' }] },
    { team_name: 'preview-production', team_alias: '交付团队', regions: [{ name: 'preview-production', alias: '生产集群' }] }
  ];
}

module.exports = { seedDeliveryCenterSamples, deliverySampleRuntime, deliverySampleTargets };
