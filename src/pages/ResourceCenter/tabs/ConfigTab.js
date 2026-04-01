import React, { PureComponent } from 'react';
import { Table, Tag, Popconfirm, Divider } from 'antd';
import { formatMessage } from '@/utils/intl';
import ResourceToolbar from '../components/ResourceToolbar';
import styles from '../index.less';
import { getTablePagination, getTableScroll } from '../helpers';
import { formatToBeijingTime } from '../utils';


const CONFIG_TABLE_SCROLL_X = 800;

class ConfigTab extends PureComponent {
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
        render: (text, record) => (
          <span
            className={styles.resourceLink}
            onClick={() => onEditYaml(record)}
          >
            {text}
          </span>
        ),
      },
      {
        title: formatMessage({ id: 'resourceCenter.common.type' }),
        dataIndex: 'kind',
        key: 'kind',
        width: 140,
        render: value => <Tag className={`${styles.smallTag} ${value === 'Secret' ? styles.tagWarning : styles.tagInfo}`}>{value || 'ConfigMap'}</Tag>,
      },
      { title: formatMessage({ id: 'resourceCenter.common.dataItems' }), dataIndex: 'data_count', key: 'data_count', width: 120, align: 'center', render: value => value !== undefined ? value : '-' },
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
          searchPlaceholder={formatMessage({ id: 'resourceCenter.search.config' })}
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
          scroll={getTableScroll(CONFIG_TABLE_SCROLL_X)}
          pagination={getTablePagination(data)}
          locale={{ emptyText: emptyContent }}
        />
      </div>
    );
  }
}

export default ConfigTab;
