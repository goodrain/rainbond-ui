import { Modal } from 'antd';
import { connect } from 'dva';
import React from 'react';

// 提示充值或购买资源
@connect()
export default class MemoryTip extends React.PureComponent {
  handleCancel = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/hideMemoryTip'
    });
  };

  render() {
    return (
      <Modal visible title="提示" onCancel={this.handleCancel} footer={null}>
        <h4 style={{ textAlign: 'center' }}>{this.props.memoryTip}</h4>
      </Modal>
    );
  }
}
