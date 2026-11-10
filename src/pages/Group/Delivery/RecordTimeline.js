import React, { PureComponent } from 'react';
import { Avatar, Badge, Button, Dropdown, Empty, Icon, Menu, Tag, Timeline } from 'antd';
import moment from 'moment';
import { listingStatusLabel, taskStatusLabel, w } from '../../../components/DeliveryWorkflow';
import VersionDetails from '../../../components/DeliveryWorkflow/VersionDetails';
import { t } from './common';
import styles from './records.less';
import VersionContent from './VersionContent';

export default class RecordTimeline extends PureComponent {
  state = { expanded: {}, tabs: {} };
  toggle = id => this.setState(state => {
    const expanded = state.expanded[id] == null ? !!(this.props.group.latest && this.props.group.latest.id === id) : state.expanded[id];
    return { expanded: { ...state.expanded, [id]: !expanded } };
  });
  renderVersion = (record, group) => {
    const { listings, deployments, allowed, workflowFailed, onDetail, onInstall, onExport, onListing, onDelete } = this.props;
    const listing = listings.find(item => item.template.id === record.id);
    const history = deployments.filter(item => item.template_id === record.id);
    const deleted = !!record.deleted_at;
    const expanded = this.state.expanded[record.id] == null ? !!(group.latest && group.latest.id === record.id) : this.state.expanded[record.id];
    const exports = history.filter(item => item.kind === 'offline').slice().sort((a, b) => (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0));
    const menu = <Menu onClick={({ key }) => {
      if (key === 'delete') onDelete(record);
    }}>
      {allowed && !deleted && <Menu.Item key="delete" disabled={workflowFailed}>
        <span className={styles.deleteAction}>{t('deleteVersion')}</span>
      </Menu.Item>}
    </Menu>;
    return <Timeline.Item key={record.id} color={deleted ? 'gray' : 'blue'}>
      <article className={`${styles.versionCard} ${deleted ? styles.deletedVersion : ''}`} aria-label={`${group.template_name} ${record.version}`}>
        <header className={styles.versionHeader}>
          <Button type="link" className={styles.versionToggle} aria-expanded={expanded} aria-label={`${t(expanded ? 'collapseVersion' : 'expandVersion')} ${record.version}`} onClick={() => this.toggle(record.id)}>
            <Icon type={expanded ? 'down' : 'right'} />
          </Button>
          <div className={styles.versionHeadingBody}>
            <div className={styles.versionIdentity}><h3><button type="button" aria-label={record.version} onClick={() => onDetail(record)}>v{record.version}</button></h3>
              {group.latest && group.latest.id === record.id && <Tag color="blue">{t('latestVersion')}</Tag>}
            </div>
            <div className={styles.versionMeta}><span>{record.creator_name || '—'}</span>
              <time className={styles.versionDate} dateTime={record.created_at}>{record.created_at ? moment(record.created_at).format('YYYY-MM-DD HH:mm') : '—'}</time>
              <span><Icon type="appstore" /> {record.components.length} {t('componentUnit')}</span></div>
          </div>
          <div className={styles.versionActions}>{allowed && !deleted && <React.Fragment>
            <Button type="primary" icon="shop" disabled={workflowFailed || !!(listing && listing.status !== 'rejected')} onClick={() => onListing(record)}>{w(listing && listing.status === 'rejected' ? 'resubmitListing' : 'listAction')}</Button>
            <Button icon="cloud-download" disabled={workflowFailed} onClick={() => onInstall(record)}>{t('deliver')}</Button>
            <Button icon="export" disabled={workflowFailed} onClick={() => onExport(record)}>{t('exportTemplate')}</Button>
            <Dropdown overlay={menu} trigger={['click']}><Button icon="ellipsis" aria-label={`${t('more')} ${record.version}`} /></Dropdown>
          </React.Fragment>}</div>
        </header>
        <div className={styles.versionStatusRow}>
          {workflowFailed ? <span className={styles.statusField}>{w('loadFailed')}</span> : <React.Fragment>
          <span>{deleted ? <Tag>{t('deletedVersion')}</Tag> : listing ? listingStatusLabel(listing) : <Badge status="default" text={w('notListed')} />}</span>
          {!!exports.length && <React.Fragment><span>{taskStatusLabel(exports[0])}</span><span className={styles.statusField}>{t('exportRecords', { count: exports.length })}</span></React.Fragment>}
          </React.Fragment>}
        </div>
        {expanded && <VersionDetails showEnvironments templateContent={<VersionContent template={record} onConfiguration={() => onDetail(record)} />} template={record} reviews={listings.filter(item => item.template.id === record.id)} deployments={history}
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
        <Avatar shape="square" size={40} src={group.logo} icon="appstore" /><div className={styles.groupCopy}>
          <div className={styles.groupHeadingRow}><h2>{group.template_name}</h2>
            <p>{t('templateVersionCount', { count: group.versions.filter(item => !item.deleted_at).length })}
              {group.latest && <span> · {t('latestVersion')} {group.latest.version}</span>}</p>
          </div>
          {group.template_description && <div className={styles.groupDescription} title={group.template_description}>{group.template_description}</div>}
        </div>
      </div>{allowed && <div className={styles.groupActions}><Button icon="edit" onClick={() => onEditMetadata(group)}>{t('editMetadata')}</Button><Button type="primary" icon="plus" onClick={() => onNewVersion(group)}>{t('createVersion')}</Button></div>}</header>
      {!!group.versions.length && <div className={styles.versionsHeading}><h3>{t('versionsAndDeliveryRecords')}</h3><span>{t('totalVersionCount', { count: group.versions.length })}</span></div>}
      {group.versions.length ? <Timeline className={styles.versionTimeline}>{group.versions.map(record => this.renderVersion(record, group))}</Timeline> :
        <div className={styles.noTemplateVersions}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('noTemplateVersions')} /><p>{t('firstVersionHelp')}</p></div>}
    </section>;
  }
}
