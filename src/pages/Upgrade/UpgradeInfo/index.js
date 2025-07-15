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
  Tooltip,
  notification
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import { getApplicationUpgradeDetail } from '../../../services/app';
import pageheaderSvg from '@/utils/pageHeaderSvg';
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
      upgradeText: formatMessage({id:'helmAppInstall.index.up'}),
      textState: 1,
      service_id: [],
      upgradeLoading: false,
      rollbackLoading: false,
      conshow: true,
      isAppOrComponent: false
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
            upgrade_component_ids.push('upgrade_info')
          }
          const appObj = {}
          const service = {
                          can_upgrade: true,
                          current_version: "1.0",
                          have_change: true,
                          service_cname: "应用属性变更",
                          service_id: "upgrade_info",
                          service_key: "upgrade_info",
                          type: "upgrade"
                        }
          appObj.service = service
          appObj.upgrade_info = res.bean.upgrade_info
          this.setState(
            {
              upgradeInfo: res.list || [],
              upgradeListLoading: false,
              upgrade_component_ids,
              selectVersion: true
            },
            () => {
              const { upgradeInfo } = this.state
              if(res.bean.upgrade_info && res.bean.upgrade_info.k8s_resources){
                upgradeInfo.push(appObj)
              }
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
      return Box(formatMessage({id:'helmAppInstall.UpgradeInfo.add_com'}));
    }
    if (show_component) {
      const { service, upgrade_info } = show_component;
      if (service && service.type == 'add') {
        return Box(formatMessage({id:'helmAppInstall.UpgradeInfo.add_com'}));
      } else if (upgrade_info && service.have_change) {
        return this.setData(upgrade_info);
      }
      return Box(formatMessage({id:'helmAppInstall.UpgradeInfo.change'}));
    }
    return Box(isUpgrade ? formatMessage({id:'helmAppInstall.UpgradeInfo.select'}) : formatMessage({id:'helmAppInstall.UpgradeInfo.no_updatae'}));
  };
  handleAdd = obj => {
    return obj && obj.add && obj.add.length > 0;
  };

  handleUpd = obj => {
    return obj && obj.upd && obj.upd.length > 0;
  };

  handleDel = obj => {
    return obj && obj.delete && obj.delete.length > 0;
  };

  handleData = obj => {
    return this.handleAdd(obj) || this.handleUpd(obj) || this.handleDel(obj);
  };

  handleBox = (minTitle, obj, key, childKey, filterMap) => {
    const list = [];
    if (this.handleAdd(obj)) {
      list.push('add');
    }
    if (this.handleUpd(obj)) {
      list.push('upd');
    }
    if (this.handleDel(obj)) {
      list.push('delete');
    }
    const operationMap = {
      add: formatMessage({id:'helmAppInstall.UpgradeInfo.add'}),
      upd: formatMessage({id:'helmAppInstall.UpgradeInfo.updata'}),
      delete: formatMessage({id:'helmAppInstall.UpgradeInfo.remove'})
    };

    return (
      <div className={styles.textzt}>
        {list.length > 0 &&
          list.map(items => {
            return (
              <div key={items}>
                {operationMap[items] || ''}
                {minTitle}：
                {obj[items].map(item => {
                  const contents = childKey ? item[key][childKey] : item[key];
                  return (
                    <span key={item[key]}>
                      {filterMap ? filterMap[contents] || contents : contents}
                    </span>
                  );
                })}
              </div>
            );
          })}
      </div>
    );
  };

  setData = data => {
    const {
      probes,
      connect_infos,
      component_k8s_attributes,
      k8s_resources,
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

    const isDepServices = this.handleData(dep_services);

    const isProbes = this.handleData(probes);

    const addAppConfigGroups = this.handleAdd(app_config_groups);

    const isAppConfigGroups = this.handleData(app_config_groups);

    const isComponentGraphs = this.handleData(component_graphs);

    const isComponentMonitors = this.handleData(component_monitors);

    const isEnvs = this.handleData(envs);

    const isPluginDeps = this.handleData(plugin_deps);

    const isConnectInfos = this.handleData(connect_infos);

    const isPlugins = this.handleData(plugins);

    const isDepVolumess = this.handleData(dep_volumes);

    const isPorts = this.handleData(ports);

    const isVolumes = this.handleData(volumes);

    const isComponent_k8s_attributes = this.handleData(component_k8s_attributes);

    const isK8s_resources = this.handleData(k8s_resources);

    function addArr(title, description) {
      arr.push({
        title,
        description
      });
    }
    if (isProbes) {
      const filterMap = {
        liveness: formatMessage({id:'helmAppInstall.UpgradeInfo.survival'}),
        readiness: formatMessage({id:'helmAppInstall.UpgradeInfo.ready'})
      };
      addArr(`${formatMessage({id:'helmAppInstall.UpgradeInfo.healthy'})}`, this.handleBox(null, probes, 'mode', null, filterMap));
    }

    if (deployVersionChange) {
      addArr(
        `${formatMessage({id:'helmAppInstall.UpgradeInfo.edition'})}`,
        <div className={styles.textzt}>
          {formatMessage({id:'helmAppInstall.UpgradeInfo.from'})} <span>{deploy_version.old}</span> {formatMessage({id:'helmAppInstall.UpgradeInfo.to'})}
          <span>{deploy_version.new}</span>
        </div>
      );
    }

    if (isConnectInfos) {
      addArr(`${formatMessage({id:'helmAppInstall.UpgradeInfo.info'})}`, this.handleBox(null, connect_infos, 'attr_name'));
    }

    if (isPluginDeps) {
      addArr(
        `${formatMessage({id:'helmAppInstall.UpgradeInfo.unit'})}`,
        this.handleBox(null, plugin_deps, 'plugin', 'plugin_alias')
      );
    }

    if (isEnvs) {
      addArr(`${formatMessage({id:'helmAppInstall.UpgradeInfo.variable'})}`, this.handleBox(null, envs, 'attr_name'));
    }

    if (isPorts) {
      addArr(`${formatMessage({id:'helmAppInstall.UpgradeInfo.port'})}`, this.handleBox(null, ports, 'container_port'));
    }

    if (isVolumes) {
      addArr(`${formatMessage({id:'helmAppInstall.UpgradeInfo.storage'})}`, this.handleBox(`${formatMessage({id:'helmAppInstall.UpgradeInfo.mount'})}`, volumes, 'volume_name'));
    }

    if (isDepServices) {
      addArr(
        `${formatMessage({id:'helmAppInstall.UpgradeInfo.comm'})}`,
        <div>
          {dep_services.add && dep_services.add.length > 0 && (
            <div className={styles.textzt}>
              {formatMessage({id:'helmAppInstall.UpgradeInfo.add_from'})}
              {dep_services.add.map(item => {
                return <span key={item.service_id}>{item.service_cname}</span>;
              })}
              {formatMessage({id:'helmAppInstall.UpgradeInfo.rely_on'})}
            </div>
          )}
          {dep_services.del && dep_services.del.length > 0 && (
            <div className={styles.textzt}>
              {formatMessage({id:'helmAppInstall.UpgradeInfo.remove_on'})}
              {dep_services.del.map(item => {
                return <span key={item.service_id}>{item.service_cname}</span>;
              })}
              {formatMessage({id:'helmAppInstall.UpgradeInfo.rely_on'})}
            </div>
          )}
        </div>
      );
    }

    if (isDepVolumess) {
      addArr(`${formatMessage({id:'helmAppInstall.UpgradeInfo.dependent'})}`, this.handleBox('存储挂载'`${formatMessage({id:'helmAppInstall.UpgradeInfo.add_com'})}`, dep_volumes, 'mnt_name'));
    }

    if (isPlugins) {
      addArr(`${formatMessage({id:'helmAppInstall.UpgradeInfo.unit'})}`, this.handleBox(null, plugins, 'plugin_alias'));
    }

    if (isAppConfigGroups) {
      addArr(
        `${formatMessage({id:'helmAppInstall.UpgradeInfo.comm_group'})}`,
        <div className={styles.textzt}>
          {addAppConfigGroups ? '新增'`${formatMessage({id:'helmAppInstall.UpgradeInfo.add_com'})}` : '更新'`${formatMessage({id:'helmAppInstall.UpgradeInfo.add_com'})}`}
          {formatMessage({id:'helmAppInstall.UpgradeInfo.app_group'})}
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
        `${formatMessage({id:'helmAppInstall.UpgradeInfo.point'})}`,
        this.handleBox(null, component_monitors, 'service_show_name')
      );
    }

    if (isComponentGraphs) {
      addArr(`${formatMessage({id:'helmAppInstall.UpgradeInfo.point_Chart'})}`, this.handleBox(null, component_graphs, 'title'));
    }

    if(isComponent_k8s_attributes){
      addArr(`${formatMessage({id:'helmAppInstall.UpgradeInfo.k8s'})}`, this.handleBox(null, component_k8s_attributes, 'name'));
    }

    if(isK8s_resources){
      addArr(`${formatMessage({id:'helmAppInstall.UpgradeInfo.k8s'})}`, this.handleBox(null, k8s_resources, 'name'));
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
          <Tooltip title={formatMessage({id:'helmAppInstall.UpgradeInfo.hand'})}>
            <Icon type="close" style={{ color: 'red' }} />
          </Tooltip>
        );
      case 3:
        return (
          <Tooltip title={formatMessage({id:'helmAppInstall.UpgradeInfo.success'})}>
            <Icon type="check" style={{ color: '#239B24' }} />
          </Tooltip>
        );
      default:
        if (isUpgrade && item.service.have_change) {
          return (
            <Tooltip title={formatMessage({id:'helmAppInstall.UpgradeInfo.can_updata'})}>
              <Icon type="up" style={{ color: '#239B24' }} />
            </Tooltip>
          );
        }
        if (isUpgrade && !item.service.can_upgrade) {
          return (
            <Tooltip title={formatMessage({id:'helmAppInstall.UpgradeInfo.Not_upgradeable'})}>
              <Icon type="info-circle" />
            </Tooltip>
          );
        }
        if (isUpgrade) {
          return (
            <Tooltip title={formatMessage({id:'helmAppInstall.UpgradeInfo.comm_no_updata'})}>
              <Icon type="up" style={{ color: '#239B24' }} />
            </Tooltip>
          );
        }
        return (
          <Tooltip title={formatMessage({id:'helmAppInstall.UpgradeInfo.add_comm'})}>
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
      1: formatMessage({id:'helmAppInstall.UpgradeInfo.not_started'}),
      2: formatMessage({id:'helmAppInstall.UpgradeInfo.implementation'}),
      3: formatMessage({id:'helmAppInstall.UpgradeInfo.succeeded'}),
      8: formatMessage({id:'helmAppInstall.UpgradeInfo.failed'}),
      10: formatMessage({id:'helmAppInstall.UpgradeInfo.Deployment_failed'})
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
          ${status === 1 ? formatMessage({id:'helmAppInstall.UpgradeInfo.now_version'}) : formatMessage({id:'helmAppInstall.UpgradeInfo.form_version'})} 
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
        notification.error({
          message: err.data.msg_show
        })
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
    if(select_component.service.service_id === 'upgrade_info'){
      this.setState({
        isAppOrComponent: true
      })
    }else{
      this.setState({
        isAppOrComponent: false
      })
    }
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
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/index`
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
      selectVersion,
      isAppOrComponent
    } = this.state;
    const JumpAddress = `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${group_id}/overview`;
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
        title={formatMessage({id:'helmAppInstall.UpgradeInfo.Administration'})}
        content={formatMessage({id:'helmAppInstall.UpgradeInfo.application'})}
        titleSvg={pageheaderSvg.getPageHeaderSvg('upgrade', 20)}
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
                        label={formatMessage({id:'helmAppInstall.UpgradeInfo.updata_to'})}
                        style={{ width: '100%' }}
                      >
                        {getFieldDecorator('upgradeVersions', {
                          initialValue: upgrade_versions && upgrade_versions[0],
                          rules: [{ required: false, message: formatMessage({id:'helmAppInstall.UpgradeInfo.select'}) }]
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
                        <span>&nbsp;&nbsp;{formatMessage({id:'helmAppInstall.UpgradeInfo.version'})}</span>
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
                              message: formatMessage({id:'helmAppInstall.UpgradeInfo.select_comm'})
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
                    <div className={styles.zslcen}>{isAppOrComponent ? formatMessage({id:'helmAppInstall.UpgradeInfo.app_Details'}) : formatMessage({id:'helmAppInstall.UpgradeInfo.comm_Details'})}</div>
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
                {formatMessage({id:'helmAppInstall.UpgradeInfo.back'})}
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
                  {formatMessage({id:'helmAppInstall.UpgradeInfo.retry'})}
                </Button>
              )}
            </Row>
          </div>
        </Spin>
      </PageHeaderLayout>
    );
  }
}
