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
