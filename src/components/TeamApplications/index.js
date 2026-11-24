import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { Alert, Badge, Button, Card, Descriptions, Empty, Form, Icon, Input, Modal, Select, Table } from 'antd';
import moment from 'moment';
import { formatMessage } from '@/utils/intl';
import CreateTeam from '../CreateTeam';
import styles from './index.less';
const { workspaceRows, quotaToFields } = require('../../utils/teamApplications');

const t = key => formatMessage({ id: `workspace.${key}` });
const statuses = { joined: 'success', pending: 'processing', approved: 'success', rejected: 'error' };
const date = value => value ? moment(value).format('YYYY-MM-DD HH:mm') : '—';

@Form.create()
class ApplicationDetail extends PureComponent {
  review = decision => {
    this.props.form.validateFields((error, values) => {
      if (error) return;
      const comment = (values.comment || '').trim();
      if (decision === 'rejected' && !comment) {
        this.props.form.setFields({ comment: { value: values.comment, errors: [new Error(t('reviewRequired'))] } });
        return;
      }
      this.props.onReview(decision, comment);
    });
  };

  render() {
    const { row, reviewing, onCancel, loading, form } = this.props;
    const editable = reviewing && row.status === 'pending';
    const resources = quotaToFields(row.quota);
    const details = [
      ['teamName', row.team_alias], ['namespace', row.namespace],
      ['regions', (row.region_labels || row.regions || []).join('、')],
      ['applicant', row.applicant_name], ['submittedAt', date(row.submitted_at)],
      ['status', <Badge status={statuses[row.status] || 'default'} text={t(row.status)} />],
      ['requestedCpu', resources.cpu_cores == null ? '—' : resources.cpu_cores],
      ['requestedMemory', resources.memory_gb == null ? '—' : resources.memory_gb],
      ['requestedStorage', resources.storage_gb == null ? '—' : resources.storage_gb],
      ['reason', <span className={styles.multiline}>{row.reason}</span>],
      ...(row.status !== 'pending' ? [['reviewer', row.reviewer_name || '—'], ['reviewedAt', date(row.reviewed_at)]] : []),
      ...(!editable ? [['comment', <span className={styles.multiline}>{row.comment || '—'}</span>]] : [])
    ];
    return <Modal visible centered destroyOnClose maskClosable={false} width={640}
      title={t(editable ? 'reviewTitle' : 'detailTitle')} onCancel={loading ? undefined : onCancel}
      closable={!loading} className={styles.detailModal}
      footer={editable ? [
        <Button key="cancel" disabled={loading} onClick={onCancel}>{t('cancel')}</Button>,
        <Button key="reject" type="danger" ghost disabled={loading} onClick={() => this.review('rejected')}>{t('reject')}</Button>,
        <Button key="approve" type="primary" loading={loading} onClick={() => this.review('approved')}>{t('approve')}</Button>
      ] : <Button onClick={onCancel}>{t('close')}</Button>}>
      {row.provisioning_error && <Alert type="warning" showIcon message={row.provisioning_error} />}
      <Descriptions bordered size="small" column={1}>
        {details.map(([key, value]) => <Descriptions.Item key={key} label={t(key)}>{value}</Descriptions.Item>)}
      </Descriptions>
      {editable && <Form layout="vertical" className={styles.reviewForm}>
        <Form.Item label={t('comment')} extra={t('commentHelp')}>
          {form.getFieldDecorator('comment', { initialValue: '', rules: [{ max: 500, message: t('commentLimit') }] })(
            <Input.TextArea rows={4} maxLength={500} placeholder={t('commentPlaceholder')} />
          )}
        </Form.Item>
      </Form>}
    </Modal>;
  }
}

@connect(({ user, teamApplications, loading }) => ({
  currentUser: user.currentUser,
  items: teamApplications.items,
  failed: teamApplications.failed,
  loading: loading.effects['teamApplications/fetch'],
  submitting: loading.effects['teamApplications/submit'],
  reviewing: loading.effects['teamApplications/review']
}))
export default class TeamApplications extends PureComponent {
  state = { creating: false, previous: null, detail: null, status: 'all', query: '', page: 1 };

  componentDidMount() { this.load(); }

  componentDidUpdate(previous) {
    const oldUser = previous.currentUser || {};
    const user = this.props.currentUser || {};
    if (oldUser.user_id !== user.user_id || oldUser.enterprise_id !== user.enterprise_id || previous.admin !== this.props.admin) {
      this.setState({ detail: null, creating: false, previous: null, page: 1 });
      this.load();
    }
  }

  componentWillUnmount() { this.props.dispatch({ type: 'teamApplications/reset' }); }

  load = () => {
    const { currentUser, admin, dispatch } = this.props;
    if (currentUser) dispatch({ type: 'teamApplications/fetch', payload: { user: currentUser, scope: admin ? 'all' : 'mine' } });
  };

  submit = values => {
    const { dispatch, currentUser } = this.props;
    dispatch({ type: 'teamApplications/submit', payload: {
      user: currentUser, values, previousId: this.state.previous && this.state.previous.id
    }, callback: () => this.setState({ creating: false, previous: null, status: 'all', query: '', page: 1 }) });
  };

  review = (decision, comment) => {
    this.props.dispatch({ type: 'teamApplications/review', payload: {
      user: this.props.currentUser, id: this.state.detail.id, decision, comment
    }, callback: () => this.setState({ detail: null }) });
  };

  enter = team => {
    const region = (team.region || []).find(item => item.team_region_name);
    if (team.team_name && region) this.props.dispatch(routerRedux.push(
      `/team/${encodeURIComponent(team.team_name)}/region/${encodeURIComponent(region.team_region_name)}/index`
    ));
  };

  render() {
    const { admin, currentUser, items, failed, loading, submitting, reviewing } = this.props;
    if (!currentUser || admin && currentUser.is_enterprise_admin !== true) return null;
    const { creating, previous, detail, status, query, page } = this.state;
    const teams = currentUser.teams || [];
    const pending = items.some(row => row.status === 'pending');
    const rows = admin ? items : workspaceRows(teams, items);
    const showRecords = admin || rows.length > 0;
    const visible = rows.filter(row => (status === 'all' || row.status === status) &&
      [row.team_alias, row.applicant_name].some(value => String(value || '').toLowerCase().includes(query.toLowerCase())));
    const columns = [
      { title: t('teamName'), dataIndex: 'team_alias', width: admin ? '21%' : '22%', render: (value, row) => {
        const application = admin ? row : row.application;
        return application ? <a onClick={() => this.setState({ detail: application })}>{value}</a> : value;
      } },
      ...(admin ? [{ title: t('applicant'), dataIndex: 'applicant_name', width: '14%' }] : []),
      { title: t('regions'), dataIndex: 'region_labels', width: admin ? '21%' : '20%', render: (value, row) => (value || row.regions || []).join('、') },
      { title: t(admin ? 'submittedAt' : 'recordTime'), dataIndex: 'submitted_at', width: admin ? '20%' : '22%', render: date },
      { title: t(admin ? 'status' : 'workspaceStatus'), dataIndex: 'status', width: admin ? '12%' : '14%', render: value => <Badge status={statuses[value] || 'default'} text={t(value)} /> },
      { title: t('actions'), key: 'actions', width: admin ? '12%' : '22%', render: (_, row) => {
        const application = admin ? row : row.application;
        const canEnter = row.team && (row.team.region || []).some(region => region.team_region_name);
        return <div className={styles.actions}>
          {canEnter && <a onClick={() => this.enter(row.team)}>{t('enter')}</a>}
          {application && <a onClick={() => this.setState({ detail: application })}>
            {t(admin && row.status === 'pending' ? 'review' : row.team ? 'viewApplication' : 'view')}
          </a>}
          {!admin && application && row.status === 'rejected' && !items.some(item => item.previous_id === application.id) &&
            <a onClick={() => this.setState({ previous: application, creating: true })}>{t('resubmit')}</a>}
        </div>;
      } }
    ];
    return <div className={styles.root}>
      <Card
        extra={!admin && teams.length > 0 && <Button type="primary" icon="plus" onClick={() => this.setState({ creating: true, previous: null })}>{t('apply')}</Button>}>
      {!admin && <React.Fragment>
        {!teams.length && <div className={styles.welcome}>
          <Icon type="team" className={styles.welcomeIcon} />
          <h3>{t(pending ? 'pendingTitle' : 'welcomeTitle')}</h3>
          <p>{t(pending ? 'pendingHelp' : 'welcomeHelp')}</p>
          {!pending && <Button type="primary" icon="plus" onClick={() => this.setState({ creating: true, previous: null })}>{t('apply')}</Button>}
        </div>}
      </React.Fragment>}
      {showRecords && <div className={styles.toolbar}>
        <Input.Search allowClear placeholder={t(admin ? 'adminSearch' : 'search')} onSearch={value => this.setState({ query: value.trim(), page: 1 })} />
        <Select aria-label={t(admin ? 'statusFilter' : 'workspaceStatusFilter')} value={status} onChange={value => this.setState({ status: value, page: 1 })}>
          {(admin ? ['all', 'pending', 'approved', 'rejected'] : ['all', 'joined', 'pending', 'approved', 'rejected']).map(value => <Select.Option key={value} value={value}>{t(value)}</Select.Option>)}
        </Select>
        <Button icon="reload" onClick={this.load} loading={loading}>{t('refresh')}</Button>
      </div>}
      {failed && <Alert className={styles.loadError} type="warning" showIcon message={t('loadFailed')} description={<a onClick={this.load}>{t('retry')}</a>} />}
      {showRecords && <div className={admin ? styles.reviewTable : styles.workspaceTable}>
        <Table rowKey="id" loading={loading} dataSource={visible} columns={columns}
          pagination={{ current: Math.min(page, Math.max(1, Math.ceil(visible.length / 10))), pageSize: 10, total: visible.length,
            onChange: value => this.setState({ page: value }), hideOnSinglePage: true }}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t(query || status !== 'all' ? 'noMatches' : admin ? 'noApplications' : 'noWorkspaces')} /> }} />
      </div>}
      </Card>
      {creating && <CreateTeam application initialApplication={previous} submitting={submitting}
        enterprise_id={currentUser.enterprise_id} onOk={this.submit}
        onCancel={() => { if (!submitting) this.setState({ creating: false, previous: null }); }} />}
      {detail && <ApplicationDetail key={detail.id} row={detail} reviewing={admin} loading={reviewing}
        onReview={this.review} onCancel={() => this.setState({ detail: null })} />}
    </div>;
  }
}
