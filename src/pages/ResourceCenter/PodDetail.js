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
import { formatToBeijingTime, getResourceStatusText, getResourceStatusTone } from './utils';

const { TabPane } = Tabs;
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

function formatPorts(containers) {
  const result = [];
  (containers || []).forEach(container => {
    (((container || {}).ports) || []).forEach(port => {
      result.push(`${container.name}:${port.containerPort}/${port.protocol || 'TCP'}`);
    });
  });
  return result.join(' , ') || '-';
}

@connect(({ resourceCenterDetail, loading }) => ({
  podDetail: resourceCenterDetail.podDetail,
  events: resourceCenterDetail.events,
  wsInfo: resourceCenterDetail.wsInfo,
  detailLoading: loading.effects['resourceCenterDetail/fetchPodDetail'],
  eventsLoading: loading.effects['resourceCenterDetail/fetchEvents'],
}))
class PodDetail extends PureComponent {
  state = {
    activeTab: 'overview',
    yamlText: '',
    terminalVisible: false,
  };

  componentDidMount() {
    this.fetchDetail();
    this.fetchWSInfo();
  }

  getRouteParams() {
    const { match } = this.props;
    return (match && match.params) || {};
  }

  fetchDetail = () => {
    const { dispatch } = this.props;
    const params = this.getRouteParams();
    dispatch({
      type: 'resourceCenterDetail/fetchPodDetail',
      payload: {
        team: params.teamName,
        region: params.regionName,
        pod_name: params.podName || params.name,
      },
      callback: bean => {
        this.setState({ yamlText: safeYaml(bean && bean.pod) });
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
    const { dispatch, podDetail } = this.props;
    const params = this.getRouteParams();
    const summary = (podDetail && podDetail.summary) || {};
    dispatch({
      type: 'resourceCenterDetail/fetchEvents',
      payload: {
        team: params.teamName,
        region: params.regionName,
        namespace: summary.namespace,
        kind: 'Pod',
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

  getContainerNames() {
    return ((this.props.podDetail && this.props.podDetail.containers) || []).map(item => item.name);
  }

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

  getPodListRoute() {
    const params = this.getRouteParams();
    return {
      pathname: `/team/${params.teamName}/region/${params.regionName}/resource-center`,
      query: {
        tab: 'pod',
      },
    };
  }

  goToResourceCenter = () => {
    const { dispatch } = this.props;
    dispatch(routerRedux.push(this.getResourceCenterRoute()));
  };

  goToPodList = () => {
    const { dispatch } = this.props;
    dispatch(routerRedux.push(this.getPodListRoute()));
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
        resource: 'pods',
        name: params.podName || params.name,
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
    const { podDetail } = this.props;
    const summary = (podDetail && podDetail.summary) || {};
    const pod = (podDetail && podDetail.pod) || {};
    const labels = (((pod || {}).metadata || {}).labels) || {};

    return (
      <div>
        <div className={styles.heroStats}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('resourceCenter.common.status', '状态')}</div>
            <div className={styles.statValue}>{getResourceStatusText(summary.phase)}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('resourceCenter.detail.podIp', 'Pod IP')}</div>
            <div className={styles.statValue}>{summary.pod_ip || '-'}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('resourceCenter.detail.node', '节点')}</div>
            <div className={styles.statValue}>{summary.node_name || '-'}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('resourceCenter.detail.containerCount', '容器数')}</div>
            <div className={styles.statValue}>{((podDetail && podDetail.containers) || []).length}</div>
          </div>
        </div>

        <div className={styles.overviewGrid}>
          <Card bordered={false} className={styles.infoCard} title={<span className={styles.cardTitle}>{t('resourceCenter.detail.basicInfo', '基本信息')}</span>}>
            <div className={styles.infoList}>
              <div className={styles.infoLabel}>{t('resourceCenter.common.name', '名称')}</div>
              <div className={styles.infoValue}>{summary.name || '-'}</div>
              <div className={styles.infoLabel}>{t('resourceCenter.common.namespace', '命名空间')}</div>
              <div className={styles.infoValue}>{summary.namespace || '-'}</div>
              <div className={styles.infoLabel}>{t('resourceCenter.common.createdAt', '创建时间')}</div>
              <div className={styles.infoValue}>{formatToBeijingTime(summary.created_at)}</div>
              <div className={styles.infoLabel}>{t('resourceCenter.common.ports', '端口')}</div>
              <div className={styles.infoValue}>{formatPorts((pod || {}).spec && pod.spec.containers)}</div>
            </div>
          </Card>
          <Card bordered={false} className={styles.infoCard} title={<span className={styles.cardTitle}>{t('resourceCenter.detail.labels', '标签')}</span>}>
            <div className={styles.tagList}>
              {Object.keys(labels).length > 0
                ? Object.keys(labels).map(key => <Tag key={key}>{`${key}=${labels[key]}`}</Tag>)
                : '-'}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  renderContainersTab() {
    const containers = (this.props.podDetail && this.props.podDetail.containers) || [];
    const columns = [
      { title: t('resourceCenter.detail.containerName', '容器名称'), dataIndex: 'name', key: 'name' },
      { title: t('resourceCenter.detail.image', '镜像'), dataIndex: 'image', key: 'image' },
      { title: t('resourceCenter.detail.containerReady', '就绪'), dataIndex: 'ready', key: 'ready', width: 100, render: value => value ? t('platformResources.common.yes', '是') : t('platformResources.common.no', '否') },
      { title: t('resourceCenter.common.restarts', '重启次数'), dataIndex: 'restart_count', key: 'restart_count', width: 100 },
    ];
    return (
      <Table
        rowKey="name"
        dataSource={containers}
        columns={columns}
        pagination={false}
        locale={{ emptyText: <Empty description={t('resourceCenter.detail.noContainers', '暂无容器信息')} /> }}
      />
    );
  }

  renderAccessTab() {
    const services = (this.props.podDetail && this.props.podDetail.services) || [];
    const ingresses = (this.props.podDetail && this.props.podDetail.ingresses) || [];
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
      {
        title: t('resourceCenter.common.ports', '端口'),
        key: 'ports',
        render: (_, record) => (((record || {}).spec || {}).ports || []).map(port => `${port.port}/${port.protocol || 'TCP'}`).join(' , ') || '-',
      },
    ];
    const ingressColumns = [
      { title: t('resourceCenter.detail.routeName', '路由名称'), dataIndex: 'metadata.name', key: 'name' },
      {
        title: t('resourceCenter.detail.host', 'Host'),
        key: 'host',
        render: (_, record) => ((((record || {}).spec || {}).rules) || []).map(rule => rule.host).filter(Boolean).join(' , ') || '-',
      },
    ];

    return (
      <div>
        <Card bordered={false} className={styles.infoCard} title={<span className={styles.cardTitle}>{t('resourceCenter.detail.relatedServices', '关联服务')}</span>}>
          <Table rowKey={record => record.metadata.uid || record.metadata.name} dataSource={services} columns={serviceColumns} pagination={false} locale={{ emptyText: <Empty description={t('resourceCenter.detail.noRelatedServices', '暂无关联服务')} /> }} />
        </Card>
        <Card bordered={false} className={`${styles.infoCard} ${styles.sectionSplit}`} title={<span className={styles.cardTitle}>{t('resourceCenter.detail.relatedRoutes', '关联路由')}</span>}>
          <Table rowKey={record => record.metadata.uid || record.metadata.name} dataSource={ingresses} columns={ingressColumns} pagination={false} locale={{ emptyText: <Empty description={t('resourceCenter.detail.noRelatedRoutes', '暂无关联路由')} /> }} />
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

  renderLogsTab() {
    const podName = ((this.props.podDetail || {}).summary || {}).name;
    return (
      <PodLogStream
        active={this.state.activeTab === 'logs'}
        teamName={this.getRouteParams().teamName}
        regionName={this.getRouteParams().regionName}
        podName={podName}
        containers={this.getContainerNames()}
        title={t('resourceCenter.detail.podLogTitle', '容器组日志')}
      />
    );
  }

  renderYamlTab() {
    return (
      <div className={styles.yamlPanel}>
        <div className={styles.yamlHint}>{t('resourceCenter.detail.podYamlHint', 'YAML 与当前容器组对象保持一致，可直接查看或编辑保存。')}</div>
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
          <Button onClick={this.fetchDetail}>{t('resourceCenter.common.reset', '重置')}</Button>
          <Button type="primary" onClick={this.handleSaveYaml}>{t('resourceCenter.common.saveYaml', '保存 YAML')}</Button>
        </div>
      </div>
    );
  }

  render() {
    const { podDetail, detailLoading, wsInfo } = this.props;
    const summary = (podDetail && podDetail.summary) || {};

    return (
      <PageHeaderLayout
        title={(
          <ResourceBreadcrumbTitle
            items={[
              { label: t('resourceCenter.page.title', 'K8S 原生资源'), onClick: this.goToResourceCenter },
              { label: t('resourceCenter.tab.pod.title', '容器组'), onClick: this.goToPodList },
            ]}
            current={summary.name || this.getRouteParams().name}
            styles={styles}
          />
        )}
        content={t('resourceCenter.detail.podContent', '查看容器组概览、容器列表、访问方式、事件、日志、终端与 YAML 配置。')}
        titleSvg={pageheaderSvg.getPageHeaderSvg('k8s', 18)}
        wrapperClassName={styles.detailPageLayout}
      >
        <div className={styles.detailPage}>
          <div className={styles.detailHeader}>
            <div className={styles.headerRow}>
              <div className={styles.titleWrap}>
                <span className={styles.eyebrow}>{t('resourceCenter.tab.pod.title', '容器组')}</span>
                <div className={styles.titleLine}>
                  <h1 className={styles.title}>{summary.name || '-'}</h1>
                  <span className={`${styles.statusDot} ${getStatusClass(summary.phase)}`}>{getResourceStatusText(summary.phase)}</span>
                  <Tag color="blue">{t('resourceCenter.tab.pod.title', '容器组')}</Tag>
                </div>
                <div className={styles.summaryText}>
                  {t('resourceCenter.detail.podSummary', '容器组详情保持与现有 Rainbond 体系一致，重点提供概览、容器、访问方式、事件、日志、终端与 YAML。')}
                </div>
              </div>
              <div className={styles.headerActions}>
                <Button icon="left" onClick={this.goToPodList}>
                  {t('resourceCenter.detail.returnPod', '返回容器组')}
                </Button>
                <Button type="primary" icon="code" onClick={() => this.setState({ terminalVisible: true })}>
                  {t('resourceCenter.common.webTerminal', 'Web 终端')}
                </Button>
              </div>
            </div>
          </div>

          <Card bordered={false} className={styles.workspaceCard} bodyStyle={{ padding: '22px 24px 28px' }}>
            <Tabs activeKey={this.state.activeTab} onChange={this.handleTabChange}>
              <TabPane tab={t('resourceCenter.common.overview', '概览')} key="overview">{this.renderOverview()}</TabPane>
              <TabPane tab={t('resourceCenter.detail.containerList', '容器列表')} key="containers">{this.renderContainersTab()}</TabPane>
              <TabPane tab={t('resourceCenter.detail.accessMethods', '访问方式')} key="access">{this.renderAccessTab()}</TabPane>
              <TabPane tab={t('resourceCenter.common.events', '事件')} key="events">{this.renderEventsTab()}</TabPane>
              <TabPane tab={t('resourceCenter.common.logs', '日志')} key="logs">{this.renderLogsTab()}</TabPane>
              <TabPane tab="YAML" key="yaml">{this.renderYamlTab()}</TabPane>
            </Tabs>
          </Card>

          <TerminalModal
            visible={this.state.terminalVisible}
            onCancel={() => this.setState({ terminalVisible: false })}
            websocketURL={wsInfo && wsInfo.event_websocket_url}
            podName={summary.name}
            namespace={(wsInfo && wsInfo.namespace) || summary.namespace}
            containers={this.getContainerNames()}
          />

          {!detailLoading && !podDetail && (
            <Card bordered={false} className={styles.workspaceCard}>
              <Empty description={t('resourceCenter.detail.noPodDetail', '未找到容器组详情')} />
            </Card>
          )}
        </div>
      </PageHeaderLayout>
    );
  }
}

export default PodDetail;
