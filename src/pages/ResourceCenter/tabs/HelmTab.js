import React, { PureComponent } from 'react';
import { Table, Popconfirm, Divider } from 'antd';
import { formatMessage } from '@/utils/intl';
import ResourceToolbar from '../components/ResourceToolbar';
import StatusDot from '../components/StatusDot';
import styles from '../index.less';
import { getTablePagination, getTableScroll } from '../helpers';
import { formatToBeijingTime } from '../utils';

class HelmTab extends PureComponent {
  render() {
    const {
      data,
      searchText,
      onSearchChange,
      onRefresh,
      onInstall,
      onDetail,
      onUninstall,
      emptyContent,
    } = this.props;

    const columns = [
      {
        title: formatMessage({ id: 'resourceCenter.common.releaseName' }),
        dataIndex: 'name',
        key: 'name',
        width: 220,
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
        width: 240,
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
        render: (_, record) => (
          <span>
            <a className={styles.resourceLink} onClick={() => onDetail(record)}>{formatMessage({ id: 'resourceCenter.common.detail' })}</a>
            <Divider type="vertical" />
            <Popconfirm title={formatMessage({ id: 'resourceCenter.common.confirmUninstall' }, { name: record.name })} onConfirm={() => onUninstall(record.name)}>
              <a className={styles.resourceLinkDanger}>{formatMessage({ id: 'resourceCenter.common.uninstall' })}</a>
            </Popconfirm>
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
          primaryActionLabel={formatMessage({ id: 'resourceCenter.common.install' })}
          onPrimaryAction={onInstall}
        />
        <Table
          className={styles.resourceTable}
          dataSource={data}
          columns={columns}
          rowKey="name"
          size="middle"
          scroll={getTableScroll(columns)}
          pagination={getTablePagination(data)}
          locale={{ emptyText: emptyContent }}
        />
      </div>
    );
  }
}

export default HelmTab;
