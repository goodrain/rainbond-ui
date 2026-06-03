import { formatMessage } from '@/utils/intl';
import snapshotVersionHelpers from './snapshotVersionHelpers';

const {
  DEFAULT_SNAPSHOT_VERSION,
  buildNextSnapshotVersion
} = snapshotVersionHelpers;
const { collectShareServiceData } = require('./appShareFormHelpers');

export {
  DEFAULT_SNAPSHOT_VERSION,
  buildNextSnapshotVersion,
  collectShareServiceData
};

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
