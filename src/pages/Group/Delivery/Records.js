import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { Alert, Button, Descriptions, Drawer, Empty, message, Modal, Spin } from 'antd';
import moment from 'moment';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import pageheaderSvg from '../../../utils/pageHeaderSvg';
import { t, getScope, deliveryPath, canPublishTemplate } from './common';
import DeliveryFlow from './Flow';
import ComponentConfig from './ComponentConfig';
import CreateAppModels from '../../../components/CreateAppModels';
import TemplateExporter from './TemplateExporter';
import RecordTimeline from './RecordTimeline';
import { ListingModal, DeployModal, w, listingStatusLabel } from '../../../components/DeliveryWorkflow';
import styles from './index.less';
import timelineStyles from './records.less';
const { templateGroups, nextTemplateVersion } = require('../../../utils/templateTimeline');
const { deliveryScope } = require('../../../utils/templateDelivery');
const { deliveryTargetPath, deliveryTargetIsCached } = require('../../../utils/deliveryNavigation');

@connect(({ user, teamControl, templateDelivery, application, loading }) => ({
  user: user.currentUser, team: teamControl.currentTeam, permissions: teamControl.currentTeamPermissionsInfo,
  appDetail: application.groupDetail || {}, busy: loading.effects['deliveryCenter/act'] || loading.effects['templateDelivery/deleteVersion'],
  records: templateDelivery.records, templateInfo: templateDelivery.template,
  failed: templateDelivery.failed, loading: loading.effects['templateDelivery/records']
}))
export default class DeliveryRecords extends PureComponent {
  state = { detail: null, listings: [], deployments: [], listing: null, delivery: null, workflowFailed: false,
    checks: [], changesLoading: false, changesFailed: false, changesOpen: false, exporting: null, profileEditor: null };
  alive = false;
  generation = 0;
  checkTicket = 0;
  pendingDeliveryTaskId = '';
  pendingDeliveryRefreshId = '';
  componentDidMount() {
    this.alive = true;this.load();
    this.workflowTimer = setInterval(() => { if (!document.hidden) this.loadWorkflow(); }, 5000);
    window.addEventListener('focus', this.focus);
    document.addEventListener('visibilitychange', this.visibility);
  }
  componentWillUnmount() {
    this.alive = false;this.generation += 1;clearTimeout(this.checkTimer);clearInterval(this.workflowTimer);
    window.removeEventListener('focus', this.focus);
    document.removeEventListener('visibilitychange', this.visibility);
  }
  componentDidUpdate(previous) {
    if (JSON.stringify(previous.match.params) !== JSON.stringify(this.props.match.params) ||
      (previous.user || {}).enterprise_id !== (this.props.user || {}).enterprise_id || (previous.user || {}).user_id !== (this.props.user || {}).user_id) {
      this.generation += 1;this.checkTicket += 1;this.checking = false;this.acting = false;this.lastRecords = [];this.pendingDeliveryTaskId = '';this.pendingDeliveryRefreshId = '';clearTimeout(this.checkTimer);
      this.setState({ detail: null, listings: [], deployments: [], listing: null, delivery: null, checks: [], changesOpen: false, exporting: null, profileEditor: null }, this.load);
    } else if ((previous.records !== this.props.records || previous.loading && !this.props.loading) && !this.props.loading && !this.props.failed) {
      this.lastRecords = this.props.records;
      this.checkChanges(this.props.records);
    }
  }
  active = generation => this.alive && generation === this.generation;
  load = () => {
    if (!this.props.user) return;
    this.checkTicket += 1;this.checking = false;clearTimeout(this.checkTimer);
    const generation = this.generation, scope = getScope(this.props.match.params, this.props.user), sequence = (this.loadSequence || 0) + 1;
    this.loadSequence = sequence;
    this.props.dispatch({ type: 'templateDelivery/records', payload: scope, callback: records => {
      if (!this.active(generation) || sequence !== this.loadSequence) return;
      this.lastRecords = records;
      this.checkChanges(records);
    } });
    this.props.dispatch({ type: 'deliveryCenter/load', payload: { kind: 'application', scope, user: this.props.user }, callback: bean => {
      if (this.active(generation) && sequence === this.loadSequence && !this.followDelivery(bean.deployments)) this.setState({ listings: bean.listings, deployments: bean.deployments, workflowFailed: false });
    }, onError: () => { if (this.active(generation) && sequence === this.loadSequence) this.setState({ workflowFailed: true }); } });
  };
  loadWorkflow = () => {
    if (!this.props.user || this.workflowLoading) return;
    this.workflowLoading = true;
    const generation = this.generation;
    this.props.dispatch({ type: 'deliveryCenter/load', payload: { kind: 'application',
      scope: getScope(this.props.match.params, this.props.user), user: this.props.user }, callback: bean => {
      this.workflowLoading = false;
      if (this.active(generation) && !this.followDelivery(bean.deployments)) this.setState({ listings: bean.listings, deployments: bean.deployments, workflowFailed: false });
    }, onError: () => { this.workflowLoading = false; } });
  };
  followDelivery = tasks => {
    if (!this.pendingDeliveryTaskId) return false;
    const task = (tasks || []).find(item => item.id === this.pendingDeliveryTaskId);
    if (!task) return false;
    if (['failed', 'cancelled'].includes(task.status)) { this.pendingDeliveryTaskId = '';this.pendingDeliveryRefreshId = '';return false; }
    const path = deliveryTargetPath(task);
    if (!path) return false;
    if (!deliveryTargetIsCached(this.props.user, task)) {
      if (this.pendingDeliveryRefreshId === task.id) return true;
      const generation = this.generation;
      this.pendingDeliveryRefreshId = task.id;
      this.props.dispatch({ type: 'user/fetchCurrent', payload: { team_name: task.target.team_name }, callback: response => {
        if (!this.active(generation) || this.pendingDeliveryTaskId !== task.id) return;
        this.pendingDeliveryRefreshId = '';
        this.pendingDeliveryTaskId = '';
        if (deliveryTargetIsCached(response && response.bean, task)) this.props.dispatch(routerRedux.push(path));
      }, handleError: () => {
        if (this.active(generation) && this.pendingDeliveryRefreshId === task.id) this.pendingDeliveryRefreshId = '';
      } });
      return true;
    }
    this.pendingDeliveryTaskId = '';
    this.pendingDeliveryRefreshId = '';
    this.props.dispatch(routerRedux.push(path));
    return true;
  };
  focus = () => this.checkChanges();
  visibility = () => { if (!document.hidden) this.checkChanges(); else clearTimeout(this.checkTimer); };
  scheduleCheck = () => {
    clearTimeout(this.checkTimer);
    if (this.alive && !document.hidden && (this.lastRecords || []).some(item => !item.deleted_at)) this.checkTimer = setTimeout(() => this.checkChanges(), 30000);
  };
  checkChanges = (records = this.lastRecords || []) => {
    if (!this.props.user || this.checking || !this.alive) return;
    clearTimeout(this.checkTimer);
    if (!records.some(item => !item.deleted_at)) { this.setState({ checks: [], changesLoading: false, changesFailed: false });return; }
    this.checking = true;
    const generation = this.generation, ticket = ++this.checkTicket;
    this.setState({ changesLoading: true });
    this.props.dispatch({ type: 'templateDelivery/changes', payload: { scope: getScope(this.props.match.params, this.props.user), records }, callback: bean => {
      if (!this.active(generation) || ticket !== this.checkTicket) return;
      this.checking = false;
      this.setState({ checks: bean.checks, changesLoading: false, changesFailed: false }, this.scheduleCheck);
    }, onError: () => {
      if (!this.active(generation) || ticket !== this.checkTicket) return;
      this.checking = false;
      this.setState({ changesLoading: false, changesFailed: true }, this.scheduleCheck);
    } });
  };
  act = (payload, template) => {
    if (this.acting || template.deleted_at) return;
    const { user, appDetail, match, team, permissions } = this.props;
    const generation = this.generation;
    this.acting = true;
    this.props.dispatch({ type: 'deliveryCenter/act', payload: { ...payload, template, user, scope: getScope(match.params, user),
      authorized: canPublishTemplate(user, team, permissions, match.params),
      appName: String(appDetail.group_id) === String(match.params.appID) ? appDetail.group_name : undefined }, callback: task => {
      if (this.active(generation)) {
        this.acting = false;
        if (payload.operation === 'deploy' && payload.kind === 'delivery' && task && task.id) {
          this.pendingDeliveryTaskId = task.id;
          if (this.followDelivery([task])) return;
        }
        this.setState({ listing: null, delivery: null }, this.load);
      }
    }, onError: () => { if (this.active(generation)) this.acting = false; } });
  };
  create = group => this.props.dispatch(routerRedux.push({ pathname: `${deliveryPath(this.props.match.params)}/create`, query: {
    version: nextTemplateVersion((group ? group.versions : this.lastRecords || []).map(item => item.version))
  } }));
  createTemplate = () => {
    const app = String(this.props.appDetail.group_id) === String(this.props.match.params.appID) ? this.props.appDetail : {};
    this.setState({ profileEditor: { creating: true, appName: app.group_name || '' } });
  };
  exportVersion = template => this.setState({ exporting: template });
  editMetadata = group => this.setState({ profileEditor: { appInfo: { app_id: group.id.replace(/-/g, ''),
    app_name: group.template_name, pic: group.logo || '', describe: group.template_description || '', details: group.details || '',
    scope: 'team', create_team: this.props.match.params.teamName } } });
  profileSaved = () => {
    if (!this.alive) return;
    message.success(t('metadataSaved'));
    this.setState({ profileEditor: null }, this.load);
  };
  deleteVersion = template => Modal.confirm({ title: t('deleteVersion'), content: t('deleteVersionHelp', { name: template.template_name, version: template.version }),
    okText: t('deleteVersion'), cancelText: t('cancel'), okType: 'danger', onOk: () => new Promise((resolve, reject) => {
      const { user, team, permissions, match } = this.props;
      this.props.dispatch({ type: 'templateDelivery/deleteVersion', payload: { scope: getScope(match.params, user), user, templateId: template.id,
        authorized: canPublishTemplate(user, team, permissions, match.params) }, callback: () => { if (this.alive) this.load();resolve(); }, onError: reject });
    }) });
  renderChanges = (groups, allowed) => {
    const { checks, changesLoading, changesFailed } = this.state;
    const changed = checks.filter(item => item.status === 'changed');
    if (changesFailed) return <Alert className={timelineStyles.changeBanner} type="warning" showIcon message={t('changesUnavailable')}
      description={<Button onClick={() => this.checkChanges()} loading={changesLoading}>{t('retry')}</Button>} />;
    if (changed.length) return <Alert className={timelineStyles.changeBanner} type="warning" showIcon message={t('sourceChanged')}
      description={<React.Fragment><div>{changed.map(item => <div key={item.baseline_id}>{t('sourceChangeSummary', {
        name: item.template_name, version: item.version, added: item.summary.added_count || 0, updated: item.summary.updated_count || 0, removed: item.summary.removed_count || 0
      })}</div>)}</div><div className={timelineStyles.changeActions}><Button onClick={() => this.setState({ changesOpen: true })}>{t('viewChanges')}</Button>
        {allowed && <Button type="primary" onClick={() => this.create(groups.find(group => group.latest && group.latest.id === changed[0].baseline_id))}>{t('publishNewVersion')}</Button>}</div></React.Fragment>} />;
    return null;
  };
  renderDetail = row => {
    const listing = this.state.listings.find(item => item.template.id === row.id);
    const configs = {};
    row.component_overrides.forEach(config => { configs[config.service_id] = { ...config,
      service_env_map_list: config.service_env_map_list.map((env, index) => ({ ...env, _key: `saved-${index}` })) }; });
    const fields = [['templateName', row.template_name], ['version', row.version], ['templateDescription', row.template_description || '—'], ['description', row.description || '—'],
      ['destination', row.destination === 'market' ? row.market_name || t('market') : t(row.destination)],
      ['creator', row.creator_name || '—'], ['createdAt', moment(row.created_at).format('YYYY-MM-DD HH:mm')]];
    return <Modal visible title={t('templateDetails')} width={1040} className={styles.detailModal} onCancel={() => this.setState({ detail: null })}
      footer={<Button onClick={() => this.setState({ detail: null })}>{t('close')}</Button>}>
      <Descriptions bordered size="small" column={1}>{fields.map(([key, value]) => <Descriptions.Item key={key} label={t(key)}>{value}</Descriptions.Item>)}</Descriptions>
      {listing && <section className={styles.detailPlugin}><h3>{w('listingStatus')}</h3><p>{listingStatusLabel(listing)}</p><p>{w('reason')}：{listing.reason}</p>
        {listing.status !== 'pending' && <p>{w('reviewer')}：{listing.reviewer_name} · {w('reviewComment')}：{listing.review_comment || w('noComment')}</p>}
      </section>}
      {row.is_platform_plugin && <div className={styles.detailPlugin}><h3>{t('deliveryAsPlatformPlugin')}</h3>
        <p>{row.plugin.plugin_name} · {row.plugin.plugin_id} · {row.plugin.plugin_type}</p></div>}
      <ComponentConfig key={row.id} disabled components={row.components} configs={configs} />
    </Modal>;
  };
  render() {
    const { records, templateInfo, failed, loading, user, team, permissions, match, busy, dispatch } = this.props;
    const { detail, listing, delivery, listings, workflowFailed, deployments, changesOpen, checks, exporting, profileEditor, changesFailed } = this.state;
    const allowed = canPublishTemplate(user, team, permissions, match.params);
    const scopedRecords = user ? records.filter(item => item.scope === deliveryScope(getScope(match.params, user))) : [];
    const groups = templateGroups(scopedRecords).map(group => templateInfo && group.id === templateInfo.id ? {
      ...group, template_name: templateInfo.name, template_description: templateInfo.description, logo: templateInfo.logo, details: templateInfo.details || ''
    } : { ...group, logo: group.latest && group.latest.logo || '', template_description: group.latest && group.latest.template_description || '', details: group.latest && group.latest.manifest && group.latest.manifest.annotations && group.latest.manifest.annotations.details || '' });
    if (templateInfo && !groups.some(group => group.id === templateInfo.id)) groups.unshift({ id: templateInfo.id,
      template_name: templateInfo.name, logo: templateInfo.logo, template_description: templateInfo.description, details: templateInfo.details || '', versions: [], latest: null });

    return <PageHeaderLayout isFooter wrapperClassName={styles.page} title={<span className={styles.pageTitle}>{pageheaderSvg.getPageHeaderSvg('publish', 18)}{t('records')}</span>}
      content={t('recordsHelp')} extraContent={<Button icon="home" onClick={() => dispatch(routerRedux.push(deliveryPath(match.params).replace(/delivery$/, 'overview')))}>{t('backToApplication')}</Button>}>
      <Spin spinning={!!loading}>
        {workflowFailed && <Alert type="warning" showIcon message={w('loadFailed')} description={<Button onClick={this.load}>{t('retry')}</Button>} />}
        {failed ? <Alert type="warning" showIcon message={t('recordsUnavailable')} description={<Button onClick={this.load}>{t('retry')}</Button>} /> :
          !groups.length ? <section className={styles.empty}>
            <h2>{t('emptyTitle')}</h2><p className={styles.muted}>{t('emptyHelp')}</p><DeliveryFlow />
            {allowed && <Button type="primary" icon="plus" size="large" onClick={this.createTemplate}>{t('createTemplate')}</Button>}
          </section> : <React.Fragment>
            {this.renderChanges(groups, allowed)}
            {groups.length ? groups.map(group => <RecordTimeline key={group.id} group={group} listings={listings} deployments={deployments} allowed={allowed}
              workflowFailed={workflowFailed} onNewVersion={this.create} onDetail={detail => this.setState({ detail })} onInstall={delivery => this.setState({ delivery })}
              onExport={this.exportVersion} onDelete={this.deleteVersion} onListing={listing => this.setState({ listing })} onEditMetadata={this.editMetadata} />) : <Empty description={t('noMatchingTemplates')} />}
          </React.Fragment>}
      </Spin>
      {detail && this.renderDetail(detail)}
      {listing && <ListingModal template={listing} dispatch={dispatch} scope={getScope(match.params, user)} busy={busy} onCancel={() => this.setState({ listing: null })} onSubmit={(reason, destination) => this.act({ operation: 'listing', reason, destination }, listing)} />}
      {delivery && <DeployModal installation template={delivery} user={user} scope={getScope(match.params, user)} dispatch={dispatch} busy={busy}
        approved={listings.some(item => item.template.id === delivery.id && item.publication_status === 'published')}
        onCancel={() => this.setState({ delivery: null })} onSubmit={values => this.act({ operation: 'deploy', ...values }, delivery)} />}
      {exporting && <TemplateExporter key={exporting.id} template={exporting} scope={getScope(match.params, user)} user={user}
        onCancel={() => this.setState({ exporting: null }, this.loadWorkflow)} />}
      {profileEditor && <CreateAppModels title={t(profileEditor.creating ? 'createTemplate' : 'editMetadata')}
        eid={user && user.enterprise_id} appName={profileEditor.appName} appInfo={profileEditor.appInfo}
        defaultScope="team" fixedScope="team" team_name={match.params.teamName}
        deliverySource={{ team_name: match.params.teamName, region_name: match.params.regionName, app_id: match.params.appID }}
        onOk={this.profileSaved} onCancel={() => this.setState({ profileEditor: null })} />}
      <Drawer visible={changesOpen} width={520} title={t('viewChanges')} className={timelineStyles.historyDrawer} onClose={() => this.setState({ changesOpen: false })} destroyOnClose>
        {checks.filter(item => item.status === 'changed').map(check => <section key={check.baseline_id}><h3>{check.template_name} · {check.version}</h3>
          <ul className={timelineStyles.changeList}>{check.details.map(item => <li key={item.service_id}><strong>{item.name}</strong><p>{t(`change_${item.type}`)}
            {item.fields.length > 0 && ` · ${item.fields.map(field => t(`changeField_${field}`)).join('、')}`}</p></li>)}</ul>
        </section>)}
      </Drawer>
    </PageHeaderLayout>;
  }
}
