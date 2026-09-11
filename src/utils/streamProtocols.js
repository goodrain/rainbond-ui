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
