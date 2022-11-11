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
  groups: global.groups
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
      type: 'application/addGroup',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        ...vals
      },
      callback: group => {
        if (group) {
          // 获取群组
          this.props.dispatch({
            type: 'global/fetchGroups',
            payload: {
              team_name: globalUtil.getCurrTeamName(),
              region_name: globalUtil.getCurrRegionName()
            },
            callback: () => {
              setFieldsValue({ group_id: group.group_id });
              this.cancelAddGroup();
            }
          });
        }
      }
    });
  };

  handleSubmit = value => {
    const teamName = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: 'createApp/createThirdPartyServices',
      payload: {
        team_name: teamName,
        group_id: value.group_id,
        service_cname: value.service_cname,
        ...value
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
      }
    });
  };
  render() {
    return (
      <Card style={{boxShadow: 'rgb(36 46 66 / 16%) 2px 4px 10px 0px'}}>
        <TopUpHints />
        <div className={styles.formWrap}>
          <OuterCustomForm onSubmit={this.handleSubmit} {...this.props} />
        </div>
      </Card>
    );
  }
}
