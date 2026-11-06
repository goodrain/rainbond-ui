import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Select, Empty } from 'antd';
import { routerRedux } from 'dva/router';
import { formatMessage } from '@/utils/intl';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import EnterprisePluginsPage from '../../components/EnterprisePluginsPage';
import { bundledDiskCleanupRegions } from '../../utils/enterpriseDiskCleanup';

@connect(({ global, region }) => ({ pluginsList: global.pluginsList, clusters: region.cluster_info }))
export default class EnterpriseDiskCleanup extends PureComponent {
  render() {
    const { pluginsList, clusters, match, location, dispatch } = this.props;
    const regions = bundledDiskCleanupRegions(pluginsList);
    const selected = new URLSearchParams(location.search || '').get('regionName');
    const regionName = regions.includes(selected) ? selected : regions[0];
    return <PageHeaderLayout title={formatMessage({ id: 'menu.enterprise.disk_cleanup' })}
      extraContent={regions.length > 1 && <Select value={regionName} style={{ width: 160 }} onChange={value => dispatch(
        routerRedux.push(`/enterprise/${match.params.eid}/disk-cleanup?regionName=${encodeURIComponent(value)}`)
      )}>{regions.map(region => <Select.Option key={region} value={region}>
        {(clusters || []).find(cluster => cluster.region_name === region)?.region_alias || region}
      </Select.Option>)}</Select>}>
      {regionName ? <EnterprisePluginsPage key={regionName} regionName={regionName} type="DiskCleanup"
        componentData={{ regionName }} /> : <Empty description={formatMessage({ id: 'menu.enterprise.disk_cleanup_unavailable' })} />}
    </PageHeaderLayout>;
  }
}
