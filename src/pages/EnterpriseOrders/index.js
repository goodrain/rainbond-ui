import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Button, Table, Row, Col, notification, Card } from 'antd';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import { routerRedux } from 'dva/router';
import styles from './index.less';
import OrderManagement from './components/orderManagement';
import OrderDetails from './components/orderDetails';
import ServiceOverview from './components/serviceOverview';
import ServiceOverviewDetails from './components/serviceOverviewDetails';

@connect(({ user, list, global, index }) => ({
  user: user.currentUser,
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  overviewInfo: index.overviewInfo,
}))
export default class EnterpriseOrders extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }
  componentWillMount() {}
  componentDidMount() {}
  callback = key => {
    const {
      dispatch,
      match: {
        params: { eid },
      },
    } = this.props;
    dispatch(routerRedux.push(`/enterprise/${eid}/orders/${key}`));
  };
  render() {
    const {
      match: {
        params: { eid, orderType, orderId },
      },
    } = this.props;
    const tabList = [
      {
        key: 'overviewService',
        tab: '服务概览',
      },
      {
        key: 'serviceOverviewDetails',
        tab: '服务概览详情',
      },
      {
        key: 'orderManagement',
        tab: '订单管理',
      },
    ];
    return (
      <PageHeaderLayout
        title="服务订购"
        tabList={tabList}
        tabActiveKey={orderType}
        onTabChange={this.callback}
      >
        {orderType === 'overviewService' && <ServiceOverview eid={eid} />}
        {orderType === 'serviceOverviewDetails' && (
          <ServiceOverviewDetails eid={eid} />
        )}
        {orderType === 'orderManagement' ? (
          orderId ? (
            <OrderDetails eid={eid} orderId={orderId} />
          ) : (
            <OrderManagement eid={eid} />
          )
        ) : (
          ''
        )}
      </PageHeaderLayout>
    );
  }
}
