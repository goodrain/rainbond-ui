import { formatMessage } from '@/utils/intl';

const {
  DEFAULT_SNAPSHOT_VERSION,
  buildNextSnapshotVersion
} = require('./snapshotVersionHelpers');

export { DEFAULT_SNAPSHOT_VERSION, buildNextSnapshotVersion };

export const appShareStateSelector = ({
  user,
  application,
  loading,
  enterprise,
  teamControl
}) => ({
  currUser: user.currentUser,
  apps: application.apps,
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  groupDetail: application.groupDetail || {},
  loading
});

export const validateShareVersion = value => {
  if (value === '' || !value) {
    return formatMessage({ id: 'placeholder.appShare.versions_notNull' });
  }
  if (!/^[0-9]+(\.[0-9]+){1,2}$/.test(value)) {
    return formatMessage({ id: 'placeholder.appShare.layout_grid_mode' });
  }
  return null;
};

export const PLATFORM_PLUGIN_NO_INJECT = 'NoInject';

const uniquePlatformPluginPositions = positions =>
  Array.from(
    new Set((Array.isArray(positions) ? positions : []).filter(Boolean))
  );

export const normalizePlatformPluginPositionsForDisplay = (
  positions,
  fallbackToNoInject = false
) => {
  const normalizedPositions = uniquePlatformPluginPositions(positions);
  if (normalizedPositions.length > 0) {
    return normalizedPositions;
  }
  return fallbackToNoInject ? [PLATFORM_PLUGIN_NO_INJECT] : [];
};

export const normalizePlatformPluginPositionsForSelection = positions => {
  const normalizedPositions = uniquePlatformPluginPositions(positions);
  if (normalizedPositions.includes(PLATFORM_PLUGIN_NO_INJECT)) {
    return [PLATFORM_PLUGIN_NO_INJECT];
  }
  return normalizedPositions;
};

export const normalizePlatformPluginPositionsForSubmit = positions => {
  const normalizedPositions =
    normalizePlatformPluginPositionsForSelection(positions);
  if (normalizedPositions.includes(PLATFORM_PLUGIN_NO_INJECT)) {
    return [];
  }
  return normalizedPositions;
};

export const isPlatformPluginPositionConfigured = positions =>
  normalizePlatformPluginPositionsForSelection(positions).length > 0;

const cloneShareService = item => ({
  ...item,
  extend_method_map: item.extend_method_map
    ? { ...item.extend_method_map }
    : item.extend_method_map,
  dep_service_map_list: Array.isArray(item.dep_service_map_list)
    ? item.dep_service_map_list.map(dep => ({ ...dep }))
    : [],
  service_connect_info_map_list: Array.isArray(item.service_connect_info_map_list)
    ? item.service_connect_info_map_list.map(config => ({ ...config }))
    : [],
  service_env_map_list: Array.isArray(item.service_env_map_list)
    ? item.service_env_map_list.map(config => ({ ...config }))
    : []
});

export const collectShareServiceData = ({
  shareServiceList = [],
  selectedShareKeys = [],
  componentRefs = []
}) => {
  const shareServiceData = shareServiceList.map(cloneShareService);
  let componentFormHasError = false;

  componentRefs.forEach(app => {
    if (!app || !app.props || !app.props.form) {
      return;
    }
    const apptab = app.props.tab;
    let componentValues = null;
    app.props.form.validateFields((errs, val) => {
      if (errs) {
        componentFormHasError = true;
        return;
      }
      componentValues = val;
    });
    if (componentFormHasError || !componentValues) {
      return;
    }
    shareServiceData.forEach(option => {
      const ID = option.service_id;
      if (option.service_alias !== apptab) {
        return;
      }
      Object.keys(componentValues).forEach(index => {
        const indexarr = index.split('||');
        const firstInfo = indexarr && indexarr.length > 0 && indexarr[0];
        if (!firstInfo) {
          return;
        }
        const isConnect = firstInfo === 'connect';
        const isEnv = firstInfo === 'env';

        if (isConnect && indexarr[2] !== 'random') {
          option.service_connect_info_map_list.forEach(serapp => {
            if (
              serapp.attr_name === indexarr[1] &&
              String(ID) === String(indexarr[3])
            ) {
              serapp[indexarr[2]] = componentValues[index];
              serapp.is_change = true;
            }
          });
        }

        if (isEnv) {
          option.service_env_map_list.forEach(serapp => {
            if (
              serapp.attr_name === indexarr[1] &&
              String(ID) === String(indexarr[2])
            ) {
              serapp.attr_value = componentValues[index];
              serapp.is_change = true;
            }
          });
        }

        if (firstInfo === 'extend' && option.extend_method_map) {
          option.extend_method_map[indexarr[1]] = componentValues[index];
        }
      });
    });
  });

  const selectedShareServices = [];
  selectedShareKeys.forEach(shareKey => {
    shareServiceData.forEach(option => {
      if (shareKey === option.service_share_uuid) {
        selectedShareServices.push(option);
      }
    });
  });

  return {
    componentFormHasError,
    shareServiceData,
    selectedShareServices
  };
};
