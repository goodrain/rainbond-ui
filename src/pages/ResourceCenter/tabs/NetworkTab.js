import React, { PureComponent } from 'react';
import { Table, Tag, Popconfirm, Divider } from 'antd';
import { formatMessage } from '@/utils/intl';
import ResourceToolbar from '../components/ResourceToolbar';
import styles from '../index.less';
import { getTablePagination, getTableScroll } from '../helpers';
import { formatToBeijingTime } from '../utils';

const NETWORK_TABLE_SCROLL_X = 1250;

class NetworkTab extends PureComponent {
  render() {
    const {
      data,
      searchText,
      onSearchChange,
      onRefresh,
      onCreate,
      onDetail,
      onEditYaml,
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
      { title: formatMessage({ id: 'resourceCenter.common.type' }), dataIndex: 'type', key: 'type', width: 120, render: value => <Tag>{value || 'ClusterIP'}</Tag> },
      { title: formatMessage({ id: 'resourceCenter.detail.clusterIp', defaultMessage: 'Cluster IP' }), dataIndex: 'cluster_ip', key: 'cluster_ip', width: 150, render: value => <code className={styles.monoCode}>{value || '-'}</code> },
      {
        title: formatMessage({ id: 'resourceCenter.common.ports' }),
        dataIndex: 'ports',
        key: 'ports',
        width: 220,
        render: ports => (Array.isArray(ports) ? ports : []).map((port, index) => (
          <Tag key={index} className={`${styles.smallTag} ${styles.tagPrimary}`}>{port.port}/{port.protocol || 'TCP'}</Tag>
        )),
      },
      {
        title: formatMessage({ id: 'resourceCenter.common.selector' }),
        dataIndex: 'selector',
        key: 'selector',
        render: value => value
          ? Object.entries(value).map(([key, selectorValue]) => (
            <Tag key={key} className={`${styles.smallTag} ${styles.tagInfo}`}>{key}={selectorValue}</Tag>
          ))
          : <span className={styles.resourceLinkMuted}>-</span>,
      },
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
            <a className={styles.resourceLink} onClick={() => onEditYaml(record)}>{formatMessage({ id: 'resourceCenter.common.edit' })}</a>
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
          searchPlaceholder={formatMessage({ id: 'resourceCenter.search.network' })}
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
          scroll={getTableScroll(NETWORK_TABLE_SCROLL_X)}
          pagination={getTablePagination(data)}
          locale={{ emptyText: emptyContent }}
        />
      </div>
    );
  }
}

export default NetworkTab;
