/* eslint-disable func-names */
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React from 'react';
import apiconfig from '../../../config/api.config';
import globalUtil from '../../utils/global';

@connect()
class Index extends React.Component {
  componentWillMount() {
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    const { group_id: groupId, dispatch } = this.props;
    const topologicalAddress = `${apiconfig.baseUrl}/console/teams/${teamName}/regions/${regionName}/topological?group_id=${groupId}`;
    try {
      window.iframeGetNodeUrl = function() {
        return topologicalAddress;
      };

      window.iframeGetMonitor = function(fn, errcallback) {
        dispatch({
          type: 'application/groupMonitorData',
          payload: {
            team_name: teamName,
            group_id: groupId,
          },
          callback: data => {
            if (data && fn) {
              fn(data);
            }
          },
          handleError: (err) => {
            if (errcallback) {
              errcallback(err)
            }
          }
        });
        return topologicalAddress;
      };

      window.iframeGetTenantName = function() {
        return teamName;
      };

      window.iframeGetRegion = function() {
        return regionName;
      };

      window.iframeGetGroupId = function() {
        return groupId;
      };

      // 拓扑图点击服务事件
      window.handleClickService = function(nodeDetails) {
        dispatch(
          routerRedux.push(
            `/team/${teamName}/region/${regionName}/components/${nodeDetails.service_alias}/overview`
          )
        );
      };

      // 拓扑图点击依赖服务事件
      window.handleClickRelation = function(relation) {
        dispatch(
          routerRedux.push(
            `/team/${teamName}/region/${regionName}/components/${relation.service_alias}/overview`
          )
        );
      };
    } catch (e) {}
  }
  render() {
    return (
      // eslint-disable-next-line jsx-a11y/iframe-has-title
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
