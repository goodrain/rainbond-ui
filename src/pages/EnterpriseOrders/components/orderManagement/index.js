import { Badge, Card, Col, Form, Row, Select, Table } from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import moment from 'moment';
import React, { PureComponent } from 'react';
import ordersUtil from '../../../../utils/orders';

const { Option } = Select;
const FormItem = Form.Item;

@connect(({ user, list, loading, global, index }) => ({
  user: user.currentUser,
  list,
  loading: loading.models.list,
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  isRegist: global.isRegist,
  oauthLongin: loading.effects['global/creatOauth'],
  overviewInfo: index.overviewInfo
}))
export default class EnterpriseClusters extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      page: 1,
      page_size: 10,
      orderList: [],
      total: 0,
      loading: true,
      tabLoading: true,
      query: ''
    };
  }

  componentWillMount() {
    this.fetchEnterpriseOrderList();
  }

  handelChange = value => {
    this.setState({ query: value }, () => {
      this.handleSearch();
    });
  };
  handleSearch = () => {
    this.setState(
      {
        page: 1
      },
      () => {
        this.fetchEnterpriseOrderList();
      }
    );
  };

  onPageChange = page => {
    this.setState({ page, tabLoading: true }, () => {
      this.fetchEnterpriseOrderList();
    });
  };

  fetchEnterpriseOrderList = () => {
    this.setState({ tabLoading: true });
    const { dispatch, eid } = this.props;
    const { page, page_size, query } = this.state;
    dispatch({
      type: 'order/fetchEnterpriseOrderList',
      payload: {
        query,
        page,
        page_size,
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            loading: false,
            tabLoading: false,
            orderList: res.list,
            total: res.total || 0
          });
        }
      }
    });
  };

  render() {
    const { eid } = this.props;
    const {
      orderList,
      loading,
      tabLoading,
      page,
      page_size,
      total
    } = this.state;
    const colorbj = (color, bg) => {
      return {
        margin: '0 auto',
        width: '100px',
        color,
        background: bg,
        borderRadius: '15px',
        padding: '2px 0'
      };
    };
    const columns = [
      {
        title: '订单编号',
        dataIndex: 'order_id',
        rowKey: 'order_id',
        align: 'center',
        width: '220px',
        render: val => {
          return (
            <Link
              to={`/enterprise/${eid}/orders/orderManagement/orderDetails/${val}`}
              style={{
                wordBreak: 'break-all',
                wordWrap: 'break-word',
                color: '#1890ff'
              }}
            >
              {val}
            </Link>
          );
        }
      },

      {
        title: '创建时间',
        dataIndex: 'create_time',
        rowKey: 'create_time',
        align: 'center',
        width: '190px',
        render: val => {
          return (
            <span>
              {' '}
              {moment(val)
                .locale('zh-cn')
                .format('YYYY-MM-DD HH:mm:ss')}
            </span>
          );
        }
      },
      {
        title: '服务周期',
        dataIndex: 'months',
        rowKey: 'months',
        align: 'center',
        width: '130px',
        render: (months, val) => {
          return (
            <div>
              {val.final_price === 0 ? '不限制' : <div>{months}月</div>}
            </div>
          );
        }
      },
      {
        title: '生效时间',
        dataIndex: 'effect_time',
        rowKey: 'effect_time',
        width: '130px',
        align: 'center',
        render: (effect_time, val) => {
          return (
            <div>
              {val.final_price === 0 ? (
                '不限制'
              ) : val.status === 'Paid' ? (
                <div>
                  {moment(effect_time)
                    .locale('zh-cn')
                    .format('YYYY-MM-DD')}
                </div>
              ) : (
                <div>未生效</div>
              )}
            </div>
          );
        }
      },
      {
        title: '结束时间',
        dataIndex: 'expired_time',
        rowKey: 'expired_time',
        align: 'center',
        width: '130px',
        render: (expired_time, val) => {
          return (
            <div>
              {val.final_price === 0 ? (
                '不限制'
              ) : val.status === 'Paid' ? (
                <div>
                  {moment(expired_time)
                    .locale('zh-cn')
                    .format('YYYY-MM-DD')}
                </div>
              ) : (
                <div>未生效</div>
              )}
            </div>
          );
        }
      },
      {
        title: '购买容量(GB)',
        dataIndex: 'memory',
        rowKey: 'memory',
        align: 'center',
        width: '130px',
        render: memory => {
          return <span>{ordersUtil.handlUnit(memory)}</span>;
        }
      },
      {
        title: '总价',
        dataIndex: 'final_price',
        rowKey: 'final_price',
        align: 'center',
        width: '220px',
        render: (final_price, data) => {
          return (
            <div>
              ¥{final_price.toFixed(2) / 1}
              {final_price !== 0 &&
                data.original_price &&
                data.original_price !== final_price && (
                  <s
                    style={{
                      color: '#b7bcc7',
                      fontSize: '12px',
                      marginLeft: '5px'
                    }}
                  >
                    ( 已优惠¥
                    {(data.original_price - final_price).toFixed(2) / 1} )
                  </s>
                )}
            </div>
          );
        }
      },
      {
        title: '订单状态',
        dataIndex: 'status',
        rowKey: 'status',
        align: 'center',
        width: '110px',
        render: val => {
          switch (val) {
            case 'ToBePaid':
              return (
                <div style={colorbj('#1890ff', '#e6f7ff')}>
                  <Badge color="#1890ff" />
                  待支付
                </div>
              );
            case 'Paid':
              return (
                <div style={colorbj('#52c41a', '#e9f8e2')}>
                  <Badge color="#52c41a" />
                  已支付
                </div>
              );
            case 'Closed':
              return (
                <div style={colorbj('#b7b7b7', '#f5f5f5')}>
                  <Badge color="#b7b7b7" />
                  已关闭
                </div>
              );
            default:
              return (
                <div style={colorbj('#fff', '#ffac38')}>
                  <Badge color="#fff" />
                  未知
                </div>
              );
          }
        }
      }
    ];

    return (
      <Card loading={loading}>
        <Row
          style={{
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Col span={24}>
            <Form layout="inline" style={{ display: 'inline-block' }}>
              <FormItem>
                <Select
                  getPopupContainer={triggerNode => triggerNode.parentNode}
                  defaultValue=""
                  style={{ width: 120 }}
                  onChange={this.handelChange}
                >
                  <Option value="">全部状态</Option>
                  <Option value="ToBePaid">待支付</Option>
                  <Option value="Paid">已支付</Option>
                  <Option value="Closed">已关闭</Option>
                </Select>
              </FormItem>
            </Form>
          </Col>
        </Row>
        <Table
          loading={tabLoading}
          rowKey={(record,index) => index}
          pagination={{
            current: page,
            pageSize: page_size,
            total,
            onChange: this.onPageChange
          }}
          dataSource={orderList}
          columns={columns}
        />
      </Card>
    );
  }
}
