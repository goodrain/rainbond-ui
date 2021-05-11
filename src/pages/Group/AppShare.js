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
  Tabs
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import CreateAppModels from '../../components/CreateAppModels';
import FooterToolbar from '../../components/FooterToolbar';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import {
  createApp,
  createEnterprise,
  createTeam
} from '../../utils/breadcrumb';
import cookie from '../../utils/cookie';
import globalUtil from '../../utils/global';
import pluginUtil from '../../utils/plugin';
import BatchEditPublishComponent from './components/BatchEditPublishComponent';
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
            连接信息
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
                          required: true,
                          message: '不能为空'
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
                      生成随机值
                    </Checkbox>
                  )}
                  {getFieldDecorator(
                    `connectIsChange||${item.attr_name}||${ID}`,
                    {
                      valuePropName: 'checked',
                      initialValue: item.is_change
                    }
                  )(
                    <Checkbox
                      onChange={this.handleIsChange.bind(
                        this,
                        `connectIsChange||${item.attr_name}||${ID}`
                      )}
                    >
                      可修改
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
            环境变量
          </h4>
          <Divider />
          <Row>
            {app.service_env_map_list.map(item => {
              const { attr_name, attr_value, is_change } = item;
              return (
                <Col span={8}>
                  <FormItem label={attr_name} style={{ padding: 16 }}>
                    {getFieldDecorator(`env||${attr_name}||${ID}`, {
                      initialValue: attr_value,
                      rules: [
                        {
                          required: false,
                          message: '不能为空'
                        }
                      ]
                    })(<Input />)}
                    {getFieldDecorator(`envIschange||${attr_name}||${ID}`, {
                      valuePropName: 'checked',
                      initialValue: is_change
                    })(
                      <Checkbox
                        onChange={this.handleIsChange.bind(
                          this,
                          `envIschange||${attr_name}||${ID}`
                        )}
                      >
                        可修改
                      </Checkbox>
                    )}
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
            伸缩规则
          </h4>
          <Divider />
          <Row>
            <Col span={6}>
              <FormItem label="最小节点(个)" style={{ padding: 16 }}>
                {getFieldDecorator(`${ID}||min_node`, {
                  initialValue: app.extend_method_map.min_node,
                  rules: [
                    {
                      required: true,
                      message: '输入格式不正确'
                    }
                  ]
                })(
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="请输入最小节点"
                    min={1}
                    step={steps || app.extend_method_map.step_node}
                  />
                )}
              </FormItem>
            </Col>
            <Col span={6}>
              <FormItem label="最大节点(个)" style={{ padding: 16 }}>
                {getFieldDecorator(`${ID}||max_node`, {
                  initialValue: app.extend_method_map.max_node,
                  rules: [
                    {
                      required: true,
                      message: '输入格式不正确'
                    }
                  ]
                })(
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="请输入最大节点"
                    min={1}
                    step={steps || app.extend_method_map.step_node}
                  />
                )}
              </FormItem>
            </Col>
            <Col span={6}>
              <FormItem label="节点步长(个)" style={{ padding: 16 }}>
                {getFieldDecorator(`${ID}||step_node`, {
                  initialValue: app.extend_method_map.step_node,
                  rules: [
                    {
                      required: true,
                      message: '输入格式不正确'
                    }
                  ]
                })(
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="请输入节点步长"
                    min={app.extend_method_map.min_node}
                    max={app.extend_method_map.max_node}
                  />
                )}
              </FormItem>
            </Col>
            <Col span={6}>
              <FormItem label="初始内存(M)" style={{ padding: 16 }}>
                {getFieldDecorator(`${ID}||init_memory`, {
                  initialValue: app.extend_method_map.init_memory || 32,
                  rules: [
                    {
                      required: true,
                      message: '输入格式不正确'
                    }
                  ]
                })(
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="请输入初始内存"
                    min={32}
                    max={app.extend_method_map.max_memory}
                    step={app.extend_method_map.step_memory}
                  />
                )}
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
      allSelect: false
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
            tabk: data.bean.share_service_list[0].service_share_uuid,
            share_service_list: data.bean.share_service_list
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
              title:
                '当前发布版本是Release状态，发布成功后该版本将取消Release状态',
              content: '',
              okText: '确认',
              cancelText: '取消',
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
    const { record, sharearrs, share_service_list } = this.state;
    const newinfo = {};
    form.validateFields((err, values) => {
      if (!err) {
        this.setState({ submitLoading: true });
        const appVersionInfo = {
          share_id: record.record_id,
          app_model_id: values.app_id,
          describe: values.describe,
          version: values.version,
          version_alias: values.version_alias
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
            Object.keys(extend_method_map).forEach(function(key) {
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
          app.props.form.validateFields((err, val) => {
            if (!err) {
              appvalue = val;
            }
          });
          share_service_data.map(option => {
            const ID = option.service_id;
            if (option.service_alias == apptab) {
              // eslint-disable-next-line no-restricted-syntax
              for (const index in appvalue) {
                var indexarr = [];
                indexarr = index.split('||');
                const firstInfo =
                  indexarr && indexarr.length > 0 && indexarr[0];
                if (firstInfo) {
                  const isConnect = firstInfo === 'connect';
                  const isConnectIsChange = firstInfo === 'connectIsChange';
                  const isEnv = firstInfo === 'env';
                  const isEnvIschange = firstInfo === 'envIschange';

                  if (
                    (isConnect && indexarr[2] != 'random') ||
                    isConnectIsChange
                  ) {
                    option.service_connect_info_map_list.map(serapp => {
                      if (
                        isConnectIsChange &&
                        serapp.attr_name === indexarr[1] &&
                        ID === indexarr[2]
                      ) {
                        serapp.is_change = appvalue[index];
                      } else if (
                        isConnect &&
                        indexarr[2] != 'random' &&
                        serapp.attr_name == indexarr[1] &&
                        ID === indexarr[3]
                      ) {
                        serapp[indexarr[2]] = appvalue[index];
                      }
                    });
                  }

                  if (isEnv || isEnvIschange) {
                    option.service_env_map_list.map(serapp => {
                      const { attr_name: attrName } = serapp;
                      if (attrName === indexarr[1] && ID === indexarr[2]) {
                        if (isEnv) {
                          serapp.attr_value = appvalue[index];
                        }
                        if (isEnvIschange) {
                          serapp.is_change = appvalue[index];
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
              dispatch(
                routerRedux.push(
                  `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${appID}/share/${shareId}/two`
                )
              );
            }
          },
          handleError: err => {
            this.setState({ submitLoading: false });
            const data = err && err.data;
            const msg = data && data.msg_show;
            if (data && data.code && data.code === 10501) {
              notification.warning({ message: '提示', description: msg });
              this.setState({ isShare: 'true' });
              return null;
            }
            notification.warning({ message: '请求错误', description: msg });
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
    notification.success({ message: '创建成功' });
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
      version: isCreate ? '0.1' : versionInfo ? versionInfo.version : ''
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
    notification.success({ message: '编辑成功' });
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
      callback('版本不能为空, 请选择或添加版本');
    }
    if (value) {
      if (!/^[0-9]+(\.[0-9]+){1,2}$/.test(value)) {
        callback('只允许输入数字、版本格式:1.0或1.0.0');
        return;
      }
    }
    callback();
  };
  removeComponent = component_share_key => {
    const { share_service_list } = this.state;
    const dep_components = [];
    if (share_service_list.length === 1) {
      message.info('请至少发布一个组件');
      return;
    }
    share_service_list.map(component => {
      component.dep_service_map_list.map(c => {
        if (c.dep_service_key === component_share_key) {
          dep_components.push(c.dep_service_key);
        }
        return c;
      });
      return component;
    });
    if (dep_components.length > 0) {
      const dep_service_name = [];
      share_service_list.map(c => {
        if (dep_components.indexOf(c.service_share_uuid) > -1) {
          dep_service_name.push(c.service_cname);
        }
        return c;
      });
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

  render() {
    const { info, tabk, share_service_list, plugin_list } = this.state;
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
    const { getFieldDecorator, getFieldValue } = form;

    const {
      shareModal,
      sharearrs,
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
      batchEditShow
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
      title: '发布记录列表',
      href: `/team/${currentTeam.team_name}/region/${currentRegionName}/apps/${appDetail.group_id}/publish`
    });
    if (record && record.scope === 'goodrain') {
      breadcrumbList.push({ title: '发布到云应用商店' });
    } else {
      breadcrumbList.push({ title: '发布到组件库' });
    }
    const marketId = record.scope_target && record.scope_target.store_id;
    return (
      <PageHeaderLayout breadcrumbList={breadcrumbList}>
        <div>
          <Card
            style={{
              marginBottom: 24
            }}
            title="应用模版及发布版本设置"
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
                  <Form.Item {...formItemLayout} label="应用模版">
                    {getFieldDecorator('app_id', {
                      initialValue: model.app_id,
                      rules: [
                        {
                          required: true,
                          message: '应用模版选择是必须的'
                        }
                      ]
                    })(
                      <Select
                        style={{ width: 280 }}
                        onChange={this.changeCurrentModel}
                        placeholder="选择发布的应用模版"
                        dropdownRender={menu => (
                          <div>
                            {menu}
                            <Divider style={{ margin: '4px 0' }} />
                            <div
                              style={{
                                padding: '4px 8px',
                                cursor: 'pointer',
                                textAlign: 'center'
                              }}
                              onMouseDown={e => e.preventDefault()}
                              onClick={this.showCreateAppModel}
                            >
                              <Icon type="plus" /> 新建应用模版
                            </div>
                          </div>
                        )}
                      >
                        {models.map(item => (
                          <Option key={item.app_id}>{item.app_name}</Option>
                        ))}
                      </Select>
                    )}
                    {Application && models && models.length > 0 && !marketId && (
                      <a
                        style={{ marginLeft: '10px' }}
                        onClick={() => {
                          this.showEditorAppModel(Application);
                        }}
                      >
                        编辑应用模版
                      </a>
                    )}
                  </Form.Item>
                </Col>
                <Col span="12">
                  <Form.Item {...formItemLayout} label="版本号">
                    {getFieldDecorator('version', {
                      initialValue: (versionInfo && versionInfo.version) || '',
                      rules: [
                        {
                          required: true,
                          validator: this.checkVersion
                        }
                      ]
                    })(
                      <AutoComplete
                        style={{ width: 280 }}
                        onChange={this.changeCurrentVersion}
                        placeholder="版本号默认为选择模版的上次发布版本"
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
                  <Form.Item {...formItemLayout} label="版本别名">
                    {getFieldDecorator('version_alias', {
                      initialValue:
                        (versionInfo && versionInfo.version_alias) || ''
                    })(
                      <Input
                        style={{ width: 280 }}
                        placeholder="设置版本别名，比如高级版"
                      />
                    )}
                  </Form.Item>
                </Col>
                <Col span="12" style={{ height: '104px' }}>
                  <Form.Item {...formItemLayout} label="版本说明">
                    {getFieldDecorator('describe', {
                      initialValue:
                        (versionInfo &&
                          (versionInfo.describe || versionInfo.app_describe)) ||
                        '',
                      rules: [
                        {
                          required: false,
                          message: '请输入版本说明'
                        }
                      ]
                    })(
                      <TextArea
                        placeholder="请输入版本说明"
                        style={{ height: '70px' }}
                      />
                    )}
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </Card>
          <Card
            style={{
              marginBottom: 24
            }}
            title="发布组件模型配置"
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
                    编辑发布组件信息
                  </h4>
                  <Button
                    style={{ float: 'right' }}
                    onClick={() => {
                      this.setState({ batchEditShow: true });
                    }}
                  >
                    批量编辑
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
                    {apps.map(apptit => {
                      return (
                        <TabPane
                          key={apptit.service_share_uuid}
                          tab={
                            <span className={mytabcss.cont}>
                              <a
                                tab={apptit.service_cname}
                                onClick={() => {
                                  this.tabClick(apptit.service_share_uuid);
                                }}
                              >
                                {apptit.service_cname}
                              </a>
                            </span>
                          }
                        />
                      );
                    })}
                  </Tabs>
                  {apps.map(apptit => {
                    const id = apptit.service_share_uuid;
                    return (
                      <div
                        style={{
                          display:
                            sharearrs.includes(tabk) && id === tabk
                              ? 'block'
                              : 'none'
                        }}
                      >
                        <AppInfo
                          key={id}
                          form={form}
                          app={apptit}
                          getref={this.save}
                          tab={apptit.service_alias}
                          ID={apptit.service_id}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
          <Card
            style={{
              marginBottom: 128
            }}
            title="发布插件模型信息"
            bordered={false}
          >
            <Table
              size="middle"
              dataSource={plugins}
              columns={[
                {
                  title: '插件名',
                  dataIndex: 'plugin_alias'
                },
                {
                  title: '分类',
                  dataIndex: 'category',
                  render: v => {
                    return pluginUtil.getCategoryCN(v);
                  }
                },
                {
                  title: '版本',
                  dataIndex: 'build_version'
                }
              ]}
            />
          </Card>

          {shareModal && (
            <Modal
              title="依赖检测"
              visible={shareModal}
              onOk={() => {
                this.removeComponentReal(this.state.del_component_share_key);
                this.onCancels();
              }}
              onCancel={this.onCancels}
              okText="确定"
              cancelText="取消"
            >
              <div>
                该组件被需要发布的
                {this.state.dep_service_name &&
                  this.state.dep_service_name.length > 0 &&
                  this.state.dep_service_name.map((item, index) => {
                    return (
                      <a style={{ marginLeft: '5px' }} key={index}>
                        {item}
                      </a>
                    );
                  })}
                组件依赖, 确认要取消该组件的发布吗？
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
              title="创建应用模版"
              appName={appDetail && appDetail.group_name}
              eid={currentEnterprise.enterprise_id}
              onOk={this.handleCreateAppModel}
              defaultScope="team"
              market_id={marketId}
              onCancel={this.hideCreateAppModel}
            />
          )}

          {editorAppModel && (
            <CreateAppModels
              title="编辑应用模版"
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
              提交
            </Button>
            <Button
              disabled={loading.effects['application/giveupShare']}
              onClick={this.handleGiveup}
            >
              放弃发布
            </Button>
          </FooterToolbar>
        </div>
      </PageHeaderLayout>
    );
  }
}
