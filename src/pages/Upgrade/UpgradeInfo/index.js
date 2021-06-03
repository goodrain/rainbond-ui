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
      text: this.props.activeKey == 2 ? '回滚' : '升级',
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

  shouldComponentUpdate() {
    return true;
  }
  onChange = () => {};
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
      upgradeGroupID
    } = this.props.match.params;
    const { app_id } = this.props.location.query;
    return {
      team_name: teamName,
      region_name: regionName,
      group_id: appID,
      upgradeGroupID,
      app_model_key: app_id
    };
  };

  // 查询某应用的更新记录详情
  getUpgradeRecordsInfo = () => {
    const { team_name, group_id } = this.getParameter();
    const { dispatch } = this.props;
    const { upgradeDetail, upgradeInfo } = this.state;
    dispatch({
      type: 'global/CloudAppUpdateRecordsInfo',
      payload: {
        team_name,
        group_id,
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
              text: infoUtil.getStatusCNS(info.status),
              upgradeText: this.showBtnText(info),
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

  getData = () => {
    const { show_component } = this.state;
    if (show_component && show_component.service.type == 'add') {
      return [
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
              新增组件
            </div>
          )
        }
      ];
    }
    if (show_component) {
      const { service, upgrade_info } = show_component;
      if (service && service.type == 'add') {
        return [
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
                新增组件
              </div>
            )
          }
        ];
      } else if (upgrade_info && service.have_change) {
        return this.setData(upgrade_info);
      }
      return [
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
              组件无变更
            </div>
          )
        }
      ];
    }
    return [
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
            请选择要升级的版本
          </div>
        )
      }
    ];
  };

  setData = data => {
    const {
      ports,
      volumes,
      dep_services,
      dep_volumes,
      plugins,
      envs,
      app_config_groups,
      component_monitors,
      component_graphs,
      deploy_version
    } = data;
    const arr = [];
    const deployVersionChange = deploy_version && deploy_version.is_change;
    const isEnvs = envs && envs.add && envs.add.length > 0;
    const isPorts = ports && ports.add && ports.add.length > 0;
    const isDepServices =
      dep_services &&
      ((dep_services.add && dep_services.add.length > 0) ||
        (dep_services.del && dep_services.del.length > 0));
    const isDepVolumess =
      dep_volumes && dep_volumes.add && dep_volumes.add.length > 0;
    const isPlugins = plugins && plugins.add && plugins.add.length > 0;
    const isAppConfigGroups =
      app_config_groups &&
      app_config_groups.add &&
      app_config_groups.add.length > 0;
    const isComponentMonitors =
      component_monitors &&
      component_monitors.add &&
      component_monitors.add.length > 0;
    const isComponentGraphs =
      component_graphs &&
      component_graphs.add &&
      component_graphs.add.length > 0;

    const isVolumes =
      volumes &&
      ((volumes.add && volumes.add.length > 0) ||
        (volumes.upd && volumes.upd.length > 0));
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
          从 <span>{deploy_version.old}</span> 变更为{' '}
          <span>{deploy_version.new}</span>
        </div>
      );
    }

    if (isEnvs) {
      addArr(
        '环境变量',
        <div className={styles.textzt}>
          新增变量：
          {envs.add.map(item => {
            return <span key={item.attr_name}>{item.attr_name}</span>;
          })}
        </div>
      );
    }

    if (isPorts) {
      addArr(
        '端口',
        <div className={styles.textzt}>
          新增端口：
          {ports.add.map(item => {
            return <span key={item.container_port}>{item.container_port}</span>;
          })}
        </div>
      );
    }

    if (isVolumes) {
      addArr(
        '存储',
        <div>
          {volumes.add && volumes.add.length > 0 && (
            <div className={styles.textzt}>
              新增存储挂载：
              {volumes.add.map(item => {
                return <span key={item.volume_name}>{item.volume_name}</span>;
              })}
            </div>
          )}
          {volumes.upd && volumes.upd.length > 0 && (
            <div className={styles.textzt}>
              更新存储挂载：
              {volumes.upd.map(item => {
                return <span key={item.volume_name}>{item.volume_name}</span>;
              })}
            </div>
          )}
        </div>
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
        <div className={styles.textzt}>
          新增存储挂载：
          {dep_volumes.add.map(item => {
            return <span key={item.mnt_name}>{item.mnt_name}</span>;
          })}
        </div>
      );
    }

    if (isPlugins) {
      addArr(
        '插件',
        <div className={styles.textzt}>
          新增插件：
          {plugins.add.map(item => {
            return <span key={item.plugin_id}>{item.plugin_alias}</span>;
          })}
        </div>
      );
    }

    if (isAppConfigGroups) {
      addArr(
        '应用配置组',
        <div className={styles.textzt}>
          新增应用配置组：
          {app_config_groups.add.map(item => {
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
        <div className={styles.textzt}>
          新增监控点：
          {component_monitors.add.map(item => {
            return (
              <span key={item.service_show_name}>{item.service_show_name}</span>
            );
          })}
        </div>
      );
    }

    if (isComponentGraphs) {
      addArr(
        '监控图表',
        <div className={styles.textzt}>
          新增监控图表：
          {component_graphs.add.map(item => {
            return <span key={item.title}>{item.title}</span>;
          })}
        </div>
      );
    }

    return arr;
  };

  getUpgradeStatus = item => {
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
        if (item.service.type == 'upgrade' && item.service.have_change) {
          return (
            <Tooltip title="可升级">
              <Icon type="up" style={{ color: '#239B24' }} />
            </Tooltip>
          );
        }
        if (item.service.type == 'upgrade' && !item.service.can_upgrade) {
          return (
            <Tooltip title="新版本无该组件，不可升级">
              <Icon type="info-circle" />
            </Tooltip>
          );
        }
        if (item.service.type == 'upgrade') {
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
    if (record.status == 1) {
      return (
        <Alert
          showIcon
          message={`当前版本 ${record.old_version} ,升级任务未开始`}
        />
      );
    }
    if (record.status == 2) {
      return (
        <Alert
          showIcon
          type="warning"
          message={`从版本 ${record.old_version} 升级到版本 ${record.version} 的升级任务执行中`}
        />
      );
    }
    if (record.status == 3) {
      return (
        <Alert
          showIcon
          type="success"
          message={`从版本 ${record.old_version} 升级到版本 ${record.version} 的升级任务执行成功`}
        />
      );
    }
    if (record.status == 8) {
      return (
        <Alert
          showIcon
          type="error"
          message={`从版本 ${record.old_version} 升级到版本 ${record.version} 的升级任务执行失败`}
        />
      );
    }
    return null;
  };

  showBtnText = info => {
    switch (info.status) {
      case 1: {
        return '未升级';
      }
      case 2: {
        return '升级中';
      }
      case 6: {
        return '升级完成';
      }
      case 3: {
        return '升级完成';
      }
      case 8: {
        return '升级失败';
      }
      default: {
        return '升级';
      }
    }
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
    const { dispatch } = this.props;
    this.setState({ loadingUpgradeDetail: true });
    dispatch({
      type: 'global/getApplicationUpgradeDetail',
      payload: this.getParameter(),
      callback: res => {
        if (res && res.status_code === 200) {
          let upgrade_versions = [];
          if (res.bean && res.bean.versions) {
            upgrade_versions = res.bean.versions;
          }
          this.setState(
            {
              upgradeDetail: res.bean,
              record: res.bean.record,
              loadingUpgradeDetail: false
            },
            () => {
              const { record } = res.bean;
              if (record.version) {
                this.handleChangeVersion(record.version, () => {
                  if (record.status == 2) {
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
      }
    });
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
    const arr = this.getData();
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
    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        loading={loadingDetail}
        title="应用升级管理"
        content="当前应用内具有从组件库或应用商店安装而来的组件时，升级管理功能可用。若安装源的应用版本有变更则可以进行升级操作。"
        extraContent={null}
      >
        <Row style={{ marginBottom: '16px' }}>{this.getRecordShow()}</Row>
        <div style={{ padding: '10px', background: '#fff' }}>
          <Row gutter={24} style={{ margin: '0px' }}>
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
                        { required: true, message: '请选择需要升级的组件' }
                      ]
                    })(
                      <Checkbox.Group
                        onChange={this.onChange}
                        className={styles.zslGroup}
                      >
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
            <Col
              xs={{ span: 18, offset: 0 }}
              lg={{ span: 18, offset: 0 }}
              style={{ background: '#fff' }}
            >
              <div className={styles.zslbor}>
                <div className={styles.zslcen}>组件属性变更详情</div>
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
              disabled={!selectVersion || UpgradeLoading}
              loading={UpgradeLoading}
              style={{ marginRight: '5px' }}
            >
              {upgradeText}
            </Button>
          </Row>
        </div>
      </PageHeaderLayout>
    );
  }
}
