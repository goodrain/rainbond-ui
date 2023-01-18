/* eslint-disable camelcase */
/* eslint-disable array-callback-return */
/* eslint-disable consistent-return */
/* eslint-disable global-require */
/* eslint-disable import/extensions */
/* eslint-disable react/sort-comp */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-unused-expressions */
import EditGroupName from '@/components/AddOrEditGroup';
import AppDirector from '@/components/AppDirector';
import CodeMirrorForm from '@/components/CodeMirrorForm';
import Parameterinput from '@/components/Parameterinput';
import PublicForm from '@/components/PublicForm';
import PublicFormStyles from '@/components/PublicForm/index.less';
import { LoadingOutlined } from '@ant-design/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Collapse,
  Form,
  Icon,
  Modal,
  notification,
  Popover,
  Row,
  Select,
  Skeleton,
  Steps,
  Tabs,
  Tooltip,
  Radio,
  Spin,
  Divider,
  Tag
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import moment from 'moment';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import Markdown from 'react-markdown';
import { Link } from 'umi';
import { postUpgradeRecord } from '../../services/app';
import ConfirmModal from '../../components/ConfirmModal';
import Result from '../../components/Result';
import VisterBtn from '../../components/visitBtnForAlllink';
import NewbieGuiding from '@/components/NewbieGuiding';
import { batchOperation } from '../../services/app';
import globalUtil from '../../utils/global';
import sourceUtil from '../../utils/source-unit';
import rainbondUtil from '../../utils/rainbond';
import CustomFooter from "../../layouts/CustomFooter";
import Instance from '../Component/component/Instance/index';
import AppShape from '../Group/AppShape';
import AppJoinMode from '../Group/AppJoinMode';
import EditorTopology from '../Group/EditorTopology';
import AddServiceComponent from '../Group/AddServiceComponent';
import cookie from '@/utils/cookie';
import ComponentList from '../Group/ComponentList';
import infoUtil from '../Upgrade/UpgradeInfo/info-util';
import styles from './Index.less';
import { loadRegionConfig } from '@/services/cloud';

const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Step } = Steps;
const { Option } = Select;
const FormItem = Form.Item;

// eslint-disable-next-line react/no-multi-comp
@connect(({ user, application, teamControl, enterprise, loading, global }) => ({
  currUser: user.currentUser,
  collapsed: global.collapsed,
  apps: application.apps,
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  novices: global.novices
}))
@Form.create()
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      versionInfoLoading: true,
      versions: [],
      noVersion: false,
      promptMap: {
        8000: formatMessage({ id: "helmAppInstall.index.delete" }),
        8003: formatMessage({ id: "helmAppInstall.index.no" })
      },
      formData: [],
      appInfoLoading: true,
      currentSteps: 0,
      toDelete: false,
      errPrompt: false,
      serviceIds: [],
      promptModal: false,
      code: '',
      currApp: {},
      componentTimer: true,
      submitLoading: false,
      resources: {},
      versionInfo: {},
      appInfo: {},
      type: 'shape',
      upDataVersion: false,
      newVersion: 0,
      buttonType: -1,
      status: 0,
      showConfig: false,
      heightVs: '',
      lowVs: '',
      newAppInfo: {},
      updataInfo: {},
      upgrade_Info: [],
      helminfoLoding: true,
      infoType: false,
      overrides: []
    };
    this.CodeMirrorRef = '';
  }

  componentDidMount() {
    // 从应用商店安装
    if (this.props.location.query && this.props.location.query.installPath == 'market') {
      this.setState({
        currApp: JSON.parse(window.sessionStorage.getItem('appinfo'))
      }, () => {
        this.getHelmvs();
      })
    }
    // 从cmd命令行安装
    if (this.props.location.query && this.props.location.query.installPath == 'cmd') {
      const obj = JSON.parse(window.sessionStorage.getItem('appinfo'));
      this.setState({
        currApp: obj,
        overrides: obj.overrides
      }, () => {
        this.getHelmvs(true);
      })
    }
    // 升级重新安装
    if (this.props.location.query && this.props.location.query.type) {
      // 升级
      if (this.props.location.query.type == 'upgrade') {
        const vs = this.props.location.query.upgrade
        const arr = JSON.parse(window.sessionStorage.getItem('appinfo'))
        const updataInfo = JSON.parse(window.sessionStorage.getItem('updataInfo'))
        this.setState({
          lowVs: arr.version
        })
        arr.version = vs
        this.setState({
          currApp: arr,
          heightVs: vs,
          updataInfo: updataInfo
        }, () => {
          this.getHelmvs()
        })
        // 重新安装
      } else {
        const arr = JSON.parse(window.sessionStorage.getItem('appinfo'))
        const updataInfo = JSON.parse(window.sessionStorage.getItem('updataInfo'))
        this.setState({
          lowVs: arr.version,
          currApp: arr,
          updataInfo: updataInfo
        }, () => {
          this.getHelmvs();
        })
      }
    }
    if (!this.props.location.query) {
      this.setState({
        buttonType: -1
      })
    } else {
      if (this.props.location.query.type == 'upgrade') {
        this.setState({
          buttonType: 1
        })
      } else if (this.props.location.query.type == 'install') {
        this.setState({
          buttonType: 0
        })
      } else {
        this.setState({
          buttonType: -1
        })
      }
    }
  }
  componentWillUnmount() {
    this.closeTimer();
    const { dispatch } = this.props;
    dispatch({ type: 'application/clearGroupDetail' });
  }
  // 升级安装重新安装
  getUpdatedModelId = (vals) => {
    const { dispatch } = this.props;
    const { updataInfo, currApp, } = this.state;
    const { team_name, group_id } = this.fetchParameter();
    this.setState({
      status: 3,
      showConfig: false
    })
    dispatch({
      type: 'application/addHelmModule',
      payload: {
        team_name: team_name,
        repo_name: currApp.app_store_name,
        chart_name: currApp.app_template_name,
        pic: '',
        describe: '',
        details: ''
      },
      callback: res => {
        if (res && res.status_code && res.status_code == 200) {
          const data = JSON.parse(res.bean)
          this.creatHelmModleUp(data.app_model_id, vals)
        }
      },
      handleError: () => {
        this.setState({
          status: 4,
          showConfig: false
        })
      }
    });

  }
  // 升级安装重新安装
  creatHelmModleUp = (id, values) => {
    const { dispatch } = this.props;
    const { team_name, group_id } = this.fetchParameter();
    const { currApp } = this.state;
    dispatch({
      type: 'application/generateHelmModule',
      payload: {
        team_name: team_name,
        name: currApp.app_template_name,
        repo_name: currApp.app_store_name,
        chart_name: currApp.app_template_name,
        version: currApp.version,
        overrides: values.overrides,
        app_model_id: id,
        app_id: group_id
      },
      callback: res => {
        if (res && res.status_code && res.status_code == 200) {
          this.getUpdatedInfo(id);
        }
      },
      handleError: () => {
        this.setState({
          status: 4,
          showConfig: false
        })
      }
    })
  }

  // 获取升级信息
  getUpdatedInfo = (module_id) => {
    const { dispatch } = this.props;
    const { updataInfo, currApp, } = this.state;
    const { team_name, group_id } = this.fetchParameter();
    dispatch({
      type: 'global/CloudAppUpdatedInfo',
      payload: {
        app_model_key: module_id,
        version: currApp.version,
        upgradeGroupID: updataInfo.upgrade_group_id,
        team_name: team_name,
        group_id: group_id,
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState(
            {
              upgrade_Info: res.list || [],
            }, () => {
              postUpgradeRecord({
                team_name,
                appID: group_id,
                noModels: true,
                upgrade_group_id: updataInfo.upgrade_group_id
              }).then(res => {
                this.createUpgradeTasks(this.state.upgrade_Info, res.bean.ID, module_id)
              })
            })
        }
      },
      handleError: () => {
        this.setState({
          status: 4,
          showConfig: false
        })
      }
    });
  }
  // 创建升级任务
  createUpgradeTasks = (services, id, module_id) => {
    const { dispatch } = this.props;
    const { upgrade_Info, currApp, updataInfo } = this.state;
    const { team_name, group_id } = this.fetchParameter();
    const version = currApp.version
    dispatch({
      type: 'global/CloudAppUpdatedTasks',
      payload: {
        team_name,
        group_id,
        group_key: module_id,
        version,
        services,
        upgrade_record_id: id,
        upgrade_group_id: updataInfo.upgrade_group_id
      },
      callback: res => {
        dispatch({
          type: 'global/CloudAppUpdateRecordsInfo',
          payload: {
            team_name,
            group_id,
            upgrade_group_id: updataInfo.upgrade_group_id,
            record_id: id
          },
          callback: (res) => {
            this.getUpgradeRecordsInfo(id)
          }
        })
      },
    });
  };
  // 结束升级任务
  getUpgradeRecordsInfo = (id) => {
    const { dispatch } = this.props;
    const { team_name, group_id } = this.fetchParameter();
    const { upgrade_Info, currApp, updataInfo } = this.state;
    dispatch({
      type: 'global/CloudAppUpdateRecordsInfo',
      payload: {
        team_name,
        group_id,
        upgrade_group_id: updataInfo.upgrade_group_id,
        record_id: id
      },
      callback: (res) => {
        if (res && res.bean && res.bean.is_finished) {
          setTimeout(() => {
            this.jump()
            this.setState({
              showConfig: true
            })
          }, 2000);
        } else {
          this.getUpgradeRecordsInfo(id);
        }
      }
    })
  }
  // 获取应用列表与当前helm应用信息版本信息
  getHelmvs = (bool) => {
    const { dispatch } = this.props;
    const { currApp } = this.state;
    const { team_name, group_id } = this.fetchParameter();
    dispatch({
      type: 'createApp/getHelmVersion',
      payload: {
        repo_name: currApp.app_store_name,
        chart_name: currApp.app_template_name,
        highest: '',
        team_name: team_name,
        app_id: group_id,
      },
      callback: res => {
        if (res && res.bean) {
          const info = res.bean;
          const arr = info.chart_information;
          if (info.repo_exist) {
            this.fethelmAppIinfo();
            this.setState({
              versions: arr,
              helminfoLoding: false
            })
            !bool && this.setState({
              overrides: info.overrides,
            })
          } else {
            this.setState({
              infoType: true,
              versions: arr,
              helminfoLoding: false,
              status: 2
            })
          }
        }
      },
      handleError: res => {
        this.setState({
          status: 2
        })
      }
    });
  }
  // 获取检测结果
  fethelmAppIinfo = () => {
    const { currApp } = this.state
    const { dispatch } = this.props;
    cookie.set('team_name', currApp.team_name)
    cookie.set('region_name', currApp.region_name)
    const { team_name, group_id } = this.fetchParameter();
    dispatch({
      type: 'createApp/helmAppInstall',
      payload: {
        name: currApp.app_template_name,
        repo_name: currApp.app_store_name,
        chart_name: currApp.app_template_name,
        version: currApp.version,
        team_name: team_name,
      },
      callback: res => {
        if (res && res.bean) {
          cookie.set('team_name', '')
          cookie.set('region_name', '')
          if (res.bean.checkAdopt == 'true') {
            this.setState({
              status: 1,
            })
          } else {
            this.setState({
              status: 2,
              msg: res.bean.yaml
            })
          }
        }
      },
      handleError: res => {
        this.setState({
          status: 2
        })
      }
    })

  }
  // 版本比较
  compareVersion = (v1, v2) => {
    v1 = v1.split('.')
    v2 = v2.split('.')
    const len = Math.max(v1.length, v2.length)

    while (v1.length < len) {
      v1.push('0')
    }
    while (v2.length < len) {
      v2.push('0')
    }

    for (let i = 0; i < len; i++) {
      const num1 = parseInt(v1[i])
      const num2 = parseInt(v2[i])

      if (num1 > num2) {
        this.setState({
          buttonType: 1
        })
        return;
      } else if (num1 < num2) {
        this.setState({
          buttonType: -1
        })
        return;
      }
    }
    this.setState({
      buttonType: 0
    })
  }
  closeTimer = () => {
    if (this.timer) {
      clearInterval(this.timer);
    }
  };
  fetchHelmAppStoresVersions = version => {
    const { dispatch, currentEnterprise } = this.props;
    const { currApp } = this.state;
    dispatch({
      type: 'application/fetchHelmAppStoresVersions',
      payload: {
        enterprise_id: currentEnterprise.enterprise_id,
        version,
        appStoreName: currApp.app_store_name,
        templateName: currApp.app_template_name
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState(
            {
              versionInfo: res,
              versionInfoLoading: false,
              formData:
                (res &&
                  res.questions &&
                  res.questions.length > 0 &&
                  res.questions) ||
                []
            },
            () => {
              if (res && res.values) {
                this.handleTemplateFile(Object.keys(res.values).reverse()[0]);
              }
            }
          );
        }
      },
      handleError: res => {
        this.setState({
          status: 2
        })
      }
    });
  };
  beforeUpload = (file, isMessage) => {
    const fileArr = file.name.split('.');
    const { length } = fileArr;
    const isRightType =
      fileArr[length - 1] === 'yaml' || fileArr[length - 1] === 'yml';
    if (!isRightType) {
      if (isMessage) {
        notification.warning({
          message: formatMessage({ id: 'notification.warn.yaml_file' })
        });
      }
      return false;
    }
    return true;
  };

  encodeBase64Content = commonContent => {
    const base64Content =
      (commonContent && Buffer.from(commonContent).toString('base64')) || '';
    return base64Content;
  };

  decodeBase64Content = base64Content => {
    let commonContent =
      (base64Content && base64Content.replace(/\s/g, '+')) || '';
    if (commonContent) {
      commonContent = Buffer.from(commonContent, 'base64').toString();
    }
    return commonContent;
  };
  handleSubmit = type => {
    const { form } = this.props;
    const { validateFields, setFields } = form;
    validateFields((err, val) => {
      if (!err) {
        this.setState({
          submitLoading: true
        });
        const values = this.encodeBase64Content(val.yamls);
        let isError = false;
        let overrides = {};

        if (val.overrides && val.overrides.length > 0) {
          val.overrides.map(item => {
            const { item_key: itemKey, item_value: itemValue } = item;
            if (!itemKey || !itemValue || itemKey === '' || itemValue === '') {
              isError = true;
            } else {
              overrides[itemKey] = itemValue;
            }
          });
        } else {
          overrides = undefined;
        }
        if (isError) {
          setFields({
            overrides: {
              errors: [new Error(formatMessage({ id: "helmAppInstall.index.input_config" }))]
            }
          });
          this.setState({
            submitLoading: false
          });
          return null;
        }

        Object.keys(val).forEach(key => {
          if (
            key !== 'templateFile' &&
            key !== 'version' &&
            key !== 'yamls' &&
            key !== 'overrides'
          ) {
            if (
              !Object.prototype.toString.call(overrides) ===
              '[Object Object]' ||
              overrides === undefined
            ) {
              overrides = {};
            }
            const setKey = key.replace(new RegExp('\\#-#', 'g'), '.');
            const setValue = val[key];
            overrides[setKey] = `${setValue}`;
          }
        });

        const info = Object.assign({}, val, { yamls: values, overrides });
        if (type === 'Create') {
          this.handleInstallHelmApp(info);
        } else {
          this.getUpdatedModelId(info);
        }
      }
    });
  };
  // 新建应用模板
  handleInstallHelmApp = values => {
    const { dispatch } = this.props;
    const { currApp } = this.state;
    const { team_name, group_id } = this.fetchParameter();
    this.setState({
      showConfig: false,
      status: 3
    })
    dispatch({
      type: 'application/addHelmModule',
      payload: {
        team_name: team_name,
        repo_name: currApp.app_store_name,
        chart_name: currApp.app_template_name,
        pic: '',
        describe: '',
        details: ''
      },
      callback: res => {
        if (res && res.status_code && res.status_code == 200) {
          const data = JSON.parse(res.bean)
          this.creatHelmModle(data.app_model_id, values)
        }
      },
      handleError: () => {
        this.setState({
          status: 4,
          showConfig: false
        })
      }
    });
  };
  // 生成应用模板
  creatHelmModle = (id, values) => {
    const { dispatch } = this.props;
    const { team_name, group_id } = this.fetchParameter();
    const { currApp } = this.state;
    dispatch({
      type: 'application/generateHelmModule',
      payload: {
        team_name: team_name,
        name: currApp.app_template_name,
        repo_name: currApp.app_store_name,
        chart_name: currApp.app_template_name,
        version: currApp.version,
        overrides: values.overrides,
        app_model_id: id,
        app_id: group_id
      },
      callback: res => {
        if (res && res.status_code && res.status_code == 200) {
          this.installHelmApp(id, values)
        }
      },
      handleError: () => {
        this.setState({
          status: 4,
          showConfig: true
        })
      }
    })
  }
  // 安装helm应用
  installHelmApp = (id, values) => {
    const { dispatch } = this.props;
    const { team_name, group_id } = this.fetchParameter();
    const { currApp } = this.state;
    dispatch({
      type: 'createApp/installApp',
      payload: {
        ...currApp,
        team_name: team_name,
        app_id: id,
        is_deploy: currApp.is_deploy == false ? false : true,
        app_version: currApp.version,
        install_from_cloud: false,
        marketName: 'localApplication',
        group_id: group_id
      },
      callback: (res) => {
        if (res && res.status_code && res.status_code == 200) {
          this.jump();
        }
      },
      handleError: () => {
        this.setState({
          status: 4,
          showConfig: false
        })
      }
    })
  }
  // 跳转地址
  jump = () => {
    const { dispatch } = this.props;
    window.sessionStorage.setItem('updata', JSON.stringify(true))
    dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${globalUtil.getAppID()}`
      )
    )


  }
  handleEditHelmApp = values => {
    const { dispatch } = this.props;
    const { currApp } = this.state;
    const { team_name, group_id } = this.fetchParameter();
  };
  handleOperationBtn = type => {
    const { submitLoading, errPrompt, noVersion, upDataVersion, buttonType } = this.state;
    return (
      <div style={{ textAlign: 'center' }} id="messagesEndRef">
        <Button
          onClick={() => {
            this.handleSubmit(type);
          }}
          disabled={upDataVersion || errPrompt || noVersion}
          loading={submitLoading}
          type="primary"
        >
          {buttonType === 0 ? formatMessage({ id: "helmAppInstall.index.reinstall" }) : buttonType === 1 ? formatMessage({ id: "helmAppInstall.index.up" }) : formatMessage({ id: "helmAppInstall.index.install" })}
        </Button>
      </div>
    );
  };
  fetchParameter = () => {
    const { currentEnterprise, appID } = this.props;
    return {
      enterprise_id: currentEnterprise.enterprise_id,
      team_name: globalUtil.getCurrTeamName(),
      region_name: globalUtil.getCurrRegionName(),
      group_id: globalUtil.getAppID(),
    };
  };
  back = () => {
    window.history.back();
  }
  next = () => {
    this.setState({
      showConfig: true
    })
    if (this.props.location.query.type == 'upgrade') {
      const { heightVs } = this.state;
      this.fetchHelmAppStoresVersions(heightVs);
    } else {
      const { version } = this.state.currApp;
      this.fetchHelmAppStoresVersions(version);
    }
  }
  fetchPrefixUrl = () => {
    const { team_name, region_name } = this.fetchParameter();
    return `/team/${team_name}/region/${region_name}/`;
  };
  handleErrPrompt = res => {
    if (res && res.data && res.data.code) {
      const { promptMap } = this.state;
      const errPrompt = promptMap[res.data.code] || false;
      if (res.data.code === 8004) {
        this.setState({
          noVersion: true
        });
      } else if (errPrompt) {
        this.setState({
          errPrompt,
          noVersion: false
        });
      }
    }
    this.handleAppInfoLoading();
    this.handleUpDataVersionLoading();
  };
  handleAppVersion = (value, isParse, isVersion) => {
    const { versions, newVersion, resources, currApp } = this.state;
    currApp.version = value;
    this.setState({
      currApp: currApp
    })
    if (isParse) {
      if (isVersion) {
        this.setState({
          upDataVersion: formatMessage({ id: "helmAppInstall.index.updata_info" }),
          noVersion: false
        });
      }
      this.fetchHelmAppStoresVersions(value);
    }

    this.handleAppInfoLoading();
  };
  handleTemplateFile = value => {
    const { form } = this.props;
    const { setFieldsValue } = form;
    const { versionInfo } = this.state;
    const { CodeMirrorRef } = this;
    if (versionInfo.values) {
      const val =
        (versionInfo.values[value] &&
          this.decodeBase64Content(versionInfo.values[value])) ||
        '';
      setFieldsValue({
        yamls: val
      });
      setFieldsValue({
        templateFile: value
      });
      if (CodeMirrorRef) {
        const editor = CodeMirrorRef.getCodeMirror();
        editor.setValue(val);
      }
    }
    this.handleUpDataVersionLoading();
  };
  handleUpDataVersionLoading = () => {
    this.setState({
      upDataVersion: false
    });
  };
  handleAppInfoLoading = () => {
    this.setState({
      appInfoLoading: false
    });
  };
  // 检验失败
  operationError = () => {
    const { infoType, msg } = this.state
    return <Card style={{ marginTop: 20 }}>
      <Result
        type="error"
        title={formatMessage({ id: "helmAppInstall.index.detection_failure" })}
        description={<>
          {!infoType ? 
          formatMessage({ id: "helmAppInstall.index.detection_back" }) 
          : 
          formatMessage({ id: "helmAppInstall.index.delete" })}
          <p style={{color:'red'}}>
            {formatMessage({id:'helmAppInstall.index.error'})}{msg||'-'}
          </p>
          </>
        }
        actions={
          <>
            <Button onClick={this.back}>{formatMessage({ id: "helmAppInstall.index.back" })}</Button>
          </>
        }
        style={{
          marginTop: 48,
          marginBottom: 16
        }}
      />,
    </Card>
  }
  // 安装失败
  installError = () => {
    return <Card style={{ marginTop: 20 }}>
      <Result
        type="error"
        title={formatMessage({ id: "helmAppInstall.index.install_failure" })}
        description={formatMessage({ id: "helmAppInstall.index.install_back" })}
        actions={
          <>
            <Button onClick={this.back}>{formatMessage({ id: "helmAppInstall.index.back" })}</Button>
          </>
        }
        style={{
          marginTop: 48,
          marginBottom: 16
        }}
      />,
    </Card>
  }
  // 安装成功
  operationSuccess = () => {
    return <Card style={{ marginTop: 20 }}>
      <Result
        type="success"
        title={formatMessage({ id: "helmAppInstall.index.detection_success" })}
        description={formatMessage({ id: "helmAppInstall.index.detection_next" })}
        actions={
          <Button onClick={this.next}>{formatMessage({ id: "helmAppInstall.index.next" })}</Button>
        }
        style={{
          marginTop: 48,
          marginBottom: 16
        }}
      />,
    </Card>
  }
  // 检验中
  operationInstall = () => {
    return <Card style={{ marginTop: 20 }}>
      <Result
        type="ing"
        title={formatMessage({ id: "helmAppInstall.index.detecting" })}
        description={formatMessage({ id: "helmAppInstall.index.detecting_await" })}
        style={{
          marginTop: 48,
          marginBottom: 16
        }}
      />,
    </Card>
  }
  // 安装中
  Install = () => {
    const { buttonType } = this.state
    return <Card style={{ marginTop: 20 }}>
      <Result
        type="ing"
        title={buttonType === 0 ? formatMessage({ id: "helmAppInstall.index.Being_reinstalled" }) : buttonType === 1 ? formatMessage({ id: "helmAppInstall.index.in_upgrade" }) : formatMessage({ id: "helmAppInstall.index.in_install" })}
        description={formatMessage({ id: "helmAppInstall.index.need_time" })}
        style={{
          marginTop: 48,
          marginBottom: 16
        }}
      />,
    </Card>
  }
  handleConfing = () => {
    const { form } = this.props;
    const type = this.props.location && this.props.location.query && this.props.location.query.type
    const { getFieldDecorator, setFieldsValue, getFieldValue } = form;
    const {
      versionInfo,
      versionInfoLoading,
      resources,
      currentSteps,
      versions,
      errPrompt,
      noVersion,
      upDataVersion,
      formData,
      newVersion,
      currApp,
      heightVs,
      lowVs,
      overrides
    } = this.state;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 }
      },
      wrapperCol: {
        xs: { span: 24 }
      }
    };
    let overridess = overrides || ''
    if (overrides && overrides.length > 0) {
      const arr = [];
      overrides.map(item => {
        Object.keys(item).forEach(key => {
          arr.push({
            item_key: key,
            item_value: item[key]
          });
        });
      });
      overridess = arr;
    }
    const valueFiles = versionInfo.values
      ? Object.keys(versionInfo.values).reverse()
      : [];
    return (
      <Form labelAlign="left">
        <Collapse bordered={false} defaultActiveKey={['2']}>
          <Panel
            header={
              <div className={styles.customPanelHeader}>
                <h6>{formatMessage({ id: 'appOverview.helm.pages.option' })}</h6>
                <p>{formatMessage({ id: 'appOverview.helm.pages.standard' })}</p>
              </div>
            }
            key="2"
            className={styles.customPanel}
          >
            <Skeleton loading={versionInfoLoading}>
              <div style={{ padding: '15px 30px' }}>
                {formData && formData.length > 0 && (
                  <PublicForm
                    Form={Form}
                    data={formData}
                    upDateQuestions={data => {
                      this.setState({
                        formData: data
                      });
                    }}
                    setFieldsValue={setFieldsValue}
                    formItemLayout={formItemLayout}
                    getFieldValue={getFieldValue}
                    getFieldDecorator={getFieldDecorator}
                  />
                )}
                <div className={PublicFormStyles.over_hr}>
                  <span>{formatMessage({ id: 'appOverview.helm.pages.over_hr' })}</span>
                </div>
                <FormItem {...formItemLayout} label={formatMessage({ id: 'appOverview.helm.pages.overrides' })}>
                  {getFieldDecorator('overrides', {
                    initialValue: overridess || [],
                    rules: [{ required: false, message: formatMessage({ id: 'placeholder.helm.overrides' }) }]
                  })(
                    <Parameterinput
                      disableds={upDataVersion || errPrompt || noVersion}
                      isHalf
                      editInfo={overridess || ''}
                    />
                  )}
                </FormItem>
                <Row>
                  {type && (
                    <Col span={12}>
                      <FormItem {...formItemLayout} label={formatMessage({ id: 'appOverview.helm.pages.version' })} extra={type == 'upgrade' ? formatMessage({ id: 'helmAppInstall.index.now_version' }, { lowVs: lowVs }) : ''}>
                        {getFieldDecorator('version', {
                          initialValue: (type == 'upgrade' ? this.props.location.query.upgrade || undefined : currApp.version || undefined),
                          rules: [
                            {
                              required: true,
                              message: formatMessage({ id: 'placeholder.helm.version' })
                            }
                          ]
                        })(
                          <Select
                            placeholder={formatMessage({ id: 'placeholder.helm.version' })}
                            style={{ width: '95%' }}
                            disabled={upDataVersion || errPrompt}
                            onChange={val => {
                              this.handleAppVersion(val, true, true);
                            }}
                          >
                            {versions.map(item => {
                              const { Version } = item;
                              return (
                                <Option key={Version} value={Version} onClick={() => { this.compareVersion(Version, currApp.version) }}>
                                  {Version == lowVs
                                    ? <><span>{Version}</span>
                                      <span style={{ background: '#fae2c2', marginLeft: 10, padding: 3, borderRadius: 3 }}>{formatMessage({ id: 'appOverview.helm.pages.current_version' })}</span></>
                                    : Version === versions[0].Version
                                      ? <><span>{Version}</span>
                                        <span style={{ background: '#b7edb1', marginLeft: 10, padding: 3, borderRadius: 3 }}>{formatMessage({ id: 'helmAppInstall.index.new' })}</span></>
                                      : Version
                                  }
                                </Option>
                              );
                            })}
                          </Select>
                        )}
                      </FormItem>
                    </Col>
                  )}
                  <Col span={12}>
                    {(upDataVersion || noVersion) && (
                      <Alert
                        style={{ marginTop: '40px' }}
                        message={
                          noVersion
                            ? formatMessage({ id: 'appOverview.helm.pages.alert.message' })
                            : upDataVersion
                        }
                        type="warning"
                      />
                    )}
                  </Col>
                </Row>
                <Col span={24} style={{ position: 'relative', zIndex: 1 }}>
                  <FormItem
                    {...formItemLayout}
                    label={formatMessage({ id: 'appOverview.helm.pages.yaml.templateFile' })}
                    className={styles.clearStar}
                  >
                    {getFieldDecorator('templateFile', {
                      initialValue: valueFiles.length > 0 && valueFiles[0],
                      rules: [{ required: true, message: formatMessage({ id: 'placeholder.templateFile' }) }]
                    })(
                      <Select
                        placeholder={formatMessage({ id: 'placeholder.templateFile' })}
                        style={{ width: '100%' }}
                        onChange={this.handleTemplateFile}
                        disabled={upDataVersion || errPrompt || noVersion}
                      >
                        {valueFiles.map(key => {
                          return (
                            <Option key={key} value={key}>
                              {key}
                            </Option>
                          );
                        })}
                      </Select>
                    )}
                  </FormItem>
                </Col>
                <CodeMirrorForm
                  disabled
                  data=""
                  bg="151718"
                  width="100%"
                  isUpload={false}
                  saveRef={ref => {
                    this.CodeMirrorRef = ref;
                  }}
                  marginTop={120}
                  setFieldsValue={setFieldsValue}
                  formItemLayout={formItemLayout}
                  Form={Form}
                  getFieldDecorator={getFieldDecorator}
                  beforeUpload={this.beforeUpload}
                  mode="yaml"
                  name="yamls"
                  message={formatMessage({ id: 'appOverview.helm.pages.yaml.yamlMsg' })}
                />
                {type && this.handleOperationBtn('UpDate')}
              </div>
            </Skeleton>
          </Panel>
          <Panel
            header={
              <div className={styles.customPanelHeader}>
                <h6>{formatMessage({ id: 'appOverview.helm.pages.appIntroduce' })}</h6>
                <p>{formatMessage({ id: 'appOverview.helm.pages.explain' })}</p>
              </div>
            }
            key="1"
            className={styles.customPanel}
          >
            <div style={{ padding: '15px 30px' }}>
              <Skeleton loading={versionInfoLoading}>
                <Markdown
                  className={styles.customMD}
                  source={
                    (versionInfo.readme &&
                      this.decodeBase64Content(versionInfo.readme)) ||
                    ''
                  }
                />
              </Skeleton>
            </div>
          </Panel>
        </Collapse>
        {!type && this.handleOperationBtn('Create')}
      </Form >
    );
  };
  render() {
    const {
      versions,
      currApp,
      resources,
      toDelete,
      currentSteps,
      errPrompt,
      appInfo,
      appInfoLoading,
      buttonType,
      status,
      showConfig,
      helminfoLoding
    } = this.state;
    const obj = { ...versions[0] }
    const arr = obj.Keywords
    const pageHeaderContent = (
      <>
        <Card>
          <Row
            style={{
              display: "flex",
              alignItems: "center",
            }}>
            <Skeleton loading={helminfoLoding}>
              <Col span={12}
                style={{
                  display: 'flex',
                  width: '50%'
                }}>
                <div>
                  <img
                    style={{ width: '60px', marginRight: '10px' }}
                    alt=""
                    src={
                      obj.Pic ||
                      'https://gw.alipayobjects.com/zos/rmsportal/MjEImQtenlyueSmVEfUD.svg'
                    }
                  />
                </div>
                <div className={styles.name_div}>
                  <p className={styles.name_span}>{currApp.app_template_name || '-'}</p>
                  <Tooltip
                    placement="top"
                    title={obj.Abstract || ' - '}
                  >
                    <p style={{ color: 'rgba(0, 0, 0, 0.85)' }}>
                      {obj.Abstract || ' - '}
                    </p>
                  </Tooltip>
                </div>
              </Col>
              <Col span={3}>
                <div className={styles.lable_style}>
                  <span>{formatMessage({ id: 'appOverview.versions' })}</span>
                  <span>{currApp.version || '-'}</span>
                </div>
              </Col>
              {/* <Col span={3}>
              <div className={styles.lable_style}>
                <span>维护者</span>
                <span>
                  {currApp.principal ? (
                    <Tooltip
                      placement="top"
                      title={
                        <div>
                          <div>{formatMessage({ id: 'appOverview.principal.username' })}{currApp.username}</div>
                          <div>{formatMessage({ id: 'appOverview.principal.principal' })}{currApp.principal}</div>
                          <div>{formatMessage({ id: 'appOverview.principal.email' })}{currApp.email}</div>
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
                </span>
              </div>
            </Col> */}
              <Col span={6}>
                <div className={styles.lable_style}>
                  <span>{formatMessage({ id: "helmAppInstall.index.key" })}</span>
                  {arr && arr.length > 0 &&
                    <span className={styles.tag_style}>
                      {
                        arr.length > 3 ? (
                          <>
                            <Tooltip
                              placement="top"
                              title={
                                arr.map(item => {
                                  return <Tag style={{ marginTop: 10 }}>
                                    {item}
                                  </Tag>
                                })
                              }>
                              {arr.slice(0, 3).map(item => {
                                return <Tag>
                                  {item}
                                </Tag>
                              })}
                              <span>...</span>
                            </Tooltip>
                          </>
                        ) : (
                          arr.map(item => {
                            return <Tag>
                              {item}
                            </Tag>
                          })
                        )
                      }
                    </span>
                  }
                </div>
              </Col>
            </Skeleton>
          </Row>
        </Card>
      </>
    )
    const {
      team_name: teamName,
      region_name: regionName,
      group_id: groupId
    } = this.fetchParameter();
    return (
      <Fragment>
        {/* 应用信息头部 */}
        <Row>{pageHeaderContent}</Row>
        {/* 检测中 */}
        {!showConfig && status == 0 && this.operationInstall()}
        {/* 检测结果成功 */}
        {!showConfig && status == 1 && this.operationSuccess()}
        {/* 检测结果失败 */}
        {!showConfig && status == 2 && this.operationError()}
        {/* 安装中 */}
        {!showConfig && status == 3 && this.Install()}
        {/* 安装失败 */}
        {!showConfig && status == 4 && this.installError()}
        {/* 应用信息展示 */}
        {showConfig &&
          <div className={styles.customCollapse}>
            {this.handleConfing()}
          </div>
        }
        <CustomFooter />
      </Fragment>
    );
  }
}
