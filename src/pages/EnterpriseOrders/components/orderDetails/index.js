import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import {
  Card,
  Button,
  Table,
  Tabs,
  Row,
  Col,
  notification,
  Badge,
  Alert,
  Typography,
} from 'antd';
import styles from '../../index.less';
import ordersUtil from '../../../../utils/orders';
import moment from 'moment';

const { Paragraph } = Typography;

@connect()
export default class OrderDetails extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      info: null,
      dtailsLoading: true,
      bankLoading: true,
      visible: true,
      bankInfo: null,
    };
  }

  componentWillMount() {
    this.fetchEnterpriseOrderDetails();
    this.fetchBankInfo();
  }

  fetchEnterpriseOrderDetails = () => {
    const { dispatch, eid, orderId } = this.props;
    dispatch({
      type: 'order/fetchEnterpriseOrderDetails',
      payload: {
        enterprise_id: eid,
        order_id: orderId,
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            dtailsLoading: false,
            info: res.bean,
          });
        }
      },
      handleError: res => {
        if (res && res.data && res.data.code === 6004) {
          notification.warning({ message: '订单不存在' });
          this.jump();
        }
      },
    });
  };
  jump = () => {
    const { dispatch, eid } = this.props;
    dispatch(routerRedux.push(`/enterprise/${eid}/orders/orderManagement`));
  };
  fetchBankInfo = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'order/fetchBankInfo',
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            bankLoading: false,
            bankInfo: res.bean,
          });
        }
      },
    });
  };

  handlUnit = num => {
    if (num) {
      let nums = num;
      if (nums >= 1024) {
        nums = num / 1024;
        return nums.toFixed(2) / 1;
      }
      return num;
    }
  };
  handleClose = () => {
    this.setState({ visible: false });
  };
  handleStateText = state => {
    const map = {
      ToBePaid: '待支付:',
      Paid: '已支付:',
      Closed: '已关闭:',
    };
    return map[state] || '';
  };

  render() {
    const { info, bankInfo, dtailsLoading, bankLoading } = this.state;
    const isPaid = info && info.status && info.status === 'Paid';
    const isToBePaid = info && info.status && info.status === 'ToBePaid';
    const arr = info && [
      { name: '订单编号', value: info.order_id },
      {
        name: '创建时间',
        value: `${moment.utc(info.create_time).format('YYYY-MM-DD HH:mm:ss')}`,
      },
      {
        name: '服务周期',
        value: `
        ${info.final_price === 0 ? '不限制' : `${info.months}月`}`,
      },
      {
        name: '生效时间',
        value: `
        ${
          info.final_price === 0
            ? '不限制'
            : isPaid
            ? `${moment.utc(info.effect_time).format('YYYY-MM-DD')}`
            : '未生效'
        }`,
      },
      {
        name: '结束时间',
        value: `${
          info.final_price === 0
            ? '不限制'
            : isPaid
            ? `${moment.utc(info.expired_time).format('YYYY-MM-DD')}`
            : '未生效'
        }`,
      },

      { name: '购买容量', value: `${ordersUtil.handlUnit(info.memory)}GB调度内存` },
      {
        name: '总费用',
        value: `¥ ${info.final_price} ${
          info.origin_price ? `已优惠${info.origin_price}` : ''
        }`,
      },
    ];

    return (
      <Card>
        <div>订单详情</div>
        <Card
          loading={dtailsLoading || bankLoading}
          style={{ margin: '42px 0', background: '#f3f5f9' }}
        >
          <Row style={{ display: 'flex', alignItems: 'center' }}>
            <Col
              span={isToBePaid ? 11 : 24}
              style={{ height: isToBePaid && '246px' }}
            >
              {arr &&
                arr.map((item, index) => {
                  const { name, value } = item;
                  return (
                    <Col
                      span={isToBePaid ? 24 : 12}
                      style={{ marginBottom: '14px' }}
                    >
                      <Col span={4} className={styles.ordelText}>
                        {name}
                      </Col>
                      <Col span={20} className={styles.orderText}>
                        {index === 0 ? (
                          <Paragraph
                            style={{ marginBottom: '0px' }}
                            copyable={{ text: value }}
                          >
                            {value}
                          </Paragraph>
                        ) : (
                          value
                        )}
                      </Col>
                    </Col>
                  );
                })}
              {!isToBePaid && (
                <Col span={12} offset={12}>
                  <Col span={4} />
                  <Col span={20} className={styles.orderText}>
                    <Button type="primary" onClick={this.jump}>
                      返回
                    </Button>
                  </Col>
                </Col>
              )}
            </Col>
            {isToBePaid && (
              <Col span={2}>
                <div className={styles.segmentation} />
              </Col>
            )}

            {isToBePaid && (
              <Col span={11} style={{ height: '246px' }}>
                {bankInfo && (
                  <Row>
                    <Col span={12} className={styles.orderTitleL}>
                      <div>{this.handleStateText(info && info.status)}</div>
                      <div>¥&nbsp;{info && info.final_price}</div>
                    </Col>
                    <Col span={12} className={styles.orderTitleR}>
                      <p>请通过对公付款到以下账号：</p>
                      <p>
                        <span>开户行：</span>
                        <Paragraph
                          style={{ marginBottom: '0px' }}
                          copyable={{ text: bankInfo.bank }}
                        >
                          {bankInfo.bank}
                        </Paragraph>
                      </p>
                      <p>
                        <span>账号名：</span>
                        <Paragraph
                          style={{ marginBottom: '0px' }}
                          copyable={{ text: bankInfo.account_name }}
                        >
                          {bankInfo.account_name}
                        </Paragraph>
                      </p>
                      <p>
                        <span>账&nbsp;&nbsp;&nbsp;号：</span>
                        <Paragraph
                          style={{ marginBottom: '0px' }}
                          copyable={{ text: bankInfo.account }}
                        >
                          {bankInfo.account}
                        </Paragraph>
                      </p>
                    </Col>
                  </Row>
                )}
                {this.state.visible ? (
                  <Alert
                    style={{ marginBottom: '20px' }}
                    message="请在对公转账银行订单中附加订单号作为备注信息"
                    type="info"
                    showIcon
                    closable
                    afterClose={this.handleClose}
                  />
                ) : null}
                <Button type="primary" onClick={this.jump}>
                  {info && info.status === 'ToBePaid' ? '完成支付' : '返回'}
                </Button>
              </Col>
            )}
          </Row>
        </Card>
      </Card>
    );
  }
}
