import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { Button, Modal, Form } from 'antd';
import ordersUtil from '../../utils/orders';

@Form.create()
@connect()
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {};
  }

  handleClose = () => {
    this.hidden();
    const { onOk, eid, dispatch } = this.props;
    dispatch(routerRedux.push(`/enterprise/${eid}/orders/overviewService`));
    onOk && onOk();
  };
  hidden = () => {
    const { dispatch } = this.props;
    dispatch({ type: 'global/hideOrders' });
  };

  fetchCenter = (code, enterpriseServiceInfo) => {
    const { used_memory, memory_limit } = enterpriseServiceInfo;
    const map = {
      20001: '免费用户不支持此操作，是否前往升级为付费用户。',
      20002: `当前使用调度内存容量（${ordersUtil.handlUnit(
        used_memory
      )} GB）已经达到订购容量（${ordersUtil.handlUnit(
        memory_limit
      )} GB）的上限，为了不影响正常使用，请尽快前往服务订购页扩容更大容量。`,
      20003: '当前订购的付费服务已过期，为了不影响正常使用，请尽快前往服务订购页面进行续费。',
    };
    return map[code] || '';
  };

  fetchText = code => {
    const map = {
      20001: '升级',
      20002: '扩容',
      20003: '续费',
    };
    return map[code] || '';
  };

  render() {
    const { orders, enterpriseServiceInfo } = this.props;
    if (!enterpriseServiceInfo) {
      return false;
    }
    return (
      <Modal
        width={800}
        title="服务订购"
        visible
        onCancel={this.hidden}
        footer={[
          <Button onClick={this.hidden}> 取消 </Button>,
          <Button type="primary" onClick={this.handleClose}>
            {this.fetchText(orders)}
          </Button>,
        ]}
      >
        <div>{this.fetchCenter(orders, enterpriseServiceInfo)}</div>
      </Modal>
    );
  }
}
