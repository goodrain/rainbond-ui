import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Badge, Button, Empty, Pagination, Tag, Timeline } from 'antd';
import moment from 'moment';
import { w } from '../../components/DeliveryWorkflow';
import VersionConfiguration from '../EnterpriseDelivery/VersionConfiguration';
import VersionChanges from '../EnterpriseDelivery/VersionChanges';
import styles from './localVersions.less';
const { localTemplateVersion } = require('../../utils/localTemplateVersions');
const time = value => value && moment(value).isValid() ? moment(value).format('YYYY-MM-DD HH:mm:ss') : '—';

@connect()
export default class LocalTemplateVersions extends PureComponent {
  state = { selectedVersion: '', previous: null, previousLoading: false, previousLoaded: false, previousFailed: false, expandedNotes: {} };
  alive = false;
  generation = 0;
  componentDidMount() { this.alive = true;this.ensurePrevious(); }
  componentWillUnmount() { this.alive = false;this.generation += 1; }
  componentDidUpdate(previous) {
    if (previous.versions !== this.props.versions) {
      this.generation += 1;
      this.setState({ previous: null, previousLoaded: false, previousLoading: false, previousFailed: false }, this.ensurePrevious);return;
    }
    this.ensurePrevious();
  }
  entries = () => {
    if (this.rawVersions !== this.props.versions) {
      this.rawVersions = this.props.versions;
      this.parsedVersions = (this.props.versions || []).map(record => ({ record, template: localTemplateVersion(record) }));
    }
    return this.parsedVersions || [];
  };
  selected = () => this.entries().find(entry => entry.record.version === this.state.selectedVersion) || this.entries()[0];
  hasOlderPage = () => this.props.page * this.props.pageSize < this.props.total;
  ensurePrevious = () => {
    const entries = this.entries();
    if (entries.length && this.selected() === entries[entries.length - 1] && this.hasOlderPage() &&
      !this.state.previousLoaded && !this.state.previousLoading) this.loadPrevious();
  };
  loadPrevious = () => {
    const generation = this.generation;
    this.setState({ previousLoading: true, previousFailed: false });
    const fail = () => { if (this.alive && generation === this.generation) this.setState({ previousLoading: false, previousLoaded: true, previousFailed: true }); };
    this.props.dispatch({ type: 'market/fetchAppModelsDetails', payload: { enterprise_id: this.props.eid, appId: this.props.appId,
      page: (this.props.page - 1) * this.props.pageSize + this.entries().length + 1, page_size: 1 }, callback: response => {
      if (!this.alive || generation !== this.generation) return;
      const record = response && Array.isArray(response.list) && response.list[0];
      if (!record) { fail();return; }
      this.setState({ previous: localTemplateVersion(record), previousLoading: false, previousLoaded: true, previousFailed: false });
    }, onError: fail });
  };
  render() {
    const entries = this.entries(), selected = this.selected();
    const { page, pageSize, total, onPageChange, renderActions } = this.props;
    if (!selected) return <Empty description={w('noLocalTemplateVersions')} />;
    const { record, template } = selected, index = entries.indexOf(selected), next = entries[index + 1];
    const baseline = next ? next.template : this.state.previous;
    const externalBaseline = !next && this.hasOlderPage();
    const baselineUnavailable = !!next && !next.template || externalBaseline && !baseline;
    const description = template ? template.description : record.app_version_info || '';
    const expanded = !!this.state.expandedNotes[record.version];
    return <section className={styles.versions} aria-label={w('localTemplateVersions')}>
      <div className={styles.workspace}>
        <Timeline className={styles.timeline} aria-label={w('versionTimeline')}>{entries.map(entry => <Timeline.Item key={entry.record.version} color={entry === selected ? 'blue' : 'gray'}>
          <button type="button" aria-pressed={entry === selected} onClick={() => this.setState({ selectedVersion: entry.record.version })}
            className={`${styles.versionEntry} ${entry === selected ? styles.activeVersion : ''}`}>
            <strong>v{entry.record.version}</strong><time dateTime={entry.record.create_time || undefined}>{time(entry.record.create_time)}</time>
          </button>
        </Timeline.Item>)}</Timeline>
        <div className={styles.content}>
          <header className={styles.versionHeader}><div><div className={styles.identity}><h3>v{record.version}</h3>
            {record.version_alias && record.version_alias !== 'NA' && <Tag>{record.version_alias}</Tag>}
            {record.dev_status && <Badge status={record.dev_status === 'release' ? 'success' : 'default'} text={record.dev_status === 'release' ? 'Release' : record.dev_status} />}
            {template && template.arch && <Tag>{template.arch}</Tag>}
            {template && <span>{template.components.length} {w('componentUnit')}</span>}
          </div><div className={styles.metadata}><span>{w('publishedBy')} {record.share_user || record.release_user || '—'}</span>
            <span>{w('publishedAt')} {time(record.create_time)}</span>{record.update_time && <span>{w('componentUpdatedAt')} {time(record.update_time)}</span>}</div></div>
            {renderActions && <div className={styles.actions}>{renderActions(record)}</div>}
          </header>
          <section className={styles.releaseNotes} aria-label={w('releaseNotes')}><header><h4>{w('releaseNotes')}</h4>
            {(description.length > 180 || description.split('\n').length > 4) && <Button type="link" size="small" aria-expanded={expanded}
              onClick={() => this.setState(state => ({ expandedNotes: { ...state.expandedNotes, [record.version]: !expanded } }))}>{w(expanded ? 'collapseReleaseNotes' : 'expandReleaseNotes')}</Button>}
          </header><div className={styles.notesBody}><p className={expanded ? undefined : styles.collapsedNotes}>{description || w('noDescription')}</p></div></section>
          {template ? <VersionConfiguration key={template.id} template={template} renderChanges={componentId => <VersionChanges
            template={template} baseline={baseline} componentId={componentId} baselineUnavailable={baselineUnavailable}
            loading={externalBaseline && this.state.previousLoading} onRetry={externalBaseline && this.state.previousFailed ? this.loadPrevious : undefined} />} /> :
            <Empty description={w('localVersionConfigurationUnavailable')} />}
        </div>
      </div>
      {total > pageSize && <Pagination className={styles.pagination} current={page} pageSize={pageSize} total={total} onChange={onPageChange} />}
    </section>;
  }
}
