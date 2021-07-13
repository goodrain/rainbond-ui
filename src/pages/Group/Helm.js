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
  Tooltip
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import moment from 'moment';
import React, { Fragment, PureComponent } from 'react';
import Markdown from 'react-markdown';
import { Link } from 'umi';
import ConfirmModal from '../../components/ConfirmModal';
import Result from '../../components/Result';
import VisterBtn from '../../components/visitBtnForAlllink';
import { batchOperation } from '../../services/app';
import globalUtil from '../../utils/global';
import sourceUtil from '../../utils/source-unit';
import Instance from '../Component/component/Instance/index';
import infoUtil from '../Upgrade/UpgradeInfo/info-util';
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
      versionInfoLoading: true,
      versions: [],
      noVersion: false,
      promptMap: {
        8000: '商店已被删除、无法更新。',
        8003: '应用模板不存在、无法更新。'
      },
      formData: [],
      appStateLoading: true,
      appInfoLoading: true,
      appStates: [
        {
          key: 'initailing',
          value: '初始化'
        },
        {
          key: 'detecting',
          value: '检测'
        },
        {
          key: 'configuring',
          value: '配置'
        },
        {
          key: 'installing',
          value: '安装'
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
      components: [],
      currentSteps: 0,
      toDelete: false,
      toEdit: false,
      errPrompt: false,
      toEditAppDirector: false,
      serviceIds: [],
      promptModal: false,
      code: '',
      currApp: {},
      componentTimer: true,
      submitLoading: false,
      resources: {},
      versionInfo: {},
      appInfo: {},
      isScrollToBottom: true,
      upDataVersion: false
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
              init && this.fetchAppDetailState(init);
            }
          );
        }
      },
      handleError: res => {
        const { componentTimer } = this.state;
        if (!componentTimer) {
          return null;
        }
        init && this.fetchAppDetailState(init);
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

  fetchAppDetailState = init => {
    const { dispatch, form } = this.props;
    const { teamName, appID } = this.props.match.params;
    const { getFieldValue } = form;
    const templateFile = getFieldValue('templateFile');
    const {
      appStateMap,
      currentSteps: oldSteps,
      isScrollToBottom
    } = this.state;

    dispatch({
      type: 'application/fetchAppDetailState',
      payload: {
        team_name: teamName,
        group_id: appID
      },
      callback: res => {
        const info = res.list || {};
        const currentSteps =
          (info && info.phase && appStateMap[info.phase]) || 0;
        this.setState(
          {
            resources: info,
            appStateLoading: false,
            currentSteps: currentSteps > oldSteps ? currentSteps : oldSteps
          },
          () => {
            if (currentSteps === 2 && isScrollToBottom) {
              this.scrollToBottom();
            }
            if (currentSteps >= 2) {
              if (init) {
                this.setState({ versionInfoLoading: init });
              }
              this.getHelmApplication(!templateFile ? true : init);
            } else {
              this.handleAppInfoLoading();
            }
            if (currentSteps >= 4) {
              this.fetchHelmComponents();
              this.fetchAppAccess();
            }
          }
        );
        this.handleTimers(
          'timer',
          () => {
            this.fetchAppDetailState();
            this.fetchAppDetail();
            this.closeTimer();
          },
          5000
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
        this.handleErrPrompt(res);
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
      this.fetchAppDetailState();
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
          if (grid === list[0].group_id) {
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
              errors: [new Error('请填写配置项')]
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
          this.handleEditHelmApp(info);
        }
      }
    });
  };

  fetchHelmComponents = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'application/fetchHelmComponents',
      payload: {
        tenantName: globalUtil.getCurrTeamName(),
        groupId: this.getGroupId()
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            components: res.list || []
          });
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
  scrollToBottom = () => {
    const messagesEndRef = document.getElementById('messagesEndRef');
    if (messagesEndRef) {
      messagesEndRef.scrollIntoView({ behavior: 'smooth' });
      this.setState({ isScrollToBottom: false });
    }
  };
  handleOperationBtn = type => {
    const { submitLoading, errPrompt, noVersion, upDataVersion } = this.state;
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
          {type === 'Create' ? '安装' : '更新'}
        </Button>
      </div>
    );
  };
  getHelmApplication = (init = false) => {
    const { dispatch, currentEnterprise } = this.props;
    const { currApp } = this.state;
    dispatch({
      type: 'global/fetchHelmApplication',
      payload: {
        enterprise_id: currentEnterprise.enterprise_id,
        app_name: currApp.app_template_name,
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.getGroupId(),
        appStoreName: currApp.app_store_name
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState(
            {
              versions: res.versions || []
            },
            () => {
              this.handleAppVersion(currApp.version, init, false);
            }
          );
        } else {
          this.handleAppInfoLoading();
        }
      },
      handleError: res => {
        this.handleErrPrompt(res);
      }
    });
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
        if (isVersion) {
          this.setState({
            upDataVersion: '版本信息更新中、请耐心等待',
            noVersion: false
          });
        }
        this.fetchHelmAppStoresVersions(value);
      }
    }
    this.handleAppInfoLoading();
  };
  handleTemplateFile = value => {
    const { form } = this.props;
    const { setFieldsValue } = form;
    const { versionInfo } = this.state;
    const { CodeMirrorRef } = this;

    if (versionInfo.values) {
      const val = this.decodeBase64Content(versionInfo.values[value]);
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
  handleConfing = () => {
    const { form } = this.props;
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
      formData
    } = this.state;
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
    const valueFiles = versionInfo.values
      ? Object.keys(versionInfo.values).reverse()
      : [];
    return (
      <Form labelAlign="left">
        <Collapse bordered={false} defaultActiveKey={['2']}>
          <Panel
            header={
              <div className={styles.customPanelHeader}>
                <h6>应用介绍</h6>
                <p>应用配置说明和使用方法概述</p>
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
          <Panel
            header={
              <div className={styles.customPanelHeader}>
                <h6>配置选项</h6>
                <p>基于Helm规范应用配置的查看与设置</p>
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
                  <span>通用配置</span>
                </div>
                <FormItem {...formItemLayout} label="Values配置">
                  {getFieldDecorator('overrides', {
                    initialValue: overrides || [],
                    rules: [{ required: false, message: '请填写Values配置' }]
                  })(
                    <Parameterinput
                      disableds={upDataVersion || errPrompt || noVersion}
                      isHalf
                      editInfo={overrides || ''}
                    />
                  )}
                </FormItem>
                <Row>
                  {currentSteps > 3 && (
                    <Col span={12}>
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
                            style={{ width: '95%' }}
                            disabled={upDataVersion || errPrompt}
                            onChange={val => {
                              this.handleAppVersion(val, true, true);
                            }}
                          >
                            {versions.map(item => {
                              const { version } = item;
                              return (
                                <Option key={version} value={version}>
                                  {resources.version === version
                                    ? `${version} 当前版本`
                                    : version}
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
                            ? '应用版本不存在、请重新选择版本'
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
                    label="Values文件"
                    className={styles.clearStar}
                  >
                    {getFieldDecorator('templateFile', {
                      initialValue: valueFiles.length > 0 && valueFiles[0],
                      rules: [{ required: true, message: '请选择Values文件' }]
                    })(
                      <Select
                        placeholder="请选择Values文件"
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
                  message="填写配置"
                />
                {currentSteps > 3 && this.handleOperationBtn('UpDate')}
              </div>
            </Skeleton>
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
      versions,
      currApp,
      resources,
      code,
      promptModal,
      toEdit,
      toEditAppDirector,
      toDelete,
      currentSteps,
      appStates,
      appType,
      errPrompt,
      appStateLoading,
      components,
      linkList,
      appInfo,
      appInfoLoading
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
                  <div>{(components && components.length) || 0}</div>
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
                  <a>
                    {(versions && versions.length > 0 && versions.length - 1) ||
                      0}
                  </a>
                </div>
              </div>
              <div className={styles.conrBox} style={{ width: '33.3%' }}>
                <div>商店</div>
                <div
                  onClick={() => {
                    !errPrompt &&
                      currApp.app_store_name &&
                      this.handleJumpStore(currApp.app_store_name);
                  }}
                >
                  <a
                    style={{
                      color: errPrompt ? 'rgba(0, 0, 0, 0.45)' : '#4d73b1'
                    }}
                  >
                    {currApp.app_store_name || '商店已被删除'}
                  </a>
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

        {errPrompt && (
          <Alert
            message={errPrompt}
            type="warning"
            style={{ marginBottom: '20px' }}
          />
        )}

        {currentSteps > 3 && (
          <Card
            type="inner"
            loading={appStateLoading}
            title="服务实例"
            bodyStyle={{ padding: '0', background: '#F0F2F5' }}
          >
            <div style={{ background: '#fff' }}>
              {components && components.length > 0 ? (
                <Tabs
                  style={{ padding: '0 24px 24px' }}
                  defaultActiveKey={
                    components &&
                    components.length > 0 &&
                    components[0] &&
                    components[0].service_name
                  }
                >
                  {components.map(item => {
                    if (item.service) {
                      const { service_alias, service_region } = item;
                      const {
                        service_name: serviceName,
                        pods,
                        oldPods
                      } = item.service;
                      const content = (
                        <Link
                          to={`/team/${teamName}/region/${service_region}/components/${service_alias}/overview`}
                        >
                          组件详情
                        </Link>
                      );
                      return (
                        <TabPane
                          tab={
                            <Popover content={content}>{serviceName}</Popover>
                          }
                          key={serviceName}
                        >
                          <Instance
                            isHelm
                            runLoading={false}
                            new_pods={pods}
                            old_pods={oldPods}
                            appAlias={this.getGroupId()}
                          />
                        </TabPane>
                      );
                    }
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
        {currentSteps > 3 && !errPrompt && (
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

            {currentSteps < 2 &&
              resources.conditions &&
              resources.conditions.length > 0 && (
                <div className={styles.process}>
                  <Steps direction="vertical" style={{ paddingLeft: '20%' }}>
                    {resources.conditions.map(item => {
                      const { status, message, type } = item;
                      if (appType[type]) {
                        return (
                          <Step
                            title={appType[type]}
                            status={
                              status ? 'finish' : message ? 'error' : 'wait'
                            }
                            description={
                              <div style={{ color: '#ff4d4f' }}>{message}</div>
                            }
                          />
                        );
                      }
                    })}
                  </Steps>
                </div>
              )}
            {currentSteps === 2 && !errPrompt && (
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
            isAddGroup={false}
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
