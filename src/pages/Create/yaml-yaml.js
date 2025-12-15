/* eslint-disable no-unused-expressions */
import { Card } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import CodeYamlForm from '../../components/CodeYamlForm';
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
  hideShowKey = () => {
    this.setState({ showKey: false });
  };
  handleSubmit = (value, event_id)=> {
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    const { dispatch, groups } = this.props
    // 获取 groups 中的
    if(!value.group_name){
      const group = groups.find(item => item.group_id == value.group_id)
      value.group_name = group.group_name
    }
    dispatch(
      routerRedux.push(
        `/team/${teamName}/region/${regionName}/importMessageYaml?event_id=${event_id}&group_id=${value.group_id}&group_name=${value.group_name}`
      )
    );
  };

  // 创建新应用
  installApp = (vals, event_id) => {
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
          vals.group_name = res.group_name
          this.handleSubmit(vals, event_id)
        }
      },
      handleError: () => {
        
      }
    })
  }

  handleInstallApp = (value, event_id) => {
    if (value.group_id) {
      // 已有应用
      this.handleSubmit(value, event_id)
    } else {
      // 新建应用再创建组件
      this.installApp(value, event_id)
    }
  };

  render() {
    return (
      <Card>
        <TopUpHints />
        <div className={styles.formWrap}>
          <CodeYamlForm onSubmit={this.handleInstallApp} {...this.props} />
        </div>
      </Card>
    );
  }
}
