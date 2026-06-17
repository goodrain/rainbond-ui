import { formatMessage } from '@/utils/intl';

export const CLOUD_IMAGE_REGISTRY_TYPES = ['AliyunACR', 'TencentTCR', 'HuaweiSWR', 'VolcanoTOS'];

const LEGACY_IMAGE_REGISTRY_TYPE_MAP = {
  Aliyun: 'AliyunACR',
  Tencent: 'TencentTCR',
  Huawei: 'HuaweiSWR',
  Volcano: 'VolcanoTOS'
};

export function normalizeImageRegistryType(type) {
  return LEGACY_IMAGE_REGISTRY_TYPE_MAP[type] || type || 'Docker';
}

export function isCloudImageRegistryType(type) {
  return CLOUD_IMAGE_REGISTRY_TYPES.includes(normalizeImageRegistryType(type));
}

export function getImageRegistryTypeLabel(type) {
  const normalizedType = normalizeImageRegistryType(type);
  const labels = {
    Docker: 'Docker Registry',
    Harbor: 'Harbor',
    AliyunACR: formatMessage({ id: 'versionUpdata_6_1.hub_type.aliyun_acr' }),
    TencentTCR: formatMessage({ id: 'versionUpdata_6_1.hub_type.tencent_tcr' }),
    HuaweiSWR: formatMessage({ id: 'versionUpdata_6_1.hub_type.huawei_swr' }),
    VolcanoTOS: formatMessage({ id: 'versionUpdata_6_1.hub_type.volcano_tos' })
  };
  return labels[normalizedType] || normalizedType;
}
