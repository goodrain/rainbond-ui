/* eslint-disable react/sort-comp */
/* eslint-disable eqeqeq */
/* eslint-disable react/jsx-indent */
/* eslint-disable react/no-unused-state */
/* eslint-disable camelcase */
/* eslint-disable no-nested-ternary */
import {
  Alert,
  Button,
  Checkbox,
  Col,
  Form,
  Icon,
  List,
  Row,
  Select,
  Spin,
  Tooltip
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import { getApplicationUpgradeDetail } from '../../../services/app';
import {
  createApp,
  createEnterprise,
  createTeam
} from '../../../utils/breadcrumb';
import handleAPIError from '../../../utils/error';
import globalUtil from '../../../utils/global';
import styles from './index.less';
import infoUtil from './info-util';

const { Option } = Select;

// eslint-disable-next-line react/no-redundant-should-component-update
@Form.create()
@connect(({ user, global, application, teamControl, enterprise }) => ({
  groupDetail: application.groupDetail || {},
  currUser: user.pageUser,
  groups: global.groups || [],
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
}))
export default class AppList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      appDetail: {},
      type: '',
      indexs: 0,
      infoObj: {},
      upgradeVersions: [],
      upgradeInfo: [],
      upgrade_info: '',
      upgradeRecords: [],
      upgradeText: '升级',
      textState: 1,
      service_id: [],
      upgradeLoading: false,
      rollbackLoading: false,
      conshow: true
    };
  }
  componentDidMount() {
    this.fetchAppDetail();
    this.fetchUpgradeDetail();
  }

  onVersionChange = value => {
    this.props.form.setFieldsValue({ upgradeVersions: value });
    this.getUpdatedInfo(value);
  };
  // 查询某云市应用下组件的更新信息
  getUpdatedInfo = (version, callback = null) => {
    const { dispatch } = this.props;
    const { upgradeDetail } = this.state;
    const payload = this.getParameter();
    if (upgradeDetail && upgradeDetail.record) {
      payload.marketName = upgradeDetail.record.market_name;
    }
    this.setState({ upgradeListLoading: true });
    payload.version = version;
    dispatch({
      type: 'global/CloudAppUpdatedInfo',
      payload,
      callback: res => {
        if (res && res.status_code === 200) {
          let upgrade_component_ids = [];
          if (res.list) {
            upgrade_component_ids = res.list.map(item => {
              if (item.service.type == 'add') {
                return item.service.service_key;
              }
              if (item.service.can_upgrade) {
                return item.service.service_id;
              }
              return null;
            });
          }

          this.setState(
            {
              upgradeInfo: res.list || [],
              upgradeListLoading: false,
              upgrade_component_ids,
              selectVersion: true
            },
            () => {
              if (callback) {
                callback();
              }
              if (res.list.length > 0) {
                this.handleSelectComponent(res.list[0]);
              }
            }
          );
        }
      }
    });
  };

  getParameter = () => {
    const {
      teamName,
      regionName,
      appID,
      recordID,
      upgradeGroupID
    } = this.props.match.params;
    const { app_id } = this.props.location.query;
    return {
      team_name: teamName,
      region_name: regionName,
      group_id: appID,
      record_id: recordID,
      upgradeGroupID,
      app_model_key: app_id
    };
  };

  // 查询某应用的更新记录详情
  getUpgradeRecordsInfo = () => {
    const { team_name, group_id, upgradeGroupID } = this.getParameter();
    const { dispatch } = this.props;
    const { upgradeDetail, upgradeInfo } = this.state;
    dispatch({
      type: 'global/CloudAppUpdateRecordsInfo',
      payload: {
        team_name,
        group_id,
        upgrade_group_id: upgradeGroupID,
        record_id: upgradeDetail.record.ID
      },
      callback: res => {
        if (res && res.status_code === 200) {
          const info = res.bean;
          const service_id_status = {};
          const service_key_status = {};
          if (info.service_record) {
            info.service_record.map(item => {
              service_id_status[item.service_id] = item.status;
              service_key_status[item.service_key] = item.status;
              return item;
            });
          }
          const newUpgradeInfo = upgradeInfo.map(item => {
            const newInfo = item;
            if (item.service.service_id) {
              newInfo.status = service_id_status[item.service.service_id];
            } else if (item.service.service_key) {
              newInfo.status = service_key_status[item.service.service_key];
            }
            return newInfo;
          });
          this.setState(
            {
              upgradeRecords: info.service_record,
              upgradeInfo: newUpgradeInfo,
              record: info,
              textState: info.status,
              upgradeText: infoUtil.getStatusText(info.status),
              upgradeLoading: false,
              rollbackLoading: false
            },
            () => {
              if (
                info.status != 3 &&
                info.status != 5 &&
                info.status != 6 &&
                info.status != 7 &&
                info.status != 8 &&
                info.status != 9
              ) {
                setTimeout(() => {
                  this.getUpgradeRecordsInfo();
                }, 3000);
              }
            }
          );
        }
      }
    });
  };

  getData = isUpgrade => {
    const { show_component } = this.state;
    const Box = text => [
      {
        title: '',
        description: (
          <div
            style={{
              textAlign: 'center',
              lineHeight: '300px',
              fontSize: '25px'
            }}
          >
            {text}
          </div>
        )
      }
    ];
    if (show_component && show_component.service.type == 'add') {
      return Box('新增组件');
    }
    if (show_component) {
      const { service, upgrade_info } = show_component;
      if (service && service.type == 'add') {
        return Box('新增组件');
      } else if (upgrade_info && service.have_change) {
        return this.setData(upgrade_info);
      }
      return Box('组件无变更');
    }
    return Box(isUpgrade ? '请选择要升级的版本' : '暂无可升级的版本');
  };
  handleAdd = obj => {
    return obj && obj.add && obj.add.length > 0;
  };

  handleUpd = obj => {
    return obj && obj.upd && obj.upd.length > 0;
  };

  handleBox = (name, isAdd, obj, key, childKey) => {
    return (
      <div className={styles.textzt}>
        {isAdd ? '新增' : '更新'}
        {name}：
        {obj[isAdd ? 'add' : 'upd'].map(item => {
          return (
            <span key={item[key]}>
              {childKey ? item[key][childKey] : item[key]}
            </span>
          );
        })}
      </div>
    );
  };

  setData = data => {
    const {
      connect_infos,
      ports,
      volumes,
      dep_services,
      dep_volumes,
      plugins,
      envs,
      app_config_groups,
      component_monitors,
      component_graphs,
      deploy_version,
      plugin_deps
    } = data;
    const arr = [];
    const deployVersionChange = deploy_version && deploy_version.is_change;

    const isDepServices =
      dep_services &&
      ((dep_services.add && dep_services.add.length > 0) ||
        (dep_services.del && dep_services.del.length > 0));

    const addAppConfigGroups = this.handleAdd(app_config_groups);
    const updAppConfigGroups = this.handleUpd(app_config_groups);
    const isAppConfigGroups = addAppConfigGroups || updAppConfigGroups;

    const addComponentGraphs = this.handleAdd(component_graphs);
    const updComponentGraphs = this.handleUpd(component_graphs);
    const isComponentGraphs = addComponentGraphs || updComponentGraphs;

    const addComponentMonitors = this.handleAdd(component_monitors);
    const updComponentMonitors = this.handleUpd(component_monitors);
    const isComponentMonitors = addComponentMonitors || updComponentMonitors;

    const addEnvs = this.handleAdd(envs);
    const updEnvs = this.handleUpd(envs);
    const isEnvs = addEnvs || updEnvs;

    const addPluginDeps = this.handleAdd(plugin_deps);
    const updPluginDeps = this.handleUpd(plugin_deps);
    const isPluginDeps = addPluginDeps || updPluginDeps;

    const addConnectInfos = this.handleAdd(connect_infos);
    const updConnectInfos = this.handleUpd(connect_infos);
    const isConnectInfos = addConnectInfos || updConnectInfos;

    const addPlugins = this.handleAdd(plugins);
    const updPlugins = this.handleUpd(plugins);
    const isPlugins = addPlugins || updPlugins;

    const addDepVolumess = this.handleAdd(dep_volumes);
    const updDepVolumess = this.handleUpd(dep_volumes);
    const isDepVolumess = addDepVolumess || updDepVolumess;

    const addPorts = this.handleAdd(ports);
    const updPorts = this.handleUpd(ports);
    const isPorts = addPorts || updPorts;

    const addVolumes = this.handleAdd(volumes);
    const updVolumes = this.handleUpd(volumes);
    const isVolumes = addVolumes || updVolumes;

    function addArr(title, description) {
      arr.push({
        title,
        description
      });
    }
    if (deployVersionChange) {
      addArr(
        '源组件构建版本',
        <div className={styles.textzt}>
          从 <span>{deploy_version.old}</span> 变更为
          <span>{deploy_version.new}</span>
        </div>
      );
    }

    if (isConnectInfos) {
      addArr(
        '连接信息',
        this.handleBox(null, addConnectInfos, connect_infos, 'attr_name')
      );
    }

    if (isPluginDeps) {
      addArr(
        '插件',
        this.handleBox(
          null,
          addPluginDeps,
          plugin_deps,
          'plugin',
          'plugin_alias'
        )
      );
    }

    if (isEnvs) {
      addArr('环境变量', this.handleBox(null, addEnvs, envs, 'attr_name'));
    }

    if (isPorts) {
      addArr('端口', this.handleBox(null, addPorts, ports, 'container_port'));
    }

    if (isVolumes) {
      addArr(
        '存储',
        this.handleBox('存储挂载', addVolumes, volumes, 'volume_name')
      );
    }

    if (isDepServices) {
      addArr(
        '依赖组件',
        <div>
          {dep_services.add && dep_services.add.length > 0 && (
            <div className={styles.textzt}>
              新增对
              {dep_services.add.map(item => {
                return <span key={item.service_id}>{item.service_cname}</span>;
              })}
              组件的依赖
            </div>
          )}
          {dep_services.del && dep_services.del.length > 0 && (
            <div className={styles.textzt}>
              移除对
              {dep_services.del.map(item => {
                return <span key={item.service_id}>{item.service_cname}</span>;
              })}
              组件的依赖
            </div>
          )}
        </div>
      );
    }

    if (isDepVolumess) {
      addArr(
        '依赖的存储',
        this.handleBox('存储挂载', addDepVolumess, dep_volumes, 'mnt_name')
      );
    }

    if (isPlugins) {
      addArr('插件', this.handleBox(null, addPlugins, plugins, 'plugin_alias'));
    }

    if (isAppConfigGroups) {
      addArr(
        '应用配置组',
        <div className={styles.textzt}>
          {addAppConfigGroups ? '新增' : '更新'}
          应用配置组：
          {app_config_groups[addAppConfigGroups ? 'add' : 'upd'].map(item => {
            return (
              <Tooltip
                placement="top"
                title={
                  item.config_items &&
                  Object.keys(item.config_items).map(key => {
                    return <div>{`${key} : ${item.config_items[key]}`}</div>;
                  })
                }
              >
                <span key={item.name}>{item.name}</span>;
              </Tooltip>
            );
          })}
        </div>
      );
    }

    if (isComponentMonitors) {
      addArr(
        '监控点',
        this.handleBox(
          null,
          addComponentMonitors,
          component_monitors,
          'service_show_name'
        )
      );
    }

    if (isComponentGraphs) {
      addArr(
        '监控图表',
        this.handleBox(null, addComponentGraphs, component_graphs, 'title')
      );
    }

    return arr;
  };

  getUpgradeStatus = item => {
    const isUpgrade = item.service.type === 'upgrade';
    switch (item.status) {
      case 2:
        return <Icon type="sync" style={{ color: '#1890ff' }} spin />;
      case 8:
        return (
          <Tooltip title="滚动更新操作失败，请前往组件页面手动操作">
            <Icon type="close" style={{ color: 'red' }} />
          </Tooltip>
        );
      case 3:
        return (
          <Tooltip title="成功">
            <Icon type="check" style={{ color: '#239B24' }} />
          </Tooltip>
        );
      default:
        if (isUpgrade && item.service.have_change) {
          return (
            <Tooltip title="可升级">
              <Icon type="up" style={{ color: '#239B24' }} />
            </Tooltip>
          );
        }
        if (isUpgrade && !item.service.can_upgrade) {
          return (
            <Tooltip title="新版本无该组件，不可升级">
              <Icon type="info-circle" />
            </Tooltip>
          );
        }
        if (isUpgrade) {
          return (
            <Tooltip title="组件无变更，升级只改变版本号">
              <Icon type="up" style={{ color: '#239B24' }} />
            </Tooltip>
          );
        }
        return (
          <Tooltip title="新增组件">
            <Icon type="plus" style={{ color: '#239B24' }} />
          </Tooltip>
        );
    }
  };

  getRecordShow = () => {
    const { record } = this.state;
    if (!record) {
      return null;
    }
    const { status } = record;
    const statusMap = {
      1: '升级任务未开始',
      2: '的升级任务执行中',
      3: '的升级任务执行成功',
      8: '的升级任务执行失败',
      10: '的升级任务执行部署失败'
    };
    const types = {
      1: 'info',
      2: 'warning',
      3: 'success',
      8: 'error',
      10: 'error'
    };
    if ([1, 2, 3, 8].includes(status)) {
      return (
        <Alert
          showIcon
          type={types[status]}
          message={`${record.group_name} 
          ${status === 1 ? '当前版本' : '从版本'} 
          ${record.old_version} 
          ${statusMap[status]}`}
        />
      );
    }
    return null;
  };

  returnListPage = () => {
    const { team_name, group_id } = this.getParameter();
    const { dispatch } = this.props;
    dispatch(
      routerRedux.push(
        `/team/${team_name}/region/${globalUtil.getCurrRegionName()}/apps/${group_id}/upgrade`
      )
    );
  };

  // 创建升级任务
  createUpgradeTasks = values => {
    const { form, dispatch } = this.props;
    const { upgradeDetail, upgradeInfo } = this.state;
    const {
      team_name,
      group_id,
      app_model_key,
      upgradeGroupID
    } = this.getParameter();
    const version = form.getFieldValue('upgradeVersions');
    const services = upgradeInfo.filter(item => {
      if (
        item.service.type == 'add' &&
        values.services.includes(item.service.service_key)
      ) {
        return item.service;
      }
      if (values.services.includes(item.service.service_id)) {
        return item.service;
      }
      return null;
    });
    dispatch({
      type: 'global/CloudAppUpdatedTasks',
      payload: {
        team_name,
        group_id,
        group_key: app_model_key,
        version,
        services,
        upgrade_record_id: upgradeDetail.record.ID,
        upgrade_group_id: upgradeGroupID
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState(
            {
              record_id: res.bean.ID
            },
            () => {
              this.getUpgradeRecordsInfo();
            }
          );
        }
      },
      handleError: err => {
        handleAPIError(err);
        this.getUpgradeRecordsInfo();
      }
    });
  };
  handleChangeVersion = (value, callback) => {
    this.props.form.setFieldsValue({ upgradeVersions: value });
    this.getUpdatedInfo(value, callback);
  };
  handleSelectComponent = select_component => {
    const { upgradeInfo } = this.state;
    if (select_component.service.service_id) {
      const show_upgrade_infos = upgradeInfo.filter(
        item => item.service.service_id == select_component.service.service_id
      );
      this.setState({
        select_component_id: select_component.service.service_id,
        show_component:
          show_upgrade_infos.length > 0 ? show_upgrade_infos[0] : null
      });
    } else {
      const show_upgrade_infos = upgradeInfo.filter(
        item => item.service.service_key == select_component.service.service_key
      );
      this.setState({
        select_component_id: select_component.service.service_key,
        show_component:
          show_upgrade_infos.length > 0 ? show_upgrade_infos[0] : null
      });
    }
  };
  handleSubmit = () => {
    const { form } = this.props;
    const { upgradeLoading } = this.state;
    form.validateFields((err, values) => {
      if (!err && !upgradeLoading) {
        this.setState(
          {
            upgradeLoading: true
          },
          () => {
            this.createUpgradeTasks(values);
          }
        );
      }
    });
  };

  handleRetry = () => {
    const { form, dispatch } = this.props;

    const { upgradeLoading, upgradeDetail } = this.state;
    form.validateFields(err => {
      if (!err && !upgradeLoading) {
        this.setState(
          {
            upgradeLoading: true
          },
          () => {
            const { team_name, group_id } = this.getParameter();
            dispatch({
              type: 'global/fetchAppRedeploy',
              payload: {
                team_name,
                group_id,
                record_id: upgradeDetail.record.ID
              },
              callback: res => {
                if (res && res.status_code === 200) {
                  this.setState(
                    {
                      record_id: res.bean.ID
                    },
                    () => {
                      this.getUpgradeRecordsInfo();
                    }
                  );
                }
              },
              handleError: errs => {
                handleAPIError(errs);
                this.getUpgradeRecordsInfo();
              }
            });
          }
        );
      }
    });
  };

  // 应用详情
  fetchAppDetail = () => {
    const { dispatch } = this.props;
    this.setState({ loadingDetail: true });
    dispatch({
      type: 'application/fetchGroupDetail',
      payload: this.getParameter(),
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
          dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps`
            )
          );
        }
      }
    });
  };
  // get upgrade info, it will return upgrade event, app_info and upgrade_versions.
  fetchUpgradeDetail = () => {
    this.setState({ loadingUpgradeDetail: true });

    getApplicationUpgradeDetail(this.getParameter())
      .then(res => {
        if (res && res.status_code === 200) {
          let upgrade_versions = [];
          if (res.bean && res.bean.versions) {
            upgrade_versions = res.bean.versions;
          }
          this.setState(
            {
              upgradeDetail: res.bean,
              record: res.bean.record,
              upgradeText: infoUtil.getStatusText(res.bean.record.status),
              textState: res.bean.record.status,
              loadingUpgradeDetail: false
            },
            () => {
              const { record } = res.bean;
              if (record.version) {
                this.handleChangeVersion(record.version, () => {
                  if (record.status == 2) {
                    // 获取升级记录信息
                    this.getUpgradeRecordsInfo();
                  }
                });
              } else if (upgrade_versions.length > 0) {
                this.handleChangeVersion(upgrade_versions[0], () => {
                  if (record.status == 2) {
                    this.getUpgradeRecordsInfo();
                  }
                });
              }
            }
          );
        }
        return null;
      })
      .catch(err => handleAPIError(err));
  };

  render() {
    const { dispatch, form } = this.props;
    const { currentEnterprise, currentTeam, currentRegionName } = this.props;
    const { getFieldDecorator } = form;
    const { group_id } = this.getParameter();
    const {
      select_component_id,
      upgradeInfo,
      upgradeText,
      textState,
      upgrade_component_ids,
      upgradeListLoading,
      upgradeLoading,
      appDetail,
      loadingDetail,
      loadingUpgradeDetail,
      upgradeDetail,
      selectVersion
    } = this.state;
    const JumpAddress = `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${group_id}`;
    const formItemLayout = {
      labelCol: {
        xs: { span: 6 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 16 },
        sm: { span: 16 }
      }
    };

    const UpgradeLoading = upgradeLoading || textState == 2;
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

    let upgrade_versions = [];

    if (
      upgradeDetail &&
      upgradeDetail.versions &&
      upgradeDetail.versions.length > 0
    ) {
      upgrade_versions = upgradeDetail.versions;
    }
    const isUpgrade =
      (upgrade_versions && upgrade_versions.length > 0) || loadingUpgradeDetail;
    const arr = this.getData(isUpgrade);
    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        loading={loadingDetail}
        title="应用升级管理"
        content="当前应用内具有从组件库或应用商店安装而来的组件时，升级管理功能可用。若安装源的应用版本有变更则可以进行升级操作。"
        extraContent={null}
      >
        <Spin spinning={loadingUpgradeDetail}>
          {isUpgrade && (
            <Row style={{ marginBottom: '16px' }}>{this.getRecordShow()}</Row>
          )}
          <div style={{ padding: '10px', background: '#fff' }}>
            <Row gutter={24} style={{ margin: '0px' }}>
              {isUpgrade && (
                <Col
                  xs={{ span: 6, offset: 0 }}
                  lg={{ span: 6, offset: 0 }}
                  style={{
                    background: '#fff',
                    borderRight: '1px solid #E8E8E8'
                  }}
                  className={styles.zslbor}
                >
                  <Form onSubmit={this.handleSubmit}>
                    <div className={styles.zsldis}>
                      <Form.Item
                        {...formItemLayout}
                        label="升级到"
                        style={{ width: '100%' }}
                      >
                        {getFieldDecorator('upgradeVersions', {
                          initialValue: upgrade_versions && upgrade_versions[0],
                          rules: [{ required: false, message: '请选择' }]
                        })(
                          <Select
                            getPopupContainer={triggerNode =>
                              triggerNode.parentNode
                            }
                            disabled={textState != 1}
                            size="small"
                            style={{ width: 120 }}
                            onChange={this.onVersionChange}
                          >
                            {upgrade_versions.map(item => {
                              return (
                                <Option value={item} key={item}>
                                  {item}
                                </Option>
                              );
                            })}
                          </Select>
                        )}
                        <span>&nbsp;&nbsp;版本</span>
                      </Form.Item>
                    </div>
                    <div className={styles.zslcheck}>
                      <Form.Item label="" style={{ width: '100%' }}>
                        {getFieldDecorator('services', {
                          initialValue: upgrade_component_ids,
                          force: true,
                          rules: [
                            {
                              required: true,
                              message: '请选择需要升级的组件'
                            }
                          ]
                        })(
                          <Checkbox.Group className={styles.zslGroup}>
                            {upgradeListLoading ? (
                              <div
                                style={{
                                  textAlign: 'center',
                                  width: '100%',
                                  marginTop: '32px'
                                }}
                              >
                                <Spin size="large" />
                              </div>
                            ) : (
                              <Row
                                gutter={24}
                                style={{ height: '400px', overflow: 'auto' }}
                              >
                                {upgradeInfo &&
                                  upgradeInfo.length > 0 &&
                                  upgradeInfo.map(item => {
                                    const { service } = item;

                                    return (
                                      <Col
                                        span={24}
                                        className={`${styles.zslMt} ${
                                          select_component_id ===
                                            item.service.service_id ||
                                          select_component_id ===
                                            item.service.service_key
                                            ? styles.active
                                            : ''
                                        }`}
                                        onClick={() => {
                                          this.handleSelectComponent(item);
                                        }}
                                      >
                                        <div style={{ width: '100%' }}>
                                          <Checkbox
                                            value={
                                              service.service_id ||
                                              service.service_key
                                            }
                                            disabled={!service.can_upgrade}
                                            style={{ width: '30px' }}
                                          />
                                          {service
                                            ? service.service_cname
                                            : item.service_cname}
                                        </div>

                                        <div>{this.getUpgradeStatus(item)}</div>
                                      </Col>
                                    );
                                  })}
                              </Row>
                            )}
                          </Checkbox.Group>
                        )}
                      </Form.Item>
                    </div>
                  </Form>
                </Col>
              )}
              <Col
                xs={{ span: isUpgrade ? 18 : 24, offset: 0 }}
                lg={{ span: isUpgrade ? 18 : 24, offset: 0 }}
                style={{ background: '#fff' }}
              >
                <div className={styles.zslbor}>
                  {isUpgrade && (
                    <div className={styles.zslcen}>组件属性变更详情</div>
                  )}
                  <Row
                    gutter={24}
                    style={{
                      margin: '10px 20px 20px',
                      height: '400px',
                      overflow: 'auto'
                    }}
                  >
                    {loadingUpgradeDetail ? (
                      <div
                        style={{
                          textAlign: 'center',
                          width: '100%',
                          marginTop: '32px'
                        }}
                      >
                        <Spin size="large" />
                      </div>
                    ) : (
                      <List
                        itemLayout="horizontal"
                        dataSource={arr}
                        renderItem={(item, index) => (
                          <List.Item key={index}>
                            <List.Item.Meta
                              title={item.title}
                              description={item.description}
                            />
                          </List.Item>
                        )}
                      />
                    )}
                  </Row>
                </div>
              </Col>
            </Row>
            <Row gutter={24} className={styles.customBtn}>
              <Button
                style={{ marginRight: '16px' }}
                onClick={() => {
                  this.returnListPage();
                }}
              >
                返回
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  if (textState != 1 && textState != 2 && textState != 4) {
                    dispatch(routerRedux.push(JumpAddress));
                  } else {
                    this.handleSubmit();
                  }
                }}
                disabled={
                  !selectVersion ||
                  UpgradeLoading ||
                  [6, 10].includes(textState)
                }
                loading={UpgradeLoading}
              >
                {upgradeText}
              </Button>
              {[6, 10].includes(textState) && (
                <Button
                  type="primary"
                  onClick={this.handleRetry}
                  loading={upgradeLoading}
                  style={{ marginLeft: '16px' }}
                >
                  重试
                </Button>
              )}
            </Row>
          </div>
        </Spin>
      </PageHeaderLayout>
    );
  }
}
