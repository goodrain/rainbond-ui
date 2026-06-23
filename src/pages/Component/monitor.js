import { Row } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import NoPermTip from '../../components/NoPermTip';
import appUtil from '../../utils/app';
import globalUtil from '../../utils/global';
import ResourceShow from './component/monitor/resourceshow';

// eslint-disable-next-line react/no-multi-comp
@connect(
  ({ user }) => ({ currUser: user.currentUser }),
  null,
  null,
  {
    withRef: true,
  }
)
export default class Index extends PureComponent {
  componentDidMount() {
    if (!this.canView()) return;
    this.fetchBaseInfo();
  }

  fetchBaseInfo = () => {
    const { dispatch, appAlias } = this.props;
    dispatch({
      type: 'appControl/fetchBaseInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };

  // 是否可以浏览当前界面
  canView() {
    return appUtil.canManageAppMonitor(this.props.appDetail);
  }

  render() {
    if (!this.canView()) return <NoPermTip />;

    return (
      <Row data-testid="rbd-comp-monitor-panel">
        <ResourceShow />
      </Row>
    );
  }
}
