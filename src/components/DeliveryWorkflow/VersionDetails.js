import React, { PureComponent } from 'react';
import { Button, Icon, Table, Tabs, Timeline } from 'antd';
import moment from 'moment';
import { DeploymentTable, TemplateConfiguration, statusLabel, w, deliveryRecordsLabel } from './index';
import styles from './version.less';

const metric = value => value == null || !Number.isFinite(Number(value)) ? '—' : Number(Number(value).toFixed(3));
const sourceType = component => w(component.vm || component.source_type === 'vm' ? 'virtualMachine' : component.source_type === 'source_code' ? 'sourceCode' : 'image');

export default class VersionDetails extends PureComponent {
  renderTemplate = () => {
    const { template, onConfiguration, inlineConfiguration } = this.props;
    return <div>
      <div className={styles.facts}>
        {[[w('template'), template.template_name], [w('publicationScope'), template.destination === 'market' ? template.market_name || w('marketLocation') : w('teamLocation')],
          ...(template.is_platform_plugin ? [[w('platformPlugin'), template.plugin && (template.plugin.plugin_name || template.plugin.plugin_id) || '—']] : [])].map(([label, value]) =>
          <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
      </div>
      <div className={styles.componentHeader}><h3>{w('templateComponents')}</h3>
        {!inlineConfiguration && <Button type="link" icon="setting" onClick={onConfiguration}>{w('templateConfig')}</Button>}
      </div>
      <div className={styles.table}><Table rowKey="service_id" size="small" pagination={false} dataSource={template.components} columns={[
        { title: w('component'), dataIndex: 'name', width: '18%', render: (name, row) => <div><span>{name}</span><small className={styles.secondary}>{sourceType(row)}</small></div> },
        { title: w('source'), dataIndex: 'source', width: '35%', render: value => <span className={styles.wrap}>{value || '—'}</span> },
        { title: w('sourceVersion'), key: 'version', width: '23%', render: (_, row) => row.branch || row.commit ? <div>
          {row.branch && <div><Icon type="branches" /> {row.branch}</div>}{row.commit && <small className={styles.secondary}>Commit: {row.commit}</small>}
        </div> : '—' },
        { title: w('configurationSummary'), key: 'configuration', width: '24%', render: (_, row) => {
          const config = template.component_overrides.find(item => item.service_id === row.service_id), scaling = config && config.extend_method_map;
          return config ? <div className={styles.configurationSummary}><div>{config.service_env_map_list.length} {w('variableUnit')}</div>
            {scaling && <React.Fragment><div>CPU {metric(scaling.container_cpu == null ? undefined : scaling.container_cpu / 1000)} {w('coreUnit')} · {metric(scaling.init_memory == null ? undefined : scaling.init_memory / 1024)} GB</div>
              {scaling.min_node != null && <div>{w('replicas')} {scaling.min_node} — {scaling.max_node}</div>}</React.Fragment>}
          </div> : '—';
        } }
      ]} /></div>
    </div>;
  };
  renderReviews = () => {
    const attempts = new Map();
    (this.props.reviews || []).forEach(item => [...(item.history || []), item].forEach(attempt => attempts.set(attempt.id, attempt)));
    const reviews = Array.from(attempts.values()).sort((a, b) => (Date.parse(a.submitted_at) || 0) - (Date.parse(b.submitted_at) || 0));
    return reviews.length ? <Timeline className={styles.reviewTimeline}>
      {reviews.map(attempt => [
        <Timeline.Item key={`${attempt.id}-submitted`} color="blue"><strong>{w('listingSubmitted')}</strong>
          <div className={styles.secondary}>{attempt.applicant_name} · {moment(attempt.submitted_at).format('YYYY-MM-DD HH:mm')}</div>
          <p>{attempt.reason}</p>
        </Timeline.Item>,
        attempt.status !== 'pending' ? <Timeline.Item key={`${attempt.id}-reviewed`} color="blue">{statusLabel(attempt.status)}
          <div className={styles.secondary}>{attempt.reviewer_name || '—'} · {moment(attempt.reviewed_at).format('YYYY-MM-DD HH:mm')}</div>
          <p>{attempt.review_comment || w('noComment')}</p>
        </Timeline.Item> : null
      ])}
    </Timeline> : <p className={styles.empty}>{w('noReviewRecords')}</p>;
  };
  render() {
    const { activeTab = 'template', onTabChange, deployments, template, inlineConfiguration } = this.props;
    return <Tabs className={styles.detailsTabs} activeKey={activeTab} animated={false} onChange={onTabChange}>
      <Tabs.TabPane tab={w('templateTab')} key="template">{this.renderTemplate()}</Tabs.TabPane>
      {inlineConfiguration && <Tabs.TabPane tab={w('componentConfiguration')} key="configuration"><TemplateConfiguration template={template} /></Tabs.TabPane>}
      <Tabs.TabPane tab={w('reviewTab')} key="review">{this.renderReviews()}</Tabs.TabPane>
      <Tabs.TabPane tab={`${deliveryRecordsLabel(deployments)} (${deployments.length})`} key="deployments">
        {deployments.length ? <div className={styles.table}><DeploymentTable items={deployments} /></div> : <p className={styles.empty}>{w('noDeliveryRecords')}</p>}
      </Tabs.TabPane>
    </Tabs>;
  }
}
