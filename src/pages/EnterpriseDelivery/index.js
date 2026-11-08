import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { Alert, Button, Card, Input, Table, Tag } from 'antd';
import moment from 'moment';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import pageheaderSvg from '../../utils/pageHeaderSvg';
import { w } from '../../components/DeliveryWorkflow';
import styles from './index.less';

@connect(({ user }) => ({ user: user.currentUser }))
export default class DevelopmentDeliveries extends PureComponent {
  state = { groups: [], loading: true, failed: false, query: '' };
  alive = false;
  componentDidMount() { this.alive = true; this.load(); }
  componentDidUpdate(previous) { if (previous.match.params.eid !== this.props.match.params.eid) this.load(); }
  componentWillUnmount() { this.alive = false; }
  load = () => {
    const { user } = this.props;
    if (!user || !user.is_enterprise_admin || String(user.enterprise_id) !== String(this.props.match.params.eid)) return;
    const eid = this.props.match.params.eid;
    this.setState({ loading: true, failed: false });
    this.props.dispatch({ type: 'deliveryCenter/load', payload: { user, kind: 'center' }, callback: bean => {
      if (this.alive && eid === this.props.match.params.eid) this.setState({ groups: bean.groups, loading: false });
    }, onError: () => { if (this.alive) this.setState({ failed: true, loading: false }); } });
  };
  render() {
    const { user, match, dispatch } = this.props;
    if (!user || !user.is_enterprise_admin || String(user.enterprise_id) !== String(match.params.eid)) return <Alert type="warning" message={w('forbidden')} />;
    const { groups, loading, failed, query } = this.state;
    const open = group => dispatch(routerRedux.push(`/enterprise/${match.params.eid}/development-delivery/${encodeURIComponent(group.id)}`));
    return <PageHeaderLayout isFooter title={w('center')} content={w('centerHelp')} titleSvg={pageheaderSvg.getPageHeaderSvg('publish', 18)}>
      <Card><div className={styles.toolbar}><Input.Search allowClear placeholder={w('search')} onSearch={query => this.setState({ query: query.trim() })} />
        <Button icon="reload" loading={loading} onClick={this.load}>{w('refresh')}</Button></div>
        {failed ? <Alert type="warning" showIcon message={w('loadFailed')} /> : <div className={styles.table}><Table rowKey="id" loading={loading}
          dataSource={groups.filter(group => `${group.template_name} ${group.app_name} ${group.source.teamName}`.includes(query))}
          pagination={{ pageSize: 10, hideOnSinglePage: true }} columns={[
            { title: w('template'), dataIndex: 'template_name', render: (value, group) => <a onClick={() => open(group)}>{value}</a> },
            { title: w('sourceApp'), dataIndex: 'app_name' },
            { title: w('sourceTeam'), key: 'team', render: (_, group) => group.source.team_alias || group.source.teamName },
            { title: w('versions'), key: 'versions', render: (_, group) => group.versions.length },
            { title: w('pendingReview'), dataIndex: 'pending', render: value => value ? <Tag color="blue">{value}</Tag> : '—' },
            { title: w('lastSubmitted'), dataIndex: 'latest_at', render: value => moment(value).format('YYYY-MM-DD HH:mm') },
            { title: w('actions'), key: 'action', render: (_, group) => <a onClick={() => open(group)}>{w('details')}</a> }
          ]} locale={{ emptyText: w('noListings') }} /></div>}
      </Card>
    </PageHeaderLayout>;
  }
}
