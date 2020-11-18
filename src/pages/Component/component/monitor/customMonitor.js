/* eslint-disable react/no-unused-state */
/* eslint-disable import/extensions */
import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Button, Row, notification, Dropdown, Icon, Menu, Col } from 'antd';
import MonitoryPoint from './monitoryPoint';
import ConfirmModal from '@/components/ConfirmModal';
import CustomMonitoring from '@/components/CustomMonitoring';
import CustomChart from '@/components/CustomChart';
import globalUtil from '@//utils/global';
import Result from '@/components/Result';

/* eslint react/no-array-index-key: 0 */

@connect(({ appControl, loading }) => ({
  appDetail: appControl.appDetail,
  delServiceMonitorFigureLoading:
    loading.effects['monitor/delServiceMonitorFigure'],
  addKeyImportLoading: loading.effects['monitor/addKeyImport']
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
      KeyImportList: []
    };
  }
  componentDidMount() {
    this.fetchServiceMonitorFigure();
    this.fetchKeyImport();
  }
  onCancelCustomMonitoring = () => {
    this.setState({
      info: {},
      isCustomMonitoring: false
    });
  };
  onEdit = (val) => {
    this.setState({
      info: val,
      isCustomMonitoring: true
    });
  };
  onDelete = (val) => {
    this.setState({
      showDelete: val.graph_id
    });
  };
  handleMonitoryPoint = (isMonitoryPoint) => {
    this.setState({
      isMonitoryPoint
    });
  };

  handleCustomMonitoring = () => {
    this.setState({
      isCustomMonitoring: true
    });
  };
  fetchServiceMonitorFigure = () => {
    const { dispatch } = this.props;
    const parameter = this.handleParameter();
    dispatch({
      type: 'monitor/fetchServiceMonitorFigure',
      payload: {
        ...parameter
      },
      callback: (res) => {
        if (res && res._code === 200) {
          if (res.list.length > 0) {
            this.setState({
              monitorFigureList: res.list,
              isMonitorFigure: false
            });
          } else {
            this.setState({
              isMonitorFigure: true
            });
          }
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
      callback: (res) => {
        if (res && res._code === 200) {
          this.setState({
            KeyImportList: res.list
          });
        }
      }
    });
  };

  addKeyImport = (name) => {
    const { dispatch } = this.props;
    const parameter = this.handleParameter();
    dispatch({
      type: 'monitor/addKeyImport',
      payload: {
        graph_name: name,
        ...parameter
      },
      callback: (res) => {
        if (res && res._code === 200) {
          this.fetchServiceMonitorFigure();
          this.fetchKeyImport();
        }
      }
    });
  };
  handleSorting = (val, list) => {
    this.setState(
      {
        info: val,
        monitorFigureList: list
      },
      () => {
        this.handleSubmit(val, false);
      }
    );
  };
  handleSubmit = (vals, isMessage = true) => {
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
        callback: (res) => {
          if (res && res._code === 200) {
            if (isMessage) {
              notification.success({
                message: '保存成功'
              });
            }
            this.fetchServiceMonitorFigure();
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
        callback: (res) => {
          if (res && res._code === 200) {
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
      callback: (res) => {
        if (res && res._code === 200) {
          notification.success({
            message: '删除成功'
          });
          this.fetchServiceMonitorFigure();
          this.cancalDelete();
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

  render() {
    const {
      appDetail,
      delServiceMonitorFigureLoading,
      addKeyImportLoading
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
      KeyImportList
    } = this.state;
    const menu = (
      <Menu>
        {KeyImportList.map((item) => {
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
    );
    return (
      <div>
        {!isMonitoryPoint && (
          <Row>
            <CustomChart
              moduleName="CustomMonitor"
              upData={this.fetchServiceMonitorFigure}
              handleSorting={this.handleSorting}
              onDelete={this.onDelete}
              onEdit={this.onEdit}
              appAlias={appAlias}
              serviceId={serviceId}
              content={
                isCustomMonitoring ? (
                  <Col span={12} style={{ marginRight: '10px' }}>
                    <CustomMonitoring
                      colSpan={12}
                      serviceId={serviceId}
                      teamName={teamName}
                      appAlias={appAlias}
                      info={info}
                      onOk={this.handleSubmit}
                      onCancel={this.onCancelCustomMonitoring}
                    />
                  </Col>
                ) : (
                  ''
                )
              }
              RangeData={isMonitorFigure ? [] : monitorFigureList}
              operation={
                <div style={{ display: 'inline-block', width: '88%' }}>
                  <Button
                    icon="plus"
                    style={{ marginLeft: '5px' }}
                    onClick={this.handleCustomMonitoring}
                  >
                    添加图表
                  </Button>
                  {KeyImportList.length > 0 && (
                    <Dropdown
                      overlay={menu}
                      trigger={['click']}
                      placement="bottomCenter"
                      disabled={addKeyImportLoading}
                    >
                      <Button style={{ marginLeft: '5px' }}>
                        一键导入 <Icon type="down" />
                      </Button>
                    </Dropdown>
                  )}
                  <Button
                    style={{ float: 'right', marginTop: '4px' }}
                    onClick={() => {
                      this.handleMonitoryPoint(true);
                    }}
                  >
                    管理监控点
                  </Button>
                </div>
              }
            />
          </Row>
        )}
        {!isMonitoryPoint && !isCustomMonitoring && isMonitorFigure && (
          <Result
            style={{ background: '#fff', marginTop: '10px', padding: '20px' }}
            type="warning"
            description={
              <div>
                暂无业务监控图、请先添加
                <a
                  onClick={() => {
                    this.handleMonitoryPoint(true);
                  }}
                >
                  管理监控点
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

        {isMonitoryPoint && (
          <MonitoryPoint
            {...this.props}
            onCancel={() => {
              this.handleMonitoryPoint(false);
            }}
          />
        )}
      </div>
    );
  }
}
