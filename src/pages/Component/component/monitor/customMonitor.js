/* eslint-disable react/no-unused-state */
/* eslint-disable import/extensions */
import globalUtil from '@//utils/global';
import BatchDeleteChart from '@/components/BatchDeleteChart';
import ConfirmModal from '@/components/ConfirmModal';
import CustomChart from '@/components/CustomChart';
import CustomMonitoring from '@/components/CustomMonitoring';
import Result from '@/components/Result';
import { Button, Dropdown, Icon, Menu, notification, Row } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import MonitoryPoint from './monitoryPoint';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';

/* eslint react/no-array-index-key: 0 */

@connect(({ appControl, loading }) => ({
  appDetail: appControl.appDetail,
  delServiceMonitorFigureLoading:
    loading.effects['monitor/delServiceMonitorFigure'],
  addKeyImportLoading: loading.effects['monitor/addKeyImport'],
  delLoading: loading.effects['monitor/batchDeleteServiceMonitorFigure']
}))
export default class customMonitor extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isMonitorFigure: false,
      monitorFigureList: [],
      isMonitoryPoint: false,
      isCustomMonitoring: false,
      showDelete: false,
      info: {},
      KeyImportList: [],
      BatchDelete: false,
      isMonitorsLoading: false,
      isMonitors: false,
      isRender: false,
      KeyImportLoading: true
    };
  }
  componentDidMount() {
    this.fetchServiceMonitorFigure();
    this.fetchKeyImport();
    this.fetchServiceMonitor();
  }
  onCancelCustomMonitoring = () => {
    this.setState({
      info: {},
      isCustomMonitoring: false
    });
  };
  onEdit = (e, val) => {
    e.preventDefault();
    this.setState({
      info: val,
      isCustomMonitoring: true
    });
  };
  onDelete = val => {
    this.setState({
      showDelete: val.graph_id
    });
  };
  handleMonitoryPoint = isMonitoryPoint => {
    this.setState({
      isMonitoryPoint
    });
  };

  handleCustomMonitoring = () => {
    this.setState({
      isCustomMonitoring: true
    });
  };
  fetchServiceMonitorFigure = (isUpdata = true) => {
    const { dispatch } = this.props;
    const parameter = this.handleParameter();
    dispatch({
      type: 'monitor/fetchServiceMonitorFigure',
      payload: {
        ...parameter
      },
      callback: res => {
        if (res && res.status_code === 200) {
          const isList = res.list && res.list.length > 0;
          this.setState({
            monitorFigureList: isList ? res.list : [],
            isMonitorFigure: !isList
          });
          if (!isUpdata) {
            this.handleUpData();
          }
          this.cancalBatchDelete();
        }
      }
    });
  };
  fetchKeyImport = () => {
    const { dispatch } = this.props;
    const parameter = this.handleParameter();
    dispatch({
      type: 'monitor/fetchKeyImport',
      payload: {
        ...parameter
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            KeyImportLoading: false,
            KeyImportList: res.list
          });
        }
      }
    });
  };
  addKeyImport = name => {
    const { dispatch } = this.props;
    const parameter = this.handleParameter();
    dispatch({
      type: 'monitor/addKeyImport',
      payload: {
        graph_name: name,
        ...parameter
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.fetchServiceMonitorFigure();
          this.fetchKeyImport();
        }
      }
    });
  };
  handleSorting = val => {
    const { dispatch } = this.props;
    const parameter = this.handleParameter();
    dispatch({
      type: 'monitor/sortMonitorFigure',
      payload: {
        ...parameter,
        graph_ids: val
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.fetchServiceMonitorFigure(false);
        }
      }
    });
  };
  handleUpData = () => {
    this.setState({ isRender: true }, () => {
      this.setState({ isRender: false });
    });
  };
  handleSubmit = vals => {
    const { dispatch } = this.props;
    const { info } = this.state;
    const parameter = this.handleParameter();
    if (info && info.graph_id) {
      dispatch({
        type: 'monitor/editServiceMonitorFigure',
        payload: {
          ...parameter,
          ...vals,
          graph_id: info.graph_id,
          sequence: info.sequence
        },
        callback: res => {
          if (res && res.status_code === 200) {
            notification.success({
              message: '保存成功'
            });
            this.fetchServiceMonitorFigure(false);
            this.onCancelCustomMonitoring();
          }
        }
      });
    } else {
      dispatch({
        type: 'monitor/addServiceMonitorFigure',
        payload: {
          ...parameter,
          ...vals
        },
        callback: res => {
          if (res && res.status_code === 200) {
            notification.success({
              message: '添加成功'
            });
            this.fetchServiceMonitorFigure();
            this.onCancelCustomMonitoring();
          }
        }
      });
    }
  };
  handleSubmitDelete = () => {
    const { dispatch } = this.props;
    const { showDelete } = this.state;
    const parameter = this.handleParameter();
    dispatch({
      type: 'monitor/delServiceMonitorFigure',
      payload: {
        ...parameter,
        graph_id: showDelete
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({
            message: '删除成功'
          });
          this.fetchServiceMonitorFigure();
          this.cancalDelete();
        }
      }
    });
  };
  fetchServiceMonitor = () => {
    const { dispatch } = this.props;
    const parameter = this.handleParameter();

    dispatch({
      type: 'monitor/fetchServiceMonitor',
      payload: parameter,
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            isMonitorsLoading: true,
            isMonitors: res.list.length > 0
          });
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
  cancalDelete = () => {
    this.setState({
      showDelete: false
    });
  };
  handleBatchDelete = () => {
    this.setState({
      BatchDelete: true
    });
  };
  cancalBatchDelete = () => {
    this.setState({
      BatchDelete: false
    });
  };
  render() {
    const {
      appDetail,
      delServiceMonitorFigureLoading,
      addKeyImportLoading,
      delLoading
    } = this.props;
    const teamName = globalUtil.getCurrTeamName();
    const appAlias = appDetail.service.service_alias;
    const serviceId = appDetail.service.service_id;
    const {
      isMonitoryPoint,
      isCustomMonitoring,
      isMonitorFigure,
      monitorFigureList,
      showDelete,
      info,
      KeyImportList,
      BatchDelete,
      isMonitors,
      isRender,
      KeyImportLoading,
      isMonitorsLoading
    } = this.state;

    return (
      <div>
        {isCustomMonitoring && (
          <CustomMonitoring
            serviceId={serviceId}
            teamName={teamName}
            appAlias={appAlias}
            info={info}
            onOk={this.handleSubmit}
            onCancel={this.onCancelCustomMonitoring}
          />
        )}
        {!isMonitoryPoint && !KeyImportLoading && (
          <Row>
            <CustomChart
              moduleName="CustomMonitor"
              isRender={isRender}
              handleUpData={this.handleUpData}
              upData={this.fetchServiceMonitorFigure}
              handleSorting={this.handleSorting}
              onDelete={this.onDelete}
              onEdit={this.onEdit}
              appAlias={appAlias}
              serviceId={serviceId}
              RangeData={isMonitorFigure ? [] : monitorFigureList}
              operation={
                <div
                  style={{
                    display: 'inline-block',
                    width: 'calc(100% - 450px)',
                    lineHeight: '40px'
                  }}
                >
                  <Button
                    style={{ marginLeft: '5px' }}
                    onClick={this.handleCustomMonitoring}
                  >
                    {/* 添加图表 */}
                    <FormattedMessage id='componentOverview.body.tab.monitor.CustomMonitor.add'/>
                  </Button>
                  {KeyImportList && KeyImportList.length > 0 && (
                    <Dropdown
                      overlay={
                        <Menu>
                          {KeyImportList.map(item => {
                            return (
                              <Menu.Item style={{ textAlign: 'center' }}>
                                <a
                                  onClick={() => {
                                    this.addKeyImport(item);
                                  }}
                                >
                                  {item}
                                </a>
                              </Menu.Item>
                            );
                          })}
                        </Menu>
                      }
                      trigger={['click']}
                      placement="bottomCenter"
                      disabled={addKeyImportLoading}
                    >
                      <Button style={{ marginLeft: '5px' }}>
                        {/* 一键导入 */}
                        <FormattedMessage id='componentOverview.body.tab.monitor.CustomMonitor.import'/>
                        <Icon type="down" />
                      </Button>
                    </Dropdown>
                  )}
                  {monitorFigureList && monitorFigureList.length > 0 && (
                    <Button
                      style={{ marginLeft: '5px' }}
                      loading={delLoading}
                      onClick={this.handleBatchDelete}
                    >
                      <FormattedMessage id='componentOverview.body.tab.monitor.CustomMonitor.delete'/>
                      {/* 批量删除 */}
                    </Button>
                  )}

                  <Button
                    style={{ float: 'right', marginTop: '4px' }}
                    onClick={() => {
                      this.handleMonitoryPoint(true);
                    }}
                  >
                    <FormattedMessage id='componentOverview.body.tab.monitor.CustomMonitor.point'/>
                    {/* 管理监控点 */}
                  </Button>
                </div>
              }
            />
          </Row>
        )}
        {!isMonitoryPoint &&
          !isCustomMonitoring &&
          isMonitorFigure &&
          isMonitorsLoading && (
            <Result
              style={{ background: '#fff', marginTop: '10px', padding: '20px' }}
              type="warning"
              description={
                <div>
                  {/* 暂无业务监控图、请先添加 */}
                  <FormattedMessage id='componentOverview.body.tab.monitor.CustomMonitor.noBusiness'/>
                  <a
                    onClick={() => {
                      if (isMonitors) {
                        this.handleCustomMonitoring();
                      } else {
                        this.handleMonitoryPoint(true);
                      }
                    }}
                  >
                    {isMonitors ? <FormattedMessage id='componentOverview.body.tab.monitor.CustomMonitor.add'/> : <FormattedMessage id='componentOverview.body.tab.monitor.CustomMonitor.point'/>}
                  </a>
                </div>
              }
            />
          )}

        {showDelete && (
          <ConfirmModal
            loading={delServiceMonitorFigureLoading}
            title="删除监控视图"
            desc="确定要删除此视图吗？"
            subDesc="此操作不可恢复"
            onOk={this.handleSubmitDelete}
            onCancel={this.cancalDelete}
          />
        )}

        {BatchDelete && (
          <BatchDeleteChart
            title="批量删除监控视图"
            loading={delLoading}
            data={monitorFigureList}
            {...this.handleParameter()}
            onOk={this.fetchServiceMonitorFigure}
            onCancel={this.cancalBatchDelete}
          />
        )}

        {isMonitoryPoint && (
          <MonitoryPoint
            {...this.props}
            onCancel={() => {
              this.fetchServiceMonitorFigure();
              this.handleMonitoryPoint(false);
            }}
          />
        )}
      </div>
    );
  }
}
