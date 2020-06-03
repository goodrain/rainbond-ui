import React, { PureComponent } from "react";
import { connect } from "dva";
import { Link } from "dva/router";
import { Alert, Form } from "antd";
import ordersUtil from "../../utils/orders";
import rainbondUtil from "../../utils/rainbond";

@Form.create()
@connect(({ order }) => ({
  enterpriseServiceInfo: order.enterpriseServiceInfo
}))
export default class Index extends PureComponent {
  state = {
    visible: true
  };

  handleClose = () => {
    this.setState({ visible: false });
  };

  hidden = () => {
    const { dispatch } = this.props;
    dispatch({ type: "global/hideOrders" });
  };

  render() {
    const { enterpriseServiceInfo: info, eid } = this.props;
    const { visible } = this.state;
    if (!info) {
      return null;
    }

    const usedMemory = ordersUtil.handlUnit(info.used_memory);
    const memoryLimit = ordersUtil.handlUnit(info.memory_limit);
    if (
      memoryLimit - usedMemory <= 1 &&
      rainbondUtil.isEnableBillingFunction()
    ) {
      return (
        <div>
          {visible ? (
            <Alert
              style={{ marginBottom: "20px" }}
              message={
                <div>
                  当前使用调度内存容量（{usedMemory} GB）已经达到订购容量（
                  {memoryLimit} GB）的上限，为了不影响正常使用，请尽快前往
                  <Link to={`/enterprise/${eid}/orders/overviewService`}>
                    服务订购页
                  </Link>
                  扩容更大容量。
                </div>
              }
              type="info"
              closable
              afterClose={this.handleClose}
            />
          ) : null}
        </div>
      );
    }
    return null;
  }
}
