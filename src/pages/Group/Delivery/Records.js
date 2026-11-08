import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { Alert, Button, Descriptions, Drawer, Empty, Icon, Input, Modal, Spin } from 'antd';
import moment from 'moment';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import pageheaderSvg from '../../../utils/pageHeaderSvg';
import { t, getScope, deliveryPath, canPublishTemplate } from './common';
import DeliveryFlow from './Flow';
import ComponentConfig from './ComponentConfig';
import RecordTimeline from './RecordTimeline';
import { ListingModal, DeployModal, DeploymentTable, w, listingStatusLabel } from '../../../components/DeliveryWorkflow';
import styles from './index.less';
import timelineStyles from './records.less';
const { templateGroups, nextTemplateVersion } = require('../../../utils/templateTimeline');
const { deliveryScope } = require('../../../utils/templateDelivery');

@connect(({ user, teamControl, templateDelivery, application, loading }) => ({
  user: user.currentUser, team: teamControl.currentTeam, permissions: teamControl.currentTeamPermissionsInfo,
  appDetail: application.groupDetail || {}, busy: loading.effects['deliveryCenter/act'] || loading.effects['templateDelivery/deleteVersion'],
  records: templateDelivery.records, activeSyncs: templateDelivery.activeSyncs || [], failed: templateDelivery.failed, loading: loading.effects['templateDelivery/records']
}))
export default class DeliveryRecords extends PureComponent {
  state = { detail: null, query: '', listings: [], deployments: [], listing: null, delivery: null, workflowFailed: false,
    checks: [], changesLoading: false, changesFailed: false, changesOpen: false, history: null };
  alive = false;
  generation = 0;
  checkTicket = 0;
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
      this.generation += 1;this.checkTicket += 1;this.checking = false;this.acting = false;this.lastRecords = [];clearTimeout(this.checkTimer);
      this.setState({ detail: null, query: '', listings: [], deployments: [], listing: null, delivery: null, checks: [], changesOpen: false, history: null }, this.load);
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
      if (this.active(generation) && sequence === this.loadSequence) this.setState({ listings: bean.listings, deployments: bean.deployments, workflowFailed: false });
    }, onError: () => { if (this.active(generation) && sequence === this.loadSequence) this.setState({ workflowFailed: true }); } });
  };
  loadWorkflow = () => {
    if (!this.props.user || this.workflowLoading) return;
    this.workflowLoading = true;
    const generation = this.generation;
    this.props.dispatch({ type: 'deliveryCenter/load', payload: { kind: 'application',
      scope: getScope(this.props.match.params, this.props.user), user: this.props.user }, callback: bean => {
      this.workflowLoading = false;
      if (this.active(generation)) this.setState({ listings: bean.listings, deployments: bean.deployments, workflowFailed: false });
    }, onError: () => { this.workflowLoading = false; } });
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
      appName: String(appDetail.group_id) === String(match.params.appID) ? appDetail.group_name : undefined }, callback: () => {
      if (this.active(generation)) { this.acting = false;this.setState({ listing: null, delivery: null }, this.load); }
    }, onError: () => { if (this.active(generation)) this.acting = false; } });
  };
  create = group => this.props.dispatch(routerRedux.push({ pathname: `${deliveryPath(this.props.match.params)}/create`, query: group ? {
    template_name: group.template_name, version: nextTemplateVersion(group.versions.map(item => item.version))
  } : {} }));
  exportVersion = template => Modal.confirm({ title: t('exportTemplate'), content: t('exportVersionHelp', { name: template.template_name, version: template.version }),
    okText: t('exportTemplate'), cancelText: t('cancel'), onOk: () => this.act({ operation: 'deploy', kind: 'offline', target: null }, template) });
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
    if (changesLoading) return <div className={timelineStyles.checkState}><Icon type="loading" />{t('checkingChanges')}</div>;
    if (checks.some(item => item.status === 'unknown')) return <Alert type="info" className={timelineStyles.changeBanner} showIcon message={t('changesUnknown')} />;
    return checks.length ? <div className={timelineStyles.checkState}><Icon type="check-circle" />{t('sourceUnchanged')}</div> : null;
  };
  renderDetail = row => {
    const listing = this.state.listings.find(item => item.template.id === row.id);
    const configs = {};
    row.component_overrides.forEach(config => { configs[config.service_id] = { ...config,
      service_env_map_list: config.service_env_map_list.map((env, index) => ({ ...env, _key: `saved-${index}` })) }; });
    const fields = [['templateName', row.template_name], ['version', row.version], ['description', row.description || '—'],
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
      <h3>{w('deploymentRecords')}</h3><DeploymentTable items={this.state.deployments.filter(item => item.template_id === row.id)} />
    </Modal>;
  };
  render() {
    const { records, activeSyncs, failed, loading, user, team, permissions, match, busy, dispatch } = this.props;
    const { detail, query, listing, delivery, listings, workflowFailed, deployments, changesOpen, checks, history, changesFailed } = this.state;
    const allowed = canPublishTemplate(user, team, permissions, match.params);
    const scopedRecords = user ? records.filter(item => item.scope === deliveryScope(getScope(match.params, user))) : [];
    const groups = templateGroups(scopedRecords);
    const visible = groups.filter(group => [group.template_name, ...group.versions.map(item => item.version)].some(value => value.toLowerCase().includes(query.toLowerCase())));
    return <PageHeaderLayout isFooter wrapperClassName={styles.page} title={<span className={styles.pageTitle}>{pageheaderSvg.getPageHeaderSvg('publish', 18)}{t('records')}</span>}
      content={t('recordsHelp')} extraContent={<Button icon="home" onClick={() => dispatch(routerRedux.push(deliveryPath(match.params).replace(/delivery$/, 'overview')))}>{t('backToApplication')}</Button>}>
      {activeSyncs.length > 0 && <Alert type="info" showIcon message={t('unfinishedSync')}
        description={activeSyncs.map(job => <Button key={job.id} type="link" onClick={() => dispatch(routerRedux.push({
          pathname: `${deliveryPath(match.params)}/create`, query: { sync_id: job.id }
        }))}>{t('continueSync')} · {moment(job.created_at).format('MM-DD HH:mm')}</Button>)} />}
      <Spin spinning={!!loading}>
        {workflowFailed && <Alert type="warning" showIcon message={w('loadFailed')} description={<Button onClick={this.load}>{t('retry')}</Button>} />}
        {failed ? <Alert type="warning" showIcon message={t('recordsUnavailable')} description={<Button onClick={this.load}>{t('retry')}</Button>} /> :
          !scopedRecords.length ? <section className={styles.empty}>
            <h2>{t('emptyTitle')}</h2><p className={styles.muted}>{t('emptyHelp')}</p><DeliveryFlow />
            {allowed && <Button type="primary" icon="plus" size="large" onClick={() => this.create()}>{t('createTemplate')}</Button>}
          </section> : <React.Fragment>
            {this.renderChanges(groups, allowed)}
            <div className={timelineStyles.toolbar}><Input.Search allowClear placeholder={t('searchTemplates')} onSearch={query => this.setState({ query: query.trim() })} />
              <div className={timelineStyles.toolbarActions}><Button icon="reload" onClick={this.load}>{t('refresh')}</Button>
                {allowed && <Button type={checks.some(item => item.status === 'changed') && !changesFailed ? 'default' : 'primary'} icon="plus" onClick={() => this.create()}>{t('createTemplate')}</Button>}
              </div></div>
            {visible.length ? visible.map(group => <RecordTimeline key={group.id} group={group} listings={listings} deployments={deployments} allowed={allowed}
              workflowFailed={workflowFailed} onNewVersion={this.create} onDetail={detail => this.setState({ detail })} onInstall={delivery => this.setState({ delivery })}
              onExport={this.exportVersion} onDelete={this.deleteVersion} onListing={listing => this.setState({ listing })} onHistory={history => this.setState({ history })} />) : <Empty description={t('noMatchingTemplates')} />}
          </React.Fragment>}
      </Spin>
      {detail && this.renderDetail(detail)}
      {listing && <ListingModal template={listing} dispatch={dispatch} scope={getScope(match.params, user)} busy={busy} onCancel={() => this.setState({ listing: null })} onSubmit={(reason, destination) => this.act({ operation: 'listing', reason, destination }, listing)} />}
      {delivery && <DeployModal installation template={delivery} user={user} scope={getScope(match.params, user)} dispatch={dispatch} busy={busy}
        approved={listings.some(item => item.template.id === delivery.id && item.publication_status === 'published')}
        onCancel={() => this.setState({ delivery: null })} onSubmit={values => this.act({ operation: 'deploy', ...values }, delivery)} />}
      <Drawer visible={!!history} width={960} title={history ? `${history.template_name} · ${history.version} · ${t('deliveryHistory')}` : t('deliveryHistory')}
        className={timelineStyles.historyDrawer} onClose={() => this.setState({ history: null })} destroyOnClose>
        {history && <DeploymentTable items={deployments.filter(item => item.template_id === history.id)} />}
      </Drawer>
      <Drawer visible={changesOpen} width={520} title={t('viewChanges')} className={timelineStyles.historyDrawer} onClose={() => this.setState({ changesOpen: false })} destroyOnClose>
        {checks.filter(item => item.status === 'changed').map(check => <section key={check.baseline_id}><h3>{check.template_name} · {check.version}</h3>
          <ul className={timelineStyles.changeList}>{check.details.map(item => <li key={item.service_id}><strong>{item.name}</strong><p>{t(`change_${item.type}`)}
            {item.fields.length > 0 && ` · ${item.fields.map(field => t(`changeField_${field}`)).join('、')}`}</p></li>)}</ul>
        </section>)}
      </Drawer>
    </PageHeaderLayout>;
  }
}
