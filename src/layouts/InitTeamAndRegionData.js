import React from 'react';
import { connect } from 'dva';
import globalUtil from '../utils/global';

@connect()
export default class Index extends React.PureComponent {
  componentWillMount() {
    const currTeam = globalUtil.getCurrTeamName();
    const currRegion = globalUtil.getCurrRegionName();
    // 获取群组
    this.props.dispatch({
      type: 'global/fetchGroups',
      payload: {
        team_name: currTeam,
        region_name: currRegion,
      },
    });

    this.props.dispatch({
      type: 'global/saveCurrTeamAndRegion',
      payload: {
        currTeam,
        currRegion,
      },
    });
    // 获取当前数据中心的协议
    this.props.dispatch({
      type: 'region/fetchProtocols',
      payload: {
        team_name: currTeam,
        region_name: currRegion,
      },
    });
  }
  componentWillUnmount() {
  }
  render() {
    return this.props.children;
  }
}
