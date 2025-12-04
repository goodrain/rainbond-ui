import React, { Component } from 'react';
import { connect } from 'dva';
import {
  Table,
  Card,
  Button,
  Row,
  Col,
  Form,
  Input,
  notification,
  Popconfirm,
  Tag
} from 'antd';
import { formatMessage } from '@/utils/intl';
import ServiceDrawer from '../../../components/ServiceDrawer';
import globalUtil from '../../../utils/global';
import styles from './index.less';

@Form.create()
@connect()

export default class index extends Component {
  constructor(props) {
    super(props);
    this.state = {
      serviceDrawer: this.props.open ? this.props.open : false,
      tableLoading: true,
      dataSource: [],
      editInfo: {},
      pageSize: 10,
      page: 1
    };
  }
  componentDidMount() {
    this.getTableData()
  }
  // 获取表格信息
  getTableData = () => {
    this.setState({ tableLoading: true })
    const { dispatch, nameSpace, appID } = this.props
    const teamName = globalUtil.getCurrTeamName()
    dispatch({
      type: 'gateWay/getApiGatewayService',
      payload: {
        teamName: teamName,
        appID: appID || ''
      },
      callback: res => {
        if (res && res.bean) {
          const arr = this.convertObjectToArray(res.bean)
          this.setState({
            dataSource: arr,
          })
        } else {
          this.setState({
            dataSource: [],
          })
        }
        this.setState({ tableLoading: false })

      },
      handleError: () => {
        this.setState({
          dataSource: [],
          tableLoading: false
        })
      }
    })
  }
  convertObjectToArray = (inputObject) => {
    const resultArray = [];
    for (const key in inputObject) {
      if (inputObject.hasOwnProperty(key)) {
        const element = inputObject[key];
        if (Object.keys(element).length > 0) {
          const newArrayElement = {
            name: key,
            ...element
          };
          resultArray.push(newArrayElement);
        }
      }
    }

    return resultArray;
  }
  // 弹出抽屉
  routeDrawerShow = (val) => {
    this.setState({
      serviceDrawer: !this.state.serviceDrawer,
      editInfo: val
    });
  }
  // 新增或修改表格信息
  handleAddOrEditInfo = (data) => {
    const { dispatch, appID } = this.props
    const teamName = globalUtil.getCurrTeamName()
    dispatch({
      type: 'gateWay/handleApiGatewayService',
      payload: {
        teamName: teamName,
        appID: appID || '',
        name: data.name,
        values: data.values
      },
      callback: res => {
        if (res) {
          this.setState({
            serviceDrawer: false
          }, () => {
            notification.success({
              message: formatMessage({ id: 'notification.success.succeeded' }),
            });
          })
          this.getTableData()
        }
      },
      handleError: (err) => {
        notification.error({
          message: formatMessage({ id: 'componentOverview.body.safety.SafetyCodeScan.Controlserror' }),
        });
      }
    })
  }
  // 删除表格信息
  handleDelete = (data) => {
    const { dispatch, appID } = this.props
    const teamName = globalUtil.getCurrTeamName()
    dispatch({
      type: 'gateWay/deleteApiGatewayService',
      payload: {
        teamName: teamName,
        appID: appID || '',
        name: data.name
      },
      callback: res => {
        if (res) {
          notification.success({
            message: formatMessage({ id: 'notification.success.succeeded' }),
          });
          this.getTableData()
        }
      },
      handleError: (err) => {
        notification.error({
          message: formatMessage({ id: 'componentOverview.body.safety.SafetyCodeScan.Controlserror' }),
        });
      }
    })

  }
  onPageChange = (page_num, page_size) => {
    this.setState({
        page: page_num,
        pageSize: page_size
    })
}
  render() {
    const {
      serviceDrawer,
      dataSource,
      editInfo,
      tableLoading,
      pageSize,
      page
    } = this.state;
    const {
      appID,
      permission: {
        isCreate,
        isDelete,
        isEdit
      }
    } = this.props;
    const { getFieldDecorator } = this.props.form;
    const columns = [
      {
        title: formatMessage({ id: 'teamNewGateway.NewGateway.GatewayRoute.name' }),
        dataIndex: 'name',
        key: 'name',
        align: 'center',
      },
      {
        title: formatMessage({ id: 'teamNewGateway.NewGateway.GatewayService.address' }),
        dataIndex: 'address',
        key: 'address',
        align: 'center',
        render: (text, record) => (
          <span>
            {record.externalNodes.map((item, index) => {
              return (
                <Row style={{ marginBottom: 4 }}>
                  <Tag key={index} color="blue">
                    {item.name}:{item.port}
                  </Tag>
                </Row>
              )
            }
            )}
          </span>
        )
      },
      {
        title: formatMessage({ id: 'teamNewGateway.NewGateway.GatewayRoute.handle' }),
        dataIndex: 'handle',
        key: 'handle',
        align: 'center',
        render: (text, record) => (
          <span>
            {isEdit &&
              <a onClick={() => this.routeDrawerShow(record)}>
                {formatMessage({ id: 'teamGateway.certificate.table.edit' })}
              </a>
            }
            {isDelete &&
              <Popconfirm
                title={formatMessage({ id: 'teamGateway.strategy.table.type.detele' })}
                onConfirm={() => {
                  this.handleDelete(record);
                }}
              >
                <a>{formatMessage({ id: 'teamGateway.certificate.table.delete' })}</a>
              </Popconfirm>
            }
          </span>
        ),
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
    return (
      <div>
        <Card
          extra={isCreate && <Button icon="plus" type="primary" onClick={() => this.routeDrawerShow({})}>{formatMessage({ id: 'teamNewGateway.NewGateway.ServiceDrawer.creat' })}</Button>}
          bodyStyle={{ padding: '0' }}
        >
          <Table
            dataSource={dataSource}
            columns={columns}
            loading={tableLoading}
            pagination={{
              current: page,
              pageSize: pageSize,
              total: dataSource.length ,
              onChange: this.onPageChange,
              showQuickJumper: true,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
              onShowSizeChange: this.onPageChange,
              hideOnSinglePage: dataSource.length<=10
          }}
          />
        </Card>
        {serviceDrawer &&
          <ServiceDrawer
            visible={serviceDrawer}
            appID={appID}
            editInfo={editInfo}
            onOk={this.handleAddOrEditInfo}
            onClose={this.routeDrawerShow}
          />}
      </div>
    )
  }
}
