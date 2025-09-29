/* eslint-disable react/sort-comp */
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  notification,
  Row,
  Spin,
  Slider
} from 'antd';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import InstanceList from '../../components/AppInstanceList';
import NoPermTip from '../../components/NoPermTip';
import globalUtil from '../../utils/global';
import pluginUtil from '../../utils/pulginUtils';
import licenseUtil from '../../utils/license';
import styles from './Index.less';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import cookie from '../../utils/cookie';

// KubeBlocks Component 定制组件, source: ./src/pages/Component/expansion.js

@connect(
  ({ user, appControl, teamControl, rbdPlugin, kubeblocks }) => ({
    currUser: user.currentUser,
    baseInfo: appControl.baseInfo,
    instances: appControl.pods,
    scaling: appControl.scalingRules,
    features: teamControl.features,
    pluginList: rbdPlugin.pluginList,
    clusterDetail: kubeblocks.clusterDetail
  }),
  null,
  null,
  { pure: false, withRef: true }
)
@Form.create()
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      new_pods:
        this.props.instances && this.props.instances.new_pods
          ? this.props.instances.new_pods
          : [],
      old_pods:
        this.props.instances && this.props.instances.old_pods
          ? this.props.instances.old_pods
          : [],
      instances: [],
      loading: false,
      page_num: 1,
      page_size: 10,
      total: 0,
      enableGPU: licenseUtil.haveFeature(this.props.features, 'GPU'),
      language: cookie.get('language') === 'zh-CN' ? true : false,
      dataSource: [],
      showBill: pluginUtil.isInstallPlugin(this.props.pluginList, 'rainbond-bill'),
      memorySliderMin: 1,
      memorySliderMax: 8,
      cpuSliderMin: 1,
      cpuSliderMax: 7,
      memoryMarks: {
        1: '128M',
        2: '256M',
        3: '512M',
        4: '1G',
        5: '2G',
        6: '4G',
        7: '8G',
        8: '16G'
      },
      memoryMarksObj: {
        128: 1,
        256: 2,
        512: 3,
        1024: 4,
        2048: 5,
        4096: 6,
        8192: 7,
        16384: 8
      },
      cpuMarks: {
        1: '100m',
        2: '250m',
        3: '500m',
        4: '1Core',
        5: '2Core',
        6: '4Core',
        7: '8Core',
      },
      cpuMarksObj: {
        100: 1,
        250: 2,
        500: 3,
        1000: 4,
        2000: 5,
        4000: 6,
        8000: 7,
        16000: 8
      },
      cpuValue: 0,
      memoryValue: 0,
      pendingScaleBody: null
    };
  }
  componentWillReceiveProps(nextProps) {
    if (
      nextProps.instances.new_pods !== this.state.new_pods ||
      nextProps.instances.old_pods !== this.state.old_pods
    ) {
      this.setState({
        new_pods: nextProps.instances.new_pods || [],
        old_pods: nextProps.instances.old_pods || [],
        instances: (nextProps.instances.new_pods || []).concat(
          nextProps.instances.old_pods || []
        ),
        loading: false
      });
    } else {
      this.setState({
        loading: false
      });
    }
  }
  // 将 KubeBlocks 的数值初始化为滑块值与输入框值
  initFromClusterDetail = () => {
    const { clusterDetail } = this.props;
    const { memoryMarksObj, cpuMarksObj } = this.state;
    if (!clusterDetail || !clusterDetail.resource) return;
    const cpuMilli = clusterDetail.resource.cpu; // 毫核 m
    const memoryMi = clusterDetail.resource.memory; // Mi
    const replicas = clusterDetail.resource.replicas;
    const storageGi = clusterDetail.resource.storage; // Gi

    const cValue = cpuMarksObj[cpuMilli] !== undefined ? cpuMarksObj[cpuMilli] : this.state.cpuSliderMax;
    const mValue = memoryMarksObj[memoryMi] !== undefined ? memoryMarksObj[memoryMi] : this.state.memorySliderMax;
    this.setState({
      cpuValue: cValue,
      memoryValue: mValue,
      replicasValue: replicas || 1,
      storageGiValue: storageGi || 1
    });
  }

  toCpuStringFromMilli = (cpuMilli) => {
    if (!cpuMilli || Number(cpuMilli) === 0) return '0';
    return cpuMilli < 1000 ? `${cpuMilli}m` : String(cpuMilli / 1000);
  }

  toMemoryStringFromMi = (mi) => {
    if (!mi || Number(mi) === 0) return '0';
    return mi < 1024 ? `${mi}Mi` : `${mi / 1024}Gi`;
  }

  // 根据滑块索引获取毫核值
  getCpuMilliFromSliderIndex = (index) => {
    const { cpuMarksObj } = this.state;
    let result = 1000; // 默认 1Core
    if (!cpuMarksObj) return result;
    Object.keys(cpuMarksObj).forEach((key) => {
      if (cpuMarksObj[key] === index) {
        result = parseInt(key, 10);
      }
    });
    return result;
  }

  getMemoryMiFromSliderIndex = (index) => {
    const { memoryMarksObj } = this.state;
    let result = 1024; // 默认 1Gi
    if (!memoryMarksObj) return result;
    Object.keys(memoryMarksObj).forEach((key) => {
      if (memoryMarksObj[key] === index) {
        result = parseInt(key, 10);
      }
    });
    return result;
  }

  buildScaleResourceBody = (formValues) => {
    const { new_cpu, new_memory, replicas, storageGi } = formValues || {};

    const cpuMilli = this.getCpuMilliFromSliderIndex(new_cpu);
    const memoryMi = this.getMemoryMiFromSliderIndex(new_memory);

    const safeReplicas = Math.max(1, parseInt(replicas, 10) || 1);
    const safeStorageGi = Math.max(1, parseInt(storageGi, 10) || 1);

    return {
      cpu: this.toCpuStringFromMilli(cpuMilli),
      memory: this.toMemoryStringFromMi(memoryMi),
      storage_size: `${safeStorageGi}Gi`,
      replicas: safeReplicas
    };
  }
  componentDidMount() {
    if (!this.canView()) return;
    if (!this.state.showBill) {
      this.setState({
        memoryMarks: { 0: formatMessage({ id: 'appOverview.no_limit' }), ...this.state.memoryMarks, 9: '32G' },
        cpuMarks: { 0: formatMessage({ id: 'appOverview.no_limit' }), ...this.state.cpuMarks, 8: '16Core' },
        memoryMarksObj: { 0: 0, ...this.state.memoryMarksObj, 32768: 9 },
        cpuMarksObj: { 0: 0, ...this.state.cpuMarksObj, 16000: 8 },
        memorySliderMax: 9,
        memorySliderMin: 0,
        cpuSliderMax: 8,
        cpuSliderMin: 0
      })
    }
    if (this.props.appDetail && this.props.appDetail.service && this.props.appDetail.service.service_id) {
      // 获取实例信息
      this.fetchInstanceInfo();
      // 获取 KubeBlocks 集群详情
      const { dispatch } = this.props;
      dispatch({
        type: 'kubeblocks/getClusterDetail',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          region_name: globalUtil.getCurrRegionName(),
          service_id: this.props.appDetail.service.service_id
        },
        callback: (res) => {
          if (res && res.status_code === 200) {
            this.initFromClusterDetail();
          }
        }
      });
      this.timeClick = setInterval(() => {
        this.fetchInstanceInfo();
      }, 60000);
    }
  }
  componentWillUnmount() {
    const { dispatch } = this.props;
    dispatch({ type: 'appControl/clearExtendInfo' });
    this.timeClick && clearInterval(this.timeClick);
  }

  canView() {
    const {
      componentPermissions: { isTelescopic }
    } = this.props;
    return isTelescopic;
  }

  handlePodClick = (podName, manageName) => {
    const adPopup = window.open('about:blank');
    const { appAlias } = this.props;
    if (podName && manageName) {
      this.props.dispatch({
        type: 'appControl/managePod',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: appAlias,
          pod_name: podName,
          manage_name: manageName
        },
        callback: () => {
          adPopup.location.href = `/console/teams/${globalUtil.getCurrTeamName()}/apps/${appAlias}/docker_console/`;
        }
      });
    }
  };

  fetchInstanceInfo = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'appControl/fetchPods',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            // 接口变化
            instances: (res.list.new_pods || []).concat(
              res.list.old_pods || []
            ),
            loading: false
          });
        } else {
          this.setState({
            loading: false
          });
        }
      }
    });
  };



  saveForm = form => {
    this.form = form;
  };


  onChangeAutomaticTelescopic = () => {
    const { enable, automaticTelescopic } = this.state;
    this.openEditModal(automaticTelescopic ? 'close' : enable ? 'edit' : 'add');
  };

  handleSubmit = e => {
    e.preventDefault();
    const { enable } = this.state;
    this.props.form.validateFields((err, values) => {
      if (!err) {
        enable ? this.changeAutoScaling(values) : this.openAutoScaling(values);
      }
    });
  };

  handleAddIndicators = type => {
    const { dispatch, appDetail } = this.props;
    const { id, deleteType, editInfo } = this.state;

    dispatch({
      type: 'appControl/telescopic',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        rule_id: id,
        service_alias: appDetail && appDetail.service && appDetail.service.service_alias
      },
      callback: res => {
        if (res) {
          if (type === 'add') {
            this.setState({
              rulesInfo: res.bean,
              showEditAutoScaling: true,
              addindicators: true
            });
          } else if (type === 'delete') {
            const obj = res.bean;
            obj.metrics.splice(
              obj.metrics.findIndex(item => item.metric_name === deleteType),
              1
            );
            this.changeScalingRules(obj);
          } else if (editInfo) {
            const obj = res.bean;
            obj.max_replicas = Number(editInfo.maxNum);
            obj.min_replicas = Number(editInfo.minNum);
            const arr = res.bean.metrics;
            if (editInfo.cpuValue) {
              arr.map((item, index) => {
                if (item.metric_name == 'cpu') {
                  obj.metrics[index].metric_target_value = Number(
                    editInfo.cpuValue
                  );
                }
              });
            }

            if (editInfo.memoryValue) {
              arr.map((item, index) => {
                if (item.metric_name == 'memory') {
                  obj.metrics[index].metric_target_value = Number(
                    editInfo.memoryValue
                  );
                }
              });
            }
            this.changeScalingRules(obj);
          }
        }
      }
    });
  };
  cancelDeleteMnt = () => {
    this.setState({ toDeleteMnt: null, deleteType: '' });
  };

  handleDeleteMnt = deleteType => {
    this.setState({
      deleteType,
      toDeleteMnt: true
    });
  };

  handlerules = type => {
    const { form } = this.props;
    const { rulesList } = this.state;

    const { getFieldValue, validateFields } = form;
    const rulesInfo = rulesList && rulesList.length > 0 && rulesList[0];
    let num = getFieldValue(type);
    const maxNum = Number(getFieldValue('maxNum'));
    const minNum = Number(getFieldValue('minNum'));
    const cpuValue = Number(getFieldValue('cpuValue'));
    const memoryValue = Number(getFieldValue('memoryValue'));

    const max_replicas = rulesInfo && Number(rulesInfo.max_replicas);
    const min_replicas = rulesInfo && Number(rulesInfo.min_replicas);
    let rulesInfocpuValue = 1;
    let rulesInfomemoryValue = 1;
    if (rulesInfo && rulesInfo.metrics && rulesInfo.metrics.length > 0) {
      rulesInfo.metrics.map(item => {
        if (item.metric_name == 'cpu') {
          rulesInfocpuValue = Number(item.metric_target_value);
        }
        if (item.metric_name == 'memory') {
          rulesInfomemoryValue = Number(item.metric_target_value);
        }
      });
    }
    let errorDesc = '';

    const errorTypeDesc =
      type === 'maxNum'
        ? 'errorMaxNum'
        : type === 'minNum'
          ? 'errorMinNum'
          : type === 'cpuValue'
            ? 'errorCpuValue'
            : 'errorMemoryValue';

    if (num == '' || num == null) {
      this.setState({
        errorDesc: formatMessage({ id: 'componentOverview.body.Expansion.empty' }),
        [errorTypeDesc]: errorDesc,
        errorType: type
      });
      return false;
    }

    num = Number(num);
    const cpuUse =
      rulesInfo && this.setMetric_target_show(rulesInfo.metrics, 'cpu');
    const memoryUse =
      rulesInfo && this.setMetric_target_show(rulesInfo.metrics, 'memory');
    let repeat = true;
    if (
      maxNum === max_replicas &&
      minNum === min_replicas &&
      (cpuUse ? cpuValue === rulesInfocpuValue : true) &&
      (memoryUse ? memoryValue === rulesInfomemoryValue : true)
    ) {
      repeat = false;
    }
    const re = /^[0-9]+.?[0-9]*/;
    if (!re.test(num)) {
      errorDesc = `${formatMessage({ id: 'componentOverview.body.Expansion.enter' })}`;
    } else if (num <= 0 || num > 65535) {
      errorDesc = `${formatMessage({ id: 'componentOverview.body.Expansion.Input' })}`;
    } else if (type === 'minNum' && num > Number(maxNum)) {
      errorDesc = `${formatMessage({ id: 'componentOverview.body.Expansion.max' })}`;
    } else if (type === 'maxNum' && num < Number(minNum)) {
      errorDesc = `${formatMessage({ id: 'componentOverview.body.Expansion.min' })}`;
    } else {
      this.setState(
        {
          [errorTypeDesc]: '',
          errorType: type
        },
        () => {
          const {
            errorMinNum,
            errorMaxNum,
            errorCpuValue,
            errorMemoryValue
          } = this.state;

          if (
            repeat &&
            errorMinNum === '' &&
            errorMaxNum === '' &&
            errorCpuValue === '' &&
            errorMemoryValue === ''
          ) {
            validateFields((_, values) => {
              this.setState(
                {
                  editInfo: values
                },
                () => {
                  this.handleAddIndicators('edit');
                }
              );
            });
          }
          return null;
        }
      );
    }

    this.setState({
      [errorTypeDesc]: errorDesc,
      errorType: type
    });
  };
  selectAfterChange = (val) => {
    this.setState({
      setUnit: val
    })
  }
  handleFromData = () => {
    const { form, dispatch, appDetail } = this.props;
    form.validateFields((err, values) => {
      if (err) return;
      // 与创建接口一致的资源段转换（仅数据，不发请求）
      const resourceBody = this.buildScaleResourceBody(values);

      const serviceId = appDetail?.service?.service_id;
      if (!serviceId) {
        notification.warning({ message: '未找到服务 ID，无法执行伸缩' });
        return;
      }
      this.setState({ pendingScaleBody: resourceBody });
      dispatch({
        type: 'kubeblocks/scaleCluster',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          region_name: globalUtil.getCurrRegionName(),
          service_id: serviceId,
          body: {
            cpu: resourceBody.cpu,
            memory: resourceBody.memory,
            storage: resourceBody.storage_size,
            replicas: resourceBody.replicas,
            rbdService: { service_id: serviceId }
          }
        },
        callback: (res) => {
          if (res && res.status_code === 200) {
            notification.success({ message: formatMessage({ id: 'notification.success.save' }) });
            // 刷新详情，恢复只读
            dispatch({
              type: 'kubeblocks/getClusterDetail',
              payload: {
                team_name: globalUtil.getCurrTeamName(),
                region_name: globalUtil.getCurrRegionName(),
                service_id: serviceId
              },
            });
            this.setState({ editBillInfo: false });
            // 同步 sliders 显示
            this.initFromClusterDetail();
          } else {
            notification.warning({ message: res?.msg_show || '伸缩失败' });
          }
        }
      });
    });
  }
  handleMemoryChange = (value) => {
    const { form } = this.props;
    const memoryToCpuMap = {
      0: 0,
      1: 1,
      2: 1,
      3: 2,
      4: 3,
      5: 4,
      6: 5,
      7: 6,
      8: 7,
      9: 8
    };
    const newCpuValue = memoryToCpuMap[value] !== undefined ? memoryToCpuMap[value] : 8;
    this.setState({
      memoryValue: value,
      cpuValue: newCpuValue
    }, () => {
      // 在状态更新完成后更新表单值
      form.setFieldsValue({
        new_memory: value,
        new_cpu: newCpuValue
      });
    });
  }
  handleCpuChange = (value) => {
    const { form } = this.props;
    this.setState({
      cpuValue: value
    }, () => {
      // 在状态更新完成后更新表单值
      form.setFieldsValue({
        new_cpu: value
      });
    });
  }

  getFormValues = (data, type) => {
    const { cpuMarksObj, memoryMarksObj } = this.state
    let num = 0
    if (type == 'memory') {
      Object.keys(memoryMarksObj).forEach(item => {
        if (memoryMarksObj[item] == data) {
          num = item
        }
      })
    } else {
      Object.keys(cpuMarksObj).forEach(item => {
        if (cpuMarksObj[item] == data) {
          num = item
        }
      })
    }
    return num
  }
  render() {
    if (!this.canView()) return <NoPermTip />;
    const { clusterDetail, appAlias, form, appDetail, method } = this.props;
    let notAllowScaling = false;
    if (appDetail) {
      if (globalUtil.isSingletonComponent(method)) {
        notAllowScaling = true;
      }
    }
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    const { getFieldDecorator, getFieldValue } = form;
    const {
      page_num,
      page_size,
      total,
      loading,
      enableGPU,
      language,
      dataSource,
      setUnit,
      memoryMarks,
      cpuMarks,
      cpuValue,
      memoryValue,
      showBill,
      memorySliderMax,
      memorySliderMin,
      cpuSliderMax,
      cpuSliderMin
    } = this.state;
    // 初始化一次
    if (clusterDetail && this.state.replicasValue === undefined) {
      this.initFromClusterDetail();
    }
    if (!clusterDetail) {
      return null;
    }
    const minNumber = getFieldValue('minNum') || 0;
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 3
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 21
        }
      }
    };
    const grctlCmd = `grctl service get ${appAlias} -t ${globalUtil.getCurrTeamName()}`;
    const descBox = text => <div className={styles.remindDesc}>{text}</div>;
    return (
      <div>
        {false && <Card
          className={styles.InstancesCard}
          title={<FormattedMessage id='componentOverview.body.Expansion.instance' />}
          extra={
            <Button
              onClick={() => {
                this.setState(
                  {
                    loading: true
                  },
                  () => {
                    this.fetchInstanceInfo();
                  }
                );
              }}
              icon='reload'
            >
              <FormattedMessage id='componentOverview.body.Expansion.refresh' />
            </Button>
          }
        >
          {loading ? (
            <Spin tip="Loading...">
              <div style={{ minHeight: '190px' }} />
            </Spin>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 24 }}>
              <InstanceList
                method={method}
                handlePodClick={this.handlePodClick}
                list={this.state.instances}
                serviceID={this.props.appDetail && this.props.appDetail.service && this.props.appDetail.service.service_id}
                k8s_component_name={
                  this.props.appDetail &&
                  this.props.appDetail.service &&
                  this.props.appDetail.service.k8s_component_name
                }
              />
            </div>
          )}
        </Card>}

        {notAllowScaling && (
          <Alert
            style={{ marginTop: '16px' }}
            message={
              <p style={{ marginBottom: 0 }}>
                <FormattedMessage id='componentOverview.body.Expansion.modify' />
                {' '}
                <Link
                  to={`/team/${teamName}/region/${regionName}/components/${appAlias}/setting`}
                >
                  <FormattedMessage id='componentOverview.body.Expansion.set' />
                </Link>
              </p>
            }
            type="warning"
          />
        )}
        {/* 手动伸缩   */}
        <Card
          className={styles.clerBorder}
          border={false}
          title={<FormattedMessage id='componentOverview.body.Expansion.telescopic' />}
          extra={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {this.state.editBillInfo ?
                <div style={{ marginLeft: 10 }}>
                  <Button type='primary' style={{ marginRight: 10 }} onClick={this.handleFromData}>
                    {formatMessage({ id: 'appPublish.table.btn.confirm' })}
                  </Button>
                  <Button onClick={() => {
                    this.initFromClusterDetail();
                    this.setState({ editBillInfo: false });
                  }}>
                    {formatMessage({ id: 'appPublish.table.btn.cancel' })}
                  </Button>
                </div>
                :
                <Button icon='edit' onClick={() => this.setState({ editBillInfo: true })}>
                  {formatMessage({ id: 'componentOverview.body.tab.env.table.column.edit' })}
                </Button>
              }
            </div>
          }
        >
          <Form hideRequiredMark className={styles.fromItem} onSubmit={this.handleFromData} >
            <Form.Item {...formItemLayout} label={formatMessage({ id: 'componentCheck.advanced.setup.basic_info.label.min_memory' })}>
              {getFieldDecorator('new_memory', {
                initialValue: memoryValue,
              })(
                <Slider
                  disabled={!this.state.editBillInfo}
                  style={{ width: '500px' }}
                  marks={memoryMarks}
                  min={memorySliderMin}
                  max={memorySliderMax}
                  step={null}
                  onChange={this.handleMemoryChange}
                  tooltipVisible={false}
                />
              )}
            </Form.Item>
            <Form.Item {...formItemLayout} label={formatMessage({ id: 'componentCheck.advanced.setup.basic_info.label.min_cpu' })}>
              {getFieldDecorator('new_cpu', {
                initialValue: cpuValue,
              })(
                <Slider
                  disabled={!this.state.editBillInfo}
                  style={{ width: '500px' }}
                  marks={cpuMarks}
                  min={cpuSliderMin}
                  max={cpuSliderMax}
                  step={null}
                  onChange={this.handleCpuChange}
                  tooltipVisible={false}
                />
              )}
            </Form.Item>
            <Form.Item
              label={<FormattedMessage id='componentOverview.body.Expansion.number' />}
              {...formItemLayout}
            >
              {getFieldDecorator('replicas', {
                initialValue: this.state.replicasValue || 1
              })(
                <InputNumber
                  disabled={!this.state.editBillInfo}
                  style={{ width: 200 }}
                  min={1}
                  max={65535}
                  onChange={this.handleReplicasChange}
                />
              )}
            </Form.Item>

            <Form.Item
              label={formatMessage({ id: 'componentCheck.advanced.setup.storage_setting.label.volume_capacity' })}
              {...formItemLayout}
            >
              {getFieldDecorator('storageGi', {
                initialValue: this.state.storageGiValue || 1
              })(
                <InputNumber
                  disabled={!this.state.editBillInfo}
                  style={{ width: 200 }}
                  min={1}
                />
              )}
              <span style={{ marginLeft: 8 }}>Gi</span>
            </Form.Item>
          </Form>
        </Card>
      </div >
    );
  }
}
