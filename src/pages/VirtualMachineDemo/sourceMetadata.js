const { isVMAssetSelectable } = require('../../components/ImageVirtualMachineForm/assetReadiness');
const { normalizeAssetRuntimeSnapshot } = require('../../components/ImageVirtualMachineForm/runtimeFieldMerge');
const { safeVmRuntimeFields, inferVmSourceFormat, normalizeVmSourceFormat } = require('../../utils/vmQuickStart');

const OFFICIAL_IMAGE_URL =
  'https://cloud-images.ubuntu.com/minimal/releases/noble/release/ubuntu-24.04-minimal-cloudimg-amd64.img';

function validImageUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !!url.hostname &&
      !url.username && !url.password;
  } catch (error) {
    return false;
  }
}

function filename(value) {
  if (typeof value !== 'string') return '';
  let path = value;
  try {
    path = new URL(value).pathname;
  } catch (error) {
    path = value.split(/[?#]/)[0];
  }
  const name = path.split(/[\\/]/).pop();
  try {
    return decodeURIComponent(name || '').slice(0, 256);
  } catch (error) {
    return (name || '').slice(0, 256);
  }
}

// These are display hints from supplied metadata and filenames, never a probe
// of the image bytes or a guarantee that the image is bootable.
function describeSource(value = {}) {
  const name = filename(value.filename || value.name || value.path || '');
  const format = (typeof value.format === 'string' ? value.format.toLowerCase().slice(0, 32) : '') || inferVmSourceFormat(name);
  const knownIso = value.mediaKind === 'iso' || format === 'iso' || /\.iso$/i.test(name);
  const knownDisk = value.mediaKind === 'image' || ['img', 'raw', 'qcow2', 'vmdk', 'vdi', 'vhd', 'vhdx'].includes(format) || /\.(img|raw|qcow2|vmdk|vdi|vhd|vhdx)$/i.test(name);
  return {
    name: name || (typeof value.name === 'string' ? value.name.slice(0, 256) : ''),
    mediaKind: knownIso ? 'iso' : knownDisk ? 'image' : 'unknown',
    ...(format ? { format } : {}),
    ...(typeof value.os === 'string' && value.os ? { os: value.os.slice(0, 128) } : {}),
    ...(typeof value.architecture === 'string' && value.architecture ? { architecture: value.architecture.slice(0, 32) } : {}),
    ...(typeof value.firmware === 'string' && value.firmware ? { firmware: value.firmware.slice(0, 32) } : {})
  };
}

function describeUrl(value) {
  if (!validImageUrl(value)) return {};
  if (value === OFFICIAL_IMAGE_URL) {
    return {
      name: filename(value),
      mediaKind: 'image',
      os: 'Ubuntu 24.04 Minimal',
      architecture: 'amd64',
      format: 'qcow2',
      firmware: 'UEFI / GPT',
      requiresLoginSetup: true
    };
  }
  return describeSource({ path: value });
}

// Separate bounded display and creation fields before the GET response enters
// local workflow state. The raw asset and runtime snapshot are never retained.
function describeAssets(assets) {
  return (Array.isArray(assets) ? assets : []).filter(asset => asset && typeof asset === 'object').map((asset, index) => {
    const metadata = {
      format: asset.format,
      os: asset.os_name || asset.os_type,
      architecture: asset.arch,
      firmware: asset.boot_mode || asset.firmware
    };
    const candidates = [asset.name, asset.image_url, asset.source_uri].map(path => describeSource({ ...metadata, path }));
    const source = candidates.find(candidate => candidate.mediaKind !== 'unknown') || candidates[0];
    const id = asset.id || asset.asset_id;
    const safeId = typeof id === 'string' || typeof id === 'number' ? String(id).slice(0, 128) : '';
    const snapshot = normalizeAssetRuntimeSnapshot({
      asset,
      runtimeSnapshot: asset.extra && asset.extra.runtime_snapshot
    });
    const creation = {
      ...(safeId ? { asset_id: safeId } : {}),
      ...(typeof asset.name === 'string' && /^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$/.test(asset.name)
        ? { image_name: asset.name } : {}),
      ...(typeof asset.arch === 'string' && /^[a-z0-9][a-z0-9_-]{0,31}$/.test(asset.arch)
        ? { arch: asset.arch } : {}),
      ...(normalizeVmSourceFormat(asset.format) ? { format: normalizeVmSourceFormat(asset.format) } : {}),
      ...safeVmRuntimeFields({ ...snapshot, boot_mode: asset.boot_mode || snapshot.boot_mode })
    };
    return {
      key: safeId || `asset-${index}`,
      selectable: isVMAssetSelectable(asset),
      creation,
      source: {
        ...source,
        ...(safeId ? { id: safeId } : {}),
        name: String(asset.display_name || asset.name || filename(asset.image_url) || '').slice(0, 256)
      }
    };
  });
}

module.exports = { OFFICIAL_IMAGE_URL, validImageUrl, describeSource, describeUrl, describeAssets };
