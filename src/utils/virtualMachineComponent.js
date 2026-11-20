function isVirtualMachineComponent(component = {}) {
  if (!component || typeof component !== 'object') return false;
  const service = component.service || component;
  return service.extend_method === 'vm' ||
    ['vm', 'vm_run'].includes(service.service_source) || Boolean(component.vm_profile);
}

module.exports = { isVirtualMachineComponent };
