import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Card, Avatar } from 'antd';
import moment from 'moment';
import OpenRegion from '../../OpenRegion';
import teamUtil from '../../../utils/team';
import globalUtil from '../../../utils/global';
import userUtil from '../../../utils/user';
import styles from './index.less';

@connect(({ teamControl, loading, user }) => ({
  regions: teamControl.regions,
  currUser: user.currentUser,
  projectLoading: loading.effects['project/fetchNotice'],
  activitiesLoading: loading.effects['activities/fetchList'],
}))
export default class DatacenterList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      openRegion: false,
    };
  }
  componentDidMount() {
    this.fetchRegions();
  }
  onOpenRegion = () => {
    this.setState({ openRegion: true });
  };
  cancelOpenRegion = () => {
    this.setState({ openRegion: false });
  };
  handleOpenRegion = regions => {
    this.props.dispatch({
      type: 'teamControl/openRegion',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region_names: regions.join(','),
      },
      callback: () => {
        this.fetchRegions();
        this.props.dispatch({ type: 'user/fetchCurrent' });
        this.cancelOpenRegion();
      },
    });
  };
  fetchRegions = () => {
    const { dispatch } = this.props;
    const teamName = globalUtil.getCurrTeamName();
    dispatch({
      type: 'teamControl/fetchRegions',
      payload: {
        team_name: teamName,
      },
    });
  };
  render() {
    const {
      regions,
      currUser,
      projectLoading,
      datecenterPermissions: { isCreate, isEdit, isDelete },
    } = this.props;
    console.log('regions', regions);
    return (
      <div>
        <Card
          className={styles.projectList}
          style={{
            marginBottom: 24,
          }}
          title="已开通集群"
          bordered={false}
          extra={
            isCreate && (
              <a href="javascript:;" onClick={this.onOpenRegion}>
                开通集群
              </a>
            )
          }
          loading={projectLoading}
          bodyStyle={{
            padding: 0,
          }}
        >
          {(regions || []).map(item => (
            <Card.Grid className={styles.projectGrid} key={item.ID}>
              <Card
                bodyStyle={{
                  padding: 0,
                }}
                bordered={false}
              >
                <Card.Meta
                  title={
                    <div className={styles.cardTitle}>
                      <Avatar size="small" src={item.logo} />
                      <a href="javascript:;">{item.region_alisa}</a>
                    </div>
                  }
                  description={item.desc || '-'}
                />
                <div className={styles.projectItemContent}>
                  <span className={styles.datetime}>
                    开通于{' '}
                    {moment(item.create_time)
                      .locale('zh-cn')
                      .format('YYYY年-MM月-DD日')}
                  </span>
                </div>
              </Card>
            </Card.Grid>
          ))}
          {!regions || !regions.length ? (
            <p
              style={{
                textAlign: 'center',
                paddingTop: 20,
              }}
            >
              暂无集群
            </p>
          ) : (
            ''
          )}
        </Card>
        {this.state.openRegion && (
          <OpenRegion
            onSubmit={this.handleOpenRegion}
            onCancel={this.cancelOpenRegion}
          />
        )}
      </div>
    );
  }
}
