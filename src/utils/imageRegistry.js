import { formatMessage } from '@/utils/intl';

export const CLOUD_IMAGE_REGISTRY_TYPES = ['AliyunACR', 'TencentTCR', 'HuaweiSWR', 'VolcanoCR'];

const LEGACY_IMAGE_REGISTRY_TYPE_MAP = {
  Aliyun: 'AliyunACR',
  Tencent: 'TencentTCR',
  Huawei: 'HuaweiSWR',
  Volcano: 'VolcanoCR'
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
    VolcanoCR: formatMessage({ id: 'versionUpdata_6_1.hub_type.volcano_cr' })
  };
  return labels[normalizedType] || normalizedType;
}

export function getImageRegistryDomainPlaceholder(type) {
  const normalizedType = normalizeImageRegistryType(type);
  const placeholders = {
    Docker: formatMessage({ id: 'placeholder.image_registry_domain.docker' }),
    Harbor: formatMessage({ id: 'placeholder.image_registry_domain.harbor' }),
    AliyunACR: formatMessage({ id: 'placeholder.image_registry_domain.aliyun_acr' }),
    TencentTCR: formatMessage({ id: 'placeholder.image_registry_domain.tencent_tcr' }),
    HuaweiSWR: formatMessage({ id: 'placeholder.image_registry_domain.huawei_swr' }),
    VolcanoCR: formatMessage({ id: 'placeholder.image_registry_domain.volcano_cr' })
  };
  return placeholders[normalizedType] || formatMessage({ id: 'placeholder.git_url_domain' });
}
