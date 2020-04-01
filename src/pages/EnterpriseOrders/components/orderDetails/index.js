import React, { PureComponent } from 'react';
import { connect, routerRedux } from 'dva';
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

const { Paragraph } = Typography;

@connect()
export default class OrderDetails extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      info: null,
      loading: true,
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
            loading: false,
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
    const { dispatch } = this.props;
    dispatch(routerRedux.push(`/enterprise/${eid}/orders/orderManagement`));
  };
  fetchBankInfo = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'order/fetchBankInfo',
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            loading: false,
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
  render() {
    const { info, bankInfo } = this.state;

    const arr = info && [
      { name: '订单号', value: info.order_id },
      {
        name: '服务周期',
        value: `${info.months}月`,
      },
      { name: '容量', value: `${this.handlUnit(info.memory)}GB调度内存` },
      { name: '总费用', value: `¥ ${info.final_price} ` },
    ];
    return (
      <Card>
        <div>订单详情</div>
        <Card style={{ marginTop: '42px', background: '#f3f5f9' }}>
          <Row style={{ display: 'flex', alignItems: 'center' }}>
            <Col span={11}>
              {arr &&
                arr.map((item, index) => {
                  const { name, value } = item;
                  return (
                    <Row style={{ marginBottom: '20px' }}>
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
                    </Row>
                  );
                })}
            </Col>
            <Col span={2}>
              <div className={styles.segmentation} />
            </Col>

            <Col span={11}>
              {bankInfo && (
                <Row>
                  <Col span={8} className={styles.orderTitleL}>
                    <div>待支付：</div>
                    <div>¥&nbsp;{info && info.final_price}</div>
                  </Col>
                  <Col span={16} className={styles.orderTitleR}>
                    <p>请通过对公付款到以下账号：</p>
                    <p>
                      <span>开户行：</span>
                      <Paragraph
                        style={{ marginBottom: '0px' }}
                        copyable={{ text: bankInfo.bank }}
                      >
                        bankInfo.bank
                      </Paragraph>
                    </p>
                    <p>
                      <span>账&nbsp;&nbsp;&nbsp;号：</span>
                      <Paragraph
                        style={{ marginBottom: '0px' }}
                        copyable={{ text: bankInfo.account }}
                      >
                        bankInfo.account
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
                完成支付
              </Button>
            </Col>
          </Row>
        </Card>
      </Card>
    );
  }
}
