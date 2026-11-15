const { createVmTemplate } = require('./state');
const { isVmWorkflowComponent } = require('../../utils/vmWorkflowDemo');

const clone = (value) => JSON.parse(JSON.stringify(value));

function emptyWorkflowData() {
  return {
    nextId: 1,
    components: [],
    edges: [],
    deliveries: [],
    copyTasks: []
  };
}

// Only copy display/resource metadata. Never persist full API responses,
// source configuration, environment variables or authentication information.
function toWorkflowComponent(component) {
  if (!component || typeof component !== 'object') return null;
  const service = component.service || component;
  const id = service.service_alias || service.k8s_component_name;
  if (!id) return null;
  const name = service.service_cname || component.service_cname || id;
  if (!isVmWorkflowComponent(component))
    return {
      id,
      name,
      kind: 'container',
      cpu: 1,
      memory: 1,
      status: 'running'
    };
  const base = createVmTemplate();
  const cpu = Number(service.min_cpu || service.cpu || 2000);
  const memory = Number(service.min_memory || service.memory || 2048);
  const profile = component.vm_profile || {};
  return {
    ...base,
    id,
    name,
    snapshots: [],
    disks: [],
    logs: [],
    pending: null,
    cpu: cpu > 64 ? cpu / 1000 : Math.max(1, cpu),
    memory: memory > 256 ? memory / 1024 : Math.max(1, memory),
    disk: Number(service.disk_cap) > 0 ? Number(service.disk_cap) : 30,
    os:
      profile.os_type ||
      (/windows/i.test(name) ? 'Windows' : '虚拟机系统'),
    status: ['closed', 'stopped'].includes(
      component.status?.status ||
        service.status?.status ||
        service.status ||
        component.status
    )
      ? 'stopped'
      : 'running',
    agent: false,
    scenario: 'current',
    diagnostic: null,
    port: /windows/i.test(name) ? 30389 : 30022,
    backendReference: true,
    detailBound: !!component.service
  };
}

function bindWorkflowData(previous, components = [], detail) {
  const data = previous ? clone(previous) : emptyWorkflowData();
  const candidates = detail ? [detail, ...components] : components;
  candidates.forEach((component) => {
    const mapped = toWorkflowComponent(component);
    if (!mapped) return;
    const existing = data.components.find((c) => c.id === mapped.id);
    if (!existing) data.components.push(mapped);
    else if (
      detail &&
      mapped.id === (detail.service || detail).service_alias &&
      (existing.kind !== 'vm' || (!existing.detailBound && mapped.detailBound))
    )
      Object.assign(existing, mapped);
    else existing.name = mapped.name;
  });
  return data;
}

module.exports = { emptyWorkflowData, bindWorkflowData, toWorkflowComponent };
