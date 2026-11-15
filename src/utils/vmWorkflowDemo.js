/* global RAINBOND_VM_WORKFLOW_DEMO, RAINBOND_VM_WORKFLOW_BACKEND */

function isVmWorkflowDemoEnabled() {
  return (
    process.env.NODE_ENV === 'development' &&
    typeof RAINBOND_VM_WORKFLOW_DEMO !== 'undefined' &&
    RAINBOND_VM_WORKFLOW_DEMO === true
  );
}

function vmWorkflowScope(team, region, application) {
  const backend =
    typeof RAINBOND_VM_WORKFLOW_BACKEND === 'undefined'
      ? 'console'
      : RAINBOND_VM_WORKFLOW_BACKEND;
  return [backend, team || '', region || '', String(application || 'create')]
    .map(encodeURIComponent)
    .join('/');
}

function isVmWorkflowComponent(component = {}) {
  const service = component.service || component;
  return (
    service.extend_method === 'vm' ||
    service.service_source === 'vm' ||
    !!component.vm_profile
  );
}

module.exports = {
  isVmWorkflowDemoEnabled,
  vmWorkflowScope,
  isVmWorkflowComponent
};
