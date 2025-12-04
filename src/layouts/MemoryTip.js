import { Modal } from 'antd';
import { connect } from 'dva';
import React from 'react';
import { formatMessage } from '@/utils/intl';

// 提示充值或购买资源
@connect(({ global }) => ({
  rainbondInfo: global.rainbondInfo,
}))
export default class MemoryTip extends React.PureComponent {
  handleCancel = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/hideMemoryTip'
    });
  };

  render() {
    const { rainbondInfo, memoryTip} = this.props;
    const tipMap = {
      10406: `${formatMessage({id:'utils.request.Insufficient_resources'})}`,
      10413: `${rainbondInfo?.is_saas ? formatMessage({id:'utils.request.Exceeding_limit_cloud'}) : formatMessage({id:'utils.request.Exceeding_limit'})}`,
      20800: `${formatMessage({id:'utils.request.Build_failed'})}`
    };
    return (
      <Modal visible title="提示" onCancel={this.handleCancel} footer={null}>
        <h4 style={{ textAlign: 'center' }}>{tipMap[memoryTip]}</h4>
      </Modal>
    );
  }
}
