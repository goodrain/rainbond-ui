/* eslint-disable camelcase */
import { Card, List } from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import globalUtil from '../../../utils/global';
import handleAPIError from '../../../utils/error';
import styles from './index.less';

@connect(({ loading }) => ({
  activitiesLoading: loading.effects['index/fetchEvents']
}))
export default class EventList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      page: 1,
      pageSize: 8,
      total: 0,
      events: []
    };
  }

  componentDidMount() {
    this.loadEvents();
  }
  // 加载团队事件列表
  loadEvents = () => {
    const { dispatch } = this.props;
    const { page, pageSize } = this.state;

    dispatch({
      type: 'index/fetchEvents',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        page_size: pageSize,
        page
      },
      callback: data => {
        if (data) {
          this.setState({
            events: data.list || [],
            total: data.total || (data.list ? data.list.length : 0)
          });
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };

  // 分页切换
  handlePageChange = page => {
    this.setState({ page }, () => {
      this.loadEvents();
    });
  };

  // 渲染活动列表
  renderActivities = () => {
    const { events } = this.state;

    if (!events || events.length === 0) {
      return (
        <p
          style={{
            textAlign: 'center',
            color: '#ccc',
            paddingTop: 20
          }}
        >
          {formatMessage({ id: 'teamManage.tabs.dynamic.notDynamic' })}
        </p>
      );
    }

    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    const appID = globalUtil.getAppID();

    return events.map(item => {
      const {
        ID,
        user_name,
        opt_type,
        final_status,
        status,
        create_time,
        target,
        service_name,
        service_alias,
        updatedAt
      } = item;

      const linkTo = `/team/${teamName}/region/${regionName}/apps/${appID}/overview?type=components&componentID=${service_alias}&tab=overview`;

      return (
        <List.Item key={ID}>
          <List.Item.Meta
            title={
              <span>
                <a className={styles.username}>{user_name}</a>
                <span className={styles.event}>
                  {' '}
                  {globalUtil.fetchStateOptTypeText(opt_type)}
                </span>
                &nbsp;
                {target === 'service' && (
                  <Link to={linkTo} className={styles.event}>
                    {service_name}
                  </Link>
                )}
                <span>
                  {formatMessage({ id: 'teamManage.tabs.dynamic.meta.app' })}
                </span>
                <span
                  style={{
                    color: globalUtil.fetchAbnormalcolor(opt_type)
                  }}
                >
                  {globalUtil.fetchOperation(final_status, status)}
                </span>
              </span>
            }
            description={
              <span className={styles.datatime_float} title={updatedAt}>
                {globalUtil.fetchdayTime(create_time)}
              </span>
            }
          />
        </List.Item>
      );
    });
  };
  render() {
    const { activitiesLoading } = this.props;
    const { page, pageSize, total } = this.state;

    const pagination = {
      current: page,
      pageSize,
      total,
      onChange: this.handlePageChange
    };

    return (
      <Card
        bodyStyle={{ paddingTop: 12 }}
        title={formatMessage({ id: 'teamManage.tabs.dynamic' })}
        loading={activitiesLoading}
      >
        <List
          pagination={total > pageSize ? pagination : false}
          loading={activitiesLoading}
          size="large"
        >
          <div className={styles.activitiesList}>
            {this.renderActivities()}
          </div>
        </List>
      </Card>
    );
  }
}