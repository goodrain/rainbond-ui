import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { formatMessage } from '@/utils/intl';
import CodeMirrorForm from '@/components/CodeMirrorForm';
import {
  Button,
  Card,
  Empty,
  notification,
  Spin,
  Table,
  Tabs,
  Tag,
} from 'antd';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import jsYaml from 'js-yaml';
import ResourceBreadcrumbTitle from './components/ResourceBreadcrumbTitle';
import styles from './detail.less';
import { openInNewTab } from '../../utils/utils';
import { formatToBeijingTime } from './utils';

const { TabPane } = Tabs;
const t = (id, defaultMessage, values) => formatMessage({ id, defaultMessage }, values);

function safeYaml(value) {
  if (!value) {
    return '';
  }
  const resource = JSON.parse(JSON.stringify(value));
  if (resource.metadata && resource.metadata.managedFields) {
    delete resource.metadata.managedFields;
  }
  return jsYaml.dump(resource, { noRefs: true, lineWidth: 120 });
}

function formatMapTags(entries) {
  const data = entries || {};
  const keys = Object.keys(data);
  if (keys.length === 0) {
    return '-';
  }
  return (
    <div className={styles.tagList}>
      {keys.map(key => <Tag key={key}>{`${key}=${data[key]}`}</Tag>)}
    </div>
  );
}

function formatClusterAddress(spec = {}) {
  if (spec.type === 'ExternalName') {
    return spec.externalName || '-';
  }
  if (Array.isArray(spec.clusterIPs) && spec.clusterIPs.length > 0) {
    return spec.clusterIPs.join(' , ');
  }
  return spec.clusterIP || '-';
}

function formatExternalAccess(service = {}) {
  const spec = service.spec || {};
  const status = service.status || {};
  const externalIPs = spec.externalIPs || [];
  const lbIngress = (((status || {}).loadBalancer || {}).ingress) || [];
  const values = [];

  externalIPs.forEach(item => {
    if (item) {
      values.push(item);
    }
  });
  lbIngress.forEach(item => {
    if (item.hostname) {
      values.push(item.hostname);
    } else if (item.ip) {
      values.push(item.ip);
    }
  });

  return values.length > 0 ? values.join(' , ') : '-';
}

function getBrowserAccessScheme(port = {}) {
  const hints = [
    port.name,
    port.appProtocol,
    port.targetPort,
    port.port,
  ]
    .filter(item => item !== undefined && item !== null && item !== '')
    .join(' ')
    .toLowerCase();

  if (hints.indexOf('https') > -1 || Number(port.port) === 443 || Number(port.targetPort) === 443) {
    return 'https';
  }
  if (hints.indexOf('http') > -1 || Number(port.port) === 80 || Number(port.targetPort) === 80) {
    return 'http';
  }
  if (typeof window !== 'undefined' && window.location && window.location.protocol) {
    return window.location.protocol.replace(':', '') || 'http';
  }
  return 'http';
}

function normalizeHostname(hostname = '') {
  if (!hostname) {
    return '';
  }
  if (hostname.indexOf(':') > -1 && hostname.charAt(0) !== '[') {
    return `[${hostname}]`;
  }
  return hostname;
}

function buildNodePortAccessUrl(port = {}) {
  if (!port || !port.nodePort) {
    return '';
  }
  if (typeof window === 'undefined' || !window.location) {
    return '';
  }
  const hostname = normalizeHostname(window.location.hostname || '');
  if (!hostname) {
    return '';
  }
  return `${getBrowserAccessScheme(port)}://${hostname}:${port.nodePort}`;
}

function buildEndpointRows(endpoints) {
  const subsets = (endpoints && endpoints.subsets) || [];
  const rows = [];

  subsets.forEach((subset, subsetIndex) => {
    const ports = (subset && subset.ports && subset.ports.length > 0) ? subset.ports : [{}];
    const pushRows = (addresses = [], ready = true) => {
      addresses.forEach((address, addressIndex) => {
        ports.forEach((port, portIndex) => {
          const targetRef = address.targetRef || {};
          rows.push({
            key: `${subsetIndex}-${ready ? 'ready' : 'pending'}-${addressIndex}-${portIndex}`,
            ip: address.ip || '-',
            nodeName: address.nodeName || '-',
            ready,
            port: port.port || '-',
            protocol: port.protocol || 'TCP',
            portName: port.name || '-',
            target: targetRef.kind && targetRef.name ? `${targetRef.kind}/${targetRef.name}` : '-',
          });
        });
      });
    };

    pushRows(subset.addresses || [], true);
    pushRows(subset.notReadyAddresses || [], false);
  });

  return rows;
}

function getEndpointStatus(service = {}, endpointRows = []) {
  const metadata = service.metadata || {};
  const spec = service.spec || {};
  const hasSelector = Object.keys(spec.selector || {}).length > 0;

  if (metadata.deletionTimestamp) {
    return { text: t('resourceCenter.detail.deleting', '删除中'), className: styles.statusError };
  }
  if (spec.type === 'ExternalName') {
    return { text: t('resourceCenter.detail.externalService', '外部服务'), className: styles.statusDefault };
  }
  if (endpointRows.length > 0) {
    return { text: t('resourceCenter.detail.endpointsFound', '已发现端点'), className: styles.statusRunning };
  }
  if (hasSelector) {
    return { text: t('resourceCenter.detail.noAvailableEndpoints', '无可用端点'), className: styles.statusWarning };
  }
  return { text: t('resourceCenter.detail.noSelector', '无选择器'), className: styles.statusDefault };
}

@connect(({ resourceCenterDetail, loading }) => ({
  serviceDetail: resourceCenterDetail.serviceDetail,
  events: resourceCenterDetail.events,
  detailLoading: loading.effects['resourceCenterDetail/fetchServiceDetail'],
  eventsLoading: loading.effects['resourceCenterDetail/fetchEvents'],
  yamlSaving: loading.effects['resourceCenterDetail/saveYaml'],
}))
class ServiceDetail extends PureComponent {
  state = {
    activeTab: 'overview',
    yamlText: '',
  };

  componentDidMount() {
    this.fetchDetail();
  }

  componentDidUpdate(prevProps) {
    const prevName = prevProps.match && prevProps.match.params && prevProps.match.params.serviceName;
    const nextName = this.props.match && this.props.match.params && this.props.match.params.serviceName;
    if (prevName !== nextName) {
      this.setState({ activeTab: 'overview' });
      this.fetchDetail();
    }
  }

  getRouteParams() {
    const { match } = this.props;
    return (match && match.params) || {};
  }

  fetchDetail = () => {
    const { dispatch } = this.props;
    const params = this.getRouteParams();
    dispatch({
      type: 'resourceCenterDetail/fetchServiceDetail',
      payload: {
        team: params.teamName,
        region: params.regionName,
        name: params.serviceName || params.name,
      },
      callback: detail => {
        this.setState({
          yamlText: safeYaml(detail && detail.service),
        });
      },
    });
  };

  fetchEvents = () => {
    const { dispatch, serviceDetail } = this.props;
    const params = this.getRouteParams();
    const service = (serviceDetail && serviceDetail.service) || {};
    const metadata = service.metadata || {};
    dispatch({
      type: 'resourceCenterDetail/fetchEvents',
      payload: {
        team: params.teamName,
        region: params.regionName,
        namespace: metadata.namespace,
        kind: 'Service',
        name: metadata.name,
      },
    });
  };

  handleTabChange = key => {
    this.setState({ activeTab: key });
    if (key === 'events') {
      this.fetchEvents();
    }
  };

  getResourceCenterRoute() {
    const params = this.getRouteParams();
    return {
      pathname: `/team/${params.teamName}/region/${params.regionName}/k8s-center`,
    };
  }

  getServiceListRoute() {
    const params = this.getRouteParams();
    return {
      pathname: `/team/${params.teamName}/region/${params.regionName}/k8s-center`,
      query: {
        tab: 'network',
      },
    };
  }

  goToResourceCenter = () => {
    const { dispatch } = this.props;
    dispatch(routerRedux.push(this.getResourceCenterRoute()));
  };

  goToServiceList = () => {
    const { dispatch } = this.props;
    dispatch(routerRedux.push(this.getServiceListRoute()));
  };

  handleSaveYaml = () => {
    const { dispatch } = this.props;
    const params = this.getRouteParams();
    dispatch({
      type: 'resourceCenterDetail/saveYaml',
      payload: {
        team: params.teamName,
        region: params.regionName,
        group: '',
        version: 'v1',
        resource: 'services',
        name: params.serviceName || params.name,
        yaml: this.state.yamlText,
      },
      callback: res => {
        if (res) {
          notification.success({ message: t('resourceCenter.yaml.saveSuccess', 'YAML 保存成功') });
          this.fetchDetail();
        }
      },
    });
  };

  renderInfoRow(label, value) {
    return (
      <>
        <div className={styles.infoLabel}>{label}</div>
        <div className={styles.infoValue}>{value || '-'}</div>
      </>
    );
  }

  renderOverview() {
    const detail = this.props.serviceDetail || {};
    const service = detail.service || {};
    const endpoints = detail.endpoints || null;
    const metadata = service.metadata || {};
    const spec = service.spec || {};
    const endpointRows = buildEndpointRows(endpoints);
    const health = getEndpointStatus(service, endpointRows);
    const ports = spec.ports || [];
    const portColumns = [
      { title: t('resourceCenter.common.name', '名称'), dataIndex: 'name', key: 'name', render: value => value || '-' },
      { title: t('resourceCenter.detail.servicePortCount', '服务端口'), dataIndex: 'port', key: 'port', width: 110, render: value => value || '-' },
      { title: t('platformResources.common.protocol', '协议'), dataIndex: 'protocol', key: 'protocol', width: 100, render: value => value || 'TCP' },
      {
        title: t('resourceCenter.detail.targetPort', '目标端口'),
        dataIndex: 'targetPort',
        key: 'targetPort',
        width: 120,
        render: value => value !== undefined && value !== null && value !== '' ? String(value) : '-',
      },
      {
        title: t('resourceCenter.detail.nodePort', '节点端口'),
        dataIndex: 'nodePort',
        key: 'nodePort',
        width: 120,
        render: value => value || '-',
      },
      {
        title: t('resourceCenter.detail.accessAddress', '访问地址'),
        key: 'accessUrl',
        render: (_, record) => {
          const url = buildNodePortAccessUrl(record);
          return url ? <span className={styles.monoText}>{url}</span> : '-';
        },
      },
      {
        title: t('resourceCenter.common.operation', '操作'),
        key: 'action',
        width: 100,
        render: (_, record) => {
          const url = buildNodePortAccessUrl(record);
          return url ? (
            <Button size="small" onClick={() => openInNewTab(url)}>
              {t('resourceCenter.detail.goVisit', '访问')}
            </Button>
          ) : '-';
        },
      },
    ];
    const endpointColumns = [
      { title: t('resourceCenter.common.ip', 'IP'), dataIndex: 'ip', key: 'ip', render: value => value ? <span className={styles.monoText}>{value}</span> : '-' },
      { title: t('resourceCenter.common.ports', '端口'), dataIndex: 'port', key: 'port', width: 100 },
      { title: t('platformResources.common.protocol', '协议'), dataIndex: 'protocol', key: 'protocol', width: 100 },
      { title: t('resourceCenter.detail.portName', '端口名'), dataIndex: 'portName', key: 'portName', width: 120 },
      { title: t('resourceCenter.detail.node', '节点'), dataIndex: 'nodeName', key: 'nodeName', render: value => value || '-' },
      { title: t('resourceCenter.detail.targetObject', '目标对象'), dataIndex: 'target', key: 'target', render: value => value || '-' },
      {
        title: t('resourceCenter.common.status', '状态'),
        dataIndex: 'ready',
        key: 'ready',
        width: 100,
        render: value => value ? <span className={styles.statusRunning}>{t('resourceCenter.detail.ready', '就绪')}</span> : <span className={styles.statusWarning}>{t('resourceCenter.detail.notReady', '未就绪')}</span>,
      },
    ];
    const addressLabel = spec.type === 'ExternalName'
      ? t('resourceCenter.detail.externalName', 'External Name')
      : t('resourceCenter.detail.clusterIp', 'Cluster IP');

    return (
      <div>
        <div className={styles.heroStats}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('resourceCenter.detail.serviceType', '服务类型')}</div>
            <div className={styles.statValue}>{spec.type || 'ClusterIP'}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('resourceCenter.detail.servicePortCount', '服务端口')}</div>
            <div className={styles.statValue}>{ports.length}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('resourceCenter.detail.endpointCount', '后端端点')}</div>
            <div className={styles.statValue}>{endpointRows.length}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{addressLabel}</div>
            <div className={styles.statValue}>{formatClusterAddress(spec)}</div>
          </div>
        </div>

        <div className={styles.overviewGrid}>
          <Card bordered={false} className={styles.infoCard} title={<span className={styles.cardTitle}>{t('resourceCenter.detail.basicInfo', '基本信息')}</span>}>
            <div className={styles.infoList}>
              {this.renderInfoRow(t('resourceCenter.common.name', '名称'), metadata.name)}
              {this.renderInfoRow(t('resourceCenter.detail.endpointHealth', '端点状态'), <span className={health.className}>{health.text}</span>)}
              {this.renderInfoRow(t('resourceCenter.common.namespace', '命名空间'), metadata.namespace)}
              {this.renderInfoRow(t('resourceCenter.common.createdAt', '创建时间'), formatToBeijingTime(metadata.creationTimestamp))}
              {this.renderInfoRow(t('resourceCenter.detail.apiVersion', 'API Version'), service.apiVersion || '-')}
              {this.renderInfoRow(t('resourceCenter.detail.sessionAffinity', '会话保持'), spec.sessionAffinity || 'None')}
              {this.renderInfoRow(addressLabel, <code className={styles.monoText}>{formatClusterAddress(spec)}</code>)}
              {this.renderInfoRow(t('resourceCenter.detail.externalAccess', '外部访问地址'), formatExternalAccess(service))}
              {this.renderInfoRow(t('resourceCenter.detail.resourceVersion', '资源版本'), metadata.resourceVersion || '-')}
              {this.renderInfoRow(t('resourceCenter.detail.trafficPolicy', '流量策略'), spec.externalTrafficPolicy || '-')}
            </div>
          </Card>
          <Card bordered={false} className={styles.infoCard} title={<span className={styles.cardTitle}>{t('resourceCenter.detail.labelsAndSelectors', '标签与选择器')}</span>}>
            <div className={styles.infoList}>
              {this.renderInfoRow(t('resourceCenter.detail.selector', '选择器'), formatMapTags(spec.selector))}
              {this.renderInfoRow(t('resourceCenter.detail.resourceLabels', '资源标签'), formatMapTags(metadata.labels))}
              {this.renderInfoRow(t('resourceCenter.detail.resourceAnnotations', '资源注解'), formatMapTags(metadata.annotations))}
            </div>
          </Card>
        </div>

        <div className={styles.sectionSplit}>
          <Card bordered={false} className={styles.workspaceCard}>
            <div className={styles.toolbar}>
              <div>
                <div className={styles.cardTitle}>{t('resourceCenter.detail.portMapping', '端口映射')}</div>
                <div className={styles.toolbarMeta}>
                  <span>{t('resourceCenter.detail.servicePortMeta', '{count} 个服务端口', { count: ports.length })}</span>
                  <span className={styles.toolbarDot} />
                  <span>{t('resourceCenter.detail.servicePortHint', '聚焦 Service 暴露端口、目标端口与 NodePort')}</span>
                </div>
              </div>
            </div>
            <div className={styles.tableShell}>
              <Table
                rowKey={record => `${record.name || 'port'}-${record.port}-${record.protocol || 'TCP'}`}
                dataSource={ports}
                columns={portColumns}
                pagination={false}
                locale={{ emptyText: <Empty description={t('resourceCenter.detail.noExposedPorts', '当前服务没有暴露端口')} /> }}
              />
            </div>
          </Card>
        </div>

        <div className={styles.sectionSplit}>
          <Card bordered={false} className={styles.workspaceCard}>
            <div className={styles.toolbar}>
              <div>
                <div className={styles.cardTitle}>{t('resourceCenter.detail.backendEndpoints', '后端端点')}</div>
                <div className={styles.toolbarMeta}>
                  <span>{t('resourceCenter.detail.endpointMeta', '{count} 条端点记录', { count: endpointRows.length })}</span>
                  <span className={styles.toolbarDot} />
                  <span>{t('resourceCenter.detail.endpointHint', '展示当前 Service 关联到的 Pod IP、端口和目标对象')}</span>
                </div>
              </div>
            </div>
            <div className={styles.tableShell}>
              <Table
                rowKey="key"
                dataSource={endpointRows}
                columns={endpointColumns}
                pagination={endpointRows.length > 10 ? { pageSize: 10, size: 'small' } : false}
                locale={{ emptyText: <Empty description={t('resourceCenter.detail.noBackendEndpoints', '当前服务暂无后端端点')} /> }}
              />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  renderEventsTab() {
    const { events, eventsLoading } = this.props;
    const columns = [
      { title: t('resourceCenter.common.type', '类型'), dataIndex: 'type', key: 'type', width: 100 },
      { title: t('resourceCenter.common.reason', '原因'), dataIndex: 'reason', key: 'reason', width: 160 },
      { title: t('resourceCenter.common.message', '消息'), dataIndex: 'message', key: 'message' },
      { title: t('resourceCenter.common.count', '次数'), dataIndex: 'count', key: 'count', width: 90 },
      { title: t('resourceCenter.common.lastTime', '最后时间'), dataIndex: 'last_timestamp', key: 'last_timestamp', width: 180, render: value => formatToBeijingTime(value) },
    ];

    return (
      <Table
        loading={eventsLoading}
        rowKey={(record, index) => `${record.reason}-${index}`}
        dataSource={events}
        columns={columns}
        pagination={events.length > 10 ? { pageSize: 10, size: 'small' } : false}
        locale={{ emptyText: <Empty description={t('resourceCenter.detail.noEvents', '暂无事件')} /> }}
      />
    );
  }

  renderYamlTab() {
    const { detailLoading, yamlSaving } = this.props;
    return (
      <div className={styles.yamlPanel}>
        <div className={styles.yamlHint}>{t('resourceCenter.detail.serviceYamlHint', 'YAML 与当前 Service 对象保持一致，可直接查看或编辑保存。')}</div>
        <CodeMirrorForm
          mode="yaml"
          value={this.state.yamlText}
          onChange={yamlText => this.setState({ yamlText })}
          isHeader={false}
          isUpload={false}
          isAmplifications={false}
          editorHeight={560}
          style={{ marginBottom: 0 }}
        />
        <div className={styles.yamlActions}>
          <Button onClick={this.fetchDetail} loading={detailLoading}>{t('resourceCenter.common.reset', '重置')}</Button>
          <Button type="primary" onClick={this.handleSaveYaml} loading={yamlSaving}>{t('resourceCenter.common.saveYaml', '保存 YAML')}</Button>
        </div>
      </div>
    );
  }

  render() {
    const { detailLoading, serviceDetail } = this.props;
    const service = (serviceDetail && serviceDetail.service) || {};
    const metadata = service.metadata || {};
    const spec = service.spec || {};
    const endpointRows = buildEndpointRows(serviceDetail && serviceDetail.endpoints);
    const health = getEndpointStatus(service, endpointRows);

    return (
      <PageHeaderLayout
        title={(
          <ResourceBreadcrumbTitle
            items={[
              { label: t('resourceCenter.page.title', 'K8S 原生资源'), onClick: this.goToResourceCenter },
              { label: t('resourceCenter.tab.network.title', '网络'), onClick: this.goToServiceList },
            ]}
            current={metadata.name || this.getRouteParams().serviceName}
            styles={styles}
          />
        )}
        content={t('resourceCenter.detail.serviceContent', '查看服务概览、端口映射、后端端点、事件与 YAML 配置。')}
        titleSvg={pageheaderSvg.getPageHeaderSvg('k8s', 18)}
        wrapperClassName={styles.detailPageLayout}
      >
        <div className={styles.detailPage}>
          <div className={styles.detailHeader}>
            <div className={styles.headerRow}>
              <div className={styles.titleWrap}>
                <span className={styles.eyebrow}>{t('resourceCenter.tab.network.title', '网络')}</span>
                <div className={styles.titleLine}>
                  <h1 className={styles.title}>{metadata.name || '-'}</h1>
                  <span className={health.className}>{health.text}</span>
                  <Tag color="blue">{spec.type || 'ClusterIP'}</Tag>
                </div>
                <div className={styles.summaryText}>
                  {t('resourceCenter.detail.serviceSummary', '服务详情页聚焦流量入口本身，支持查看端口映射、后端端点、事件和 YAML，便于从 Helm Release 或资源列表继续下钻排查。')}
                </div>
              </div>
              <div className={styles.headerActions}>
                <Button icon="left" onClick={this.goToServiceList}>
                  {t('resourceCenter.detail.returnService', '返回服务列表')}
                </Button>
                <Button onClick={this.fetchDetail} loading={detailLoading}>
                  {t('resourceCenter.common.refresh', '刷新')}
                </Button>
              </div>
            </div>
          </div>

          <Spin spinning={detailLoading}>
            {serviceDetail ? (
              <Card bordered={false} className={styles.workspaceCard} bodyStyle={{ padding: '22px 24px 28px' }}>
                <Tabs activeKey={this.state.activeTab} onChange={this.handleTabChange}>
                  <TabPane tab={t('resourceCenter.common.overview', '概览')} key="overview">{this.renderOverview()}</TabPane>
                  <TabPane tab={t('resourceCenter.common.events', '事件')} key="events">{this.renderEventsTab()}</TabPane>
                  <TabPane tab="YAML" key="yaml">{this.renderYamlTab()}</TabPane>
                </Tabs>
              </Card>
            ) : null}

            {!detailLoading && !serviceDetail && (
              <Card bordered={false} className={styles.workspaceCard}>
                <div className={styles.emptyPanel}>
                  <Empty description={t('resourceCenter.detail.noServiceDetail', '未找到服务详情')} />
                </div>
              </Card>
            )}
          </Spin>
        </div>
      </PageHeaderLayout>
    );
  }
}

export default ServiceDetail;
