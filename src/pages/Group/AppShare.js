/* eslint-disable no-param-reassign */
/* eslint-disable func-names */
/* eslint-disable react/no-array-index-key */
/* eslint-disable camelcase */
/* eslint-disable no-unused-expressions */
/* eslint-disable react/sort-comp */
/* eslint-disable no-loop-func */
/* eslint-disable guard-for-in */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable react/no-unused-state */
/* eslint-disable react/no-multi-comp */
/* eslint-disable import/first */
import {
  AutoComplete,
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Form,
  Icon,
  Input,
  InputNumber,
  message,
  Modal,
  notification,
  Row,
  Select,
  Table,
  Tabs,
  Popover,
  Drawer
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import CreateAppModels from '../../components/CreateAppModels';
import FooterToolbar from '../../components/FooterToolbar';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import {
  createApp,
  createEnterprise,
  createTeam
} from '../../utils/breadcrumb';
import cookie from '../../utils/cookie';
import { openInNewTab } from '../../utils/utils';
import globalUtil from '../../utils/global';
import pluginUtil from '../../utils/plugin';
import BatchEditPublishComponent from './components/BatchEditPublishComponent';
import CodeMirrorForm from '../../components/CodeMirrorForm'
import mytabcss from './mytab.less';

const { TabPane } = Tabs;
const FormItem = Form.Item;
const { TextArea } = Input;
const { Option } = Select;
const { confirm } = Modal;

const formItemLayout = {
  labelCol: {
    span: 8
  },
  wrapperCol: {
    span: 16
  }
};

const token = cookie.get('token');
const myheaders = {};
if (token) {
  myheaders.Authorization = `GRJWT ${token}`;
}

// @Form.create()
class AppInfo extends PureComponent {
  state = {
    checked: true
  };
  componentDidMount() {
    if (this.props.getref) {
      this.props.getref(this);
    }
  }

  getValue = fun => {
    this.props.form.validateFields((err, values) => {
      if (!err) {
        fun(values);
      }
    });
  };
  handleCheckChange = (appname, val, e) => {
    const name = {};
    const thisval = val;
    name[appname] = '**None**';
    if (e.target.checked) {
      this.props.form.setFieldsValue(name);
    } else {
      name[appname] = thisval;
      this.props.form.setFieldsValue(name);
    }
  };

  handleIsChange = (name, e) => {
    this.props.form.setFieldsValue({ [name]: e.target.checked });
  };
  renderConnectInfo = () => {
    const { app = {}, form, ID } = this.props;
    const { getFieldDecorator } = form;
    if (
      app.service_connect_info_map_list &&
      app.service_connect_info_map_list.length
    ) {
      return (
        <div
          style={{
            marginBottom: 24
          }}
        >
          <h4
            style={{
              marginBottom: 8
            }}
          >
            {formatMessage({ id: 'appPublish.shop.pages.title.joinMsg' })}
          </h4>
          <Divider />
          <Row>
            {app.service_connect_info_map_list.map((item, index) => (
              <Col key={`connection_${index}`} span={8}>
                <FormItem label={item.attr_name} style={{ padding: 16 }}>
                  {getFieldDecorator(
                    `connect||${item.attr_name}||attr_value||${ID}`,
                    {
                      initialValue: item.attr_value,
                      rules: [
                        {
                          required: false
                        }
                      ]
                    }
                  )(<Input placeholder={item.attr_value} />)}
                  {getFieldDecorator(
                    `connect||${item.attr_name}||random||${ID}`,
                    {
                      valuePropName: 'checked',
                      initialValue: item.attr_value === '**None**'
                    }
                  )(
                    <Checkbox
                      // eslint-disable-next-line react/jsx-no-bind
                      onChange={this.handleCheckChange.bind(
                        this,
                        `connect||${item.attr_name}||attr_value||${ID}`,
                        item.attr_value
                      )}
                    >
                      {formatMessage({ id: 'appPublish.shop.pages.title.random' })}
                    </Checkbox>
                  )}
                </FormItem>
              </Col>
            ))}
          </Row>
        </div>
      );
    }
    return null;
  };

  renderEvn = () => {
    const { app = {}, form, ID } = this.props;
    const { getFieldDecorator } = form;
    if (app.service_env_map_list && app.service_env_map_list.length) {
      return (
        <div
          style={{
            marginBottom: 24
          }}
        >
          <h4
            style={{
              marginBottom: 8
            }}
          >

            {formatMessage({ id: 'appPublish.shop.pages.title.environment_variable' })}
          </h4>
          <Divider />
          <Row>
            {app.service_env_map_list.map(item => {
              const { attr_name, attr_value } = item;
              return (
                <Col span={8}>
                  <FormItem label={attr_name} style={{ padding: 16 }}>
                    {getFieldDecorator(`env||${attr_name}||${ID}`, {
                      initialValue: attr_value,
                      rules: [
                        {
                          required: false,
                          message: formatMessage({ id: 'placeholder.copy.not_null' })
                        }
                      ]
                    })(<Input />)}
                  </FormItem>
                </Col>
              );
            })}
          </Row>
        </div>
      );
    }
    return null;
  };
  renderExtend = () => {
    const { app = {}, ID = 'extend', form } = this.props;
    const { getFieldDecorator, getFieldValue } = form;
    const pd16 = { padding: 16 };
    if (app.extend_method_map) {
      const steps = getFieldValue(`${ID}||step_node`);
      return (
        <div
          style={{
            marginBottom: 24
          }}
        >
          <h4
            style={{
              marginBottom: 8
            }}
          >
            {formatMessage({ id: 'appPublish.shop.pages.title.flexible' })}
          </h4>
          <Divider />
          <Row>
            <Col span={8}>
              <FormItem label={formatMessage({ id: 'appPublish.shop.pages.form.label.min_node' })} style={pd16}>
                {getFieldDecorator(`${ID}||min_node`, {
                  initialValue: app.extend_method_map.min_node,
                  rules: [
                    {
                      required: true,
                      message: formatMessage({ id: 'placeholder.appShare.formatError' })
                    }
                  ]
                })(
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder={formatMessage({ id: 'placeholder.appShare.min_node' })}
                    min={1}
                    step={steps || app.extend_method_map.step_node}
                  />
                )}
              </FormItem>
            </Col>
            <Col span={8}>
              <FormItem label={formatMessage({ id: 'appPublish.shop.pages.form.label.max_node' })} style={pd16}>
                {getFieldDecorator(`${ID}||max_node`, {
                  initialValue: app.extend_method_map.max_node,
                  rules: [
                    {
                      required: true,
                      message: formatMessage({ id: 'placeholder.appShare.formatError' })
                    }
                  ]
                })(
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder={formatMessage({ id: 'placeholder.appShare.max_node' })}
                    min={1}
                    step={steps || app.extend_method_map.step_node}
                  />
                )}
              </FormItem>
            </Col>
            <Col span={8}>
              <FormItem label={formatMessage({ id: 'appPublish.shop.pages.form.label.step_node' })} style={pd16}>
                {getFieldDecorator(`${ID}||step_node`, {
                  initialValue: app.extend_method_map.step_node,
                  rules: [
                    {
                      required: true,
                      message: formatMessage({ id: 'placeholder.appShare.formatError' })
                    }
                  ]
                })(
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder={formatMessage({ id: 'placeholder.appShare.step_node' })}
                    min={app.extend_method_map.min_node}
                    max={app.extend_method_map.max_node}
                  />
                )}
              </FormItem>
            </Col>
            <Col span={8}>
              <FormItem label={formatMessage({ id: 'appPublish.shop.pages.form.label.init_memory' })} style={pd16}>
                {getFieldDecorator(`${ID}||init_memory`, {
                  initialValue: app.extend_method_map.init_memory || 0,
                  rules: [
                    {
                      required: true,
                      message: formatMessage({ id: 'placeholder.appShare.formatError' })
                    }
                  ]
                })(
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder={formatMessage({ id: 'placeholder.appShare.init_memory' })}
                    min={0}
                    max={app.extend_method_map.max_memory}
                    step={app.extend_method_map.step_memory}
                  />
                )}
                <div style={{ color: '#999999', fontSize: '12px' }}>
                  {formatMessage({ id: 'appPublish.shop.pages.form.quota0.desc' })}
                </div>
              </FormItem>
            </Col>
            <Col span={8}>
              <FormItem label={formatMessage({ id: 'appPublish.shop.pages.form.label.container_cpu' })} style={pd16}>
                {getFieldDecorator(`${ID}||container_cpu`, {
                  initialValue: app.extend_method_map.container_cpu || 0,
                  rules: [
                    {
                      required: true,
                      message: formatMessage({ id: 'placeholder.appShare.container_cpu' })
                    },
                    {
                      pattern: new RegExp(/^[0-9]\d*$/, 'g'),
                      message: formatMessage({ id: 'placeholder.plugin.min_cpuMsg' })
                    }
                  ]
                })(
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    placeholder={formatMessage({ id: 'placeholder.appShare.container_cpu' })}
                  />
                )}
                <div style={{ color: '#999999', fontSize: '12px' }}>
                  {formatMessage({ id: 'appPublish.shop.pages.form.quota1000.desc' })}
                </div>
              </FormItem>
            </Col>
          </Row>
        </div>
      );
    }
    return null;
  };

  render() {
    return (
      <Fragment>
        {this.renderConnectInfo()}
        {this.renderEvn()}
        {this.renderExtend()}
      </Fragment>
    );
  }
}

@connect(({ user, application, loading, enterprise, teamControl }) => ({
  currUser: user.currentUser,
  apps: application.apps,
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  groupDetail: application.groupDetail || {},
  loading
}))
@Form.create()
export default class Main extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      previewVisible: false,
      previewImage: '',
      toDelete: false,
      recordShare: false,
      checkShare: true,
      ShareStep: 0,
      ID: 0,
      info: null,
      selectedApp: '',
      service: null,
      tabk: '',
      fileList: [],
      shareList: [],
      sharearrs: [],
      shareModal: null,
      isShare: 'false',
      service_cname: '',
      dep_service_name: [],
      share_service_list: [],
      share_k8s_resources: [],
      ShareTypeShow: false,
      scopeValue: 'goodrain:private',
      appDetail: {},
      record: {},
      model: {},
      submitLoading: false,
      loadingModels: true,
      models: [],
      versions: [],
      versionInfo: false,
      editorAppModel: false,
      appModelInfo: false,
      batchEditShow: false,
      selectComponentID: [],
      allSelect: false,
      isAppPlugin: null,
      currentPage: 1,
      showDrawerSwitchVal: false,
      k8sContent: '',
      k8sName: "",
      recoders: [],
    };
    this.com = [];
    this.share_group_info = null;
  }
  componentDidMount() {
    this.fetchAppDetail();
    this.fetchRecord();
    this.getShareInfo();
  }
  onCancels = () => {
    this.setState({
      shareModal: null,
      dep_service_name: []
    });
  };

  getParams() {
    return {
      groupId: this.props.match.params.appID,
      shareId: this.props.match.params.shareId
    };
  }
  getBase64 = file => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  getShareInfo() {
    const { dispatch } = this.props;
    const params = this.getParams();
    dispatch({
      type: 'application/getShareInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        ...params
      },
      callback: data => {
        let selectedApp = '';
        if (data) {
          if (data.bean.share_service_list[0]) {
            selectedApp = data.bean.share_service_list[0].service_alias;
          }
          this.setState({
            info: data.bean,
            plugin_list: data.bean.share_plugin_list,
            selectedApp,
            tabk: data.bean && data.bean.share_service_list && data.bean.share_service_list[0] && data.bean.share_service_list[0].service_share_uuid,
            share_service_list: data.bean.share_service_list,
            share_k8s_resources: data.bean.share_k8s_resources
          });
          if (
            data.bean.share_service_list &&
            data.bean.share_service_list.length > 0
          ) {
            const arr = data.bean.share_service_list.map(
              item => item.service_share_uuid
            );
            this.setState({
              shareList: arr,
              sharearrs: arr
            });
          }
        }
      },
      handleError: res => {
        if (res && res.status === 404) {
          this.props.dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/exception/404`
            )
          );
        }
      }
    });
  }
  fetchRecord = () => {
    this.setState({ loading: true });
    const { teamName, appID, shareId } = this.props.match.params;
    const { dispatch } = this.props;
    dispatch({
      type: 'application/fetchShareRecord',
      payload: {
        team_name: teamName,
        app_id: appID,
        record_id: shareId
      },
      callback: data => {
        if (data && data.bean && data.status_code === 200) {
          this.setState({ record: data.bean, loading: false }, () => {
            this.fetchModels();
            this.fetchPublishRecoder()
          });
        }
      }
    });
  };

  fetchModels = (isCreate, isEditor) => {
    const { record } = this.state;

    const scope = record && record.scope;
    const scopeTarget = record && record.scope_target;

    const { teamName, appID } = this.props.match.params;
    const { dispatch, form } = this.props;
    const { setFieldsValue } = form;
    const body = {
      team_name: teamName,
      app_id: appID
    };
    if (scope === 'goodrain' && scopeTarget) {
      body.scope = 'goodrain';
      body.market_id = scopeTarget.store_id;
    } else {
      body.scope = 'local';
    }
    // const isMarket = scopeTarget && scopeTarget.store_id;

    this.setState({ loadingModels: true });
    dispatch({
      type: 'enterprise/fetchShareModels',
      payload: body,
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState(
            {
              models: res.list,
              model: res.bean,
              loadingModels: false
            },
            // eslint-disable-next-line consistent-return
            () => {
              if (res.list.length > 0) {
                if (isEditor) {
                  const info = res.list.filter(item => {
                    return item.app_id === isEditor.app_id;
                  });
                  if (info && info.length > 0) {
                    setFieldsValue({
                      describe: info[0].app_describe || ''
                    });
                    this.setState({
                      model: info[0]
                    });
                  }
                  return null;
                }
                if (isCreate) {
                  setFieldsValue({
                    app_id: res.list[0].app_id
                  });
                }
                if (JSON.stringify(res.bean) === '{}') {
                  this.changeCurrentModel(res.list[0].app_id);
                } else {
                  this.changeCurrentModel(
                    isCreate ? res.list[0].app_id : res.bean && res.bean.app_id,
                    isCreate ? '' : res.bean && res.bean.version,
                    isCreate
                  );
                }
              }
            }
          );
        }
      }
    });
  };

  fetchPublishRecoder = () => {
    const { teamName, appID } = this.props.match.params;
    const { dispatch } = this.props;
    const { page, pageSize } = this.state;
    dispatch({
      type: 'application/fetchShareRecords',
      payload: {
        team_name: teamName,
        app_id: appID,
        page,
        page_size: pageSize
      },
      callback: data => {
        if (data) {
          this.setState({
            recoders: data.list,
          });
        }
      }
    });
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
            appDetail: res.bean,
            loadingDetail: false
          });
        }
      },
      handleError: res => {
        if (res && res.code === 404) {
          this.props.dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps`
            )
          );
        }
      }
    });
  };
  handleSubmitConditions = () => {
    const { record, versionInfo } = this.state;
    const { form } = this.props;
    form.validateFieldsAndScroll(
      { scroll: { offsetTop: 80 } },
      (err, values) => {
        if (!err) {
          if (
            record.scope !== 'goodrain' &&
            versionInfo &&
            values.version === versionInfo.version &&
            versionInfo.dev_status
          ) {
            confirm({
              title: formatMessage({ id: 'appPublish.shop.pages.confirm.title' }),
              content: '',
              okText: formatMessage({ id: 'popover.confirm' }),
              cancelText: formatMessage({ id: 'popover.cancel' }),
              onOk: () => {
                this.handleSubmit();
              }
            });
          } else {
            this.handleSubmit();
          }
        }
      }
    );
  };
  handleSubmit = () => {
    const { dispatch, form } = this.props;
    const { record, sharearrs, share_service_list, isAppPlugin, share_k8s_resources } = this.state;
    const newinfo = {};
    form.validateFields((err, values) => {
      if (!err) {
        this.setState({ submitLoading: true });
        const appVersionInfo = {
          share_id: record.record_id,
          app_model_id: values.app_id,
          describe: values.describe,
          version: values.version,
          version_alias: values.version_alias,
          is_plugin: values.is_plugin
        };
        if (record.scope === 'goodrain') {
          appVersionInfo.scope_target = record.scope_target;
          appVersionInfo.scope = record.scope;
          appVersionInfo.market_id =
            record.scope_target && record.scope_target.store_id;
          appVersionInfo.template_type = 'RAM';
        }
        const share_service_data = share_service_list;
        share_service_list.map((item, index) => {
          const { extend_method_map, service_id } = item;
          if (extend_method_map) {
            Object.keys(extend_method_map).forEach(function (key) {
              if (values[`${service_id}||${key}`]) {
                share_service_data[index].extend_method_map[key] =
                  values[`${service_id}||${key}`];
              }
            });
          }
          return item;
        });
        const arr = [];
        const dep_service_key = [];
        sharearrs.map(item => {
          share_service_data.map(option => {
            if (item === option.service_share_uuid) {
              arr.push(option);
              option.dep_service_map_list &&
                option.dep_service_map_list.length > 0 &&
                option.dep_service_map_list.map(items => {
                  dep_service_key.push(items.dep_service_key);
                });
            }
            return item;
          });
          return item;
        });
        const comdata = this.com;
        comdata.map(app => {
          const apptab = app.props.tab;
          let appvalue = null;
          app.props.form.validateFields((errs, val) => {
            if (!errs) {
              appvalue = val;
            }
          });
          share_service_data.map(option => {
            const ID = option.service_id;
            if (option.service_alias == apptab) {
              // eslint-disable-next-line no-restricted-syntax
              for (const index in appvalue) {
                let indexarr = [];
                indexarr = index.split('||');
                const firstInfo =
                  indexarr && indexarr.length > 0 && indexarr[0];
                if (firstInfo) {
                  const isConnect = firstInfo === 'connect';
                  const isEnv = firstInfo === 'env';

                  if (isConnect && indexarr[2] != 'random') {
                    option.service_connect_info_map_list.map(serapp => {
                      if (
                        isConnect &&
                        indexarr[2] != 'random' &&
                        serapp.attr_name == indexarr[1] &&
                        ID === indexarr[3]
                      ) {
                        serapp[indexarr[2]] = appvalue[index];
                        serapp.is_change = true;
                      }
                    });
                  }

                  if (isEnv) {
                    option.service_env_map_list.map(serapp => {
                      const { attr_name: attrName } = serapp;
                      if (attrName === indexarr[1] && ID === indexarr[2]) {
                        if (isEnv) {
                          serapp.attr_value = appvalue[index];
                          serapp.is_change = true;
                        }
                      }
                    });
                  }
                  if (firstInfo === 'extend') {
                    option.extend_method_map[indexarr[1]] = appvalue[index];
                  }
                }
              }
            }
          });
        });
   
        newinfo.app_version_info = appVersionInfo;
        newinfo.share_service_list = arr;
        newinfo.share_plugin_list = this.state.plugin_list;
        newinfo.share_k8s_resources = share_k8s_resources
        const teamName = globalUtil.getCurrTeamName();
        const { appID, shareId } = this.props.match.params;
        dispatch({
          type: 'application/subShareInfo',
          payload: {
            team_name: teamName,
            share_id: shareId,
            use_force: true,
            new_info: newinfo
          },
          callback: data => {
            this.setState({ submitLoading: false });
            if (data) {
              if(share_service_data.length == 0){                
                dispatch({
                  type: 'application/completeShare',
                  payload: {
                    team_name: globalUtil.getCurrTeamName(),
                    share_id: shareId,
                    appID: appID
                  },
                  callback: data => {
                    if (data && data.app_market_url) {
                      openInNewTab(data.app_market_url);
                    }
                    dispatch(
                      routerRedux.replace(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${appID}/publish`)
                    );
                  },
                  handleError: err => {
                    this.handleError(err);
                  }
                });
              }else{
                 dispatch(
                  routerRedux.push(
                    `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${appID}/share/${shareId}/two?isAppPlugin=${appVersionInfo.is_plugin}`
                  )
                );
              }
            }
          },
          handleError: errs => {
            this.setState({ submitLoading: false });
            const data = errs && errs.data;
            const msg = data && data.msg_show;
            if (data && data.code && data.code === 10501) {
              notification.warning({ message: formatMessage({ id: 'confirmModal.component.hint' }), description: msg });
              this.setState({ isShare: 'true' });
              return null;
            }
            notification.warning({ message: formatMessage({ id: 'confirmModal.component.request_Error' }), description: msg });
          }
        });
      }
    });
  };

  handleGiveup = () => {
    const groupId = this.props.match.params.appID;

    const { dispatch } = this.props;
    dispatch({
      type: 'application/giveupShare',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        share_id: this.props.match.params.shareId
      },
      callback: () => {
        dispatch(
          routerRedux.push(
            `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${groupId}`
          )
        );
      }
    });
  };

  handleLogoChange = ({ fileList }) => {
    this.setState({ fileList });
  };
  handleLogoRemove = () => {
    this.setState({ fileList: [] });
  };

  save = val => {
    this.com.push(val);
  };
  tabClick = val => {
    this.setState({ tabk: val });
  };

  showCreateAppModel = () => {
    this.setState({ showCreateAppModel: true });
  };
  hideCreateAppModel = () => {
    this.setState({ showCreateAppModel: false });
  };
  handleCreateAppModel = () => {
    notification.success({ message: formatMessage({ id: 'notification.success.setUp' }) });
    this.fetchModels(true);
    this.hideCreateAppModel();
  };

  handleCancel = () => this.setState({ previewVisible: false });
  changeCurrentVersion = version => {
    const { model } = this.state;
    if (model && model.versions && model.versions.length > 0) {
      model.versions.map(item => {
        if (version === item.version) {
          this.handleSetFieldsValue(item);
        }
      });
    }
  };
  changeCurrentModel = (modelId, setVersion, isCreate) => {
    const { models } = this.state;
    if (models && models.length > 0) {
      models.map(item => {
        const { app_id: appID, versions } = item;
        if (modelId === appID) {
          this.setState({ model: item, versions }, () => {
            if (versions && versions.length > 0) {
              let versionInfo = versions[0];
              if (setVersion) {
                versions.map(v => {
                  const { version } = v;
                  if (version === setVersion) {
                    versionInfo = v;
                  }
                  return item;
                });
              }
              this.handleSetFieldsValue(versionInfo, isCreate);
            } else {
              this.handleSetFieldsValue(item, isCreate);
            }
          });
        }
        return item;
      });
    }
  };

  handleSetFieldsValue = (versionInfo, isCreate) => {
    const { setFieldsValue } = this.props.form;
    this.setState({ versionInfo });
    setFieldsValue({
      version: isCreate ? '0.1' : ''
    });
    setFieldsValue({
      version_alias: versionInfo ? versionInfo.version_alias : ''
    });
    setFieldsValue({
      describe: versionInfo
        ? versionInfo.describe || versionInfo.app_describe
        : ''
    });
  };

  handleEditorAppModel = info => {
    notification.success({ message: formatMessage({ id: 'notification.success.edit' }) });
    this.fetchModels(false, info);
    this.hideEditorAppModel();
  };

  showEditorAppModel = app_id => {
    const { models } = this.state;
    const info = models.filter(item => {
      return item.app_id === app_id;
    });
    if (info && info.length > 0) {
      this.setState({
        appModelInfo: info[0],
        editorAppModel: true
      });
    }
  };

  hideEditorAppModel = () => {
    this.setState({ editorAppModel: false, appModelInfo: false });
  };

  // 验证上传文件方式
  checkVersion = (rules, value, callback) => {
    if (value === '' || !value) {
      callback(formatMessage({ id: 'placeholder.appShare.versions_notNull' }));
    }
    if (value) {
      if (!/^[0-9]+(\.[0-9]+){1,2}$/.test(value)) {
        callback(formatMessage({ id: 'placeholder.appShare.layout_grid_mode' }));
        return;
      }
    }
    callback();
  };
  removeComponent = component_share_key => {
    const { share_service_list } = this.state;
    const dep_service_name = [];
    if (share_service_list.length === 1) {
      message.info(formatMessage({ id: 'placeholder.appShare.leastOne' }));
      return;
    }
    share_service_list.map(component => {
      component.dep_service_map_list.map(c => {
        if (c.dep_service_key === component_share_key) {
          dep_service_name.push(component.service_cname);
        }
        return c;
      });
      return component;
    });

    if (dep_service_name.length > 0) {
      this.setState({
        del_component_share_key: component_share_key,
        dep_service_name,
        shareModal: true
      });
    } else {
      this.removeComponentReal(component_share_key);
    }
  };
  removeComponentReal = component_share_key => {
    const { share_service_list, tabk } = this.state;
    const new_comonents = share_service_list.filter(
      item => item.service_share_uuid !== component_share_key
    );
    if (tabk !== component_share_key) {
      this.setState({ share_service_list: new_comonents }, () => {
        this.update_publish_plugins();
      });
    } else {
      this.setState(
        {
          share_service_list: new_comonents,
          tabk: new_comonents.length > 0 && new_comonents[0].service_share_uuid
        },
        () => {
          this.update_publish_plugins();
        }
      );
    }
  };
  update_publish_plugins = () => {
    const { share_service_list, info } = this.state;
    const plugin_ids = [];
    share_service_list.map(item => {
      if (item.service_related_plugin_config) {
        item.service_related_plugin_config.map(plu =>
          plugin_ids.push(plu.plugin_id)
        );
      }
      return item;
    });
    if (info.share_plugin_list) {
      const new_plugins = info.share_plugin_list.filter(
        item => plugin_ids.indexOf(item.plugin_id) > -1
      );
      this.setState({ plugin_list: new_plugins });
    }
  };
  updateSelectComponents = checked => {
    const { info, tabk } = this.state;
    const new_comonents = info.share_service_list.filter(
      item => checked.indexOf(item.service_share_uuid) > -1
    );
    if (checked.indexOf(tabk) > -1) {
      this.setState(
        {
          batchEditShow: false,
          share_service_list: new_comonents
        },
        () => {
          this.update_publish_plugins();
        }
      );
    } else {
      this.setState(
        {
          batchEditShow: false,
          share_service_list: new_comonents,
          tabk: new_comonents.length > 0 && new_comonents[0].service_share_uuid
        },
        () => {
          this.update_publish_plugins();
        }
      );
    }
  };
  //切换分页
  getPageContent = (page) => {
    this.setState({
      currentPage: page
    })
  }
  //关闭抽屉组件
  onClose = () => {
    this.setState({
      showDrawerSwitchVal: false,
    });
  };
  //查看k8s资源详情
  showDrawer = (text, record) => {
    this.setState({
      k8sContent: text,
      k8sName: record.name,
      showDrawerSwitchVal: !this.state.showDrawerSwitchVal,
    })
  }
  render() {
    const { info, tabk, share_service_list, plugin_list, share_k8s_resources, currentPage, k8sContent, k8sName } = this.state;
    if (!info) {
      return null;
    }
    const apps = share_service_list || [];
    const plugins = plugin_list || [];
    const {
      loading,
      form,
      currentEnterprise,
      currentTeam,
      currentRegionName
    } = this.props;
    const { getFieldDecorator, getFieldValue, setFieldsValue } = form;

    const {
      shareModal,
      dep_service_name,
      models,
      appDetail,
      showCreateAppModel,
      editorAppModel,
      model,
      record,
      versionInfo,
      versions,
      submitLoading,
      appModelInfo,
      batchEditShow,
      recoders,
    } = this.state;
    const Application = getFieldValue('app_id');
    let breadcrumbList = [];
    breadcrumbList = createApp(
      createTeam(
        createEnterprise(breadcrumbList, currentEnterprise),
        currentTeam,
        currentRegionName
      ),
      currentTeam,
      currentRegionName,
      { appName: appDetail.group_name, appID: appDetail.group_id }
    );
    breadcrumbList.push({
      title: formatMessage({ id: 'appPublish.btn.record.list.title' }),
      href: `/team/${currentTeam.team_name}/region/${currentRegionName}/apps/${appDetail.group_id}/publish`
    });
    if (record && record.scope === 'goodrain') {
      breadcrumbList.push({ title: formatMessage({ id: 'appPublish.btn.market' }) });
    } else {
      breadcrumbList.push({ title: formatMessage({ id: 'appPublish.btn.local' }) });
    }
    const marketId = record.scope_target && record.scope_target.store_id;
    const marketVersion =
      record.scope_target && record.scope_target.store_version;
    //前端分页
    const perPageNum = 5; // 每页展示5条数据
    const count = share_k8s_resources && share_k8s_resources.length || 0; // 假使已通过接口获取到接口的数据data，计算data的长度
    const minPage = 1; // 最小页码是1
    const maxPage = Math.ceil(count / perPageNum); // 计算最大的页码
    const curPageData = share_k8s_resources && share_k8s_resources.slice((currentPage - 1) * perPageNum, currentPage * perPageNum); // 当前页的数据
    const pagination = {
      onChange: this.getPageContent,
      total: count,
      pageSize: perPageNum,
    };
    return (
      <PageHeaderLayout breadcrumbList={breadcrumbList}>
        <div>
          <Card
            style={{
              marginBottom: 24
            }}
            title={formatMessage({ id: 'appPublish.btn.record.list.title.versions' })}
            bordered={false}
            bodyStyle={{
              padding: 0
            }}
          >
            <div
              style={{
                padding: '24px'
              }}
            >
              <Row gutter={24}>
                <Col span="12">
                  <Form.Item {...formItemLayout} label={formatMessage({ id: 'appPublish.btn.record.list.title.appMode' })}>
                    {getFieldDecorator('app_id', {
                      initialValue: recoders.length > 1 ? model.app_id : '',
                      rules: [
                        {
                          required: true,
                          message: formatMessage({ id: 'placeholder.appShare.appTemplate' })
                        }
                      ]
                    })(
                      <Select
                        getPopupContainer={triggerNode =>
                          triggerNode.parentNode
                        }
                        style={{ width: '60%' }}
                        onChange={this.changeCurrentModel}
                        placeholder={formatMessage({ id: 'placeholder.appShare.selectAppTemplate' })}
                      >
                        {models.map(item => (
                          <Option key={item.app_id}>{item.app_name}</Option>
                        ))}
                      </Select>
                    )}
                    {Application && recoders.length > 1 && (
                      <Button
                        style={{ marginLeft: '10px' }}
                        onClick={() => {
                          this.showEditorAppModel(Application);
                        }}
                      >
                        {formatMessage({ id: 'appPublish.btn.record.list.label.deitAppTemplate' })}
                      </Button>
                    )}
                    <Button
                      style={{
                        textAlign: 'center',
                        marginLeft: 10
                      }}
                      onClick={this.showCreateAppModel}
                    >
                      {formatMessage({ id: 'appPublish.btn.record.list.label.newAppTemplate' })}
                    </Button>
                  </Form.Item>
                </Col>
                <Col span="12">
                  <Form.Item {...formItemLayout} label={formatMessage({ id: 'appPublish.btn.record.list.label.version' })}>
                    {getFieldDecorator('version', {
                      initialValue: '',
                      rules: [
                        {
                          required: true,
                          validator: this.checkVersion
                        }
                      ]
                    })(
                      <AutoComplete
                        style={{ width: '100%' }}
                        onChange={this.changeCurrentVersion}
                        placeholder={formatMessage({ id: 'placeholder.appShare.version' })}
                      >
                        {versions &&
                          versions.length > 0 &&
                          versions.map((item, index) => {
                            const { version } = item;
                            return (
                              <AutoComplete.Option
                                key={`version${index}`}
                                value={version}
                              >
                                {version}
                              </AutoComplete.Option>
                            );
                          })}
                      </AutoComplete>
                    )}
                  </Form.Item>
                </Col>
                <Col span="12">
                  <Form.Item {...formItemLayout} label={formatMessage({ id: 'appPublish.btn.record.list.label.version_alias' })}>
                    {getFieldDecorator('version_alias', {
                      initialValue:
                        (versionInfo && versionInfo.version_alias) || '',
                      rules: [
                        {
                          max: 64,
                          message: formatMessage({ id: 'placeholder.appShare.max64' })
                        }
                      ]
                    })(
                      <Input
                        style={{ width: '60%' }}
                        placeholder={formatMessage({ id: 'placeholder.appShare.version_alias' })}
                      />
                    )}
                  </Form.Item>

                  <Form.Item {...formItemLayout} label={formatMessage({ id: 'appPublish.btn.record.list.label.is_plugin' })}>
                    {getFieldDecorator('is_plugin', {
                      initialValue: (versionInfo && (versionInfo.is_plugin)) || false
                    })(
                      plugins.length > 0 ? (
                        <Checkbox>
                        </Checkbox>
                      ) : (
                        <Checkbox disabled>
                        </Checkbox>
                      )

                    )}
                  </Form.Item>
                </Col>
                <Col span="12" style={{ height: '104px' }}>
                  <Form.Item {...formItemLayout} label={formatMessage({ id: 'appPublish.btn.record.list.label.describe' })}>
                    {getFieldDecorator('describe', {
                      initialValue:
                        (versionInfo &&
                          (versionInfo.describe || versionInfo.app_describe)) ||
                        '',
                      rules: [
                        {
                          max: 255,
                          message: formatMessage({ id: 'placeholder.max255' })
                        }
                      ]
                    })(
                      <TextArea
                        placeholder={formatMessage({ id: 'placeholder.appShare.describe' })}
                        style={{ height: '70px' }}
                      />
                    )}
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </Card>
          {apps && apps.length > 0 &&
            <Card
              style={{
                marginBottom: 24
              }}
              title={formatMessage({ id: 'appPublish.btn.record.list.title.publish_component_config' })}
              bordered={false}
              bodyStyle={{
                padding: 0
              }}
            >
              <div
                style={{
                  padding: '24px'
                }}
              >
                <div className={mytabcss.mytab}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '16px',
                      lineHeight: '32px'
                    }}
                  >
                    <h4
                      className={mytabcss.required}
                      style={{
                        marginBottom: 0
                      }}
                    >
                      {formatMessage({ id: 'appPublish.btn.record.list.title.edit_publish_componentMsg' })}
                    </h4>
                    <Button
                      style={{ float: 'right' }}
                      onClick={() => {
                        this.setState({ batchEditShow: true });
                      }}
                    >
                      {formatMessage({ id: 'appPublish.btn.record.list.title.bulk_edit' })}
                    </Button>
                  </div>
                  <div className={mytabcss.mytabtit} id="mytabtit">
                    <Tabs
                      type="editable-card"
                      hideAdd
                      activeKey={tabk}
                      onChange={this.tabClick}
                      onEdit={(targetKey, action) => {
                        if (action === 'remove') {
                          this.removeComponent(targetKey);
                        }
                      }}
                    >
                      {apps && apps.map(apptit => {
                        const id = apptit.service_share_uuid
                        return (
                          <TabPane
                            key={id}
                            tab={
                              <span className={mytabcss.cont}>
                                <a
                                  tab={apptit.service_cname}
                                  onClick={() => {
                                    this.tabClick(id);
                                  }}
                                >
                                  {apptit.service_cname}
                                </a>
                              </span>
                            }
                          >
                            <AppInfo
                              key={id}
                              form={form}
                              app={apptit}
                              getref={this.save}
                              tab={apptit.service_alias}
                              ID={apptit.service_id}
                            />
                          </TabPane>
                        );
                      })}
                    </Tabs>
                  </div>
                </div>
              </div>
            </Card>
          }
          {plugins && plugins.length > 0 &&
            <Card
              style={{
                marginBottom: 24
              }}
              title={formatMessage({ id: 'appPublish.btn.record.list.title.publish_pluginMsg' })}
              bordered={false}
            >
              <Table
                size="middle"
                dataSource={plugins}
                columns={[
                  {
                    title: formatMessage({ id: 'appPublish.btn.record.list.table.plugin_alias' }),
                    dataIndex: 'plugin_alias'
                  },
                  {
                    title: formatMessage({ id: 'appPublish.btn.record.list.table.category' }),
                    dataIndex: 'category',
                    render: v => {
                      return pluginUtil.getCategoryCN(v);
                    }
                  },
                  {
                    title: formatMessage({ id: 'appPublish.btn.record.list.table.build_version' }),
                    dataIndex: 'build_version'
                  }
                ]}
              />
            </Card>
          }
          <Card
            style={{
              marginBottom: 128
            }}
            title={formatMessage({ id: 'appPublish.btn.record.list.title.k8s' })}
            bordered={false}
          >
            <Table
              size="middle"
              dataSource={curPageData}
              columns={[
                {
                  title: formatMessage({ id: 'appPublish.btn.record.list.table.name' }),
                  dataIndex: 'name',
                  key: 'name',
                  align: 'left',
                },
                {
                  title: formatMessage({ id: 'appPublish.btn.record.list.table.kind' }),
                  dataIndex: 'kind',
                  key: 'kind',
                  align: 'left',
                },
                {
                  title: formatMessage({ id: 'appPublish.btn.record.list.table.content' }),
                  dataIndex: 'content',
                  key: "content",
                  align: 'center',
                  render: (text, record) => {
                    return <>
                      <Button onClick={() => this.showDrawer(text, record)}>
                        {formatMessage({ id: 'appPublish.btn.record.list.table.view_details' })}
                      </Button>
                    </>
                  }
                },
              ]}
              pagination={pagination}
            />
          </Card>
          <Drawer
            title={formatMessage({ id: 'appPublish.btn.record.list.title.detailMsg' })}
            placement="right"
            closable={true}
            onClose={this.onClose}
            visible={this.state.showDrawerSwitchVal}
            width={500}
          >
            <CodeMirrorForm
              setFieldsValue={setFieldsValue}
              Form={Form}
              style={{ marginBottom: '20px' }}
              getFieldDecorator={getFieldDecorator}
              data={k8sContent || ''}
              name={k8sName}
              mode={'yaml'}
              isUpload={false}
              disabled={true}
            />
          </Drawer>
          {shareModal && (
            <Modal
              title={formatMessage({ id: 'appPublish.btn.record.list.title.check' })}
              visible={shareModal}
              onOk={() => {
                this.removeComponentReal(this.state.del_component_share_key);
                this.onCancels();
              }}
              onCancel={this.onCancels}
              okText={formatMessage({ id: 'popover.confirm' })}
              cancelText={formatMessage({ id: 'popover.cancel' })}
            >
              <div>
                {formatMessage({ id: 'appPublish.btn.record.list.pages.needPublish' })}
                {dep_service_name &&
                  dep_service_name.length > 0 &&
                  dep_service_name.map((item, index) => {
                    return (
                      <span
                        style={{ marginLeft: '5px', color: '#4d73b1' }}
                        key={index}
                      >
                        {item}
                      </span>
                    );
                  })}
                {formatMessage({ id: 'appPublish.btn.record.list.pages.componentPublish' })}
              </div>
            </Modal>
          )}
          {batchEditShow && (
            <BatchEditPublishComponent
              allcomponents={info.share_service_list}
              components={apps}
              onCancel={() => {
                this.setState({ batchEditShow: false });
              }}
              onOk={this.updateSelectComponents}
            />
          )}
          {showCreateAppModel && (
            <CreateAppModels
              title={formatMessage({ id: 'appPublish.btn.record.list.pages.createAppTemplate' })}
              appName={appDetail && appDetail.group_name}
              eid={currentEnterprise.enterprise_id}
              onOk={this.handleCreateAppModel}
              defaultScope="team"
              marketId={marketId}
              marketVersion={marketVersion}
              onCancel={this.hideCreateAppModel}
            />
          )}

          {editorAppModel && (
            <CreateAppModels
              title={formatMessage({ id: 'appPublish.btn.record.list.pages.editAppTemplate' })}
              team_name={currentTeam.team_name}
              appInfo={appModelInfo}
              eid={currentEnterprise.enterprise_id}
              onOk={this.handleEditorAppModel}
              defaultScope="team"
              onCancel={this.hideEditorAppModel}
            />
          )}

          <FooterToolbar>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitLoading}
              onClick={this.handleSubmitConditions}
            >
              {formatMessage({ id: 'button.submit' })}
            </Button>
            <Button
              disabled={loading.effects['application/giveupShare']}
              onClick={this.handleGiveup}
            >
              {formatMessage({ id: 'button.give_up_release' })}
            </Button>
          </FooterToolbar>
        </div>
      </PageHeaderLayout>
    );
  }
}
