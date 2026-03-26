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
  Drawer,
  Progress,
  Tag
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import { createAppVersionSnapshot, getAppVersionOverview } from '../../services/api';
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
import styles from './publish.less';
import pageheaderSvg from '@/utils/pageHeaderSvg';

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

const compactFormItemLayout = {
  labelCol: {
    span: 6
  },
  wrapperCol: {
    span: 18
  }
};

const verticalFormItemLayout = {
  labelCol: {
    span: 24
  },
  wrapperCol: {
    span: 24
  }
};

const token = cookie.get('token');
const myheaders = {};
if (token) {
  myheaders.Authorization = `GRJWT ${token}`;
}

const DEFAULT_SNAPSHOT_VERSION = '0.0.1';

const buildNextSnapshotVersion = latestVersion => {
  if (!latestVersion) {
    return DEFAULT_SNAPSHOT_VERSION;
  }
  const parts = String(latestVersion).split('.');
  if (parts.length !== 3 || parts.some(part => !/^\d+$/.test(part))) {
    return DEFAULT_SNAPSHOT_VERSION;
  }
  const [major, minor, patch] = parts.map(item => Number(item));
  return `${major}.${minor}.${patch + 1}`;
};

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
            marginBottom: 24,
            display: 'none'
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
        <div className={styles.componentSection}>
          <div className={styles.componentSectionHeader}>
            <div>
              <div className={styles.componentSectionTitle}>
                {formatMessage({ id: 'appPublish.shop.pages.title.environment_variable' })}
              </div>
              <div className={styles.componentSectionDesc}>
                发布时会保留这些环境变量，作为模板默认配置供后续安装复用。
              </div>
            </div>
          </div>
          <Row gutter={20}>
            {app.service_env_map_list.map(item => {
              const { attr_name, attr_value } = item;
              return (
                <Col xs={24} md={12} xl={8} key={`${ID}_${attr_name}`}>
                  <FormItem label={attr_name}>
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
        <div className={styles.componentSection}>
          <div className={styles.componentSectionHeader}>
            <div>
              <div className={styles.componentSectionTitle}>
                {formatMessage({ id: 'appPublish.shop.pages.title.flexible' })}
              </div>
              <div className={styles.componentSectionDesc}>
                伸缩规则会作为组件模板的一部分保留下来，建议在发布前完成检查。
              </div>
            </div>
          </div>
          <Row gutter={20}>
            <Col xs={24} md={12} xl={8}>
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
            <Col xs={24} md={12} xl={8}>
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
            <Col xs={24} md={12} xl={8}>
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
            <Col xs={24} md={12} xl={8}>
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
                <div className={styles.formHint}>
                  {formatMessage({ id: 'appPublish.shop.pages.form.quota0.desc' })}
                </div>
              </FormItem>
            </Col>
            <Col xs={24} md={12} xl={8}>
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
                <div className={styles.formHint}>
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
      isPlatformPlugin: false,
      currentPage: 1,
      showDrawerSwitchVal: false,
      k8sContent: '',
      k8sName: "",
      recoders: [],
      snapshotNextVersion: DEFAULT_SNAPSHOT_VERSION,
      activeSection: 'basic',
      visitedSections: {
        basic: true
      },
    };
    this.com = [];
    this.share_group_info = null;
    this.sectionRefs = {};
  }
  componentDidMount() {
    if (this.isSnapshotMode()) {
      this.initSnapshotVersion();
    }
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

  isSnapshotMode = () => {
    const query = (this.props.location && this.props.location.query) || {};
    return query.mode === 'snapshot';
  };

  initSnapshotVersion = () => {
    const query = (this.props.location && this.props.location.query) || {};
    if (query.latest_snapshot_version) {
      this.updateSnapshotNextVersion(buildNextSnapshotVersion(query.latest_snapshot_version));
      return;
    }
    const { teamName, appID } = this.props.match.params;
    getAppVersionOverview({
      team_name: teamName,
      group_id: appID
    })
      .then(res => {
        const overview = (res && res.bean) || {};
        this.updateSnapshotNextVersion(buildNextSnapshotVersion(overview.current_version));
      })
      .catch(() => {
        this.updateSnapshotNextVersion(DEFAULT_SNAPSHOT_VERSION);
      });
  };

  updateSnapshotNextVersion = nextVersion => {
    const { form } = this.props;
    const previousAutoVersion = this.state.snapshotNextVersion || DEFAULT_SNAPSHOT_VERSION;
    this.setState(
      { snapshotNextVersion: nextVersion || DEFAULT_SNAPSHOT_VERSION },
      () => {
        if (!this.state.info) {
          return;
        }
        const currentVersion = form.getFieldValue('version');
        if (!currentVersion || currentVersion === previousAutoVersion) {
          form.setFieldsValue({
            version: this.state.snapshotNextVersion
          });
        }
      }
    );
  };

  setSectionRef = key => node => {
    if (node) {
      this.sectionRefs[key] = node;
    }
  };

  activateSection = key => {
    this.setState(
      prevState => ({
        activeSection: key,
        visitedSections: {
          ...prevState.visitedSections,
          [key]: true
        }
      }),
      () => {
        const target = this.sectionRefs[key];
        if (target && target.scrollIntoView) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    );
  };

  applySnapshotVersionIfNeeded = () => {
    const { form } = this.props;
    const currentVersion = form.getFieldValue('version');
    if (!currentVersion) {
      form.setFieldsValue({
        version: this.state.snapshotNextVersion || DEFAULT_SNAPSHOT_VERSION
      });
    }
  };
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
          }, () => {
            if (this.isSnapshotMode()) {
              this.applySnapshotVersionIfNeeded();
            }
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
    const query = (this.props.location && this.props.location.query) || {};

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
    if (query.preferred_app_id) {
      body.preferred_app_id = query.preferred_app_id;
    }
    if (query.preferred_version) {
      body.preferred_version = query.preferred_version;
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
                  this.changeCurrentModel(query.preferred_app_id || res.list[0].app_id, query.preferred_version);
                } else {
                  this.changeCurrentModel(
                    query.preferred_app_id || (isCreate ? res.list[0].app_id : res.bean && res.bean.app_id),
                    query.preferred_version || (isCreate ? '' : res.bean && res.bean.version),
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
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/index`
            )
          );
        }
      }
    });
  };
  handleSubmitConditions = () => {
    const { record, versionInfo } = this.state;
    const { form } = this.props;
    const isSnapshotMode = this.isSnapshotMode();
    form.validateFieldsAndScroll(
      { scroll: { offsetTop: 80 } },
      (err, values) => {
        if (err) {
          this.activateSection('basic');
          return;
        }
        if (
          !isSnapshotMode &&
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
    );
  };
  handleSubmit = () => {
    const { dispatch, form } = this.props;
    const { record, sharearrs, share_service_list, isAppPlugin, share_k8s_resources } = this.state;
    const isSnapshotMode = this.isSnapshotMode();
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
          is_plugin: values.is_plugin,
          is_platform_plugin: values.is_platform_plugin || false
        };
        if (values.is_platform_plugin) {
          appVersionInfo.plugin_id = values.plugin_id || '';
          appVersionInfo.plugin_name = values.plugin_name || '';
          appVersionInfo.plugin_type = values.plugin_type || '';
          appVersionInfo.frontend_component = values.frontend_component || '';
          appVersionInfo.entry_path = values.entry_path || '';
          appVersionInfo.inject_position = values.inject_position || [];
          appVersionInfo.menu_title = values.menu_title || '';
          appVersionInfo.route_path = values.route_path ? '/plugins/' + values.route_path : '';
        }
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
        let componentFormHasError = false;
        comdata.map(app => {
          const apptab = app.props.tab;
          let appvalue = null;
          app.props.form.validateFields((errs, val) => {
            if (errs) {
              componentFormHasError = true;
              return;
            }
            appvalue = val;
          });
          if (componentFormHasError || !appvalue) {
            return app;
          }
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
          return app;
        });

        if (componentFormHasError) {
          this.setState({ submitLoading: false });
          this.activateSection('components');
          notification.warning({ message: '请先完善组件配置后再提交' });
          return;
        }

        newinfo.app_version_info = appVersionInfo;
        newinfo.share_service_list = arr;
        newinfo.share_plugin_list = this.state.plugin_list;
        newinfo.share_k8s_resources = share_k8s_resources
        const teamName = globalUtil.getCurrTeamName();
        const { appID, shareId } = this.props.match.params;
        if (isSnapshotMode) {
          createAppVersionSnapshot({
            team_name: teamName,
            group_id: appID,
            version: values.version,
            version_alias: values.version_alias,
            app_version_info: values.describe,
            share_service_list: arr,
            share_plugin_list: this.state.plugin_list,
            share_k8s_resources: share_k8s_resources
          }).then(res => {
            this.setState({ submitLoading: false });
            const bean = (res && res.bean) || {};
            if (bean.created === false) {
              notification.warning({
                message: (res && res.msg_show) || '当前没有新的变更，无需创建快照'
              });
              return;
            }
            const finish = () => {
              dispatch(
                routerRedux.replace(
                  `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${appID}/version`
                )
              );
            };
            dispatch({
              type: 'application/giveupShare',
              payload: {
                team_name: teamName,
                share_id: shareId
              },
              callback: finish
            });
            notification.success({
              message: (res && res.msg_show) || '创建快照成功'
            });
          }).catch(errs => {
            this.setState({ submitLoading: false });
            const data = errs && errs.data;
            const msg = (data && data.msg_show) || '创建快照失败';
            notification.warning({ message: msg });
          });
          return;
        }
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
              if (share_service_data.length == 0) {
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
                      routerRedux.replace(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${appID}/version`)
                    );
                  },
                  handleError: err => {
                    this.handleError(err);
                  }
                });
              } else {
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
    const isSnapshotMode = this.isSnapshotMode();

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
            isSnapshotMode
              ? `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${groupId}/version`
              : `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${groupId}/overview`
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
    if (this.com.indexOf(val) === -1) {
      this.com.push(val);
    }
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
    const isSnapshotMode = this.isSnapshotMode();
    this.setState({ versionInfo });
    if (isSnapshotMode) {
      setFieldsValue({
        version: this.state.snapshotNextVersion || DEFAULT_SNAPSHOT_VERSION,
        describe: ''
      });
      return;
    }
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
    const {
      info,
      tabk,
      share_service_list,
      plugin_list,
      share_k8s_resources,
      currentPage,
      k8sContent,
      k8sName,
      activeSection,
      visitedSections
    } = this.state;
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
      snapshotNextVersion,
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
      title: formatMessage({ id: 'appVersion.page.title' }),
      href: `/team/${currentTeam.team_name}/region/${currentRegionName}/apps/${appDetail.group_id}/version`
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
    const snapshotMode = this.isSnapshotMode();
    const currentVersion = getFieldValue('version') || (snapshotMode ? snapshotNextVersion : ((versionInfo && versionInfo.version) || '-'));
    const currentDescription = getFieldValue('describe') || '';
    const isPlatformPluginEnabled = !!getFieldValue('is_platform_plugin');
    const activeApp = apps.find(item => item.service_share_uuid === tabk) || apps[0] || null;
    const publishTargetLabel = record && record.scope === 'goodrain'
      ? formatMessage({ id: 'appPublish.btn.market' })
      : formatMessage({ id: 'appPublish.btn.local' });
    const platformPluginReady = !isPlatformPluginEnabled || (
      !!getFieldValue('plugin_id') &&
      !!getFieldValue('plugin_name') &&
      !!getFieldValue('plugin_type') &&
      !!getFieldValue('entry_path') &&
      ((getFieldValue('inject_position') || []).length > 0)
    );
    const checklistItems = [
      {
        key: 'version',
        label: snapshotMode ? '快照版本已填写' : '版本信息已填写',
        desc: snapshotMode ? '版本号符合快照规范，可以直接固化当前状态。' : '版本号符合发布规范，可以进入后续发布流程。',
        done: !!currentVersion && /^[0-9]+(\.[0-9]+){1,2}$/.test(currentVersion)
      },
      {
        key: 'description',
        label: '版本说明已补充',
        desc: currentDescription ? '已经填写版本说明，后续查看版本时会更容易理解这次变更。' : '建议补充版本说明，方便后续排查和回溯。',
        done: !!String(currentDescription).trim()
      },
      !snapshotMode ? {
        key: 'template',
        label: '应用模板已确认',
        desc: Application ? `当前将基于 ${(model && model.app_name) || '选中模板'} 发布。` : '请选择应用模板，避免发布入口缺少模板上下文。',
        done: !!Application
      } : null,
      {
        key: 'components',
        label: '组件清单已确认',
        desc: apps.length > 0 ? `当前保留 ${apps.length} 个组件参与${snapshotMode ? '快照' : '发布'}。` : '至少需要保留一个组件。',
        done: apps.length > 0
      },
      {
        key: 'plugin',
        label: isPlatformPluginEnabled ? '平台插件配置完整' : '平台插件未启用',
        desc: isPlatformPluginEnabled ? '请确认插件 ID、注入位置与入口路径都已填写。' : '未启用平台插件时，可以跳过这组配置。',
        done: platformPluginReady
      },
      {
        key: 'resources',
        label: '资源清单已生成',
        desc: count > 0 ? `本次共包含 ${count} 个资源，可在提交前做最终核对。` : '当前没有识别到资源内容，建议确认分享记录是否完整。',
        done: count > 0
      }
    ].filter(item => item);
    const requiredChecklistItems = checklistItems.filter(item => item.key !== 'resources');
    const completedCount = requiredChecklistItems.filter(item => item.done).length;
    const completionPercent = requiredChecklistItems.length > 0
      ? Math.round((completedCount / requiredChecklistItems.length) * 100)
      : 0;
    const selectedModel = models.find(item => item.app_id === Application) || model;
    const selectedModelName = (selectedModel && selectedModel.app_name) || '-';
    const componentChecklist = checklistItems.find(item => item.key === 'components') || { done: false };
    const pluginChecklist = checklistItems.find(item => item.key === 'plugin') || { done: true };
    const basicChecklistKeys = snapshotMode
      ? ['version', 'description']
      : ['template', 'version', 'description'];
    const basicStepDone = checklistItems
      .filter(item => basicChecklistKeys.indexOf(item.key) > -1)
      .every(item => item.done);
    const componentStepDone = componentChecklist.done && pluginChecklist.done;
    const basicSummary = snapshotMode
      ? `版本 ${currentVersion || '-'}${currentDescription ? ' · 已填写说明' : ' · 待补充说明'}`
      : `${Application ? `模板 ${selectedModelName}` : '待选模板'} · 版本 ${currentVersion || '-'}`;
    const componentSummary = apps.length > 0
      ? `${apps.length} 个组件${activeApp ? ` · 当前 ${activeApp.service_cname || activeApp.service_alias || '-'}` : ''}`
      : '至少保留 1 个组件';
    const resourceSummary = count > 0 ? `${count} 个资源待确认` : '还没有生成资源清单';
    const resourceStepStatusLabel = activeSection === 'resources'
      ? '查看中'
      : count > 0
        ? '可确认'
        : '可跳过';
    const resourceStepStatusColor = activeSection === 'resources'
      ? 'blue'
      : count > 0
        ? 'cyan'
        : null;
    const stepItems = [
      {
        key: 'basic',
        index: 1,
        title: snapshotMode ? '快照信息' : '版本与模板',
        navDesc: snapshotMode ? '先固化版本，再继续校对内容' : '先确认模板和版本，再继续整理清单',
        desc: snapshotMode
          ? '先确认快照版本和版本说明，再把当前应用状态固化为一个可追溯的版本。'
          : '优先填写模板、版本号和说明，首屏只保留这组最关键的输入。',
        summary: basicSummary,
        done: basicStepDone
      },
      {
        key: 'components',
        index: 2,
        title: '组件与插件',
        navDesc: '逐个核对组件参数和关联插件',
        desc: snapshotMode
          ? '组件配置会随快照一起保存，回滚时会按这里的参数恢复。'
          : '在这里精简组件、校对环境变量，并补全平台插件配置。',
        summary: componentSummary,
        done: componentStepDone
      },
      {
        key: 'resources',
        index: 3,
        title: '资源确认',
        navDesc: '最后核对将随模板保留的资源',
        desc: '这里会列出将随模板或快照一起保留的资源，方便你在提交前做最终检查。',
        summary: resourceSummary,
        done: false,
        optional: true,
        statusLabel: resourceStepStatusLabel
      }
    ];
    const currentStep = stepItems.find(item => item.key === activeSection) || stepItems[0];
    const nextPendingItem = requiredChecklistItems.find(item => !item.done);
    const introMetaItems = [
      {
        label: '应用',
        value: appDetail.group_name || '-'
      },
      !snapshotMode ? {
        label: '模板',
        value: Application ? selectedModelName : '待选择'
      } : null,
      {
        label: snapshotMode ? '快照版本' : '当前版本',
        value: currentVersion || '-'
      },
      {
        label: '组件 / 插件',
        value: `${apps.length} / ${plugins.length}`
      }
    ].filter(item => item);
    const activeComponentMeta = activeApp
      ? `当前组件 ${activeApp.service_cname || activeApp.service_alias || '-'}，环境变量 ${(activeApp.service_env_map_list || []).length} 项，连接信息 ${(activeApp.service_connect_info_map_list || []).length} 项，${activeApp.extend_method_map ? '已配置伸缩规则' : '未配置伸缩规则'}`
      : '';
    const basicMetaItems = [
      {
        label: '应用名称',
        value: appDetail.group_name || '-'
      },
      {
        label: snapshotMode ? '建议版本' : '发布范围',
        value: snapshotMode ? (snapshotNextVersion || '-') : publishTargetLabel
      },
      {
        label: '组件 / 资源 / 插件',
        value: `${apps.length} / ${count} / ${plugins.length}`
      },
      {
        label: '当前焦点组件',
        value: (activeApp && (activeApp.service_cname || activeApp.service_alias)) || '-'
      }
    ];
    const summaryItems = [
      {
        label: '应用名称',
        value: appDetail.group_name || '-'
      },
      !snapshotMode ? {
        label: '应用模板',
        value: Application ? selectedModelName : '待选择'
      } : null,
      {
        label: snapshotMode ? '快照版本' : '当前版本',
        value: currentVersion || '-'
      },
      {
        label: snapshotMode ? '建议版本' : '发布范围',
        value: snapshotMode ? (snapshotNextVersion || '-') : publishTargetLabel
      },
      {
        label: '组件 / 插件',
        value: `${apps.length} / ${plugins.length}`
      }
    ].filter(item => item);
    return (
      <PageHeaderLayout
        title={snapshotMode ? '创建快照' : '发布应用'}
        content={snapshotMode ? '创建快照是指将当前应用的状态固化为一个版本，用于后续回滚或发布。' : '发布应用是指将当前运行的应用进行模型化，形成应用模版发布到当前平台的组件库或开源应用商店，供当前平台或开源应用商店的用户使用。'}
        titleSvg={pageheaderSvg.getPageHeaderSvg('publish', 18)}
      >
        <div className={styles.publishPage}>
          <div className={styles.publishIntro}>
            <div className={styles.publishIntroMain}>
              <div className={styles.publishHeroTags}>
                <Tag color="blue">{snapshotMode ? '快照模式' : '发布模式'}</Tag>
                <Tag>{publishTargetLabel}</Tag>
                {plugins.length > 0 && <Tag color="cyan">{`关联插件 ${plugins.length}`}</Tag>}
                {!snapshotMode && recoders.length > 0 && <Tag color="blue">{`历史版本 ${recoders.length}`}</Tag>}
                <Tag color={completionPercent === 100 ? 'green' : 'orange'}>{`准备度 ${completionPercent}%`}</Tag>
              </div>
              <h2 className={styles.publishIntroTitle}>
                {snapshotMode ? '先定义快照版本，再固化当前运行状态' : '先确定版本模板，再完成发布清单整理'}
              </h2>
              <p className={styles.publishIntroDesc}>
                {snapshotMode
                  ? '当前页面会把版本信息、组件配置和资源清单一起固化为快照，方便后续回滚和再次发布。'
                  : '当前页面会整理模板、版本、组件与插件信息，确保进入后续发布流程时结构清晰、信息完整。'}
              </p>
              <div className={styles.publishIntroMeta}>
                {introMetaItems.map(item => (
                  <div className={styles.publishIntroMetaItem} key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.publishLayout}>
            <div className={styles.publishMain}>
              <div className={styles.stepNav}>
                {stepItems.map(item => (
                  <button
                    key={item.key}
                    type="button"
                    className={`${styles.stepNavItem} ${activeSection === item.key ? styles.stepNavItemActive : ''} ${item.done ? styles.stepNavItemDone : ''}`}
                    onClick={() => this.activateSection(item.key)}
                  >
                    <span className={styles.stepNavIndex}>{item.index}</span>
                    <span className={styles.stepNavContent}>
                      <span className={styles.stepNavTitle}>{item.title}</span>
                      <span className={styles.stepNavDesc}>{item.navDesc}</span>
                    </span>
                    <span className={`${styles.stepNavState} ${item.optional ? styles.stepNavStateOptional : item.done ? styles.stepNavStateDone : ''}`}>
                      {item.optional ? item.statusLabel : item.done ? '已完成' : activeSection === item.key ? '填写中' : '待处理'}
                    </span>
                  </button>
                ))}
              </div>
              <div
                className={`${styles.stepSection} ${activeSection === 'basic' ? styles.stepSectionActive : ''}`}
                ref={this.setSectionRef('basic')}
              >
                <button
                  type="button"
                  className={styles.stepSectionHeader}
                  onClick={() => this.activateSection('basic')}
                >
                  <div className={styles.stepSectionHeadMain}>
                    <span className={styles.stepSectionIndex}>1</span>
                    <div className={styles.stepSectionText}>
                      <div className={styles.stepSectionTitleRow}>
                        <div className={styles.stepSectionTitle}>{stepItems[0].title}</div>
                        <Tag color={basicStepDone ? 'green' : activeSection === 'basic' ? 'blue' : 'orange'}>
                          {basicStepDone ? '已完成' : activeSection === 'basic' ? '填写中' : '待处理'}
                        </Tag>
                      </div>
                      <div className={styles.stepSectionDesc}>{stepItems[0].desc}</div>
                    </div>
                  </div>
                  <div className={styles.stepSectionSummary}>
                    <span className={styles.stepSectionSummaryText}>{stepItems[0].summary}</span>
                    <Icon type={activeSection === 'basic' ? 'up' : 'down'} />
                  </div>
                </button>
                {visitedSections.basic && (
                  <div className={`${styles.stepSectionBody} ${activeSection !== 'basic' ? styles.stepSectionBodyHidden : ''}`}>
                    <div className={styles.publishCardBody}>
                      <div className={styles.basicStage}>
                        {!snapshotMode && (
                          <div className={styles.basicTemplateRow}>
                            <Form.Item {...verticalFormItemLayout} label={formatMessage({ id: 'appPublish.btn.record.list.title.appMode' })}>
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
                                  style={{ width: '100%' }}
                                  getPopupContainer={triggerNode =>
                                    triggerNode.parentNode
                                  }
                                  showSearch
                                  filterOption={(input, option) =>
                                    option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                  }
                                  onChange={this.changeCurrentModel}
                                  placeholder={formatMessage({ id: 'placeholder.appShare.selectAppTemplate' })}
                                >
                                  {models.map(item => (
                                    <Option key={item.app_id}>{item.app_name}</Option>
                                  ))}
                                </Select>
                              )}
                            </Form.Item>
                            <div className={styles.templateActions}>
                              {Application && recoders.length > 1 && (
                                <Button
                                  onClick={() => {
                                    this.showEditorAppModel(Application);
                                  }}
                                >
                                  {formatMessage({ id: 'appPublish.btn.record.list.label.deitAppTemplate' })}
                                </Button>
                              )}
                              <Button onClick={this.showCreateAppModel}>
                                {formatMessage({ id: 'appPublish.btn.record.list.label.newAppTemplate' })}
                              </Button>
                            </div>
                          </div>
                        )}
                        <Row gutter={20}>
                          <Col xs={24} xl={14}>
                            <Form.Item {...verticalFormItemLayout} label={formatMessage({ id: 'appPublish.btn.record.list.label.version' })}>
                              {getFieldDecorator('version', {
                                initialValue: snapshotMode ? snapshotNextVersion : '',
                                rules: [
                                  {
                                    required: true,
                                    validator: this.checkVersion
                                  }
                                ]
                              })(
                                snapshotMode ? (
                                  <Input
                                    style={{ width: '100%' }}
                                    placeholder={formatMessage({ id: 'placeholder.appShare.version' })}
                                  />
                                ) : (
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
                                )
                              )}
                            </Form.Item>
                          </Col>
                          {!snapshotMode && (
                            <Col xs={24} xl={10}>
                              <Form.Item {...verticalFormItemLayout} label={formatMessage({ id: 'appPublish.btn.record.list.label.version_alias' })}>
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
                                  <Input placeholder={formatMessage({ id: 'placeholder.appShare.version_alias' })} />
                                )}
                              </Form.Item>
                            </Col>
                          )}
                          <Col xs={24}>
                            <Form.Item
                              {...verticalFormItemLayout}
                              className={styles.fullTextareaItem}
                              label={formatMessage({ id: 'appPublish.btn.record.list.label.describe' })}
                            >
                              {getFieldDecorator('describe', {
                                initialValue:
                                  (!snapshotMode &&
                                    versionInfo &&
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
                                  style={{ minHeight: '104px' }}
                                />
                              )}
                            </Form.Item>
                          </Col>
                        </Row>
                        {!snapshotMode && (
                          <div className={styles.basicToggleRow}>
                            <div className={styles.checkboxRow}>
                              <span>{formatMessage({ id: 'appPublish.btn.record.list.label.is_plugin' })}</span>
                              {getFieldDecorator('is_plugin', {
                                initialValue: (versionInfo && versionInfo.is_plugin) || false
                              })(
                                plugins.length > 0 ? (
                                  <Checkbox />
                                ) : (
                                  <Checkbox disabled />
                                )
                              )}
                            </div>
                            <div className={styles.checkboxRow}>
                              <span>{formatMessage({ id: 'appPublish.btn.record.list.label.is_platform_plugin' })}</span>
                              {getFieldDecorator('is_platform_plugin', {
                                valuePropName: 'checked',
                                initialValue: (versionInfo && versionInfo.is_platform_plugin) || false
                              })(
                                <Checkbox onChange={(e) => { this.setState({ isPlatformPlugin: e.target.checked }); }} />
                              )}
                            </div>
                          </div>
                        )}
                        <div className={styles.basicMetaStrip}>
                          {basicMetaItems.map(item => (
                            <div className={styles.basicMetaStripItem} key={item.label}>
                              <span className={styles.metaLabel}>{item.label}</span>
                              <strong className={styles.basicMetaValue}>{item.value}</strong>
                            </div>
                          ))}
                        </div>
                      <div className={styles.archBlock}>
                        <div className={styles.metaLabel}>{formatMessage({ id: 'enterpriseColony.mgt.node.framework' })}</div>
                        <div className={styles.archTags}>
                          {appDetail.app_arch && appDetail.app_arch.length > 0 ? (
                            appDetail.app_arch.map(item => (
                              <Tag key={item}>{item}</Tag>
                            ))
                          ) : (
                            <span className={styles.emptyText}>暂未识别</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>
                )}
              </div>

              <div
                className={`${styles.stepSection} ${activeSection === 'components' ? styles.stepSectionActive : ''}`}
                ref={this.setSectionRef('components')}
              >
                <button
                  type="button"
                  className={styles.stepSectionHeader}
                  onClick={() => this.activateSection('components')}
                >
                  <div className={styles.stepSectionHeadMain}>
                    <span className={styles.stepSectionIndex}>2</span>
                    <div className={styles.stepSectionText}>
                      <div className={styles.stepSectionTitleRow}>
                        <div className={styles.stepSectionTitle}>{stepItems[1].title}</div>
                        <Tag color={componentStepDone ? 'green' : activeSection === 'components' ? 'blue' : 'orange'}>
                          {componentStepDone ? '已完成' : activeSection === 'components' ? '填写中' : '待处理'}
                        </Tag>
                      </div>
                      <div className={styles.stepSectionDesc}>{stepItems[1].desc}</div>
                    </div>
                  </div>
                  <div className={styles.stepSectionSummary}>
                    <span className={styles.stepSectionSummaryText}>{stepItems[1].summary}</span>
                    <Icon type={activeSection === 'components' ? 'up' : 'down'} />
                  </div>
                </button>
                {visitedSections.components && (
                  <div className={`${styles.stepSectionBody} ${activeSection !== 'components' ? styles.stepSectionBodyHidden : ''}`}>
                    <div className={styles.publishCardBody}>
                      {getFieldValue('is_platform_plugin') && (
                        <div className={styles.sectionSubCard}>
                          <div className={styles.sectionSubHead}>
                            <div>
                              <div className={styles.cardTitle}>
                                {formatMessage({ id: 'appPublish.btn.record.list.label.is_platform_plugin' })}
                              </div>
                              <div className={styles.cardDesc}>
                                平台插件需要补全注入位置和入口配置，确保发布后能被宿主正常加载。
                              </div>
                            </div>
                            <Tag color={pluginChecklist.done ? 'green' : 'orange'}>
                              {pluginChecklist.done ? '配置完整' : '待补充'}
                            </Tag>
                          </div>
                          <Row gutter={20}>
                            <Col xs={24} xl={12}>
                              <Form.Item {...verticalFormItemLayout} label={formatMessage({ id: 'appPublish.btn.record.list.label.plugin_id' })}>
                                {getFieldDecorator('plugin_id', {
                                  initialValue: (versionInfo && versionInfo.plugin_id) || '',
                                  rules: [{ required: true, message: formatMessage({ id: 'appPublish.btn.record.list.label.plugin_id' }) }]
                                })(<Input placeholder="rainbond-xxx" />)}
                              </Form.Item>
                            </Col>
                            <Col xs={24} xl={12}>
                              <Form.Item {...verticalFormItemLayout} label={formatMessage({ id: 'appPublish.btn.record.list.label.plugin_name' })}>
                                {getFieldDecorator('plugin_name', {
                                  initialValue: (versionInfo && versionInfo.plugin_name) || '',
                                  rules: [{ required: true, message: formatMessage({ id: 'appPublish.btn.record.list.label.plugin_name' }) }]
                                })(<Input />)}
                              </Form.Item>
                            </Col>
                            <Col xs={24} xl={12}>
                              <Form.Item {...verticalFormItemLayout} label={formatMessage({ id: 'appPublish.btn.record.list.label.plugin_type' })}>
                                {getFieldDecorator('plugin_type', {
                                  initialValue: (versionInfo && versionInfo.plugin_type) || 'Iframe',
                                  rules: [{ required: true, message: formatMessage({ id: 'appPublish.btn.record.list.label.plugin_type' }) }]
                                })(
                                  <Select style={{ width: '100%' }}>
                                    <Option value="JSInject">JSInject</Option>
                                    <Option value="Iframe">Iframe</Option>
                                  </Select>
                                )}
                              </Form.Item>
                            </Col>
                            <Col xs={24} xl={12}>
                              <Form.Item {...verticalFormItemLayout} label={formatMessage({ id: 'appPublish.btn.record.list.label.frontend_component' })}>
                                {getFieldDecorator('frontend_component', {
                                  initialValue: (versionInfo && versionInfo.frontend_component) || ''
                                })(
                                  <Select style={{ width: '100%' }} allowClear placeholder={formatMessage({ id: 'appPublish.btn.record.list.label.frontend_component' })}>
                                    {apps.map(item => (
                                      <Option key={item.service_cname} value={item.service_cname}>{item.service_cname}</Option>
                                    ))}
                                  </Select>
                                )}
                              </Form.Item>
                            </Col>
                            <Col xs={24} xl={12}>
                              <Form.Item {...verticalFormItemLayout} label={formatMessage({ id: 'appPublish.btn.record.list.label.entry_path' })}>
                                {getFieldDecorator('entry_path', {
                                  initialValue: (versionInfo && versionInfo.entry_path) || '/static/main.js',
                                  rules: [{ required: true, message: formatMessage({ id: 'appPublish.btn.record.list.label.entry_path' }) }]
                                })(<Input placeholder="/static/main.js" />)}
                              </Form.Item>
                            </Col>
                            <Col xs={24} xl={12}>
                              <Form.Item {...verticalFormItemLayout} label={formatMessage({ id: 'appPublish.btn.record.list.label.inject_position' })}>
                                {getFieldDecorator('inject_position', {
                                  initialValue: (versionInfo && versionInfo.inject_position) || []
                                })(
                                  <Select style={{ width: '100%' }} mode="multiple" placeholder="请选择注入位置">
                                    <Option value="Platform">平台</Option>
                                    <Option value="Team">团队</Option>
                                    <Option value="Application">应用</Option>
                                    <Option value="Component">组件</Option>
                                  </Select>
                                )}
                              </Form.Item>
                            </Col>
                            <Col xs={24} xl={12}>
                              <Form.Item {...verticalFormItemLayout} label={formatMessage({ id: 'appPublish.btn.record.list.label.menu_title' })}>
                                {getFieldDecorator('menu_title', {
                                  initialValue: (versionInfo && versionInfo.menu_title) || ''
                                })(<Input />)}
                              </Form.Item>
                            </Col>
                            <Col xs={24} xl={12}>
                              <Form.Item {...verticalFormItemLayout} label={formatMessage({ id: 'appPublish.btn.record.list.label.route_path' })}>
                                {getFieldDecorator('route_path', {
                                  initialValue: (versionInfo && versionInfo.route_path) || ''
                                })(<Input addonBefore="/plugins/" placeholder="my-plugin" />)}
                              </Form.Item>
                            </Col>
                          </Row>
                        </div>
                      )}
                      {apps && apps.length > 0 ? (
                        <Fragment>
                          <div className={styles.componentToolbar}>
                            <div>
                              <h4 className={`${mytabcss.required} ${styles.componentToolbarTitle}`}>
                                {formatMessage({ id: 'appPublish.btn.record.list.title.edit_publish_componentMsg' })}
                              </h4>
                              <div className={styles.componentToolbarDesc}>
                                标签页按组件拆分，适合逐个核对环境变量、连接信息和伸缩规则。
                              </div>
                              {activeComponentMeta && (
                                <div className={styles.componentToolbarMeta}>
                                  {activeComponentMeta}
                                </div>
                              )}
                            </div>
                            <Button
                              onClick={() => {
                                this.setState({ batchEditShow: true });
                              }}
                            >
                              {formatMessage({ id: 'appPublish.btn.record.list.title.bulk_edit' })}
                            </Button>
                          </div>
                          <div className={styles.tabsShell}>
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
                                  const id = apptit.service_share_uuid;
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
                        </Fragment>
                      ) : (
                        <div className={styles.sectionEmpty}>
                          当前没有可发布的组件，请至少保留一个组件后再继续。
                        </div>
                      )}
                      {plugins && plugins.length > 0 && (
                        <div className={styles.sectionSubCard}>
                          <div className={styles.sectionSubHead}>
                            <div>
                              <div className={styles.cardTitle}>
                                {formatMessage({ id: 'appPublish.btn.record.list.title.publish_pluginMsg' })}
                              </div>
                              <div className={styles.cardDesc}>
                                当前选中组件关联到的插件会在这里统一展示，便于发布前快速核对。
                              </div>
                            </div>
                            <Tag color="cyan">{`${plugins.length} 个插件`}</Tag>
                          </div>
                          <Table
                            size="middle"
                            rowKey={(records, index) => index}
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
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div
                className={`${styles.stepSection} ${styles.stepSectionLast} ${activeSection === 'resources' ? styles.stepSectionActive : ''}`}
                ref={this.setSectionRef('resources')}
              >
                <button
                  type="button"
                  className={styles.stepSectionHeader}
                  onClick={() => this.activateSection('resources')}
                >
                  <div className={styles.stepSectionHeadMain}>
                    <span className={styles.stepSectionIndex}>3</span>
                    <div className={styles.stepSectionText}>
                      <div className={styles.stepSectionTitleRow}>
                        <div className={styles.stepSectionTitle}>{stepItems[2].title}</div>
                        <Tag color={resourceStepStatusColor || undefined}>
                          {resourceStepStatusLabel}
                        </Tag>
                      </div>
                      <div className={styles.stepSectionDesc}>{stepItems[2].desc}</div>
                    </div>
                  </div>
                  <div className={styles.stepSectionSummary}>
                    <span className={styles.stepSectionSummaryText}>{stepItems[2].summary}</span>
                    <Icon type={activeSection === 'resources' ? 'up' : 'down'} />
                  </div>
                </button>
                {visitedSections.resources && (
                  <div className={`${styles.stepSectionBody} ${activeSection !== 'resources' ? styles.stepSectionBodyHidden : ''}`}>
                    <div className={styles.publishCardBody}>
                      {count > 0 ? (
                        <Table
                          size="middle"
                          rowKey={(records, index) => index}
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
                              key: 'content',
                              align: 'center',
                              render: (text, item) => {
                                return (
                                  <Button onClick={() => this.showDrawer(text, item)}>
                                    {formatMessage({ id: 'appPublish.btn.record.list.table.view_details' })}
                                  </Button>
                                );
                              }
                            },
                          ]}
                          pagination={pagination}
                        />
                      ) : (
                        <div className={styles.sectionEmpty}>
                          当前还没有可确认的资源内容，建议先检查分享记录是否完整。
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.publishSide}>
              <div className={styles.publishSideInner}>
                <Card className={styles.sideCard} bodyStyle={{ padding: 18 }}>
                  <div className={styles.sideTitle}>{snapshotMode ? '快照摘要' : '发布摘要'}</div>
                  <div className={styles.sideDesc}>
                    {`${currentStep.index}/3 · ${currentStep.title}`}
                  </div>
                  <div className={styles.checklistHead}>
                    <div>
                      <div className={styles.heroProgressTitle}>提交前准备度</div>
                      <div className={styles.checklistMeta}>{`${completedCount}/${requiredChecklistItems.length} 项已完成`}</div>
                    </div>
                    <div className={styles.checklistPercent}>{`${completionPercent}%`}</div>
                  </div>
                  <Progress percent={completionPercent} showInfo={false} strokeWidth={8} />
                  <div className={styles.summaryList}>
                    {summaryItems.map(item => (
                      <div className={styles.summaryItem} key={item.label}>
                        <div className={styles.summaryLabel}>{item.label}</div>
                        <div className={styles.summaryValue}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className={styles.sideDivider} />
                  <div className={styles.sideTitle}>校验清单</div>
                  <div className={styles.checklistList}>
                    {requiredChecklistItems.map(item => (
                      <div
                        key={item.key}
                        className={`${styles.checklistItem} ${item.done ? styles.checklistItemDone : styles.checklistItemTodo}`}
                      >
                        <Icon className={styles.checklistIcon} type={item.done ? 'check-circle' : 'clock-circle'} />
                        <div className={styles.checklistBody}>
                          <div className={styles.checklistLabel}>{item.label}</div>
                          <div className={styles.checklistDesc}>{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {nextPendingItem && (
                    <ul className={styles.sideTips}>
                      <li>{`建议优先完成：${nextPendingItem.label}`}</li>
                      <li>{nextPendingItem.desc}</li>
                    </ul>
                  )}
                </Card>
              </div>
            </div>
          </div>
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
              {formatMessage({
                id: snapshotMode ? 'button.cancel_snapshot' : 'button.give_up_release'
              })}
            </Button>
          </FooterToolbar>
        </div>
      </PageHeaderLayout>
    );
  }
}
