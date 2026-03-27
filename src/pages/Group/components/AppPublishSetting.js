import React from 'react';
import {
  AutoComplete,
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  notification,
  Row,
  Select,
  Tag
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { formatMessage } from '@/utils/intl';
import cloud from '../../../utils/cloud';
import { openInNewTab } from '../../../utils/utils';
import globalUtil from '../../../utils/global';
import CreateAppModels from '../../../components/CreateAppModels';
import AppShareBase from './AppShareBase';
import { appShareStateSelector } from './appShareHelpers';
import styles from '../publish.less';

const { TextArea } = Input;
const { Option } = Select;

const verticalFormItemLayout = {
  labelCol: {
    span: 24
  },
  wrapperCol: {
    span: 24
  }
};

@connect(appShareStateSelector)
@Form.create()
class AppPublishSetting extends AppShareBase {
  getInitialState = () => ({
    loadingModels: true,
    models: [],
    versions: [],
    versionInfo: false,
    editorAppModel: false,
    appModelInfo: false,
    showCreateAppModel: false,
    model: {},
    recoders: [],
    page: 1,
    pageSize: 10
  });

  afterFetchRecord = () => {
    this.fetchModels();
    this.fetchPublishRecoder();
  };

  shouldConfirmSubmit = values => {
    const { record, versionInfo } = this.state;
    return (
      record.scope !== 'goodrain' &&
      versionInfo &&
      values.version === versionInfo.version &&
      versionInfo.dev_status
    );
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

    this.setState({ loadingModels: true });
    dispatch({
      type: 'enterprise/fetchShareModels',
      payload: body,
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState(
            {
              models: res.list || [],
              model: res.bean || {},
              loadingModels: false
            },
            () => {
              if (!res.list || res.list.length === 0) {
                return;
              }
              if (isEditor) {
                const info = res.list.filter(item => item.app_id === isEditor.app_id);
                if (info && info.length > 0) {
                  setFieldsValue({
                    describe: info[0].app_describe || ''
                  });
                  this.setState({
                    model: info[0]
                  });
                }
                return;
              }
              if (isCreate) {
                setFieldsValue({
                  app_id: res.list[0].app_id
                });
              }
              if (JSON.stringify(res.bean || {}) === '{}') {
                this.changeCurrentModel(
                  query.preferred_app_id || res.list[0].app_id,
                  query.preferred_version
                );
                return;
              }
              this.changeCurrentModel(
                query.preferred_app_id ||
                  (isCreate ? res.list[0].app_id : res.bean && res.bean.app_id),
                query.preferred_version ||
                  (isCreate ? '' : res.bean && res.bean.version),
                isCreate
              );
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
            recoders: data.list || []
          });
        }
      }
    });
  };

  changeCurrentVersion = version => {
    const { model } = this.state;
    if (model && model.versions && model.versions.length > 0) {
      model.versions.forEach(item => {
        if (version === item.version) {
          this.handleSetFieldsValue(item);
        }
      });
    }
  };

  changeCurrentModel = (modelId, setVersion, isCreate) => {
    const { models } = this.state;
    if (models && models.length > 0) {
      models.forEach(item => {
        const { app_id: appID, versions } = item;
        if (modelId === appID) {
          this.setState({ model: item, versions }, () => {
            if (versions && versions.length > 0) {
              let versionInfo = versions[0];
              if (setVersion) {
                versions.forEach(v => {
                  if (v.version === setVersion) {
                    versionInfo = v;
                  }
                });
              }
              this.handleSetFieldsValue(versionInfo, isCreate);
              return;
            }
            this.handleSetFieldsValue(item, isCreate);
          });
        }
      });
    }
  };

  handleSetFieldsValue = (versionInfo, isCreate) => {
    const { setFieldsValue } = this.props.form;
    this.setState({ versionInfo });
    setFieldsValue({
      version: isCreate ? '0.1' : '',
      version_alias: versionInfo ? versionInfo.version_alias : '',
      describe: versionInfo
        ? versionInfo.describe || versionInfo.app_describe
        : ''
    });
  };

  showCreateAppModel = () => {
    this.setState({ showCreateAppModel: true });
  };

  hideCreateAppModel = () => {
    this.setState({ showCreateAppModel: false });
  };

  handleCreateAppModel = () => {
    notification.success({
      message: formatMessage({ id: 'notification.success.setUp' })
    });
    this.fetchModels(true);
    this.hideCreateAppModel();
  };

  showEditorAppModel = app_id => {
    const { models } = this.state;
    const info = models.filter(item => item.app_id === app_id);
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

  handleEditorAppModel = info => {
    notification.success({
      message: formatMessage({ id: 'notification.success.edit' })
    });
    this.fetchModels(false, info);
    this.hideEditorAppModel();
  };

  handleError = err => {
    if (err && err.data && err.data.code === 404) {
      notification.warning({ message: err.data.msg_show });
      const { appID, teamName, regionName } = this.props.match.params;
      this.props.dispatch(
        routerRedux.replace(
          `/team/${teamName}/region/${regionName}/apps/${appID}/publish`
        )
      );
      return;
    }
    cloud.handleCloudAPIError(err);
  };

  handleModeSubmit = values => {
    const { dispatch } = this.props;
    const { record } = this.state;
    const submissionData = this.collectSubmissionData();
    if (!submissionData) {
      return;
    }
    const {
      selectedShareServices,
      shareServiceData,
      plugin_list,
      share_k8s_resources
    } = submissionData;
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
      appVersionInfo.route_path = values.route_path
        ? `/plugins/${values.route_path}`
        : '';
    }
    if (record.scope === 'goodrain') {
      appVersionInfo.scope_target = record.scope_target;
      appVersionInfo.scope = record.scope;
      appVersionInfo.market_id =
        record.scope_target && record.scope_target.store_id;
      appVersionInfo.template_type = 'RAM';
    }
    const newinfo = {
      app_version_info: appVersionInfo,
      share_service_list: selectedShareServices,
      share_plugin_list: plugin_list,
      share_k8s_resources
    };
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
        if (!data) {
          return;
        }
        if (shareServiceData.length === 0) {
          dispatch({
            type: 'application/completeShare',
            payload: {
              team_name: teamName,
              share_id: shareId,
              appID
            },
            callback: completeData => {
              if (completeData && completeData.app_market_url) {
                openInNewTab(completeData.app_market_url);
              }
              dispatch(
                routerRedux.replace(
                  `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${appID}/version`
                )
              );
            },
            handleError: err => {
              this.handleError(err);
            }
          });
          return;
        }
        dispatch(
          routerRedux.push(
            `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${appID}/share/${shareId}/two?isAppPlugin=${appVersionInfo.is_plugin}`
          )
        );
      },
      handleError: errs => {
        this.setState({ submitLoading: false });
        const data = errs && errs.data;
        const msg = data && data.msg_show;
        if (data && data.code === 10501) {
          notification.warning({
            message: formatMessage({ id: 'confirmModal.component.hint' }),
            description: msg
          });
          return;
        }
        notification.warning({
          message: formatMessage({
            id: 'confirmModal.component.request_Error'
          }),
          description: msg
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
            `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${groupId}/overview`
          )
        );
      }
    });
  };

  renderBasicStage = ({
    Application,
    getFieldDecorator,
    model,
    models,
    recoders,
    versionInfo,
    versions
  }) => (
    <div className={styles.basicStage}>
      <div className={styles.basicTemplateRow}>
        <Form.Item
          {...verticalFormItemLayout}
          label={formatMessage({
            id: 'appPublish.btn.record.list.title.appMode'
          })}
        >
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
              getPopupContainer={triggerNode => triggerNode.parentNode}
              showSearch
              filterOption={(input, option) =>
                option.props.children
                  .toLowerCase()
                  .indexOf(input.toLowerCase()) >= 0
              }
              onChange={this.changeCurrentModel}
              placeholder={formatMessage({
                id: 'placeholder.appShare.selectAppTemplate'
              })}
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
              {formatMessage({
                id: 'appPublish.btn.record.list.label.deitAppTemplate'
              })}
            </Button>
          )}
          <Button onClick={this.showCreateAppModel}>
            {formatMessage({
              id: 'appPublish.btn.record.list.label.newAppTemplate'
            })}
          </Button>
        </div>
      </div>
      <Row gutter={20}>
        <Col xs={24} xl={14}>
          <Form.Item
            {...verticalFormItemLayout}
            label={formatMessage({
              id: 'appPublish.btn.record.list.label.version'
            })}
          >
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
                placeholder={formatMessage({
                  id: 'placeholder.appShare.version'
                })}
              >
                {versions &&
                  versions.length > 0 &&
                  versions.map((item, index) => (
                    <AutoComplete.Option
                      key={`version${index}`}
                      value={item.version}
                    >
                      {item.version}
                    </AutoComplete.Option>
                  ))}
              </AutoComplete>
            )}
          </Form.Item>
        </Col>
        <Col xs={24} xl={10}>
          <Form.Item
            {...verticalFormItemLayout}
            label={formatMessage({
              id: 'appPublish.btn.record.list.label.version_alias'
            })}
          >
            {getFieldDecorator('version_alias', {
              initialValue: (versionInfo && versionInfo.version_alias) || '',
              rules: [
                {
                  max: 64,
                  message: formatMessage({ id: 'placeholder.appShare.max64' })
                }
              ]
            })(
              <Input
                placeholder={formatMessage({
                  id: 'placeholder.appShare.version_alias'
                })}
              />
            )}
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item
            {...verticalFormItemLayout}
            className={styles.fullTextareaItem}
            label={formatMessage({
              id: 'appPublish.btn.record.list.label.describe'
            })}
          >
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
                placeholder={formatMessage({
                  id: 'placeholder.appShare.describe'
                })}
                style={{ minHeight: '104px' }}
              />
            )}
          </Form.Item>
        </Col>
      </Row>
      <div className={styles.basicToggleRow}>
        <div className={styles.checkboxRow}>
          <span>
            {formatMessage({
              id: 'appPublish.btn.record.list.label.is_plugin'
            })}
          </span>
          {getFieldDecorator('is_plugin', {
            initialValue: (versionInfo && versionInfo.is_plugin) || false
          })(
            this.state.plugin_list.length > 0 ? (
              <Checkbox />
            ) : (
              <Checkbox disabled />
            )
          )}
        </div>
        <div className={styles.checkboxRow}>
          <span>
            {formatMessage({
              id: 'appPublish.btn.record.list.label.is_platform_plugin'
            })}
          </span>
          {getFieldDecorator('is_platform_plugin', {
            valuePropName: 'checked',
            initialValue:
              (versionInfo && versionInfo.is_platform_plugin) || false
          })(<Checkbox />)}
        </div>
      </div>
    </div>
  );

  renderComponentsTopSection = ({ apps, getFieldDecorator, pluginChecklist, versionInfo }) => {
    const isPlatformPluginEnabled = this.props.form.getFieldValue(
      'is_platform_plugin'
    );
    if (!isPlatformPluginEnabled) {
      return null;
    }
    return (
      <div className={styles.sectionSubCard}>
        <div className={styles.sectionSubHead}>
          <div>
            <div className={styles.cardTitle}>
              {formatMessage({
                id: 'appPublish.btn.record.list.label.is_platform_plugin'
              })}
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
            <Form.Item
              {...verticalFormItemLayout}
              label={formatMessage({
                id: 'appPublish.btn.record.list.label.plugin_id'
              })}
            >
              {getFieldDecorator('plugin_id', {
                initialValue: (versionInfo && versionInfo.plugin_id) || '',
                rules: [
                  {
                    required: true,
                    message: formatMessage({
                      id: 'appPublish.btn.record.list.label.plugin_id'
                    })
                  }
                ]
              })(<Input placeholder="rainbond-xxx" />)}
            </Form.Item>
          </Col>
          <Col xs={24} xl={12}>
            <Form.Item
              {...verticalFormItemLayout}
              label={formatMessage({
                id: 'appPublish.btn.record.list.label.plugin_name'
              })}
            >
              {getFieldDecorator('plugin_name', {
                initialValue: (versionInfo && versionInfo.plugin_name) || '',
                rules: [
                  {
                    required: true,
                    message: formatMessage({
                      id: 'appPublish.btn.record.list.label.plugin_name'
                    })
                  }
                ]
              })(<Input />)}
            </Form.Item>
          </Col>
          <Col xs={24} xl={12}>
            <Form.Item
              {...verticalFormItemLayout}
              label={formatMessage({
                id: 'appPublish.btn.record.list.label.plugin_type'
              })}
            >
              {getFieldDecorator('plugin_type', {
                initialValue: (versionInfo && versionInfo.plugin_type) || 'Iframe',
                rules: [
                  {
                    required: true,
                    message: formatMessage({
                      id: 'appPublish.btn.record.list.label.plugin_type'
                    })
                  }
                ]
              })(
                <Select style={{ width: '100%' }}>
                  <Option value="JSInject">JSInject</Option>
                  <Option value="Iframe">Iframe</Option>
                </Select>
              )}
            </Form.Item>
          </Col>
          <Col xs={24} xl={12}>
            <Form.Item
              {...verticalFormItemLayout}
              label={formatMessage({
                id: 'appPublish.btn.record.list.label.frontend_component'
              })}
            >
              {getFieldDecorator('frontend_component', {
                initialValue: (versionInfo && versionInfo.frontend_component) || ''
              })(
                <Select
                  style={{ width: '100%' }}
                  allowClear
                  placeholder={formatMessage({
                    id: 'appPublish.btn.record.list.label.frontend_component'
                  })}
                >
                  {apps.map(item => (
                    <Option key={item.service_cname} value={item.service_cname}>
                      {item.service_cname}
                    </Option>
                  ))}
                </Select>
              )}
            </Form.Item>
          </Col>
          <Col xs={24} xl={12}>
            <Form.Item
              {...verticalFormItemLayout}
              label={formatMessage({
                id: 'appPublish.btn.record.list.label.entry_path'
              })}
            >
              {getFieldDecorator('entry_path', {
                initialValue: (versionInfo && versionInfo.entry_path) || '/static/main.js',
                rules: [
                  {
                    required: true,
                    message: formatMessage({
                      id: 'appPublish.btn.record.list.label.entry_path'
                    })
                  }
                ]
              })(<Input placeholder="/static/main.js" />)}
            </Form.Item>
          </Col>
          <Col xs={24} xl={12}>
            <Form.Item
              {...verticalFormItemLayout}
              label={formatMessage({
                id: 'appPublish.btn.record.list.label.inject_position'
              })}
            >
              {getFieldDecorator('inject_position', {
                initialValue: (versionInfo && versionInfo.inject_position) || []
              })(
                <Select
                  style={{ width: '100%' }}
                  mode="multiple"
                  placeholder="请选择注入位置"
                >
                  <Option value="Platform">平台</Option>
                  <Option value="Team">团队</Option>
                  <Option value="Application">应用</Option>
                  <Option value="Component">组件</Option>
                </Select>
              )}
            </Form.Item>
          </Col>
          <Col xs={24} xl={12}>
            <Form.Item
              {...verticalFormItemLayout}
              label={formatMessage({
                id: 'appPublish.btn.record.list.label.menu_title'
              })}
            >
              {getFieldDecorator('menu_title', {
                initialValue: (versionInfo && versionInfo.menu_title) || ''
              })(<Input />)}
            </Form.Item>
          </Col>
          <Col xs={24} xl={12}>
            <Form.Item
              {...verticalFormItemLayout}
              label={formatMessage({
                id: 'appPublish.btn.record.list.label.route_path'
              })}
            >
              {getFieldDecorator('route_path', {
                initialValue: (versionInfo && versionInfo.route_path) || ''
              })(<Input addonBefore="/plugins/" placeholder="my-plugin" />)}
            </Form.Item>
          </Col>
        </Row>
      </div>
    );
  };

  renderModeModals = () => {
    const {
      showCreateAppModel,
      editorAppModel,
      appModelInfo,
      record
    } = this.state;
    const { currentEnterprise, currentTeam } = this.props;
    const { appDetail } = this.state;
    const marketId = record.scope_target && record.scope_target.store_id;
    const marketVersion = record.scope_target && record.scope_target.store_version;
    return (
      <>
        {showCreateAppModel && (
          <CreateAppModels
            title={formatMessage({
              id: 'appPublish.btn.record.list.pages.createAppTemplate'
            })}
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
            title={formatMessage({
              id: 'appPublish.btn.record.list.pages.editAppTemplate'
            })}
            team_name={currentTeam.team_name}
            appInfo={appModelInfo}
            eid={currentEnterprise.enterprise_id}
            onOk={this.handleEditorAppModel}
            defaultScope="team"
            onCancel={this.hideEditorAppModel}
          />
        )}
      </>
    );
  };
}

export default AppPublishSetting;
