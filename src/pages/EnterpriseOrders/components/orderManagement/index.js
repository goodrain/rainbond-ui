import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Card, Table, Badge } from 'antd';
import { Link } from 'dva/router';
import ordersUtil from '../../../../utils/orders';
import moment from 'moment';

@connect(({ user, list, loading, global, index }) => ({
  user: user.currentUser,
  list,
  loading: loading.models.list,
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  isRegist: global.isRegist,
  oauthLongin: loading.effects['global/creatOauth'],
  overviewInfo: index.overviewInfo,
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
    };
  }

  componentWillMount() {
    this.fetchEnterpriseOrderList();
  }

  fetchEnterpriseOrderList = () => {
    const { dispatch, eid } = this.props;
    dispatch({
      type: 'order/fetchEnterpriseOrderList',
      payload: {
        enterprise_id: eid,
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            loading: false,
            orderList: res.list,
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
    const { eid } = this.props;
    const { orderList, loading } = this.state;
    const colorbj = (color, bg) => {
      return {
        margin: '0 auto',
        width: '100px',
        color,
        background: bg,
        borderRadius: '15px',
        padding: '2px 0',
      };
    };
    const columns = [
      {
        title: '订单号',
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
                color: '#1890ff',
              }}
            >
              {val}
            </Link>
          );
        },
      },
      {
        title: '购买容量(GB)',
        dataIndex: 'memory',
        rowKey: 'memory',
        align: 'center',
        width: '110px',
        render: memory => {
          return <span>{ordersUtil.handlUnit(memory)}</span>;
        },
      },
      {
        title: '创建时间',
        dataIndex: 'create_time',
        rowKey: 'create_time',
        align: 'center',
        width: '130px',

        render: val => {
          return <span> {moment(val).format('YYYY-MM-DD')}</span>;
        },
      },
      {
        title: '服务周期',
        dataIndex: 'effect_time',
        rowKey: 'effect_time',
        align: 'center',
        render: (effect_time, val) => {
          return (
            <div>
              {val.final_price === 0 ? (
                '不限制'
              ) : val.status === 'Paid' ? (
                <div>
                  {moment(effect_time).format('YYYY-MM-DD')}
                  &nbsp;到&nbsp;
                  {moment(val.expired_time).format('YYYY-MM-DD')}
                  &nbsp;(
                  {val.months}
                  月)
                </div>
              ) : (
                <div>未生效</div>
              )}
            </div>
          );
        },
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
                <div>{moment(expired_time).format('YYYY-MM-DD')}</div>
              ) : (
                <div>未生效</div>
              )}
            </div>
          );
        },
      },

      {
        title: '总价',
        dataIndex: 'final_price',
        rowKey: 'final_price',
        align: 'center',
        width: '150px',
        render: final_price => {
          return <div>¥{final_price}</div>;
        },
      },
      {
        title: '订单状态',
        dataIndex: 'status',
        rowKey: 'status',
        align: 'center',
        width: '110px',
        filters: [
          {
            text: '待支付',
            value: 'ToBePaid',
          },
          {
            text: '已支付',
            value: 'Paid',
          },
          {
            text: '已关闭',
            value: 'Closed',
          },
        ],
        filterMultiple: false,
        onFilter: (value, record) => record.status.indexOf(value) === 0,
        sortDirections: ['descend', 'ascend'],
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
        },
      },
    ];

    return (
      <Card loading={loading}>
        <Table size="middle" dataSource={orderList} columns={columns} />
      </Card>
    );
  }
}
