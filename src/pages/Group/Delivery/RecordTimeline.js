import React, { PureComponent } from 'react';
import { Avatar, Badge, Button, Dropdown, Empty, Icon, Menu, Tag, Timeline } from 'antd';
import moment from 'moment';
import { listingStatusLabel, w } from '../../../components/DeliveryWorkflow';
import EnvironmentSummary from '../../../components/DeliveryWorkflow/EnvironmentSummary';
import timelineStyles from '../../../components/DeliveryWorkflow/timeline.less';
import VersionDetails from '../../../components/DeliveryWorkflow/VersionDetails';
import versionStyles from '../../../components/DeliveryWorkflow/version.less';
import { t } from './common';
import styles from './records.less';

export default class RecordTimeline extends PureComponent {
  state = { expanded: {}, tabs: {} };
  toggle = id => this.setState(state => ({ expanded: { ...state.expanded, [id]: !state.expanded[id] } }));
  renderVersion = (record, group) => {
    const { listings, deployments, allowed, workflowFailed, onDetail, onInstall, onExport, onListing, onDelete } = this.props;
    const listing = listings.find(item => item.template.id === record.id);
    const history = deployments.filter(item => item.template_id === record.id);
    const deleted = !!record.deleted_at;
    const expanded = !!this.state.expanded[record.id];
    const menu = <Menu onClick={({ key }) => {
      if (key === 'listing') onListing(record);
      if (key === 'delete') onDelete(record);
    }}>
      {allowed && !deleted && !workflowFailed && (!listing || listing.status === 'rejected') && <Menu.Item key="listing">{w(listing ? 'resubmitListing' : 'listAction')}</Menu.Item>}
      {allowed && !deleted && !workflowFailed && (!listing || listing.status === 'rejected') && <Menu.Divider />}
      {allowed && !deleted && <Menu.Item key="delete" disabled={workflowFailed}>
        <span className={styles.deleteAction}>{t('deleteVersion')}</span>
      </Menu.Item>}
    </Menu>;
    return <Timeline.Item key={record.id} color={deleted ? 'gray' : 'blue'}>
      <time className={timelineStyles.time} dateTime={record.created_at}><span>{moment(record.created_at).format('YYYY-MM-DD')}</span><small>{moment(record.created_at).format('HH:mm')}</small></time>
      <article className={`${styles.versionCard} ${deleted ? styles.deletedVersion : ''}`} aria-label={`${group.template_name} ${record.version}`}>
        <header className={styles.versionHeader}><div>
          <div className={styles.versionIdentity}><h3><button type="button" onClick={() => onDetail(record)}>{record.version}</button></h3>
            {group.latest && group.latest.id === record.id && <Tag color="blue">{t('latestVersion')}</Tag>}
          </div>
          <div className={styles.versionMeta}>{record.creator_name || '—'}<span>·</span>{record.components.length} {t('componentUnit')}</div>
        </div><div className={versionStyles.status}>
          {deleted ? <Tag>{t('deletedVersion')}</Tag> : listing ? listingStatusLabel(listing) : <Badge status="default" text={w('notListed')} />}
        </div></header>
        {record.description && <div className={versionStyles.description}><span>{t('description')}</span><p className={!expanded ? styles.notesPreview : undefined}>{record.description}</p></div>}
        <EnvironmentSummary items={history} />
        <div className={versionStyles.footer}><div className={versionStyles.footerLinks}>
          <Button type="link" aria-expanded={expanded} aria-label={`${t(expanded ? 'collapseVersion' : 'expandVersion')} ${record.version}`}
            onClick={() => this.toggle(record.id)}>{t(expanded ? 'collapseVersion' : 'expandVersion')}<Icon type={expanded ? 'up' : 'down'} /></Button>
        </div><div className={versionStyles.footerActions}>
          {allowed && !deleted && <React.Fragment>
            <Button icon="cloud-download" disabled={workflowFailed} onClick={() => onInstall(record)}>{t('installTemplate')}</Button>
            <Button icon="export" disabled={workflowFailed} onClick={() => onExport(record)}>{t('exportTemplate')}</Button>
            <Dropdown overlay={menu} trigger={['click']}><Button aria-label={`${t('more')} ${record.version}`}>{t('more')}<Icon type="down" /></Button></Dropdown>
          </React.Fragment>}
        </div></div>
        {expanded && <VersionDetails template={record} reviews={listings.filter(item => item.template.id === record.id)} deployments={history}
          activeTab={this.state.tabs[record.id] || 'template'} onTabChange={tab => this.setState(state => ({ tabs: { ...state.tabs, [record.id]: tab } }))}
          onConfiguration={() => onDetail(record)} />}
        {expanded && deleted && <p className={styles.deletionNote}>{t('versionDeletedAt', { name: record.deleted_by, time: moment(record.deleted_at).format('YYYY-MM-DD HH:mm') })}</p>}
      </article>
    </Timeline.Item>;
  };
  render() {
    const { group, allowed, onNewVersion, onEditMetadata } = this.props;
    return <section className={styles.templateGroup} aria-label={group.template_name}>
      <header className={styles.groupHeader}><div className={styles.groupIdentity}>
        <Avatar shape="square" size={40} src={group.logo} icon="appstore" /><div><h2>{group.template_name}</h2>
          <p>{t('templateVersionCount', { count: group.versions.filter(item => !item.deleted_at).length })}
            {group.latest && <span> · {t('latestVersion')} {group.latest.version}</span>}</p>
          {group.template_description && <div className={styles.groupDescription}>{group.template_description}</div>}
        </div>
      </div>{allowed && <div className={styles.groupActions}><Button icon="edit" onClick={() => onEditMetadata(group)}>{t('editMetadata')}</Button><Button type="primary" icon="plus" onClick={() => onNewVersion(group)}>{t('createVersion')}</Button></div>}</header>
      {group.versions.length ? <Timeline className={`${styles.versionTimeline} ${timelineStyles.timeline}`}>{group.versions.map(record => this.renderVersion(record, group))}</Timeline> :
        <div className={styles.noTemplateVersions}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('noTemplateVersions')} /><p>{t('firstVersionHelp')}</p></div>}
    </section>;
  }
}
