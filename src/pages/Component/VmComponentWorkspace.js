import React, { PureComponent } from 'react';
import { Alert, Badge, Button, Card, Descriptions, Empty, Modal, Spin, Tabs } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { formatMessage } from '@/utils/intl';
import globalUtil from '@/utils/global';
import { isPluginBaseId } from '@/utils/pluginArchUtils';
import Expansion from './expansion';
import Mnt from './mnt';
import Port from './port';
import Setting from './setting';
import Log from './log';
import EnvironmentConfiguration from './environmentConfiguration';
import Relation from './relation';
import ComponentPlugin from './componentPlugin';
import Overview from './overview';
import VMProfilePanel from './component/Basic/VMProfilePanel';
import VmSnapshots from './VmSnapshots';
import { deriveVmWorkspaceData } from './vmComponentWorkspaceData';
import { LEGACY_ADVANCED_TABS, normalizeVmComponentWorkspaceTab } from './vmComponentWorkspaceTabs';
import { shouldRefreshVMProfileForVNC } from './vmProfileRefreshHelpers';
import styles from './VmComponentWorkspace.less';

const text = key => formatMessage({ id: `componentOverview.vmWorkspace.${key}` });
const D = Descriptions.Item;
const POWER_STATUSES = ['running', 'closed', 'stopped', 'paused', 'waiting', 'starting', 'stopping', 'restoring', 'failure', 'failed', 'unusual', 'abnormal', 'building', 'build_fail', 'undeploy', 'deployed', 'incomplete', 'scheduling', 'pending', 'unknown'];

export class VmComponentWorkspace extends PureComponent {
  state = { refreshing: false, refreshFailed: false, hardwareEditorOpen: false };
  mounted = false;
  refreshGeneration = 0;
  operationRecordRef = null;

  componentDidMount() {
    this.mounted = true;
    this.refreshForConsole();
  }
  componentDidUpdate(previous) {
    if (previous.status !== this.props.status) this.refreshForConsole();
  }
  componentWillUnmount() {
    this.mounted = false;
    this.refreshGeneration += 1;
  }

  currentContext = () => ({
    team: this.props.teamName || globalUtil.getCurrTeamName(),
    region: this.props.regionName || globalUtil.getCurrRegionName(),
    application: globalUtil.getAppID(),
    alias: this.props.appAlias || globalUtil.getSlidePanelComponentID()
  });

  refreshProfile = () => {
    if (this.state.refreshing) return Promise.resolve();
    const context = this.currentContext();
    const generation = ++this.refreshGeneration;
    const isCurrent = () => this.mounted && generation === this.refreshGeneration &&
      context.team === globalUtil.getCurrTeamName() && context.region === globalUtil.getCurrRegionName() &&
      String(context.application) === String(globalUtil.getAppID()) && context.alias === globalUtil.getSlidePanelComponentID();
    if (!context.alias || !context.team || !isCurrent()) return Promise.resolve();
    this.setState({ refreshing: true, refreshFailed: false });
    return new Promise(resolve => {
      let finished = false;
      const finish = failed => {
        if (finished) return;
        finished = true;
        if (isCurrent()) this.setState({ refreshing: false, refreshFailed: !!failed });
        resolve();
      };
      const request = this.props.dispatch({
        type: 'appControl/fetchDetail',
        payload: { team_name: context.team, app_alias: context.alias },
        shouldApply: isCurrent,
        callback: () => finish(false),
        handleError: () => finish(true)
      });
      if (request && request.then) request.then(() => { if (!finished) finish(true); }, () => finish(true));
    });
  };

  refreshForConsole = () => {
    const tab = normalizeVmComponentWorkspaceTab(this.props.vmWorkspaceTab || this.props.type || globalUtil.getSlidePanelTab());
    if (tab !== 'overview') return;
    if (shouldRefreshVMProfileForVNC({ appDetail: this.props.appDetail, status: this.props.status, refreshing: this.state.refreshing }))
      this.refreshProfile();
  };

  getOperationRecord = () => this.operationRecordRef?.getWrappedInstance
    ? this.operationRecordRef.getWrappedInstance() : this.operationRecordRef;
  onAction = value => {
    const record = this.getOperationRecord();
    if (record?.onAction) record.onAction(value);
  };
  onLogPush = value => {
    const record = this.getOperationRecord();
    if (record?.onLogPush) record.onLogPush(value);
  };

  openHardwareEditor = () => {
    if (this.props.componentPermissions?.isTelescopic) this.setState({ hardwareEditorOpen: true });
  };
  closeHardwareEditor = () => this.setState({ hardwareEditorOpen: false });

  changeAdvancedSection = key => {
    const context = this.currentContext();
    const refresh = globalUtil.getRefresh();
    this.props.dispatch(routerRedux.push({
      pathname: `/team/${context.team}/region/${context.region}/apps/${context.application}/overview`,
      query: { type: 'components', componentID: context.alias, tab: 'advancedSettings', subTab: key,
        ...(refresh ? { refresh } : {}) }
    }));
  };

  renderOverview = data => {
    const profileProps = { ...this.props, vmProfile: this.props.appDetail?.vm_profile || {},
      serviceAlias: this.currentContext().alias, onRefresh: this.refreshProfile,
      ...(['closed', 'stopped', 'undeploy'].includes(data.powerStatus) ? { connectionUnavailableMessage: text('consoleStopped') } : {}) };
    const stateKey = POWER_STATUSES.includes(data.powerStatus) ? data.powerStatus : 'unknown';
    const badgeStatus = stateKey === 'running' ? 'success' : ['failure', 'failed', 'unusual', 'abnormal', 'build_fail'].includes(stateKey) ? 'error' : 'default';
    const value = (amount, unit) => amount === null || amount === undefined ? text('notReported') : `${amount}${unit ? ` ${unit}` : ''}`;
    const unavailable = !data.guestStatus || data.guestStatus === 'unavailable';
    const guestMessage = unavailable ? `guest.reason.${data.guestReason}` : `guest.status.${data.guestStatus}`;
    const toolsMessage = unavailable ? guestMessage : ['powered_off', 'paused', 'starting'].includes(data.guestStatus)
      ? `guest.status.${data.guestStatus}` : data.agentConnected === true ? 'connected'
      : data.agentConnected === false ? 'disconnected' : 'guest.agentNotDetected';
    return <div>
      <dl className={styles.resourceStrip}>
        <div><dt>{text('powerState')}</dt><dd><Badge status={badgeStatus} text={text(`power.${stateKey}`)} /></dd></div>
        <div><dt>{text('cpu')}</dt><dd>{value(data.cpuCores, text('cores'))}</dd></div>
        <div><dt>{text('memory')}</dt><dd>{value(data.memoryGiB, 'GiB')}</dd></div>
        <div><dt>{text('systemDisk')}</dt><dd>{value(data.rootDiskGiB, 'GiB')}</dd></div>
      </dl>
      <div className={styles.overviewColumns}>
        <div className={styles.column}>
          <Card title={text('stateTitle')} size="small" extra={<Button size="small" icon="reload" loading={this.state.refreshing} onClick={this.refreshProfile}>{text('refresh')}</Button>}>
            <Descriptions column={1} size="small">
              <D label={text('guestState')}>{text(guestMessage)}</D>
              <D label={text('guestTools')}>{text(toolsMessage)}</D>
              <D label={text('operatingSystem')}>{data.osName || text('notReported')}</D>
              <D label={text('architecture')}>{data.arch || text('notReported')}</D>
            </Descriptions>
            <p className={styles.note}>{text('guestToolsHelp')}</p>
          </Card>
        </div>
        <VMProfilePanel {...profileProps} section="network" networkTitle={text('connectTitle')} includeConnections />
      </div>
      <Overview {...this.props} section="operations" ref={ref => { this.operationRecordRef = ref; }} />
    </div>;
  };

  renderAdvanced = () => {
    const permissions = this.props.permissions || this.props.componentPermissions || {};
    const rawTab = globalUtil.getSlidePanelTab();
    const routeSubTab = globalUtil.getSlidePanelSubTab();
    const requested = LEGACY_ADVANCED_TABS.includes(rawTab) ? rawTab : routeSubTab;
    const sections = [
      { key: 'log', label: formatMessage({ id: 'componentOverview.body.tab.bar.log' }), allowed: true, Component: Log },
      { key: 'environmentConfiguration', label: formatMessage({ id: 'componentOverview.body.tab.bar.environmentConfiguration' }), allowed: !!permissions.isEnv, Component: EnvironmentConfiguration },
      { key: 'relation', label: formatMessage({ id: 'componentOverview.body.tab.bar.relation' }), allowed: !!permissions.isRely, Component: Relation },
      { key: 'setting', label: formatMessage({ id: 'componentOverview.body.tab.bar.setting' }), allowed: !!permissions.isOtherSetting, Component: Setting }
    ].filter(section => section.allowed);
    const desired = requested || 'log';
    const activeKey = sections.some(section => section.key === desired) ? desired : sections[0].key;
    return <Tabs activeKey={activeKey} onChange={this.changeAdvancedSection} animated={false}>
      {sections.map(({ key, label, Component }) => <Tabs.TabPane key={key} tab={label}>
        {activeKey === key && <Component {...this.props} />}
      </Tabs.TabPane>)}
    </Tabs>;
  };

  render() {
    const { appDetail, status, componentPermissions = {}, vmWorkspacePlugins = [] } = this.props;
    if (appDetail?.service?.service_alias && this.currentContext().alias !== appDetail.service.service_alias) return <Spin />;
    const data = deriveVmWorkspaceData({ appDetail, status, guestObservationFailed: this.state.refreshFailed });
    const profileProps = { ...this.props, vmProfile: appDetail?.vm_profile || {},
      serviceAlias: this.currentContext().alias, onRefresh: this.refreshProfile,
      ...(['closed', 'stopped', 'undeploy'].includes(data.powerStatus) ? { connectionUnavailableMessage: text('consoleStopped') } : {}) };
    const tab = normalizeVmComponentWorkspaceTab(this.props.vmWorkspaceTab || this.props.type || globalUtil.getSlidePanelTab(), globalUtil.getSlidePanelSubTab());
    let content;
    if (tab === 'overview') content = this.renderOverview(data);
    else if (tab === 'expansion') content = <div className={styles.sectionStack}>
      <Card title={text('computeTitle')} size="small" className={styles.computeCard}
        extra={componentPermissions.isTelescopic ? <Button size="small" onClick={this.openHardwareEditor}>{text('editCompute')}</Button> : null}>
        <Descriptions column={2} size="small">
          <D label={text('cpu')}>{data.cpuCores === null ? text('notReported') : `${data.cpuCores} ${text('cores')}`}</D>
          <D label={text('memory')}>{data.memoryGiB === null ? text('notReported') : `${data.memoryGiB} GiB`}</D>
        </Descriptions>
      </Card>
      {componentPermissions.isTelescopic && <Modal title={text('editComputeTitle')} visible={this.state.hardwareEditorOpen}
        footer={null} onCancel={this.closeHardwareEditor} destroyOnClose width={800}>
        {this.state.hardwareEditorOpen && <Expansion {...this.props} method="vm" vmWorkspaceEditor
          vmWorkspaceEditorActive={this.state.hardwareEditorOpen}
          onVmWorkspaceResourceSaved={this.refreshProfile} onCancelVmWorkspaceEditor={this.closeHardwareEditor} />}
      </Modal>}
      {componentPermissions.isStorage && <Mnt {...this.props} />}
      <VMProfilePanel {...profileProps} section="acceleration" />
    </div>;
    else if (tab === 'port') content = <div className={styles.sectionStack}>
      <VMProfilePanel {...profileProps} section="network" />
      {componentPermissions.isPort ? <Port {...this.props} vmWorkspace /> : <Alert type="info" showIcon message={text('portPermissionRequired')} />}
    </div>;
    else if (tab === 'snapshots') content = <VmSnapshots context={{ ...this.currentContext(), serviceId: appDetail?.service?.service_id || '' }}
      pollingEnabled={this.props.pollingEnabled} dispatch={this.props.dispatch} />;
    else if (tab === 'advancedSettings') content = this.renderAdvanced();
    else if (tab === 'rainbond-vm') content = vmWorkspacePlugins.some(plugin => isPluginBaseId(plugin, 'rainbond-vm'))
      ? <ComponentPlugin {...this.props} type="rainbond-vm" /> : <Empty description={text('monitorUnavailable')} />;
    else content = <Empty description={text('notReported')} />;
    return <div className={styles.workspace}>
      {this.state.refreshFailed && <Alert type="warning" showIcon message={text('refreshFailed')} />}
      {content}
    </div>;
  }
}

export default connect(null, null, null, { withRef: true })(VmComponentWorkspace);
