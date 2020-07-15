import { Button, Card, Col, Row } from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import moment from 'moment';
import React, { PureComponent } from 'react';
import Phoneimg from '../../../../../public/images/phone.png';
import weChatimg from '../../../../../public/images/weChat.jpeg';
import ordersUtil from '../../../../utils/orders';
import styles from '../../index.less';

@connect(({ order }) => ({
  enterpriseServiceInfo: order.enterpriseServiceInfo,
}))
export default class ServiceOverview extends PureComponent {
  constructor(props) {
    super(props);
    this.state = { loading: true };
  }

  componentWillMount() {
    // this.fetchEnterpriseService();
  }
  handlRefresh = () => {
    const { dispatch, eid } = this.props;
    dispatch({
      type: 'order/fetchEnterpriseServiceRefresh',
      payload: {
        enterprise_id: eid,
      },
      callback: res => {
        if (res && res._code === 200) {
          this.fetchEnterpriseService();
        }
      },
    });
  };
  fetchEnterpriseService = () => {
    const { dispatch, eid } = this.props;
    dispatch({
      type: 'order/fetchEnterpriseService',
      payload: {
        enterprise_id: eid,
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            loading: false,
          });
        }
      },
    });
  };

  render() {
    const { loading } = this.state;
    const { eid, enterpriseServiceInfo } = this.props;
    const free = enterpriseServiceInfo && enterpriseServiceInfo.type === 'free';
    const version = free ? '免费版' : '付费版';
    const versionName = 'RAINBOND CLOUD';
    const service = free ? '免费服务' : '付费服务';
    return (
      <div>
        <Card
          bordered={false}
          loading={!enterpriseServiceInfo}
          style={{ marginBottom: '45px' }}
          bodyStyle={{ padding: !loading && '0' }}
        >
          {enterpriseServiceInfo && (
            <Row>
              <Col span={7} className={styles.boxs}>
                <p>{versionName}</p>
                <p> {version} </p>
                {!free ? (
                  <p>
                    {moment(enterpriseServiceInfo.expired_time).format(
                      'YYYY-MM-DD'
                    )}
                    到期
                  </p>
                ) : (
                  <p />
                )}
              </Col>
              <Col span={8}>
                <Row>
                  <Col span={12} className={styles.unit}>
                    <div>
                      <p>当前使用调度内存(GB)</p>
                      <div
                        style={{
                          display: 'flex',
                          border: 'none',
                          alignItems: 'baseline',
                        }}
                      >
                        <h6>
                          {ordersUtil.handlUnit(
                            enterpriseServiceInfo.used_memory
                          ) || 0}
                        </h6>
                        <a
                          style={{
                            marginLeft:'5px',
                            fontSize: '12px',
                          }}
                          onClick={this.handlRefresh}
                        >
                          刷新
                        </a>
                      </div>
                    </div>
                    <Button style={{ marginTop: '50px' }} type="primary">
                      <Link
                        to={`/enterprise/${eid}/orders/overviewService/details`}
                      >
                        {free ? '订购' : '扩容续费'}
                      </Link>
                    </Button>
                  </Col>
                  <Col span={12} className={styles.unit}>
                    <div>
                      <p>调度内存上限(GB)</p>
                      <h6>
                        {ordersUtil.handlUnit(
                          enterpriseServiceInfo.memory_limit
                        )}
                      </h6>
                    </div>
                  </Col>
                </Row>
              </Col>
              <Col span={9} className={styles.unit}>
                <p>你正在使用</p>
                <h5>
                  {versionName}
                  &nbsp;
                  {service}
                </h5>
              </Col>
            </Row>
          )}
        </Card>
        {!free && (
          <Card bordered={false} loading={loading}>
            <Row>
              <Col span={12} className={styles.imgbox}>
                <img src={Phoneimg} alt="" />
                <div>
                  <p>专属客服电话</p>
                  <p>18701654470</p>
                </div>
              </Col>
              <Col span={12} className={styles.imgbox}>
                <img src={weChatimg} alt="" />
                <div>
                  <p>专属客服微信</p>
                  <p>wechat</p>
                </div>
              </Col>
            </Row>
          </Card>
        )}
      </div>
    );
  }
}
