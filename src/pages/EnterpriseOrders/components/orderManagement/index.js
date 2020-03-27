import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Card, Button, Table, Tabs, Row, Col, notification, Badge } from 'antd';
import userUtil from '../../../../utils/user';
import PageHeaderLayout from '../../../../layouts/PageHeaderLayout';
import { routerRedux, Link } from 'dva/router';
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
        width: '20%',
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
        title: '订单周期',
        dataIndex: 'months',
        rowKey: 'months',
        align: 'center',
        width: '20%',
        render: months => {
          return <span>{months}</span>;
        },
      },
      {
        title: '购买容量(GB)',
        dataIndex: 'memory',
        rowKey: 'memory',
        align: 'center',
        width: '15%',
        render: (memory, val) => {
          return <span>{this.handlUnit(memory)}</span>;
        },
      },
      {
        title: '创建时间',
        dataIndex: 'create_time',
        rowKey: 'create_time',
        align: 'center',
        width: '15%',
        render: val => {
          return <span> {moment(val).format('YYYY-MM-DD hh:mm:ss')}</span>;
        },
      },
      {
        title: '总价',
        dataIndex: 'final_price',
        rowKey: 'final_price',
        align: 'center',
        width: '15%',
      },
      {
        title: '订单状态',
        dataIndex: 'status',
        rowKey: 'status',
        align: 'center',
        width: '15%',
        sorter: (a, b) => a.age - b.age,
        render: (val, data) => {
          switch (val) {
            case '0':
              return (
                <div style={colorbj('#1890ff', '#e6f7ff')}>
                  <Badge color="#1890ff" />
                  待支付
                </div>
              );
            case '1':
              return (
                <div style={colorbj('#52c41a', '#e9f8e2')}>
                  <Badge color="#52c41a" />
                  已支付
                </div>
              );
            case '2':
              return (
                <div style={colorbj('#b7b7b7', '#f5f5f5')}>
                  <Badge color="#b7b7b7" />
                  已关闭
                </div>
              );

            case '3':
              return (
                <div style={colorbj('#1890ff', '#e6f7ff')}>
                  <Badge color="#1890ff" />
                  待支付
                </div>
              );
            case '5':
              return (
                <div style={colorbj('#fff', '#f54545')}>
                  <Badge color="#fff" />
                  异常
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
