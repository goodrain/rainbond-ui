import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Button, Row, Col, Card, Slider, Alert } from 'antd';
import styles from '../../index.less';
import Phoneimg from '../../../../../public/images/phone.png';
import weChatimg from '../../../../../public/images/weChat.png';

@connect(({ user, list, loading, global, index }) => ({
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  overviewInfo: index.overviewInfo,
}))
export default class ServiceOverview extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      visible: true,
    };
  }
  componentWillMount() {}
  componentDidMount() {}
  handleClose = () => {
    this.setState({ visible: false });
  };
  render() {
    return (
      <div className={styles.serviceBox}>
        <Card
          bordered={false}
          style={{ marginBottom: '30px', background: '#f3f5f9' }}
          bodyStyle={{ padding: '35px 55px 10px 72px' }}
        >
          <Row className={styles.serviceDetailsBox}>
            <div className={styles.serviceDetailsL}>
              <h6>RAINBOND ONLINE 付费版</h6>
              <ul>
                <li>接入集群数量无限制</li>
                <li>团队、用户数量无限制</li>
                <li>共享库应用模版数量，版本数量无限制</li>
                <li>SLA保证、7x24小时在线服务</li>
              </ul>
              <a href="">查看更多付费版特权</a>
            </div>
            <div className={styles.serviceDetailsR}>
              <div>
                <span>¥49 </span>
                <span>/GB/月</span>
              </div>
              <div>按照平台调度的应用内存总数计费</div>
            </div>
          </Row>
        </Card>
        <div className={styles.capacityBox}>
          <span>容量选择</span>
          <span>（购买后可叠加订单扩大容量）</span>
        </div>
        {this.state.visible ? (
          <Alert
            style={{ marginBottom: '20px' }}
            message="最小购买量应该大于当前资源使用量，当前使用 30 GB"
            type="info"
            showIcon
            closable
            afterClose={this.handleClose}
          />
        ) : null}
        <Slider defaultValue={30} />

        <div className={styles.capacityBox}>
          <span>时长选择</span>
        </div>

        <Row style={{marginBottom:"30px"}}>
          <Col span={8}>
            <div className={styles.orders}>
              <div>
                <span>1</span>
                <span>年</span>
              </div>
              <div>
                <div>
                  <span>¥1470</span>
                  <s>¥ 1470</s>
                </div>
                <div>立享7.5优惠</div>
              </div>
              <div className={styles.tagVertical}>
                荐
              </div>
            </div>
          </Col>
          <Col span={8} />
          <Col span={8} />
        </Row>
        <Card
          className={styles.amount}
          bodyStyle={{ padding: '20px 0 15px 24px' }}
        >
          <div>
            <span>应付总额：</span>
            <span>¥ 4,310</span>
          </div>
          <div>总共可管理 30 GB 调度内存的应用到 2020 年 06 月 02 日</div>
        </Card>
        <Button type="primary"> 提交订单</Button>
      </div>
    );
  }
}
