/* eslint-disable no-unused-expressions */
import {
  Button,
  Col,
  Divider,
  Icon,
  Modal,
  notification,
  Row,
  Spin,
  Badge
} from 'antd';
import { connect } from 'dva';
import moment from 'moment';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { batchOperation } from '../../services/app';
import ConfirmModal from '../../components/ConfirmModal';
import RapidCopy from '../../components/RapidCopy';
import VisterBtn from '../../components/visitBtnForAlllink';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import ApplicationGovernance from '@/components/ApplicationGovernance';
import EditGroupName from '@/components/AddOrEditGroup';
import AppDirector from '@/components/AppDirector';
import sourceUtil from '../../utils/source-unit';
import {
  createApp,
  createEnterprise,
  createTeam
} from '../../utils/breadcrumb';
import cookie from '../../utils/cookie';
import globalUtil from '../../utils/global';
import roleUtil from '../../utils/role';
import AddServiceComponent from './AddServiceComponent';
import AddThirdParty from './AddThirdParty';
import AppShape from './AppShape';
import ComponentList from './ComponentList';
import EditorTopology from './EditorTopology';
import styles from './Index.less';

// eslint-disable-next-line react/no-multi-comp
@connect(({ user, application, teamControl, enterprise, loading }) => ({
  buildShapeLoading: loading.effects['global/buildShape'],
  editGroupLoading: loading.effects['application/editGroup'],
  deleteLoading: loading.effects['application/delete'],
  currUser: user.currentUser,
  apps: application.apps,
  groupDetail: application.groupDetail || {},
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise
}))
class Main extends PureComponent {
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
      loadingDetail: true,
      rapidCopy: false,
      componentTimer: true,
      customSwitch: false,
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
      callback: (res) => {
        if (res && res._code == 200) {
          const data = res.bean;
          if (JSON.stringify(data) === '{}') {
            return;
          }
          const serviceIds = [];
          const service_alias = [];
          const { json_data } = data;
          Object.keys(json_data).map((key) => {
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
      callback: (res) => {
        if (res && res._code === 200) {
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
      handleError: (err) => {
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
  handleError = (err) => {
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
      callback: (res) => {
        if (res && res._code === 200) {
          this.setState({
            currApp: res.bean,
            loadingDetail: false
          });
        }
      },
      handleError: (res) => {
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
    dispatch({
      type: 'application/fetchAppDetailState',
      payload: {
        team_name: teamName,
        group_id: appID
      },
      callback: (res) => {
        this.setState({
          resources: res.list
        });
      }
    });
  };

  handleFormReset = () => {
    const { form } = this.props;
    form.resetFields();
    this.loadApps();
  };
  handleSearch = (e) => {
    e.preventDefault();
    this.loadApps();
  };
  changeType = (type) => {
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
      callback: (res) => {
        if (res && res._code == 200) {
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

  newAddress = (grid) => {
    this.props.dispatch({
      type: 'global/fetchGroups',
      payload: {
        team_name: globalUtil.getCurrTeamName()
      },
      callback: (list) => {
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
  handleEdit = (vals) => {
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
      callback: () => {
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
  handleTopology = (code) => {
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
      }).then((res) => {
        if (res && res._code === 200) {
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
        callback: (res) => {
          if (res && res._code === 200) {
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
  handleSizeChange = (e) => {
    this.setState({ size: e.target.value });
  };

  handleSwitch = () => {
    this.setState({
      customSwitch: true
    });
  };

  handleJump = (target) => {
    const { dispatch, appID } = this.props;
    dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${appID}/${target}`
      )
    );
  };
  render() {
    const {
      groupDetail,
      appID,
      currentEnterprise,
      currentTeam,
      currentRegionName,
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
      loadingDetail,
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
      serviceIds
    } = this.state;
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
    const MR = { marginRight: '10px' };

    const pageHeaderContent = (
      <div className={styles.pageHeaderContent}>
        <div className={styles.contentl}>
          <div className={styles.conBoxt}>
            <div className={styles.contentTitle}>
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
                    更新
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
                    构建
                  </Button>
                )}
                {isCopy && (
                  <Button
                    style={MR}
                    disabled={BtnDisabled}
                    onClick={this.handleOpenRapidCopy}
                  >
                    快速复制
                  </Button>
                )}
                {linkList.length > 0 && <VisterBtn linkList={linkList} />}
              </div>
            )}
          </div>
          <div className={styles.content_Box}>
            <Badge
              className={styles.states}
              status={appStateColor[resources.status] || 'default'}
              text={appState[resources.status] || '-'}
            />
            {resources.status && isStart && (
              <span>
                <a
                  onClick={() => {
                    this.handleTopology('start');
                  }}
                  disabled={BtnDisabled}
                >
                  启动
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
                    重启
                  </a>
                  <Divider type="vertical" />
                </span>
              )}
            {isDelete && resources.status !== 'RUNNING' && (
              <a onClick={this.toDelete}>删除</a>
            )}
            {resources.status && resources.status !== 'CLOSED' && isStop && (
              <span>
                {resources.status !== 'RUNNING' && <Divider type="vertical" />}
                <a
                  onClick={() => {
                    this.handleTopology('stop');
                  }}
                >
                  停用
                </a>
              </span>
            )}
          </div>
          <div className={styles.connect_Bot}>
            <div className={styles.connect_Box}>
              <div className={styles.connect_Boxs}>
                <div>使用内存</div>
                <div>{`${sourceUtil.unit(resources.memory || 0, 'MB')}`}</div>
              </div>
              <div className={styles.connect_Boxs}>
                <div>使用CPU</div>
                <div>{(resources.cpu && resources.cpu / 1000) || 0}Core</div>
              </div>
            </div>
            <div className={styles.connect_Box}>
              <div className={styles.connect_Boxs}>
                <div>使用磁盘</div>
                <div>{`${sourceUtil.unit(resources.disk || 0, 'MB')}`}</div>
              </div>
              <div className={styles.connect_Boxs}>
                <div>组件数量</div>
                <div>{currApp.service_num || 0}</div>
              </div>
            </div>
          </div>
        </div>
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
              <span>治理模式</span>
              <span>
                {currApp.governance_mode
                  ? globalUtil.fetchGovernanceMode(currApp.governance_mode)
                  : '-'}
              </span>
              {currApp.governance_mode && isEdit && (
                <a style={{ marginLeft: '5px' }} onClick={this.handleSwitch}>
                  切换
                </a>
              )}
            </div>

            <div>
              <span>负责人</span>
              <span>
                {currApp.principal || '-'}
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
              <div>备份</div>
              <div
                onClick={() => {
                  isBackup && this.handleJump('backup');
                }}
              >
                <a>{currApp.backup_num || 0}</a>
              </div>
            </div>

            <div className={styles.conrBox}>
              <div>模型发布</div>
              <div
                onClick={() => {
                  isShare && this.handleJump('publish');
                }}
              >
                <a>{currApp.share_num || 0}</a>
              </div>
            </div>

            <div className={styles.conrBox}>
              <div>网关策略</div>
              <div
                onClick={() => {
                  isControl && this.handleJump('gateway');
                }}
              >
                <a>{currApp.ingress_num || 0}</a>
              </div>
            </div>

            <div className={styles.conrBox}>
              <div>待升级</div>
              <div
                onClick={() => {
                  isUpgrade && this.handleJump('upgrade');
                }}
              >
                <a>{currApp.upgradable_num || 0}</a>
              </div>
            </div>

            <div className={styles.conrBox}>
              <div>配置组</div>
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
    let breadcrumbList = [];
    breadcrumbList = createApp(
      createTeam(
        createEnterprise(breadcrumbList, currentEnterprise),
        currentTeam,
        currentRegionName
      ),
      currentTeam,
      currentRegionName,
      { appName: groupDetail.group_name, appID: groupDetail.app_id }
    );
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    return (
      <PageHeaderLayout breadcrumbList={breadcrumbList} loading={loadingDetail}>
        <Row>{pageHeaderContent}</Row>
        {customSwitch && (
          <ApplicationGovernance
            mode={currApp && currApp.governance_mode}
            appID={this.getGroupId()}
            onCancel={this.onCancel}
            onOk={this.fetchAppDetail}
          />
        )}
        <Row
          style={{
            display: 'flex',
            background: '#FFFFFF',
            height: '60px',
            alignItems: 'center',
            borderBottom: '1px solid #e8e8e8'
          }}
        >
          <Col span={16} style={{ paddingleft: '12px' }}>
            <a
              onClick={() => {
                this.changeType('shape');
              }}
              style={{
                marginLeft: '30px',
                color: type !== 'list' ? '#1890ff' : 'rgba(0, 0, 0, 0.65)'
              }}
            >
              拓扑图
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
                列表
              </a>
            )}
          </Col>

          <Col span={4} style={{ textAlign: 'right' }}>
            {isComponentCreate && isComponentConstruct && (
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
            )}
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
            on={this.handleCloseRapidCopy}
            onCancel={this.handleCloseRapidCopy}
            title="应用复制"
          />
        )}

        {type !== 'list' && isComponentCreate && (
          <Row
            style={{
              textAlign: 'right',
              paddingTop: '16px',
              paddingRight: '20px',
              background: '#fff'
            }}
          >
            {type === 'shapes' ? (
              <a
                onClick={() => {
                  this.changeType('shape');
                }}
              >
                切换到展示模式
              </a>
            ) : (
              <a
                onClick={() => {
                  this.changeType('shapes');
                }}
              >
                切换到编辑模式
              </a>
            )}
          </Row>
        )}

        {type === 'list' && (
          <ComponentList
            componentPermissions={componentPermissions}
            groupId={this.getGroupId()}
          />
        )}
        {type === 'shape' && <AppShape group_id={this.getGroupId()} />}
        {type === 'spin' && <Spin />}
        {type === 'shapes' && (
          <EditorTopology
            changeType={(types) => {
              this.changeType(types);
            }}
            group_id={this.getGroupId()}
          />
        )}
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
            principal={currApp.principal}
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
      </PageHeaderLayout>
    );
  }
}

// eslint-disable-next-line react/no-multi-comp
@connect(
  ({ user, teamControl }) => ({
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
    currUser: user.currentUser
  }),
  null,
  null,
  {
    pure: false
  }
)
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      operationPermissions: this.handlePermissions('queryControlInfo'),
      appPermissions: this.handlePermissions('queryAppInfo'),
      appConfigGroupPermissions: this.handlePermissions(
        'queryAppConfigGroupInfo'
      ),
      componentPermissions: this.handlePermissions('queryComponentInfo')
    };
  }
  componentWillMount() {
    const { dispatch } = this.props;
    const {
      appPermissions: { isAccess }
    } = this.state;
    if (!isAccess) {
      globalUtil.withoutPermission(dispatch);
    }
  }
  getGroupId() {
    const { params } = this.props.match;
    return params.appID;
  }
  handlePermissions = (type) => {
    const { currentTeamPermissionsInfo } = this.props;
    return roleUtil.querySpecifiedPermissionsInfo(
      currentTeamPermissionsInfo,
      type
    );
  };

  render() {
    return (
      <Main
        key={this.getGroupId()}
        appID={this.getGroupId()}
        {...this.props}
        {...this.state}
      />
    );
  }
}
