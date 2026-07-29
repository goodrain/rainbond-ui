export const DISK_ALERT_THRESHOLD = 70;

export const NODE_DISK_USAGE_QUERY = `max by(instance, kubernetes_io_hostname) (
  100 * container_fs_usage_bytes{id="/",device=~"/dev/.*",device!="/dev/shm"}
  / container_fs_limit_bytes{id="/",device=~"/dev/.*",device!="/dev/shm"}
) > ${DISK_ALERT_THRESHOLD}`;

const toNumber = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const normalizeNodeDiskMetrics = (results, cluster = {}) =>
  (results || [])
    .map((item, index) => {
      const metric = item.metric || {};
      const node = metric.kubernetes_io_hostname || metric.node || metric.instance;
      const usagePercent = toNumber(item.value && item.value[1]);
      return {
        key: `${cluster.region_name || 'cluster'}-${node || index}`,
        node: node || '-',
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
