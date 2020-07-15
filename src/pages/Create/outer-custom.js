/* eslint-disable no-unused-expressions */
import { Card } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import OuterCustomForm from '../../components/OuterCustomForm';
import TopUpHints from '../../components/TopUpHints';
import globalUtil from '../../utils/global';
import styles from './Index.less';

@connect(({ user, global }) => ({
  currUser: user.currentUser,
  groups: global.groups,
}))
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }
  onAddGroup = () => {
    this.setState({ addGroup: true });
  };
  cancelAddGroup = () => {
    this.setState({ addGroup: false });
  };
  handleAddGroup = vals => {
    const { setFieldsValue } = this.props.form;

    this.props.dispatch({
      type: 'groupControl/addGroup',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        ...vals,
      },
      callback: group => {
        if (group) {
          // 获取群组
          this.props.dispatch({
            type: 'global/fetchGroups',
            payload: {
              team_name: globalUtil.getCurrTeamName(),
              region_name: globalUtil.getCurrRegionName(),
            },
            callback: () => {
              setFieldsValue({ group_id: group.group_id });
              this.cancelAddGroup();
            },
          });
        }
      },
    });
  };
  hideShowKey = () => {
    this.setState({ showKey: false });
  };
  handleSubmit = value => {
    const teamName = globalUtil.getCurrTeamName();
    let endpoints = {};
    if (value.endpoints_type == 'static') {
      endpoints = value.static;
    } else if (value.endpoints_type == 'api') {
      endpoints = value.api;
    } else {
      endpoints.type = value.type;
      endpoints.servers = value.servers;
      endpoints.key = value.key;
      endpoints.username = value.username;
      endpoints.password = value.password;
    }
    this.props.dispatch({
      type: 'createApp/createThirdPartyServices',
      payload: {
        team_name: teamName,
        group_id: value.group_id,
        service_cname: value.service_cname,
        endpoints_type: value.endpoints_type,
        endpoints: JSON.stringify(endpoints) == '{}' ? '' : endpoints,
      },
      callback: data => {
        if (data) {
          const appAlias = data.bean.service_alias;
          this.props.handleType && this.props.handleType === 'Service'
            ? this.props.handleServiceGetData(appAlias)
            : this.props.dispatch(
                routerRedux.push(
                  `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/create-check/${appAlias}`
                )
              );
          this.props.handleType &&
            this.props.handleType === 'Service' &&
            this.props.handleServiceBotton(null, null);
        }
      },
    });
  };
  render() {
    return (
      <Card>
        <TopUpHints />
        <div className={styles.formWrap}>
          <OuterCustomForm onSubmit={this.handleSubmit} {...this.props} />
        </div>
      </Card>
    );
  }
}
