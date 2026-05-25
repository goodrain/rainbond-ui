import React, { PureComponent } from 'react';
import { Table, Tag, Popconfirm, Divider, Tabs } from 'antd';
import { formatMessage } from '@/utils/intl';
import ResourceToolbar from '../components/ResourceToolbar';
import AsyncTextAction from '../components/AsyncTextAction';
import styles from '../index.less';
import { getTablePagination, getTableScroll } from '../helpers';
import { formatBrowserLocalTime } from '../utils';

const { TabPane } = Tabs;

const SERVICE_TABLE_SCROLL_X = 1250;
const INGRESS_TABLE_SCROLL_X = 1120;

const isIngressResource = record => ((record && record.kind) || '').toLowerCase() === 'ingress';

const renderTagList = (values, className) => {
  const list = (Array.isArray(values) ? values : []).filter(Boolean);
  if (list.length === 0) {
    return <span className={styles.resourceLinkMuted}>-</span>;
  }
  return list.map(value => (
    <Tag key={value} className={`${styles.smallTag} ${className || styles.tagInfo}`}>{value}</Tag>
  ));
};

const renderServicePorts = (record) => {
  const ports = Array.isArray(record.ports) ? record.ports : [];
  if (ports.length === 0) {
    return <span className={styles.resourceLinkMuted}>-</span>;
  }
  return ports.map((port, index) => (
    <Tag key={index} className={`${styles.smallTag} ${styles.tagPrimary}`}>{port.port}/{port.protocol || 'TCP'}</Tag>
  ));
};

const renderServiceSelector = (record) => {
  return record.selector
    ? Object.entries(record.selector).map(([key, selectorValue]) => (
      <Tag key={key} className={`${styles.smallTag} ${styles.tagInfo}`}>{key}={selectorValue}</Tag>
    ))
    : <span className={styles.resourceLinkMuted}>-</span>;
};

class NetworkTab extends PureComponent {
  render() {
    const {
      data,
      searchText,
      onSearchChange,
      onRefresh,
      refreshLoading,
      onCreate,
      onDetail,
      onEditYaml,
      onDelete,
      deletingName,
      yamlLoadingName,
      emptyContent,
    } = this.props;

    const serviceData = (data || []).filter(record => !isIngressResource(record));
    const ingressData = (data || []).filter(isIngressResource);

    const renderActions = record => (
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
    );

    const serviceColumns = [
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
        key: 'ports',
        width: 220,
        render: (_, record) => renderServicePorts(record),
      },
      {
        title: formatMessage({ id: 'resourceCenter.common.selector' }),
        key: 'selector',
        render: (_, record) => renderServiceSelector(record),
      },
      {
        title: formatMessage({ id: 'resourceCenter.common.createdAt' }),
        dataIndex: 'created_at',
        key: 'created_at',
        width: 180,
        render: value => <span className={styles.tableAuxText}>{formatBrowserLocalTime(value)}</span>,
      },
      {
        title: formatMessage({ id: 'resourceCenter.common.operation' }),
        key: 'action',
        width: 140,
        fixed: 'right',
        render: (_, record) => renderActions(record),
      },
    ];

    const ingressColumns = [
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
      { title: formatMessage({ id: 'resourceCenter.tab.network.ingressClass', defaultMessage: 'IngressClass' }), dataIndex: 'ingress_class', key: 'ingress_class', width: 160, render: value => value ? <Tag className={`${styles.smallTag} ${styles.tagInfo}`}>{value}</Tag> : <span className={styles.resourceLinkMuted}>-</span> },
      {
        title: formatMessage({ id: 'resourceCenter.tab.network.hosts', defaultMessage: 'Hosts' }),
        dataIndex: 'hosts',
        key: 'hosts',
        render: value => renderTagList(value, styles.tagInfo),
      },
      {
        title: formatMessage({ id: 'resourceCenter.tab.network.tlsHosts', defaultMessage: 'TLS Hosts' }),
        dataIndex: 'tls_hosts',
        key: 'tls_hosts',
        render: value => renderTagList(value, styles.tagInfo),
      },
      {
        title: formatMessage({ id: 'resourceCenter.tab.network.backendServices', defaultMessage: 'Backend Services' }),
        dataIndex: 'backend_services',
        key: 'backend_services',
        width: 220,
        render: value => renderTagList(value, styles.tagPrimary),
      },
      {
        title: formatMessage({ id: 'resourceCenter.common.createdAt' }),
        dataIndex: 'created_at',
        key: 'created_at',
        width: 180,
        render: value => <span className={styles.tableAuxText}>{formatBrowserLocalTime(value)}</span>,
      },
      {
        title: formatMessage({ id: 'resourceCenter.common.operation' }),
        key: 'action',
        width: 140,
        fixed: 'right',
        render: (_, record) => renderActions(record),
      },
    ];

    return (
      <div>
        <ResourceToolbar
          searchPlaceholder={formatMessage({ id: 'resourceCenter.search.network' })}
          searchText={searchText}
          onSearchChange={onSearchChange}
          onRefresh={onRefresh}
          refreshLoading={refreshLoading}
          primaryActionLabel={formatMessage({ id: 'resourceCenter.common.createResource' })}
          onPrimaryAction={onCreate}
        />
        <Tabs defaultActiveKey="services" animated={false}>
          <TabPane tab={`${formatMessage({ id: 'resourceCenter.tab.network.services', defaultMessage: 'Services' })} (${serviceData.length})`} key="services">
            <Table
              className={styles.resourceTable}
              dataSource={serviceData}
              columns={serviceColumns}
              rowKey={record => `Service-${record.name}`}
              size="middle"
              loading={refreshLoading}
              scroll={getTableScroll(SERVICE_TABLE_SCROLL_X)}
              pagination={getTablePagination(serviceData)}
              locale={{ emptyText: emptyContent }}
            />
          </TabPane>
          <TabPane tab={`${formatMessage({ id: 'resourceCenter.tab.network.ingresses', defaultMessage: 'Ingresses' })} (${ingressData.length})`} key="ingresses">
            <Table
              className={styles.resourceTable}
              dataSource={ingressData}
              columns={ingressColumns}
              rowKey={record => `Ingress-${record.name}`}
              size="middle"
              loading={refreshLoading}
              scroll={getTableScroll(INGRESS_TABLE_SCROLL_X)}
              pagination={getTablePagination(ingressData)}
              locale={{ emptyText: emptyContent }}
            />
          </TabPane>
        </Tabs>
      </div>
    );
  }
}

export default NetworkTab;
