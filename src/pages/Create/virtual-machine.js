import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { Alert, Button, Card, Form, Modal, Select, Spin, message } from 'antd';
import { formatMessage } from '@/utils/intl';
import AddGroup from '../../components/AddOrEditGroup';
import globalUtil from '../../utils/global';
import roleUtil from '../../utils/newRole';
import PluginUtils from '../../utils/pulginUtils';
import styles from './Index.less';
import { normalizeVmTargetGroupId, requestedVmTargetGroup, vmCreationEntryDestination, vmCreationTargetGroups, vmEntryQuery, vmCreationEntryPermissions } from './vmCreationEntry';

const { Option } = Select;

@connect(({ user, teamControl }) => ({
  currUser: user.currentUser,
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
}))
export default class Index extends PureComponent {
  state = { groups: [], groupsStatus: 'loading', pluginStatus: 'loading', selectedGroupId: '', addGroup: false, addGroupSubmitting: false, invalidTarget: false };
  mounted = false;
  scope = null;
  navigating = false;

  componentDidMount() {
    this.mounted = true;
    this.loadTargets();
  }

  componentDidUpdate() {
    if (this.scope && (this.scope.team !== globalUtil.getCurrTeamName() ||
        this.scope.region !== globalUtil.getCurrRegionName() || this.scope.enterprise !== this.enterpriseId() ||
        this.accessGranted !== this.canCreate() || this.applicationCreationGranted !== this.canCreateApplication() || this.entryGroup !== requestedVmTargetGroup(this.props, globalUtil.getAppID()))) this.loadTargets();
  }

  componentWillUnmount() {
    this.mounted = false;
    this.scope = null;
    this.addGroupSession = null;
  }

  enterpriseId = () => this.props.currUser?.enterprise_id || this.props.currentEnterprise?.enterprise_id || '';

  permissionsFor = groupId => vmCreationEntryPermissions(roleUtil, this.props.currentTeamPermissionsInfo?.team, groupId);

  canCreateApplication = () => this.permissionsFor('').canCreateApplication;

  canAddToGroup = groupId => this.permissionsFor(groupId).canCreateInApplication;

  canCreate = () => {
    const target = requestedVmTargetGroup(this.props, globalUtil.getAppID());
    return target ? this.canAddToGroup(target) : this.canCreateApplication();
  };

  isCurrent = scope => this.mounted && !!scope && scope === this.scope && scope.team === globalUtil.getCurrTeamName() &&
    scope.region === globalUtil.getCurrRegionName() && scope.enterprise === this.enterpriseId() && this.canCreate();

  loadTargets = () => {
    const scope = { team: globalUtil.getCurrTeamName(), region: globalUtil.getCurrRegionName(), enterprise: this.enterpriseId() };
    this.scope = scope;
    this.addGroupSession = null;
    this.navigating = false;
    this.accessGranted = this.canCreate();
    this.applicationCreationGranted = this.canCreateApplication();
    this.entryGroup = requestedVmTargetGroup(this.props, globalUtil.getAppID());
    this.requestedGroup = this.entryGroup;
    this.setState({ groups: [], groupsStatus: 'loading', pluginStatus: 'loading', selectedGroupId: '', addGroup: false, addGroupSubmitting: false, invalidTarget: false });
    if (!this.isCurrent(scope)) return;
    const fail = name => { if (this.isCurrent(scope)) this.setState({ [name]: 'failed' }); };
    this.props.dispatch({
      type: 'global/fetchGroups',
      payload: { team_name: scope.team, region_name: scope.region },
      shouldApply: () => this.isCurrent(scope),
      callback: groups => {
        if (!this.isCurrent(scope)) return;
        if (!Array.isArray(groups)) { fail('groupsStatus'); return; }
        this.setState({ groups: vmCreationTargetGroups(groups), groupsStatus: 'ready' }, this.openRequestedTarget);
      },
      handleError: () => fail('groupsStatus')
    });
    if (!scope.enterprise) { fail('pluginStatus'); return; }
    this.props.dispatch({
      type: 'teamControl/fetchPluginUrl',
      payload: { enterprise_id: scope.enterprise, region_name: scope.region },
      shouldApply: () => this.isCurrent(scope),
      callback: response => {
        if (!this.isCurrent(scope)) return;
        if (Number(response?.status_code) !== 200 || !Array.isArray(response.list)) { fail('pluginStatus'); return; }
        this.setState({ pluginStatus: PluginUtils.isInstallPlugin(response.list, 'rainbond-vm') ? 'ready' : 'missing' }, this.openRequestedTarget);
      },
      handleError: () => fail('pluginStatus')
    });
  };

  openRequestedTarget = () => {
    if (this.state.groupsStatus !== 'ready' || this.state.pluginStatus !== 'ready' || !this.requestedGroup) return;
    const groupId = this.requestedGroup;
    this.requestedGroup = '';
    if (this.state.groups.some(group => normalizeVmTargetGroupId(group.group_id) === groupId)) this.openTarget(groupId);
    else this.setState({ invalidTarget: true });
  };

  openTarget = (groupId, scope = this.scope, newlyCreated = false) => {
    if (!this.isCurrent(scope) || this.navigating || this.state.pluginStatus !== 'ready' ||
        !(newlyCreated ? this.canCreateApplication() : this.canAddToGroup(groupId))) return;
    const destination = vmCreationEntryDestination(scope, groupId, vmEntryQuery(this.props.location).source_type);
    if (!destination) return;
    this.navigating = true;
    this.props.dispatch(routerRedux.replace(destination));
  };

  handleContinue = () => {
    const { groups, groupsStatus, selectedGroupId } = this.state;
    if (groupsStatus !== 'ready' || !this.canAddToGroup(selectedGroupId) ||
        !groups.some(group => normalizeVmTargetGroupId(group.group_id) === selectedGroupId)) {
      this.setState({ invalidTarget: true });
      return;
    }
    this.openTarget(selectedGroupId);
  };

  onAddGroup = () => {
    if (!this.isCurrent(this.scope) || !this.canCreateApplication() || this.state.pluginStatus !== 'ready') return;
    if (this.addGroupSession?.inFlight) return;
    this.addGroupSession = { scope: this.scope, inFlight: false };
    this.setState({ addGroup: true, addGroupSubmitting: false });
  };

  cancelAddGroup = session => {
    if (session !== this.addGroupSession) return;
    this.addGroupSession = null;
    if (this.mounted) this.setState({ addGroup: false, addGroupSubmitting: false });
  };

  isActiveGroupSession = session => !!session && session === this.addGroupSession &&
    this.state.addGroup && this.canCreateApplication() && this.isCurrent(session.scope);

  handleCreateGroup = (values, session) => {
    if (!this.isActiveGroupSession(session) || session.inFlight || !values ||
        typeof values.group_name !== 'string' || !values.group_name.trim() ||
        typeof values.k8s_app !== 'string' || !/^[a-z]([-a-z0-9]*[a-z0-9])?$/.test(values.k8s_app)) return;
    const attempt = {};
    session.inFlight = attempt;
    this.setState({ addGroupSubmitting: true });
    const fail = () => {
      if (!this.isActiveGroupSession(session) || session.inFlight !== attempt) return;
      session.inFlight = false;
      this.setState({ addGroupSubmitting: false });
      message.error(formatMessage({ id: 'notification.warn.malfunction' }));
    };
    const request = this.props.dispatch({
      type: 'application/addGroup',
      payload: {
        team_name: session.scope.team, region_name: session.scope.region,
        group_name: values.group_name, k8s_app: values.k8s_app,
        ...(typeof values.note === 'string' ? { note: values.note } : {}),
        ...(typeof values.logo === 'string' ? { logo: values.logo } : {})
      },
      callback: group => {
        if (!this.isActiveGroupSession(session) || session.inFlight !== attempt) return;
        const groupId = normalizeVmTargetGroupId(group?.group_id);
        if (!groupId) { fail(); return; }
        this.cancelAddGroup(session);
        this.openTarget(groupId, session.scope, true);
      },
      handleError: fail
    });
    if (request && request.then) request.then(fail, fail);
  };

  handlePluginInstall = () => {
    const scope = this.scope;
    if (!this.isCurrent(scope) || !this.props.currUser?.is_enterprise_admin) return;
    Modal.confirm({
      title: formatMessage({ id: 'componentOverview.body.CreateComponentModal.vm_install_required' }),
      content: formatMessage({ id: 'componentOverview.body.CreateComponentModal.vm_install_confirm_desc' }),
      onOk: () => {
        if (this.isCurrent(scope)) this.props.dispatch(routerRedux.push(
          `/enterprise/${scope.enterprise}/extension?regionName=${scope.region}`));
      }
    });
  };

  render() {
    if (!this.canCreate()) return roleUtil.noPermission();
    const { groups, groupsStatus, pluginStatus, selectedGroupId, addGroup, addGroupSubmitting, invalidTarget } = this.state;
    const addGroupSession = this.addGroupSession;
    const loading = groupsStatus === 'loading' || pluginStatus === 'loading';
    const failed = groupsStatus === 'failed' || pluginStatus === 'failed';
    const ready = groupsStatus === 'ready' && pluginStatus === 'ready';
    return <Card bordered={this.props.handleType !== 'Service'} title={formatMessage({ id: 'vmCreation.targetApplicationTitle' })}>
      <div className={styles.formWrap}>
        <p>{formatMessage({ id: 'vmCreation.targetApplicationHelp' })}</p>
        {loading && <Spin />}
        {failed && <>
          <Alert type="error" showIcon message={formatMessage({ id: 'vmCreation.targetApplicationsLoadFailed' })} />
          <Button onClick={this.loadTargets}>{formatMessage({ id: 'button.retry' })}</Button>
        </>}
        {pluginStatus === 'missing' && <>
          <Alert type="warning" showIcon message={formatMessage({ id: 'componentOverview.body.CreateComponentModal.vm_contact_admin_title' })}
            description={formatMessage({ id: 'componentOverview.body.CreateComponentModal.vm_contact_admin_desc' })} />
          {this.props.currUser?.is_enterprise_admin && <Button onClick={this.handlePluginInstall}>
            {formatMessage({ id: 'componentOverview.body.CreateComponentModal.vm_install_required' })}
          </Button>}
        </>}
        {invalidTarget && <Alert type="warning" showIcon message={formatMessage({ id: 'vmCreation.targetApplicationInvalid' })} />}
        <Form layout="vertical">
          <Form.Item label={formatMessage({ id: 'popover.newApp.appName' })}>
            <Select value={selectedGroupId || undefined} disabled={!ready} showSearch optionFilterProp="children"
              placeholder={formatMessage({ id: 'placeholder.app' })}
              onChange={value => this.setState({ selectedGroupId: value, invalidTarget: false })}>
              {groups.map(group => <Option key={String(group.group_id)} value={String(group.group_id)} disabled={!this.canAddToGroup(group.group_id)}>{group.group_name}</Option>)}
            </Select>
          </Form.Item>
          <Button type="primary" disabled={!ready || !selectedGroupId || !this.canAddToGroup(selectedGroupId)} onClick={this.handleContinue}>
            {formatMessage({ id: 'vmCreation.targetApplicationContinue' })}
          </Button>{' '}
          <Button disabled={!ready || !this.canCreateApplication()} onClick={this.onAddGroup}>{formatMessage({ id: 'popover.newApp.title' })}</Button>
        </Form>
      </div>
      {addGroup && addGroupSession && <AddGroup teamName={addGroupSession.scope.team} regionName={addGroupSession.scope.region}
        isAddGroup={false} isEditEnglishName loading={addGroupSubmitting}
        onCancel={() => this.cancelAddGroup(addGroupSession)} onOk={values => this.handleCreateGroup(values, addGroupSession)} />}
    </Card>;
  }
}
