import React, { PureComponent, Fragment } from 'react';
import debounce from 'lodash.debounce';
import globalUtil from '../../utils/global';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import apiconfig from '../../../config/api.config';

@connect()
class Index extends React.Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {}
  componentWillMount() {
    const team_name = globalUtil.getCurrTeamName();
    const groupId = this.props.group_id;
    const self = this;
    try {
      window.iframeGetNodeUrl = function() {
        return `${
          apiconfig.baseUrl
        }/console/teams/${team_name}/topological?group_id=${groupId}&region_name=${globalUtil.getCurrRegionName()}`;
      };

      window.iframeGetMonitor = function(fn) {
        self.props.dispatch({
          type: 'groupControl/groupMonitorData',
          payload: {
            team_name: globalUtil.getCurrTeamName(),
            group_id: groupId,
          },
          callback: data => {
            if (data) {
              fn && fn(data || {});
            }
          },
        });

        return `${
          apiconfig.baseUrl
        }/console/teams/${team_name}/topological?group_id=${groupId}&region_name=${globalUtil.getCurrRegionName()}`;
      };

      window.iframeGetTenantName = function() {
        return team_name;
      };

      window.iframeGetRegion = function() {
        return globalUtil.getCurrRegionName();
      };

      window.iframeGetGroupId = function() {
        return groupId;
      };

      // 拓扑图点击服务事件
      window.handleClickService = function(nodeDetails) {
        self.props.dispatch(
          routerRedux.push(
            `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${
              nodeDetails.service_alias
            }/overview`
          )
        );
      };

      // 拓扑图点击依赖服务事件
      window.handleClickRelation = function(relation) {
        self.props.dispatch(
          routerRedux.push(
            `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${
              relation.service_alias
            }/overview`
          )
        );
      };
    } catch (e) {}
  }
  render() {
    return (
      <iframe
        src={`${apiconfig.baseUrl}/static/www/weavescope/index.html`}
        style={{
          width: '100%',
          height: '500px',
        }}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        scrolling="auto"
        frameBorder="no"
        border="0"
        marginWidth="0"
        marginHeight="0"
      />
    );
  }
}

export default Index;
