import React, { Component } from 'react'
import { Table, Card, Button, Row, Col, Form, Input } from 'antd';
import ServiceDrawer from '../../../components/ServiceDrawer';
import styles from './index.less';

@Form.create()

export default class index extends Component {
  constructor(props) {
    super(props);
    this.state = {
      serviceDrawer: false,
    };
  }
  componentDidMount() {
  }
  // 获取表格信息
  getTableData = () => {
  }
  // 查询表格信息
  handleSearch = () => {
  }
  // 修改表格信息
  routeDrawerShow = () => {
    this.setState({
      serviceDrawer: !this.state.serviceDrawer,
    });
  }
  // 删除表格信息
  handleDelete = () => {
  }
  // 启用某项配置
  handleEnable = () => {
  }

  render() {
    const { getFieldDecorator } = this.props.form;
    const columns = [
      {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
        align: 'center',
      },
      {
        title: '类型',
        dataIndex: 'type',
        key: 'type',
        align: 'center',
      },
      {
        title: '更新时间',
        dataIndex: 'updataTime',
        key: 'updataTime',
        align: 'center',
      },
      {
        title: '操作',
        dataIndex: 'address',
        key: 'address',
        align: 'center',
        render: (text, record) => (
          <span>
            <a onClick={() => this.handleEnable(record)}>启用</a>
            <a onClick={() => this.routeDrawerShow(record)}>编辑</a>
            <a onClick={() => this.handleDelete(record)}>删除</a>
          </span>
        ),
      },
    ];
    const dataSource = [
      {
        key: '1',
        name: 'api接口1',
        type: '已启用',
        updataTime: '2020-01-01 00:00:00',
      },
      {
        key: '2',
        name: 'api接口2',
        type: '已启用',
        updataTime: '2020-01-01 00:00:00',
      },
      {
        key: '3',
        name: 'api接口3',
        type: '已启用',
        updataTime: '2020-01-01 00:00:00',
      },
      {
        key: '4',
        name: 'api接口4',
        type: '已启用',
        updataTime: '2020-01-01 00:00:00',
      },

    ];
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 5 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 12 },
      },
    };
    const { serviceDrawer } = this.state;
    const { appID } = this.props;
    return (
      <div>
        <Card
          extra={<Button icon="form" type="primary" onClick={this.routeDrawerShow}>创建目标服务</Button>}
          bodyStyle={{ padding: '0' }} s
        >
          <Table dataSource={dataSource} columns={columns} />
        </Card>
        {serviceDrawer && <ServiceDrawer visible={serviceDrawer} onClose={this.routeDrawerShow} appID={appID} />}
      </div>
    )
  }
}
