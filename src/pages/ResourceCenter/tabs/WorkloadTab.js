import React, { PureComponent } from 'react';
import { Table, Tag, Popconfirm, Divider, Select } from 'antd';
import { formatMessage } from '@/utils/intl';
import ResourceToolbar from '../components/ResourceToolbar';
import AsyncTextAction from '../components/AsyncTextAction';
import StatusDot from '../components/StatusDot';
import styles from '../index.less';
import { getTablePagination, getTableScroll } from '../helpers';
import { getWorkloadKindOptions, getWorkloadKindLabel, formatToBeijingTime } from '../utils';

const { Option } = Select;
const WORKLOAD_TABLE_SCROLL_X = 940;

class WorkloadTab extends PureComponent {
  render() {
    const {
      data,
      workloadKind,
      searchText,
      onSearchChange,
      onRefresh,
      refreshLoading,
      onCreate,
      onWorkloadKindChange,
      onDetail,
      onDelete,
      deletingName,
      emptyContent,
    } = this.props;

    const columns = [
      {
        title: formatMessage({ id: 'resourceCenter.common.name' }),
        dataIndex: 'name',
        key: 'name',
        render: (text, record) => (
          <span>
            <span className={styles.resourceLink} onClick={() => onDetail(record)}>{text}</span>
            {record.source === 'helm' && <Tag className={`${styles.smallTag} ${styles.tagPrimary}`} style={{ marginLeft: 8 }}>Helm</Tag>}
          </span>
        ),
      },
      {
        title: formatMessage({ id: 'resourceCenter.common.type' }),
        dataIndex: 'kind',
        key: 'kind',
        width: 140,
        render: value => (
          <code className={styles.inlineCodePill}>
            {getWorkloadKindLabel(value || workloadKind)}
          </code>
        ),
      },
      {
        title: formatMessage({ id: 'resourceCenter.common.status' }),
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: value => <StatusDot status={value} />,
      },
      {
        title: formatMessage({ id: 'resourceCenter.common.replicas' }),
        dataIndex: 'replicas',
        key: 'replicas',
        width: 120,
        render: (value, record) => {
          const ready = record.ready_replicas !== undefined ? record.ready_replicas : value;
          const total = value;
          if (total === undefined) return '-';
          return <span className={ready < total ? styles.metricValueWarning : styles.metricValueRunning}>{ready}/{total}</span>;
        },
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
        render: (_, record) => (
          <span>
            <a className={styles.resourceLink} onClick={() => onDetail(record)}>{formatMessage({ id: 'resourceCenter.common.detail' })}</a>
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
    const workloadKindOptions = getWorkloadKindOptions();

    return (
      <div>
        <ResourceToolbar
          leftContent={(
            <Select value={workloadKind} onChange={onWorkloadKindChange} className={styles.toolbarSelect}>
              {workloadKindOptions.map(item => (
                <Option key={item.value} value={item.value}>{item.label}</Option>
              ))}
            </Select>
          )}
          searchPlaceholder={formatMessage({ id: 'resourceCenter.search.workload' })}
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
          scroll={getTableScroll(WORKLOAD_TABLE_SCROLL_X)}
          pagination={getTablePagination(data)}
          locale={{ emptyText: emptyContent }}
        />
      </div>
    );
  }
}

export default WorkloadTab;
