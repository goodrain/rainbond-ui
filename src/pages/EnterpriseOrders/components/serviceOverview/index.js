import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Button, Row, Col, Card } from 'antd';
import styles from '../../index.less';
import Phoneimg from '../../../../../public/images/phone.png';
import weChatimg from '../../../../../public/images/weChat.png';
import moment from 'moment';

@connect(({ user, list, loading, global, index }) => ({
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  overviewInfo: index.overviewInfo,
}))
export default class ServiceOverview extends PureComponent {
  constructor(props) {
    super(props);
    this.state = { info: null, loading: true };
  }
  componentWillMount() {
    this.fetchEnterpriseService();
  }

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
            info: res.bean,
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

  render() {
    const { info, loading } = this.state;
    const free = info && info.type === 'free';
    const version = free ? '免费版' : '付费版';
    const versionName = free ? 'RAINBOND ONLINE' : 'RAINBOND CLOUD';
    const service = free ? '免费服务' : '付费服务';
    return (
      <div>
        <Card
          bordered={false}
          loading={loading}
          style={{ marginBottom: '45px' }}
          bodyStyle={{ padding: !loading && '0' }}
        >
          {info && (
            <Row>
              <Col span={7} className={styles.boxs}>
                <p>{versionName}</p>
                <p> {version} </p>
                {!free ? (
                  <p>
                    {moment(info.expired_time).format('YYYY-MM-DD hh:mm:ss')}
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
                      <h6>{this.handlUnit(info.used_memory)}</h6>
                    </div>
                    <Button style={{ marginTop: '50px' }} type="primary">
                      {free ? '订购' : '扩容续费'}
                    </Button>
                  </Col>
                  <Col span={12} className={styles.unit}>
                    <div>
                      <p>调度内存上限(GB)</p>
                      <h6>{this.handlUnit(info.memory_limit)}</h6>
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
                  <p>13132075355</p>
                </div>
              </Col>
              <Col span={12} className={styles.imgbox}>
                <img src={weChatimg} alt="" />
                <div>
                  <p>专属客服微信</p>
                  <p>weichart</p>
                </div>
              </Col>
            </Row>
          </Card>
        )}
      </div>
    );
  }
}
