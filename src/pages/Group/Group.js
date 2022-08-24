/* eslint-disable no-unused-expressions */
import EditGroupName from '@/components/AddOrEditGroup';
import AppDirector from '@/components/AppDirector';
import ApplicationGovernance from '@/components/ApplicationGovernance';
import NewbieGuiding from '@/components/NewbieGuiding';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import {
  Button,
  Col,
  Divider,
  Icon,
  Modal,
  notification,
  Radio,
  Row,
  Spin,
  Tooltip
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import moment from 'moment';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import AppState from '../../components/ApplicationState';
import ConfirmModal from '../../components/ConfirmModal';
import RapidCopy from '../../components/RapidCopy';
import VisterBtn from '../../components/visitBtnForAlllink';
import { batchOperation } from '../../services/app';
import cookie from '../../utils/cookie';
import globalUtil from '../../utils/global';
import rainbondUtil from '../../utils/rainbond';
import sourceUtil from '../../utils/source-unit';
import AddServiceComponent from './AddServiceComponent';
import AppJoinMode from './AppJoinMode';
import AppShape from './AppShape';
import ComponentList from './ComponentList';
import EditorTopology from './EditorTopology';
import styles from './Index.less';
// eslint-disable-next-line react/no-multi-comp
@connect(({ user, application, teamControl, enterprise, loading, global }) => ({
  buildShapeLoading: loading.effects['global/buildShape'],
  editGroupLoading: loading.effects['application/editGroup'],
  deleteLoading: loading.effects['application/delete'],
  currUser: user.currentUser,
  apps: application.apps,
  groupDetail: application.groupDetail || {},
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  novices: global.novices
}))
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      type: 'shape',
      toDelete: false,
      toEdit: false,
      toEditAppDirector: false,
      service_alias: [],
      serviceIds: [],
      linkList: [],
      jsonDataLength: 0,
      promptModal: false,
      code: '',
      size: 'large',
      currApp: {},
      rapidCopy: false,
      componentTimer: true,
      customSwitch: false,
      resources: {},
      upgradableNum: 0,
      upgradableNumLoading: true,
      appStatusConfig: false,
      guideStep: 1,
      aggregation: false,
      common: true,
      compile: false,
      flagHeight: false,
      iframeHeight: '500px'
    };
  }

  componentDidMount() {
    this.loading();
    this.handleWaitLevel();
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
  getGroupId() {
    return this.props.appID;
  }
  closeTimer = () => {
    if (this.timer) {
      clearInterval(this.timer);
    }
  };
  loading = () => {
    this.fetchAppDetail();
    this.loadTopology(true);
    this.fetchAppDetailState();
  };
  handleNewbieGuiding = info => {
    const { nextStep } = info;
    return (
      <NewbieGuiding
        {...info}
        totals={2}
        handleClose={() => {
          this.handleGuideStep('close');
        }}
        handleNext={() => {
          if (nextStep) {
            document.getElementById('scroll_div').scrollIntoView();
            this.handleGuideStep(nextStep);
          }
        }}
      />
    );
  };
  handleGuideStep = guideStep => {
    this.setState({
      guideStep
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
  // 获取总数据

  fetchAppDetail = () => {
    const { dispatch } = this.props;
    const { teamName, regionName, appID } = this.props.match.params;
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
            currApp: res.bean
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
  handleWaitLevel = () => {
    const { dispatch } = this.props;
    const { teamName, appID } = this.props.match.params;
    dispatch({
      type: 'application/fetchToupgrade',
      payload: {
        team_name: teamName,
        group_id: appID
      },
      callback: res => {
        const info = (res && res.bean) || {};
        this.setState({
          upgradableNumLoading: false,
          upgradableNum: (info && info.upgradable_num) || 0
        });
      }
    });
  };
  fetchAppDetailState = () => {
    const { dispatch } = this.props;
    const { teamName, appID } = this.props.match.params;
    dispatch({
      type: 'application/fetchAppDetailState',
      payload: {
        team_name: teamName,
        group_id: appID
      },
      callback: res => {
        this.setState({
          resources: res.list,
          appStatusConfig: true
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
  changeType = type => {
    this.setState({ type });
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
            routerRedux.replace(
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
        username: vals.username,
        logo: vals.logo,
        k8s_app: vals.k8s_app
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({ message: '修改成功' });
          dispatch({
            type: 'application/editGroups',
            payload: {
              team_name: globalUtil.getCurrTeamName(),
              group_id: this.getGroupId()
            },
            callback: res => {
              notification.success({ message: '重启应用后生效' });
            }
          });
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

  handleOpenRapidCopy = () => {
    this.setState({
      rapidCopy: true
    });
  };

  handleCloseRapidCopy = () => {
    this.setState({
      rapidCopy: false
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
  handleSizeChange = e => {
    this.setState({ size: e.target.value });
  };

  handleSwitch = () => {
    this.setState({
      customSwitch: true
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
  heightOnchage = e => {
    if (e) {
      this.setState({
        flagHeight: false,
        iframeHeight: '500px'
      });
    } else {
      this.setState({
        flagHeight: true,
        iframeHeight: '70vh'
      });
    }
  };
  render() {
    const {
      groupDetail,
      appPermissions: {
        isShare,
        isBackup,
        isUpgrade,
        isEdit,
        isDelete,
        isStart,
        isStop,
        isUpdate,
        isConstruct,
        isCopy
      },
      buildShapeLoading,
      editGroupLoading,
      deleteLoading,
      novices,
      appConfigGroupPermissions: { isAccess: isConfigGroup },
      componentPermissions,
      operationPermissions: { isAccess: isControl },
      componentPermissions: {
        isAccess: isComponentDescribe,
        isCreate: isComponentCreate,
        isConstruct: isComponentConstruct,
        isRestart
      }
    } = this.props;
    const {
      currApp,
      resources,
      rapidCopy,
      jsonDataLength,
      linkList,
      code,
      promptModal,
      toEdit,
      toEditAppDirector,
      toDelete,
      type,
      customSwitch,
      serviceIds,
      upgradableNumLoading,
      upgradableNum,
      appStatusConfig,
      guideStep,
      aggregation,
      common,
      compile,
      flagHeight,
      iframeHeight
    } = this.state;
    const codeObj = {
      start: formatMessage({id: 'appOverview.btn.start'}),
      restart: formatMessage({id: 'appOverview.list.table.restart'}),
      stop: formatMessage({id: 'appOverview.btn.stop'}),
      deploy: formatMessage({id: 'appOverview.btn.build'}),
    };
    const BtnDisabled = !(jsonDataLength > 0);
    const MR = { marginRight: '10px' };
    const pageHeaderContent = (
      <div className={styles.pageHeaderContent}>
        <div className={styles.contentl}>
          <div className={styles.conBoxt}>
            <div className={styles.contentTitle}>
              <span>{currApp.group_name || '-'}</span>
              <Icon
                style={{
                  cursor: 'pointer',
                  marginLeft: '5px'
                }}
                onClick={this.toEdit}
                type="edit"
              />
            </div>
            {resources.status && (
              <div className={styles.extraContent}>
                {resources.status !== 'CLOSED' && isUpdate && (
                  <Button
                    style={MR}
                    onClick={() => {
                      this.handleTopology('upgrade');
                    }}
                    disabled={BtnDisabled}
                  >
                    {formatMessage({id: 'appOverview.btn.update'})}
                  </Button>
                )}
                {isConstruct && isComponentConstruct && (
                  <Button
                    style={MR}
                    disabled={BtnDisabled}
                    onClick={() => {
                      this.handleTopology('deploy');
                    }}
                  >
                    {formatMessage({id: 'appOverview.btn.build'})}
                  </Button>
                )}
                {isCopy && (
                  <Button
                    style={MR}
                    disabled={BtnDisabled}
                    onClick={this.handleOpenRapidCopy}
                  >
                    {formatMessage({id: 'appOverview.btn.copy'})}
                  </Button>
                )}
                {linkList.length > 0 && <VisterBtn linkList={linkList} />}
              </div>
            )}
          </div>
          <div className={styles.content_Box}>
            {appStatusConfig && <AppState AppStatus={resources.status} />}
            {resources.status && isStart && (
              <span>
                <a
                  onClick={() => {
                    this.handleTopology('start');
                  }}
                  disabled={BtnDisabled}
                >
                  {formatMessage({id: 'appOverview.btn.start'})}
                </a>
                <Divider type="vertical" />
              </span>
            )}
            {resources.status &&
              (resources.status === 'ABNORMAL' ||
                resources.status === 'PARTIAL_ABNORMAL') &&
              serviceIds &&
              serviceIds.length > 0 &&
              isRestart && (
                <span>
                  <a
                    onClick={() => {
                      this.handleTopology('restart');
                    }}
                    disabled={BtnDisabled}
                  >
                    {formatMessage({id: 'appOverview.list.table.restart'})}
                  </a>
                  <Divider type="vertical" />
                </span>
              )}
            {isDelete && resources.status !== 'RUNNING' && (
              <a onClick={this.toDelete}>
                {formatMessage({id: 'appOverview.list.table.delete'})}
              </a>
            )}
            {resources.status && resources.status !== 'CLOSED' && isStop && (
              <span>
                {resources.status !== 'RUNNING' && <Divider type="vertical" />}
                <a
                  onClick={() => {
                    this.handleTopology('stop');
                  }}
                >
                  {formatMessage({id: 'appOverview.btn.stop'})}
                </a>
              </span>
            )}
          </div>
          <div className={styles.connect_Bot}>
            <div className={styles.connect_Box}>
              <div className={styles.connect_Boxs}>
                <div>{formatMessage({id: 'appOverview.memory'})}</div>
                <div>{`${sourceUtil.unit(resources.memory || 0, 'MB')}`}</div>
              </div>
              <div className={styles.connect_Boxs}>
                <div>{formatMessage({id: 'appOverview.cpu'})}</div>
                <div>{(resources.cpu && resources.cpu / 1000) || 0}Core</div>
              </div>
            </div>
            <div className={styles.connect_Box}>
              <div className={styles.connect_Boxs}>
                <div>{formatMessage({id: 'appOverview.disk'})}</div>
                <div>{`${sourceUtil.unit(resources.disk || 0, 'KB')}`}</div>
              </div>
              <div className={styles.connect_Boxs}>
                <div>{formatMessage({id: 'appOverview.componentNum'})}</div>
                <div>{currApp.service_num || 0}</div>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.contentr}>
          <div className={styles.conrHeader}>
            <div>
              <span>{formatMessage({id: 'appOverview.createTime'})}</span>
              <span>
                {currApp.create_time
                  ? moment(currApp.create_time)
                      .locale('zh-cn')
                      .format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </span>
            </div>
            <div>
              <span>{formatMessage({id: 'appOverview.updateTime'})}</span>
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
              <span>{formatMessage({id: 'appOverview.govern'})}</span>
              <span>
                {currApp.governance_mode
                  ? globalUtil.fetchGovernanceMode(currApp.governance_mode)
                  : '-'}
              </span>
              {currApp.governance_mode && isEdit && (
                <a style={{ marginLeft: '5px' }} onClick={this.handleSwitch}>
                  {formatMessage({id: 'appOverview.btn.change'})}
                </a>
              )}
            </div>

            <div>
              <span>{formatMessage({id: 'appOverview.principal'})}</span>
              <span>
                {currApp.principal ? (
                  <Tooltip
                    placement="top"
                    title={
                      <div>
                        <div>{formatMessage({id: 'appOverview.principal.username'})}{currApp.username}</div>
                          <div>{formatMessage({id: 'appOverview.principal.principal'})}{currApp.principal}</div>
                          <div>{formatMessage({id: 'appOverview.principal.email'})}{currApp.email}</div>
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
            <div className={styles.conrBox}>
              <div>{formatMessage({id: 'appOverview.backups'})}</div>
              <div
                onClick={() => {
                  isBackup && this.handleJump('backup');
                }}
              >
                <a>{currApp.backup_num || 0}</a>
              </div>
            </div>

            <div className={styles.conrBox}>
              <div>{formatMessage({id: 'appOverview.modelRelease'})}</div>
              <div
                onClick={() => {
                  isShare && this.handleJump('publish');
                }}
              >
                <a>{currApp.share_num || 0}</a>
              </div>
            </div>

            <div className={styles.conrBox}>
              <div>{formatMessage({id: 'appOverview.gateway'})}</div>
              <div
                onClick={() => {
                  isControl && this.handleJump('gateway');
                }}
              >
                <a>{currApp.ingress_num || 0}</a>
              </div>
            </div>

            <div className={styles.conrBox}>
              <div>{formatMessage({id: 'appOverview.upgrade'})}</div>
              <div
                onClick={() => {
                  !upgradableNumLoading &&
                    isUpgrade &&
                    this.handleJump('upgrade');
                }}
              >
                <a>{upgradableNumLoading ? <Spin /> : upgradableNum}</a>
              </div>
            </div>

            <div className={styles.conrBox}>
              <div>{formatMessage({id: 'appOverview.config'})}</div>
              <div
                onClick={() => {
                  isConfigGroup && this.handleJump('configgroups');
                }}
              >
                <a>{currApp.config_group_num || 0}</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
    const pageHeaderContents = (
      <div className={styles.pageHeaderContents}>
        <div className={styles.contentl}>
          <div className={styles.conBoxt}>
            <div className={styles.contentTitle}>
              <span>{currApp.group_name || '-'}</span>
              <Icon
                style={{
                  cursor: 'pointer',
                  marginLeft: '5px'
                }}
                onClick={this.toEdit}
                type="edit"
              />
            </div>
            <div className={styles.content_Box}>
              {appStatusConfig && <AppState AppStatus={resources.status} />}
              {resources.status && isStart && (
                <span>
                  <a
                    onClick={() => {
                      this.handleTopology('start');
                    }}
                    disabled={BtnDisabled}
                  >
                    {formatMessage({id: 'appOverview.btn.start'})}
                  </a>
                  <Divider type="vertical" />
                </span>
              )}
              {resources.status &&
                (resources.status === 'ABNORMAL' ||
                  resources.status === 'PARTIAL_ABNORMAL') &&
                serviceIds &&
                serviceIds.length > 0 &&
                isRestart && (
                  <span>
                    <a
                      onClick={() => {
                        this.handleTopology('restart');
                      }}
                      disabled={BtnDisabled}
                    >
                      {formatMessage({id: 'appOverview.list.table.restart'})}
                    </a>
                    <Divider type="vertical" />
                  </span>
                )}
              {isDelete && resources.status !== 'RUNNING' && (
                <a onClick={this.toDelete}>
                  {formatMessage({id: 'appOverview.list.table.delete'})}
                </a>
              )}
              {resources.status && resources.status !== 'CLOSED' && isStop && (
                <span>
                  {resources.status !== 'RUNNING' && (
                    <Divider type="vertical" />
                  )}
                  <a
                    onClick={() => {
                      this.handleTopology('stop');
                    }}
                  >
                    {formatMessage({id: 'appOverview.btn.stop'})}
                  </a>
                </span>
              )}
            </div>
            {resources.status && (
              <div className={styles.extraContent}>
                {resources.status !== 'CLOSED' && isUpdate && (
                  <Button
                    style={MR}
                    onClick={() => {
                      this.handleTopology('upgrade');
                    }}
                    disabled={BtnDisabled}
                  >
                    {formatMessage({id: 'appOverview.btn.update'})}
                  </Button>
                )}
                {isConstruct && isComponentConstruct && (
                  <Button
                    style={MR}
                    disabled={BtnDisabled}
                    onClick={() => {
                      this.handleTopology('deploy');
                    }}
                  >
                    {formatMessage({id: 'appOverview.btn.build'})}
                  </Button>
                )}
                {isCopy && (
                  <Button
                    style={MR}
                    disabled={BtnDisabled}
                    onClick={this.handleOpenRapidCopy}
                  >
                    {formatMessage({id: 'appOverview.btn.copy'})}
                  </Button>
                )}
                {linkList.length > 0 && <VisterBtn linkList={linkList} />}
              </div>
            )}
          </div>
        </div>
        <div className={styles.contentr}>
          <div className={styles.conrHeader}>
            <div>
              <span>{formatMessage({id: 'appOverview.createTime'})}</span>
              <span>
                {currApp.create_time
                  ? moment(currApp.create_time)
                      .locale('zh-cn')
                      .format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </span>
            </div>
            <div>
              <span>{formatMessage({id: 'appOverview.updateTime'})}</span>
              <span>
                {currApp.update_time
                  ? moment(currApp.update_time)
                      .locale('zh-cn')
                      .format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    const highlighted = {
      position: 'relative',
      zIndex: 1000,
      padding: '0 16px',
      margin: '0 -16px',
      background: '#fff'
    };
    const isScrollDiv = rainbondUtil.handleNewbie(novices, 'applicationInfo');
    return (
      <Fragment>
        <Row style={isScrollDiv && guideStep === 1 ? highlighted : {}}>
          {flagHeight ? pageHeaderContents : pageHeaderContent}
        </Row>
        {guideStep === 1 &&
          this.handleNewbieGuiding({
            tit: '应用信息',
            showSvg: false,
            showArrow: true,
            send: false,
            configName: 'applicationInfo',
            desc:
              '应用由一个或多个服务组成，可以管理一个完整业务系统，比如：OA、CRM、ERP等，也可以管理一个完整的微服务架构的系统，这里展示了应用的基本信息。',
            nextStep: 2,
            conPosition: { top: '336px', left: '42%' }
          })}
        {customSwitch && (
          <ApplicationGovernance
            mode={currApp && currApp.governance_mode}
            appID={this.getGroupId()}
            onCancel={this.onCancel}
            onOk={this.fetchAppDetail}
          />
        )}
        <Row className={styles.rowArrow} style={ guideStep === 2 ? highlighted : {} }>
          <div
            className={styles.iconBox}
            onClick={() => {
              this.heightOnchage(flagHeight);
            }}
          >
            {flagHeight ? (
              <div className={styles.showOrhide}>
                <DownOutlined />
              </div>
            ) : (
              <div className={styles.showOrhide}>
                <UpOutlined />
              </div>
            )}
          </div>
          <Row
            style={{
              display: 'flex',
              background: '#FFFFFF',
              height: '60px',
              alignItems: 'center',
              borderBottom: '1px solid #e8e8e8'
            }}
          >
            <Col span={5} style={{ paddingleft: '12px' }}>
              <a
                onClick={() => {
                  this.changeType('shape');
                  this.setState({
                    aggregation: false,
                    common: true,
                    compile: false
                  });
                }}
                style={{
                  marginLeft: '30px',
                  color: type !== 'list' ? '#1890ff' : 'rgba(0, 0, 0, 0.65)'
                }}
              >
                {formatMessage({id: 'appOverview.topology'})}
              </a>
              {isComponentDescribe && (
                <a
                  onClick={() => {
                    this.changeType('list');
                  }}
                  style={{
                    marginLeft: '30px',
                    color: type === 'list' ? '#1890ff' : 'rgba(0, 0, 0, 0.65)'
                  }}
                >
                  {formatMessage({id: 'appOverview.list'})}
                </a>
              )}
            </Col>
            <Col
              className={styles.topoBtn}
              span={11}
              style={{ paddingleft: '12px' }}
            >
              {type !== 'list' && isComponentCreate && (
                <Radio.Group>
                  {common ? (
                    <Radio.Button
                    style={{ 
                      width:'70px', textAlign:'center', height:'32px', 
                      lineHeight:'32px', fontSize:'13px',padding:'0px',background:'#4C73B0',
                      color:'#F6F7FA', borderColor: '#4C73B0'
                    }}
                      onClick={() => {
                        this.changeType('shape');
                        this.setState({
                          aggregation: false,
                          common: true,
                          compile: false
                        });
                      }}
                      disabled
                    >
                      {formatMessage({id: 'appOverview.btn.ordinary'})}
                    </Radio.Button>
                  ) : (
                    <Radio.Button
                    style={{ 
                      width:'70px', textAlign:'center', height:'32px', 
                      lineHeight:'32px', fontSize:'13px',padding:'0px',background:'#fff',
                      color:'#595959', borderColor: '#D9D9D9',
                    }}

                      onClick={() => {
                        this.changeType('shape');
                        this.setState({
                          aggregation: false,
                          common: true,
                          compile: false
                        });
                      }}
                    >
                      {formatMessage({id: 'appOverview.btn.ordinary'})}
                    </Radio.Button>
                  )}
                  {aggregation ? (
                    <Radio.Button
                    style={{ 
                      width:'70px', textAlign:'center', height:'32px', 
                      lineHeight:'32px', fontSize:'13px',padding:'0px',background:'#4C73B0',
                      color:'#F6F7FA', borderColor: '#4C73B0'
                    }}
                      onClick={() => {
                        this.changeType('aggregation');
                        this.setState({
                          aggregation: true,
                          common: false,
                          compile: false
                        });
                      }}
                      disabled
                    >
                      {formatMessage({id: 'appOverview.btn.aggregation'})}
                    </Radio.Button>
                  ) : (
                    <Radio.Button
                    style={{ 
                      width:'70px', textAlign:'center', height:'32px', 
                      lineHeight:'32px', fontSize:'13px',padding:'0px',background:'#fff',
                      color:'#595959', borderColor: '#D9D9D9'
                    }}
                      onClick={() => {
                        this.changeType('aggregation');
                        this.setState({
                          aggregation: true,
                          common: false,
                          compile: false
                        });
                      }}
                    >
                      {formatMessage({id: 'appOverview.btn.aggregation'})}
                    </Radio.Button>
                  )}
                  {compile ? (
                    <Radio.Button
                    style={{ 
                      width:'70px', textAlign:'center', height:'32px', 
                      lineHeight:'32px', fontSize:'13px',padding:'0px',background:'#4C73B0',
                      color:'#F6F7FA', borderColor: '#4C73B0'
                    }}

                      onClick={() => {
                        this.changeType('shapes');
                        this.setState({
                          aggregation: false,
                          common: false,
                          compile: true
                        });
                      }}
                      disabled
                    >
                     {formatMessage({id: 'appOverview.btn.arrange'})}
                    </Radio.Button>
                  ) : (
                    <Radio.Button
                    style={{ 
                      width:'70px', textAlign:'center', height:'32px', 
                      lineHeight:'32px', fontSize:'13px',padding:'0px',background:'#fff',
                      color:'#595959', borderColor: '#D9D9D9'
                    }}
                      onClick={() => {
                        this.changeType('shapes');
                        this.setState({
                          aggregation: false,
                          common: false,
                          compile: true
                        });
                      }}
                    >
                      {formatMessage({id: 'appOverview.btn.arrange'})}
                    </Radio.Button>
                  )}
                </Radio.Group>
              )}
            </Col>
            <Col span={4} style={{ textAlign: 'right' }}>
              {/* {isComponentCreate && isComponentConstruct && (
                <AddThirdParty
                  groupId={this.getGroupId()}
                  refreshCurrent={() => {
                    this.loading();
                  }}
                  onload={() => {
                    this.setState({ type: 'spin' }, () => {
                      this.setState({
                        type: this.state.size == 'large' ? 'shape' : 'list'
                      });
                    });
                  }}
                />
              )} */}
            </Col>
            <Col span={4} style={{ textAlign: 'center' }}>
              {isComponentCreate && isComponentConstruct && (
                <AddServiceComponent
                  groupId={this.getGroupId()}
                  refreshCurrent={() => {
                    this.loading();
                  }}
                  onload={() => {
                    this.setState({ type: 'spin' }, () => {
                      this.setState({
                        type: this.state.size == 'large' ? 'shape' : 'list'
                      });
                    });
                  }}
                />
              )}
            </Col>
          </Row>
          {rapidCopy && (
            <RapidCopy
              copyFlag={true}
              on={this.handleCloseRapidCopy}
              onCancel={this.handleCloseRapidCopy}
              title={formatMessage({id:'confirmModal.app.title.copy'})}
            />
          )}

          {type === 'list' && (
            <ComponentList
              componentPermissions={componentPermissions}
              groupId={this.getGroupId()}
            />
          )}
          {type === 'shape' && (
            <AppShape
              style={{ height: iframeHeight }}
              group_id={this.getGroupId()}
              flagHeight={flagHeight}
              iframeHeight={iframeHeight}
            />
          )}
          {type === 'aggregation' && (
            <AppJoinMode
              group_id={this.getGroupId()}
              flagHeight={flagHeight}
              iframeHeight={iframeHeight}
            />
          )}
          {type === 'spin' && <Spin />}
          {type === 'shapes' && (
            <EditorTopology
              changeType={types => {
                this.changeType(types);
              }}
              key={iframeHeight}
              iframeHeight={iframeHeight}
              group_id={this.getGroupId()}
              flagHeight={flagHeight}
            />
          )}
        </Row>
        {guideStep === 2 &&
          this.handleNewbieGuiding({
            tit: '应用拓扑图',
            btnText: '已知晓',
            showSvg: false,
            showArrow: true,
            send: true,
            configName: 'applicationInfo',
            desc:
              '这是应用内部的服务拓扑图，通过拓扑图可以整体了解服务的运行状态和依赖关系，每个六边形就是一个服务，点击六边形可以进入服务的管理页面。',
            nextStep: 3,
            conPosition: { bottom: '-16px', left: '45%' }
          })}
        {isScrollDiv && <div id="scroll_div" style={{ marginTop: '180px' }} />}

        {toDelete && (
          <ConfirmModal
            title={formatMessage({id:'confirmModal.app.title.delete'})}
            desc={formatMessage({id:'confirmModal.app.delete.desc'})}
            subDesc={formatMessage({id:'confirmModal.delete.strategy.subDesc'})}
            loading={deleteLoading}
            onOk={this.handleDelete}
            onCancel={this.cancelDelete}
          />
        )}
        {toEdit && (
          <EditGroupName
            isAddGroup={false}
            group_name={groupDetail.group_name}
            logo={groupDetail.logo}
            note={groupDetail.note}
            loading={editGroupLoading}
            k8s_app={groupDetail.k8s_app}
            title={formatMessage({id:'confirmModal.app.title.edit'})}
            onCancel={this.cancelEdit}
            onOk={this.handleEdit}
            isEditEnglishName={currApp.can_edit}
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
            title={formatMessage({id:'confirmModal.friendly_reminder.title'})}
            confirmLoading={buildShapeLoading}
            visible={promptModal}
            onOk={this.handlePromptModalOpen}
            onCancel={this.handlePromptModalClose}
          >
            <p>{formatMessage({id:'confirmModal.friendly_reminder.pages.desc'},{codeObj: codeObj[code]})}</p>
          </Modal>
        )}
      </Fragment>
    );
  }
}
