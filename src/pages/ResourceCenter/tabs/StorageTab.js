import React, { PureComponent } from 'react';
import { Table, Tag, Popconfirm, Divider } from 'antd';
import { formatMessage } from '@/utils/intl';
import ResourceToolbar from '../components/ResourceToolbar';
import StatusDot from '../components/StatusDot';
import styles from '../index.less';
import { getTablePagination, getTableScroll } from '../helpers';
import { formatToBeijingTime } from '../utils';

class StorageTab extends PureComponent {
  render() {
    const {
      data,
      searchText,
      onSearchChange,
      onRefresh,
      onCreate,
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
        render: (text, record) => (
          <span className={styles.resourceLink} onClick={() => onEditYaml(record)}>
            {text}
          </span>
        ),
      },
      { title: formatMessage({ id: 'resourceCenter.common.status' }), dataIndex: 'status', key: 'status', width: 120, render: value => <StatusDot status={value} /> },
      { title: formatMessage({ id: 'platformResources.common.capacity' }), dataIndex: 'storage', key: 'storage', width: 100, render: value => value ? <Tag className={styles.tagPrimary}>{value}</Tag> : '-' },
      {
        title: formatMessage({ id: 'resourceCenter.common.accessModes' }),
        dataIndex: 'access_modes',
        key: 'access_modes',
        width: 180,
        render: modes => (Array.isArray(modes) ? modes : [modes].filter(Boolean)).map(mode => (
          <Tag key={mode} className={`${styles.smallTag} ${styles.tagInfo}`}>{mode}</Tag>
        )),
      },
      { title: formatMessage({ id: 'platformResources.common.storageClass' }), dataIndex: 'storage_class', key: 'storage_class', width: 180, render: value => value || <span className={styles.resourceLinkMuted}>-</span> },
      { title: formatMessage({ id: 'resourceCenter.common.boundPv' }), dataIndex: 'volume_name', key: 'volume_name', width: 180, render: value => value || <span className={styles.resourceLinkMuted}>-</span> },
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
        render: (_, record) => (
          <span>
            <a className={styles.resourceLinkSecondary} onClick={() => onEditYaml(record)}>{formatMessage({ id: 'resourceCenter.common.yaml' })}</a>
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
          searchPlaceholder={formatMessage({ id: 'resourceCenter.search.storage' })}
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
          scroll={getTableScroll(columns)}
          pagination={getTablePagination(data)}
          locale={{ emptyText: emptyContent }}
        />
      </div>
    );
  }
}

export default StorageTab;
