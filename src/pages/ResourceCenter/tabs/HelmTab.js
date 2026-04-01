import React, { PureComponent } from 'react';
import { Table, Popconfirm, Divider } from 'antd';
import { formatMessage } from '@/utils/intl';
import ResourceToolbar from '../components/ResourceToolbar';
import AsyncTextAction from '../components/AsyncTextAction';
import StatusDot from '../components/StatusDot';
import styles from '../index.less';
import { getTablePagination, getTableScroll } from '../helpers';
import { formatToBeijingTime } from '../utils';

const HELM_TABLE_SCROLL_X = 1180;

class HelmTab extends PureComponent {
  render() {
    const {
      data,
      searchText,
      onSearchChange,
      onRefresh,
      refreshLoading,
      onInstall,
      onDetail,
      onUninstall,
      uninstallingName,
      emptyContent,
    } = this.props;

    const columns = [
      {
        title: formatMessage({ id: 'resourceCenter.common.releaseName' }),
        dataIndex: 'name',
        key: 'name',
        width: 220,
        fixed: 'left',
        render: (text, record) => (
          <span className={styles.resourceLink} onClick={() => onDetail(record)}>
            {text}
          </span>
        ),
      },
      {
        title: formatMessage({ id: 'resourceCenter.common.chart' }),
        dataIndex: 'chart',
        key: 'chart',
        render: (value, record) => (
          <span>
            <span className={styles.metricValueDefault}>{value || '-'}</span>
            {record.chart_version && <span className={styles.chartVersionText}>@{record.chart_version}</span>}
          </span>
        ),
      },
      { title: formatMessage({ id: 'resourceCenter.common.status' }), dataIndex: 'status', key: 'status', width: 120, render: value => <StatusDot status={value} /> },
      { title: formatMessage({ id: 'resourceCenter.common.version' }), dataIndex: 'version', key: 'version', width: 100, align: 'center', render: value => value || '-' },
      { title: formatMessage({ id: 'resourceCenter.common.namespace' }), dataIndex: 'namespace', key: 'namespace', width: 180, render: value => <code className={styles.monoCode}>{value || '-'}</code> },
      {
        title: formatMessage({ id: 'resourceCenter.common.updatedAt' }),
        dataIndex: 'updated',
        key: 'updated',
        width: 180,
        render: value => <span className={styles.tableAuxText}>{formatToBeijingTime(value)}</span>,
      },
      {
        title: formatMessage({ id: 'resourceCenter.common.operation' }),
        key: 'action',
        width: 140,
        fixed: 'right',
        render: (_, record) => (
          <span>
            <a className={styles.resourceLink} onClick={() => onDetail(record)}>{formatMessage({ id: 'resourceCenter.common.detail' })}</a>
            <Divider type="vertical" />
            {uninstallingName === record.name ? (
              <AsyncTextAction loading danger>
                {formatMessage({ id: 'resourceCenter.common.uninstall' })}
              </AsyncTextAction>
            ) : (
              <Popconfirm title={formatMessage({ id: 'resourceCenter.common.confirmUninstall' }, { name: record.name })} onConfirm={() => onUninstall(record.name)}>
                <AsyncTextAction danger>
                  {formatMessage({ id: 'resourceCenter.common.uninstall' })}
                </AsyncTextAction>
              </Popconfirm>
            )}
          </span>
        ),
      },
    ];

    return (
      <div>
        <ResourceToolbar
          searchPlaceholder={formatMessage({ id: 'resourceCenter.search.helm' })}
          searchText={searchText}
          onSearchChange={onSearchChange}
          onRefresh={onRefresh}
          refreshLoading={refreshLoading}
          primaryActionLabel={formatMessage({ id: 'resourceCenter.common.install' })}
          onPrimaryAction={onInstall}
        />
        <Table
          className={styles.resourceTable}
          dataSource={data}
          columns={columns}
          rowKey="name"
          size="middle"
          loading={refreshLoading}
          scroll={getTableScroll(HELM_TABLE_SCROLL_X)}
          pagination={getTablePagination(data)}
          locale={{ emptyText: emptyContent }}
        />
      </div>
    );
  }
}

export default HelmTab;
