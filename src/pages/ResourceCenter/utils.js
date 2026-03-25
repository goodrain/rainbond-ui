import { formatMessage } from '@/utils/intl';

const moment = require('moment');
const theme = require('../../../config/theme');

const getWorkloadKindOptions = () => ([
  { label: formatMessage({ id: 'resourceCenter.workloadKind.deployment' }), value: 'deployments', group: 'apps', kind: 'Deployment' },
  { label: formatMessage({ id: 'resourceCenter.workloadKind.statefulset' }), value: 'statefulsets', group: 'apps', kind: 'StatefulSet' },
  { label: formatMessage({ id: 'resourceCenter.workloadKind.daemonset' }), value: 'daemonsets', group: 'apps', kind: 'DaemonSet' },
  { label: formatMessage({ id: 'resourceCenter.workloadKind.cronjob' }), value: 'cronjobs', group: 'batch', kind: 'CronJob' },
]);

const STATUS_MESSAGE_MAP = {
  running: 'resourceCenter.status.running',
  active: 'resourceCenter.status.running',
  ready: 'resourceCenter.status.ready',
  available: 'resourceCenter.status.available',
  bound: 'resourceCenter.status.bound',
  deployed: 'resourceCenter.status.deployed',
  succeeded: 'resourceCenter.status.completed',
  completed: 'resourceCenter.status.completed',
  pending: 'resourceCenter.status.pending',
  warning: 'resourceCenter.status.warning',
  starting: 'resourceCenter.status.starting',
  creating: 'resourceCenter.status.creating',
  containercreating: 'resourceCenter.status.creating',
  podinitializing: 'resourceCenter.status.initializing',
  terminating: 'resourceCenter.status.terminating',
  uninstalling: 'resourceCenter.status.uninstalling',
  superseded: 'resourceCenter.status.superseded',
  failed: 'resourceCenter.status.failed',
  error: 'resourceCenter.status.failed',
  abnormal: 'resourceCenter.status.failed',
  crashloopbackoff: 'resourceCenter.status.failed',
  imagepullbackoff: 'resourceCenter.status.imagePullFailed',
  errimagepull: 'resourceCenter.status.imagePullFailed',
  unknown: 'resourceCenter.status.unknown',
  terminated: 'resourceCenter.status.terminated',
};

const STATUS_TONE_MAP = {
  running: 'running',
  active: 'running',
  ready: 'running',
  available: 'running',
  bound: 'running',
  deployed: 'running',
  succeeded: 'running',
  completed: 'running',
  pending: 'warning',
  warning: 'warning',
  starting: 'warning',
  creating: 'warning',
  containercreating: 'warning',
  podinitializing: 'warning',
  terminating: 'warning',
  uninstalling: 'warning',
  superseded: 'default',
  failed: 'error',
  error: 'error',
  abnormal: 'error',
  crashloopbackoff: 'error',
  imagepullbackoff: 'error',
  errimagepull: 'error',
  unknown: 'default',
  terminated: 'default',
};

const STATUS_COLOR_MAP = {
  running: theme['rbd-success-status'],
  active: theme['rbd-success-status'],
  ready: theme['rbd-success-status'],
  available: theme['rbd-success-status'],
  bound: theme['primary-color'],
  deployed: theme['rbd-success-status'],
  succeeded: theme['rbd-success-status'],
  completed: theme['rbd-success-status'],
  pending: theme['rbd-warning-status'],
  warning: theme['rbd-warning-status'],
  starting: theme['rbd-warning-status'],
  creating: theme['rbd-warning-status'],
  containercreating: theme['rbd-warning-status'],
  podinitializing: theme['rbd-warning-status'],
  terminating: theme['rbd-warning-status'],
  uninstalling: theme['rbd-warning-status'],
  superseded: theme['rbd-label-color'],
  failed: theme['rbd-error-status'],
  error: theme['rbd-error-status'],
  abnormal: theme['rbd-error-status'],
  crashloopbackoff: theme['rbd-error-status'],
  imagepullbackoff: theme['rbd-error-status'],
  errimagepull: theme['rbd-error-status'],
  unknown: theme['rbd-label-color'],
  terminated: theme['rbd-label-color'],
};

function normalizeValue(value) {
  return (value || '').toString().trim().toLowerCase();
}

export function formatToBeijingTime(value, fallback = '-') {
  if (!value) {
    return fallback;
  }
  const parsed = moment(value);
  if (!parsed.isValid()) {
    return value || fallback;
  }
  return parsed.utcOffset(8 * 60).format('YYYY-MM-DD HH:mm:ss');
}

export function getResourceStatusMeta(status) {
  const normalized = normalizeValue(status);
  const messageId = STATUS_MESSAGE_MAP[normalized];
  return {
    color: STATUS_COLOR_MAP[normalized] || theme['rbd-label-color'],
    text: messageId ? formatMessage({ id: messageId }) : (status || '-'),
    tone: STATUS_TONE_MAP[normalized] || 'default',
  };
}

export function getResourceStatusText(status) {
  return getResourceStatusMeta(status).text;
}

export function getResourceStatusTone(status) {
  return getResourceStatusMeta(status).tone;
}

export function getWorkloadKindLabel(value) {
  const normalized = normalizeValue(value);
  const matched = getWorkloadKindOptions().find(item => (
    normalizeValue(item.value) === normalized || normalizeValue(item.kind) === normalized
  ));
  return matched ? matched.label : value || '-';
}

export { getWorkloadKindOptions };
