/* eslint-disable import/extensions */
import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import { Card, Table, Button, Row, notification, Alert, Col } from 'antd';
import ScrollerX from '@/components/ScrollerX';
import AddCustomMonitor from '@/components/AddCustomMonitor';
import ConfirmModal from '@/components/ConfirmModal';
import globalUtil from '@//utils/global';
import roleUtil from '@/utils/role';

/* eslint react/no-array-index-key: 0 */

@connect(({ loading, teamControl, enterprise }) => ({
  deleteServiceMonitorLoading: loading.effects['monitor/deleteServiceMonitor'],
  updateServiceMonitorLoading: loading.effects['monitor/updateServiceMonitor'],
  addServiceMonitorLoading: loading.effects['monitor/addServiceMonitor'],
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
}))
export default class customMonitor extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      monitors: [],
      addCustomMonitor: false,
      loading: true,
      editorData: {},
      dleCustomMonitor: false,
      operationPermissions: this.handlePermissions('queryAppInfo')
    };
  }
  componentWillMount() {
    const { dispatch } = this.props;
    const {
      operationPermissions: { isAccess }
    } = this.state;
    if (!isAccess) {
      globalUtil.withoutPermission(dispatch);
    }
  }
  componentDidMount() {
    this.fetchServiceMonitor();
  }

  onAddCustomMonitor = () => {
    this.setState({ addCustomMonitor: true });
  };

  fetchServiceMonitor = () => {
    const { dispatch } = this.props;
    const parameter = this.handleParameter();

    dispatch({
      type: 'monitor/fetchServiceMonitor',
      payload: parameter,
      callback: (res) => {
        if (res && res._code === 200) {
          const arr = res.list;
          this.setState({
            loading: false,
            monitors: arr
          });
          if (arr && arr.length === 0) {
            this.onAddCustomMonitor();
          }
        }
      }
    });
  };
  handlePermissions = (type) => {
    const { currentTeamPermissionsInfo } = this.props;
    return roleUtil.querySpecifiedPermissionsInfo(
      currentTeamPermissionsInfo,
      type
    );
  };
  cancelAddCustomMonitor = () => {
    this.setState({ addCustomMonitor: false, editorData: {} });
  };

  handleDelete = (data) => {
    this.setState({
      dleCustomMonitor: data
    });
  };
  handleDeleteCustomMonitor = () => {
    const { dispatch } = this.props;
    const { dleCustomMonitor } = this.state;
    const parameter = this.handleParameter();

    dispatch({
      type: 'monitor/deleteServiceMonitor',
      payload: {
        ...parameter,
        name: dleCustomMonitor
      },
      callback: (res) => {
        if (res) {
          notification.success({ message: '删除成功' });
          this.fetchServiceMonitor();
          this.cancelDeleteCustomMonitor();
        }
      }
    });
  };
  cancelDeleteCustomMonitor = () => {
    this.setState({ dleCustomMonitor: false });
  };
  handleEditor = (data) => {
    this.setState({
      editorData: data,
      addCustomMonitor: true
    });
  };
  handleAddCustomMonitor = (vals) => {
    const { dispatch } = this.props;
    const { editorData } = this.state;
    const parameter = this.handleParameter();
    dispatch({
      type: editorData.name
        ? 'monitor/updateServiceMonitor'
        : 'monitor/addServiceMonitor',
      payload: {
        ...parameter,
        ...vals
      },
      callback: (res) => {
        if (res) {
          notification.success({
            message: editorData.name ? '保存成功' : '添加成功'
          });
          this.fetchServiceMonitor();
          this.cancelAddCustomMonitor();
        }
      }
    });
  };
  handleParameter = () => {
    const { appDetail } = this.props;
    return {
      team_name: globalUtil.getCurrTeamName(),
      app_alias: appDetail.service.service_alias
    };
  };

  render() {
    const {
      deleteServiceMonitorLoading,
      updateServiceMonitorLoading,
      addServiceMonitorLoading,
      onCancel
    } = this.props;
    const {
      monitors,
      loading,
      editorData,
      addCustomMonitor,
      dleCustomMonitor,
      operationPermissions: { isCreate }
    } = this.state;
    return (
      <div>
        <Row>
          <Col span={12}>
            <Alert
              message="支持Prometheus的metric监控指标规范"
              type="info"
              showIcon
            />
          </Col>
          {isCreate && (
            <Button
              type="primary"
              icon="plus"
              style={{ float: 'right', marginBottom: '20px' }}
              onClick={this.onAddCustomMonitor}
            >
              添加配置
            </Button>
          )}
          <Button
            style={{ float: 'right', margin: '0 10px 20px 0' }}
            onClick={onCancel}
          >
            返回监控图
          </Button>
        </Row>
        {addCustomMonitor && (
          <AddCustomMonitor
            parameter={this.handleParameter()}
            data={editorData}
            loading={updateServiceMonitorLoading || addServiceMonitorLoading}
            onCancel={this.cancelAddCustomMonitor}
            onOk={this.handleAddCustomMonitor}
          />
        )}
        <Card loading={loading}>
          {dleCustomMonitor && (
            <ConfirmModal
              title="删除配置"
              desc="确定要删除配置?"
              loading={deleteServiceMonitorLoading}
              onCancel={this.cancelDeleteCustomMonitor}
              onOk={this.handleDeleteCustomMonitor}
            />
          )}
          <ScrollerX sm={800}>
            <Table
              pagination={false}
              dataSource={monitors}
              columns={[
                {
                  title: '配置名称',
                  dataIndex: 'name'
                },
                {
                  title: '收集任务名称',
                  dataIndex: 'service_show_name',
                  align: 'center'
                },
                {
                  title: '路径',
                  dataIndex: 'path',
                  align: 'center'
                },
                {
                  title: '端口',
                  dataIndex: 'port',
                  align: 'center'
                },
                {
                  title: '收集间隔时间',
                  dataIndex: 'interval',
                  align: 'center'
                },
                {
                  title: '操作',
                  width: '200px',
                  dataIndex: 'backup_record_num',
                  align: 'center',
                  render: (res, data) => (
                    <Fragment>
                      <a
                        onClick={() => this.handleDelete(data.name)}
                        style={{ margintRight: 10 }}
                      >
                        删除
                      </a>
                      <a
                        onClick={() => {
                          this.handleEditor(data);
                        }}
                        style={{ margintRight: 10 }}
                      >
                        编辑
                      </a>
                    </Fragment>
                  )
                }
              ]}
            />
          </ScrollerX>
        </Card>
      </div>
    );
  }
}
