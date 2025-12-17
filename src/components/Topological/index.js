/* eslint-disable func-names */
import {
  Alert,
  Badge,
  Button,
  Divider,
  Form,
  Icon,
  Input,
  Modal,
  notification,
  Radio,
  Select,
  Tooltip
} from 'antd';
import { connect } from 'dva';
import { routerRedux, Link } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import apiconfig from '../../../config/api.config';
import ConfirmModal from '../ConfirmModal'
import globalUtil from '../../utils/global';
import roleUtil from '../../utils/role';
import dateUtil from '../../utils/date-util';
import regionUtil from '../../utils/region';
import teamUtil from '../../utils/team';
import userUtil from '../../utils/user';
import list from '@/models/list';
import styless from '../../components/CreateTeam/index.less';
import { addRelationedApp, removeRelationedApp } from '../../services/app';
import styles from './index.less'
@connect(
  ({ user, appControl, global, teamControl, enterprise, loading }) => ({
    currUser: user.currentUser,
    appDetail: appControl.appDetail,
    pods: appControl.pods,
    groups: global.groups,
    build_upgrade: appControl.build_upgrade,
    currentTeam: teamControl.currentTeam,
    currentRegionName: teamControl.currentRegionName,
    currentEnterprise: enterprise.currentEnterprise,
    deleteAppLoading: loading.effects['appControl/deleteApp'],
    reStartLoading: loading.effects['appControl/putReStart'],
    startLoading: loading.effects['appControl/putStart'],
    stopLoading: loading.effects['appControl/putStop'],
    moveGroupLoading: loading.effects['appControl/moveGroup'],
    editNameLoading: loading.effects['appControl/editName'],
    updateRollingLoading: loading.effects['appControl/putUpdateRolling'],
    deployLoading:
      loading.effects[('appControl/putDeploy', 'appControl/putUpgrade')],
    buildInformationLoading: loading.effects['appControl/getBuildInformation']
  }),
  null,
  null,
  { withRef: true }
)
class Index extends React.Component {
  state = {
    flag: false,
    appAlias: '',
    promptModal: null,
    closes: false,
    start: false,
    updated: false,
    actionIng: false,
    keyes: false,
    srcUrl: `/static/www/weavescope-topolog/index.html`,
    teamName: '',
    regionName: '',
    build: false,
  }
  componentWillMount() {
    const that = this
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    const { group_id: groupId, dispatch, apps } = this.props;
    const appID = globalUtil.getAppID();
    const componentID = globalUtil.getSlidePanelComponentID();
    const timestamp = new Date().getTime();
    const topologicalAddress = `${apiconfig.baseUrl}/console/teams/${teamName}/regions/${regionName}/topological?group_id=${groupId}`;
    try {
      window.iframeGetNodeUrl = function () {
        return topologicalAddress;
      };
      window.iframeGetMonitor = function (fn, errcallback) {
        dispatch({
          type: 'application/groupMonitorData',
          payload: {
            team_name: teamName,
            group_id: groupId,
          },
          callback: data => {
            if (data && fn) {
              fn(data);
            }
          },
          handleError: (err) => {
            if (errcallback) {
              errcallback(err)
            }
          }
        });
        return topologicalAddress;
      };
      window.getServiceAlias = function () {
        return componentID;
      };
      window.clickBackground = function () {
        dispatch(
          routerRedux.push(
            `/team/${teamName}/region/${regionName}/apps/${appID}/overview`
          )
        )
      };
      window.clickNode = function (nodeid, componentID) {
        if (nodeid == 'The Internet') {
          dispatch(
            routerRedux.push(
              `/team/${teamName}/region/${regionName}/apps/${appID}/overview?type=gateway`
            )
          )
        } else {
          const app = apps.find(app => app.service_alias === componentID);
          if (app?.status === "creating" && app.service_source !== 'kubeblocks') {
            dispatch(
              routerRedux.push(
                `/team/${teamName}/region/${regionName}/create/create-check/${componentID}`
              )
            )
          } else {
            dispatch(
              routerRedux.push(
                `/team/${teamName}/region/${regionName}/apps/${appID}/overview?type=components&componentID=${componentID}&tab=overview`
              )
            )
          }

        }
      }
      window.iframeGetTenantName = function () {
        return teamName;
      };

      window.iframeGetRegion = function () {
        return regionName;
      };

      window.iframeGetGroupId = function () {
        return groupId;
      };
      // 拓扑图点击服务事件
      window.handleClickService = function (nodeDetails) {
        dispatch(
          // 跳转组件
          routerRedux.push(
            `/team/${teamName}/region/${regionName}/components/${nodeDetails.service_alias}/overview`
          )
        );
      };
      // 拓扑图点击依赖服务事件
      window.handleClickRelation = function (relation) {
        dispatch(
          routerRedux.push(
            `/team/${teamName}/region/${regionName}/components/${relation.service_alias}/overview`
          )
        );
      };
      // 拓扑图点击终端弹出事件
      window.handleClickTerminal = function (relation) {
        that.setState({
          teamName: teamName,
          regionName: regionName,
          appAlias: relation.service_alias,
        })
        const link = document.getElementById('links').click()
      };

      // 拓扑图点击构建事件
      window.handleClickBuild = function (relation, detailes) {
        if (relation == 'build') {
          that.setState({
            closes: false,
            start: false,
            updated: false,
            build: true,
            appAlias: detailes.service_alias,
            promptModal: 'build'
          })
        }
      }
      // 拓扑图点击更新事件
      window.handleClickUpdate = function (relation, detailes) {
        if (relation == 'update') {
          that.setState({
            closes: false,
            start: false,
            updated: true,
            appAlias: detailes.service_alias,
            promptModal: 'rolling'
          })
        }
      }
      // 拓扑图点击关闭事件
      window.handleClickCloses = function (relation, detailes) {
        if (relation == 'closes') {
          that.setState({
            closes: true,
            start: false,
            updated: false,
            appAlias: detailes.service_alias,
            promptModal: 'stop',
            // keyes: !that.state.keyes,
            // srcUrl: that.state.srcUrl
          })
        }
      }
      // 拓扑图点击启动事件
      window.handleClickStart = function (relation, detailes) {
        if (relation == 'start') {
          that.setState({
            start: true,
            closes: false,
            updated: false,
            appAlias: detailes.service_alias,
            promptModal: 'start',
            // keyes: !that.state.keyes,
            // srcUrl: that.state.srcUrl
          })
        }
      }
      // 拓扑图点击删除事件
      window.handleClickDelete = function (relation, detailes) {
        if (relation == 'deleteApp') {
          that.setState({
            flag: true,
            appAlias: detailes.service_alias
          })
        }
      }

      // 添加连线创建的处理函数
      window.onEdgeCreated = function (edgeData) {

        const {
          sourceNodeId,
          targetNodeId,
          sourceServiceAlias,
          targetServiceAlias,
          sourceServiceCname,
          targetServiceCname,
          sourceShape,
          targetShape
        } = edgeData;


        // 从互联网到组件：开启对外端口
        if (sourceNodeId === 'The Internet') {
          dispatch({
            type: 'appControl/openExternalPort',
            payload: {
              team_name: teamName,
              app_alias: targetServiceAlias,
              container_port: '',
              open_outer: ''
            },
            callback: (res) => {
              if (res && res.status_code === 200) {
                notification.success({ message: res.msg_show || '对外端口开启成功' });
                that.refreshFrame();
              } else if (res && res.status_code === 201) {
                if (res.list && res.list.length > 0) {
                  dispatch({
                    type: 'appControl/openExternalPort',
                    payload: {
                      team_name: teamName,
                      app_alias: targetServiceAlias,
                      container_port: res.list[0],
                      open_outer: true
                    },
                    callback: (portRes) => {
                      if (portRes && portRes.status_code === 200) {
                        notification.success({ message: `成功开启端口 ${res.list[0]}` });
                        that.refreshFrame();
                      }
                    }
                  });
                }
              }
            }
          });
          return;
        }

        // 组件到互联网：不支持
        if (targetNodeId === 'The Internet') {
          notification.warning({ message: '不支持从组件连接到互联网节点' });
          dispatch(
            routerRedux.push(
              `/team/${teamName}/region/${regionName}/apps/${appID}/overview?refresh=${timestamp}`
            )
          );
          return;
        }

        // 组件间连线：创建依赖关系
        // 直接调用 service 函数，而不是通过 dva dispatch
        addRelationedApp({
          team_name: teamName,
          app_alias: sourceServiceAlias,
          dep_service_id: targetNodeId
        }).then(res => {

          if (res && res.status_code === 200) {
            notification.success({ message: formatMessage({ id: 'notification.success.Depend_add' }) });
            dispatch(
              routerRedux.push(
                `/team/${teamName}/region/${regionName}/apps/${appID}/overview?refresh=${timestamp}`
              )
            );

            // 检查是否需要更新组件
            if (sourceShape !== 'undeploy' && sourceShape !== 'closed' && sourceShape !== 'stopping') {
              Modal.confirm({
                title: formatMessage({ id: 'notification.success.Depend_add_need_update' }),
                okText: formatMessage({ id: 'button.update' }),
                onOk: () => {
                  dispatch({
                    type: 'appControl/putUpdateRolling',
                    payload: { team_name: teamName, app_alias: sourceServiceAlias }
                  });
                }
              });
            }
          } else if (res && res.status_code === 201) {
            // 需要选择端口
            if (res.list && res.list.length > 0) {
              addRelationedApp({
                team_name: teamName,
                app_alias: sourceServiceAlias,
                dep_service_id: targetNodeId,
                open_inner: true,
                container_port: res.list[0]
              }).then(portRes => {
                if (portRes && portRes.status_code === 200) {
                  notification.success({ message: formatMessage({ id: 'notification.success.Depend_add' }) });
                  dispatch(
                    routerRedux.push(
                      `/team/${teamName}/region/${regionName}/apps/${appID}/overview?refresh=${timestamp}`
                    )
                  );
                }
              });
            }
          } else if (res && res.status_code === 212) {
            notification.warning({ message: res.msg_show || '当前应用已被关联' });
          } else {
            notification.error({ message: '创建依赖失败' });
          }
        }).catch(err => {
          notification.error({ message: '网络错误，请稍后重试' });
        });

      };

      // ⭐ 在这里添加删除连线处理
      window.onEdgeDeleted = function (edgeData) {

        const {
          sourceNodeId,
          targetNodeId,
          sourceServiceAlias,
          targetServiceAlias,
          sourceServiceCname,
          targetServiceCname
        } = edgeData;

        const sourceDisplay = sourceServiceCname || sourceServiceAlias || sourceNodeId;
        const targetDisplay = targetServiceCname || targetServiceAlias || targetNodeId;
        const sourceName = sourceServiceAlias || sourceNodeId;
        const targetName = targetServiceAlias || targetNodeId;

        const isInternet = (sourceNodeId === 'The Internet' || !sourceName || sourceName === 'The Internet');

        Modal.confirm({
          title: isInternet ? '确认关闭对外端口' : '确认删除依赖',
          content: isInternet
            ? `确定要关闭组件 ${targetDisplay} 的对外端口吗？`
            : `确定要删除 ${sourceDisplay} → ${targetDisplay} 的依赖关系吗？`,
          okText: '确定',
          okType: 'danger',
          cancelText: '取消',
          onOk: () => {
            if (isInternet) {
              // 关闭对外端口
              dispatch({
                type: 'appControl/openExternalPort',
                payload: {
                  team_name: globalUtil.getCurrTeamName(),
                  app_alias: targetName,
                  close_outer: true,
                },
                callback: res => {
                  if (res && res.status_code === 200) {
                    notification.success({ message: res.msg_show || '对外端口已关闭' });
                    dispatch(
                      routerRedux.push(
                        `/team/${teamName}/region/${regionName}/apps/${appID}/overview?refresh=${timestamp}`
                      )
                    );
                  } else {
                    notification.error({ message: '操作失败' });
                  }
                }
              });
            } else {
              // 删除依赖关系
              removeRelationedApp({
                team_name: globalUtil.getCurrTeamName(),
                app_alias: sourceName,
                dep_service_id: targetNodeId,
              }).then(res => {
                if (res && res.status_code === 200) {
                  notification.success({ message: res.msg_show || '依赖关系已删除' });
                  dispatch(
                    routerRedux.push(
                      `/team/${teamName}/region/${regionName}/apps/${appID}/overview?refresh=${timestamp}`
                    )
                  );
                } else {
                  notification.error({ message: '删除失败' });
                }
              }).catch(err => {
                console.error('删除错误:', err);
                notification.error({ message: '网络错误' });
              });
            }
          }
        });
      };

    } catch (e) {
    }
  }

  // 确保 refreshFrame 方法存在
  refreshFrame = () => {
    const iframe = document.getElementById('myframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.location.reload(true);
    }
  }

  triggerTopologyRefresh = () => {
    const iframe = document.getElementById('myframe');  // 请确认 iframe 的实际 ID
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'TRIGGER_DATA_REFRESH'
      }, '*');
    }
  }

  // 删除
  cancelDeleteApp = (isOpen = true) => {
    this.setState({ flag: false });
  };
  handleDeleteApp = () => {
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    const { group_id: groupId, dispatch } = this.props;
    const timestamp = new Date().getTime();
    dispatch({
      type: 'appControl/deleteApp',
      payload: {
        team_name: teamName,
        app_alias: this.state.appAlias
      },
      callback: () => {
        this.cancelDeleteApp(false);
        dispatch({
          type: 'global/fetchGroups',
          payload: {
            team_name: teamName
          }
        });
        dispatch(
          routerRedux.push(
            `/team/${teamName}/region/${regionName}/apps/${groupId}/overview?refresh=${timestamp}`
          )
        );
      }
    });
  };

  // 关闭
  handleOffHelpfulHints = () => {
    this.setState({
      promptModal: null,
      closes: false,
    });
  };
  saveRef = ref => {
    this.ref = ref;
  };
  getChildCom = () => {
    if (this.ref) {
      return this.ref.getWrappedInstance({});
    }
    return null;
  };
  handleOperation = state => {
    const { actionIng } = this.state;
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    const { group_id: groupId, dispatch } = this.props;
    const timestamp = new Date().getTime();

    if (actionIng) {
      notification.warning({ message: formatMessage({ id: 'notification.warn.executing' }) });
      return;
    }
    const operationMap = {
      putReStart: formatMessage({ id: 'notification.success.operationRestart' }),
      putStart: formatMessage({ id: 'notification.success.operationStart' }),
      putStop: formatMessage({ id: 'notification.success.operationClose' }),
      putUpdateRolling: formatMessage({ id: 'notification.success.operationUpdata' }),
      putBuild: formatMessage({ id: 'notification.success.deployment' })
    };
    dispatch({
      type: `appControl/${state}`,
      payload: {
        team_name: teamName,
        app_alias: this.state.appAlias,
      },
      callback: res => {
        if (res) {
          notification.success({
            message: operationMap[state]
          });
        }
        this.handleOffHelpfulHints();
        dispatch(
          routerRedux.push(
            `/team/${teamName}/region/${regionName}/apps/${groupId}/overview?refresh=${timestamp}`
          )
        );
      }
    });
  };
  handleJumpAgain = () => {
    const { promptModal } = this.state;
    if (promptModal === 'build') {
      this.handleDeploy();
      return null;
    }
    const parameter =
      promptModal === 'stop'
        ? 'putStop'
        : promptModal === 'start'
          ? 'putStart'
          : promptModal === 'restart'
            ? 'putReStart'
            : promptModal === 'build'
              ? 'putBuild'
              : promptModal === 'rolling'
                ? 'putUpdateRolling'
                : '';
    this.handleOperation(parameter);
  };

  //构建
  handleDeploy = () => {
    const { actionIng, appAlias } = this.state;
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    const { build_upgrade, dispatch } = this.props;
    if (actionIng) {
      notification.warning({ message: formatMessage({ id: 'notification.warn.executing' }) });
      return;
    }

    dispatch({
      type: 'appControl/putDeploy',
      payload: {
        team_name: teamName,
        app_alias: appAlias,
        group_version: '',
        is_upgrate: ''
      },
      callback: res => {
        if (res) {
          notification.success({ message: formatMessage({ id: 'notification.success.deployment' }) });
        }
        this.handleOffHelpfulHints();
        dispatch(
          routerRedux.push(
            `/team/${teamName}/region/${regionName}/apps/${appID}/overview?refresh=${timestamp}`
          )
        );
      }
    });
  };


  render() {
    const { deleteAppLoading, reStartLoading, stopLoading, startLoading, updateRollingLoading, flagHeight, iframeHeight } = this.props
    const { flag, promptModal, closes, start, updated, keyes, srcUrl, teamName, regionName, appAlias, build } = this.state
    const codeObj = {
      start: formatMessage({ id: 'topology.Topological.start' }),
      stop: formatMessage({ id: 'topology.Topological.stop' }),
      rolling: formatMessage({ id: 'topology.Topological.rolling' }),
      build: formatMessage({ id: 'topology.Topological.build' })
    };
    return (
      // eslint-disable-next-line jsx-a11y/iframe-has-title
      <div key={keyes} style={{ height: iframeHeight }}>
        {flag && (
          <ConfirmModal
            onOk={this.handleDeleteApp}
            onCancel={this.cancelDeleteApp}
            loading={deleteAppLoading}
            title={formatMessage({ id: 'confirmModal.component.delete.title' })}
            desc={formatMessage({ id: 'confirmModal.delete.component.desc' })}
            subDesc={formatMessage({ id: 'confirmModal.delete.strategy.subDesc' })}
          />
        )}
        {(closes || start || updated || build) && (
          <Modal
            title={formatMessage({ id: 'topology.Topological.title' })}
            visible={promptModal}
            className={styless.TelescopicModal}
            onOk={this.handleJumpAgain}
            onCancel={this.handleOffHelpfulHints}
            confirmLoading={
              promptModal === 'stop'
                ? stopLoading
                : promptModal === 'start'
                  ? startLoading
                  : promptModal === 'rolling'
                    ? updateRollingLoading
                    : !promptModal
            }
          >
            <p style={{ textAlign: 'center' }}>
              {formatMessage({ id: 'topology.Topological.determine' })}{codeObj[promptModal]}{formatMessage({ id: 'topology.Topological.now' })}
            </p>
          </Modal>
        )}
        <Link
          id="links"
          to={`/team/${teamName}/region/${regionName}/components/${appAlias}/webconsole`}
          target="_blank"
        >
        </Link>
        <iframe
          src={`${apiconfig.baseUrl}${srcUrl}`}
          style={{
            width: '100%',
            height: '100%'
          }}
          id="myframe"
          key={keyes}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          scrolling="auto"
          frameBorder="no"
          border="0"
          marginWidth="0"
          marginHeight="0"
        />
      </div>
    );
  }
}

export default Index;
