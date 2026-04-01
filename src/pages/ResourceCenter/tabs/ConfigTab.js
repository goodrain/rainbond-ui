import React, { PureComponent } from 'react';
import { Table, Tag, Popconfirm, Divider } from 'antd';
import { formatMessage } from '@/utils/intl';
import ResourceToolbar from '../components/ResourceToolbar';
import AsyncTextAction from '../components/AsyncTextAction';
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
        render: (text, record) => (
          <AsyncTextAction
            loading={yamlLoadingName === record.name}
            onClick={() => onEditYaml(record)}
          >
            {text}
          </AsyncTextAction>
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
          searchPlaceholder={formatMessage({ id: 'resourceCenter.search.config' })}
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
          scroll={getTableScroll(CONFIG_TABLE_SCROLL_X)}
          pagination={getTablePagination(data)}
          locale={{ emptyText: emptyContent }}
        />
      </div>
    );
  }
}

export default ConfigTab;
