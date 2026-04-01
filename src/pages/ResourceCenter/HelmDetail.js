import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { formatMessage } from '@/utils/intl';
import {
  Button,
  Card,
  Empty,
  Input,
  notification,
  Popconfirm,
  Spin,
  Table,
  Tabs,
  Tag,
} from 'antd';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import HelmUpgradeModal from './components/HelmUpgradeModal';
import ResourceBreadcrumbTitle from './components/ResourceBreadcrumbTitle';
import styles from './detail.less';
import {
  formatToBeijingTime,
  getResourceStatusText,
  getResourceStatusTone,
  getWorkloadKindLabel,
} from './utils';

const { TabPane } = Tabs;
const { TextArea } = Input;
const t = (id, defaultMessage, values) => formatMessage({ id, defaultMessage }, values);

const WORKLOAD_ROUTE_MAP = {
  Deployment: { group: 'apps', version: 'v1', resource: 'deployments' },
  StatefulSet: { group: 'apps', version: 'v1', resource: 'statefulsets' },
  DaemonSet: { group: 'apps', version: 'v1', resource: 'daemonsets' },
  Job: { group: 'batch', version: 'v1', resource: 'jobs' },
  CronJob: { group: 'batch', version: 'v1', resource: 'cronjobs' },
};

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

@connect(({ teamResources, enterprise, loading }) => ({
  helmReleaseDetail: teamResources.helmReleaseDetail,
  currentEnterprise: enterprise.currentEnterprise,
  detailLoading: loading.effects['teamResources/fetchHelmReleaseDetail'],
}))
class HelmDetail extends PureComponent {
  state = {
    activeTab: 'overview',
    rollbackLoading: false,
    upgradeVisible: false,
    autoUpgradeRequested: false,
  };

  componentDidMount() {
    this.fetchDetail(this.maybeOpenUpgradeFromQuery);
  }

  componentDidUpdate(prevProps) {
    const prevName = prevProps.match && prevProps.match.params && prevProps.match.params.releaseName;
    const nextName = this.props.match && this.props.match.params && this.props.match.params.releaseName;
    if (prevName !== nextName) {
      this.setState({
        upgradeVisible: false,
        autoUpgradeRequested: false,
      }, () => this.fetchDetail(this.maybeOpenUpgradeFromQuery));
    }
  }

  getRouteParams() {
    const { match } = this.props;
    return (match && match.params) || {};
  }

  fetchDetail = (callback) => {
    const { dispatch } = this.props;
    const params = this.getRouteParams();
    const done = typeof callback === 'function' ? callback : null;
    dispatch({
      type: 'teamResources/fetchHelmReleaseDetail',
      payload: {
        team: params.teamName,
        region: params.regionName,
        release_name: params.releaseName,
      },
      callback: detail => {
        if (done) {
          done(detail);
        }
      },
      handleError: err => {
        notification.error({
          message: (err && (err.msg_show || (err.response && err.response.data && err.response.data.msg_show))) || t('resourceCenter.detail.loadHelmFailed', '读取 Helm 详情失败'),
        });
      },
    });
  };

  maybeOpenUpgradeFromQuery = () => {
    const query = ((this.props.location || {}).query) || {};
    if (query.upgrade === 'true' && !this.state.autoUpgradeRequested) {
      this.setState({
        upgradeVisible: true,
        autoUpgradeRequested: true,
      });
    }
  };

  goToHelmList = () => {
    const { dispatch } = this.props;
    const params = this.getRouteParams();
    dispatch(routerRedux.push({
      pathname: `/team/${params.teamName}/region/${params.regionName}/resource-center`,
      query: { tab: 'helm' },
    }));
  };

  goToResourceCenter = () => {
    const { dispatch } = this.props;
    const params = this.getRouteParams();
    dispatch(routerRedux.push({
      pathname: `/team/${params.teamName}/region/${params.regionName}/resource-center`,
    }));
  };

  jumpToWorkload = (record) => {
    const route = WORKLOAD_ROUTE_MAP[record.kind];
    if (!route) {
      return;
    }
    const { dispatch } = this.props;
    const params = this.getRouteParams();
    dispatch(routerRedux.push({
      pathname: `/team/${params.teamName}/region/${params.regionName}/resource-center/workloads/${route.resource}/${record.name}`,
      query: {
        group: route.group,
        version: route.version,
        tab: 'workload',
        workloadKind: route.resource,
      },
    }));
  };

  jumpToService = (record) => {
    const { dispatch } = this.props;
    const params = this.getRouteParams();
    const serviceName = (record && record.name) || record;
    dispatch(routerRedux.push({
      pathname: `/team/${params.teamName}/region/${params.regionName}/resource-center/services/${serviceName}`,
    }));
  };

  handleTabChange = activeTab => {
    this.setState({ activeTab });
  };

  handleRollback = (revision) => {
    const { dispatch, helmReleaseDetail } = this.props;
    const params = this.getRouteParams();
    const releaseName = (((helmReleaseDetail || {}).summary || {}).name) || params.releaseName;
    this.setState({ rollbackLoading: true });
    dispatch({
      type: 'teamResources/rollbackRelease',
      payload: {
        team: params.teamName,
        region: params.regionName,
        release_name: releaseName,
        revision,
      },
      callback: () => {
        this.setState({ rollbackLoading: false });
        notification.success({ message: t('resourceCenter.detail.rollbackSuccess', '已回滚到 revision {revision}', { revision }) });
        this.fetchDetail();
      },
      handleError: err => {
        this.setState({ rollbackLoading: false });
        notification.error({
          message: (err && (err.msg_show || (err.response && err.response.data && err.response.data.msg_show))) || t('resourceCenter.helm.rollbackFailed', '回滚失败'),
        });
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

  renderOverviewTable(title, dataSource, columns, emptyText) {
    return (
      <Card bordered={false} className={styles.workspaceCard} bodyStyle={{ padding: '0 20px 20px' }}>
        <div className={`${styles.toolbar} ${styles.detailCardToolbar}`}>
          <div>
              <div className={styles.cardTitle}>{title}</div>
              <div className={styles.toolbarMeta}>
              <span>{t('resourceCenter.detail.releaseObjects', '{count} 个对象', { count: dataSource.length })}</span>
            </div>
          </div>
        </div>
        <div className={styles.tableShell}>
          <Table
            dataSource={dataSource}
            columns={columns}
            rowKey={record => `${record.kind}-${record.name}`}
            size="middle"
            pagination={dataSource.length > 10 ? { pageSize: 10, size: 'small' } : false}
            locale={{ emptyText }}
          />
        </div>
      </Card>
    );
  }

  renderOverview() {
    const detail = this.props.helmReleaseDetail || {};
    const summary = detail.summary || {};
    const sourceInfo = summary.source_info || {};
    const sourceTypeText = sourceInfo.upgrade_mode === 'store_locked'
      ? t('resourceCenter.detail.releaseSource.store', 'Helm 商店')
      : t('resourceCenter.detail.releaseSource.external', '第三方仓库 / OCI 或上传 Chart 包');
    const workloads = detail.workloads || [];
    const services = detail.services || [];
    const others = detail.others || [];

    const workloadColumns = [
      {
        title: t('resourceCenter.common.name', '名称'),
        dataIndex: 'name',
        key: 'name',
        render: (text, record) => {
          const clickable = !!WORKLOAD_ROUTE_MAP[record.kind];
          if (!clickable) {
            return text || '-';
          }
          return (
            <span className={styles.nameLink} onClick={() => this.jumpToWorkload(record)}>
              {text}
            </span>
          );
        },
      },
      {
        title: t('resourceCenter.common.type', '类型'),
        dataIndex: 'kind',
        key: 'kind',
        render: value => getWorkloadKindLabel(value || '-'),
      },
      {
        title: t('resourceCenter.common.status', '状态'),
        dataIndex: 'status',
        key: 'status',
        render: value => <span className={getStatusClass(value)}>{getResourceStatusText(value)}</span>,
      },
      {
        title: t('resourceCenter.common.replicas', '副本/容量'),
        key: 'replicas',
        render: (_, record) => (
          record.replicas !== undefined
            ? `${record.ready_replicas || 0}/${record.replicas || 0}`
            : '-'
        ),
      },
      { title: t('resourceCenter.common.createdAt', '创建时间'), dataIndex: 'created_at', key: 'created_at', render: value => formatToBeijingTime(value) },
    ];

    const serviceColumns = [
      {
        title: t('resourceCenter.common.name', '名称'),
        dataIndex: 'name',
        key: 'name',
        render: (text, record) => (
          <span className={styles.nameLink} onClick={() => this.jumpToService(record)}>
            {text}
          </span>
        ),
      },
      { title: t('resourceCenter.common.type', '类型'), dataIndex: 'type', key: 'type', render: value => value || '-' },
      {
        title: t('resourceCenter.common.ports', '端口'),
        dataIndex: 'ports',
        key: 'ports',
        render: ports => (ports || []).map((item, index) => (
          <Tag key={`${item.port}-${index}`} color="geekblue">{`${item.port}/${item.protocol || 'TCP'}`}</Tag>
        )),
      },
      { title: t('resourceCenter.detail.clusterIp', 'Cluster IP'), dataIndex: 'cluster_ip', key: 'cluster_ip', render: value => value || '-' },
      {
        title: t('resourceCenter.common.status', '状态'),
        dataIndex: 'status',
        key: 'status',
        render: value => <span className={getStatusClass(value)}>{getResourceStatusText(value)}</span>,
      },
    ];

    const otherColumns = [
      { title: t('resourceCenter.common.name', '名称'), dataIndex: 'name', key: 'name' },
      { title: t('resourceCenter.common.type', '类型'), dataIndex: 'kind', key: 'kind' },
      {
        title: t('resourceCenter.common.status', '状态'),
        dataIndex: 'status',
        key: 'status',
        render: value => <span className={getStatusClass(value)}>{getResourceStatusText(value)}</span>,
      },
      { title: t('resourceCenter.common.createdAt', '创建时间'), dataIndex: 'created_at', key: 'created_at', render: value => formatToBeijingTime(value) },
    ];

    return (
      <div>
        <div className={styles.heroStats}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('resourceCenter.common.status', '状态')}</div>
            <div className={styles.statValue}>{getResourceStatusText(summary.status)}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('resourceCenter.detail.revision', 'Revision')}</div>
            <div className={styles.statValue}>{summary.revision || 0}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('resourceCenter.tab.workload.title', '工作负载')}</div>
            <div className={styles.statValue}>{workloads.length}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('resourceCenter.detail.services', '服务')}</div>
            <div className={styles.statValue}>{services.length}</div>
          </div>
        </div>

        <div className={styles.overviewGrid}>
          <Card bordered={false} className={styles.infoCard} title={<span className={styles.cardTitle}>{t('resourceCenter.detail.basicInfo', '基本信息')}</span>}>
            <div className={styles.infoList}>
              {this.renderInfoRow(t('resourceCenter.common.name', '名称'), summary.name)}
              {this.renderInfoRow(t('resourceCenter.common.status', '状态'), <span className={getStatusClass(summary.status)}>{getResourceStatusText(summary.status)}</span>)}
              {this.renderInfoRow(t('resourceCenter.common.namespace', '命名空间'), <code className={styles.monoText}>{summary.namespace || '-'}</code>)}
              {this.renderInfoRow(t('resourceCenter.common.chart', 'Chart'), summary.chart)}
              {this.renderInfoRow(t('resourceCenter.detail.chartVersion', 'Chart 版本'), summary.chart_version)}
              {this.renderInfoRow(t('resourceCenter.detail.installSource', '安装来源'), sourceTypeText)}
              {this.renderInfoRow(t('resourceCenter.detail.sourceRepo', '来源仓库'), sourceInfo.repo_name || '-')}
              {this.renderInfoRow(t('resourceCenter.common.appVersion', '应用版本'), summary.app_version)}
              {this.renderInfoRow(t('resourceCenter.detail.revision', 'Revision'), summary.revision || 0)}
              {this.renderInfoRow(t('resourceCenter.common.updatedAt', '更新时间'), formatToBeijingTime(summary.updated))}
            </div>
          </Card>
          <Card bordered={false} className={styles.infoCard} title={<span className={styles.cardTitle}>{t('resourceCenter.detail.changeLog', '变更说明')}</span>}>
            <div className={styles.infoList}>
              {this.renderInfoRow(t('resourceCenter.detail.release', 'Release'), summary.name)}
              {this.renderInfoRow(t('resourceCenter.detail.description', '描述'), summary.description || t('resourceCenter.detail.noExtraChangeLog', '当前版本未提供额外变更说明'))}
              {this.renderInfoRow(t('resourceCenter.detail.valuesConfig', '参数配置'), summary.values ? t('resourceCenter.detail.loadedValues', '已加载最近提交的 values.yaml') : t('resourceCenter.detail.noReturnedValues', '当前版本未返回 values'))}
            </div>
          </Card>
        </div>

        <div className={styles.sectionSplit}>
          {this.renderOverviewTable(t('resourceCenter.tab.workload.title', '工作负载'), workloads, workloadColumns, t('resourceCenter.detail.noReleaseWorkloads', '当前 Release 下暂无工作负载'))}
        </div>
        <div className={styles.sectionSplit}>
          {this.renderOverviewTable(t('resourceCenter.detail.services', '服务'), services, serviceColumns, t('resourceCenter.detail.noReleaseServices', '当前 Release 下暂无服务'))}
        </div>
        <div className={styles.sectionSplit}>
          {this.renderOverviewTable(t('platformResources.tab.other', '其他资源'), others, otherColumns, t('resourceCenter.detail.noReleaseOthers', '当前 Release 下暂无其他资源'))}
        </div>
      </div>
    );
  }

  renderHistory() {
    const detail = this.props.helmReleaseDetail || {};
    const summary = detail.summary || {};
    const history = detail.history || [];
    const columns = [
      { title: t('resourceCenter.detail.revision', 'Revision'), dataIndex: 'revision', key: 'revision', width: 100 },
      {
        title: t('resourceCenter.common.chart', 'Chart'),
        dataIndex: 'chart',
        key: 'chart',
        render: (value, record) => (
          <span>
            <span>{value || '-'}</span>
            {record.chart_version ? <span className={styles.chartVersionText}>@{record.chart_version}</span> : null}
          </span>
        ),
      },
      {
        title: t('resourceCenter.common.status', '状态'),
        dataIndex: 'status',
        key: 'status',
        render: value => <span className={getStatusClass(value)}>{getResourceStatusText(value)}</span>,
      },
      { title: t('resourceCenter.common.appVersion', '应用版本'), dataIndex: 'app_version', key: 'app_version' },
      { title: t('resourceCenter.common.updatedAt', '更新时间'), dataIndex: 'updated', key: 'updated', render: value => formatToBeijingTime(value) },
      { title: t('resourceCenter.detail.description', '说明'), dataIndex: 'description', key: 'description' },
      {
        title: t('resourceCenter.common.operation', '操作'),
        key: 'action',
        width: 120,
        render: (_, record) => (
          record.revision === summary.revision
            ? <span className={styles.currentVersionText}>{t('resourceCenter.detail.currentVersion', '当前版本')}</span>
            : (
              <Popconfirm
                title={t('resourceCenter.detail.rollbackToRevision', '确认回滚到 revision {revision}？', { revision: record.revision })}
                onConfirm={() => this.handleRollback(record.revision)}
              >
                <a className={styles.detailActionLink}>{t('resourceCenter.detail.rollbackToVersion', '回滚到此版本')}</a>
              </Popconfirm>
            )
        ),
      },
    ];

    return (
      <Card bordered={false} className={styles.workspaceCard}>
        <div className={styles.toolbar}>
          <div>
            <div className={styles.cardTitle}>{t('resourceCenter.detail.historyVersions', '历史版本')}</div>
            <div className={styles.toolbarMeta}>
              <span>{t('resourceCenter.detail.revisionRecords', '{count} 条 revision 记录', { count: history.length })}</span>
              <span className={styles.toolbarDot} />
              <span>{t('resourceCenter.detail.revisionHint', '可在这里直接回滚到任意历史版本')}</span>
            </div>
          </div>
        </div>
        <div className={styles.tableShell}>
          <Table
            dataSource={history}
            columns={columns}
            loading={this.state.rollbackLoading}
            rowKey={record => String(record.revision)}
            pagination={history.length > 10 ? { pageSize: 10, size: 'small' } : false}
            locale={{ emptyText: t('resourceCenter.detail.noHistory', '暂无历史版本') }}
          />
        </div>
      </Card>
    );
  }

  renderValues() {
    const detail = this.props.helmReleaseDetail || {};
    const summary = detail.summary || {};
    return (
      <Card bordered={false} className={styles.workspaceCard}>
        <div className={styles.toolbar}>
          <div>
            <div className={styles.cardTitle}>{t('resourceCenter.detail.valuesConfig', '参数配置')}</div>
            <div className={styles.toolbarMeta}>
              <span>{t('resourceCenter.detail.valuesHint1', '展示当前 Release 最近一次提交的 values.yaml')}</span>
              <span className={styles.toolbarDot} />
              <span>{t('resourceCenter.detail.valuesHint2', '如需修改，请点击右上角升级后提交新 values')}</span>
            </div>
          </div>
        </div>
        <div className={styles.yamlPanel}>
          <TextArea
            value={summary.values || t('resourceCenter.detail.noValues', '# 当前版本没有返回 values 配置')}
            readOnly
            rows={20}
            className={styles.yamlEditor}
          />
        </div>
      </Card>
    );
  }

  render() {
    const { detailLoading, helmReleaseDetail, currentEnterprise, dispatch } = this.props;
    const summary = ((helmReleaseDetail || {}).summary) || {};
    const params = this.getRouteParams();

    return (
      <PageHeaderLayout
        title={(
          <ResourceBreadcrumbTitle
            items={[
              { label: t('resourceCenter.page.title', 'K8S 原生资源'), onClick: this.goToResourceCenter },
              { label: t('resourceCenter.tab.helm.title', 'Helm 应用'), onClick: this.goToHelmList },
            ]}
            current={summary.name || params.releaseName}
            styles={styles}
          />
        )}
        content={t('resourceCenter.detail.helmContent', '查看 Release 概览、历史版本、参数配置，以及关联工作负载和服务。')}
        titleSvg={pageheaderSvg.getPageHeaderSvg('k8s', 18)}
        wrapperClassName={styles.detailPageLayout}
      >
        <div className={styles.detailPage}>
          <div className={styles.detailHeader}>
            <div className={styles.headerRow}>
              <div className={styles.titleWrap}>
                <span className={styles.eyebrow}>{t('resourceCenter.tab.helm.title', 'Helm 应用')}</span>
                <div className={styles.titleLine}>
                  <h1 className={styles.title}>{summary.name || params.releaseName}</h1>
                  <span className={getStatusClass(summary.status)}>{getResourceStatusText(summary.status)}</span>
                </div>
                <div className={styles.summaryText}>
                  {t('resourceCenter.detail.helmSummary', '这里聚焦 Helm Release 本身、关联工作负载、服务、其他资源、历史版本与参数配置。卸载仍保留在列表页，升级和回滚在详情页内完成。')}
                </div>
              </div>
              <div className={styles.headerActions}>
                <Button type="primary" onClick={() => this.setState({ upgradeVisible: true })}>{t('resourceCenter.common.upgrade', '升级')}</Button>
                <Button onClick={() => this.setState({ activeTab: 'history' })}>{t('resourceCenter.common.rollback', '回滚')}</Button>
                <Button onClick={() => this.fetchDetail()} loading={detailLoading}>{t('resourceCenter.common.refresh', '刷新')}</Button>
              </div>
            </div>
          </div>

          <Spin spinning={detailLoading}>
            {helmReleaseDetail ? (
              <Card bordered={false} className={styles.workspaceCard} bodyStyle={{ padding: 24 }}>
                <Tabs activeKey={this.state.activeTab} onChange={this.handleTabChange}>
                  <TabPane tab={t('resourceCenter.common.overview', '概览')} key="overview">
                    {this.renderOverview()}
                  </TabPane>
                  <TabPane tab={t('resourceCenter.detail.historyVersions', '历史版本')} key="history">
                    {this.renderHistory()}
                  </TabPane>
                  <TabPane tab={t('resourceCenter.detail.valuesConfig', '参数配置')} key="values">
                    {this.renderValues()}
                  </TabPane>
                </Tabs>
              </Card>
            ) : null}

            {!detailLoading && !helmReleaseDetail ? (
              <Card bordered={false} className={styles.workspaceCard}>
                <div className={styles.emptyPanel}>
                  <Empty description={t('resourceCenter.detail.noHelmDetail', '未找到 Helm Release 详情')} />
                </div>
              </Card>
            ) : null}
          </Spin>

          <HelmUpgradeModal
            visible={this.state.upgradeVisible}
            targetRelease={summary}
            dispatch={dispatch}
            teamName={params.teamName}
            regionName={params.regionName}
            currentEnterprise={currentEnterprise}
            onClose={() => this.setState({ upgradeVisible: false })}
            onSuccess={() => {
              this.setState({ upgradeVisible: false });
              notification.success({ message: t('resourceCenter.detail.upgradeSuccess', '升级成功') });
              this.fetchDetail();
            }}
          />
        </div>
      </PageHeaderLayout>
    );
  }
}

export default HelmDetail;
