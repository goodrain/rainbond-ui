import { formatMessage } from '@/utils/intl';

export const DEFAULT_TAB = 'helm';
export const DEFAULT_TABLE_COLUMN_WIDTH = 160;
export const HELM_WIZARD_STEPS = ['source', 'basic', 'values'];

export const TAB_RESOURCE_MAP = {
  workload: { group: 'apps', version: 'v1', resource: 'deployments' },
  pod: { group: '', version: 'v1', resource: 'pods' },
  network: { group: '', version: 'v1', resource: 'services' },
  config: { group: '', version: 'v1', resource: 'configmaps' },
  storage: { group: '', version: 'v1', resource: 'persistentvolumeclaims' },
};

const buildTabMeta = (tab) => ({
  title: formatMessage({ id: `resourceCenter.tab.${tab}.title` }),
  navDescription: formatMessage({ id: `resourceCenter.tab.${tab}.navDescription` }),
  description: formatMessage({ id: `resourceCenter.tab.${tab}.description` }),
  listTitle: formatMessage({ id: `resourceCenter.tab.${tab}.listTitle` }),
  listDescription: formatMessage({ id: `resourceCenter.tab.${tab}.listDescription` }),
  emptyTitle: formatMessage({ id: `resourceCenter.tab.${tab}.emptyTitle` }),
  emptyDescription: formatMessage({ id: `resourceCenter.tab.${tab}.emptyDescription` }),
  emptyHint: formatMessage({ id: `resourceCenter.tab.${tab}.emptyHint` }),
});

export const getTabMetaMap = () => ({
  helm: {
    ...buildTabMeta('helm'),
    icon: 'helm-custom',
  },
  workload: {
    ...buildTabMeta('workload'),
    icon: 'workload-custom',
  },
  pod: {
    ...buildTabMeta('pod'),
    icon: 'pod-custom',
  },
  network: {
    ...buildTabMeta('network'),
    icon: 'network-custom',
  },
  config: {
    ...buildTabMeta('config'),
    icon: 'config-custom',
  },
  storage: {
    ...buildTabMeta('storage'),
    icon: 'storage-custom',
  },
});

export const TAB_ORDER = ['helm', 'workload', 'pod', 'network', 'config', 'storage'];
