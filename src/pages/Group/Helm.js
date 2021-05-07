/* eslint-disable import/extensions */
/* eslint-disable react/sort-comp */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-unused-expressions */
import AccessPrompt from '@/components/AccessPrompt';
import EditGroupName from '@/components/AddOrEditGroup';
import AppDirector from '@/components/AppDirector';
import CodeMirrorForm from '@/components/CodeMirrorForm';
import Parameterinput from '@/components/Parameterinput';
import { LoadingOutlined } from '@ant-design/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  Collapse,
  Form,
  Icon,
  Modal,
  notification,
  Row,
  Select,
  Steps,
  Tabs,
  Tooltip
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import moment from 'moment';
import React, { Fragment, PureComponent } from 'react';
import Markdown from 'react-markdown';
import ConfirmModal from '../../components/ConfirmModal';
import Result from '../../components/Result';
import VisterBtn from '../../components/visitBtnForAlllink';
import { batchOperation } from '../../services/app';
import globalUtil from '../../utils/global';
import sourceUtil from '../../utils/source-unit';
import Instance from '../Component/component/Instance/index';
import infoUtil from '../Upgrade/info-util';
import AddAssociatedComponents from './AddAssociatedComponents';
import styles from './Index.less';

const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Step } = Steps;
const { Option } = Select;
const FormItem = Form.Item;

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
      linkList: [],
      versions: [],
      appStateLoading: true,
      appInfoLoading: true,
      serviceLoading: false,
      activeServices: '',
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
        },
        {
          key: 'installing',
          value: '安装中'
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
        installing: 3,
        installed: 4
      },
      checkList: [
        { type: 'ChartReady', ready: false, error: '' },
        { type: 'PreInstalled', ready: false, error: '' },
        { type: 'ChartParsed', ready: false, error: '' }
      ],
      services: [],
      freeComponents: [],
      associatedComponents: [],
      currentSteps: 0,
      toDelete: false,
      toEdit: false,
      promptTitle: false,
      toEditAppDirector: false,
      serviceIds: [],
      promptModal: false,
      code: '',
      currApp: {},
      AssociatedComponents: false,
      componentTimer: true,
      showAccess: false,
      createComponentLoading: false,
      submitLoading: false,
      servicesLoading: true,
      resources: {},
      appInfo: {},
      isInstall: false,
      isScrollToBottom: true,
      isAccessPermissions: true
    };
    this.CodeMirrorRef = '';
  }

  componentDidMount() {
    this.loading();
  }

  componentWillUnmount() {
    this.closeTimer();
    const { dispatch } = this.props;
    dispatch({ type: 'application/clearGroupDetail' });
  }
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
    this.fetchAppDetail(true);
  };
  handleHelmCheck = () => {
    const { dispatch } = this.props;
    const { currentSteps } = this.state;
    if (currentSteps > 2) {
      return null;
    }
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
        }
        this.handleTimers(
          'timer',
          () => {
            this.handleHelmCheck();
          },
          3000
        );
      }
    });
  };
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

  fetchAppDetail = init => {
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
          this.setState(
            {
              currApp: res.bean
            },
            () => {
              init && this.fetchAppDetailState();
            }
          );
        }
      },
      handleError: res => {
        const { componentTimer } = this.state;
        if (!componentTimer) {
          return null;
        }
        init && this.fetchAppDetailState();
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
    const { dispatch, form } = this.props;
    const { teamName, appID } = this.props.match.params;
    const { getFieldValue } = form;

    const {
      appStateMap,
      currentSteps: oldSteps,
      isScrollToBottom
    } = this.state;
    this.closeTimer();
    dispatch({
      type: 'application/fetchAppDetailState',
      payload: {
        team_name: teamName,
        group_id: appID
      },
      callback: res => {
        const currentSteps =
          (res.list && res.list.phase && appStateMap[res.list.phase]) || 0;
        this.setState(
          {
            resources: res.list || {},
            appStateLoading: false,
            currentSteps: currentSteps > oldSteps ? currentSteps : oldSteps
          },
          () => {
            if (currentSteps < 2) {
              this.handleHelmCheck();
            }
            if (currentSteps === 2 && isScrollToBottom) {
              this.scrollToBottom();
            }
            if (currentSteps >= 2) {
              const templateFile = getFieldValue('templateFile');
              if (res.list && res.list.values && !templateFile) {
                this.handleTemplateFile(Object.keys(res.list.values)[0]);
              }
              this.getHelmApplication();
            } else {
              this.handleAppInfoLoading();
            }

            if (currentSteps >= 4) {
              this.handleServices();
              this.fetchFreeComponents();
              this.fetchAppAccess();
            }
          }
        );
        this.handleTimers(
          'timer',
          () => {
            this.fetchAppDetailState();
            this.fetchAppDetail();
          },
          10000
        );
      },
      handleError: err => {
        this.setState({
          appStateLoading: false
        });
        this.handleAppInfoLoading();
        this.handleError(err);
        this.handleTimers(
          'timer',
          () => {
            this.fetchAppDetailState();
            this.fetchAppDetail();
          },
          20000
        );
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
      this.fetchAppDetailState(true);
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
    const {
      currentSteps,
      currApp,
      serviceLoading,
      showAccess,
      isAccessPermissions,
      freeComponents
    } = this.state;
    dispatch({
      type: 'application/fetchServices',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.getGroupId()
      },
      callback: res => {
        if (res && res.status_code === 200) {
          const services = res.list || [];
          const batchServices = [];
          services.map(item => {
            batchServices.push({
              service_name: item.service_name,
              address: item.address,
              ports: item.tcp_ports
            });
          });
          if (
            currApp &&
            currApp.service_num < 1 &&
            currentSteps >= 4 &&
            !serviceLoading &&
            !showAccess &&
            isAccessPermissions &&
            freeComponents &&
            freeComponents.length < 1
          ) {
            this.setState({ showAccess: batchServices });
          }

          this.setState({
            services
          });
          if (services && services.length > 0) {
            this.fetchAssociatedComponents(services[0].service_name);
          }
        }
        this.cancelServices();
      },
      handleError: () => {
        this.cancelServices();
      }
    });
  };
  cancelServices = () => {
    this.setState({
      servicesLoading: false
    });
  };
  handleUpDataHeader = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/IsUpDataHeader',
      payload: { isUpData: true }
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
        this.fetchAppDetailState(false);
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
          this.fetchAppDetailState(false);
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
  handleJumpStore = target => {
    const { dispatch, currentEnterprise } = this.props;
    dispatch(
      routerRedux.push(
        `/enterprise/${currentEnterprise.enterprise_id}/shared/${target}`
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
        const overrides = {};

        if (val.overrides && val.overrides.length > 0) {
          val.overrides.map(item => {
            const { item_key: itemKey, item_value: itemValue } = item;
            if (!itemKey || !itemValue || itemKey === '' || itemValue === '') {
              isError = true;
            } else {
              overrides[itemKey] = itemValue;
            }
          });
        }
        if (isError) {
          setFields({
            overrides: {
              errors: [new Error('请填写配置项')]
            }
          });
          this.setState({
            submitLoading: false
          });
          return null;
        }

        const info = Object.assign({}, val, { yamls: values, overrides });
        if (type === 'Create') {
          this.handleInstallHelmApp(info);
        } else {
          this.handleEditHelmApp(info);
        }
      }
    });
  };
  AddAssociatedComponents = () => {
    this.fetchAssociatedComponents(false);
    this.cancelAssociatedComponents();
  };
  fetchAssociatedComponents = name => {
    const { dispatch } = this.props;
    const { activeServices } = this.state;
    dispatch({
      type: 'application/fetchAssociatedComponents',
      payload: {
        service_name: activeServices || name,
        tenantName: globalUtil.getCurrTeamName(),
        groupId: this.getGroupId()
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            activeServices: activeServices || name,
            associatedComponents: res.list || []
          });
        }
      }
    });
  };

  fetchFreeComponents = showAccess => {
    const { dispatch } = this.props;
    dispatch({
      type: 'application/fetchFreeComponents',
      payload: {
        tenantName: globalUtil.getCurrTeamName(),
        groupId: this.getGroupId()
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            freeComponents: res.list || []
          });
          if (showAccess) {
            this.setState({
              isInstall: true,
              createComponentLoading: false,
              showAccess: false
            });
          }
        }
      }
    });
  };

  fetchAppAccess = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'application/fetchAppAccess',
      payload: {
        tenantName: globalUtil.getCurrTeamName(),
        groupId: this.getGroupId()
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            linkList: res.list || []
          });
        }
      }
    });
  };

  CreateAppBatchComponents = () => {
    const { dispatch } = this.props;
    const { showAccess } = this.state;
    this.setState(
      { createComponentLoading: true, isAccessPermissions: false },
      () => {
        dispatch({
          type: 'application/CreateAppBatchComponents',
          payload: {
            tenantName: globalUtil.getCurrTeamName(),
            groupId: this.getGroupId(),
            data: showAccess
          },
          callback: res => {
            if (res && res.status_code === 200) {
              this.fetchFreeComponents(showAccess);
            }
          }
        });
      }
    );
  };

  handleAssociatedComponents = AssociatedComponents => {
    this.setState({
      AssociatedComponents
    });
  };
  handleTabs = key => {
    this.setState({ activeServices: key }, () => {
      this.fetchAssociatedComponents(key);
    });
  };
  cancelAssociatedComponents = () => {
    this.setState({
      AssociatedComponents: false
    });
  };
  handleThird = appAlias => {
    const { dispatch } = this.props;
    dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${appAlias}/thirdPartyServices`
      )
    );
  };
  handleComponent = appAlias => {
    const { dispatch } = this.props;
    dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${appAlias}/overview`
      )
    );
  };
  parseChart = value => {
    const { dispatch } = this.props;
    dispatch({
      type: 'application/parseChart',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.getGroupId(),
        version: value
      },
      callback: res => {
        if (res && res.status_code === 200) {
          if (res.bean && res.bean.values) {
            this.handleTemplateFile(Object.keys(res.bean.values)[0]);
          }
        }
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
        overrides: values.overrides,
        values: values.yamls
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            currentSteps: 3,
            submitLoading: false
          });
        }
      }
    });
  };

  handleEditHelmApp = values => {
    const { dispatch } = this.props;
    const { currApp } = this.state;
    dispatch({
      type: 'application/editHelmApp',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.getGroupId(),
        overrides: values.overrides,
        values: values.yamls,
        username: currApp.username,
        app_name: currApp.group_name,
        app_note: currApp.note,
        version: values.version
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.fetchAppDetailState();
          notification.success({ message: '更新中、请耐心等待' });
        }
        this.setState({
          submitLoading: false
        });
      }
    });
  };
  handleCancelShowAccess = () => {
    this.setState({
      isInstall: false,
      isAccessPermissions: false,
      showAccess: false
    });
  };
  scrollToBottom = () => {
    const messagesEndRef = document.getElementById('messagesEndRef');
    if (messagesEndRef) {
      messagesEndRef.scrollIntoView({ behavior: 'smooth' });
      this.setState({ isScrollToBottom: false });
    }
  };
  handleOperationBtn = type => {
    const { submitLoading, promptTitle } = this.state;
    return (
      <div style={{ textAlign: 'center' }} id="messagesEndRef">
        <Button
          onClick={() => {
            this.handleSubmit(type);
          }}
          disabled={promptTitle}
          loading={submitLoading}
          type="primary"
        >
          {type === 'Create' ? '启动' : '更新'}
        </Button>
      </div>
    );
  };
  getHelmApplication = () => {
    const { dispatch, currentEnterprise } = this.props;
    const { currApp, resources } = this.state;
    dispatch({
      type: 'global/fetchHelmApplication',
      payload: {
        enterprise_id: currentEnterprise.enterprise_id,
        app_name: currApp.group_name,
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.getGroupId()
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState(
            {
              versions: res.versions || []
            },
            () => {
              this.handleAppVersion(resources.version, false);
            }
          );
        } else {
          this.handleAppInfoLoading();
        }
      },
      handleError: res => {
        if (res && res.data && res.data.code) {
          const promptTitle =
            res.data.code === 8000
              ? '商店已被删除、无法更新。'
              : res.data.code === 8003
              ? '应用模板不存在、无法更新。'
              : '';
          if (promptTitle) {
            this.setState({
              promptTitle
            });
          }
        }
        this.handleAppInfoLoading();
      }
    });
  };

  handleAppVersion = (value, isParse) => {
    const { versions } = this.state;
    let info = {};
    versions.map(item => {
      if (item.version === value) {
        info = item;
      }
    });
    if (info.version) {
      this.setState({
        appInfo: info
      });
      if (isParse) {
        this.parseChart(value);
      }
      this.handleAppInfoLoading();
    }
  };
  handleTemplateFile = value => {
    const { form } = this.props;
    const { setFieldsValue } = form;
    const { resources } = this.state;
    const { CodeMirrorRef } = this;

    if (resources.values) {
      const val = this.decodeBase64Content(resources.values[value]);
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
  };

  handleAppInfoLoading = () => {
    this.setState({
      appInfoLoading: false
    });
  };
  handleConfing = () => {
    const { form } = this.props;
    const { getFieldDecorator, setFieldsValue } = form;
    const { resources, currentSteps, versions, promptTitle } = this.state;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 }
      },
      wrapperCol: {
        xs: { span: 24 }
      }
    };
    let overrides = resources.overrides || '';
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
      overrides = arr;
    }
    return (
      <Form labelAlign="left">
        <Collapse bordered={false} defaultActiveKey={['2']}>
          <Panel
            header={
              <div className={styles.customPanelHeader}>
                <h6 style={{ marginBottom: 0 }}>应用介绍</h6>
              </div>
            }
            key="1"
            className={styles.customPanel}
          >
            <Markdown
              className={styles.customMD}
              source={
                (resources.readme &&
                  this.decodeBase64Content(resources.readme)) ||
                ''
              }
            />
          </Panel>
          <div className={styles.basisBox}>
            {promptTitle && <Alert message={promptTitle} type="warning" />}

            {currentSteps > 3 && (
              <FormItem {...formItemLayout} label="版本">
                {getFieldDecorator('version', {
                  initialValue: resources.version || undefined,
                  rules: [
                    {
                      required: true,
                      message: '请选择版本'
                    }
                  ]
                })(
                  <Select
                    placeholder="请选择版本"
                    style={{ width: '512px' }}
                    onChange={val => {
                      this.handleAppVersion(val, true);
                    }}
                  >
                    {versions.map(item => {
                      const { version } = item;
                      return (
                        <Option key={version} value={version}>
                          {resources.version == version
                            ? `${version} 当前版本`
                            : version}
                        </Option>
                      );
                    })}
                  </Select>
                )}
              </FormItem>
            )}
            <FormItem {...formItemLayout} label="配置项">
              {getFieldDecorator('overrides', {
                initialValue: overrides || [],
                rules: [{ required: false, message: '请填写配置项' }]
              })(<Parameterinput isHalf editInfo={overrides || ''} />)}
            </FormItem>
          </div>

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
            <div>
              <FormItem {...formItemLayout} label="模版文件">
                {getFieldDecorator('templateFile', {
                  initialValue: '',
                  rules: [{ required: true, message: '请选择模版文件' }]
                })(
                  <Select
                    placeholder="请选择版本"
                    style={{ width: '512px' }}
                    onChange={this.handleTemplateFile}
                  >
                    {resources.values &&
                      Object.keys(resources.values).map(key => {
                        return (
                          <Option key={key} value={key}>
                            {key}
                          </Option>
                        );
                      })}
                  </Select>
                )}
              </FormItem>
              <CodeMirrorForm
                disabled
                data=""
                // data={
                // (resources.values &&
                //   this.decodeBase64Content(resources.values)) ||
                //   ''
                // }
                isHeader={false}
                saveRef={ref => {
                  this.CodeMirrorRef = ref;
                }}
                marginTop={20}
                setFieldsValue={setFieldsValue}
                formItemLayout={formItemLayout}
                Form={Form}
                getFieldDecorator={getFieldDecorator}
                beforeUpload={this.beforeUpload}
                mode="yaml"
                name="yamls"
                message="填写配置"
              />
              {currentSteps > 3 && this.handleOperationBtn('UpDate')}
            </div>
          </Panel>
        </Collapse>
        {currentSteps <= 2 && this.handleOperationBtn('Create')}
      </Form>
    );
  };

  render() {
    const {
      appPermissions: { isUpgrade, isEdit, isDelete },
      groupDetail,
      buildShapeLoading,
      editGroupLoading,
      deleteLoading,
      operationPermissions: { isAccess: isControl }
    } = this.props;
    const {
      currApp,
      resources,
      isInstall,
      code,
      promptModal,
      toEdit,
      toEditAppDirector,
      toDelete,
      currentSteps,
      appStates,
      appType,
      checkList,
      services,
      AssociatedComponents,
      appStateLoading,
      associatedComponents,
      freeComponents,
      linkList,
      showAccess,
      createComponentLoading,
      appInfo,
      versions,
      appInfoLoading,
      servicesLoading
    } = this.state;

    const codeObj = {
      start: '启动',
      restart: '重启',
      stop: '停用',
      deploy: '构建'
    };
    const appStateColor = {
      deployed: 'success',
      'pending-install': 'success',
      'pending-upgrade': 'success',
      'pending-rollback': 'success',
      superseded: 'success',
      failed: 'error'
    };
    const pageHeaderContent = (
      <div className={styles.pageHeaderContent}>
        <Card
          style={{ padding: 0 }}
          loading={appStateLoading || appInfoLoading}
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
                src={
                  appInfo.icon ||
                  'https://gw.alipayobjects.com/zos/rmsportal/MjEImQtenlyueSmVEfUD.svg'
                }
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
                <div className={styles.contentNote}>
                  {appInfo.description || currApp.note}
                </div>
              </div>

              <div className={styles.helmState}>
                {resources.status && (
                  <Badge
                    className={styles.states}
                    status={appStateColor[resources.status] || 'default'}
                    text={
                      infoUtil.getHelmStatus &&
                      infoUtil.getHelmStatus([resources.status] || '-')
                    }
                  />
                )}
                {isDelete && (
                  <a className={styles.operationState} onClick={this.toDelete}>
                    删除
                  </a>
                )}
                {linkList.length > 0 && (
                  <VisterBtn type="link" linkList={linkList} />
                )}
              </div>
            </div>
            <div className={styles.connect_Bot}>
              <div
                className={styles.connect_Box}
                style={{ width: '100%', marginRight: '0' }}
              >
                <div className={styles.connect_Boxs}>
                  <div>使用内存</div>
                  <div>
                    {resources.memory
                      ? `${sourceUtil.unit(resources.memory || 0, 'MB')}`
                      : '未设置'}
                  </div>
                </div>
                <div className={styles.connect_Boxs}>
                  <div>使用CPU</div>
                  <div>
                    {resources.cpu ? `${resources.cpu / 1000}Core` : '未设置'}
                  </div>
                </div>
                <div className={styles.connect_Boxs}>
                  <div>服务数量</div>
                  <div>{(services && services.length) || 0}</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
        <Card
          style={{ padding: 0, marginRight: 0 }}
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
              {resources.version && (
                <div>
                  <span>版本号</span>
                  <span>{resources.version}</span>
                </div>
              )}
            </div>
            <div className={styles.conrBot}>
              <div className={styles.conrBox} style={{ width: '33.3%' }}>
                <div>网关策略</div>
                <div
                  onClick={() => {
                    isControl && this.handleJump('gateway');
                  }}
                >
                  <a>{currApp.ingress_num || 0}</a>
                </div>
              </div>
              <div className={styles.conrBox} style={{ width: '33.3%' }}>
                <div>待升级</div>
                <div
                  onClick={() => {
                    isUpgrade && this.handleJump('upgrade');
                  }}
                >
                  <a>{currApp.upgradable_num || 0}</a>
                </div>
              </div>
              <div className={styles.conrBox} style={{ width: '33.3%' }}>
                <div>商店</div>
                <div
                  onClick={() => {
                    currApp.app_store_name &&
                      this.handleJumpStore(currApp.app_store_name);
                  }}
                >
                  <a>{currApp.app_store_name || '商店已被删除'}</a>
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
        {(showAccess || isInstall) && (
          <AccessPrompt
            title={
              isInstall
                ? '关联组件已创建，请配置网关策略或建立依赖关系访问。'
                : '当前应用未开放访问权限,是否立即打开?'
            }
            isInstall={isInstall}
            loading={createComponentLoading}
            onOk={this.CreateAppBatchComponents}
            onCancel={this.handleCancelShowAccess}
          />
        )}

        {AssociatedComponents && (
          <AddAssociatedComponents
            title="添加关联组件"
            groupId={this.getGroupId()}
            data={AssociatedComponents}
            onCancel={this.cancelAssociatedComponents}
            onOk={this.AddAssociatedComponents}
          />
        )}
        {freeComponents && freeComponents.length > 0 && (
          <Card
            style={{ marginBottom: 24 }}
            type="inner"
            loading={appStateLoading}
            title="游离组件"
            bodyStyle={{ padding: 24, background: '#fff' }}
          >
            <div>
              {freeComponents.map(items => {
                return (
                  <Button
                    style={{ padding: '0 10px' }}
                    onClick={() => {
                      this.handleThird(items.component_alias);
                    }}
                    type="link"
                  >
                    {items.component_name}
                  </Button>
                );
              })}
            </div>
          </Card>
        )}

        {currentSteps > 3 && !servicesLoading && (
          <Card
            type="inner"
            loading={appStateLoading}
            title="服务实例"
            bodyStyle={{ padding: '0', background: '#F0F2F5' }}
          >
            <div style={{ background: '#fff' }}>
              {services && services.length > 0 ? (
                <Tabs
                  style={{ padding: '0 24px 24px' }}
                  defaultActiveKey={
                    services && services.length > 0 && services[0].service_name
                  }
                  onChange={this.handleTabs}
                >
                  {services.map(item => {
                    const {
                      service_name: serviceName,
                      pods,
                      tcp_ports: ports
                    } = item;
                    return (
                      <TabPane tab={serviceName} key={serviceName}>
                        <div>
                          <div className={styles.associated}>
                            <div>关联组件:</div>
                            <div
                              style={{
                                width:
                                  ports && ports.length > 0
                                    ? 'calc(100% - 100px)'
                                    : 'calc(100% - 62px)'
                              }}
                            >
                              {associatedComponents.map(items => {
                                return (
                                  <Button
                                    style={{ padding: '0 10px' }}
                                    onClick={() => {
                                      this.handleComponent(
                                        items.component_alias
                                      );
                                    }}
                                    type="link"
                                  >
                                    {items.component_name}
                                  </Button>
                                );
                              })}
                            </div>
                            {ports && ports.length > 0 && (
                              <Icon
                                style={{ float: 'right', marginLeft: '20px' }}
                                type="plus-circle"
                                onClick={() => {
                                  this.handleAssociatedComponents(item);
                                }}
                              />
                            )}
                          </div>
                          <Instance
                            isHelm
                            runLoading={false}
                            new_pods={pods}
                            old_pods={[]}
                            appAlias={this.getGroupId()}
                          />
                        </div>
                      </TabPane>
                    );
                  })}
                </Tabs>
              ) : (
                <div style={{ padding: '24px' }}>
                  当前应用未定义 Service, 无法查询实例列表
                </div>
              )}
            </div>
          </Card>
        )}
        {currentSteps > 3 && (
          <div className={styles.customCollapseBox}>{this.handleConfing()}</div>
        )}
        {currentSteps < 4 && (
          <Card style={{ marginTop: 16 }} loading={appStateLoading}>
            {currentSteps < 4 && (
              <Steps
                type="navigation"
                current={currentSteps}
                className="site-navigation-steps"
              >
                {appStates.map((item, index) => {
                  const { value, key } = item;
                  return (
                    <Step
                      title={value}
                      icon={
                        key !== 'configuring' &&
                        index === currentSteps && <LoadingOutlined />
                      }
                    />
                  );
                })}
              </Steps>
            )}
            {(currentSteps < 1 || currentSteps === 3) && (
              <div className={styles.process}>
                <Result
                  type="ing"
                  title={currentSteps < 1 ? '初始化中...' : '安装中...'}
                  description="此过程可能比较耗时，请耐心等待"
                  style={{
                    marginTop: 48,
                    marginBottom: 16
                  }}
                />
              </div>
            )}

            {currentSteps < 2 && checkList && checkList.length > 0 && (
              <div className={styles.process}>
                <Steps direction="vertical" style={{ paddingLeft: '20%' }}>
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
              </div>
            )}
            {currentSteps === 2 && (
              <div className={styles.customCollapse}>
                {this.handleConfing()}
              </div>
            )}
          </Card>
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
            isNoEditName
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
