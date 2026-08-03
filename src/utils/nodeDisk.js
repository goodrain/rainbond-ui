export const DISK_ALERT_THRESHOLD = 70;

const toNumber = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const normalizeNodeDiskUsage = (nodes, cluster = {}) =>
  (nodes || [])
    .map((node, index) => {
      const capacity = toNumber(node.cap_docker_partition);
      const used = toNumber(node.req_docker_partition);
      const usagePercent = capacity > 0 ? (used / capacity) * 100 : 0;
      return {
        key: `${cluster.region_name || 'cluster'}-${node.name || index}`,
        node: node.name || '-',
        regionName: cluster.region_name,
        regionId: cluster.region_id,
        usagePercent
      };
    })
    .filter(
      alert =>
        alert.node !== '-' &&
        alert.usagePercent > DISK_ALERT_THRESHOLD &&
        alert.usagePercent <= 100
    );
