import { Modal } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React from 'react';
import globalUtil from '../utils/global';

// 提示充值或购买资源
@connect()
export default class MemoryTip extends React.PureComponent {
  handleCancel = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/hideMemoryTip'
    });
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    const AppID = globalUtil.getAppID();
    if (teamName && regionName) {
      let targets = '';
      if (window.location.href.indexOf('create-check') > -1) {
        targets = 'index';
      }
      if (AppID) {
        targets = `apps/${AppID}`;
      }
      if (targets) {
        this.handleJump(teamName, regionName, targets);
      }
    }
  };
  handleJump = (teamName, regionName, targets) => {
    const { dispatch } = this.props;
    dispatch(
      routerRedux.push(`/team/${teamName}/region/${regionName}/${targets}`)
    );
  };
  render() {
    return (
      <Modal visible title="提示" onCancel={this.handleCancel} footer={null}>
        <h4 style={{ textAlign: 'center' }}>{this.props.memoryTip}</h4>
      </Modal>
    );
  }
}
