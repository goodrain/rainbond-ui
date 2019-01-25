import React, { Fragment } from 'react';
import globalUtil from '../utils/global';
import { connect } from 'dva';
import { Layout, Icon, message, notification, Modal, Button } from 'antd';
import { routerRedux } from 'dva/router';

// 提示充值或购买资源
@connect()
export default class MemoryTip extends React.PureComponent {
  handleCancel = () => {
    this.props.dispatch({
      type: 'global/hideMemoryTip',
    });
  };
  componentDidMount() {}
  render() {
    return (
      <Modal
        visible
        title="提示"
        onCancel={this.handleCancel}
        footer={null}
      >
        <h4 style={{ textAlign: 'center' }}>{this.props.memoryTip}</h4>
      </Modal>
    );
  }
}
