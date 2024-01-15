/* eslint-disable import/extensions */
import globalUtil from '@//utils/global';
import AddCustomMonitor from '@/components/AddCustomMonitor';
import ConfirmModal from '@/components/ConfirmModal';
import ScrollerX from '@/components/ScrollerX';
import roleUtil from '@/utils/role';
import { Alert, Button, Card, Col, notification, Row, Table } from 'antd';
import { connect } from 'dva';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import React, { Fragment, PureComponent } from 'react';

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
      callback: res => {
        if (res && res.status_code === 200) {
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
  handlePermissions = type => {
    const { currentTeamPermissionsInfo } = this.props;
    return roleUtil.querySpecifiedPermissionsInfo(
      currentTeamPermissionsInfo,
      type
    );
  };
  cancelAddCustomMonitor = () => {
    this.setState({ addCustomMonitor: false, editorData: {} });
  };

  handleDelete = data => {
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
      callback: res => {
        if (res) {
          notification.success({ message: formatMessage({id:'notification.success.delete'}) });
          this.fetchServiceMonitor();
          this.cancelDeleteCustomMonitor();
        }
      }
    });
  };
  cancelDeleteCustomMonitor = () => {
    this.setState({ dleCustomMonitor: false });
  };
  handleEditor = data => {
    this.setState({
      editorData: data,
      addCustomMonitor: true
    });
  };
  handleAddCustomMonitor = vals => {
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
      callback: res => {
        if (res) {
          notification.success({
            message: editorData.name ? formatMessage({id:'notification.success.save'}) : formatMessage({id:'notification.success.add'})
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
              // message="支持Prometheus的metric监控指标规范"
              message={<FormattedMessage id='componentOverview.body.tab.monitor.MonitoryPoint.standard'/>}
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
              {/* 添加配置 */}
              <FormattedMessage id='componentOverview.body.tab.monitor.MonitoryPoint.add'/>
            </Button>
          )}
          <Button
            style={{ float: 'right', margin: '0 10px 20px 0' }}
            onClick={onCancel}
          >
            {/* 返回监控图 */}
            <FormattedMessage id='componentOverview.body.tab.monitor.MonitoryPoint.back'/>
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
              ttitle={<FormattedMessage id="confirmModal.deldete.configure.title"/>}
              desc={<FormattedMessage id="confirmModal.deldete.configure.desc"/>}
              loading={deleteServiceMonitorLoading}
              onCancel={this.cancelDeleteCustomMonitor}
              onOk={this.handleDeleteCustomMonitor}
            />
          )}
          <ScrollerX sm={800}>
            <Table
              pagination={false}
              rowKey={(record,index) => index}
              dataSource={monitors}
              columns={[
                {
                  // title: '配置名称',
                  title: formatMessage({id:'componentOverview.body.tab.monitor.MonitoryPoint.name'}),
                  dataIndex: 'name'
                },
                {
                  // title: '收集任务名称',
                  title: formatMessage({id:'componentOverview.body.tab.monitor.MonitoryPoint.collect'}),
                  dataIndex: 'service_show_name',
                  align: 'center'
                },
                {
                  // title: '路径',
                  title: formatMessage({id:'componentOverview.body.tab.monitor.MonitoryPoint.path'}),
                  dataIndex: 'path',
                  align: 'center'
                },
                {
                  // title: '端口',
                  title: formatMessage({id:'componentOverview.body.tab.monitor.MonitoryPoint.port'}),
                  dataIndex: 'port',
                  align: 'center'
                },
                {
                  // title: '收集间隔时间',
                  title: formatMessage({id:'componentOverview.body.tab.monitor.MonitoryPoint.time'}),
                  dataIndex: 'interval',
                  align: 'center'
                },
                {
                  // title: '操作',
                  title: formatMessage({id:'componentOverview.body.tab.monitor.MonitoryPoint.handle'}),
                  width: '200px',
                  dataIndex: 'backup_record_num',
                  align: 'center',
                  render: (res, data) => (
                    <Fragment>
                      <a
                        onClick={() => this.handleDelete(data.name)}
                        style={{ margintRight: 10 }}
                      >
                        {/* 删除 */}
                        <FormattedMessage id='componentOverview.body.tab.monitor.MonitoryPoint.delete'/>
                      </a>
                      <a
                        onClick={() => {
                          this.handleEditor(data);
                        }}
                        style={{ margintRight: 10 }}
                      >
                        <FormattedMessage id='componentOverview.body.tab.monitor.MonitoryPoint.edit'/>
                        {/* 编辑 */}
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
