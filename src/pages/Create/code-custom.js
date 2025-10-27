/* eslint-disable no-unused-expressions */
import { Card } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import CodeCustomForm from '../../components/CodeCustomForm';
import TopUpHints from '../../components/TopUpHints';
import globalUtil from '../../utils/global';
import roleUtil from '../../utils/newRole';
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

  hideShowKey = () => {
    this.setState({ showKey: false });
  };
  handleSubmit = value => {
    const teamName = globalUtil.getCurrTeamName();
    const username = value.username_1;
    const password = value.password_1;
    delete value.username_1;
    delete value.password_1;
    this.props.dispatch({
      type: 'createApp/createAppByCode',
      payload: {
        team_name: teamName,
        code_from: 'gitlab_manual',
        ...value,
        username,
        password
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
        }
      }
    });
  };

  // 创建新应用
  installApp = (vals) => {
    const { dispatch } = this.props;
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    dispatch({
      type: 'application/addGroup',
      payload: {
        region_name: regionName,
        team_name: teamName,
        group_name: vals.group_name,
        k8s_app: vals.k8s_app,
        note: '',
      },
      callback: (res) => {
        if(res && res.group_id){
          roleUtil.refreshPermissionsInfo()
          vals.group_id = res.group_id
          this.handleSubmit(vals)
        }
      },
      handleError: () => {
        
      }
    })
  }

  handleInstallApp = (value) => {
    if(value.group_id){
      // 已有应用
      this.handleSubmit(value)
    } else {
      // 新建应用再创建组件
      this.installApp(value)
    }
  };

  render() {
    const arch = this.props.archInfo    
    return (
      <Card bordered={this.props.handleType && this.props.handleType === 'Service' ? false : true}>
        <TopUpHints />
        <div
          className={styles.formWrap}
        >
          <CodeCustomForm onSubmit={this.handleInstallApp} {...this.props} />
        </div>
      </Card>
    );
  }
}
