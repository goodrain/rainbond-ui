function normalizeVMDiskDraft(disks = []) {
  return (disks || []).map((item, index) => ({
    ...item,
    order_index: index,
    boot: index === 0
  }));
}

function appendContainerDiskDraft(current = [], values = {}) {
  const volumeName = `${values.volume_name || ''}`.trim();
  const image = `${values.image || ''}`.trim();
  return normalizeVMDiskDraft((current || []).concat([{
    disk_key: volumeName,
    disk_name: volumeName,
    disk_role: 'data',
    device_type: 'cdrom',
    device_path: '/cdrom',
    source_kind: 'container_disk',
    image,
    deletable: true,
    status: 'ready'
  }]));
}

function removeContainerDiskDraft(current = [], diskKey) {
  return normalizeVMDiskDraft(
    (current || []).filter(item => !(item.disk_key === diskKey && item.source_kind === 'container_disk'))
  );
}

function serializeVMDiskLayout(disks = []) {
  return normalizeVMDiskDraft(disks).map(item => ({
    disk_key: item.disk_key,
    disk_name: item.disk_name,
    disk_role: item.disk_role,
    device_type: item.device_type,
    source_kind: item.source_kind,
    image: item.image,
    order_index: item.order_index,
    boot: item.boot
  }));
}

module.exports = {
  appendContainerDiskDraft,
  normalizeVMDiskDraft,
  removeContainerDiskDraft,
  serializeVMDiskLayout
};
