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
      showStorageConfig: false,
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
        const { list } = data;
        // 配置组管理数据过滤处理
        const config =
          list &&
          list.length > 0 &&
          list.reduce((pre, item) => {
            return item.injection !== 'plugin_storage' ? [...pre, item] : pre;
          }, []);
        // 存储管理数据过滤处理
        const storgeListDatas =
          list &&
          list.length > 0 &&
          list.reduce((pre, item) => {
            return item.injection === 'plugin_storage' ? [...pre, item] : pre;
          }, []);
        const storgeListData =
          storgeListDatas.length > 0 &&
          storgeListDatas[0].options.map(item => {
            const attr_default_value =
              (item.attr_default_value &&
                JSON.parse(item.attr_default_value)) ||
              {};
            item.volume_path = attr_default_value.volume_path || '';
            item.attr_type = attr_default_value.attr_type || '';
            item.config_name = attr_default_value.volume_name || '';
            return item;
          });
        if (list) {
          this.setState({ config, storgeListData, listData: list });
        }
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
      showEditConfig,
      currVersion,
      storgeListData,
      listData
    } = this.state;
    const deepCloneData = storgeListData.reduce(
      (pre, current) =>
        current.ID !== configStorageVisible.ID ? [...pre, current] : pre,
      []
    );
    const params = {};
    const deleteStorageID =
      listData &&
      listData.length > 0 &&
      listData.filter(item => item.injection === 'plugin_storage')[0].ID;
    params.ID = deleteStorageID || ''; // 删除时传递的ID
    params.config_name = 'plugin_storage';
    params.injection = 'plugin_storage';
    params.service_meta_type = 'plugin_storage';
    params.options = deepCloneData;
    if (storgeListData.length === 1) {
      params.modify_type = true;
    }
    dispatch({
      type: 'plugin/editPluginVersionConfig',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        plugin_id: this.getId(),
        build_version: currVersion,
        entry: {
          ...showEditConfig,
          ...params
        }
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
  showAddStorgeConfig = () => {
    this.setState({ showStorageConfig: true });
  };

  // 取消添加存储配置
  handleCancelAddStorageConfig = type => {
    this.setState({
      showStorageConfig: false,
      editStoragData: {},
      isEditor: false
    });
    type &&
      notification.success({
        message: type === 'storageAdd' ? formatMessage({id:'notification.success.add_success'}) : formatMessage({id:'notification.success.change'})
      });
  };
  // 新增或编辑存储
  handleSubmitStorageConfig = (vals, data) => {
    const { isEditor, listData, storgeListData } = this.state;
    const params = {};
    const editStorageID =
      listData &&
      listData.length > 0 &&
      listData.filter(item => item.injection === 'plugin_storage');
    params.ID =
      (editStorageID && editStorageID[0] && editStorageID[0].ID) || ''; // 编辑时传递的ID
    params.config_name = 'plugin_storage';
    params.injection = 'plugin_storage';
    params.service_meta_type = 'plugin_storage';
    if (!isEditor && storgeListData.length > 0) {
      params.modify_type = true;
    }
    params.options = [
      {
        ID: (data && data.ID) || '',
        attr_alt_value: '',
        attr_default_value: JSON.stringify({
          volume_path: vals.volume_path,
          file_content: vals.file_content || '',
          attr_type: vals.volume_type,
          volume_name: vals.volume_name
        }),
        attr_info: '',
        attr_name: `plugin_storage_${vals.volume_name}`,
        attr_type: vals.volume_type,
        is_change: true,
        protocol: ''
      }
    ];
    // 处理编辑态的数据
    if (isEditor && data && storgeListData && storgeListData.length > 0) {
      params.options = storgeListData.map(item => {
        if (item.ID === data.ID) {
          const deepVals = Object.assign({}, vals);
          item.attr_default_value = JSON.stringify({
            volume_path: deepVals.volume_path,
            file_content: deepVals.file_content || '',
            attr_type: data.attr_type,
            volume_name: deepVals.volume_name
          });
        }
        return item;
      });
    }
    isEditor ? this.handleEditConfig(params) : this.handleAddConfig(params);
  };
  // 编辑存储
  handleEditStorage = data => {
    const { config_name, attr_default_value } = data;

    data.volume_name = config_name;
    const str = (attr_default_value && JSON.parse(attr_default_value)) || '';
    data.file_content = str.file_content;
    this.setState({
      isEditor: true,
      editStoragData: data,
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
      showStorageConfig,
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
      href: `/team/${currentTeam.team_name}/region/${currentRegionName}/myplugns`
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
              routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/myplugns`)
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
        {/* 存储管理 */}
        {/* <Card
          style={{
            marginBottom: 16
          }}
          title={formatMessage({id:'teamOther.manage.title'})}
        >
          <Table
            rowKey={(record,index) => index}
            columns={[
              {
                title: formatMessage({id:'teamOther.manage.name'}),
                dataIndex: 'config_name',
                key: '1'
              },
              { title: formatMessage({id:'teamOther.manage.path'}), dataIndex: 'volume_path', key: '2' },
              {
                title: formatMessage({id:'teamOther.manage.type'}),
                dataIndex: 'attr_type',
                key: '3',
                render: val => {
                  return val === 'storage' ? formatMessage({id:'teamOther.manage.share'}) : formatMessage({id:'teamOther.manage.add_file'});
                }
              },
              {
                title: formatMessage({id:'teamOther.manage.action'}),
                dataIndex: 'action',
                key: '4',
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
            dataSource={storgeListData}
            pagination={false}
          />

          <div
            style={{
              textAlign: 'right',
              paddingTop: 24
            }}
          >
            <Button onClick={this.showAddStorgeConfig}>
              <Icon type="plus" />
              {formatMessage({id:'teamOther.manage.add_storage'})}
            </Button>
          </div>
        </Card> */}
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
          />
        )}
      </PageHeaderLayout>
    );
  }
}
