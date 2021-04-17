/* eslint-disable no-nested-ternary */
/* eslint-disable no-unused-expressions */
import EditGroupName from '@/components/AddOrEditGroup';
import AppDirector from '@/components/AppDirector';
import CodeMirrorForm from '@/components/CodeMirrorForm';
import { LoadingOutlined } from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  Collapse,
  Divider,
  Form,
  Icon,
  Modal,
  notification,
  Row,
  Steps,
  Tabs,
  Tooltip
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import moment from 'moment';
import React, { Fragment, PureComponent } from 'react';
import ConfirmModal from '../../components/ConfirmModal';
import Result from '../../components/Result';
import { batchOperation } from '../../services/app';
import cookie from '../../utils/cookie';
import globalUtil from '../../utils/global';
import sourceUtil from '../../utils/source-unit';
import Instance from '../Component/component/Instance/index';
import styles from './Index.less';

const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Step } = Steps;
// eslint-disable-next-line react/no-multi-comp
@connect(({ user, application, teamControl, enterprise, loading, global }) => ({
  buildShapeLoading: loading.effects['global/buildShape'],
  editGroupLoading: loading.effects['application/editGroup'],
  deleteLoading: loading.effects['application/delete'],
  currUser: user.currentUser,
  collapsed: global.collapsed,
  apps: application.apps,
  groupDetail: application.groupDetail || {},
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise
}))
@Form.create()
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);

    this.state = {
      appStateLoading: true,
      appStates: [
        {
          key: 'initailing',
          value: '初始化中'
        },
        {
          key: 'detecting',
          value: '检测中'
        },
        {
          key: 'configuring',
          value: '配置中'
        }
      ],
      appType: {
        ChartReady: '拉取应用包',
        PreInstalled: '校验应用包',
        ChartParsed: '解析应用包'
      },
      appStateMap: {
        initailing: 0,
        detecting: 1,
        configuring: 2,
        installed: 3
      },
      checkList: [],
      services: [],
      currentSteps: 0,
      customWidth: document.body.clientWidth - 145,
      toDelete: false,
      toEdit: false,
      toEditAppDirector: false,
      service_alias: [],
      serviceIds: [],
      linkList: [],
      jsonDataLength: 0,
      promptModal: false,
      code: '',
      currApp: {},
      loadingDetail: true,
      componentTimer: true,
      submitLoading: false,
      resources: {}
    };
  }

  componentDidMount() {
    this.loading();
  }

  componentWillUnmount() {
    this.closeTimer();
    const { dispatch } = this.props;
    dispatch({ type: 'application/clearGroupDetail' });
  }
  onCancel = () => {
    this.setState({
      customSwitch: false
    });
  };
  onChangeSteps = currentSteps => {
    this.setState({ currentSteps });
  };
  getGroupId() {
    return this.props.appID;
  }
  closeTimer = () => {
    if (this.timer) {
      clearInterval(this.timer);
    }
  };
  loading = () => {
    this.handleHelmCheck();
    this.fetchAppDetail();
    this.loadTopology(true);
    this.fetchAppDetailState();
  };
  handleHelmCheck = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'application/checkHelmApp',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.getGroupId()
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            checkList: res && res.list
          });
          console.log('handleHelmCheck', res);
        }
      }
    });
  };

  loadTopology(isCycle) {
    const { dispatch } = this.props;
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    cookie.set('team_name', teamName);
    cookie.set('region_name', regionName);

    dispatch({
      type: 'global/fetAllTopology',
      payload: {
        region_name: regionName,
        team_name: teamName,
        groupId: this.getGroupId()
      },
      callback: res => {
        if (res && res.status_code === 200) {
          const data = res.bean;
          if (JSON.stringify(data) === '{}') {
            return;
          }
          const serviceIds = [];
          const service_alias = [];
          const { json_data } = data;
          Object.keys(json_data).map(key => {
            serviceIds.push(key);
            if (
              json_data[key].cur_status == 'running' &&
              json_data[key].is_internet == true
            ) {
              service_alias.push(json_data[key].service_alias);
            }
          });

          this.setState(
            {
              jsonDataLength: Object.keys(json_data).length,
              service_alias,
              serviceIds
            },
            () => {
              this.loadLinks(service_alias.join('-'), isCycle);
            }
          );
        }
      }
    });
  }

  loadLinks(serviceAlias, isCycle) {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/queryLinks',
      payload: {
        service_alias: serviceAlias,
        team_name: globalUtil.getCurrTeamName()
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState(
            {
              linkList: res.list || []
            },
            () => {
              if (isCycle) {
                this.handleTimers(
                  'timer',
                  () => {
                    this.fetchAppDetailState();
                    this.fetchAppDetail();
                    this.loadTopology(true);
                  },
                  10000
                );
              }
            }
          );
        }
      },
      handleError: err => {
        this.handleError(err);
        this.handleTimers(
          'timer',
          () => {
            this.fetchAppDetailState();
            this.fetchAppDetail();
            this.loadTopology(true);
          },
          20000
        );
      }
    });
  }
  handleError = err => {
    const { componentTimer } = this.state;
    if (!componentTimer) {
      return null;
    }
    if (err && err.data && err.data.msg_show) {
      notification.warning({
        message: `请求错误`,
        description: err.data.msg_show
      });
    }
  };
  handleTimers = (timerName, callback, times) => {
    const { componentTimer } = this.state;
    if (!componentTimer) {
      return null;
    }
    this[timerName] = setTimeout(() => {
      callback();
    }, times);
  };

  fetchAppDetail = () => {
    const { dispatch } = this.props;
    const { teamName, regionName, appID } = this.props.match.params;
    this.setState({ loadingDetail: true });
    dispatch({
      type: 'application/fetchGroupDetail',
      payload: {
        team_name: teamName,
        region_name: regionName,
        group_id: appID
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            currApp: res.bean,
            loadingDetail: false
          });
        }
      },
      handleError: res => {
        const { componentTimer } = this.state;
        if (!componentTimer) {
          return null;
        }
        if (res && res.code === 404) {
          dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps`
            )
          );
        }
      }
    });
  };

  fetchAppDetailState = () => {
    const { dispatch } = this.props;
    const { teamName, appID } = this.props.match.params;
    const { appStateMap } = this.state;
    dispatch({
      type: 'application/fetchAppDetailState',
      payload: {
        team_name: teamName,
        group_id: appID
      },
      callback: res => {
        const currentSteps =
          (res.list && res.list.phase && appStateMap[res.list.phase]) || 0;
        if (currentSteps < 2) {
          this.handleHelmCheck();
        }
        if (currentSteps >= 2) {
          this.handleServices();
        }
        this.setState({
          resources: res.list || {},
          appStateLoading: false,
          currentSteps
        });
      },
      handleError: () => {
        this.setState({
          appStateLoading: false
        });
      }
    });
  };

  handleFormReset = () => {
    const { form } = this.props;
    form.resetFields();
    this.loadApps();
  };
  handleSearch = e => {
    e.preventDefault();
    this.loadApps();
  };
  toDelete = () => {
    this.closeComponentTimer();
    this.setState({ toDelete: true });
  };
  cancelDelete = (isOpen = true) => {
    this.setState({ toDelete: false });
    if (isOpen) {
      this.openComponentTimer();
    }
  };

  closeComponentTimer = () => {
    this.setState({ componentTimer: false });
    this.closeTimer();
  };
  openComponentTimer = () => {
    this.setState({ componentTimer: true }, () => {
      this.loadTopology(true);
    });
  };

  handleDelete = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'application/delete',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.getGroupId()
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({ message: '删除成功' });
          this.closeComponentTimer();
          this.cancelDelete(false);
          dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps`
            )
          );
        }
      }
    });
  };

  newAddress = grid => {
    this.props.dispatch({
      type: 'global/fetchGroups',
      payload: {
        team_name: globalUtil.getCurrTeamName()
      },
      callback: list => {
        if (list && list.length) {
          if (grid == list[0].group_id) {
            this.newAddress(grid);
          } else {
            this.props.dispatch(
              routerRedux.push(
                `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${
                  list[0].group_id
                }`
              )
            );
          }
        } else {
          this.props.dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/index`
            )
          );
        }
      }
    });
  };
  toEdit = () => {
    this.setState({ toEdit: true });
  };
  cancelEdit = () => {
    this.setState({ toEdit: false });
  };
  handleToEditAppDirector = () => {
    this.setState({ toEditAppDirector: true });
  };
  cancelEditAppDirector = () => {
    this.setState({ toEditAppDirector: false });
  };
  handleEdit = vals => {
    const { dispatch } = this.props;
    dispatch({
      type: 'application/editGroup',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.getGroupId(),
        group_name: vals.group_name,
        note: vals.note,
        username: vals.username
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({ message: '修改成功' });
        }
        this.handleUpDataHeader();
        this.cancelEdit();
        this.cancelEditAppDirector();
        this.fetchAppDetail();
        dispatch({
          type: 'global/fetchGroups',
          payload: {
            team_name: globalUtil.getCurrTeamName()
          }
        });
      }
    });
  };
  handleServices = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'application/fetchServices',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.getGroupId()
      },
      callback: res => {
        console.log('res', res);
        if (res && res.status_code === 200) {
          this.setState({
            services: res.list || []
          });
        }
      }
    });
  };
  handleUpDataHeader = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/IsUpDataHeader',
      payload: { isUpData: true }
    });
  };

  /** 构建拓扑图 */
  handleTopology = code => {
    this.setState({
      promptModal: true,
      code
    });
  };

  handlePromptModalOpen = () => {
    const { code, serviceIds } = this.state;
    const { dispatch } = this.props;
    if (code === 'restart') {
      batchOperation({
        action: code,
        team_name: globalUtil.getCurrTeamName(),
        serviceIds: serviceIds && serviceIds.join(',')
      }).then(res => {
        if (res && res.status_code === 200) {
          notification.success({
            message: '重启成功'
          });
          this.handlePromptModalClose();
        }
        this.loadTopology(false);
      });
    } else {
      dispatch({
        type: 'global/buildShape',
        payload: {
          tenantName: globalUtil.getCurrTeamName(),
          group_id: this.getGroupId(),
          action: code
        },
        callback: res => {
          if (res && res.status_code === 200) {
            notification.success({
              message: res.msg_show || '构建成功',
              duration: '3'
            });
            this.handlePromptModalClose();
          }
          this.loadTopology(false);
        }
      });
    }
  };

  handlePromptModalClose = () => {
    this.setState({
      promptModal: false,
      code: ''
    });
  };

  handleJump = target => {
    const { dispatch, appID } = this.props;
    dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${appID}/${target}`
      )
    );
  };
  beforeUpload = (file, isMessage) => {
    const fileArr = file.name.split('.');
    const { length } = fileArr;
    const isRightType =
      fileArr[length - 1] === 'yaml' || fileArr[length - 1] === 'yml';
    if (!isRightType) {
      if (isMessage) {
        notification.warning({
          message: '请上传以.yaml、.yml结尾的 Region Config 文件'
        });
      }
      return false;
    }
    return true;
  };

  encodeBase64Content = commonContent => {
    const base64Content = Buffer.from(commonContent).toString('base64');
    return base64Content;
  };

  decodeBase64Content = base64Content => {
    let commonContent = base64Content.replace(/\s/g, '+');
    commonContent = Buffer.from(commonContent, 'base64').toString();
    return commonContent;
  };
  handleSubmit = e => {
    e.preventDefault();
    const { form } = this.props;
    const { validateFields } = form;

    validateFields((err, values) => {
      if (!err) {
        this.setState({
          submitLoading: true
        });
        this.handleInstallHelmApp(this.encodeBase64Content(values.yamls));
      }
    });
  };

  handleInstallHelmApp = values => {
    const { dispatch } = this.props;
    dispatch({
      type: 'application/installHelmApp',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.getGroupId(),
        values
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            submitLoading: false
          });
          console.log('handleInstallHelmApp', res);
        }
      }
    });
  };
  render() {
    const {
      appPermissions: { isUpgrade, isEdit, isDelete, isUpdate },
      groupDetail,
      form,
      buildShapeLoading,
      editGroupLoading,
      deleteLoading,
      collapsed,
      operationPermissions: { isAccess: isControl }
    } = this.props;
    const {
      currApp,
      resources,
      jsonDataLength,
      code,
      promptModal,
      toEdit,
      toEditAppDirector,
      toDelete,
      customWidth,
      currentSteps,
      appStates,
      appType,
      checkList,
      services,
      appStateLoading,
      submitLoading
    } = this.state;
    const CodeMirrorFormWidth = `${customWidth - (collapsed ? 433 : 118)}px`;
    const { getFieldDecorator, setFieldsValue } = form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 }
      },
      wrapperCol: {
        xs: { span: 24 }
      }
    };
    const codeObj = {
      start: '启动',
      restart: '重启',
      stop: '停用',
      deploy: '构建'
    };

    const appState = {
      RUNNING: '运行中',
      STARTING: '启动中',
      CLOSED: '已关闭',
      STOPPING: '关闭中',
      ABNORMAL: '异常',
      PARTIAL_ABNORMAL: '部分异常'
    };
    const appStateColor = {
      RUNNING: 'success',
      STARTING: 'success',
      CLOSED: 'error',
      STOPPING: 'error',
      ABNORMAL: 'error',
      PARTIAL_ABNORMAL: 'error'
    };
    const BtnDisabled = !(jsonDataLength > 0);

    const pageHeaderContent = (
      <div className={styles.pageHeaderContent}>
        <Card
          style={{ padding: 0 }}
          loading={appStateLoading}
          className={styles.contentl}
        >
          <div>
            <div
              className={styles.conBoxt}
              style={{
                justifyContent: 'end',
                alignItems: 'end',
                marginBottom: '42px'
              }}
            >
              <img
                style={{ width: '60px', marginRight: '10px' }}
                alt=""
                src="https://gw.alipayobjects.com/zos/rmsportal/MjEImQtenlyueSmVEfUD.svg"
              />
              <div style={{ width: '45%' }}>
                <div className={styles.contentTitle} style={{ width: '100%' }}>
                  <span>{currApp.group_name || '-'}</span>
                  {isEdit && (
                    <Icon
                      style={{
                        cursor: 'pointer',
                        marginLeft: '5px'
                      }}
                      onClick={this.toEdit}
                      type="edit"
                    />
                  )}
                </div>
                <div style={{ marginTop: '10px' }}>应用描述</div>
              </div>
              {resources.status && (
                <div className={styles.helmState}>
                  <Badge
                    className={styles.states}
                    status={appStateColor[resources.status] || 'default'}
                    text={appState[resources.status] || '-'}
                  />
                  {resources.status !== 'CLOSED' && isUpdate && (
                    <a
                      className={styles.operationState}
                      onClick={() => {
                        this.handleTopology('upgrade');
                      }}
                      disabled={BtnDisabled}
                    >
                      更新
                    </a>
                  )}
                  {isDelete && (
                    <Divider type="vertical" style={{ marginTop: '4px' }} />
                  )}
                  {isDelete && (
                    <a
                      className={styles.operationState}
                      onClick={this.toDelete}
                    >
                      删除
                    </a>
                  )}
                </div>
              )}
            </div>
            <div className={styles.connect_Bot}>
              <div
                className={styles.connect_Box}
                style={{ width: '100%', marginRight: '0' }}
              >
                <div className={styles.connect_Boxs}>
                  <div>使用内存</div>
                  <div>{`${sourceUtil.unit(resources.memory || 0, 'MB')}`}</div>
                </div>
                <div className={styles.connect_Boxs}>
                  <div>使用CPU</div>
                  <div>{(resources.cpu && resources.cpu / 1000) || 0}Core</div>
                </div>
                <div className={styles.connect_Boxs}>
                  <div>服务数量</div>
                  <div>{currApp.service_num || 0}</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
        <Card
          style={{ padding: 0 }}
          loading={appStateLoading}
          className={styles.contentl}
        >
          <div className={styles.contentr}>
            <div className={styles.conrHeader}>
              <div>
                <span>创建时间</span>
                <span>
                  {currApp.create_time
                    ? moment(currApp.create_time)
                        .locale('zh-cn')
                        .format('YYYY-MM-DD HH:mm:ss')
                    : '-'}
                </span>
              </div>
              <div>
                <span>更新时间</span>
                <span>
                  {currApp.update_time
                    ? moment(currApp.update_time)
                        .locale('zh-cn')
                        .format('YYYY-MM-DD HH:mm:ss')
                    : '-'}
                </span>
              </div>
            </div>
            <div className={styles.conrHeader}>
              <div>
                <span>负责人</span>
                <span>
                  {currApp.principal ? (
                    <Tooltip
                      placement="top"
                      title={
                        <div>
                          <div>账号:{currApp.username}</div>
                          <div>姓名:{currApp.principal}</div>
                          <div>邮箱:{currApp.email}</div>
                        </div>
                      }
                    >
                      <span style={{ color: 'rgba(0, 0, 0, 0.85)' }}>
                        {currApp.principal}
                      </span>
                    </Tooltip>
                  ) : (
                    '-'
                  )}
                  {isEdit && (
                    <Icon
                      style={{
                        cursor: 'pointer',
                        marginLeft: '5px'
                      }}
                      onClick={this.handleToEditAppDirector}
                      type="edit"
                    />
                  )}
                </span>
              </div>
            </div>
            <div className={styles.conrBot}>
              <div className={styles.conrBox} style={{ width: '50%' }}>
                <div>网关策略</div>
                <div
                  onClick={() => {
                    isControl && this.handleJump('gateway');
                  }}
                >
                  <a>{currApp.ingress_num || 0}</a>
                </div>
              </div>
              <div className={styles.conrBox} style={{ width: '50%' }}>
                <div>待升级</div>
                <div
                  onClick={() => {
                    isUpgrade && this.handleJump('upgrade');
                  }}
                >
                  <a>{currApp.upgradable_num || 0}</a>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();

    return (
      <Fragment>
        <Row>{pageHeaderContent}</Row>

        <Card style={{ marginTop: 16 }} loading={appStateLoading}>
          {currentSteps < 3 && (
            <Steps
              type="navigation"
              current={currentSteps}
              // onChange={this.onChangeSteps}
              className="site-navigation-steps"
            >
              {appStates.map((item, index) => {
                const { value } = item;
                return (
                  <Step
                    title={value}
                    icon={index == currentSteps && <LoadingOutlined />}
                  />
                );
              })}
            </Steps>
          )}
          {currentSteps < 1 && (
            <div className={styles.process}>
              <Result
                type="ing"
                title="初始化中..."
                description="此过程可能比较耗时，请耐心等待"
                style={{
                  marginTop: 48,
                  marginBottom: 16
                }}
              />
            </div>
          )}

          {currentSteps === 1 && (
            <Steps className={styles.process}>
              {checkList.map(item => {
                const { ready, error, type } = item;
                return (
                  <Step
                    title={appType[type]}
                    status={ready ? 'finish' : error ? 'error' : 'wait'}
                    description={
                      <div style={{ color: '#ff4d4f' }}>{error}</div>
                    }
                  />
                );
              })}
            </Steps>
          )}
          {currentSteps > 2 && (
            <Card
              bordered={0}
              loading={false}
              title="服务实例"
              bodyStyle={{ padding: '0', background: '#F0F2F5' }}
            >
              <Tabs style={{ background: '#fff', padding: '0 24px 24px' }}>
                {services.map((item, index) => {
                  const { service_name, ports } = item;
                  return (
                    <TabPane tab={service_name} key={index}>
                      <Instance
                        runLoading={false}
                        new_pods={ports}
                        old_pods={[]}
                        appAlias={this.props.appAlias}
                      />
                    </TabPane>
                  );
                })}
              </Tabs>
            </Card>
          )}
          {currentSteps > 1 && (
            <div className={styles.customCollapse}>
              <Form onSubmit={this.handleSubmit} labelAlign="left">
                <Collapse bordered={false} defaultActiveKey={['1', '2']}>
                  <Panel
                    header={
                      <div className={styles.customPanelHeader}>
                        <h6>详情描述</h6>
                        <p>应用程序信息和用户</p>
                      </div>
                    }
                    key="1"
                    className={styles.customPanel}
                  >
                    <div>应用描述</div>
                  </Panel>
                  <Panel
                    header={
                      <div className={styles.customPanelHeader}>
                        <h6>配置选项</h6>
                        <p>粘贴和读取操作要求应答为 yaml格式</p>
                      </div>
                    }
                    key="2"
                    className={styles.customPanel}
                  >
                    <CodeMirrorForm
                      data={
                        (resources.valuesTemplate &&
                          this.decodeBase64Content(resources.valuesTemplate)) ||
                        ''
                      }
                      marginTop={20}
                      width={CodeMirrorFormWidth}
                      titles="yaml文件"
                      setFieldsValue={setFieldsValue}
                      formItemLayout={formItemLayout}
                      Form={Form}
                      getFieldDecorator={getFieldDecorator}
                      beforeUpload={this.beforeUpload}
                      mode="yaml"
                      name="yamls"
                      message="yaml是必须的"
                    />
                  </Panel>
                </Collapse>
                {currentSteps <= 2 && (
                  <div style={{ textAlign: 'center' }}>
                    <Button
                      onClick={this.handleSubmit}
                      loading={submitLoading}
                      type="primary"
                    >
                      创建
                    </Button>
                  </div>
                )}
              </Form>
            </div>
          )}
        </Card>

        {toDelete && (
          <ConfirmModal
            title="删除应用"
            desc="确定要此删除此应用吗？"
            subDesc="此操作不可恢复"
            loading={deleteLoading}
            onOk={this.handleDelete}
            onCancel={this.cancelDelete}
          />
        )}
        {toEdit && (
          <EditGroupName
            group_name={groupDetail.group_name}
            note={groupDetail.note}
            loading={editGroupLoading}
            title="修改应用信息"
            onCancel={this.cancelEdit}
            onOk={this.handleEdit}
          />
        )}
        {toEditAppDirector && (
          <AppDirector
            teamName={teamName}
            regionName={regionName}
            group_name={groupDetail.group_name}
            note={groupDetail.note}
            loading={editGroupLoading}
            principal={currApp.username}
            onCancel={this.cancelEditAppDirector}
            onOk={this.handleEdit}
          />
        )}

        {promptModal && (
          <Modal
            title="友情提示"
            confirmLoading={buildShapeLoading}
            visible={promptModal}
            onOk={this.handlePromptModalOpen}
            onCancel={this.handlePromptModalClose}
          >
            <p>{codeObj[code]}当前应用下的全部组件？</p>
          </Modal>
        )}
      </Fragment>
    );
  }
}
