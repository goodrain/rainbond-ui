import React, { PureComponent } from 'react';
import { Avatar, Badge, Button, Empty, Icon, Tabs, Timeline, Tooltip } from 'antd';
import moment from 'moment';
import { DeploymentTable, listingStatusLabel, w } from '../../components/DeliveryWorkflow';
import { ReviewHistory } from '../../components/DeliveryWorkflow/VersionDetails';
import styles from './asset.less';
import VersionConfiguration from './VersionConfiguration';
import VersionChanges from './VersionChanges';
const { defaultComparison, orderedVersions, localMarketTemplatePath } = require('../../utils/deliveryAsset');

export default class VersionsSection extends PureComponent {
  state = { tabs: {}, expandedNotes: {} };
  render() {
    const { group, item, deployments, onSelect, onReview, onTest, onSource, onDeploy, onViewTemplate } = this.props;
    const versions = orderedVersions(group.versions), profile = group.profile || { name: group.template_name,
      logo: versions[0] && versions[0].template.logo, description: versions[0] && versions[0].template.template_description };
    const template = item && item.template, history = template ? deployments.filter(row => row.template_id === template.id) : [];
    const templatePath = localMarketTemplatePath(group.source.enterprise_id, item, versions);
    const baseline = item && defaultComparison(versions, item);
    return <section id="asset-versions" className={styles.assetSection} aria-labelledby="asset-versions-title">
      <header className={styles.sectionHeader}><div><h2 id="asset-versions-title"><span className={styles.sectionMarker}><Icon type="appstore" /></span><span className={styles.sectionNumber}>03</span>{w('assetVersions')}</h2><p>{w('assetVersionsHelp')}</p></div>
        {group.pending > 0 && <Badge status="processing" text={`${group.pending} ${w('pendingReview')}`} />}</header>
      <div className={styles.profile}><Avatar shape="square" size={44} src={profile.logo} icon="appstore" /><div className={styles.profileCopy}><h3>{profile.name}</h3><p>{profile.description || w('noTemplateIntroduction')}</p></div>
        <dl className={styles.profileStats}>{[[versions.length, 'assetVersionLabel'], [template ? template.components.length : 0, 'assetComponentLabel'], [deployments.filter(row => row.kind === 'delivery' && row.status === 'succeeded').length, 'successfulInstalls']].map(([count, key]) => <div key={key}><dd>{count}</dd><dt>{w(key)}</dt></div>)}</dl></div>
      {template ? <div className={styles.versionWorkspace}>
        <Timeline className={styles.versionTimeline} aria-label={w('versionTimeline')}>{versions.map(row => <Timeline.Item key={row.template.id}
          color={row.template.id === template.id ? 'blue' : 'gray'}>
          <button type="button" aria-pressed={row.template.id === template.id}
            className={`${styles.versionEntry} ${row.template.id === template.id ? styles.activeVersionEntry : ''}`} onClick={() => onSelect(row.template.id)}>
            <strong>v{row.template.version}</strong><time dateTime={row.template.created_at || row.submitted_at}>{moment(row.template.created_at || row.submitted_at).format('YYYY-MM-DD')}<span>{moment(row.template.created_at || row.submitted_at).format('HH:mm')}</span></time>
            <small>{w(row.status)}</small>
          </button>
        </Timeline.Item>)}</Timeline>
        <div className={styles.versionContent}>
          <header className={styles.versionHeader}><div><h3>{template.version}</h3>{listingStatusLabel(item)}
            <div className={styles.muted}>{w('submittedBy')} {item.applicant_name || template.creator_name || '—'} · {moment(item.submitted_at).format('YYYY-MM-DD HH:mm')} · {template.components.length} {w('componentUnit')}</div>
          </div><div className={styles.versionActions}>{!template.deleted_at && <React.Fragment>
            {item.status === 'pending' && <Button type="primary" onClick={() => onReview(item)}>{w('review')}</Button>}
            {item.status === 'approved' ? <React.Fragment>
              <Button type="primary" onClick={() => onDeploy(item)}>{w('deploy')}</Button>
              <Tooltip title={!templatePath ? w('localTemplateNotPublished') : undefined}><span><Button disabled={!templatePath} onClick={() => onViewTemplate(templatePath)}>{w('viewTemplate')}</Button></span></Tooltip>
            </React.Fragment> : <Button onClick={() => onTest(item)}>{w('deployTest')}</Button>}
          </React.Fragment>}</div></header>
          <div className={styles.versionNotes}>
            <div className={styles.subheading}><h3>{w('releaseNotes')}</h3>
              {template.description && (template.description.length > 180 || template.description.split('\n').length > 4) && <Button type="link" size="small"
                aria-expanded={!!this.state.expandedNotes[template.id]} onClick={() => this.setState(state => ({ expandedNotes: { ...state.expandedNotes, [template.id]: !state.expandedNotes[template.id] } }))}>
                {w(this.state.expandedNotes[template.id] ? 'collapseReleaseNotes' : 'expandReleaseNotes')}</Button>}
            </div>
            <div className={`${styles.notes} ${this.state.expandedNotes[template.id] ? styles.expandedNotes : ''}`} aria-label={w('releaseNotes')}><div className={styles.notesText}>{template.description || w('noDescription')}</div></div>
          </div>

          <Tabs activeKey={this.state.tabs[template.id] || 'content'} animated={false}
            onChange={tab => this.setState(state => ({ tabs: { ...state.tabs, [template.id]: tab } }))}>
            <Tabs.TabPane key="content" tab={w('versionContent')}>

              <VersionConfiguration key={template.id} template={template} onSource={onSource}
                renderChanges={componentId => <VersionChanges template={template} baseline={baseline && baseline.template} componentId={componentId} onSource={onSource} />} />
            </Tabs.TabPane>
            <Tabs.TabPane key="audit" tab={w('reviewTab')}><ReviewHistory reviews={[item]} /></Tabs.TabPane>
            <Tabs.TabPane key="delivery" tab={w('deliveryRecordsTab')}>
              {history.length ? <div className={styles.table}><DeploymentTable items={history} /></div> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={w('noDeliveryRecords')} />}
            </Tabs.TabPane>
          </Tabs>
        </div>
      </div> : <Empty description={w('noVersions')} />}
    </section>;
  }
}
