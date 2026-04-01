import React, { PureComponent } from 'react';
import { Table, Popconfirm, Divider } from 'antd';
import { formatMessage } from '@/utils/intl';
import ResourceToolbar from '../components/ResourceToolbar';
import StatusDot from '../components/StatusDot';
import styles from '../index.less';
import { getTablePagination, getTableScroll } from '../helpers';
import { formatToBeijingTime } from '../utils';

const POD_TABLE_SCROLL_X = 1220;

class PodTab extends PureComponent {
  render() {
    const {
      data,
      searchText,
      onSearchChange,
      onRefresh,
      onCreate,
      onDetail,
      onDelete,
      emptyContent,
    } = this.props;

    const columns = [
      {
        title: formatMessage({ id: 'resourceCenter.common.name' }),
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
      { title: formatMessage({ id: 'resourceCenter.common.status' }), dataIndex: 'status', key: 'status', width: 120, render: value => <StatusDot status={value} /> },
      { title: formatMessage({ id: 'resourceCenter.common.node' }), dataIndex: 'node', key: 'node', width: 140, render: value => value || <span className={styles.resourceLinkMuted}>-</span> },
      {
        title: formatMessage({ id: 'resourceCenter.common.restarts' }),
        dataIndex: 'restart_count',
        key: 'restart_count',
        width: 90,
        align: 'center',
        render: value => value !== undefined ? <span className={value > 3 ? styles.resourceLinkDanger : styles.metricValueDefault}>{value}</span> : '-',
      },
      { title: formatMessage({ id: 'resourceCenter.common.ownerWorkload' }), dataIndex: 'owner', key: 'owner', render: value => value || <span className={styles.resourceLinkMuted}>-</span> },
      { title: 'IP', dataIndex: 'pod_ip', key: 'pod_ip', width: 150, render: value => <code className={styles.monoCode}>{value || '-'}</code> },
      {
        title: formatMessage({ id: 'resourceCenter.common.createdAt' }),
        dataIndex: 'created_at',
        key: 'created_at',
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
            <Popconfirm title={formatMessage({ id: 'resourceCenter.common.confirmDelete' }, { name: record.name })} onConfirm={() => onDelete(record)}>
              <a className={styles.resourceLinkDanger}>{formatMessage({ id: 'resourceCenter.common.delete' })}</a>
            </Popconfirm>
          </span>
        ),
      },
    ];

    return (
      <div>
        <ResourceToolbar
          searchPlaceholder={formatMessage({ id: 'resourceCenter.search.pod' })}
          searchText={searchText}
          onSearchChange={onSearchChange}
          onRefresh={onRefresh}
          primaryActionLabel={formatMessage({ id: 'resourceCenter.common.createResource' })}
          onPrimaryAction={onCreate}
        />
        <Table
          className={styles.resourceTable}
          dataSource={data}
          columns={columns}
          rowKey="name"
          size="middle"
          scroll={getTableScroll(POD_TABLE_SCROLL_X)}
          pagination={getTablePagination(data)}
          locale={{ emptyText: emptyContent }}
        />
      </div>
    );
  }
}

export default PodTab;
