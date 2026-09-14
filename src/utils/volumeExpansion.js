const IN_PROGRESS_STATUSES = [
  'resizing',
  'filesystem_resize_pending'
];

function numericCapacity(value) {
  const capacity = Number(value);
  return Number.isFinite(capacity) && capacity > 0 ? capacity : 0;
}

function isExpansionInProgress(status) {
  return IN_PROGRESS_STATUSES.includes(status);
}

function minimumExpansionCapacity(volume = {}) {
  return Math.max(
    numericCapacity(volume.volume_capacity),
    numericCapacity(volume.requested_capacity),
    numericCapacity(volume.actual_capacity)
  );
}

function isCapacityExpansion(volume, value) {
  const runtimeCapacity = Math.max(
    numericCapacity(volume && volume.requested_capacity),
    numericCapacity(volume && volume.actual_capacity)
  );
  const currentCapacity = runtimeCapacity || numericCapacity(volume && volume.volume_capacity);
  return numericCapacity(value) > currentCapacity;
}

function canEditVolumeCapacity(volume = {}, editing = false) {
  if (!editing) return true;
  if (volume.volume_type === 'config-file') return false;
  // An empty status means an older Region API response. Keep the legacy edit
  // behavior during rolling upgrades and trust allow_expansion only when the
  // new runtime status contract is present.
  if (!volume.expansion_status) return true;
  return volume.expansion_status !== 'unsupported' && volume.allow_expansion !== false;
}

module.exports = {
  canEditVolumeCapacity,
  isCapacityExpansion,
  isExpansionInProgress,
  minimumExpansionCapacity,
  numericCapacity
};
