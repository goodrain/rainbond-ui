import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Link } from 'dva/router';
import { Row, Col, Card, Button } from 'antd';
import globalUtil from '../../utils/global';
import Echars from '../Echars';
import styles from './index.less';

@connect(
  ({ global }) => ({ groups: global.groups }),
  null,
  null,
  { withRef: true },
)
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      datalist: [],
    };
  }
  componentDidMount() {
    this.getRegionResource();
  }
  // 获取某个数据中心的资源详情
  getRegionResource() {
    this.props.dispatch({
      type: 'global/getRegionSource',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        enterprise_id: this.props.enterprise_id,
        region: '',
      },
      callback: (data) => {
        this.setState({ datalist: data.list }, () => {
          const datalist = this.state.datalist;
        });
      },
    });
  }

  render() {
    const datalist = this.state.datalist || [];
    return (
      <div className={styles.regionList}>
        <Row style={{ marginTop: 16, textAlign: 'center' }} className={styles.regionList}>
          {datalist.map((order) => {
            const hasDate = order.disk.expire_date || order.memory.expire_date;
            const normalColor = '#1890ff';
            const warningColor = '#f5222d';
            const blackColor = 'rgba(0,0,0,0.1)';
            return (
              <Col span={8} style={{ marginBottom: 16 }}>
                <Card>
                  <p style={{ color: hasDate ? normalColor : warningColor, marginBottom: 32 }}>
                    {!hasDate ? (
                      '未包月'
                    ) : (
                      <span>包月到期: {order.disk.expire_date || '无限期'}</span>
                    )}
                  </p>
                  <Row>
                    <Col span="4">
                      <h3>内存</h3>
                      <div id={`${order.name}-memory`} style={{ width: '100%', height: '160px' }}>
                        <Echars
                          style={{ height: 150, width: 150 }}
                          option={{
                            color: [
                              order.memory.used === 0 && order.memory.limit === 0
                                ? blackColor
                                : order.memory.used > order.memory.limit
                                  ? warningColor
                                  : normalColor,
                              blackColor,
                            ],
                            series: [
                              {
                                name: '内存使用量',
                                type: 'pie',
                                radius: ['75%', '85%'],
                                avoidLabelOverlap: false,
                                label: {
                                  normal: {
                                    show: true,
                                    position: 'center',
                                    formatter(argument) {
                                      var v = 0;
                                      if (order.memory.used === 0 && order.memory.limit === 0) {
                                        v = 0;
                                      } else {
                                        var v = (
                                          (order.memory.used /
                                            (order.memory.limit || order.memory.used)) *
                                          100
                                        ).toFixed(2);
                                      }
                                      let html;
                                      html = `已使用\r\n\r\n${v}%`;
                                      return html;
                                    },
                                    textStyle: {
                                      fontSize: 15,
                                      color: normalColor,
                                    },
                                  },
                                },
                                labelLine: {
                                  normal: {
                                    show: false,
                                  },
                                },
                                data: [
                                  { value: order.memory.used, name: '已使用' },
                                  { value: order.memory.stock, name: '未使用' },
                                ],
                              },
                            ],
                          }}
                        />
                      </div>
                    </Col>
                    <Col span="4">
                      <h3>磁盘</h3>
                      <div id={`${order.name}-disk`} style={{ width: '100%', height: '160px' }}>
                        <Echars
                          style={{ height: 150, width: 150 }}
                          option={{
                            color: [
                              order.disk.used === 0 && order.disk.limit === 0
                                ? blackColor
                                : order.disk.used > order.disk.limit
                                  ? warningColor
                                  : normalColor,
                              blackColor,
                            ],
                            series: [
                              {
                                name: '磁盘使用量',
                                type: 'pie',
                                radius: ['75%', '85%'],
                                avoidLabelOverlap: false,
                                label: {
                                  normal: {
                                    show: true,
                                    position: 'center',
                                    formatter(argument) {
                                      var v = 0;
                                      if (order.disk.used === 0 && order.disk.limit === 0) {
                                        v = 0;
                                      } else {
                                        var v = (
                                          (order.disk.used /
                                            (order.disk.limit || order.disk.used)) *
                                          100
                                        ).toFixed(2);
                                      }

                                      let html;
                                      html = `已使用\r\n\r\n${v}%`;
                                      return html;
                                    },
                                    textStyle: {
                                      fontSize: 15,
                                      color: normalColor,
                                    },
                                  },
                                },
                                labelLine: {
                                  normal: {
                                    show: false,
                                  },
                                },
                                data: [
                                  { value: order.disk.used, name: '已使用' },
                                  { value: order.disk.stock, name: '未使用' },
                                ],
                              },
                            ],
                          }}
                        />
                      </div>
                    </Col>
                  </Row>
                  <p style={{ paddingTop: 24 }}>
                    <Link
                      to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/resources/buy/${
                        order.name
                      }`}
                    >
                      <Button type="primary">{hasDate ? '修改包月' : '购买包月'}</Button>
                    </Link>
                  </p>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>
    );
  }
}
