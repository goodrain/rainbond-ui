const PROTECTED_RUNTIME_FIELDS = [
  'os_family',
  'network_mode',
  'network_name',
  'fixed_ip',
  'gateway',
  'dns_servers',
];

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);

const mergeRuntimeFormValues = ({ form, currentValues = {}, incomingValues = {} }) => {
  const merged = { ...incomingValues };
  PROTECTED_RUNTIME_FIELDS.forEach(field => {
    if (!form || typeof form.isFieldTouched !== 'function') {
      return;
    }
    if (form.isFieldTouched(field) && hasOwn(currentValues, field)) {
      merged[field] = currentValues[field];
    }
  });
  return merged;
};

module.exports = {
  PROTECTED_RUNTIME_FIELDS,
  mergeRuntimeFormValues,
};
