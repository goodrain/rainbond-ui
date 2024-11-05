/* eslint-disable react/no-array-index-key */
/* eslint-disable react/no-danger */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
import { Button, Card, Icon, Modal, notification, Radio, Tooltip, Input, Select } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import ConfirmModal from '../../components/ConfirmModal';
import LogProcress from '../../components/LogProcress';
import Result from '../../components/Result';
import ShowRegionKey from '../../components/ShowRegionKey';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import {
  buildApp,
  getCheckuuid,
  getCreateCheckId,
  getCreateCheckResult,
  setNodeLanguage,
} from '../../services/createApp';
import globalUtil from '../../utils/global';
import rainbondUtil from '../../utils/rainbond';
import regionUtil from '../../utils/region';
import roleUtil from '../../utils/role';
import userUtil from '../../utils/user';
import ModifyImageCmd from './modify-image-cmd';
import ModifyImageName from './modify-image-name';
import ModifyUrl from './modify-url';
import cookie from '../../utils/cookie';
import styles from './check.less';

const { Option } = Select;
@connect(
  ({ user, appControl, teamControl, global }) => ({
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
    currUser: user.currentUser,
    appDetail: appControl.appDetail,
    rainbondInfo: global.rainbondInfo,
    soundCodeLanguage: teamControl.codeLanguage,
  }),
  null,
  null,
  { withRef: true }
)
export default class CreateCheck extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // failure、checking、success
      // appPermissions: this.handlePermissions('queryAppInfo'),
      status: 'checking',
      checkUuid: '',
      errorInfo: [],
      serviceInfo: [],
      eventId: '',
      appDetail: {},
      deleteLoading: false,
      showDelete: false,
      modifyUrl: false,
      modifyUserpass: false,
      modifyImageName: false,
      modifyImageCmd: false,
      isDeploy: true,
      ServiceGetData: props.ServiceGetData ? props.ServiceGetData : null,
      buildAppLoading: false,
      isMulti: false,
      packageLange: 'npm',
      codeLanguage: '',
      source_from: '',
      ports: '',
      language: cookie.get('language') === 'zh-CN' ? true : false,
      Directory: "dist",
      imageAddress: null,
    };
    this.mount = false;
    this.loadingBuild = false
    this.socketUrl = '';
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    const region = userUtil.hasTeamAndRegion(
      this.props.currUser,
      teamName,
      regionName
    );
    if (region) {
      this.socketUrl = regionUtil.getEventWebSocketUrl(region);
    }
  }
  componentDidMount() {
    this.mount = true;
    this.getDetail();
    this.bindEvent();
    this.handleCurrentTeamPermissions()
  }
  componentWillUnmount() {
    this.mount = false;
    this.unbindEvent();
  }
  /**
   * handleCurrentTeamPermissions 函数：
   * 
   * 功能：
   *   获取当前团队的权限信息，发送 'user/fetchCurrent' 请求获取当前用户信息，根据团队名称获取团队信息，
   *   并发送 'teamControl/fetchCurrentTeamPermissions' 请求获取当前团队的权限信息。
   * 
   * 参数：
   *   无
   * 
   * 返回值：
   *   无
   */
  handleCurrentTeamPermissions = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'user/fetchCurrent',
      callback: res => {
        if (res && res.bean) {
          const team = userUtil.getTeamByTeamName(res.bean, globalUtil.getCurrTeamName());
          dispatch({
            type: 'teamControl/fetchCurrentTeamPermissions',
            payload: team && team.tenant_actions
          });
        }
      },
    });
  };
  /**
   * getParameter 函数：
   * 
   * 功能：
   *   获取当前组件的参数对象，包括 appAlias、teamName、regionName 和 dist。
   *   如果 ServiceGetData 不存在，则使用 props.match.params.appAlias 作为 appAlias。
   *   如果 Directory 不存在，则使用 'dist' 作为 dist。
   * 
   * 参数：
   *   无
   * 
   * 返回值：
   *   @return {object} - 参数对象 { appAlias, teamName, regionName, dist }
   */
  getParameter = () => {
    const { ServiceGetData, Directory } = this.state;
    return {
      appAlias: ServiceGetData || this.props.match.params.appAlias,
      teamName: globalUtil.getCurrTeamName(),
      regionName: globalUtil.getCurrRegionName(),
      dist: Directory || 'dist'
    };
  };
  handleCurrentTeamPermissions = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'user/fetchCurrent',
      callback: res => {
        if (res && res.bean) {
          const team = userUtil.getTeamByTeamName(res.bean, globalUtil.getCurrTeamName());
          dispatch({
            type: 'teamControl/fetchCurrentTeamPermissions',
            payload: team && team.tenant_actions
          });
        }
      },
    });
  };
  getDetail = () => {
    this.props.dispatch({
      type: 'appControl/fetchDetail',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.getAppAlias()
      },
      callback: appDetail => {
        if (appDetail) {
          this.setState({ appDetail: appDetail.service });
          this.getCheckuuid();
        }
      }
    });
  };
  /**
   * getCheckuuid 函数：
   * 
   * 功能：
   *   获取应用程序的检查 UUID，发送 getCheckuuid 请求获取指定团队、应用别名的检查 UUID。
   *   根据返回结果更新状态中的 checkUuid，并根据是否存在 check_uuid 调用 loopStatus 方法或 startCheck 方法。
   * 
   * 参数：
   *   无
   * 
   * 返回值：
   *   无
   */
  getCheckuuid = () => {
    const appAlias = this.getAppAlias();
    const teamName = globalUtil.getCurrTeamName();
    getCheckuuid({ team_name: teamName, app_alias: appAlias }).then(data => {
      if (data) {
        if (!data.bean.check_uuid) {
          this.startCheck();
        } else {
          this.setState(
            {
              checkUuid: data.bean.check_uuid
            },
            () => {
              this.loopStatus();
            }
          );
        }
      }
    });
  };

  /**
   * getAppAlias 函数：
   * 
   * 功能：
   *   获取应用程序的别名 appAlias。如果 state 中存在 ServiceGetData，则返回该值，否则返回 props.match.params.appAlias。
   * 
   * 参数：
   *   无
   * 
   * 返回值：
   *   @return {string} - 应用程序别名 appAlias
   */
  getAppAlias() {
    const { ServiceGetData } = this.state;
    return ServiceGetData || this.props.match.params.appAlias;
  }
  /**
   * handlePermissions 函数：
   * 
   * 功能：
   *   根据指定的 type 查询当前团队权限信息。
   * 
   * 参数：
   *   @param {string} type - 权限类型
   * 
   * 返回值：
   *   @return {object} - 指定权限类型的权限信息对象
   */
  handlePermissions = type => {
    const { currentTeamPermissionsInfo } = this.props;
    return roleUtil.querySpecifiedPermissionsInfo(
      currentTeamPermissionsInfo,
      type
    );
  };
  /**
   * handleJump 函数：
   * 
   * 功能：
   *   处理页面跳转，根据传入的 targets 构建目标路由，并使用 routerRedux.replace 进行路由替换。
   * 
   * 参数：
   *   @param {string} targets - 目标路由路径
   * 
   * 返回值：
   *   无
   */
  handleJump = targets => {
    const { dispatch } = this.props;
    const { teamName, regionName } = this.getParameter();
    dispatch(
      routerRedux.replace(`/team/${teamName}/region/${regionName}/${targets}`)
    );
  };
  /**
   * loopStatus 函数：
   * 
   * 功能：
   *   循环检查应用程序的状态，发送 getCreateCheckResult 请求获取应用程序检查结果，
   *   并更新状态中的 status、errorInfo、serviceInfo 和 isMulti 等状态。
   *   如果状态为 'checking'，则延迟 5000ms 后再次调用自身。
   * 
   * 参数：
   *   无
   * 
   * 返回值：
   *   无
   */
  loopStatus = () => {
    if (!this.mount) return;
    const eventId = this.props.location &&
      this.props.location.query &&
      this.props.location.query.event_id ||
      this.props.event_id
    const appAlias = this.getAppAlias();
    const teamName = globalUtil.getCurrTeamName();
    getCreateCheckResult({
      team_name: teamName,
      app_alias: appAlias,
      check_uuid: this.state.checkUuid,
      event_id: eventId
    })
      .then(data => {
        if (data && this.mount) {
          const status = data.bean.check_status;
          const errorInfos = data.bean.error_infos || [];
          const serviceInfo = data.bean.service_info || [];
          if(status != 'failure'){
            serviceInfo.map((item) => {
              if (item.type == 'language') {
                const parts = item.value && item.value.split(",");
                this.props.dispatch({
                  type: 'teamControl/ChoosingLanguage',
                  payload: parts[0],
                });
                this.props.dispatch({
                  type: 'teamControl/ChoosingPackage',
                  payload: 'npm',
                });
                this.setState({
                  codeLanguage: parts[0]
                })
              } else if (item.type == 'source_from') {
                this.setState({
                  source_from: item.value
                })
              } else {
                this.setState({
                  ports: item.value
                })
              }
            })
          }
          this.setState({
            status,
            errorInfo: errorInfos,
            serviceInfo,
            isMulti: data.bean.is_multi
          });
        }
      })
      .finally(() => {
        if (this.mount && this.state.status === 'checking') {
          setTimeout(() => {
            this.loopStatus();
          }, 5000);
        }
      });
  };
  /**
   * startCheck 函数：
   * 
   * 功能：
   *   开始应用程序的检查，发送 getCreateCheckId 请求获取应用程序的检查 UUID，并根据返回结果更新状态中的 checkUuid、eventId 和 appDetail 等状态。
   *   如果返回的状态码为 404，则跳转至 'exception/404' 页面。
   *   如果 loopStatus 参数为 false，则不调用 loopStatus 方法。
   * 
   * 参数：
   *   @param {boolean} loopStatus - 是否执行循环状态检查，默认为 true
   * 
   * 返回值：
   *   无
   */
  startCheck = loopStatus => {
    const { appAlias, teamName } = this.getParameter();
    const eventId = this.props.location &&
      this.props.location.query &&
      this.props.location.query.event_id ||
      this.props.event_id
    getCreateCheckId(
      {
        team_name: teamName,
        app_alias: appAlias,
        event_id: eventId
      },
      res => {
        if (res.status === 404) {
          this.handleJump('exception/404');
        }
      }
    ).then(data => {
      if (data) {
        this.setState({
          checkUuid: data.bean.check_uuid,
          eventId: data.bean.check_event_id,
          appDetail: data.bean
        });
        if (loopStatus !== false) {
          this.loopStatus();
        }
      }
    });
  };
  /**
   * handleSetting 函数：
   * 
   * 功能：
   *   处理设置页面跳转，将 'advanced_setup' 存入 sessionStorage，并调用 handleJump 跳转至 'create/create-setting/${appAlias}' 页面。
   * 
   * 参数：
   *   无
   * 
   * 返回值：
   *   无
   */
  handleSetting = () => {
    const { appAlias } = this.getParameter();
    window.sessionStorage.setItem('advanced_setup', JSON.stringify('advanced'));
    this.handleJump(`create/create-setting/${appAlias}`);
  };
  /**
   * handleConfigFile 函数：
   * 
   * 功能：
   *   处理配置文件页面跳转和更新自定义语言，将 'advanced_setup' 存入 sessionStorage，
   *   如果 codeLanguage 为 'NodeJSStatic'，则将 dist 存入 sessionStorage。
   *   如果 imageAddress 存在，则调用 handleSaveTarImageName 方法。
   *   调用 createApp/updateCustomLanguage 请求更新应用程序的自定义语言，并调用 handleJump 跳转至 'create/create-configFile/${appAlias}' 页面。
   * 
   * 参数：
   *   无
   * 
   * 返回值：
   *   无
   */
  handleConfigFile = () => {
    const { appAlias, dist, teamName } = this.getParameter();
    const { dispatch } = this.props
    const { imageAddress, codeLanguage } = this.state
    window.sessionStorage.setItem('advanced_setup', JSON.stringify('advanced'));
    if (codeLanguage == 'NodeJSStatic') {
      window.sessionStorage.setItem('dist', JSON.stringify(`${dist}`));
    }
    if (imageAddress) {
      this.handleSaveTarImageName()
    }
    if (codeLanguage) {
      dispatch({
        type: 'createApp/updateCustomLanguage',
        payload: {
          team_name: teamName,
          app_id: appAlias,
          lang: codeLanguage
        },
        callback: res => {
          this.handleJump(`create/create-configFile/${appAlias}`);
        }
      })
    } else {
      this.handleJump(`create/create-configFile/${appAlias}`);
    }


  };
  /**
   * handleSaveTarImageName 函数：
   * 
   * 功能：
   *   处理保存镜像名称，发送 'createApp/saveTarImageName' 请求保存应用程序的镜像名称。
   * 
   * 参数：
   *   无
   * 
   * 返回值：
   *   无
   */
  handleSaveTarImageName = () => {
    const { dispatch } = this.props
    const { imageAddress } = this.state
    const { appAlias, teamName } = this.getParameter();
    dispatch({
      type: 'createApp/saveTarImageName',
      payload: {
        team_name: teamName,
        app_alias: appAlias,
        image_name: imageAddress
      },
      callback: res => {

      }
    })
  }
  /**
   * handleMoreService 函数：
   * 
   * 功能：
   *   处理进入多模块构建，根据 ServiceGetData 和 isMulti 状态，决定是否进行状态更新或页面跳转。
   * 
   * 参数：
   *   无
   * 
   * 返回值：
   *   无
   */
  handleMoreService = () => {
    const { handleServiceDataState } = this.props;
    const { ServiceGetData, checkUuid, isMulti } = this.state;
    const { appAlias } = this.getParameter();
    if (ServiceGetData && !isMulti) {
      handleServiceDataState(true, null, null, null);
    } else {
      this.handleJump(`create/create-moreService/${appAlias}/${checkUuid}`);
    }
  };

  /**
   * handleBuild 函数：
   * 
   * 功能：
   *   处理构建应用程序，根据不同的编程语言和部署状态调用不同的接口请求并处理返回结果。
   * 
   * 参数：
   *   无
   * 
   * 返回值：
   *   无
   */
  handleBuild = () => {
    this.loadingBuild = true
    const { appAlias, teamName } = this.getParameter();
    const { refreshCurrent, dispatch, soundCodeLanguage } = this.props;
    const { isDeploy, ServiceGetData, appDetail, codeLanguage, packageLange } = this.state;
    this.setState({ buildAppLoading: true }, () => {
      if (codeLanguage == 'Node.js' || codeLanguage == 'NodeJSStatic') {
        dispatch({
          type: 'createApp/setNodeLanguage',
          payload: {
            team_name: teamName,
            app_alias: appAlias,
            lang: codeLanguage,
            package_tool: packageLange,
          },
          callback: res => {
            if (res) {
              dispatch({
                type: 'createApp/buildApps',
                payload: {
                  team_name: teamName,
                  app_alias: appAlias,
                  is_deploy: isDeploy,
                },
                callback: res => {
                  if (res) {
                    dispatch({
                      type: 'global/fetchGroups',
                      payload: {
                        team_name: teamName
                      },
                      callback: res => {
                        this.setState({ buildAppLoading: false });
                        this.loadingBuild = false
                      }
                    });
                    window.sessionStorage.removeItem('codeLanguage');
                    window.sessionStorage.removeItem('packageNpmOrYarn');
                    if (ServiceGetData && isDeploy) {
                      refreshCurrent();
                    } else if (appDetail.service_source === 'third_party') {
                      this.handleJump(`components/${appAlias}/thirdPartyServices`);
                    } else {
                      this.handleJump(`components/${appAlias}/overview`);
                    }
                  }
                }
              })
            }
          }
        })
      } else {
        dispatch({
          type: 'createApp/buildApps',
          payload: {
            team_name: teamName,
            app_alias: appAlias,
            is_deploy: isDeploy,
          },
          callback: res => {
            if (res) {
              this.setState({ buildAppLoading: false });
              this.loadingBuild = false
              dispatch({
                type: 'global/fetchGroups',
                payload: {
                  team_name: teamName
                }
              });
              if (ServiceGetData && isDeploy) {
                refreshCurrent();
              } else if (appDetail.service_source === 'third_party') {
                this.handleJump(`components/${appAlias}/thirdPartyServices`);
              } else {
                this.handleJump(`components/${appAlias}/overview`);
              }
            }
          }
        })
      }

    });

  };
  /**
   * handlePreventClick 函数：
   * 
   * 功能：
   *   处理防止频繁点击，如果未处于构建中，则调用 handleBuild 方法开始构建应用程序，否则显示提示信息。
   * 
   * 参数：
   *   无
   * 
   * 返回值：
   *   无
   */
  handlePreventClick = () => {
    if (!this.loadingBuild) {
      this.handleBuild()
    } else {
      notification.warning({ message: '正在创建，请勿频繁操作！' });
    }
  }
  /**
   * recheck 函数：
   * 
   * 功能：
   *   处理重新检查，设置状态为 'checking'，并调用 startCheck 方法开始检查。
   * 
   * 参数：
   *   无
   * 
   * 返回值：
   *   无
   */
  recheck = () => {
    this.setState(
      {
        status: 'checking'
      },
      () => {
        this.startCheck();
      }
    );
  };
  /**
   * cancelModifyImageName 函数：
   * 
   * 功能：
   *   取消修改镜像名称的操作，将 modifyImageName 状态设置为 false。
   * 
   * 参数：
   *   无
   * 
   * 返回值：
   *   无
   */
  cancelModifyImageName = () => {
    this.setState({ modifyImageName: false });
  };
  /**
   * cancelModifyImageCmd 函数：
   * 
   * 功能：
   *   取消修改 dockerrun 命令的操作，将 modifyImageCmd 状态设置为 false。
   * 
   * 参数：
   *   无
   * 
   * 返回值：
   *   无
   */
  cancelModifyImageCmd = () => {
    this.setState({ modifyImageCmd: false });
  };
  /**
   * handleClick 函数：
   * 
   * 功能：
   *   处理点击事件，根据点击的元素类型执行相应的操作，如修改 URL、打开仓库地址、修改镜像名称或 dockerrun 命令等。
   * 
   * 参数：
   *   @param {object} e - 点击事件对象
   * 
   * 返回值：
   *   无
   */
  handleClick = e => {
    let parent = e.target;
    const { appDetail } = this.state;

    while (parent) {
      if (parent === document.body) {
        return;
      }
      const actionType = parent.getAttribute('action_type');
      if (actionType === 'modify_url' || actionType === 'modify_repo') {
        this.setState({ modifyUrl: actionType });
        return;
      }

      if (actionType === 'modify_userpass') {
        this.setState({ modifyUserpass: true });
        return;
      }

      if (actionType === 'get_publickey') {
        this.setState({ showKey: true });
        return;
      }

      if (actionType === 'open_repo') {
        if ((appDetail.git_url || '').indexOf('@') === -1) {
          window.open(appDetail.git_url);
        } else {
          Modal.info({ title: formatMessage({ id: 'componentCheck.warehouse_address' }), content: appDetail.git_url });
        }
      }

      // 修改镜像名称或dockerrun命令
      if (actionType === 'modify_image') {
        // 指定镜像
        if (appDetail.service_source === 'docker_image') {
          this.startCheck(false);
          this.setState({ modifyImageName: true });
          return;
        }
        // docker_run命令
        if (appDetail.service_source === 'docker_run') {
          this.startCheck(false);
          this.setState({ modifyImageCmd: true });
          return;
        }
      }

      parent = parent.parentNode;
    }
  };
  /**
   * handleDelete 函数：
   * 
   * 功能：
   *   处理删除应用程序，发送 'appControl/deleteApp' 请求删除指定团队和应用别名的应用程序，并处理返回结果。
   * 
   * 参数：
   *   无
   * 
   * 返回值：
   *   无
   */
  handleDelete = () => {
    const { appAlias, teamName } = this.getParameter();
    const { handleServiceDataState, dispatch } = this.props;
    const { ServiceGetData } = this.state;
    this.handleDeleteLoading(true);
    dispatch({
      type: 'appControl/deleteApp',
      payload: {
        team_name: teamName,
        app_alias: appAlias,
        is_force: true
      },
      callback: () => {
        dispatch({
          type: 'global/fetchGroups',
          payload: {
            team_name: teamName
          }
        });
        if (ServiceGetData) {
          handleServiceDataState(true, null, null, null);
        } else {
          this.handleJump(`index`);
        }
        this.handleDeleteLoading(false);
        window.sessionStorage.removeItem('codeLanguage');
        window.sessionStorage.removeItem('packageNpmOrYarn');
      },
      handleError: err => {
        if (err && err.data) {
          if (err.data.code && err.data.code === 404) {
            this.handleJump(`index`);
          } else if (err.data.msg_show) {
            notification.warning({ message: err.data.msg_show });
          }
        }
        this.handleDeleteLoading(false);
      }
    });
  };
  /**
   * handleDeleteLoading 函数：
   * 
   * 功能：
   *   设置删除加载状态。
   * 
   * 参数：
   *   @param {boolean} deleteLoading - 是否删除加载状态
   * 
   * 返回值：
   *   无
   */
  handleDeleteLoading = deleteLoading => {
    this.setState({ deleteLoading });
  };
  /**
   * cancelModifyUrl 函数：
   * 
   * 功能：
   *   取消修改 URL 的操作，将 modifyUrl 状态设置为 false。
   * 
   * 参数：
   *   无
   * 
   * 返回值：
   *   无
   */
  cancelModifyUrl = () => {
    this.setState({ modifyUrl: false });
  };
  /**
   * handleCancelEdit 函数：
   * 
   * 功能：
   *   取消编辑操作，将 modifyUrl 状态设置为 false。
   * 
   * 参数：
   *   无
   * 
   * 返回值：
   *   无
   */
  handleCancelEdit = () => {
    this.setState({ modifyUrl: false });
  };
  /**
   * handleCancelShowKey 函数：
   * 
   * 功能：
   *   取消显示密钥的操作，将 showKey 状态设置为 false。
   * 
   * 参数：
   *   无
   * 
   * 返回值：
   *   无
   */
  handleCancelShowKey = () => {
    this.setState({ showKey: false });
  };
  /**
   * bindEvent 函数：
   * 
   * 功能：
   *   绑定点击事件到 document 上，执行 handleClick 方法处理点击事件。
   * 
   * 参数：
   *   无
   * 
   * 返回值：
   *   无
   */
  bindEvent = () => {
    document.addEventListener('click', this.handleClick, false);
  };
  /**
   * unbindEvent 函数：
   * 
   * 功能：
   *   解绑点击事件，移除 document 上的 handleClick 方法。
   * 
   * 参数：
   *   无
   * 
   * 返回值：
   *   无
   */
  unbindEvent = () => {
    document.removeEventListener('click', this.handleClick);
  };
  /**
   * cancelModifyUserpass 函数：
   * 
   * 功能：
   *   取消修改用户名和密码的操作，将 modifyUserpass 状态设置为 false。
   * 
   * 参数：
   *   无
   * 
   * 返回值：
   *   无
   */
  cancelModifyUserpass = () => {
    this.setState({ modifyUserpass: false });
  };
  /*
    函数名称: handleModifyUserpass
    
    功能: 处理修改用户密码操作
    
    参数:
      - values (object): 包含用户提供的 service_cname, git_url, user_name, password 等值的对象
    
    返回值: 无
    
    逻辑:
      1. 从组件状态和 getParameter() 获取 appDetail 和 teamName。
      2. 使用 this.props.dispatch() 分发一个编辑应用信息的动作。
      3. 分发的动作包括:
         - type: 'appControl/editAppCreateInfo'
         - payload: 包含 service_cname, git_url, team_name, app_alias, user_name, password。
         - callback: 在动作完成后执行。如果收到数据，停止检查并取消修改操作。
  */
  handleModifyUserpass = values => {
    const { appDetail } = this.state;
    const { teamName } = this.getParameter();
    this.props.dispatch({
      type: 'appControl/editAppCreateInfo',
      payload: {
        service_cname: values.service_cname ? values.service_cname : '',
        git_url: values.git_url ? values.git_url : '',
        team_name: teamName,
        app_alias: appDetail.service_alias,
        user_name: values.user_name,
        password: values.password
      },
      callback: data => {
        if (data) {
          this.startCheck(false);
          this.cancelModifyUserpass();
        }
      }
    });
  };
  /*
    函数名称: handleModifyUrl
    
    功能: 处理修改应用的 git_url
    
    参数:
      - values (object): 包含用户提供的 git_url 值的对象
    
    返回值: 无
    
    逻辑:
      1. 从组件状态和 getParameter() 获取 appDetail 和 teamName。
      2. 使用 this.props.dispatch() 分发一个编辑应用信息的动作。
      3. 分发的动作包括:
         - type: 'appControl/editAppCreateInfo'
         - payload: 包含 team_name, app_alias, git_url。
         - callback: 在动作完成后执行。如果收到数据，停止检查并取消编辑操作。
  */
  handleModifyUrl = values => {
    const { appDetail } = this.state;
    const { teamName } = this.getParameter();
    this.props.dispatch({
      type: 'appControl/editAppCreateInfo',
      payload: {
        team_name: teamName,
        app_alias: appDetail.service_alias,
        git_url: values.git_url
      },
      callback: data => {
        if (data) {
          this.startCheck(false);
          this.handleCancelEdit();
        }
      }
    });
  };
  /*
    函数名称: handleModifyImageName
    
    功能: 处理修改应用镜像名称的操作
    
    参数:
      - values (object): 包含用户提供的 docker_cmd, username, password 等值的对象
    
    返回值: 无
    
    逻辑:
      1. 从组件状态获取 appDetail。
      2. 使用 this.props.dispatch() 分发一个编辑应用信息的动作。
      3. 分发的动作包括:
         - type: 'appControl/editAppCreateInfo'
         - payload: 包含 team_name, app_alias, docker_cmd, user_name, password。
         - callback: 在动作完成后执行。如果收到数据，停止检查并取消修改操作。
  */
  handleModifyImageName = values => {
    const { appDetail } = this.state;
    this.props.dispatch({
      type: 'appControl/editAppCreateInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appDetail.service_alias,
        docker_cmd: values.docker_cmd,
        user_name: values.username,
        password: values.password
      },
      callback: data => {
        if (data) {
          this.startCheck(false);
          this.cancelModifyImageName();
        }
      }
    });
  };
  /*
    函数名称: handleModifyImageCmd
    
    功能: 处理修改应用镜像命令的操作
    
    参数:
      - values (object): 包含用户提供的 docker_cmd, username, password 等值的对象
    
    返回值: 无
    
    逻辑:
      1. 从组件状态获取 appDetail。
      2. 使用 this.props.dispatch() 分发一个编辑应用信息的动作。
      3. 分发的动作包括:
         - type: 'appControl/editAppCreateInfo'
         - payload: 包含 team_name, app_alias, docker_cmd, user_name, password。
         - callback: 在动作完成后执行。如果收到数据，停止检查并取消修改操作。
  */
  handleModifyImageCmd = values => {
    const { appDetail } = this.state;
    this.props.dispatch({
      type: 'appControl/editAppCreateInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appDetail.service_alias,
        docker_cmd: values.docker_cmd,
        user_name: values.username,
        password: values.password
      },
      callback: data => {
        if (data) {
          this.startCheck(false);
          this.cancelModifyImageCmd();
        }
      }
    });
  };
  /*
    函数名称: showDelete
    
    功能: 设置状态以显示删除操作的确认框
    
    参数: 无
    
    返回值: 无
    
    逻辑:
      - 将 showDelete 状态设置为 true，以显示删除操作的确认框。
  */
  showDelete = () => {
    this.setState({ showDelete: true });
  };

  /*
    函数名称: handleDescription
    
    功能: 生成应用描述信息
    
    参数: 无
    
    返回值: 一个 React 元素，包含应用描述信息和相关链接
    
    逻辑:
      - 从组件的 props 和状态中获取 rainbondInfo 和 appDetail。
      - 根据 rainbondInfo 使用 rainbondUtil.documentPlatform_url() 获取平台文档链接。
      - 根据 appDetail 的 service_source 判断是否为第三方服务。
      - 返回一个包含描述信息的 React 元素，当 service_source 不为 'third_party' 时包含平台文档链接。
  */
  handleDescription = () => {
    const { rainbondInfo } = this.props;
    const { appDetail } = this.state;
    const platformUrl = rainbondUtil.documentPlatform_url(rainbondInfo);
    const box = (
      <span>
        可参考
        <a
          href={`${platformUrl}docs/user-manual/app-creation/language-support/`}
          target="_blank"
          rel="noopener noreferrer"
        >
          平台源码支持规范
        </a>
      </span>
    );
    return (
      appDetail.service_source !== 'third_party' && (
        <div>
          <div>组件构建源检测通过仅代表平台可以检测到多模块构建。</div>
          90%以上的用户在检测通过后可部署成功，如遇部署失败，
          {platformUrl && box}
          对代码进行调整。
        </div>
      )
    );
  };
  /*
    函数名称: renderError
    
    功能: 渲染错误信息
    
    参数: 无
    
    返回值: 一个 Result 组件，显示错误信息和相关操作按钮
    
    逻辑:
      - 从组件的状态中获取 errorInfo 和 ServiceGetData。
      - 定义一个包含错误信息的 extra 元素，根据 errorInfo 的内容生成错误提示。
      - 定义包含操作按钮的 actions 元素，根据 isDelete 状态显示删除按钮。
      - 根据 ServiceGetData 和组件的 props 判断是否需要调用 this.props.handleServiceBotton()。
      - 返回一个 Result 组件，显示错误信息、操作按钮和额外的提示。
  */
  renderError = () => {
    const {
      errorInfo,
      // appPermissions: { isDelete }
    } = this.state;
    const isDelete = true;
    const extra = (
      <div>
        {errorInfo.map((item, index) => (
          <div
            key={`error${index}`}
            style={{
              marginBottom: 16
            }}
          >
            <Icon
              style={{
                color: '#f5222d',
                marginRight: 8
              }}
              type="close-circle-o"
            />
            <span
              dangerouslySetInnerHTML={{
                __html: `<span>${item.error_info || ''} ${item.solve_advice ||
                  ''}</span>`
              }}
            />
          </div>
        ))}
      </div>
    );

    const { ServiceGetData } = this.state;

    const actions = (
      <div>
        <Button
          onClick={this.recheck}
          type="primary"
          style={{ marginRight: '8px' }}
        >
          {formatMessage({ id: 'button.retest_check' })}
        </Button>
        {isDelete && (
          <Button onClick={this.showDelete} type="default">
            {formatMessage({ id: 'button.abandon_create' })}
          </Button>
        )}
      </div>
    );

    if (
      ServiceGetData &&
      (!this.props.ButtonGroupState || !this.props.ErrState)
    ) {
      this.props.handleServiceBotton(actions, true, true);
    }
    return (
      <Result
        type="error"
        title={formatMessage({ id: 'confirmModal.component.check.title.error' })}
        description={formatMessage({ id: 'confirmModal.component.check.title.error.description' })}
        extra={extra}
        actions={ServiceGetData ? '' : actions}
        style={{
          marginTop: 48,
          marginBottom: 16
        }}
      />
    );
  };
  /*
  函数名称: onChangeImageName
  
  功能: 处理镜像名称变更时的操作
  
  参数:
    - key (string): 镜像名称的键值
    - item (array): 包含镜像前缀的数组
  
  返回值: 无
  
  逻辑:
    1. 根据 key 中最后一个斜杠的位置，截取镜像名称的后缀部分。
    2. 根据截取结果和 item 中的前缀拼接出完整的镜像地址。
    3. 将拼接好的镜像地址更新到组件状态中。
*/
  onChangeImageName = (key, item) => {

    // 找到最后一个斜杠的位置
    const lastSlashIndex = key.lastIndexOf('/');
    // 截取最后一个斜杠后面的内容
    if (lastSlashIndex == -1) {
      const imageName = `${item[0].prefix}/${key}`
      this.setState({
        imageAddress: imageName
      })
    } else {
      const result = key.substring(lastSlashIndex);
      const imageName = `${item[0].prefix}${result}`
      this.setState({
        imageAddress: imageName
      })
    }

  }
  /*
    函数名称: renderSuccessInfo
    
    功能: 渲染成功信息
    
    参数: 无
    
    返回值: 一个包含成功信息的数组，用于展示应用的详细信息
    
    逻辑:
      - 从组件的状态中获取 imageAddress, codeLanguage, serviceInfo, packageLange, Directory 和 ports。
      - 根据 isSever 判断是否为服务器端。
      - 遍历 serviceInfo 数组，根据 item 的类型和值生成不同的信息展示方式。
      - 当 item 的类型为 'language' 时，根据 codeLanguage 渲染语言选择组件，并根据具体情况渲染 npm 或 yarn 选择组件、端口信息和目录输入框。
      - 当 item 的类型为 'tar_images' 时，根据 imageAddress 和 item.value 渲染选择框、转换信息和本地镜像名称。
      - 其他情况直接显示键值对信息。
  */
  renderSuccessInfo = () => {
    const { imageAddress, codeLanguage, serviceInfo, packageLange, Directory, ports } = this.state
    const isSever = this.props.match && this.props.match.params && this.props.match.params.appAlias;
    return serviceInfo.map((item, index) => {
      if (typeof item.value === 'string' && item.type == 'language') {
        const parts = item.value.split(",");
        return (
          <div
            key={`item${index}`}
            style={{
              marginBottom: 16
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <span
                style={{
                  verticalAlign: 'top',
                  display: 'inline-block',
                  fontWeight: 'bold'
                }}
              >
                {formatMessage({ id: 'confirmModal.check.appShare.title.codeLang' })}：
              </span>
              {this.handleChangeLanguage(parts)}

            </div>
            {(codeLanguage == 'Node.js' || codeLanguage == 'NodeJSStatic') &&
              <div style={{ marginBottom: 16 }}>
                <span
                  style={{
                    verticalAlign: 'top',
                    display: 'inline-block',
                    fontWeight: 'bold'
                  }}
                >
                  {formatMessage({ id: 'confirmModal.check.appShare.title.npmOryarn' })}：
                </span>
                <Radio.Group onChange={this.onChange} value={packageLange}>
                  <Radio value='npm'>npm</Radio>
                  <Radio value='yarn'>yarn</Radio>
                </Radio.Group>
              </div>}
            {codeLanguage == 'NodeJSStatic' && (
              <div style={{ marginBottom: 16, display: "flex", flexDirection: 'column' }}>
                {ports &&
                  <div style={{ marginBottom: 16 }}>
                    <span
                      style={{
                        verticalAlign: 'top',
                        display: 'inline-block',
                        fontWeight: 'bold'
                      }}
                    >
                      {formatMessage({ id: 'confirmModal.check.appShare.title.port' })}：
                    </span>
                    {ports || formatMessage({ id: 'confirmModal.check.appShare.title.null' })}
                  </div>}
                <div>
                  <span
                    style={{
                      verticalAlign: 'top',
                      display: 'inline-block',
                      fontWeight: 'bold',
                      marginTop: '6px'
                    }}
                  >
                    {formatMessage({ id: 'confirmModal.check.appShare.title.dist' })}
                  </span>
                  <Input placeholder="Basic usage" defaultValue={Directory} onChange={e => this.distChange(e.target.value)} style={{ width: 200 }} />
                </div>
              </div>
            )}
          </div>
        )
      } else if (typeof item.value === 'string' && item.type != 'tar_images' && item.type != 'language') {
        return (
          <div
            key={`item${index}`}
            style={{
              marginBottom: 16
            }}
          >
            <span
              style={{
                verticalAlign: 'top',
                display: 'inline-block',
                fontWeight: 'bold'
              }}
            >
              {item.key}：
            </span>
            {item.value}
          </div>
        );
      } else {
        return (
          <div
            key={`item${index}`}
            style={{
              marginBottom: 16
            }}
          >
            <span
              style={{
                verticalAlign: 'top',
                display: 'inline-block',
                fontWeight: 'bold',
                marginTop: item.type == 'tar_images' ? '6px' : '0px'
              }}
            >
              {item.key}：
            </span>

            {item.type == 'tar_images' ? (
              <div
                style={{
                  display: 'inline-block',
                }}
              >
                <Select
                  onChange={e => this.onChangeImageName(e, item.value)}
                  defaultValue={item.value[0].name}
                  style={{ width: isSever ? '600px' : '260px' }}
                >
                  {!imageAddress && this.onChangeImageName(item.value[0].name, item.value)}
                  {(item.value || []).map(items => (
                    <Option value={items.name}>
                      <Tooltip title={items.name}>
                        {items.name}
                      </Tooltip>
                    </Option>
                  ))}
                </Select>
                <div className={styles.transform_svg} style={{ width: isSever ? '600px' : '260px' }}>
                  {globalUtil.fetchSvg('transform')}
                  转换成为
                </div>
                <div className={styles.local_image_name}>
                  <div className={styles.localTitle}>
                    本地镜像：
                  </div>
                  <div className={styles.tar_image} style={{ width: isSever ? '600px' : '260px' }}>
                    <Tooltip title={imageAddress}>
                      {imageAddress}
                    </Tooltip>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'inline-block'
                }}
              >
                {(item.value || []).map((items, index) => (
                  <p
                    key={`items${index}`}
                    style={{
                      marginBottom: 0
                    }}
                  >
                    {items}
                  </p>
                ))}
              </div>
            )}

          </div>
        );
      }
    })


  };
  /*
    函数名称: renderSuccessOnChange
    
    功能: 切换部署状态的处理函数
    
    参数: 无
    
    返回值: 无
    
    逻辑:
      - 切换 isDeploy 状态以更新部署状态。
  */
  renderSuccessOnChange = () => {
    this.setState({
      isDeploy: !this.state.isDeploy
    });
  };
  /*
    函数名称: onChangeLange
    
    功能: 处理语言选择变更的操作
    
    参数:
      - e (event): 事件对象，包含目标语言选择的值
    
    返回值: 无
    
    逻辑:
      - 更新 codeLanguage 状态为当前选择的语言。
      - 调用 renderSuccessInfo() 更新成功信息的展示。
      - 分发一个 action 到 'teamControl/ChoosingLanguage'，传递选择的语言信息。
  */

  onChangeLange = e => {
    const { dispatch } = this.props
    this.setState({
      codeLanguage: e.target.value
    }, () => {
      const { codeLanguage } = this.state
      this.renderSuccessInfo()
      dispatch({
        type: 'teamControl/ChoosingLanguage',
        payload: codeLanguage,
      });
    });
  };
  /*
    函数名称: onChange
    
    功能: 处理包管理工具选择变更的操作
    
    参数:
      - e (event): 事件对象，包含目标包管理工具选择的值
    
    返回值: 无
    
    逻辑:
      - 更新 packageLange 状态为当前选择的包管理工具。
      - 分发一个 action 到 'teamControl/ChoosingPackage'，传递选择的包管理工具信息。
  */
  onChange = e => {
    const { dispatch } = this.props
    this.setState({
      packageLange: e.target.value,
    }, () => {
      const { packageLange } = this.state
      dispatch({
        type: 'teamControl/ChoosingPackage',
        payload: packageLange,
      });
    });

  };
  /*
    函数名称: distChange
    
    功能: 处理目录输入框内容变更的操作
    
    参数:
      - e (string): 目录输入框的新值
    
    返回值: 无
    
    逻辑:
      - 更新 Directory 状态为新的目录值。
  */
  distChange = e => {
    this.setState({
      Directory: e
    })
  }
  /*
    函数名称: handleChangeLanguage
    
    功能: 渲染语言选择组件
    
    参数:
      - languageArr (array): 包含可选语言的数组
    
    返回值: 一个 Radio.Group 组件，用于选择语言
    
    逻辑:
      - 根据 languageArr 渲染包含可选语言的 Radio.Group 组件。
      - 设置 onChange 事件处理函数为 this.onChangeLange。
  */
  handleChangeLanguage = (languageArr) => {
    const { codeLanguage } = this.state
    return (
      <Radio.Group onChange={this.onChangeLange} value={codeLanguage}>
        {languageArr.map((item) => {
          return <Radio value={item}>{item}</Radio>
        })}
      </Radio.Group>
    )
  }
  /*
    函数名称: renderSuccess
    
    功能: 渲染成功结果信息
    
    参数:
      - buildAppLoading (boolean): 是否正在构建应用的加载状态，用于控制按钮加载状态
    
    返回值: 一个 Result 组件，显示应用构建或服务创建的成功结果信息
    
    逻辑:
      - 从组件的 props 和状态中获取必要的数据和状态信息。
      - 根据 ServiceGetData、isDeploy、appDetail 等状态判断展示的内容和按钮操作。
      - 根据不同的状态和来源（第三方或平台组件）渲染不同的标题和描述信息。
      - 根据 isDelete 和 isDeploy 控制是否显示删除按钮和操作按钮。
      - 根据 ServiceGetData 控制是否显示 actions，或者根据不同状态渲染不同的按钮组。
      - 如果 isDeploy 为 true，根据 ButtonGroupState 和 ErrState 控制是否调用 handleServiceBotton 方法更新按钮状态。
  */
  renderSuccess = (buildAppLoading) => {
    const { ButtonGroupState, ErrState, handleServiceBotton, soundCodeLanguage, rainbondInfo } = this.props;
    const {
      ServiceGetData,
      isDeploy,
      appDetail,
      serviceInfo,
      // appPermissions: { isDelete },
      codeLanguage,
      source_from,
      ports,
      packageLange,
      Directory
    } = this.state;
    const parts = codeLanguage.split(",");
    const platform_url = rainbondUtil.documentPlatform_url(rainbondInfo);
    const isDelete = true;
    let extra = '';
    const arr = [];
    if (serviceInfo && serviceInfo.length > 0) {
      extra = this.renderSuccessInfo(serviceInfo)
    }

    let actions = [];
    if (ServiceGetData) {
      actions = [
        <div style={{ display: 'flex' }}>
          {isDelete && (
            <Button
              onClick={this.showDelete}
              type="default"
              style={{ marginRight: '8px' }}
            >
              {formatMessage({ id: 'button.abandon_create' })}
            </Button>
          )}
          <Button
            type="primary"
            style={{ marginRight: '8px' }}
            onClick={this.handleConfigFile}
          >
            {formatMessage({ id: 'button.next_step' })}
          </Button>
        </div>
      ];
    } else if (appDetail.service_source === 'third_party') {
      actions = [
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              onClick={this.handlePreventClick}
              type="primary"
              style={{ marginRight: '8px' }}
              loading={buildAppLoading}
            >
              {formatMessage({ id: 'button.create' })}
            </Button>
          </div>
        </div>
      ];
    } else {
      actions = [
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {isDelete && (
            <Button onClick={this.showDelete} type="default">
              {formatMessage({ id: 'button.abandon_create' })}
            </Button>
          )}
          <Button
            type="primary"
            style={{ marginRight: '8px' }}
            onClick={this.handleConfigFile}
          >
            {formatMessage({ id: 'button.next_step' })}
          </Button>
        </div>
      ];
    }

    if (appDetail.service_source === 'third_party') {
      actions = [
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              onClick={this.handlePreventClick}
              type="primary"
              style={{ marginRight: '8px' }}
              loading={buildAppLoading}
            >
              {formatMessage({ id: 'button.create' })}
            </Button>
            {isDelete && (
              <Button onClick={this.showDelete} type="default">
                {formatMessage({ id: 'button.abandon_create' })}
              </Button>
            )}
          </div>
        </div>
      ];
    }

    if (isDeploy) {
      if (ServiceGetData && (!ButtonGroupState || !ErrState)) {
        handleServiceBotton(actions, true, true);
      }
    } else if (ServiceGetData && (ButtonGroupState || ErrState)) {
      handleServiceBotton(actions, false, false);
    }
    return (
      <Result
        type="success"
        title={
          appDetail.service_source === 'third_party'
            ? formatMessage({ id: 'confirmModal.third_party.check.title.success' })
            : formatMessage({ id: 'confirmModal.component.check.title.success' })
        }
        description={
          appDetail.service_source === 'third_party' ? (
            ''
          ) : (
            <div>
              <div>
                {formatMessage({ id: 'componentCheck.tooltip.title.p3' })}
              </div>
              {formatMessage({ id: 'componentCheck.tooltip.title.p4' })}{' '}
              {formatMessage({ id: 'componentCheck.tooltip.title.p9' })}{' '}
              <a
                href={`${platform_url}docs/use-manual/component-create/language-support/`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {formatMessage({ id: 'componentCheck.tooltip.title.p5' })}
              </a>{' '}
              {formatMessage({ id: 'componentCheck.tooltip.title.p6' })}
            </div>
          )
        }
        extra={extra}
        actions={ServiceGetData ? '' : actions}
        style={{ marginTop: 48, marginBottom: 16 }}
      />
    );
  };
  /*
    函数名称: renderMoreService
    
    功能: 渲染更多服务创建结果信息
    
    参数:
      - buildAppLoading (boolean): 是否正在构建应用的加载状态，用于控制按钮加载状态
    
    返回值: 一个 Result 组件，显示更多服务创建的成功结果信息
    
    逻辑:
      - 从组件的 props 和状态中获取必要的数据和状态信息。
      - 根据 ServiceGetData、isDeploy、appDetail 等状态判断展示的内容和按钮操作。
      - 根据 isDelete 和 isDeploy 控制是否显示删除按钮和操作按钮。
      - 根据 ServiceGetData 控制是否显示 actions，或者根据不同状态渲染不同的按钮组。
      - 如果 isDeploy 为 true，根据 ButtonGroupState 和 ErrState 控制是否调用 handleServiceBotton 方法更新按钮状态。
      - 根据不同的来源（第三方或平台组件）渲染不同的标题和描述信息。
  */
  renderMoreService = (buildAppLoading) => {
    const {
      ServiceGetData,
      isDeploy,
      appDetail,
      isMulti,
      // appPermissions: { isDelete }
    } = this.state;
    const { rainbondInfo } = this.props
    const platform_url = rainbondUtil.documentPlatform_url(rainbondInfo);
    const isDelete = true;

    const mr8 = { marginRight: '8px' };
    let actions = [];
    if (ServiceGetData && isMulti) {
      actions = [
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {isDelete && (
            <Button onClick={this.showDelete} type="default" style={mr8}>
              {formatMessage({ id: 'button.abandon_create' })}
            </Button>
          )}
          <Button type="primary" onClick={this.handleMoreService}>

            {formatMessage({ id: 'button.components_build' })}
          </Button>
        </div>
      ];
    } else if (ServiceGetData) {
      actions = [
        <div style={{ display: 'flex' }}>
          {isDelete && (
            <Button onClick={this.showDelete} type="default" style={mr8}>
              {formatMessage({ id: 'button.abandon_create' })}
            </Button>
          )}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              onClick={this.handlePreventClick}
              type="primary"
              style={mr8}
              loading={buildAppLoading}
            >
              {formatMessage({ id: 'button.create' })}
            </Button>
            <div>
              <Tooltip
                placement="topLeft"
                title={
                  <p>
                    {formatMessage({ id: 'componentCheck.tooltip.title.p1' })}
                    <br />
                    {formatMessage({ id: 'componentCheck.tooltip.title.p2' })}
                  </p>
                }
              >
                <Radio
                  size="small"
                  onClick={this.renderSuccessOnChange}
                  checked={isDeploy}
                >
                  {formatMessage({ id: 'button.build_start' })}
                </Radio>
              </Tooltip>
            </div>
          </div>
        </div>
      ];
    } else if (appDetail.service_source === 'third_party') {
      actions = [
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {isDelete && (
              <Button
                onClick={this.handlePreventClick}
                type="primary"
                style={mr8}
                loading={buildAppLoading}
              >
                {formatMessage({ id: 'button.abandon_create' })}
              </Button>
            )}
            <Button type="primary" onClick={this.handleMoreService}>
              {formatMessage({ id: 'button.components_build' })}
            </Button>
          </div>
        </div>
      ];
    } else {
      actions = [
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {isDelete && (
            <Button onClick={this.showDelete} type="default">
              {formatMessage({ id: 'button.abandon_create' })}
            </Button>
          )}
          <Button type="primary" onClick={this.handleMoreService}>

            {formatMessage({ id: 'button.service_build' })}
          </Button>
        </div>
      ];
    }
    if (appDetail.service_source === 'third_party') {
      actions = [
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              onClick={this.handlePreventClick}
              type="primary"
              style={mr8}
              loading={buildAppLoading}
            >
              {formatMessage({ id: 'button.create' })}
            </Button>
          </div>
        </div>
      ];
    }

    const {
      ButtonGroupState = false,
      handleServiceBotton,
      ErrState
    } = this.props;

    if (isDeploy) {
      if (ServiceGetData && (!ButtonGroupState || !ErrState)) {
        handleServiceBotton(actions, true, true);
      }
    } else if (ServiceGetData && (ButtonGroupState || ErrState)) {
      handleServiceBotton(actions, false, false);
    }
    return (
      <Result
        type="success"
        title={
          appDetail.service_source === 'third_party'
            ? formatMessage({ id: 'confirmModal.third_party.check.title.success' })
            : formatMessage({ id: 'confirmModal.component_build.check.model.build' })
        }
        description={
          appDetail.service_source !== 'third_party' && (
            <div>
              <div>{formatMessage({ id: 'componentCheck.tooltip.title.p7' })}</div>
              {formatMessage({ id: 'componentCheck.tooltip.title.p4' })}{' '}
              <a
                href={`${platform_url}docs/use-manual/component-create/language-support/`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {formatMessage({ id: 'componentCheck.tooltip.title.p5' })}
              </a>{' '}
              {formatMessage({ id: 'componentCheck.tooltip.title.p6' })}
            </div>
          )
        }
        extra=""
        actions={ServiceGetData ? '' : actions}
        style={{ marginTop: 48, marginBottom: 16 }}
      />
    );
  };
  /*
    函数名称: renderChecking
    
    功能: 渲染检查中的结果信息
    
    返回值: 一个 Result 组件，显示应用或服务检查中的状态信息
    
    逻辑:
      - 从组件的 props 和状态中获取必要的数据和状态信息。
      - 根据 ServiceGetData 和 ButtonGroupState 控制是否调用 handleServiceBotton 方法更新按钮状态。
      - 如果 ServiceGetData 为 true 并且 ButtonGroupState 为 true，调用 handleServiceBotton 方法更新按钮状态。
      - 根据 eventId 控制是否渲染 LogProcress 组件来展示事件日志处理信息。
      - 渲染 Result 组件，显示检查中的状态、描述和按钮组。
  */
  renderChecking = () => {
    const { ButtonGroupState = false, handleServiceBotton } = this.props;
    const {
      ServiceGetData,
      // appPermissions: { isDelete }
    } = this.state;
    const isDelete = true;
    const actions = isDelete && (
      <Button onClick={this.showDelete} type="default">
        {formatMessage({ id: 'button.abandon_create' })}
      </Button>
    );
    if (ServiceGetData && ButtonGroupState) {
      handleServiceBotton(actions, false);
    }

    const extra = (
      <div>
        {this.state.eventId && (
          <LogProcress
            opened
            socketUrl={this.socketUrl}
            eventId={this.state.eventId}
          />
        )}
      </div>
    );
    return (
      <Result
        type="ing"
        title={formatMessage({ id: 'confirmModal.component.check.title.loading' })}
        extra={extra}
        description={formatMessage({ id: 'confirmModal.component.check.appShare.desc' })}
        actions={ServiceGetData ? '' : actions}
        style={{
          marginTop: 48,
          marginBottom: 16
        }}
      />
    );
  };

  render() {
    const {
      status,
      isMulti,
      appDetail,
      ServiceGetData,
      modifyImageName,
      modifyImageCmd,
      modifyUrl,
      modifyUserpass,
      showKey,
      deleteLoading,
      showDelete,
      buildAppLoading,
      imageAddress
    } = this.state;
    const box = (
      <Card bordered={false}>
        <div
          style={{
            minHeight: 400
          }}
        >
          {status === 'checking' && this.renderChecking()}
          {status === 'success' && isMulti !== true && this.renderSuccess(buildAppLoading)}
          {status === 'success' && isMulti === true && this.renderMoreService(buildAppLoading)}
          {status === 'failure' && this.renderError()}
        </div>
      </Card>
    );
    return (
      <div>
        {ServiceGetData ? box : <Card>{box}</Card>}

        {modifyImageName && (
          <ModifyImageName
            data={appDetail}
            onSubmit={this.handleModifyImageName}
            onCancel={this.cancelModifyImageName}
          />
        )}
        {modifyImageCmd && (
          <ModifyImageCmd
            data={appDetail}
            onSubmit={this.handleModifyImageCmd}
            onCancel={this.cancelModifyImageCmd}
          />
        )}

        {modifyUrl && (
          <ModifyUrl
            data={appDetail}
            onSubmit={this.handleModifyUrl}
            onCancel={this.cancelModifyUrl}
          />
        )}

        {modifyUserpass && (
          <ModifyUrl
            showUsernameAndPass
            data={appDetail}
            onSubmit={this.handleModifyUserpass}
            onCancel={this.cancelModifyUserpass}
          />
        )}

        {showKey && <ShowRegionKey onCancel={this.handleCancelShowKey} />}

        {showDelete && (
          <ConfirmModal
            onOk={this.handleDelete}
            loading={deleteLoading}
            title={formatMessage({ id: 'confirmModal.abandon_create.create_check.title' })}
            subDesc={formatMessage({ id: 'confirmModal.delete.strategy.subDesc' })}
            desc={formatMessage({ id: 'confirmModal.delete.create_check.desc' })}
            onCancel={() => {
              this.setState({ showDelete: false });
            }}
          />
        )}
      </div>
    );
  }
}
