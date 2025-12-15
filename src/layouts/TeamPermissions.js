import { notification } from 'antd';
import { connect } from 'dva';
import React from 'react';
import { formatMessage } from '@/utils/intl';
import { history } from 'umi';
import PageLoading from '../components/PageLoading';
import Exception from '../pages/Exception/403';
import roleUtil from '../utils/role';
import userUtil from '../utils/user';

class TeamPermissions extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      teamView: true,
      loading: true
    };
  }
  componentWillMount() {
    this.fetchUserInfo();
  }

  fetchUserInfo = () => {
    const { dispatch } = this.props;
    const { teamName } = this.props.match.params;
    if (teamName) {
      dispatch({
        type: 'user/fetchCurrent',
        payload: {
          team_name: teamName
        },
        callback: res => {
          if (res && res.status_code === 200) {
            this.handleResults(res.bean.teams, teamName);
          }
        },
        handleError: () => {
          this.setState({
            loading: false,
            teamView: false
          });
        }
      });
    }
  };

  handleResults = (teams, teamName) => {
    const { dispatch } = this.props;
    const teamPermissions = userUtil.getTeamByTeamPermissions(teams, teamName);
    if (teamPermissions && teamPermissions.length === 0) {
      notification.warning({
        message: formatMessage({id:'notification.warn.team'})
      });
      return history.push('/');
    }
    dispatch({
      type: 'teamControl/fetchCurrentTeamPermissions',
      payload: teamPermissions
    });
    const results = roleUtil.queryTeamUserPermissionsInfo(
      teamPermissions,
      'teamBasicInfo',
      'describe'
    );
    this.setState({ teamView: results, loading: false });
  };

  render() {
    const { children } = this.props;
    const { teamView, loading } = this.state;

    if (loading) {
      return <PageLoading />;
    }
    if (!teamView) {
      return <Exception />;
    }
    return (
      <div>
        <div>{children}</div>
      </div>
    );
  }
}

export default connect()(TeamPermissions);
