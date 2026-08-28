/* eslint-disable camelcase */
import { Button, Card, Col, Form, Icon, notification, Row, Table } from 'antd';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import AddOrEditConfig from '../../components/AddOrEditConfig';
import BuildPluginVersion from '../../components/buildPluginVersion';
import ConfirmModal from '../../components/ConfirmModal';
import CreatePluginForm from '../../components/CreatePluginForm';
import EditStorageConfig from '../../components/EditStorageConfig';
import ScrollerX from '../../components/ScrollerX';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import { createEnterprise, createTeam } from '../../utils/breadcrumb';
import globalUtil from '../../utils/global';
import pluginUtil from '../../utils/plugin';
import handleAPIError from '../../utils/error';
import styles from './Index.less';

const {
  buildStorageDeletePayload,
  buildStorageSavePayload,
  partitionPluginVersionConfig,
  toStorageEditorData
} = require('./manageStorageHelpers');

const ButtonGroup = Button.Group;

@Form.create()
@connect(({ teamControl, enterprise, loading }) => ({
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  addConfigLoading: loading.effects['plugin/addPluginVersionConfig'],
  editConfigLoading: loading.effects['plugin/editPluginVersionConfig'],
  removeConfigLoading: loading.effects['plugin/removePluginVersionConfig']
}))
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      currInfo: null,
      currVersion: '',
      config: [],
      showAddConfig: false,
      showEditConfig: null,
      showDeleteVersion: false,
      showBuildLog: false,
      configVisible: false,
      event_id: '',
      apps: [],
      page: 1,
      page_size: 6,
      total: 0,
      storgeListData: [],
      configFileListData: [],
      persistentStorageListData: [],
      volumeOpts: [],
      showStorageConfig: false,
      storageConfigType: 'storage',
      editStoragData: {},
      isEditor: false,
      configStorageVisible: false,
      removeStorageLoading: false,
      listData: []
    };
    this.mount = false;
  }
  componentDidMount() {
    this.mount = true;
    this.getVersions();
    this.getUsedApp();
    this.getShareRecord();
    this.getPluginVolumeOpts();
  }

  componentWillUnmount() {
    this.mount = false;
  }
  // 分页切换
  onPageChange = page => {
    this.setState({ page }, () => {
      this.getUsedApp();
    });
  };
  // 获取插件可用的持久化存储类型
  getPluginVolumeOpts = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'plugin/getPluginVolumeOpts',
      payload: {
        team_name: globalUtil.getCurrTeamName()
      },
      callback: data => {
        if (data) {
          this.setState({
            volumeOpts: (data.list || []).filter(
              item => item.volume_type !== 'memoryfs'
            )
          });
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };
  // 获取分享记录
  getShareRecord = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'plugin/getShareRecord',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        plugin_id: this.getId()
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };
  // 获取使用该插件的组件
  getUsedApp = () => {
    const { dispatch } = this.props;
    const { page, page_size } = this.state;
    dispatch({
      type: 'plugin/getUsedApp',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        plugin_id: this.getId(),
        page,
        page_size
      },
      callback: data => {
        if (data) {
          this.setState({
            apps: data.list || [],
            total: data.total
          });
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };
  // 获取插件版本列表
  getVersions = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'plugin/getPluginVersions',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        plugin_id: this.getId()
      },
      callback: data => {
        if (data) {
          if (!this.state.currVersion && data.list.length) {
            this.setState(
              {
                currVersion: data.list[0].build_version
              },
              () => {
                this.getPluginVersionInfo();
                this.getPluginVersionConfig();
              }
            );
          }
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };
  // 获取插件版本详情
  getPluginVersionInfo = () => {
    if (!this.mount) return;
    const { dispatch } = this.props;
    const { currVersion } = this.state;
    dispatch({
      type: 'plugin/getPluginVersionInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        plugin_id: this.getId(),
        build_version: currVersion
      },
      callback: data => {
        if (data) {
          this.setState({ currInfo: data.bean });
          setTimeout(() => {
            this.getPluginVersionInfo();
          }, 5000);
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };
  // 获取配置组合存储管理
  getPluginVersionConfig = () => {
    const { dispatch } = this.props;
    const { currVersion } = this.state;
    dispatch({
      type: 'plugin/getPluginVersionConfig',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        plugin_id: this.getId(),
        build_version: currVersion
      },
      callback: data => {
        const {
          config,
          storageListData,
          configFileListData,
          persistentStorageListData,
          listData
        } = partitionPluginVersionConfig(data && data.list);
        this.setState({
          config,
          storgeListData: storageListData,
          configFileListData,
          persistentStorageListData,
          listData
        });
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };

  // 获取插件ID
  getId = () => {
    return this.props.match.params.pluginId;
  };

  // 版本切换
  handleVersionChange = val => {
    const { key } = val;
    if (key === this.state.currVersion) return;
    this.setState(
      {
        currVersion: key
      },
      () => {
        this.getPluginVersionInfo();
        this.getPluginVersionConfig();
      }
    );
  };

  // 显示添加配置弹窗
  showAddConfig = () => {
    this.setState({ showAddConfig: true });
  };

  // 隐藏添加配置弹窗
  hiddenAddConfig = () => {
    this.setState({ showAddConfig: false });
  };

  // 打开删除配置确认弹窗
  handleOpenDelConfigVisible = data => {
    this.setState({ configVisible: data });
  };

  // 关闭删除配置确认弹窗
  handleCloseDelConfigVisible = () => {
    this.setState({ configVisible: false });
  };

  // 编辑插件版本信息
  handleEditSubmit = values => {
    const { dispatch } = this.props;
    const { currVersion } = this.state;
    dispatch({
      type: 'plugin/editPluginVersionInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        plugin_id: this.getId(),
        build_version: currVersion,
        ...values
      },
      callback: () => {
        notification.success({ message: formatMessage({id:'notification.success.change'}) });
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };
  // 删除配置项
  handleDelConfig = () => {
    const { dispatch } = this.props;
    const { configVisible, currVersion } = this.state;
    dispatch({
      type: 'plugin/removePluginVersionConfig',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        plugin_id: this.getId(),
        build_version: currVersion,
        config_group_id: configVisible.ID,
        config_name: configVisible.config_name
      },
      callback: () => {
        notification.success({ message: formatMessage({id:'notification.success.delete'}) });
        this.getPluginVersionConfig();
        this.handleCloseDelConfigVisible();
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };
  // 添加配置项
  handleAddConfig = values => {
    const { dispatch } = this.props;
    const { currVersion } = this.state;
    dispatch({
      type: 'plugin/addPluginVersionConfig',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        plugin_id: this.getId(),
        build_version: currVersion,
        entry: values
      },
      callback: () => {
        this.hiddenAddConfig();
        this.getPluginVersionConfig();
        this.handleCancelAddStorageConfig('storageAdd');
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };
  // 编辑配置组或者存储管理
  handleEditConfig = values => {
    const { dispatch } = this.props;
    const { showEditConfig, currVersion } = this.state;
    dispatch({
      type: 'plugin/editPluginVersionConfig',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        plugin_id: this.getId(),
        build_version: currVersion,
        entry: {
          ...showEditConfig,
          ...values
        }
      },
      callback: () => {
        this.hideEditConfig();
        this.getPluginVersionConfig();
        this.handleCancelAddStorageConfig('storageEdit');
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };
  // 删除存储管理弹窗
  handleDeleteStorage = values => {
    this.setState({ configStorageVisible: values });
  };
  // 关闭弹窗
  handleCloseStorage = () => {
    this.setState({ configStorageVisible: false, removeStorageLoading: false });
  };
  // 删除存储管理
  handleDelStorage = () => {
    const { dispatch } = this.props;
    this.setState({ removeStorageLoading: true });
    const {
      configStorageVisible,
      currVersion,
      storgeListData,
      listData
    } = this.state;
    const params = buildStorageDeletePayload({
      target: configStorageVisible,
      storageListData: storgeListData,
      listData
    });
    dispatch({
      type: 'plugin/editPluginVersionConfig',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        plugin_id: this.getId(),
        build_version: currVersion,
        entry: params
      },
      callback: () => {
        notification.success({ message: formatMessage({id:'notification.success.delete'}) });
        this.getPluginVersionConfig();
        this.handleCloseStorage();
      },
      handleError: err => {
        handleAPIError(err);
        this.setState({ removeStorageLoading: false });
      }
    });
  };
  // 显示编辑配置弹窗
  showEditConfig = config => {
    this.setState({ showEditConfig: config });
  };

  // 隐藏编辑配置弹窗
  hideEditConfig = () => {
    this.setState({ showEditConfig: null });
  };

  // 显示删除版本确认弹窗
  showDeleteVersion = () => {
    this.setState({ showDeleteVersion: true });
  };

  // 取消删除版本
  cancelDeleteVersion = () => {
    this.setState({ showDeleteVersion: false });
  };
  // 删除插件版本
  handleDeleteVersion = () => {
    const { dispatch } = this.props;
    const { currVersion } = this.state;
    dispatch({
      type: 'plugin/removePluginVersion',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        plugin_id: this.getId(),
        build_version: currVersion
      },
      callback: () => {
        this.cancelDeleteVersion();
        this.setState({ currVersion: '' }, () => {
          this.getVersions();
        });
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };
  // 创建插件版本
  handleCreatePluginVersion = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'plugin/createPluginVersion',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        plugin_id: this.getId()
      },
      callback: () => {
        notification.success({ message: formatMessage({id:'notification.success.succeeded'}) });
        this.setState({ currVersion: '' }, () => {
          this.getVersions();
        });
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };
  // 构建插件版本
  handleBuildPluginVersion = () => {
    const { dispatch } = this.props;
    const { currVersion } = this.state;
    dispatch({
      type: 'plugin/buildPluginVersion',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        plugin_id: this.getId(),
        build_version: currVersion
      },
      callback: data => {
        if (data) {
          this.setState(
            {
              currVersion: '',
              event_id: data.bean.event_id,
              showBuildLog: true
            },
            () => {
              this.getVersions();
            }
          );
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };
  // 显示构建日志
  showBuildLog = () => {
    this.setState({ showBuildLog: true });
  };

  // 隐藏构建日志
  hideBuildLog = () => {
    this.setState({ showBuildLog: false });
  };

  // 检查是否可以编辑信息和配置
  canEditInfoAndConfig = () => {
    return (
      !pluginUtil.isMarketPlugin(this.state.currInfo) &&
      pluginUtil.canEditInfoAndConfig(this.state.currInfo)
    );
  };

  // 显示添加存储配置弹窗
  showAddStorgeConfig = storageConfigType => {
    this.setState({ showStorageConfig: true, storageConfigType });
  };

  // 取消添加存储配置
  handleCancelAddStorageConfig = type => {
    this.setState({
      showStorageConfig: false,
      editStoragData: {},
      isEditor: false,
      storageConfigType: 'storage'
    });
    type &&
      notification.success({
        message: type === 'storageAdd' ? formatMessage({id:'notification.success.add_success'}) : formatMessage({id:'notification.success.change'})
      });
  };
  // 新增或编辑存储
  handleSubmitStorageConfig = (vals, data) => {
    const {
      isEditor,
      listData,
      storgeListData,
      storageConfigType
    } = this.state;
    const params = buildStorageSavePayload({
      values: vals,
      data,
      storageType: storageConfigType,
      isEditor,
      storageListData: storgeListData,
      listData
    });
    isEditor ? this.handleEditConfig(params) : this.handleAddConfig(params);
  };
  // 编辑存储
  handleEditStorage = data => {
    this.setState({
      isEditor: true,
      editStoragData: toStorageEditorData(data),
      storageConfigType: data.attr_type || 'storage',
      showStorageConfig: true
    });
  };
  // 分享插件
  sharePlugin = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'plugin/sharePlugin',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        plugin_id: this.getId()
      },
      callback: data => {
        if (data.bean.step === 1) {
          dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/shareplugin/step-one/${this.getId()}/${
                data.bean.ID
              }`
            )
          );
        }
        if (data.bean.step === 2) {
          dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/shareplugin/step-two/${this.getId()}/${
                data.bean.ID
              }`
            )
          );
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };
  render() {
    const {
      currentEnterprise,
      currentTeam,
      currentRegionName,
      removeConfigLoading,
      addConfigLoading,
      editConfigLoading,
      operationPermissions: { isCreate, isEdit, isDelete }
    } = this.props;
    const {
      config,
      currInfo,
      configVisible,
      showAddConfig,
      showEditConfig,
      showDeleteVersion,
      showBuildLog,
      currVersion,
      event_id,
      apps,
      page,
      page_size,
      total,
      storgeListData,
      configFileListData,
      persistentStorageListData,
      volumeOpts,
      showStorageConfig,
      storageConfigType,
      isEditor,
      configStorageVisible,
      removeStorageLoading,
      editStoragData
    } = this.state;
    if (!currInfo) return null;
    const action = (
      <div>
        <ButtonGroup>
          {isCreate && (
            <Button type="primary" onClick={this.handleBuildPluginVersion}>
              {formatMessage({id:'teamOther.manage.structure'})}
            </Button>
          )}
          {currInfo.build_status !== 'unbuild' && (
            <Button type="default" onClick={this.showBuildLog}>
              {formatMessage({id:'teamOther.manage.log'})}
            </Button>
          )}
        </ButtonGroup>
      </div>
    );
    // 存储管理
    const extra = (
      <Row
        style={{
          float: 'right',
          width: 300
        }}
      >
        <Col xs={24} sm={12}>
          <div className={styles.textSecondary} />
          <div className={styles.heading} />
        </Col>
        <Col xs={24} sm={12}>
          <div className={styles.textSecondary}>{formatMessage({id:'teamOther.manage.state'})}</div>
          <div className={styles.heading}>
            {pluginUtil.getBuildStatusCN(currInfo.build_status)}
          </div>
        </Col>
      </Row>
    );
    let breadcrumbList = [];
    breadcrumbList = createTeam(
      createEnterprise(breadcrumbList, currentEnterprise),
      currentTeam,
      currentRegionName
    );
    breadcrumbList.push({
      title: formatMessage({id:'teamOther.manage.list'}),
      href: globalUtil.getTeamPluginTabPath(currentTeam.team_name, currentRegionName)
    });
    breadcrumbList.push({ title: currInfo.plugin_alias });
    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        title={currInfo.plugin_alias}
        content={currInfo.desc}
        extraContent={
          <Button onClick={() => {
            const { dispatch } = this.props;
            dispatch(
              routerRedux.push(globalUtil.getTeamPluginTabPath())
            );
          }} type="default">
              <Icon type="home" />{formatMessage({ id: 'global.fetchAccessText.plugin' })}
          </Button>
        }
      >
        <Card
          style={{
            marginBottom: 16
          }}
          title={formatMessage({id:'teamOther.manage.information'})}
          extra={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div className={styles.heading} style={{ marginRight: '12px' }}> {pluginUtil.getBuildStatusCN(currInfo.build_status)}</div>
              <div>
                <ButtonGroup>
                  {isCreate && (
                    <Button type="primary" onClick={this.handleBuildPluginVersion}>
                      {formatMessage({id:'teamOther.manage.structure'})}
                    </Button>
                  )}
                  {currInfo.build_status !== 'unbuild' && (
                    <Button type="default" onClick={this.showBuildLog}>
                      {formatMessage({id:'teamOther.manage.log'})}
                    </Button>
                  )}
                </ButtonGroup>
              </div>
            </div>
          }
        >
            <CreatePluginForm
              allDisabled={false}
              Modifys
              isEdit={isEdit}
              onSubmit={this.handleEditSubmit}
              data={currInfo}
              submitText={formatMessage({id:'teamOther.manage.modification'})}
            />
        </Card>
        <Card
          style={{
            marginBottom: 16
          }}
          title={formatMessage({id:'teamOther.manage.management'})}
        >
          <ScrollerX sm={700}>
            <Table
              rowKey={(record,index) => index}
              columns={[
                {
                  title: formatMessage({id:'teamOther.manage.config_name'}),
                  dataIndex: 'config_name'
                },
                {
                  title: formatMessage({id:'teamOther.manage.service_meta_type'}),
                  dataIndex: 'service_meta_type',
                  render: v => {
                    return pluginUtil.getMetaTypeCN(v);
                  }
                },
                {
                  title: formatMessage({id:'teamOther.manage.injection'}),
                  dataIndex: 'injection',
                  render: v => {
                    return pluginUtil.getInjectionCN(v);
                  }
                },
                {
                  title: formatMessage({id:'teamOther.manage.options'}),
                  dataIndex: 'options',
                  width: '40%',
                  render: v => {
                    return (v || []).map(item => {
                      return (
                        <p className={styles.configGroup}>
                          <span>{formatMessage({id:'teamOther.manage.attr_name'})} {item.attr_name}</span>
                          <span>{formatMessage({id:'teamOther.manage.attr_type'})} {item.attr_type}</span>
                          {item.attr_type !== 'string' ? (
                            <span>{formatMessage({id:'teamOther.manage.attr_alt_value'})} {item.attr_alt_value}</span>
                          ) : null}
                          <span>
                            {formatMessage({id:'teamOther.manage.is_change'})} {item.is_change ? formatMessage({id:'teamOther.manage.yes_change'}) : formatMessage({id:'teamOther.manage.no_change'})}
                          </span>
                          <span>{formatMessage({id:'teamOther.manage.attr_info'})} {item.attr_info}</span>
                        </p>
                      );
                    });
                  }
                },
                {
                  title: formatMessage({id:'teamOther.manage.action'}),
                  dataIndex: 'action',
                  render: (_v, data) => {
                    return (
                      <Fragment>
                        {isEdit && (
                          <a
                            onClick={() => {
                              this.showEditConfig(data);
                            }}
                            style={{
                              marginRight: 8
                            }}
                          >
                            {formatMessage({id:'teamOther.manage.edit'})}
                          </a>
                        )}
                        {isDelete && (
                          <a
                            onClick={() => {
                              this.handleOpenDelConfigVisible(data);
                            }}
                          >
                            {formatMessage({id:'teamOther.manage.delete'})}
                          </a>
                        )}
                      </Fragment>
                    );
                  }
                }
              ]}
              dataSource={config}
              pagination={false}
            />
          </ScrollerX>
          <div
            style={{
              textAlign: 'right',
              paddingTop: 24
            }}
          >
            <Button onClick={this.showAddConfig}>
              <Icon type="plus" />
              {formatMessage({id:'teamOther.manage.add'})}
            </Button>
          </div>
        </Card>
        {/* 配置文件 */}
        <Card
          style={{
            marginBottom: 16
          }}
          title={formatMessage({id:'teamOther.manage.config_file_title'})}
        >
          <Table
            rowKey={record => record.ID || record.attr_name || record.config_name}
            columns={[
              {
                title: formatMessage({id:'teamOther.manage.name'}),
                dataIndex: 'config_name',
                key: '1'
              },
              { title: formatMessage({id:'teamOther.manage.path'}), dataIndex: 'volume_path', key: '2' },
              {
                title: formatMessage({id:'teamOther.manage.action'}),
                dataIndex: 'action',
                key: '3',
                render: (_v, data) => {
                  return (
                    <Fragment>
                      {isEdit && (
                        <a
                          onClick={() => {
                            this.handleEditStorage(data);
                          }}
                          style={{
                            marginRight: 8
                          }}
                        >
                          {formatMessage({id:'teamOther.manage.edit'})}
                        </a>
                      )}
                      {isDelete && (
                        <a
                          onClick={() => {
                            this.handleDeleteStorage(data);
                          }}
                        >
                          {formatMessage({id:'teamOther.manage.delete'})}
                        </a>
                      )}
                    </Fragment>
                  );
                }
              }
            ]}
            dataSource={configFileListData}
            pagination={false}
          />

          <div
            style={{
              textAlign: 'right',
              paddingTop: 24
            }}
          >
            {isCreate && (
              <Button
                onClick={() => this.showAddStorgeConfig('config-file')}
              >
                <Icon type="plus" />
                {formatMessage({id:'teamOther.manage.add_config_file'})}
              </Button>
            )}
          </div>
        </Card>
        {/* 持久化存储 */}
        <Card
          style={{
            marginBottom: 16
          }}
          title={formatMessage({id:'teamOther.manage.persistent_storage_title'})}
        >
          <Table
            rowKey={record => record.ID || record.attr_name || record.config_name}
            columns={[
              {
                title: formatMessage({id:'teamOther.manage.name'}),
                dataIndex: 'config_name',
                key: '1'
              },
              {
                title: formatMessage({id:'teamOther.manage.path'}),
                dataIndex: 'volume_path',
                key: '2'
              },
              {
                title: formatMessage({id:'teamOther.manage.storage_class'}),
                dataIndex: 'volume_type',
                key: '3'
              },
              {
                title: formatMessage({id:'teamOther.manage.capacity'}),
                dataIndex: 'volume_capacity',
                key: '4'
              },
              {
                title: formatMessage({id:'teamOther.manage.access_mode'}),
                dataIndex: 'access_mode',
                key: '5'
              },
              {
                title: formatMessage({id:'teamOther.manage.action'}),
                dataIndex: 'action',
                key: '6',
                render: (_v, data) => {
                  return (
                    <Fragment>
                      {isEdit && (
                        <a
                          onClick={() => {
                            this.handleEditStorage(data);
                          }}
                          style={{
                            marginRight: 8
                          }}
                        >
                          {formatMessage({id:'teamOther.manage.edit'})}
                        </a>
                      )}
                      {isDelete && (
                        <a
                          onClick={() => {
                            this.handleDeleteStorage(data);
                          }}
                        >
                          {formatMessage({id:'teamOther.manage.delete'})}
                        </a>
                      )}
                    </Fragment>
                  );
                }
              }
            ]}
            dataSource={persistentStorageListData}
            pagination={false}
          />
          <div
            style={{
              textAlign: 'right',
              paddingTop: 24
            }}
          >
            {isCreate && (
              <Button onClick={() => this.showAddStorgeConfig('storage')}>
                <Icon type="plus" />
                {formatMessage({id:'teamOther.manage.add_persistent_storage'})}
              </Button>
            )}
          </div>
        </Card>
        <Card title={formatMessage({id:'teamOther.manage.already_installed'})}>
          <Table
            rowKey={(record,index) => index}
            columns={[
              {
                title: formatMessage({id:'teamOther.manage.Component_name'}),
                dataIndex: 'service_cname',
                render: (v, data) => {
                  return (
                    <Link
                      to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${
                        globalUtil.getAppID()
                      }/overview?type=components&componentID=${data.service_alias}&tab=overview`}
                    >
                      {v}
                    </Link>
                  );
                }
              },
              {
                title: formatMessage({id:'teamOther.manage.version'}),
                dataIndex: 'build_version'
              },
              {
                title: formatMessage({id:'teamOther.manage.action'}),
                dataIndex: 'action',
                render: (v, data) => {
                  return (
                    <Link
                      to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${
                        globalUtil.getAppID()
                      }/overview?type=plugins&pluginID=${data.plugin_id}&tab=plugin`}
                    >
                      {formatMessage({id:'teamOther.manage.look'})}
                    </Link>
                  );
                }
              }
            ]}
            dataSource={apps}
            pagination={{
              current: page,
              pageSize: page_size,
              total,
              onChange: this.onPageChange
            }}
          />
        </Card>
        {configVisible && (
          <ConfirmModal
            title={formatMessage({id:'confirmModal.configuration_item.delete.title'})}
            subDesc={formatMessage({id:'confirmModal.delete.strategy.subDesc'})}
            desc={formatMessage({id:'confirmModal.delete.drop_procedure.desc'})}
            loading={removeConfigLoading}
            onOk={this.handleDelConfig}
            onCancel={this.handleCloseDelConfigVisible}
          />
        )}
        {/* 删除存储 */}
        {configStorageVisible && (
          <ConfirmModal
            title={formatMessage({id:'confirmModal.drop_procedure.delete.title'})}
            subDesc={formatMessage({id:'confirmModal.delete.strategy.subDesc'})}
            desc={formatMessage({id:'confirmModal.drop_procedure.delete.sub'})}
            loading={removeStorageLoading}
            onOk={this.handleDelStorage}
            onCancel={this.handleCloseStorage}
          />
        )}

        {showAddConfig && (
          <AddOrEditConfig
            loading={addConfigLoading}
            onCancel={this.hiddenAddConfig}
            onSubmit={this.handleAddConfig}
          />
        )}
        {showEditConfig && (
          <AddOrEditConfig
            title={formatMessage({id:'teamOther.manage.edit_config'})}
            loading={editConfigLoading}
            data={showEditConfig}
            onCancel={this.hideEditConfig}
            onSubmit={this.handleEditConfig}
          />
        )}
        {showDeleteVersion && (
          <ConfirmModal
            onOk={this.handleDeleteVersion}
            onCancel={this.cancelDeleteVersion}
            title={formatMessage({id:'confirmModal.drop_versions.delete.title'})}
            desc={formatMessage({id:'confirmModal.delete.drop_versions.desc'})}
            subDesc={formatMessage({id:'confirmModal.delete.strategy.subDesc'})}
          />
        )}
        {showBuildLog && currVersion && (
          <BuildPluginVersion
            onCancel={this.hideBuildLog}
            event_id={event_id}
            plugin_id={this.getId()}
            build_version={currVersion}
          />
        )}
        {/* 新增存储 */}
        {showStorageConfig && (
          <EditStorageConfig
            onCancel={this.handleCancelAddStorageConfig}
            onSubmit={this.handleSubmitStorageConfig}
            data={editStoragData} // 编辑数据
            editor={isEditor}
            loading={isEditor ? editConfigLoading : addConfigLoading}
            storageList={storgeListData}
            storageType={storageConfigType}
            volumeOpts={volumeOpts}
          />
        )}
      </PageHeaderLayout>
    );
  }
}
