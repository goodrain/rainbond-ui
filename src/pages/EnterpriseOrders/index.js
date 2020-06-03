/* eslint-disable prettier/prettier */
import React, { PureComponent } from "react";
import { connect } from "dva";
import { routerRedux } from "dva/router";
import PageHeaderLayout from "../../layouts/PageHeaderLayout";
import OrderManagement from "./components/orderManagement";
import OrderDetails from "./components/orderDetails";
import ServiceOverview from "./components/serviceOverview";
import ServiceOverviewDetails from "./components/serviceOverviewDetails";
import Exception from '../Exception/404';
import rainbondUtil from '../../utils/rainbond';


@connect(({ user, global, index }) => ({
  user: user.currentUser,
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  overviewInfo: index.overviewInfo
}))
export default class EnterpriseOrders extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }
  callback = key => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch(routerRedux.push(`/enterprise/${eid}/orders/${key}`));
  };
  render() {
    const {
      match: {
        params: { eid, orderType, orderId }
      }
    } = this.props;
    const EnterpriseServiceOverview =
      window.location.href.indexOf("overviewService/details") > -1;
    const tabList = [
      {
        key: "overviewService",
        tab: "服务概览"
      },
      {
        key: "orderManagement",
        tab: "订单管理"
      }
    ];
    if(!rainbondUtil.isEnableBillingFunction()){
      return <Exception />
    }
    return (
      <PageHeaderLayout
        title="服务订购"
        tabList={tabList}
        tabActiveKey={orderType}
        onTabChange={this.callback}
      >
        {orderType === "overviewService" &&
          (EnterpriseServiceOverview ? (
            <ServiceOverviewDetails eid={eid} />
          ) : (
            <ServiceOverview eid={eid} />
          ))}
        {orderType === "orderManagement" &&
          (orderId ? (
            <OrderDetails eid={eid} orderId={orderId} />
          ) : (
            <OrderManagement eid={eid} />
          ))}
      </PageHeaderLayout>
    );
  }
}
