/* eslint-disable eqeqeq */
/* eslint-disable react/jsx-indent */
/* eslint-disable react/no-unused-state */
/* eslint-disable camelcase */
/* eslint-disable no-nested-ternary */
import {
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
import globalUtil from '../../utils/global';
import styles from './index.less';
import infoUtil from './info-util';

const { Option } = Select;

// eslint-disable-next-line react/no-redundant-should-component-update
@Form.create()
@connect()
export default class AppList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      type: '',
      indexs: 0,
      infoObj: props.data ? props.data : '',
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
    this.generateUpdateOrder();
    this.getUpdatedVersion();
  }

  shouldComponentUpdate() {
    return true;
  }

  // 生成升级订单
  // eslint-disable-next-line react/sort-comp
  generateUpdateOrder = () => {
    const { group_id, data, activeKey, dispatch } = this.props;
    const { infoObj } = this.state;
    const payload = {
      team_name: globalUtil.getCurrTeamName(),
      group_id,
      group_key: infoObj.group_key
    };
    if (infoObj && (infoObj.source === 'market' || infoObj.is_from_cloud)) {
      payload.marketName = infoObj.market_name;
      payload.isFromCloud = true;
    }
    dispatch({
      type: 'global/CloudAppUpdateOrder',
      payload,
      callback: res => {
        if (res && res.status_code === 200) {
          if (activeKey != 2) {
            this.setState({
              infoObj: res.bean ? res.bean : data
            });
          } else {
            this.setState({
              textState: data.status
            });
          }
          if (activeKey == 2 && infoObj.status == 4) {
            this.setState(
              {
                record_id: infoObj.ID
              },
              () => {
                this.getUpgradeRecordsInfo('Rollback');
              }
            );
          } else if (activeKey == 2 && infoObj.status == 2) {
            this.setState(
              {
                record_id: infoObj.ID
              },
              () => {
                this.getUpgradeRecordsInfo();
              }
            );
          } else if (activeKey == 2) {
            this.setState({
              text: infoUtil.getStatusCNS(infoObj.status)
            });
          }

          if (infoObj.not_upgrade_record_id) {
            if (
              infoObj.not_upgrade_record_status &&
              infoObj.not_upgrade_record_status == 2
            ) {
              this.setState(
                {
                  record_id: infoObj.not_upgrade_record_id
                },
                () => {
                  this.getUpgradeRecordsInfo();
                }
              );
            }
          }
        }
      }
    });
  };

  //  查询某云市应用的更新版本

  getUpdatedVersion = Rollback => {
    const { group_id } = this.props;
    const { infoObj } = this.state;
    this.props.dispatch({
      type: 'global/CloudAppUpdatedVersion',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id,
        group_key: infoObj.group_key
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState(
            {
              upgradeVersions: res.list
            },
            () => {
              if (!Rollback && this.props.activeKey == 2) {
                const { service_record } = infoObj;
                const { indexs } = this.state;
                if (service_record && service_record.length > 0) {
                  const service_ids = [];

                  for (let i = 0; i < service_record.length; i++) {
                    service_ids.push(service_record[i].service_id);
                  }
                  const type =
                    service_record[
                      indexs > service_record.length - 1 ? 0 : indexs
                    ].service_id;

                  const upgrade_info = service_record[indexs];
                  this.setState({
                    upgradeInfo: service_record,
                    type,
                    upgrade_info,
                    service_id: service_ids,
                    conshow: null
                  });
                }
              } else {
                this.getUpdatedInfo(res.list.length > 0 && res.list[0]);
              }
            }
          );
        }
      }
    });
  };

  // 查询某云市应用下组件的更新信息
  getUpdatedInfo = versions => {
    const version = this.props.form.getFieldValue('upgradeVersions');
    const { group_id, dispatch } = this.props;
    const { infoObj } = this.state;
    const payload = {
      team_name: globalUtil.getCurrTeamName(),
      group_id,
      group_key: infoObj.group_key,
      version: versions || version
    };
    if (infoObj && infoObj.is_from_cloud) {
      payload.marketName = infoObj.market_name;
    }
    dispatch({
      type: 'global/CloudAppUpdatedInfo',
      payload,
      callback: res => {
        if (res && res.status_code === 200) {
          const { indexs } = this.state;
          const { list } = res;
          if (list && list.length > 0) {
            const service_id = [];
            for (let i = 0; i < list.length; i++) {
              if (
                list[i].upgrade_info &&
                JSON.stringify(list[i].upgrade_info) != '{}'
              ) {
                service_id.push(list[i].service.service_id);
              }
            }
            const type =
              list[indexs > list.length - 1 ? 0 : indexs].service.service_id;
            const upgrade_info = list[indexs];
            this.setState({
              upgradeInfo: list,
              type,
              upgrade_info,
              conshow: null,
              service_id
            });
          }
        }
      }
    });
  };

  handleChangeVersions = value => {
    this.props.form.setFieldsValue({ upgradeVersions: value });
    this.getUpdatedInfo(value);
  };

  onChange = () => {
    // console.log('checked = ', checkedValues);
  };
  handleType = (type, index) => {
    if (this.state.type !== type.service_id) {
      const { upgradeInfo } = this.state;
      this.setState({
        type: type.service_id,
        indexs: index,
        upgrade_info: upgradeInfo[index]
      });
      // this.setState({ type: type.service_id, indexs: index, upgrade_info: service.type=="upgrade"? upgradeInfo[index]:{type:"add"} });
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
  // 创建升级任务
  createUpgradeTasks = values => {
    const { group_id, form, dispatch } = this.props;
    const { infoObj, upgradeInfo } = this.state;
    const version = form.getFieldValue('upgradeVersions');
    const arr = [];
    const indexc = [];
    for (let i = 0; i < upgradeInfo.length; i++) {
      // eslint-disable-next-line no-plusplus
      for (let k = 0; k < values.services.length; k++) {
        if (upgradeInfo[i].service.service_id == values.services[k]) {
          arr.push(upgradeInfo[i]);
          indexc.push(i);
        }
      }
    }
    dispatch({
      type: 'global/CloudAppUpdatedTasks',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id,
        group_key: infoObj.group_key,
        version,
        services: arr,
        upgrade_record_id: infoObj.ID
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
      }
    });
  };

  // // 查询某应用的更新记录列表
  // getUpgradeRecordsList = () => {
  //     const { group_id } = this.props;
  //     this.props.dispatch({
  //         type: 'global/CloudAppUpdateRecordsList',
  //         payload: {
  //             team_name: globalUtil.getCurrTeamName(),
  //             group_id
  //         },
  //         callback: (res) => {
  //             if (res && res.status_code === 200) {
  //                 const { indexs } = this.state;
  //                 if (res.list && res.list.length > 0) {
  //                     this.setState({
  //                         upgradeRecords: res.list,
  //                     }, () => {
  //                         res.list.map((item) => {
  //                             const { status } = item;
  //                             if (status != (3 || 5 || 8 || 9)) {
  //                                 setTimeout(() => {
  //                                     this.getUpgradeRecordsList();
  //                                 }, 3000)
  //                             }
  //                         })
  //                     })
  //                 }
  //             }
  //         }
  //     });
  // }

  // 查询某应用的更新记录详情
  getUpgradeRecordsInfo = Rollback => {
    const { group_id, dispatch } = this.props;
    const { record_id, upgradeText } = this.state;
    dispatch({
      type: 'global/CloudAppUpdateRecordsInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id,
        record_id
      },
      callback: res => {
        if (res && res.status_code === 200) {
          const info = res.bean;
          this.setState(
            {
              upgradeRecords: info.service_record,
              textState: info.status,
              text: infoUtil.getStatusCNS(info.status),
              upgradeText: Rollback
                ? upgradeText
                : info.status == 1
                ? '未升级'
                : info.status == 2
                ? '升级中'
                : info.status == 3
                ? '升级完成'
                : info.status == 6
                ? '部分升级'
                : info.status == 8
                ? '升级失败'
                : '升级',
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
                  this.getUpgradeRecordsInfo(Rollback);
                }, 3000);
              }
            }
          );
        }
      }
    });
  };

  getData = () => {
    if (
      this.state.upgrade_info &&
      JSON.stringify(this.state.upgrade_info) != '{}'
    ) {
      const { upgrade_info, update, service } = this.state.upgrade_info;

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
      } else if (upgrade_info && JSON.stringify(upgrade_info) != '{}') {
        return this.setData(upgrade_info);
      } else if (update && JSON.stringify(update) != '{}') {
        return this.setData(update);
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
              组件无变更，无需升级
            </div>
          )
        }
      ];

      // if (service.type == "add") {
      //     let images = deploy_version ? {
      //         title: '运行环境版本',
      //         description: (<div>新增版本号：{deploy_version}</div>),
      //         // actions: [<a>删除</a>],
      //     } : ""
      //     let app_versions = service_env_map_list && service_env_map_list.length > 0 ? {
      //         title: '环境变量',
      //         description: (<div>新增变量：{service_env_map_list.map((item, index) => {
      //             return <span key={index}>{item.name}</span>
      //         })}</div>),
      //         // actions: [<a>删除</a>],
      //     } : ""
      //     let deploy_versions = port_map_list && port_map_list.length > 0 ? {
      //         title: '端口',
      //         description: (<div>新增端口：{port_map_list.map((item, index) => {
      //             return <span key={index}>{item.container_port}</span>
      //         })}</div>),
      //         // actions: [<a>删除</a>],
      //     } : ""
      //     let volumess = mnt_relation_list && mnt_relation_list.length > 0 ? {
      //         title: '存储',
      //         description: (<div>新增存储挂载：{mnt_relation_list.map((item, index) => {
      //             return <span key={index}>{item.mnt_dir}</span>
      //         })}</div>),
      //         // actions: [<a>删除</a>],
      //     } : ""
      //     let yl = dep_service_map_list && dep_service_map_list.length > 0 ? {
      //         title: '依赖组件',
      //         description: (<div>
      //                 <p>新增对 {dep_service_map_list.map((item, index) => {
      //                     return <span key={index}>{item.dep_service_key}</span>
      //                 })} 组件的依赖</p>
      //             </div>
      //         ),
      //         // actions: [<a>删除</a>],
      //     } : ""

      //     let arr = [
      //         images,
      //         app_versions,
      //         volumess,
      //         yl,
      //         deploy_versions,
      //         // pluginss,
      //     ]
      //     for (var i = 0; i < arr.length; i++) {
      //         if (arr[i] == "" || typeof (arr[i]) == "undefined") {
      //             arr.splice(i, 1);
      //             i = i - 1;
      //         }
      //     }
      //     return arr

      // } else {

      // let deploy_versions = deploy_version && deploy_version.is_change ? {
      //     title: '运行环境版本',
      //     description: (<div>从{deploy_version.old}变更为{deploy_version.new}</div>),
      // } : ""
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
            组件无变更，无需升级
          </div>
        )
      }
    ];
  };

  setData = data => {
    const {
      image,
      ports,
      volumes,
      dep_services,
      dep_volumes,
      plugins,
      envs,
      app_config_groups,
      component_monitors,
      component_graphs
    } = data;
    const arr = [];
    const isImages = image && image.is_change;
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
    if (isImages) {
      addArr(
        '镜像',
        <div className={styles.textzt}>
          从 <span>{image.old}</span> 变更为 <span>{image.new}</span>
        </div>
      );
    }

    if (isEnvs) {
      addArr(
        '环境变量',
        <div className={styles.textzt}>
          新增变量：
          {envs.add.map((item, index) => {
            return <span key={index}>{item.attr_name}</span>;
          })}
        </div>
      );
    }

    if (isPorts) {
      addArr(
        '端口',
        <div className={styles.textzt}>
          新增端口：
          {ports.add.map((item, index) => {
            return <span key={index}>{item.container_port}</span>;
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
              {volumes.add.map((item, index) => {
                return <span key={index}>{item.volume_name}</span>;
              })}
            </div>
          )}
          {volumes.upd && volumes.upd.length > 0 && (
            <div className={styles.textzt}>
              更新存储挂载：
              {volumes.upd.map((item, index) => {
                return <span key={index}>{item.volume_name}</span>;
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
              {dep_services.add.map((item, index) => {
                return <span key={index}>{item.service_cname}</span>;
              })}
              组件的依赖
            </div>
          )}
          {dep_services.del && dep_services.del.length > 0 && (
            <div className={styles.textzt}>
              移除对
              {dep_services.del.map((item, index) => {
                return <span key={index}>{item.service_cname}</span>;
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
          {dep_volumes.add.map((item, index) => {
            return <span key={index}>{item.mnt_name}</span>;
          })}
        </div>
      );
    }

    if (isPlugins) {
      addArr(
        '插件',
        <div className={styles.textzt}>
          新增插件：
          {plugins.add.map((item, index) => {
            return <span key={index}>{item.plugin_alias}</span>;
          })}
        </div>
      );
    }

    if (isAppConfigGroups) {
      addArr(
        '应用配置组',
        <div className={styles.textzt}>
          新增应用配置组：
          {app_config_groups.add.map((item, index) => {
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
                <span key={index}>{item.name}</span>;
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
          {component_monitors.add.map((item, index) => {
            return <span key={index}>{item.service_show_name}</span>;
          })}
        </div>
      );
    }

    if (isComponentGraphs) {
      addArr(
        '监控图表',
        <div className={styles.textzt}>
          新增监控图表：
          {component_graphs.add.map((item, index) => {
            return <span key={index}>{item.title}</span>;
          })}
        </div>
      );
    }

    return arr;
  };

  //  回滚某次更新Rollback
  getUpgradeRollback = () => {
    const { group_id, form, dispatch } = this.props;
    const { rollbackLoading } = this.state;
    form.validateFields((err, values) => {
      if (!err && !rollbackLoading) {
        this.setState(
          {
            rollbackLoading: true
          },
          () => {
            dispatch({
              type: 'global/CloudAppUpdateRollback',
              payload: {
                team_name: globalUtil.getCurrTeamName(),
                group_id,
                record_id: this.state.infoObj.ID,
                service_ids: values.services
              },
              callback: res => {
                if (res && res.status_code === 200) {
                  this.setState(
                    {
                      record_id: res.bean.ID
                    },
                    () => {
                      this.getUpgradeRecordsInfo('Rollback');
                    }
                  );
                }
              }
            });
          }
        );
      }
    });
  };

  render() {
    const { dispatch, activeKey, group_id, form } = this.props;
    const { getFieldDecorator } = form;
    const {
      type,
      infoObj,
      upgradeVersions,
      upgradeInfo,
      upgradeRecords,
      text,
      upgradeText,
      textState,
      service_id,
      conshow,
      upgradeLoading,
      rollbackLoading
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
    const RollbackLoading =
      !!(textState == 2 || textState == 4) || rollbackLoading;
    return (
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
                    initialValue:
                      infoObj && infoObj.version
                        ? infoObj.version
                        : upgradeVersions &&
                          upgradeVersions.length > 0 &&
                          upgradeVersions[0],
                    rules: [{ required: false, message: '请选择' }]
                  })(
                    <Select
                      getPopupContainer={triggerNode => triggerNode.parentNode}
                      disabled={textState != 1}
                      size="small"
                      style={{ width: 120 }}
                      onChange={this.handleChangeVersions}
                    >
                      {upgradeVersions &&
                        upgradeVersions.length > 0 &&
                        upgradeVersions.map((item, index) => {
                          return (
                            <Option value={item} key={index}>
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
                    initialValue: service_id,
                    force: true,
                    rules: [
                      { required: true, message: '请选择需要升级的云市应用' }
                    ]
                  })(
                    <Checkbox.Group
                      onChange={this.onChange}
                      className={styles.zslGroup}
                    >
                      {conshow ? (
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
                            upgradeInfo.map((item, index) => {
                              const {
                                service,
                                upgrade_info,
                                update,
                                service_id: serviceId
                              } = item;
                              const upgrades = upgradeRecords.filter(
                                items =>
                                  items.service_id ===
                                  ((service && service.service_id) || serviceId)
                              );

                              let upgradeRecordsStatus = 1;
                              if (upgrades && upgrades.length > 0) {
                                upgradeRecordsStatus = upgrades[0].status;
                              }

                              return (
                                <Col
                                  span={24}
                                  className={`${styles.zslMt} ${
                                    type ===
                                    (service
                                      ? service.service_id
                                      : item.service_id)
                                      ? styles.active
                                      : ''
                                  }`}
                                  onClick={() => {
                                    this.handleType(service || item, index);
                                  }}
                                >
                                  <div style={{ width: '100%' }}>
                                    <Checkbox
                                      disabled={
                                        !!(
                                          JSON.stringify(
                                            upgrade_info || update
                                          ) == '{}' ||
                                          (upgrade_info
                                            ? upgrade_info == null
                                            : update == null)
                                        )
                                      }
                                      value={
                                        service
                                          ? service.service_id
                                          : item.service_id
                                      }
                                      style={{ width: '30px' }}
                                    />
                                    {service
                                      ? service.service_cname
                                      : item.service_cname}
                                  </div>

                                  <div>
                                    {upgrades &&
                                    upgrades.length > 0 &&
                                    (upgrade_info != null || update != null) &&
                                    JSON.stringify(upgrade_info || update) !=
                                      '{}' ? (
                                      <div>
                                        {upgradeRecordsStatus == 1 ||
                                        upgradeRecordsStatus == 2 ||
                                        upgradeRecordsStatus == 4 ? (
                                          <Icon
                                            type="sync"
                                            style={{ color: '#1890ff' }}
                                            spin
                                          />
                                        ) : upgradeRecordsStatus == 3 ||
                                          (upgradeRecordsStatus == 5 &&
                                            upgradeRecordsStatus <= 7) ? (
                                          <Tooltip title="成功">
                                            <Icon
                                              type="check"
                                              style={{ color: '#239B24' }}
                                            />
                                          </Tooltip>
                                        ) : upgradeRecordsStatus == 8 ? (
                                          <Tooltip title="失败">
                                            <Icon
                                              type="close"
                                              style={{ color: 'red' }}
                                            />
                                          </Tooltip>
                                        ) : (
                                          <Tooltip title="成功">
                                            <Icon
                                              type="check"
                                              style={{ color: '#239B24' }}
                                            />
                                          </Tooltip>
                                        )}
                                      </div>
                                    ) : (
                                      service &&
                                      service.type && (
                                        <div>
                                          {service.type == 'upgrade' &&
                                          (upgrade_info != null ||
                                            update != null) &&
                                          JSON.stringify(
                                            upgrade_info || update
                                          ) != '{}' ? (
                                            <Tooltip title="可升级">
                                              <Icon
                                                type="up"
                                                style={{ color: '#239B24' }}
                                              />
                                            </Tooltip>
                                          ) : (upgrade_info != null ||
                                              update != null) &&
                                            JSON.stringify(
                                              upgrade_info || update
                                            ) != '{}' ? (
                                            <Tooltip title="新增组件">
                                              <Icon
                                                type="plus"
                                                style={{ color: '#239B24' }}
                                              />
                                            </Tooltip>
                                          ) : (
                                            ''
                                          )}
                                        </div>
                                      )
                                    )}
                                  </div>
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
                {conshow ? (
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
            style={{ marginRight: '5px' }}
            onClick={() => {
              this.props.setInfoShow();
            }}
          >
            返回
          </Button>

          {activeKey == 1 && (
            <Button
              type="primary"
              onClick={() => {
                if (textState != 1 && textState != 2 && textState != 4) {
                  dispatch(routerRedux.push(JumpAddress));
                } else {
                  this.handleSubmit();
                }
              }}
              disabled={UpgradeLoading}
              loading={UpgradeLoading}
              style={{ marginRight: '5px' }}
            >
              {upgradeText}
            </Button>
          )}

          {((textState != 1 && textState != 2) || activeKey == 2) && (
            <Button
              type="primary"
              onClick={() => {
                if (
                  textState != 3 &&
                  textState != 4 &&
                  textState != 8 &&
                  ((activeKey == 1 && textState != 6) ||
                    (activeKey == 2 && textState != 1 && textState != 2))
                ) {
                  dispatch(routerRedux.push(JumpAddress));
                } else {
                  this.getUpgradeRollback();
                }
              }}
              style={{ marginRight: '5px' }}
              disabled={RollbackLoading}
              loading={RollbackLoading}
            >
              {textState == 3 || textState == 6 || textState == 8
                ? '回滚'
                : text}
            </Button>
          )}
        </Row>
      </div>
    );
  }
}
