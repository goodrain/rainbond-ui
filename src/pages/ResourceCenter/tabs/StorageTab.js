import React, { PureComponent } from 'react';
import { Table, Tag, Popconfirm, Divider } from 'antd';
import { formatMessage } from '@/utils/intl';
import ResourceToolbar from '../components/ResourceToolbar';
import AsyncTextAction from '../components/AsyncTextAction';
import StatusDot from '../components/StatusDot';
import styles from '../index.less';
import { getTablePagination, getTableScroll } from '../helpers';
import { formatToBeijingTime } from '../utils';

const STORAGE_TABLE_SCROLL_X = 1300;

class StorageTab extends PureComponent {
  render() {
    const {
      data,
      searchText,
      onSearchChange,
      onRefresh,
      refreshLoading,
      onCreate,
      onEditYaml,
      onDelete,
      deletingName,
      yamlLoadingName,
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
          <AsyncTextAction loading={yamlLoadingName === record.name} onClick={() => onEditYaml(record)}>
            {text}
          </AsyncTextAction>
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
      { title: formatMessage({ id: 'platformResources.common.storageClass' }), dataIndex: 'storage_class', key: 'storage_class', render: value => value || <span className={styles.resourceLinkMuted}>-</span> },
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
        fixed: 'right',
        render: (_, record) => (
          <span>
            <AsyncTextAction loading={yamlLoadingName === record.name} onClick={() => onEditYaml(record)}>
              {formatMessage({ id: 'resourceCenter.common.edit' })}
            </AsyncTextAction>
            <Divider type="vertical" />
            {deletingName === record.name ? (
              <AsyncTextAction loading danger>
                {formatMessage({ id: 'resourceCenter.common.delete' })}
              </AsyncTextAction>
            ) : (
              <Popconfirm title={formatMessage({ id: 'resourceCenter.common.confirmDelete' }, { name: record.name })} onConfirm={() => onDelete(record)}>
                <AsyncTextAction danger>
                  {formatMessage({ id: 'resourceCenter.common.delete' })}
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
          searchPlaceholder={formatMessage({ id: 'resourceCenter.search.storage' })}
          searchText={searchText}
          onSearchChange={onSearchChange}
          onRefresh={onRefresh}
          refreshLoading={refreshLoading}
          primaryActionLabel={formatMessage({ id: 'resourceCenter.common.createResource' })}
          onPrimaryAction={onCreate}
        />
        <Table
          className={styles.resourceTable}
          dataSource={data}
          columns={columns}
          rowKey="name"
          size="middle"
          loading={refreshLoading}
          scroll={getTableScroll(STORAGE_TABLE_SCROLL_X)}
          pagination={getTablePagination(data)}
          locale={{ emptyText: emptyContent }}
        />
      </div>
    );
  }
}

export default StorageTab;
