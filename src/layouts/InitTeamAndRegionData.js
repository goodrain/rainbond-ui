import React from 'react';
import { connect } from 'dva';
import globalUtil from '../utils/global';

@connect()
export default class Index extends React.PureComponent {
  componentWillMount() {
    const currTeam = globalUtil.getCurrTeamName();
    const currRegion = globalUtil.getCurrRegionName();
    if (currTeam && currRegion) {
      // 获取 数据中心列表
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
  }
  render() {
    const { children } = this.props;
    return children;
  }
}
