/* eslint-disable react/sort-comp */
/* eslint-disable no-nested-ternary */
import {
  Alert,
  Button,
  Card,
  Divider,
  Form,
  Icon,
  Input,
  Modal,
  notification,
  Radio,
  Select,
  Spin,
  Tabs,
  Upload
} from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import { FormattedMessage } from 'umi';
import CodeBuildConfig from '../../components/CodeBuildConfig';
import MarketAppDetailShow from '../../components/MarketAppDetailShow';
import NoPermTip from '../../components/NoPermTip';
import appUtil from '../../utils/app';
import handleAPIError from '../../utils/error';
import globalUtil from '../../utils/global';
import rainbondUtil from '../../utils/rainbond';
import { languageObj } from '../../utils/utils';
import { formatMessage } from '@/utils/intl';
import styles from './resource.less';
import AutoDeploy from './setting/auto-deploy';
import ChangeBuildSource from './setting/edit-buildsource';
import ModifyUrl from '../Create/modify-url';
import { ResumeContext } from './funContext';

const { TabPane } = Tabs;
const FormItem = Form.Item;
const { Option, OptGroup } = Select;

@connect(
  ({ global }) => ({
    rainbondInfo: global.rainbondInfo,
    enterprise: global.enterprise
  }),
  null,
  null,
  { withRef: true }
)
@Form.create()
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      runtimeInfo: '',
      changeBuildSource: false,
      editOauth: false,
      buildSource: null,
      buildSourceLoading: true, // 构建源加载状态
      buildSourceTimeout: false, // 构建源接口超时标记
      showMarketAppDetail: false,
      showApp: {},
      create_status: '',
      languageBox: false,
      service_info: '',
      error_infos: '',
      thirdInfo: false,
      tags: [],
      tagsLoading: true,
      tabType: 'branches',
      fullList: [],
      tabList: [],
      OauthLoading: true,
      page: 1,
      uploadFile: false,
      fileList: [],
      record: {},
      event_id: '',
      percents: false,
      existFileList: [],
      modifyUrl: false,
      modifyUserpass: false,
      showKey: false,
      modifyImageName: false,
      modifyImageCmd: false,
      codeLang: '',
      dockfilePath: ''
    };
  }
  static contextType = ResumeContext;

  componentDidMount() {
    this.setOauthService();

    if (this.props.appDetail && this.props.appDetail.service && this.props.appDetail.service.service_alias) {
      this.getRuntimeInfo();
      this.loadBuildSourceInfo();
      this.bindEvent();
      this.handleJarWarUpload();
    } else {
      this.time();
    }
  }
  componentWillUnmount() {
    this.loop = false;
    this.statusloop = false;
    this.unbindEvent()
  }

  bindEvent = () => {
    document.addEventListener('click', this.handleClick, false);
  };
  unbindEvent = () => {
    document.removeEventListener('click', this.handleClick);
  };

  handleClick = e => {
    let parent = e.target;
    const appDetail = this.props && this.props.appDetail && this.props.appDetail.service;
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

      parent = parent.parentNode;
    }
  };
  time = () => {
    setTimeout(() => {
      if (this.props.appDetail?.service?.service_alias) {
        this.setOauthService();
        this.getRuntimeInfo();
        this.loadBuildSourceInfo();
        this.bindEvent();
      }
    }, 2000);
  };
  // 上传文件取消
  handleUploadCancel = () => {
    this.setState({ uploadFile: false })
  }
  //上传文件确认
  handleUploadOk = () => {
    const { dispatch, appDetail } = this.props;
    const { existFileList, event_id } = this.state;

    const serviceId = appDetail?.service?.service_id;
    if (existFileList.length > 0) {
      dispatch({
        type: 'createApp/createJarWarSubmit',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          event_id,
          service_id: serviceId,
          region_name: globalUtil.getCurrRegionName()
        },
        callback: () => {
          this.setState({ uploadFile: false });
          this.loadBuildSourceInfo();
        },
        handleError: (err) => {
          handleAPIError(err);
        }
      });
    } else {
      this.loop = true;
      this.handleJarWarUploadStatus();
      notification.error({
        message: formatMessage({ id: 'notification.error.notDetected' })
      });
    }
  };
  handleJarWarUpload = () => {
    const { dispatch, appDetail } = this.props;
    const serviceId = appDetail?.service?.service_id;
    if (!serviceId) return;

    dispatch({
      type: 'createApp/createJarWarServices',
      payload: {
        region: globalUtil.getCurrRegionName(),
        team_name: globalUtil.getCurrTeamName(),
        component_id: serviceId
      },
      callback: (res) => {
        if (res && res.status_code === 200) {
          this.setState({
            record: res.bean,
            event_id: res.bean.event_id
          }, () => {
            if (res.bean.region !== '') {
              this.loop = true;
              this.handleJarWarUploadStatus();
            }
          });
        }
      },
      handleError: (err) => {
        handleAPIError(err);
      }
    });
  };

  //查询上传状态
  handleJarWarUploadStatus = () => {
    const { dispatch } = this.props;
    const { event_id } = this.state;

    dispatch({
      type: 'createApp/createJarWarUploadStatus',
      payload: {
        region: globalUtil.getCurrRegionName(),
        team_name: globalUtil.getCurrTeamName(),
        event_id
      },
      callback: data => {
        if (data?.bean?.package_name?.length > 0) {
          this.setState({ existFileList: data.bean.package_name });
        }
        if (this.loop) {
          setTimeout(() => {
            this.handleJarWarUploadStatus();
          }, 3000);
        }
      },
      handleError: (err) => {
        handleAPIError(err);
      }
    });
  };
  //删除上传文件
  handleJarWarUploadDelete = () => {
    const { event_id } = this.state;
    const { dispatch } = this.props;

    dispatch({
      type: 'createApp/deleteJarWarUploadStatus',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        event_id
      },
      callback: (data) => {
        if (data?.bean?.res == 'ok') {
          this.setState({ existFileList: [] });
          notification.success({
            message: formatMessage({ id: 'notification.success.delete_file' })
          });
          this.handleJarWarUpload();
        }
      },
      handleError: (err) => {
        handleAPIError(err);
      }
    });
  };
  //上传
  onChangeUpload = info => {
    let { fileList } = info;
    fileList = fileList.filter(file => {
      if (file.response) {
        return file.response.msg === 'success';
      }
      return true;
    });
    if (info && info.event && info.event.percent) {
      this.setState({
        percents: info.event.percent
      });
    }

    const { status } = info.file;
    if (status === 'done') {
      this.setState({
        percents: false
      });
    }
    this.setState({ fileList });
  };
  //删除
  onRemove = () => {
    this.setState({ fileList: [] });
  };




  setOauthService = () => {
    const { rainbondInfo, enterprise } = this.props;
    const tabList = [];
    if (
      rainbondUtil.OauthbEnable(rainbondInfo) &&
      rainbondUtil.OauthEnterpriseEnable(enterprise)
    ) {
      enterprise.oauth_services.value.forEach(item => {
        const { oauth_type, service_id, is_git, name, enable } = item;
        if (is_git) {
          tabList.push({
            name,
            type: oauth_type,
            enable,
            id: `${service_id}`
          });
        }
      });
      this.setState({ tabList });
    }
  };
  getParams() {
    return {
      group_id: globalUtil.getAppID(),
      compose_id: globalUtil.getSlidePanelComponentID(),
    };
  }
  onChangeBuildSource = () => {
    this.hideBuildSource();
    this.loadBuildSourceInfo();
    const { loadBuildState } = this.context;
    loadBuildState(true);
  };
  getRuntimeInfo = () => {
    const { dispatch, appDetail } = this.props;
    dispatch({
      type: 'appControl/getRuntimeBuildInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appDetail?.service?.service_alias
      },
      callback: data => {
        if (data) {
          this.setState({ runtimeInfo: data.bean || {} });
        }
      },
      handleError: (err) => {
        handleAPIError(err);
      }
    });
  };
  handleEditRuntime = build_env_dict => {
    const { dispatch, appDetail } = this.props;
    dispatch({
      type: 'appControl/editRuntimeBuildInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appDetail?.service?.service_alias,
        build_env_dict
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({ message: formatMessage({ id: 'notification.success.modified' }) });
          this.getRuntimeInfo();
        }
      },
      handleError: (err) => {
        handleAPIError(err);
      }
    });
  };
  handleEditInfo = (val = {}) => {
    const { dispatch, appDetail, updateDetail } = this.props;
    dispatch({
      type: 'appControl/editAppCreateInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appDetail?.service?.service_alias,
        ...val
      },
      callback: data => {
        if (data) {
          updateDetail();
        }
      },
      handleError: (err) => {
        handleAPIError(err);
      }
    });
  };

  changeBuildSource = () => {
    this.setState({ changeBuildSource: true });
  };
  hideBuildSource = () => {
    this.setState({ changeBuildSource: false });
  };
  changeEditOauth = () => {
    this.handleProvinceChange();
    this.setState({ editOauth: true });
  };
  hideEditOauth = () => {
    this.setState({ editOauth: false });
  };

  loadBuildSourceInfo = () => {
    const { dispatch, appDetail } = this.props;
    this.setState({ buildSourceLoading: true, buildSourceTimeout: false });
    dispatch({
      type: 'appControl/getAppBuidSource',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        service_alias: appDetail?.service?.service_alias
      },
      callback: data => {
        this.setState({ buildSourceLoading: false });
        if (data) {
          const { bean } = data;
          if (bean.service_source === 'package_build') {
            const url = bean?.git_url || '';
            const str = url.lastIndexOf('/');
            const eventId = url.substring(str + 1);
            this.setState({ event_id: eventId });
          }
          this.setState({ buildSource: bean }, () => {
            if (bean?.code_from?.indexOf('oauth') > -1) {
              this.loadThirdInfo();
            }
          });
        }
      },
      handleError: (err) => {
        handleAPIError(err);
        this.setState({
          buildSourceLoading: false,
          buildSourceTimeout: isTimeout
        });
   
      }
    });
  };

  loadThirdInfo = () => {
    const { dispatch } = this.props;
    const { buildSource } = this.state;

    dispatch({
      type: 'global/codeThirdInfo',
      payload: {
        full_name: buildSource.full_name,
        oauth_service_id: buildSource.oauth_service_id
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({ thirdInfo: res.bean });
        }
      },
      handleError: (err) => {
        handleAPIError(err);
      }
    });
  };

  handleToDetect = () => {
    this.setState({ languageBox: true });
  };
  handleToUpload = () => {
    this.setState({ uploadFile: true });
  }
  handlelanguageBox = () => {
    this.setState({ languageBox: false, create_status: '' });
  };
  handleUpdatelanguage = () => {
    const { dispatch, appAlias } = this.props;
    const { codeLang, dockfilePath } = this.state;

    dispatch({
      type: 'createApp/updateCustomLanguage',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_id: appAlias,
        lang: codeLang,
        dockerfile_path: dockfilePath
      },
      callback: () => {
        this.loadBuildSourceInfo();
        this.setState({ languageBox: false, create_status: '' });
      },
      handleError: (err) => {
        handleAPIError(err);
      }
    });
  };
  handleDetectGetLanguage = () => {
    const { dispatch, appDetail } = this.props;
    const { check_uuid } = this.state;

    dispatch({
      type: 'appControl/getLanguage',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        service_alias: appDetail?.service?.service_alias,
        check_uuid
      },
      callback: res => {
        if (res && res.status_code === 200) {
          const checkStatus = res.bean?.check_status;
          if (checkStatus != 'success' && checkStatus != 'failure') {
            setTimeout(() => {
              this.handleDetectGetLanguage();
            }, 3000);
          } else {
            if (res.bean?.service_info) {
              res.bean.service_info.forEach((item) => {
                if (item.type == 'language' && checkStatus != 'failure') {
                  const parts = item?.value?.split(',');
                  this.setState({ codeLang: parts?.[0] || '' });
                }
                if (item.type == 'dockerfiles' && checkStatus != 'failure') {
                  if (item.value?.length > 0) {
                    this.setState({ dockfilePath: item.value[0] });
                  }
                }
              });
            }
            this.loadBuildSourceInfo();
            this.setState({
              create_status: checkStatus,
              service_info: res.bean?.service_info,
              error_infos: res.bean?.error_infos
            });
          }
        }
      },
      handleError: (err) => {
        handleAPIError(err);
      }
    });
  };

  handleDetectPutLanguage = () => {
    const { dispatch, appDetail } = this.props;
    const { event_id } = this.state;

    dispatch({
      type: 'appControl/putLanguage',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        service_alias: appDetail?.service?.service_alias,
        eventId: event_id
      },
      callback: res => {
        if (res) {
          const createStatus = res.bean?.create_status;
          this.setState(
            {
              create_status: createStatus,
              check_uuid: res.bean?.check_uuid
            },
            () => {
              if (createStatus == 'failure') {
                notification.warning({ message: formatMessage({ id: 'notification.warn.update_language' }) });
              } else {
                this.handleDetectGetLanguage();
              }
            }
          );
        }
      },
      handleError: (err) => {
        handleAPIError(err);
      }
    });
  };

  hideMarketAppDetail = () => {
    this.setState({
      showApp: {},
      showMarketAppDetail: false
    });
  };

  // 获取类型
  handleCodeWarehouseType = props => {
    const { dispatch } = props;
    const { tabType, buildSource } = this.state;
    const oauthServiceId = this.props.form.getFieldValue('oauth_service_id');
    const projectFullName = this.props.form.getFieldValue('full_name');

    dispatch({
      type: 'global/codeWarehouseType',
      payload: {
        type: tabType,
        full_name: projectFullName || buildSource.full_name,
        oauth_service_id: oauthServiceId || buildSource.oauth_service_id
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            tags: res.bean?.[tabType] || [],
            tagsLoading: false,
            OauthLoading: false
          });
        }
      },
      handleError: (err) => {
        this.setState({ tagsLoading: false, OauthLoading: false });
        handleAPIError(err);
      }
    });
  };

  onTabChange = tabType => {
    this.setState({ tabType, tagsLoading: true }, () => {
      this.handleCodeWarehouseType(this.props);
    });
  };

  onPagePre = () => {
    const { page } = this.state;
    if (page > 1) {
      const pages = page - 1;
      const firstPage = pages == 1;
      this.setState({ firstPage, page: pages }, () => {
        this.handleProvinceChange();
      });
    }
  };
  onPageNext = () => {
    const { lastPage, page } = this.state;
    if (!lastPage) {
      const pages = page + 1;
      this.setState({ page: pages }, () => {
        this.handleProvinceChange();
      });
    }
  };

  handleProvinceChange = id => {
    // 获取代码仓库信息
    const { dispatch, form } = this.props;
    const { setFieldsValue } = form;
    const { tabList, buildSource, page } = this.state;
    const oauthServiceId = form.getFieldValue('oauth_service_id');
    this.setState({ OauthLoading: true });

    dispatch({
      type: 'global/codeWarehouseInfo',
      payload: {
        page,
        oauth_service_id:
          id ||
          oauthServiceId ||
          buildSource?.oauth_service_id ||
          (tabList.length > 0 ? tabList[0].id : '')
      },
      callback: res => {
        if (res?.status_code === 200 && res.bean?.repositories?.length > 0) {
          const repos = res.bean.repositories;
          const isFirstPage = page == 1;
          const isLastPage = repos.length < 10;
          if (id) {
            setFieldsValue({
              full_name: repos[0].project_full_name,
              git_url: repos[0].project_url,
              code_version: repos[0].project_default_branch
            });
          }
          this.setState(
            {
              firstPage: isFirstPage,
              lastPage: isLastPage,
              fullList: repos
            },
            () => {
              this.handleCodeWarehouseType(this.props);
            }
          );
        } else {
          this.setState({ tagsLoading: false, OauthLoading: false });
        }
      },
      handleError: (err) => {
        this.setState({ OauthLoading: false });
        handleAPIError(err);
      }
    });
  };

  handleProjectChange = projectFullName => {
    this.setState({ OauthLoading: true });
    const { setFieldsValue } = this.props.form;
    const { fullList } = this.state;

    const item = fullList.find(i => i.project_full_name === projectFullName);
    if (item) {
      setFieldsValue(
        {
          git_url: item.project_url,
          code_version: item.project_default_branch
        },
        () => {
          this.handleCodeWarehouseType(this.props);
          this.setState({ OauthLoading: false });
        }
      );
    }
  };

  handleSubmitOauth = () => {
    const { form, dispatch, appAlias } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (err) return;

      dispatch({
        type: 'appControl/putAppBuidSource',
        payload: {
          arch: fieldsValue.arch || null,
          team_name: globalUtil.getCurrTeamName(),
          service_alias: appAlias,
          is_oauth: true,
          oauth_service_id: fieldsValue.oauth_service_id,
          full_name: fieldsValue.full_name,
          git_url: fieldsValue.git_url,
          code_version: fieldsValue.code_version,
          service_source: 'source_code'
        },
        callback: () => {
          notification.success({ message: formatMessage({ id: 'notification.success.edit_deploy' }) });
          this.loadBuildSourceInfo();
          this.hideEditOauth();
        },
        handleError: (err) => {
          handleAPIError(err);
        }
      });
    });
  };
  // 是否可以浏览当前界面
  canView() {
    const {
      componentPermissions: { isSource }
    } = this.props;
    return isSource;
  }

  cancelModifyUrl = () => {
    this.setState({ modifyUserpass: false });
  };
  handleCancelEdit = () => {
    this.setState({ modifyUserpass: false });
  };
  //源码
  handleModifyUrl = values => {
    const { dispatch, appDetail } = this.props;
    const service = appDetail?.service;

    dispatch({
      type: 'appControl/editAppCreateInfo',
      payload: {
        service_cname: values.service_cname || '',
        git_url: values.git_url || '',
        team_name: globalUtil.getCurrTeamName(),
        app_alias: service?.service_alias,
        user_name: values.user_name,
        password: values.password
      },
      callback: data => {
        if (data) {
          this.handleDetectPutLanguage();
          this.handleCancelEdit();
        }
      },
      handleError: (err) => {
        handleAPIError(err);
      }
    });
  };
  onChangeLange = (e) => {
    this.setState({ codeLang: e.target.value });
  };

  onDockfileChange = (e) => {
    this.setState({ dockfilePath: e.target.value });
  };
  render() {
    if (!this.canView()) return <NoPermTip />;

    const { form, appDetail, method } = this.props;
    const {
      runtimeInfo,
      thirdInfo,
      buildSource,
      buildSourceLoading,
      buildSourceTimeout,
      tags,
      tagsLoading,
      fullList,
      tabList,
      firstPage,
      lastPage,
      fileList,
      record,
      existFileList,
      modifyUserpass,
      codeLang,
      dockfilePath
    } = this.state;
    const myheaders = {};
    const language = appUtil.getLanguage(appDetail);
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 3
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 21
        }
      }
    };

    const formOauthLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 6
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 18
        }
      }
    };

    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    const { getFieldDecorator } = form;
    const versionLanguage = buildSource ? buildSource.language : '';
    const buildShared = appUtil.getCreateTypeCNByBuildSource(buildSource);
    const isLocalShared = buildShared && buildShared === '本地共享库';
    const languageType = versionLanguage || '';
    return (
      <Fragment>
        {buildSourceLoading ? (
          <Card
            title={<FormattedMessage id='componentOverview.body.Resource.Jianyuan' />}
            style={{
              marginBottom: 24
            }}
            className={styles.tabsCard}
          >
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin tip={formatMessage({ id: 'componentOverview.body.Resource.loading' })} />
            </div>
          </Card>
        ) : buildSourceTimeout ? (
          <Card
            title={<FormattedMessage id='componentOverview.body.Resource.Jianyuan' />}
            style={{
              marginBottom: 24
            }}
            className={styles.tabsCard}
            extra={(
              <Button onClick={this.changeBuildSource} icon='form'>
                <FormattedMessage id='componentOverview.body.Resource.change' />
              </Button>
            )}
          >
            <Alert
              message={formatMessage({ id: 'componentOverview.body.Resource.timeout.title' })}
              description={formatMessage({ id: 'componentOverview.body.Resource.timeout.desc' })}
              type="warning"
              showIcon
              action={
                <Button size="small" onClick={this.loadBuildSourceInfo}>
                  {formatMessage({ id: 'componentOverview.body.Resource.timeout.retry' })}
                </Button>
              }
            />
          </Card>
        ) : buildSource && (
          <Card
            title={<FormattedMessage id='componentOverview.body.Resource.Jianyuan' />}
            style={{
              marginBottom: 24
            }}
            className={styles.tabsCard}
            extra={method != 'vm' && [
              appUtil.isOauthByBuildSource(buildSource) ? (
                <Button onClick={this.changeEditOauth} icon='form' >
                  <FormattedMessage id='componentOverview.body.Resource.edit' />
                </Button>
              ) : (
                <Button onClick={this.changeBuildSource} icon='form'>
                  <FormattedMessage id='componentOverview.body.Resource.change' />
                </Button>
              )
            ]}
          >
            <div>
              <FormItem
                style={{
                  marginBottom: 0
                }}
                {...formItemLayout}
                label={
                  appUtil.isOauthByBuildSource(buildSource) && thirdInfo
                    ? <FormattedMessage id='componentOverview.body.Resource.oauth' />
                    : <FormattedMessage id='componentOverview.body.Resource.type' />
                }
              >
                <Link
                  to={
                    isLocalShared &&
                    `/team/${teamName}/region/${regionName}/create/market`
                  }
                  style={{ color: !isLocalShared && 'rgba(0, 0, 0, 0.65)' }}
                >
                  {appUtil.isOauthByBuildSource(buildSource) && thirdInfo
                    ? thirdInfo.service_name
                    : buildShared}
                </Link>
              </FormItem>
            </div>
            {method == 'vm' &&
              <div>
                <FormItem
                  style={{
                    marginBottom: 0
                  }}
                  {...formItemLayout}
                  label={formatMessage({ id: 'Vm.createVm.VmImg' })}
                >
                  暂无
                </FormItem>
              </div>}

            {appUtil.isImageAppByBuildSource(buildSource) ? (
              <div>
                <FormItem
                  style={{
                    marginBottom: 0
                  }}
                  {...formItemLayout}
                  label={<FormattedMessage id='componentOverview.body.Resource.name' />}
                >
                  {buildSource.image}
                </FormItem>
                <FormItem
                  style={{
                    marginBottom: 0
                  }}
                  {...formItemLayout}
                  label={<FormattedMessage id='componentOverview.body.Resource.edition' />}
                >
                  {buildSource.version}
                </FormItem>
                <FormItem
                  style={{
                    marginBottom: 0
                  }}
                  {...formItemLayout}
                  label={<FormattedMessage id='componentOverview.body.Resource.command' />}
                >
                  {buildSource.cmd || ''}
                </FormItem>
              </div>
            ) : (
              ''
            )}
            {appUtil.isMarketAppByBuildSource(buildSource) ? (
              <Fragment>
                <FormItem
                  style={{
                    marginBottom: 0
                  }}
                  {...formItemLayout}
                  label={<FormattedMessage id='componentOverview.body.Resource.template' />}
                >
                  {buildSource.group_key ? (
                    <a
                      href="javascript:;"
                      onClick={() => {
                        this.setState({
                          showApp: {
                            details: buildSource.details,
                            group_name: buildSource.rain_app_name,
                            group_key: buildSource.group_key
                          },
                          showMarketAppDetail: true
                        });
                      }}
                    >
                      {buildSource.rain_app_name}
                    </a>
                  ) : (
                    <FormattedMessage id='componentOverview.body.Resource.notfind' />
                  )}
                </FormItem>
                <FormItem
                  style={{
                    marginBottom: 0
                  }}
                  {...formItemLayout}
                  label={<FormattedMessage id='componentOverview.body.Resource.edition' />}
                >
                  {buildSource.version}
                </FormItem>
              </Fragment>
            ) : (
              ''
            )}

            {appUtil.isOauthByBuildSource(buildSource) && (
              <FormItem
                style={{
                  marginBottom: 0
                }}
                {...formItemLayout}
                label={<FormattedMessage id='componentOverview.body.Resource.entry_name' />}
              >
                <a href={buildSource.git_url} target="_blank">
                  {buildSource.full_name}
                </a>
              </FormItem>
            )}

            {appUtil.isCodeAppByBuildSource(buildSource) ? (
              <Fragment>
                <FormItem
                  style={{
                    marginBottom: 0
                  }}
                  {...formItemLayout}
                  label={<FormattedMessage id='componentOverview.body.Resource.git_add' />}
                >
                  <a href={buildSource.git_url} target="_blank">
                    {buildSource.git_url}
                  </a>
                </FormItem>
                <FormItem
                  style={{
                    marginBottom: 0
                  }}
                  {...formItemLayout}
                  label={<FormattedMessage id='componentOverview.body.Resource.code_edition' />}
                >
                  {buildSource.code_version}
                </FormItem>

                <FormItem
                  style={{
                    marginBottom: 0
                  }}
                  {...formItemLayout}
                  className={styles.ant_form_item}
                  label={<FormattedMessage id='componentOverview.body.Resource.language' />}
                >
                  {languageType != 'static' ? (
                    <a target="blank" href={languageObj[`${languageType}`]}>
                      {languageType}
                    </a>
                  ) : (
                    <a href="javascript:void(0);">{languageType}</a>
                  )}
                  <Button
                    size="small"
                    type="primary"
                    onClick={this.handleToDetect}
                  >
                    <FormattedMessage id='componentOverview.body.Resource.Retest' />
                  </Button>
                </FormItem>
              </Fragment>
            ) : (
              ''
            )}
            {appUtil.isUploadFilesAppSource(buildSource) ? (
              <Fragment>
                <FormItem
                  style={{
                    marginBottom: 0
                  }}
                  {...formItemLayout}
                  label={<FormattedMessage id='componentOverview.body.Resource.file_name' />}
                >
                  {buildSource.package_name}
                  <Button
                    size="small"
                    onClick={this.handleToUpload}
                    style={{ marginLeft: '6px' }}
                  >
                    <FormattedMessage id='componentOverview.body.Resource.Re_upload_file' />
                  </Button>
                </FormItem>

                <FormItem
                  style={{
                    marginBottom: 0
                  }}
                  {...formItemLayout}
                  className={styles.ant_form_item}
                  label={<FormattedMessage id='componentOverview.body.Resource.language' />}
                >
                  {languageType}
                  <Button
                    size="small"
                    type="primary"
                    onClick={this.handleToDetect}
                    style={{ marginLeft: '6px' }}
                  >
                    <FormattedMessage id='componentOverview.body.Resource.Retest' />
                  </Button>
                </FormItem>
              </Fragment>
            ) : (
              ''
            )}
            {/* <ChangeBranch
                  isCreateFromCustomCode={appUtil.isCreateFromCustomCode(appDetail)}
                  appAlias={this.props.appAlias}
                  isShowDeployTips={(onoffshow) => {
                    this.props.onshowDeployTips(onoffshow);
                  }}
                /> */}
          </Card>
        )}

        {buildSource && method != 'vm' && (
          <AutoDeploy
            app={this.props.appDetail}
            service_source={appUtil.getCreateTypeCNByBuildSource(buildSource)}
          />
        )}

        {this.state.languageBox && (
          <Modal
            centered
            closable={false}
            visible={this.state.languageBox}
            title={<FormattedMessage id='componentOverview.body.Resource.Retest' />}
            footer={
              !this.state.create_status
                ? [
                  <Button key="back" onClick={this.handlelanguageBox}>

                    <FormattedMessage id='componentOverview.body.Resource.close' />
                  </Button>,
                  <Button
                    key="submit"
                    type="primary"
                    onClick={this.handleDetectPutLanguage}
                  >
                    <FormattedMessage id='componentOverview.body.Resource.testing' />
                  </Button>
                ]
                : this.state.create_status == 'success'
                  ? [
                    <Button
                      key="submit"
                      type="primary"
                      onClick={this.handleUpdatelanguage}
                    >
                      <FormattedMessage id='componentOverview.body.Resource.confirm' />
                    </Button>
                  ]
                  : [<Button onClick={this.handlelanguageBox} key="back"><FormattedMessage id='componentOverview.body.Resource.close' /></Button>]
            }
          >
            <div>
              {this.state.create_status == 'checking' ||
                this.state.create_status == 'complete' ? (
                <div>
                  <p style={{ textAlign: 'center' }}>
                    <Spin />
                  </p>
                  <p style={{ textAlign: 'center', fontSize: '14px' }}>
                    <FormattedMessage id='componentOverview.body.Resource.Testing' />
                  </p>
                </div>
              ) : (
                ''
              )}
              {this.state.create_status == 'failure' ? (
                <div>
                  <p
                    style={{
                      textAlign: 'center',
                      color: '#28cb75',
                      fontSize: '36px'
                    }}
                  >
                    <Icon
                      style={{
                        color: '#f5222d',
                        marginRight: 8
                      }}
                      type="close-circle-o"
                    />
                  </p>
                  {this.state.error_infos &&
                    this.state.error_infos.map((item, index) => (
                      <div key={index}>
                        <span>
                          {item.error_info || ''} {item.solve_advice || ''}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                ''
              )}
              {this.state.create_status == 'success' ? (
                <div>
                  <p
                    style={{
                      textAlign: 'center',
                      color: '#28cb75',
                      fontSize: '36px'
                    }}
                  >
                    <Icon type="check-circle-o" />
                  </p>

                  {this.state.service_info &&
                    this.state.service_info.map((item, idx) => {
                      let languageArr = [];
                      if (item.type == 'language') {
                        languageArr = item?.value?.split(',') || [];
                      }
                      return item.type == 'language' ? (
                        <p key={idx} style={{ textAlign: 'center', fontSize: '14px' }}>
                          {item.key}:
                          <Radio.Group onChange={this.onChangeLange} value={codeLang}>
                            {languageArr.map((lang, i) => (
                              <Radio key={i} value={lang}>{lang}</Radio>
                            ))}
                          </Radio.Group>
                        </p>
                      ) : item.type == 'dockerfiles' ? (
                        codeLang == 'dockerfile' &&
                        <p key={idx} style={{ textAlign: 'center', fontSize: '14px' }}>
                          {item.key}:
                          <Radio.Group onChange={this.onDockfileChange} value={dockfilePath}>
                            {(item.value || []).map((items, index) => (
                              <Radio key={index} value={items}>{items}</Radio>
                            ))}
                          </Radio.Group>
                        </p>
                      ) : (
                        <p key={idx} style={{ textAlign: 'center', fontSize: '14px' }}>
                          {item.key}:{item.value}{' '}
                        </p>
                      );
                    })}
                </div>
              ) : (
                ''
              )}
              {this.state.create_status == 'failed' ? (
                <div>
                  <p
                    style={{
                      textAlign: 'center',
                      color: '999',
                      fontSize: '36px'
                    }}
                  >
                    <Icon type="close-circle-o" />
                  </p>
                  <p style={{ textAlign: 'center', fontSize: '14px' }}>
                    <FormattedMessage id='componentOverview.body.Resource.fail' />
                  </p>
                </div>
              ) : (
                ''
              )}

              {!this.state.create_status && (
                <div>
                  <p style={{ textAlign: 'center', fontSize: '14px' }}>
                    <FormattedMessage id='componentOverview.body.Resource.testing_again' />
                  </p>
                </div>
              )}
            </div>
          </Modal>
        )}
        {this.state.uploadFile &&
          <Modal
            visible
            onCancel={this.handleUploadCancel}
            onOk={this.handleUploadOk}
            title={<FormattedMessage id='componentOverview.body.Resource.upload' />}
          >
            <Upload
              fileList={fileList}
              name="packageTarFile"
              accept=".jar,.war,.zip,.tar"
              onChange={this.onChangeUpload}
              onRemove={this.onRemove}
              action={record.upload_url}
              headers={myheaders}
              multiple={true}
            >
              <Button>
                <Icon type="upload" /> <FormattedMessage id='componentOverview.body.Resource.upload' />
              </Button>
            </Upload>
            <div
              style={{
                display: 'flex',
                marginTop: '20px'
              }}
            >
              <div>
                {existFileList.length > 0 ?
                  (existFileList.map((item) => {
                    return (
                      <div style={{ padding: '12px 8px', border: '1px solid #d9d9d9' }}>
                        <Icon style={{ marginRight: '6px' }} type="inbox" />
                        <span className={styles.fileName}>
                          {item}
                        </span>
                      </div>
                    )
                  })) : (
                    null
                  )}
              </div>
              {existFileList.length > 0 &&
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#ff7b7b',
                    padding: '0px 12px',
                    justifyContent: 'center',
                  }}
                >
                  <Icon onClick={this.handleJarWarUploadDelete} style={{ color: '#fff', cursor: 'pointer' }} type="delete" />
                </div>
              }
            </div>
            {/* <div style={{marginTop:'20px'}}>
              {existFileList.length > 0 && existFileList.map((item) => {
                return (
                  <div className={styles.update}>
                    <Icon style={{ marginRight: '12px' }} type="inbox" />
                    {item}
                    <Icon onClick={this.handleJarWarUploadDelete} className={styles.delete} style={{ textAlign: 'right', color: 'red', cursor: 'pointer' }} type="delete" />
                  </div>
                )
              })}
            </div> */}
          </Modal>
        }
        {languageType && runtimeInfo && (
          <CodeBuildConfig
            appDetail={this.props.appDetail}
            onSubmit={this.handleEditRuntime}
            language={languageType}
            runtimeInfo={this.state.runtimeInfo}
          />
        )}

        {this.state.changeBuildSource && (
          <ChangeBuildSource
            onOk={this.onChangeBuildSource}
            buildSource={buildSource}
            appAlias={this.props.appDetail.service.service_alias}
            archInfo={this.props.appDetail.service.arch}
            title={<FormattedMessage id='componentOverview.body.Resource.Change_component_build_source' />}
            onCancel={this.hideBuildSource}
          />
        )}
        {this.state.editOauth && (
          <Modal
            visible={this.state.editOauth}
            onCancel={this.hideEditOauth}
            onOk={this.handleSubmitOauth}
            loading={this.state.OauthLoading}
            title={<FormattedMessage id='componentOverview.body.Resource.edit' />}
          >
            <Spin spinning={this.state.OauthLoading}>
              <Form onSubmit={this.handleSubmitOauth}>
                <FormItem {...formOauthLayout} label={<FormattedMessage id='componentOverview.body.Resource.oauth' />}>
                  {getFieldDecorator('oauth_service_id', {
                    initialValue: thirdInfo ? `${thirdInfo.service_id}` : '',
                    rules: [
                      {
                        required: true,
                        message: formatMessage({ id: 'componentOverview.body.Resource.choice_oauth' }),
                      }
                    ]
                  })(
                    <Select
                      getPopupContainer={triggerNode => triggerNode.parentNode}
                      onChange={this.handleProvinceChange}
                      placeholder={formatMessage({ id: 'componentOverview.body.Resource.choice_oauth' })}
                    >
                      {tabList.length > 0 &&
                        tabList.map(
                          item =>
                            item.enable && (
                              <Option key={item.id} value={item.id}>
                                {item.name}
                              </Option>
                            )
                        )}
                    </Select>
                  )}
                </FormItem>

                <FormItem {...formOauthLayout} label={<FormattedMessage id='componentOverview.body.Resource.entry_name' />}>
                  {getFieldDecorator('full_name', {
                    initialValue: buildSource
                      ? buildSource.full_name
                      : fullList.length > 0 && fullList[0].project_full_name,
                    rules: [{ required: true, message: formatMessage({ id: 'componentOverview.body.Resource.choice_entry' }) }]
                  })(
                    <Select
                      getPopupContainer={triggerNode => triggerNode.parentNode}
                      onChange={this.handleProjectChange}
                      dropdownRender={menu => (
                        <div>
                          {menu}
                          {!firstPage && (
                            <div>
                              <Divider style={{ margin: '4px 0' }} />
                              <div
                                style={{
                                  padding: '4px 8px',
                                  cursor: 'pointer'
                                }}
                                onMouseDown={e => e.preventDefault()}
                                onClick={this.onPagePre}
                              >
                                <FormattedMessage id='componentOverview.body.Resource.previous' />
                              </div>
                            </div>
                          )}

                          {!lastPage && (
                            <div>
                              <Divider style={{ margin: '4px 0' }} />
                              <div
                                style={{
                                  padding: '4px 8px',
                                  cursor: 'pointer'
                                }}
                                onMouseDown={e => e.preventDefault()}
                                onClick={this.onPageNext}
                              >
                                <FormattedMessage id='componentOverview.body.Resource.next' />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      placeholder={formatMessage({ id: 'componentOverview.body.Resource.choice_entry' })}
                    >
                      {fullList.length > 0 &&
                        fullList.map(item => (
                          <Option
                            key={item.project_url}
                            value={item.project_full_name}
                          >
                            {item.project_full_name}
                          </Option>
                        ))}
                    </Select>
                  )}
                </FormItem>

                <FormItem {...formOauthLayout} label={<FormattedMessage id='componentOverview.body.Resource.git_add' />}>
                  {getFieldDecorator('git_url', {
                    initialValue: buildSource
                      ? buildSource.git_url
                      : fullList.length > 0 && fullList[0].git_url,
                    rules: [{ required: true, message: formatMessage({ id: 'componentOverview.body.Resource.placese_type' }), }]
                  })(<Input placeholder={formatMessage({ id: 'componentOverview.body.Resource.input_name' })} disabled />)}
                </FormItem>

                <Form.Item
                  className={styles.clearConform}
                  {...formOauthLayout}
                  label={<FormattedMessage id='componentOverview.body.Resource.code_edition' />}
                >
                  {getFieldDecorator('code_version', {
                    initialValue: buildSource ? buildSource.code_version : '',
                    rules: [{ required: true, message: formatMessage({ id: 'componentOverview.body.Resource.input_code' }), }]
                  })(
                    <Select
                      getPopupContainer={triggerNode => triggerNode.parentNode}
                      placeholder={formatMessage({ id: 'componentOverview.body.Resource.input_code' })}
                    >
                      <OptGroup
                        label={
                          <Tabs
                            defaultActiveKey="branches"
                            onChange={this.onTabChange}
                            className={styles.selectTabs}
                          >
                            <TabPane tab={<FormattedMessage id='componentOverview.body.Resource.branch' />} key="branches" />
                            <TabPane tab="Tags" key="tags" />
                          </Tabs>
                        }
                      >
                        {tags.length > 0 ? (
                          tags.map(item => {
                            return (
                              <Option key={item} value={item}>
                                {item}
                              </Option>
                            );
                          })
                        ) : (
                          <Option value="loading">
                            <Spin spinning={tagsLoading} />
                          </Option>
                        )}
                      </OptGroup>
                    </Select>
                  )}
                </Form.Item>

                {buildSource && buildSource.arch && buildSource.arch.length > 0 && (
                  <Form.Item
                    {...formOauthLayout}
                    label={<FormattedMessage id='componentOverview.body.Resource.arch' />}
                  >
                    {getFieldDecorator('arch', {
                      initialValue: buildSource.arch[0],
                      rules: [{ required: true, message: formatMessage({ id: 'componentOverview.body.Resource.select_arch' }), }]
                    })(
                      <Select
                        getPopupContainer={triggerNode => triggerNode.parentNode}
                        placeholder={formatMessage({ id: 'componentOverview.body.Resource.select_arch' })}
                        disabled={buildSource.arch.length === 1}
                      >
                        {buildSource.arch.map(item => (
                          <Option key={item} value={item}>
                            {item}
                          </Option>
                        ))}
                      </Select>
                    )}
                  </Form.Item>
                )}
              </Form>
            </Spin>{' '}
          </Modal>
        )}
        {modifyUserpass &&
          <ModifyUrl
            showUsernameAndPass
            isServiceCname={true}
            data={buildSource}
            service_cname={appDetail && appDetail.service && appDetail.service.service_cname}
            onSubmit={this.handleModifyUrl}
            onCancel={this.cancelModifyUrl}
          />
        }
        {this.state.showMarketAppDetail && (
          <MarketAppDetailShow
            onOk={this.hideMarketAppDetail}
            onCancel={this.hideMarketAppDetail}
            app={this.state.showApp}
          />
        )}
      </Fragment>
    );
  }
}
