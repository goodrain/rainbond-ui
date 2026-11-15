import React from 'react';
import { Alert, Button } from 'antd';
import { formatMessage } from '@/utils/intl';

const text = key => formatMessage({ id: `componentOverview.vmStorageSnapshot.${key}` });

// Presentation only. The caller maps the frozen backend authority contract;
// neither storage names nor provisioner strings are interpreted here.
export default function VMStorageSnapshotHint({ state = 'unknown', mode = 'creation', selected = true,
  blockingDisks = [], onRetry, refreshing = false }) {
  const allowed = ['supported', 'unsupported', 'unknown', 'loading', 'failed'];
  const status = selected ? allowed.includes(state) ? state : 'unknown' : 'unselected';
  const component = mode === 'component';
  const type = status === 'unsupported' ? 'warning' : status === 'failed' ? 'warning' : status === 'supported' ? 'success' : 'info';
  const blocked = status === 'unsupported' && component
    ? blockingDisks.filter(value => typeof value === 'string' && value.length <= 128).join('、') : '';
  return <Alert type={type} showIcon message={text(`${component ? 'component' : 'creation'}.${status}`)}
    description={<span>
      {blocked && <span>{text('blockingDisks')}{blocked} </span>}
      {component ? text('restorePlanIndependent') : text('ordinaryCreationAllowed')}
      {onRetry && status !== 'unselected' && <Button type="link" size="small" disabled={status === 'loading'} loading={refreshing} onClick={onRetry}>{text('retry')}</Button>}
    </span>} />;
}
