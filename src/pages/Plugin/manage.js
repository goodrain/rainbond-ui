/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unused-state */
/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-expressions */
/* eslint-disable camelcase */
import { Button, Card, Col, Form, Icon, Notification, Row, Table } from 'antd';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
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
  onPageChange = page => {
    this.setState({ page }, () => {
      this.getUsedApp();
    });
  };
  getShareRecord = () => {
    this.props.dispatch({
      type: 'plugin/getShareRecord',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        plugin_id: this.getId()
      }
    });
  };
  getUsedApp = () => {
    this.props.dispatch({
      type: 'plugin/getUsedApp',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        plugin_id: this.getId(),
        page: this.state.page,
        page_size: this.state.page_size
      },
      callback: data => {
        if (data) {
          this.setState({
            apps: data.list || [],
            total: data.total
          });
        }
      }
    });
  };
  getVersions = () => {
    this.props.dispatch({
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
      }
    });
  };
  getPluginVersionInfo = () => {
    if (!this.mount) return;
    this.props.dispatch({
      type: 'plugin/getPluginVersionInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        plugin_id: this.getId(),
        build_version: this.state.currVersion
      },
      callback: data => {
        if (data) {
          this.setState({ currInfo: data.bean });
          setTimeout(() => {
            this.getPluginVersionInfo();
          }, 5000);
        }
      }
    });
  };
  // 获取配置组合存储管理
  getPluginVersionConfig = () => {
    this.props.dispatch({
      type: 'plugin/getPluginVersionConfig',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        plugin_id: this.getId(),
        build_version: this.state.currVersion
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
      }
    });
  };

  getId = () => {
    return this.props.match.params.pluginId;
  };
  handleSubmit = val => {
    this.props.dispatch({
      type: 'plugin/createPlugin',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        ...val
      }
    });
  };
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
  showAddConfig = () => {
    this.setState({ showAddConfig: true });
  };
  hiddenAddConfig = () => {
    this.setState({ showAddConfig: false });
  };
  handleOpenDelConfigVisible = data => {
    this.setState({ configVisible: data });
  };

  handleCloseDelConfigVisible = () => {
    this.setState({ configVisible: false });
  };

  hanldeEditSubmit = values => {
    this.props.dispatch({
      type: 'plugin/editPluginVersionInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        plugin_id: this.getId(),
        build_version: this.state.currVersion,
        ...values
      },
      callback: () => {
        Notification.success({ message: '修改成功' });
      }
    });
  };
  handleDelConfig = () => {
    const { configVisible } = this.state;
    this.props.dispatch({
      type: 'plugin/removePluginVersionConfig',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        plugin_id: this.getId(),
        build_version: this.state.currVersion,
        config_group_id: configVisible.ID,
        config_name: configVisible.config_name
      },
      callback: () => {
        Notification.success({ message: '删除成功' });
        this.getPluginVersionConfig();
        this.handleCloseDelConfigVisible();
      }
    });
  };
  handleAddConfig = values => {
    this.props.dispatch({
      type: 'plugin/addPluginVersionConfig',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        plugin_id: this.getId(),
        build_version: this.state.currVersion,
        entry: values
      },
      callback: () => {
        this.hiddenAddConfig();
        this.getPluginVersionConfig();
        this.handleCancelAddStorageConfig('storageAdd');
      }
    });
  };
  // 编辑配置组或者存储管理
  handleEditConfig = values => {
    const { showEditConfig, currVersion, storgeListData } = this.state;
    this.props.dispatch({
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
    this.setState({
      removeStorageLoading: true
    });
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
    this.props.dispatch({
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
        Notification.success({ message: '删除成功' });
        this.getPluginVersionConfig();
        this.handleCloseStorage();
      }
    });
  };
  showEditConfig = config => {
    this.setState({ showEditConfig: config });
  };
  hideEditConfig = () => {
    this.setState({ showEditConfig: null });
  };
  showDeleteVersion = () => {
    this.setState({ showDeleteVersion: true });
  };
  cancelDeleteVersion = () => {
    this.setState({ showDeleteVersion: false });
  };
  handleDeleteVersion = () => {
    this.props.dispatch({
      type: 'plugin/removePluginVersion',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        plugin_id: this.getId(),
        build_version: this.state.currVersion
      },
      callback: () => {
        this.cancelDeleteVersion();
        this.state.currVersion = '';
        this.getVersions();
      }
    });
  };
  handleCreatePluginVersion = () => {
    this.props.dispatch({
      type: 'plugin/createPluginVersion',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        plugin_id: this.getId()
      },
      callback: () => {
        Notification.success({ message: '操作成功' });
        this.state.currVersion = '';
        this.getVersions();
      }
    });
  };
  handleBuildPluginVersion = () => {
    this.props.dispatch({
      type: 'plugin/buildPluginVersion',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        plugin_id: this.getId(),
        build_version: this.state.currVersion
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
      }
    });
  };
  showBuildLog = () => {
    this.setState({ showBuildLog: true });
  };
  hideBuildLog = () => {
    this.setState({ showBuildLog: false });
  };
  canEditInfoAndConfig = () => {
    return (
      !pluginUtil.isMarketPlugin(this.state.currInfo) &&
      pluginUtil.canEditInfoAndConfig(this.state.currInfo)
    );
  };
  showAddStorgeConfig = () => {
    this.setState({ showStorageConfig: true });
  };
  handleCancelAddStorageConfig = type => {
    this.setState({
      showStorageConfig: false,
      editStoragData: {},
      isEditor: false
    });
    type &&
      Notification.success({
        message: type === 'storageAdd' ? '新增成功' : '修改成功'
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
            attr_type: deepVals.volume_type,
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
      removeStorageLoading
    } = this.state;
    if (!currInfo) return null;
    const action = (
      <div>
        <ButtonGroup>
          {isCreate && (
            <Button type="primary" onClick={this.handleBuildPluginVersion}>
              构建
            </Button>
          )}
          {currInfo.build_status !== 'unbuild' && (
            <Button type="default" onClick={this.showBuildLog}>
              查看构建日志
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
          <div className={styles.textSecondary}>构建状态</div>
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
      title: '插件列表',
      href: `/team/${currentTeam.team_name}/region/${currentRegionName}/myplugns`
    });
    breadcrumbList.push({ title: currInfo.plugin_alias });
    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        title={currInfo.plugin_alias}
        content={currInfo.desc}
        extraContent={extra}
        action={action}
      >
        <Card
          style={{
            marginBottom: 16
          }}
          title="版本基础信息"
        >
          <div
            style={{
              maxWidth: 500,
              margin: '0 auto'
            }}
          >
            <CreatePluginForm
              allDisabled={false}
              Modifys
              isEdit={isEdit}
              onSubmit={this.hanldeEditSubmit}
              data={currInfo}
              submitText="确认修改"
            />
          </div>
        </Card>
        <Card
          style={{
            marginBottom: 16
          }}
          title="配置组管理"
        >
          <ScrollerX sm={700}>
            <Table
              columns={[
                {
                  title: '配置项名',
                  dataIndex: 'config_name'
                },
                {
                  title: '依赖元数据类型',
                  dataIndex: 'service_meta_type',
                  render: v => {
                    return pluginUtil.getMetaTypeCN(v);
                  }
                },
                {
                  title: '注入类型',
                  dataIndex: 'injection',
                  render: v => {
                    return pluginUtil.getInjectionCN(v);
                  }
                },
                {
                  title: '配置项',
                  dataIndex: 'options',
                  width: '40%',
                  render: v => {
                    return (v || []).map(item => {
                      return (
                        <p className={styles.configGroup}>
                          <span>属性名: {item.attr_name}</span>
                          <span>属性类型: {item.attr_type}</span>
                          {item.attr_type !== 'string' ? (
                            <span>可选值: {item.attr_alt_value}</span>
                          ) : null}
                          <span>
                            可否修改: {item.is_change ? '可修改' : '不可修改'}
                          </span>
                          <span>简短说明: {item.attr_info}</span>
                        </p>
                      );
                    });
                  }
                },
                {
                  title: '操作',
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
                            修改
                          </a>
                        )}
                        {isDelete && (
                          <a
                            onClick={() => {
                              this.handleOpenDelConfigVisible(data);
                            }}
                          >
                            删除
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
              新增配置
            </Button>
          </div>
        </Card>
        {/* 存储管理 */}
        <Card
          style={{
            marginBottom: 16
          }}
          title="配置文件和共享存储"
        >
          <Table
            columns={[
              {
                title: '名称',
                dataIndex: 'config_name',
                key: '1'
              },
              { title: '挂载路径', dataIndex: 'volume_path', key: '2' },
              {
                title: '存储类型',
                dataIndex: 'attr_type',
                key: '3',
                render: val => {
                  return val === 'storage' ? '共享存储' : '配置文件';
                }
              },
              {
                title: '操作',
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
                          修改
                        </a>
                      )}
                      {isDelete && (
                        <a
                          onClick={() => {
                            this.handleDeleteStorage(data);
                          }}
                        >
                          删除
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
              新增存储
            </Button>
          </div>
        </Card>
        <Card title="已安装当前插件的组件">
          <Table
            columns={[
              {
                title: '组件名称',
                dataIndex: 'service_cname',
                render: (v, data) => {
                  return (
                    <Link
                      to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${
                        data.service_alias
                      }/overview`}
                    >
                      {v}
                    </Link>
                  );
                }
              },
              {
                title: '安装版本',
                dataIndex: 'build_version'
              },
              {
                title: '操作',
                dataIndex: 'action',
                render: (v, data) => {
                  return (
                    <Link
                      to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${
                        data.service_alias
                      }/plugin`}
                    >
                      查看已安装插件
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
            title="删除配置项"
            subDesc="此操作不可恢复"
            desc="确定要删除此配置项？"
            loading={removeConfigLoading}
            onOk={this.handleDelConfig}
            onCancel={this.handleCloseDelConfigVisible}
          />
        )}
        {/* 删除存储 */}
        {configStorageVisible && (
          <ConfirmModal
            title="删除存储"
            subDesc="此操作不可恢复"
            desc="确定要删除此存储？"
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
            title="修改配置组"
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
            title="删除版本"
            desc="确定要删除当前版本吗？"
            subDesc="此操作不可恢复"
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
            data={this.state.editStoragData} // 编辑数据
            editor={isEditor}
          />
        )}
      </PageHeaderLayout>
    );
  }
}
