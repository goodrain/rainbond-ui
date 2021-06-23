/* eslint-disable react/sort-comp */
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Icon,
  Input,
  notification,
  Row,
  Select,
  Spin,
  Switch,
  Table
} from 'antd';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import moment from 'moment';
import React, { PureComponent } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Deleteimg from '../../../public/images/delete.png';
import InstanceList from '../../components/AppInstanceList';
import ConfirmModal from '../../components/ConfirmModal';
import NoPermTip from '../../components/NoPermTip';
import { horizontal, vertical } from '../../services/app';
import globalUtil from '../../utils/global';
import licenseUtil from '../../utils/license';
import sourceUtil from '../../utils/source';
import AddScaling from './component/AddScaling';
import styles from './Index.less';

const { Option } = Select;

@connect(
  ({ user, appControl, teamControl }) => ({
    currUser: user.currentUser,
    baseInfo: appControl.baseInfo,
    extendInfo: appControl.extendInfo,
    instances: appControl.pods,
    scaling: appControl.scalingRules,
    features: teamControl.features
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
      showEditAutoScaling: false,
      editRules: false,
      rulesList: [],
      sclaingRecord: [],
      page_num: 1,
      page_size: 10,
      enable: false,
      rulesInfo: false,
      total: 0,
      automaticTelescopic: false,
      addindicators: false,
      toDeleteMnt: false,
      deleteType: '',
      editInfo: false,
      automaLoading: true,
      errorMinNum: '',
      errorMaxNum: '',
      errorCpuValue: '',
      errorMemoryValue: '',
      enableGPU: licenseUtil.haveFeature(this.props.features, 'GPU')
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
  componentDidMount() {
    if (!this.canView()) return;
    this.getScalingRules();
    this.getScalingRecord();
    this.fetchInstanceInfo();
    this.fetchExtendInfo();
    this.timeClick = setInterval(() => {
      this.fetchInstanceInfo();
    }, 60000);
  }
  componentWillUnmount() {
    const { dispatch } = this.props;
    dispatch({ type: 'appControl/clearExtendInfo' });
    this.timeClick && clearInterval(this.timeClick);
  }
  // 是否可以浏览当前界面
  canView() {
    const {
      componentPermissions: { isTelescopic }
    } = this.props;
    return isTelescopic;
  }
  handleVertical = () => {
    const memory = this.props.form.getFieldValue('memory');
    const gpu = Number(this.props.form.getFieldValue('gpu'));
    vertical({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias,
      new_memory: memory,
      new_gpu: gpu
    }).then(data => {
      if (data && !data.status) {
        notification.success({ message: '操作成功，执行中' });
      }
    });
  };
  handleHorizontal = () => {
    const node = this.props.form.getFieldValue('node');
    horizontal({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias,
      new_node: node
    }).then(data => {
      if (data && !data.status) {
        notification.success({ message: '操作成功，执行中' });
      }
    });
  };

  openEditModal = type => {
    const { dispatch, appDetail } = this.props;
    if (type === 'add') {
      this.setState({ showEditAutoScaling: true });
    } else {
      const { id } = this.state;
      dispatch({
        type: 'appControl/telescopic',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          rule_id: id,
          service_alias: appDetail.service.service_alias
        },
        callback: res => {
          if (res) {
            if (type === 'close') {
              this.setState(
                {
                  rulesInfo: res.bean
                },
                () => {
                  this.shutDownAutoScaling();
                }
              );
            } else {
              this.setState(
                {
                  rulesInfo: res.bean
                },
                () => {
                  this.changeAutoScaling(this.state.rulesInfo);
                }
              );
            }
          }
        }
      });
    }
  };

  cancelEditAutoScaling = () => {
    this.setState({
      showEditAutoScaling: false,
      addindicators: false,
      rulesInfo: false
    });
  };

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
  fetchExtendInfo = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'appControl/fetchExtendInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias
      },
      handleError: res => {
        if (res && res.status === 403) {
          this.props.dispatch(routerRedux.push('/exception/403'));
        }
      }
    });
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

  openAutoScaling = values => {
    this.addScalingRules(values);
  };
  changeAutoScaling = values => {
    this.changeScalingRules(values);
  };
  /** 关闭伸缩 */

  shutDownAutoScaling = () => {
    this.setState({
      automaLoading: true
    });
    const { dispatch, appDetail } = this.props;
    const { rulesInfo, id } = this.state;
    const user = globalUtil.getCurrTeamName();
    const alias = appDetail.service.service_alias;
    dispatch({
      type: 'appControl/changeScalingRules',
      payload: {
        xpa_type: 'hpa',
        metrics: rulesInfo.metrics,
        maxNum: rulesInfo.max_replicas,
        minNum: rulesInfo.min_replicas,
        tenant_name: user,
        service_alias: alias,
        enable: false,
        rule_id: id
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({ message: '关闭成功' });
          this.setState(
            {
              showEditAutoScaling: false,
              addindicators: false,
              id: '',
              enable: false
            },
            () => {
              this.getScalingRules();
            }
          );
        } else {
          notification.success({ message: '关闭失败' });
        }
      }
    });
  };

  /** 添加伸缩 */
  addScalingRules = values => {
    this.setState({
      automaLoading: true
    });
    const { dispatch, appDetail } = this.props;
    const user = globalUtil.getCurrTeamName();
    const alias = appDetail.service.service_alias;

    const metrics = [
      {
        metric_type: 'resource_metrics',
        metric_name: values.selectMemory.indexOf('cpu') > -1 ? 'cpu' : 'memory',
        metric_target_type:
          values.selectMemory.indexOf('utilization') > -1
            ? 'utilization'
            : 'average_value',
        metric_target_value: values.value ? parseInt(values.value) : 0
      }
    ];
    dispatch({
      type: 'appControl/addScalingRules',
      payload: {
        enable: true,
        metrics,
        maxNum: parseInt(values.maxNum),
        minNum: parseInt(values.minNum),
        tenant_name: user,
        service_alias: alias
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({ message: '开启成功' });
          this.setState(
            { showEditAutoScaling: false, addindicators: false },
            () => {
              this.getScalingRules();
            }
          );
        } else {
          this.setState({
            showEditAutoScaling: false,
            addindicators: false,
            loading: false
          });
        }
      }
    });
  };
  /* 编辑伸缩规则 */
  changeScalingRules = values => {
    this.setState({
      automaLoading: true
    });
    const { dispatch, appDetail } = this.props;
    const {
      id,
      addindicators,
      rulesInfo,
      toDeleteMnt,
      automaticTelescopic
    } = this.state;
    const user = globalUtil.getCurrTeamName();
    const alias = appDetail.service.service_alias;
    const arr = rulesInfo && rulesInfo.metrics;

    if (addindicators) {
      arr.push({
        metric_type: 'resource_metrics',
        metric_name: values.selectMemory.indexOf('cpu') > -1 ? 'cpu' : 'memory',
        metric_target_type:
          values.selectMemory.indexOf('utilization') > -1
            ? 'utilization'
            : 'average_value',
        metric_target_value: values.value ? parseInt(values.value) : 0
      });
    }

    const _th = this;
    if (id) {
      dispatch({
        type: 'appControl/changeScalingRules',
        payload: {
          xpa_type: 'hpa',
          enable: true,
          maxNum: values.max_replicas
            ? Number(values.max_replicas)
            : Number(rulesInfo.max_replicas),
          minNum: values.min_replicas
            ? Number(values.min_replicas)
            : Number(rulesInfo.min_replicas),
          metrics: addindicators ? arr : values.metrics,
          tenant_name: user,
          service_alias: alias,
          rule_id: id
        },
        callback: res => {
          if (res && res.status_code === 200) {
            notification.success({
              message: toDeleteMnt
                ? '删除成功'
                : !automaticTelescopic
                ? '开启成功'
                : addindicators
                ? '添加成功'
                : '编辑成功'
            });

            _th.setState(
              {
                showEditAutoScaling: false,
                addindicators: false,
                toDeleteMnt: false,
                id: res.bean.id
              },
              () => {
                _th.getScalingRules();
              }
            );
          } else {
            notification.success({ message: '失败！' });
            _th.setState({ showEditAutoScaling: false, addindicators: false });
          }
        }
      });
    }
  };

  /* 获取伸缩规则 */
  getScalingRules = () => {
    const { dispatch, appDetail } = this.props;
    dispatch({
      type: 'appControl/getScalingRules',
      payload: {
        tenant_name: globalUtil.getCurrTeamName(),
        service_alias: appDetail.service.service_alias
      },
      callback: res => {
        if (res && res.status_code === 200) {
          const { list } = res;
          const datavalue = !!(list && list.length > 0);
          this.setState({
            enable: datavalue,
            rulesList: datavalue ? list : [],
            id: list && datavalue ? list[0].rule_id : '',
            editRules: !!(datavalue && list[0].enable),
            automaticTelescopic: !!(datavalue && list[0].enable),
            loading: false,
            automaLoading: false
          });
        } else {
          this.setState({
            loading: false,
            automaLoading: false
          });
        }
      }
    });
  };
  onPageChange = page_num => {
    this.setState({ page_num }, () => {
      this.getScalingRecord();
    });
  };
  /* 获取伸缩记录 */
  getScalingRecord = () => {
    const { dispatch, appDetail } = this.props;
    const { page_num, page_size } = this.state;
    dispatch({
      type: 'appControl/getScalingRecord',
      payload: {
        tenant_name: globalUtil.getCurrTeamName(),
        service_alias: appDetail.service.service_alias,
        page: page_num,
        page_size
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            total: res.bean.total,
            sclaingRecord: res.bean.data
          });
        }
      }
    });
  };

  saveForm = form => {
    this.form = form;
    const { rulesList, enable } = this.state;
    if (enable && this.form) {
      this.form.setFieldsValue(rulesList[0]);
    }
  };

  setMetric_target_value = (arr, types, Symbol = false) => {
    let values = 0;
    arr &&
      arr.length > 0 &&
      arr.map(item => {
        const { metric_name, metric_target_value, metric_target_type } = item;
        if (types === metric_name) {
          values = Symbol ? metric_target_type : metric_target_value;
          return metric_target_value;
        }
      });
    return values === undefined ? 0 : values;
  };

  setMetric_target_show = (arr, types, Symbol = false) => {
    let values = false;
    arr &&
      arr.length > 0 &&
      arr.map(item => {
        const { metric_name } = item;
        if (types === metric_name) {
          values = true;
        }
      });
    return values;
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
        service_alias: appDetail.service.service_alias
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
        errorDesc: '不能为空',
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
      errorDesc = '请输入数字';
    } else if (num <= 0 || num > 65535) {
      errorDesc = '输入范围1-65535';
    } else if (type === 'minNum' && num > Number(maxNum)) {
      errorDesc = '不能大于最大实例数';
    } else if (type === 'maxNum' && num < Number(minNum)) {
      errorDesc = '不能小于最小实例数';
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

  render() {
    if (!this.canView()) return <NoPermTip />;
    const { extendInfo, appAlias, form, appDetail } = this.props;
    let notAllowScaling = false;
    if (appDetail) {
      if (globalUtil.isSingletonComponent(appDetail.service.extend_method)) {
        notAllowScaling = true;
      }
    }
    const { teamName, regionName } = this.props.match.params;
    const { getFieldDecorator, getFieldValue } = form;
    const {
      page_num,
      page_size,
      total,
      loading,
      rulesList,
      sclaingRecord,
      rulesInfo,
      editRules,
      enable,
      automaticTelescopic,
      showEditAutoScaling,
      addindicators,
      errorMinNum,
      errorMaxNum,
      errorCpuValue,
      errorMemoryValue,
      enableGPU
    } = this.state;
    if (!extendInfo) {
      return null;
    }
    const minNumber = getFieldValue('minNum') || 0;

    const grctlCmd = `grctl service get ${appAlias} -t ${globalUtil.getCurrTeamName()}`;
    const MemoryList = [];
    const cpuUse =
      rulesList &&
      rulesList.length > 0 &&
      this.setMetric_target_show(rulesList[0].metrics, 'cpu');
    const memoryUse =
      rulesList &&
      rulesList.length > 0 &&
      this.setMetric_target_show(rulesList[0].metrics, 'memory');

    if (!cpuUse) {
      MemoryList.push(
        { value: 'cpuaverage_value', name: 'CPU使用量' },
        { value: 'cpuutilization', name: 'CPU使用率' }
      );
    }
    if (!memoryUse) {
      MemoryList.push(
        { value: 'memoryaverage_value', name: '内存使用量' },
        { value: 'memoryutilization', name: '内存使用率' }
      );
    }

    return (
      <div>
        <Card
          className={styles.InstancesCard}
          title="实例情况"
          extra={
            <a
              style={{ marginRight: '22px', color: '#1790FF' }}
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
            >
              刷新
            </a>
          }
        >
          {loading ? (
            <Spin tip="Loading...">
              <div style={{ minHeight: '190px' }} />
            </Spin>
          ) : (
            <div>
              <InstanceList
                handlePodClick={this.handlePodClick}
                list={this.state.instances}
                serviceID={this.props.appDetail.service.service_id}
              />
              <Divider />
              <div>
                <Row>
                  <Col span={24} style={{ display: 'flex' }}>
                    <span className={styles.commandText}>查询命令：</span>
                    <div className={styles.commandWidth}>
                      <Input
                        value={grctlCmd}
                        style={{ background: '#F9FAFC', textAlign: 'center' }}
                      />
                      <div className={styles.remindDesc}>
                        查询详细的组件实例信息,请复制查询命令到集群管理节点查询
                      </div>
                    </div>

                    <CopyToClipboard
                      text={grctlCmd}
                      onCopy={() => {
                        notification.success({ message: '复制成功' });
                      }}
                    >
                      <Button type="primary" style={{ marginLeft: 19 }}>
                        复制
                      </Button>
                    </CopyToClipboard>
                  </Col>
                </Row>
              </div>
            </div>
          )}
        </Card>

        {notAllowScaling && (
          <Alert
            style={{ marginTop: '16px' }}
            message={
              <p style={{ marginBottom: 0 }}>
                单实例类型组件不能进行水平伸缩，若需要请修改为相应的多实例组件类型。{' '}
                <Link
                  to={`/team/${teamName}/region/${regionName}/components/${appAlias}/setting`}
                >
                  去设置
                </Link>
              </p>
            }
            type="warning"
          />
        )}
        <Card className={styles.clerBorder} border={false} title="手动伸缩">
          {!enableGPU && (
            <Alert
              style={{ marginBottom: '16px' }}
              type="warning"
              closable
              message="当前产品授权不支持 GPU 调度，需要 GPU 共享调度能力请获取企业版授权。"
            />
          )}
          <Row gutter={16}>
            <Col lg={16} md={16} sm={24}>
              <Row>
                <Col span={20}>
                  <Form
                    layout="inline"
                    hideRequiredMark
                    className={styles.fromItem}
                  >
                    <Row>
                      <Col span={12}>
                        <Form.Item
                          labelCol={{ span: 6 }}
                          wrapperCol={{ span: 18 }}
                          label="内存"
                          style={{ width: '100%' }}
                        >
                          {getFieldDecorator('memory', {
                            initialValue: `${extendInfo.current_memory}`
                          })(
                            <Select
                              getPopupContainer={triggerNode =>
                                triggerNode.parentNode
                              }
                              className={styles.memorySelect}
                            >
                              {(extendInfo.memory_list || []).map(item => (
                                <Option key={item} value={item}>
                                  {sourceUtil.getMemoryAndUnit(item)}
                                </Option>
                              ))}
                            </Select>
                          )}{' '}
                        </Form.Item>
                        <div className={styles.remindDesc}>
                          CPU 限制值目前基于比例算法基于设置内存值计算。
                        </div>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          labelCol={{ span: 6 }}
                          wrapperCol={{ span: 18 }}
                          style={{ width: '100%' }}
                          label="GPU显存"
                        >
                          {getFieldDecorator('gpu', {
                            initialValue: `${extendInfo.current_gpu}`
                          })(
                            <Input
                              disabled={!enableGPU}
                              type="number"
                              addonAfter="MiB"
                            />
                          )}
                        </Form.Item>
                        <div className={styles.remindDesc}>
                          GPU
                          设置为0则不分配GPU资源，请求显存超过集群中单颗显卡的最大可用容量时无法进行调度。
                        </div>
                      </Col>
                    </Row>
                  </Form>
                </Col>
                <Col span={4}>
                  <Button
                    onClick={this.handleVertical}
                    size="default"
                    type="primary"
                    style={{
                      marginLeft: '14px',
                      marginTop: '4px'
                    }}
                  >
                    设置
                  </Button>
                </Col>
              </Row>
            </Col>
            <Col lg={8} md={8} sm={24}>
              <Row>
                <Col span={20}>
                  <Form
                    layout="inline"
                    hideRequiredMark
                    className={styles.fromItem}
                  >
                    <Form.Item
                      label="实例数量"
                      labelCol={{ span: 6 }}
                      wrapperCol={{ span: 18 }}
                      style={{ width: '100%' }}
                    >
                      {getFieldDecorator('node', {
                        initialValue: extendInfo.current_node
                      })(
                        <Select
                          getPopupContainer={triggerNode =>
                            triggerNode.parentNode
                          }
                          className={styles.nodeSelect}
                        >
                          {(extendInfo.node_list || []).map(item => (
                            <Option key={item} value={item}>
                              {item}
                            </Option>
                          ))}
                        </Select>
                      )}
                    </Form.Item>
                  </Form>
                </Col>
                <Col span={4}>
                  <Button
                    disabled={notAllowScaling}
                    onClick={this.handleHorizontal}
                    size="default"
                    type="primary"
                    style={{
                      marginLeft: '14px',
                      marginTop: '4px'
                    }}
                  >
                    设置
                  </Button>
                </Col>
              </Row>
              <Row>
                <Col span={24}>
                  <div className={styles.remindDesc}>
                    该值定义组件实例数量的初始值，实际值可能被自动伸缩调整
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>

        <Card
          style={{ marginTop: 16, border: 'none' }}
          className={styles.clearCard}
          title="自动伸缩"
        >
          <Row gutter={24} className={styles.automaTictelescopingBOX}>
            <Col span={12} className={styles.automaTictelescopingTitle}>
              <div>功能开关</div>
              <div>最小实例数</div>
              <div>最大实例数</div>
            </Col>
            <Col span={12} className={styles.automaTictelescopingTitle}>
              {cpuUse && (
                <div>
                  CPU使用
                  {this.setMetric_target_value(
                    rulesList[0].metrics,
                    'cpu',
                    true
                  ) === 'utilization'
                    ? '率'
                    : '量(m)'}
                  {memoryUse && (
                    <img
                      src={Deleteimg}
                      alt=""
                      onClick={() => {
                        this.handleDeleteMnt('cpu');
                      }}
                    />
                  )}
                </div>
              )}
              {memoryUse && (
                <div>
                  内存使用
                  {this.setMetric_target_value(
                    rulesList[0].metrics,
                    'memory',
                    true
                  ) === 'utilization'
                    ? '率'
                    : '量(Mi)'}
                  {cpuUse && (
                    <img
                      src={Deleteimg}
                      alt=""
                      onClick={() => {
                        this.handleDeleteMnt('memory');
                      }}
                    />
                  )}
                </div>
              )}
            </Col>
          </Row>
          <Spin spinning={this.state.automaLoading}>
            <Form
              layout="inline"
              hideRequiredMark
              className={styles.fromItem}
              onSubmit={this.handleSubmit}
            >
              <Row gutter={24} className={styles.automaTictelescoping}>
                <Col span={12}>
                  <div className={styles.automaTictelescopingContent}>
                    <Switch
                      disabled={notAllowScaling}
                      className={styles.automaTictelescopingSwitch}
                      checked={automaticTelescopic}
                      onClick={() => {
                        this.onChangeAutomaticTelescopic();
                      }}
                    />
                  </div>

                  <div className={styles.automaTictelescopingContent}>
                    {getFieldDecorator('minNum', {
                      initialValue:
                        (rulesList &&
                          rulesList.length > 0 &&
                          rulesList[0].min_replicas) ||
                        0
                    })(
                      <Input
                        disabled={!automaticTelescopic}
                        onBlur={e => {
                          this.handlerules('minNum');
                        }}
                      />
                    )}
                  </div>

                  <div className={styles.automaTictelescopingContent}>
                    {getFieldDecorator('maxNum', {
                      initialValue:
                        (rulesList &&
                          rulesList.length > 0 &&
                          rulesList[0].max_replicas) ||
                        1,
                      rules: [
                        {
                          pattern: new RegExp(/^[0-9]\d*$/, 'g'),
                          message: '请输入数字'
                        },
                        { required: true, message: '请输入最大数量' },
                        { validator: this.checkContent }
                      ]
                    })(
                      <Input
                        disabled={!automaticTelescopic}
                        min={minNumber}
                        onBlur={e => {
                          this.handlerules('maxNum');
                        }}
                      />
                    )}
                  </div>
                </Col>
                <Col span={12}>
                  {cpuUse && (
                    <div className={styles.automaTictelescopingContent}>
                      {getFieldDecorator('cpuValue', {
                        initialValue:
                          this.setMetric_target_value(
                            rulesList[0].metrics,
                            'cpu'
                          ) || 1,
                        rules: [
                          {
                            pattern: new RegExp(/^[0-9]\d*$/, 'g'),
                            message: '请输入数字'
                          },
                          { required: true, message: '请输入CPU' },
                          { validator: this.checkContent }
                        ]
                      })(
                        <Input
                          disabled={!automaticTelescopic}
                          onBlur={e => {
                            this.handlerules('cpuValue');
                          }}
                        />
                      )}
                    </div>
                  )}

                  {memoryUse && (
                    <div className={styles.automaTictelescopingContent}>
                      {getFieldDecorator('memoryValue', {
                        initialValue:
                          this.setMetric_target_value(
                            rulesList[0].metrics,
                            'memory'
                          ) || 1,
                        rules: [
                          {
                            pattern: new RegExp(/^[0-9]\d*$/, 'g'),
                            message: '请输入数字'
                          },
                          { required: true, message: '请输入内存' },
                          { validator: this.checkContent }
                        ]
                      })(
                        <Input
                          disabled={!automaticTelescopic}
                          onBlur={e => {
                            this.handlerules('memoryValue');
                          }}
                        />
                      )}
                    </div>
                  )}
                  {!cpuUse && <div style={{ height: '56px' }} />}
                  {!memoryUse && <div style={{ height: '56px' }} />}

                  <div className={styles.automaTictelescopingContent}>
                    <Icon
                      type="plus"
                      style={{ fontSize: '23px' }}
                      onClick={() => {
                        MemoryList.length > 0 &&
                          automaticTelescopic &&
                          this.handleAddIndicators('add');
                      }}
                    />
                  </div>
                </Col>
              </Row>
            </Form>
          </Spin>

          <Row gutter={24} className={styles.errorDescBox}>
            <Col span={12} className={styles.automaTictelescopingTitle}>
              <div />
              <div>
                <span className={styles.errorDesc}>{errorMinNum}</span>
              </div>
              <div>
                <span className={styles.errorDesc}> {errorMaxNum}</span>
              </div>
            </Col>
            <Col span={12} className={styles.automaTictelescopingTitle}>
              {cpuUse && (
                <div>
                  <span className={styles.errorDesc}>{errorCpuValue}</span>
                </div>
              )}
              {memoryUse && (
                <div>
                  <span className={styles.errorDesc}>{errorMemoryValue}</span>
                </div>
              )}
            </Col>
          </Row>
        </Card>
        {this.state.toDeleteMnt && (
          <ConfirmModal
            title="删除指标"
            desc="是否删除该指标?"
            onCancel={this.cancelDeleteMnt}
            onOk={() => {
              this.handleAddIndicators('delete');
            }}
          />
        )}
        {showEditAutoScaling && (
          <AddScaling
            data={rulesInfo}
            ref={this.saveForm}
            isvisable={showEditAutoScaling}
            isaddindicators={addindicators}
            memoryList={MemoryList}
            onClose={this.cancelEditAutoScaling}
            onOk={values => {
              enable
                ? this.changeAutoScaling(values)
                : this.openAutoScaling(values);
            }}
            editRules={editRules}
          />
        )}

        <Card
          className={styles.clearCard}
          style={{ marginTop: 16 }}
          title="水平伸缩记录"
        >
          <Table
            className={styles.horizontalExpansionRecordTable}
            dataSource={sclaingRecord}
            pagination={{
              current: page_num,
              pageSize: page_size,
              total,
              onChange: this.onPageChange
            }}
            columns={[
              {
                title: '时间',
                dataIndex: 'last_time',
                key: 'last_time',
                align: 'center',
                width: '18%',
                render: val => (
                  <div
                    style={{ wordWrap: 'break-word', wordBreak: 'break-word' }}
                  >
                    {moment(val)
                      .locale('zh-cn')
                      .format('YYYY-MM-DD HH:mm:ss')}
                  </div>
                )
              },
              {
                title: '伸缩详情',
                dataIndex: 'description',
                key: 'description',
                align: 'center',
                width: '43%',
                render: description => (
                  <div
                    style={{
                      textAlign: 'left',
                      wordWrap: 'break-word',
                      wordBreak: 'break-word'
                    }}
                  >
                    {description}
                  </div>
                )
              },
              {
                title: '类型',
                dataIndex: 'record_type',
                key: 'record_type',
                align: 'center',
                width: '13%',
                render: record_type => (
                  <div>
                    {record_type === 'hpa'
                      ? '水平自动伸缩'
                      : record_type === 'manual'
                      ? '手动伸缩'
                      : '垂直自动伸缩'}
                  </div>
                )
              },
              {
                title: '操作人',
                dataIndex: 'operator',
                key: 'operator',
                align: 'center',
                width: '13%',
                render: operator => {
                  return <span> {operator || '-'} </span>;
                }
              },
              {
                title: '原因',
                dataIndex: 'reason',
                align: 'center',
                key: 'reason',
                width: '13%'
              }
            ]}
          />
        </Card>
      </div>
    );
  }
}
