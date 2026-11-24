import React, { PureComponent } from 'react';
import { Alert, Badge, Button, Empty, Icon, Pagination, Spin, Tag, Timeline, Tooltip } from 'antd';
import moment from 'moment';
import { w } from '../../components/DeliveryWorkflow';
import styles from './asset.less';
const { repositoryLinks } = require('../../utils/deliveryAsset');
const sourceLabel = kind => w({ code: 'sourceCode', image: 'image', vm: 'virtualMachine', file: 'packageSource' }[kind] || 'image');
const external = (url, text) => url ? <a href={url} target="_blank" rel="noopener noreferrer">{text}<Icon type="export" /></a> : text || '—';

export default class SourceSection extends PureComponent {
  render() {
    const { components, selectedId, onSelect, history = {}, onPage, loading, failed, onRefresh, sourceDeleted } = this.props;
    const component = components.find(item => item.service_id === selectedId) || components[0];
    const links = component ? repositoryLinks(component.repository, component.provider, component.commit, component.branch) : {};
    return <section id="asset-sources" className={styles.assetSection} aria-labelledby="asset-sources-title">
      <header className={styles.sectionHeader}><div><h2 id="asset-sources-title"><span className={styles.sectionMarker}><Icon type="branches" /></span><span className={styles.sectionNumber}>01</span>{w('assetSources')}</h2><p>{w('assetSourcesHelp')}</p></div>
        <Button icon="reload" loading={loading} disabled={sourceDeleted} onClick={onRefresh}>{w('refresh')}</Button></header>
      {failed && <Alert type="info" showIcon message={w('sourceSnapshotFallback')} />}
      <Spin spinning={loading}>{!component ? !loading && <Empty description={w('noSourceComponents')} /> : <div className={styles.sourceLayout}>
        <div className={styles.sourceRail} role="group" aria-label={w('sourceComponents')}>
          {components.map(item => <button key={item.service_id} type="button" aria-pressed={item.service_id === component.service_id} aria-controls="source-component-panel"
            className={`${styles.railButton} ${item.service_id === component.service_id ? styles.selectedRail : ''}`} onClick={() => onSelect(item.service_id)}>
            <Icon type={item.kind === 'code' ? 'branches' : 'appstore'} /><strong>{item.name}</strong><small>{sourceLabel(item.kind)}{item.archived ? ` · ${w('savedSource')}` : ''}</small>
          </button>)}
        </div>
        <div id="source-component-panel" className={styles.sourceContent} aria-label={component.name}>
          <div className={styles.sourceHeading}><h3>{w(component.kind === 'code' ? 'codeInformation' : component.kind === 'file' ? 'buildDetails' : 'imageInformation')}</h3>{component.archived && <Tag>{w('savedSource')}</Tag>}</div>
          <div className={styles.sourcePanels}><div className={styles.sourceInformation}>
          <dl className={`${styles.sourceFacts} ${component.kind === 'code' ? styles.codeFacts : styles.imageFacts}`}>
            {component.kind === 'code' ? <React.Fragment>
              <div><dt>{w('repositoryAddress')}</dt><dd>{external(links.repository, component.repository)}</dd></div>
              <div><dt>{w('branch')}</dt><dd>{component.branch || '—'}</dd></div>
            </React.Fragment> : <React.Fragment>
              <div><dt>{w('imageAddress')}</dt><dd><Tooltip title={component.image.address}><code>{component.image.address || '—'}</code></Tooltip></dd></div>
              <div><dt>{w('imageRegistry')}</dt><dd><Tooltip title={component.image.registry}><span>{component.image.address ? component.image.registry : '—'}</span></Tooltip></dd></div>
              <div><dt>{w('imageRepository')}</dt><dd><Tooltip title={component.image.repository}><span>{component.image.repository || '—'}</span></Tooltip></dd></div>
              <div><dt>{w('imageTag')}</dt><dd><Tooltip title={component.image.tag}><span>{component.image.tag || '—'}</span></Tooltip></dd></div>
            </React.Fragment>}
          </dl>
          </div></div>
          <div className={styles.subheading}><h3>{w('buildAndCommitHistory')}</h3>{component.kind === 'code' && links.history && external(links.history, w('remoteCommitHistory'))}</div>
          <p className={styles.muted}>{w('buildHistoryScope')}</p>
          <Spin spinning={!!history.loading}>{history.failed ? <Alert type="info" showIcon message={w('historyUnavailable')} description={<Button size="small" onClick={() => onPage(history.page || 1)}>{w('retry')}</Button>} /> :
            <Timeline className={styles.buildTimeline}>{(history.records || []).map((item, index) => <Timeline.Item key={item.id || index} color="blue">
              <article className={styles.buildRecord}><div className={styles.buildRecordBody}>
                <strong>{component.kind === 'code' ? item.message || w('noCommitMessage') : item.image.address || '—'}</strong>
                <div className={styles.buildRecordMeta}>{item.createdAt ? moment(item.createdAt).format('YYYY-MM-DD HH:mm') : '—'}{item.author && ` · ${item.author}`}
                  {component.kind === 'code' && <React.Fragment><span> · {item.branch || '—'} · </span>{external(repositoryLinks(component.repository, component.provider, item.commit, item.branch).commit, item.commit ? <code>{item.commit.slice(0, 12)}</code> : '—')}</React.Fragment>}
                </div><div className={styles.muted}>{w('buildVersion')} {item.buildVersion || '—'}{!component.archived && item.buildVersion === history.currentVersion && <Tag color="blue">{w('currentBuild')}</Tag>}</div>
              </div><Badge status={item.status === 'success' ? 'success' : ['failure', 'failed'].includes(item.status) ? 'error' : 'processing'}
                text={w(item.status === 'success' ? 'buildSucceeded' : ['failure', 'failed'].includes(item.status) ? 'buildFailed' : 'componentBuilding')} /></article>
            </Timeline.Item>)}{!(history.records || []).length && <p className={styles.muted}>{w('noBuildHistory')}</p>}</Timeline>}
          </Spin>
          {history.total > 5 && <Pagination size="small" current={history.page || 1} pageSize={5} total={history.total} onChange={onPage} />}
        </div>
      </div>}</Spin>
    </section>;
  }
}
