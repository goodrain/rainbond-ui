export function streamProtocols(protocol) {
  const value = String(protocol || 'tcp').toLowerCase();
  if (value === 'tcp+udp') return ['tcp', 'udp', 'tcp+udp'];
  if (value === 'udp') return ['udp'];
  if (['http', 'https', 'grpc', 'mysql', 'tcp'].includes(value)) return ['tcp'];
  return [];
}

export function protocolLabel(protocol) {
  return String(protocol || 'tcp').toUpperCase().replace('+', ' + ');
}

export function routeMatchesPort(rule, port) {
  return !port || (rule.service_id === port.service_id &&
    Number(rule.container_port || rule.port) === Number(port.container_port));
}
