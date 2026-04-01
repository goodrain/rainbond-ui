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
  Select,
  Spin,
  Table,
  Tabs,
  Tag,
} from 'antd';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import jsYaml from 'js-yaml';
import PodLogStream from './components/PodLogStream';
import ResourceBreadcrumbTitle from './components/ResourceBreadcrumbTitle';
import TerminalModal from './components/TerminalModal';
import styles from './detail.less';
import {
  formatToBeijingTime,
  getResourceStatusText,
  getResourceStatusTone,
  getWorkloadKindLabel,
} from './utils';

const { TabPane } = Tabs;
const { Option } = Select;
const t = (id, defaultMessage, values) => formatMessage({ id, defaultMessage }, values);

function getStatusClass(status) {
  const tone = getResourceStatusTone(status);
  if (tone === 'running') {
    return styles.statusRunning;
  }
  if (tone === 'warning') {
    return styles.statusWarning;
  }
  if (tone === 'error') {
    return styles.statusError;
  }
  return styles.statusDefault;
}

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

function formatPorts(ports) {
  return (ports || []).map(port => `${port.port}/${port.protocol || 'TCP'}`).join(' , ') || '-';
}

function formatIngressRules(ingress) {
  const rules = (((ingress || {}).spec || {}).rules) || [];
  const hosts = rules.map(rule => rule.host).filter(Boolean);
  return hosts.join(' , ') || '-';
}

@connect(({ resourceCenterDetail, loading }) => ({
  workloadDetail: resourceCenterDetail.workloadDetail,
  events: resourceCenterDetail.events,
  wsInfo: resourceCenterDetail.wsInfo,
  detailLoading: loading.effects['resourceCenterDetail/fetchWorkloadDetail'],
  eventsLoading: loading.effects['resourceCenterDetail/fetchEvents'],
  yamlSaving: loading.effects['resourceCenterDetail/saveYaml'],
}))
class WorkloadDetail extends PureComponent {
  state = {
    activeTab: 'overview',
    currentPodName: '',
    yamlText: '',
    terminalVisible: false,
  };

  componentDidMount() {
    this.fetchDetail();
    this.fetchWSInfo();
  }

  getRouteParams() {
    const { match, location } = this.props;
    const query = (location && location.query) || {};
    const searchParams = location && location.search ? new URLSearchParams(location.search) : null;
    return {
      ...(match && match.params),
      group: query.group || (searchParams && searchParams.get('group')) || 'apps',
      version: query.version || (searchParams && searchParams.get('version')) || 'v1',
    };
  }

  fetchDetail = () => {
    const { dispatch } = this.props;
    const params = this.getRouteParams();
    dispatch({
      type: 'resourceCenterDetail/fetchWorkloadDetail',
      payload: {
        team: params.teamName,
        region: params.regionName,
        group: params.group,
        version: params.version,
        resource: params.resource,
        name: params.name,
      },
      callback: bean => {
        const pods = (bean && bean.pods) || [];
        this.setState({
          currentPodName: pods[0] ? pods[0].metadata.name : '',
          yamlText: safeYaml(bean && bean.workload),
        });
      },
    });
  };

  fetchWSInfo = () => {
    const { dispatch } = this.props;
    const params = this.getRouteParams();
    dispatch({
      type: 'resourceCenterDetail/fetchWSInfo',
      payload: { team: params.teamName, region: params.regionName },
    });
  };

  fetchEvents = () => {
    const { dispatch, workloadDetail } = this.props;
    const params = this.getRouteParams();
    const summary = (workloadDetail && workloadDetail.summary) || {};
    dispatch({
      type: 'resourceCenterDetail/fetchEvents',
      payload: {
        team: params.teamName,
        region: params.regionName,
        namespace: summary.namespace,
        kind: summary.kind,
        name: summary.name,
      },
    });
  };

  handleTabChange = key => {
    this.setState({ activeTab: key });
    if (key === 'events') {
      this.fetchEvents();
    }
  };

  getCurrentPod() {
    const { workloadDetail } = this.props;
    const pods = (workloadDetail && workloadDetail.pods) || [];
    return pods.find(item => item.metadata.name === this.state.currentPodName) || pods[0] || null;
  }

  getCurrentContainerNames() {
    const pod = this.getCurrentPod();
    return (((pod || {}).spec || {}).containers || []).map(container => container.name);
  }

  jumpToPod = podName => {
    const { dispatch } = this.props;
    const params = this.getRouteParams();
    dispatch(routerRedux.push({
      pathname: `/team/${params.teamName}/region/${params.regionName}/resource-center/pods/${podName}`,
    }));
  };

  jumpToService = serviceName => {
    const { dispatch } = this.props;
    const params = this.getRouteParams();
    dispatch(routerRedux.push({
      pathname: `/team/${params.teamName}/region/${params.regionName}/resource-center/services/${serviceName}`,
    }));
  };

  getResourceCenterRoute() {
    const params = this.getRouteParams();
    return {
      pathname: `/team/${params.teamName}/region/${params.regionName}/resource-center`,
    };
  }

  getWorkloadListRoute() {
    const params = this.getRouteParams();
    return {
      pathname: `/team/${params.teamName}/region/${params.regionName}/resource-center`,
      query: {
        tab: 'workload',
        workloadKind: params.resource,
      },
    };
  }

  goToResourceCenter = () => {
    const { dispatch } = this.props;
    dispatch(routerRedux.push(this.getResourceCenterRoute()));
  };

  goToWorkloadList = () => {
    const { dispatch } = this.props;
    dispatch(routerRedux.push(this.getWorkloadListRoute()));
  };

  handleSaveYaml = () => {
    const { dispatch } = this.props;
    const params = this.getRouteParams();
    dispatch({
      type: 'resourceCenterDetail/saveYaml',
      payload: {
        team: params.teamName,
        region: params.regionName,
        group: params.group,
        version: params.version,
        resource: params.resource,
        name: params.name,
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

  renderOverview() {
    const { workloadDetail } = this.props;
    const summary = (workloadDetail && workloadDetail.summary) || {};
    const workload = (workloadDetail && workloadDetail.workload) || {};
    const labels = (((workload || {}).metadata || {}).labels) || {};
    const selectors = summary.selector || {};

    return (
      <div>
        <div className={styles.heroStats}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('resourceCenter.common.status', '状态')}</div>
            <div className={styles.statValue}>{getResourceStatusText(summary.status)}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('resourceCenter.detail.readyReplicas', '就绪副本')}</div>
            <div className={styles.statValue}>{`${summary.ready_replicas || 0}/${summary.replicas || 0}`}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('resourceCenter.detail.instanceCount', '实例数量')}</div>
            <div className={styles.statValue}>{((workloadDetail && workloadDetail.pods) || []).length}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('resourceCenter.detail.accessMethods', '访问方式')}</div>
            <div className={styles.statValue}>{`${((workloadDetail && workloadDetail.services) || []).length} ${t('resourceCenter.detail.services', '服务')}`}</div>
          </div>
        </div>

        <div className={styles.overviewGrid}>
          <Card bordered={false} className={styles.infoCard} title={<span className={styles.cardTitle}>{t('resourceCenter.detail.basicInfo', '基本信息')}</span>}>
            <div className={styles.infoList}>
              <div className={styles.infoLabel}>{t('resourceCenter.detail.resourceName', '资源名称')}</div>
              <div className={styles.infoValue}>{summary.name || '-'}</div>
              <div className={styles.infoLabel}>{t('resourceCenter.detail.resourceType', '资源类型')}</div>
              <div className={styles.infoValue}>{getWorkloadKindLabel(summary.kind || this.getRouteParams().resource)}</div>
              <div className={styles.infoLabel}>{t('resourceCenter.common.namespace', '命名空间')}</div>
              <div className={styles.infoValue}>{summary.namespace || '-'}</div>
              <div className={styles.infoLabel}>{t('resourceCenter.common.createdAt', '创建时间')}</div>
              <div className={styles.infoValue}>{formatToBeijingTime(summary.created_at)}</div>
              <div className={styles.infoLabel}>{t('resourceCenter.detail.apiVersion', 'API Version')}</div>
              <div className={styles.infoValue}>{workload.apiVersion || '-'}</div>
            </div>
          </Card>

          <Card bordered={false} className={styles.infoCard} title={<span className={styles.cardTitle}>{t('resourceCenter.detail.labelsAndSelectors', '标签与选择器')}</span>}>
            <div className={styles.infoList}>
              <div className={styles.infoLabel}>{t('resourceCenter.detail.selector', '选择器')}</div>
              <div className={styles.infoValue}>
                <div className={styles.tagList}>
                  {Object.keys(selectors).length > 0
                    ? Object.keys(selectors).map(key => <Tag key={key}>{`${key}=${selectors[key]}`}</Tag>)
                    : '-'}
                </div>
              </div>
              <div className={styles.infoLabel}>{t('resourceCenter.detail.resourceLabels', '资源标签')}</div>
              <div className={styles.infoValue}>
                <div className={styles.tagList}>
                  {Object.keys(labels).length > 0
                    ? Object.keys(labels).map(key => <Tag key={key}>{`${key}=${labels[key]}`}</Tag>)
                    : '-'}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  renderPodsTab() {
    const { workloadDetail } = this.props;
    const pods = (workloadDetail && workloadDetail.pods) || [];
    const columns = [
      {
        title: t('resourceCenter.detail.instanceName', '实例名称'),
        dataIndex: 'metadata.name',
        key: 'name',
        render: (_, record) => (
          <span className={styles.nameLink} onClick={() => this.jumpToPod(record.metadata.name)}>
            {record.metadata.name}
          </span>
        ),
      },
      {
        title: t('resourceCenter.common.status', '状态'),
        dataIndex: 'status.phase',
        key: 'phase',
        width: 120,
        render: value => <span className={`${styles.statusDot} ${getStatusClass(value)}`}>{getResourceStatusText(value)}</span>,
      },
      {
        title: t('resourceCenter.detail.node', '节点'),
        dataIndex: 'spec.nodeName',
        key: 'nodeName',
        render: value => value || '-',
      },
      {
        title: t('resourceCenter.detail.podIp', 'Pod IP'),
        dataIndex: 'status.podIP',
        key: 'podIP',
        render: value => value ? <span className={styles.monoText}>{value}</span> : '-',
      },
      {
        title: t('resourceCenter.detail.containerCount', '容器数'),
        key: 'containers',
        width: 88,
        render: (_, record) => ((((record || {}).spec || {}).containers) || []).length,
      },
      {
        title: t('resourceCenter.common.createdAt', '创建时间'),
        dataIndex: 'metadata.creationTimestamp',
        key: 'creationTimestamp',
        width: 180,
        render: value => formatToBeijingTime(value),
      },
    ];

    return (
      <div>
        <div className={styles.toolbar}>
          <div className={styles.toolbarMeta}>
            <span>{t('resourceCenter.detail.workloadLogHint1', '工作负载实例会直接联动到容器组详情页')}</span>
            <span className={styles.toolbarDot} />
            <span>{t('resourceCenter.detail.workloadLogHint2', '点击实例名称可继续查看日志与终端')}</span>
          </div>
        </div>
        <div className={styles.tableShell}>
          <Table
            rowKey={record => record.metadata.uid || record.metadata.name}
            dataSource={pods}
            columns={columns}
            pagination={pods.length > 10 ? { pageSize: 10, size: 'small' } : false}
            locale={{ emptyText: <Empty description={t('resourceCenter.detail.noInstances', '暂无实例')} /> }}
          />
        </div>
      </div>
    );
  }

  renderAccessTab() {
    const { workloadDetail } = this.props;
    const services = (workloadDetail && workloadDetail.services) || [];
    const ingresses = (workloadDetail && workloadDetail.ingresses) || [];

    const serviceColumns = [
      {
        title: t('resourceCenter.detail.serviceName', '服务名称'),
        dataIndex: 'metadata.name',
        key: 'name',
        render: (_, record) => (
          <span className={styles.nameLink} onClick={() => this.jumpToService(record.metadata.name)}>
            {record.metadata.name}
          </span>
        ),
      },
      { title: t('resourceCenter.common.type', '类型'), dataIndex: 'spec.type', key: 'type', width: 120, render: value => value || 'ClusterIP' },
      { title: t('resourceCenter.detail.clusterIp', 'Cluster IP'), dataIndex: 'spec.clusterIP', key: 'clusterIP', render: value => value ? <span className={styles.monoText}>{value}</span> : '-' },
      { title: t('resourceCenter.common.ports', '端口'), key: 'ports', render: (_, record) => formatPorts(record.spec.ports) },
    ];

    const ingressColumns = [
      { title: t('resourceCenter.detail.routeName', '路由名称'), dataIndex: 'metadata.name', key: 'name' },
      { title: t('resourceCenter.detail.host', 'Host'), key: 'host', render: (_, record) => formatIngressRules(record) },
      {
        title: t('resourceCenter.detail.backendService', '后端服务'),
        key: 'backend',
        render: (_, record) => {
          const rules = (((record || {}).spec || {}).rules) || [];
          const values = [];
          rules.forEach(rule => {
            (((rule || {}).http || {}).paths || []).forEach(path => {
              const service = (((path || {}).backend || {}).service || {}).name;
              if (service) {
                values.push(service);
              }
            });
          });
          return values.join(' , ') || '-';
        },
      },
    ];

    return (
      <div>
        <Card bordered={false} className={styles.infoCard} title={<span className={styles.cardTitle}>{t('resourceCenter.detail.services', '服务')}</span>}>
          <Table
            rowKey={record => record.metadata.uid || record.metadata.name}
            dataSource={services}
            columns={serviceColumns}
            pagination={false}
            locale={{ emptyText: <Empty description={t('resourceCenter.detail.noServiceExposure', '暂无服务暴露')} /> }}
          />
        </Card>
        <Card bordered={false} className={`${styles.infoCard} ${styles.sectionSplit}`} title={<span className={styles.cardTitle}>{t('resourceCenter.detail.routes', '路由规则')}</span>}>
          <Table
            rowKey={record => record.metadata.uid || record.metadata.name}
            dataSource={ingresses}
            columns={ingressColumns}
            pagination={false}
            locale={{ emptyText: <Empty description={t('resourceCenter.detail.noRoutes', '暂无路由规则')} /> }}
          />
        </Card>
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
      <Spin spinning={eventsLoading}>
        <Table
          rowKey={(record, index) => `${record.reason}-${index}`}
          dataSource={events}
          columns={columns}
          pagination={events.length > 10 ? { pageSize: 10, size: 'small' } : false}
          locale={{ emptyText: <Empty description={t('resourceCenter.detail.noEvents', '暂无事件')} /> }}
        />
      </Spin>
    );
  }

  renderLogsTab() {
    const pod = this.getCurrentPod();
    const pods = (this.props.workloadDetail && this.props.workloadDetail.pods) || [];
    const containers = (((pod || {}).spec || {}).containers || []).map(item => item.name);
    return (
      <div>
        <div className={styles.toolbar}>
          <div className={styles.toolbarMeta}>
            <span>{t('resourceCenter.detail.logsHint1', '日志沿用现有 Rainbond 终端风格')}</span>
            <span className={styles.toolbarDot} />
            <span>{t('resourceCenter.detail.logsHint2', '默认聚焦当前工作负载实例')}</span>
          </div>
          <div className={styles.toolbarActions}>
            <Select
              value={this.state.currentPodName || undefined}
              style={{ width: 260 }}
              onChange={value => this.setState({ currentPodName: value })}
            >
              {pods.map(item => (
                <Option key={item.metadata.name} value={item.metadata.name}>{item.metadata.name}</Option>
              ))}
            </Select>
          </div>
        </div>
        <PodLogStream
          active={this.state.activeTab === 'logs'}
          teamName={this.getRouteParams().teamName}
          regionName={this.getRouteParams().regionName}
          podName={pod && pod.metadata.name}
          containers={containers}
          title={t('resourceCenter.detail.workloadLogTitle', '工作负载实例日志')}
        />
      </div>
    );
  }

  renderYamlTab() {
    const { detailLoading, yamlSaving } = this.props;
    return (
      <div className={styles.yamlPanel}>
        <div className={styles.yamlHint}>{t('resourceCenter.detail.workloadYamlHint', 'YAML 是当前工作负载的原始资源定义。你可以直接修改后保存。')}</div>
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
    const { workloadDetail, detailLoading, wsInfo } = this.props;
    const summary = (workloadDetail && workloadDetail.summary) || {};
    const currentPod = this.getCurrentPod();

    return (
      <PageHeaderLayout
        title={(
          <ResourceBreadcrumbTitle
            items={[
              { label: t('resourceCenter.page.title', 'K8S 原生资源'), onClick: this.goToResourceCenter },
              { label: t('resourceCenter.tab.workload.title', '工作负载'), onClick: this.goToWorkloadList },
            ]}
            current={summary.name || this.getRouteParams().name}
            styles={styles}
          />
        )}
        content={t('resourceCenter.detail.workloadContent', '查看工作负载概览、实例列表、访问方式、事件、日志与 YAML 配置。')}
        titleSvg={pageheaderSvg.getPageHeaderSvg('k8s', 18)}
        wrapperClassName={styles.detailPageLayout}
      >
        <div className={styles.detailPage}>
          <div className={styles.detailHeader}>
            <div className={styles.headerRow}>
              <div className={styles.titleWrap}>
                <span className={styles.eyebrow}>{t('resourceCenter.tab.workload.title', '工作负载')}</span>
                <div className={styles.titleLine}>
                  <h1 className={styles.title}>{summary.name || '-'}</h1>
                  <span className={`${styles.statusDot} ${getStatusClass(summary.status)}`}>{getResourceStatusText(summary.status)}</span>
                  <Tag color="blue">{getWorkloadKindLabel(summary.kind || this.getRouteParams().resource)}</Tag>
                </div>
                <div className={styles.summaryText}>
                  {t('resourceCenter.detail.workloadSummary', '这里聚焦工作负载本身、实例列表、访问方式、事件、日志与 YAML。容器组详情会从实例列表继续下钻。')}
                </div>
              </div>
              <div className={styles.headerActions}>
                <Button icon="left" onClick={this.goToWorkloadList}>
                  {t('resourceCenter.detail.returnWorkload', '返回工作负载')}
                </Button>
                <Button
                  type="primary"
                  icon="code"
                  onClick={() => this.setState({ terminalVisible: true })}
                  disabled={!currentPod}
                >
                  {t('resourceCenter.common.webTerminal', 'Web 终端')}
                </Button>
              </div>
            </div>
          </div>

          <Spin spinning={detailLoading}>
            <Card bordered={false} className={styles.workspaceCard} bodyStyle={{ padding: '22px 24px 28px' }}>
              <Tabs activeKey={this.state.activeTab} onChange={this.handleTabChange}>
                <TabPane tab={t('resourceCenter.common.overview', '概览')} key="overview">{this.renderOverview()}</TabPane>
                <TabPane tab={t('resourceCenter.detail.instanceList', '实例列表')} key="pods">{this.renderPodsTab()}</TabPane>
                <TabPane tab={t('resourceCenter.detail.accessMethods', '访问方式')} key="access">{this.renderAccessTab()}</TabPane>
                <TabPane tab={t('resourceCenter.common.events', '事件')} key="events">{this.renderEventsTab()}</TabPane>
                <TabPane tab={t('resourceCenter.common.logs', '日志')} key="logs">{this.renderLogsTab()}</TabPane>
                <TabPane tab="YAML" key="yaml">{this.renderYamlTab()}</TabPane>
              </Tabs>
            </Card>
          </Spin>

          <TerminalModal
            visible={this.state.terminalVisible}
            onCancel={() => this.setState({ terminalVisible: false })}
            websocketURL={wsInfo && wsInfo.event_websocket_url}
            podName={currentPod && currentPod.metadata.name}
            namespace={(wsInfo && wsInfo.namespace) || ((summary && summary.namespace) || '')}
            containers={this.getCurrentContainerNames()}
          />

          {!detailLoading && !workloadDetail && (
            <Card bordered={false} className={styles.workspaceCard}>
              <Empty description={t('resourceCenter.detail.noWorkloadDetail', '未找到工作负载详情')} />
            </Card>
          )}
        </div>
      </PageHeaderLayout>
    );
  }
}

export default WorkloadDetail;
