import React, { PureComponent } from "react";
import { connect } from "dva";
import { routerRedux } from "dva/router";
import { CopyToClipboard } from "react-copy-to-clipboard";
import moment from "moment";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Select,
  notification,
  Spin,
  Divider,
  Input,
  Table,
  Empty
} from "antd";
import sourceUtil from "../../utils/source";
import { horizontal, vertical } from "../../services/app";
import globalUtil from "../../utils/global";
import appUtil from "../../utils/app";
import NoPermTip from "../../components/NoPermTip";
import InstanceList from "../../components/AppInstanceList";
import AddScaling from "../App/component/AddScaling";
import Cpuimg from "../../../public/images/automatic-telescoping-cpu.png";
import Ramimg from "../../../public/images/automatic-telescoping-ram.png";
import Maximg from "../../../public/images/automatic-telescoping-max.png";
import Minimg from "../../../public/images/automatic-telescoping-min.png";
import styles from "./Index.less";

const { Option } = Select;
const { Search } = Input;

@connect(
  ({ user, appControl }) => ({
    currUser: user.currentUser,
    baseInfo: appControl.baseInfo,
    extendInfo: appControl.extendInfo,
    instances: appControl.pods,
    scaling: appControl.scalingRules
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
      node: 0,
      memory: 0,
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
      total: 0
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
    // this.timeClick = setInterval(() => {
    //   this.fetchInstanceInfo();
    // }, 60000);
  }
  componentWillUnmount() {
    const { dispatch } = this.props;
    dispatch({ type: "appControl/clearExtendInfo" });
    // clearInterval(this.timeClick);
  }
  // 是否可以浏览当前界面
  canView() {
    return appUtil.canManageAppExtend(this.props.appDetail);
  }
  handleVertical = () => {
    const memory = this.props.form.getFieldValue("memory");
    vertical({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias,
      new_memory: memory
    }).then(data => {
      if (data && !data.status) {
        notification.success({ message: "操作成功，执行中" });
      }
    });
  };
  handleHorizontal = () => {
    const node = this.props.form.getFieldValue("node");
    horizontal({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias,
      new_node: node
    }).then(data => {
      if (data && !data.status) {
        notification.success({ message: "操作成功，执行中" });
      }
    });
  };

  openEditModal = (type) => {
    const { dispatch, appDetail } = this.props
    if (type === 'add') {
      this.setState({ showEditAutoScaling: true });
    } else {
      const { id } = this.state
      dispatch({
        type: "appControl/telescopic",
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          rule_id: id,
          service_alias: appDetail.service.service_alias
        },
        callback: (res) => {
          if (res) {
            if (type === 'close') {
              this.setState({
                rulesInfo: res.bean,
              }, () => {
                this.shutDownAutoScaling()
              })
            } else {
              this.setState({
                rulesInfo: res.bean,
                showEditAutoScaling: true
              })
            }

          }
        }
      });
    }
  };

  cancelEditAutoScaling = () => {
    this.setState({ showEditAutoScaling: false, rulesInfo: false, });
  };

  handlePodClick = (podName, manageName) => {
    let adPopup = window.open("about:blank");
    const appAlias = this.props.appAlias;
    // if (podName && manageName) {
    this.props.dispatch({
      type: "appControl/managePod",
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
    // }
  };
  fetchExtendInfo = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "appControl/fetchExtendInfo",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias
      },
      handleError: res => {
        if (res && res.status === 403) {
          this.props.dispatch(routerRedux.push("/exception/403"));
        }
      }
    });
  };
  fetchInstanceInfo = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "appControl/fetchPods",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias
      },
      callback: res => {
        if (res && res._code == 200) {
          this.setState({
            //接口变化
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
  /**关闭伸缩 */



  shutDownAutoScaling = () => {
    const { dispatch, appDetail } = this.props;
    const { rulesInfo, id } = this.state
    const user = globalUtil.getCurrTeamName();
    const alias = appDetail.service.service_alias;
    dispatch({
      type: "appControl/changeScalingRules",
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
        if (res && res._code == 200) {
          notification.success({ message: "关闭成功" });
          this.setState({
            showEditAutoScaling: false, id: "",
            enable: false
          }, () => {
            this.getScalingRules();
          });
        } else {
          notification.success({ message: "关闭失败" });
        }
      }
    });
  };

  /**添加伸缩 */
  addScalingRules = values => {
    const { dispatch, appDetail } = this.props;
    const user = globalUtil.getCurrTeamName();
    const alias = appDetail.service.service_alias;
    // const { enable } = this.state;
    dispatch({
      type: "appControl/addScalingRules",
      payload: {
        enable: true,
        selectMemory: values.selectMemory,
        selectCpu: values.selectCpu,
        cpuValue: parseInt(values.cpuValue),
        memoryValue: parseInt(values.memoryValue),
        maxNum: parseInt(values.maxNum),
        minNum: parseInt(values.minNum),
        tenant_name: user,
        service_alias: alias,
      },
      callback: res => {
        if (res && res._code == 200) {
          notification.success({ message: "开通成功" });
          this.setState({ showEditAutoScaling: false }, () => {
            this.getScalingRules();
          });
        } else {
          this.setState({ showEditAutoScaling: false, loading: false });
        }
      }
    });
  };
  /*编辑伸缩规则 */
  changeScalingRules = values => {
    const { dispatch, appDetail } = this.props;
    const { id } = this.state
    const user = globalUtil.getCurrTeamName();
    const alias = appDetail.service.service_alias;
    if (id) {
      dispatch({
        type: "appControl/changeScalingRules",
        payload: {
          xpa_type: 'hpa',
          enable: true,
          selectMemory: values.selectMemory,
          selectCpu: values.selectCpu,
          cpuValue: parseInt(values.cpuValue),
          memoryValue: parseInt(values.memoryValue),
          maxNum: parseInt(values.maxNum),
          minNum: parseInt(values.minNum),
          tenant_name: user,
          service_alias: alias,
          rule_id: id
        },
        callback: res => {
          if (res) {
            notification.success({ message: "成功！" });
            this.getScalingRules();
            this.setState({
              showEditAutoScaling: false,
              id: res.bean.id
            });
          } else {
            notification.success({ message: "失败！" });
            this.setState({ showEditAutoScaling: false });
          }
        }
      });
    }

  };

  /*获取伸缩规则 */
  getScalingRules = () => {
    const { dispatch, appDetail } = this.props;
    dispatch({
      type: "appControl/getScalingRules",
      payload: {
        tenant_name: globalUtil.getCurrTeamName(),
        service_alias: appDetail.service.service_alias
      },
      callback: res => {
        if (res && res._code == 200) {
          console.log('rse', res)
          const { list } = res
          let datavalue = list && list.length > 0 ? true : false
          this.setState({
            enable: datavalue,
            rulesList: datavalue ? list : [],
            id: list && datavalue ? list[0].rule_id : '',
            editRules: datavalue && list[0].enable ? true : false,
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
  onPageChange = (page_num) => {
    this.setState({ page_num }, () => {
      this.getScalingRecord();
    });
  }
  /*获取伸缩记录 */
  getScalingRecord = () => {
    const { dispatch, appDetail } = this.props;
    const { page_num, page_size } = this.state;
    dispatch({
      type: "appControl/getScalingRecord",
      payload: {
        tenant_name: globalUtil.getCurrTeamName(),
        service_alias: appDetail.service.service_alias,
        page: page_num,
        page_size: page_size
      },
      callback: res => {
        if (res && res._code == 200) {
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
    const { rulesList, enable } = this.state
    if (enable && this.form) {
      this.form.setFieldsValue(rulesList[0]);
    }
  };

  setMetric_target_value = (arr, types, Symbol = false) => {

    let values = '';
    arr &&
      arr.length > 0 &&
      arr.map(item => {
        const { metric_name, metric_target_value, metric_target_type } = item;
        if (types === metric_name) {
          let prompt = metric_target_type === 'utilization' ? "%" : types === 'cpu' ? "m" : "Mi"
          let symboltext = metric_target_type === 'utilization' ? "率" : "量"

          if (Symbol) {
            values = symboltext
          } else {
            values = metric_target_value + prompt
          }

          return metric_target_value;
        }
      });
    return values === undefined ? 0 : values;
  }


  render() {
    if (!this.canView()) return <NoPermTip />;
    const { extendInfo, appAlias, form } = this.props;
    const { getFieldDecorator } = form;
    const { page_num, page_size, total, loading, rulesList, sclaingRecord, rulesInfo, editRules, enable, showEditAutoScaling } = this.state;
    if (!extendInfo) {
      return null;
    }
    const grctlCmd =
      "grctl service get " +
      appAlias +
      " -t " +
      globalUtil.getCurrTeamName();
    return (
      <div>
        <Card
          title="实例情况"
          extra={
            <a
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
              href="javascript:;"
            >
              刷新
            </a>
          }
        >
          {loading ? (
            <Spin tip="Loading...">
              <div style={{ minHeight: "190px" }} />
            </Spin>
          ) : (
              <div>
                <InstanceList
                  handlePodClick={this.handlePodClick}
                  list={this.state.instances}
                />
                <Divider />
                <div>
                  <Row>
                    <Col span={12}>
                      <span style={{ lineHeight: "32px" }}>
                        查询详细的组件实例信息，请复制以下查询命令到Rainbond管理节点查询：
                    </span>
                    </Col>
                    <Col span={12}>
                      <Input style={{ width: "70%" }} value={grctlCmd} />
                      <CopyToClipboard
                        text={grctlCmd}
                        onCopy={() => {
                          notification.success({ message: "复制成功" });
                        }}
                      >
                        <Button
                          type="primary"
                          style={{ width: "25%", marginLeft: 16 }}
                        >
                          复制查询命令
                      </Button>
                      </CopyToClipboard>
                    </Col>
                  </Row>
                </div>
              </div>
            )}
        </Card>
        <Card style={{ marginTop: 16 }} title="手动伸缩">
          <Row gutter={16}>
            <Col lg={12} md={12} sm={24}>
              <Form layout="inline" hideRequiredMark>
                <Form.Item label="内存">
                  {getFieldDecorator("memory", {
                    initialValue: `${extendInfo.current_memory}`
                  })(
                    <Select
                      style={{
                        width: 200
                      }}
                    >
                      {(extendInfo.memory_list || []).map(item => (
                        <Option key={item} value={item}>
                          {sourceUtil.getMemoryAndUnit(item)}
                        </Option>
                      ))}
                    </Select>
                  )}{" "}
                  <Button
                    onClick={this.handleVertical}
                    size="default"
                    type="primary"
                  >
                    设置
                  </Button>
                </Form.Item>
              </Form>
            </Col>
            <Col lg={12} md={12} sm={24}>
              <Form layout="inline" hideRequiredMark>
                <Form.Item label="实例数量">
                  {getFieldDecorator("node", {
                    initialValue: extendInfo.current_node
                  })(
                    <Select
                      style={{
                        width: 200
                      }}
                    >
                      {(extendInfo.node_list || []).map(item => (
                        <Option key={item} value={item}>
                          {item}
                        </Option>
                      ))}
                    </Select>
                  )}{" "}
                  <Button
                    onClick={this.handleHorizontal}
                    size="default"
                    type="primary"
                  >
                    设置
                  </Button>
                </Form.Item>
              </Form>
            </Col>
          </Row>
        </Card>

        <Card
          style={{ marginTop: 16, border: 'none' }}
          className={styles.clearCard}
          title="自动伸缩"
          extra={
            enable && editRules ? (
              <div>
                <Button
                  onClick={() => { this.openEditModal('edit') }}
                  type="default"
                  style={{ marginRight: '10px' }}
                >
                  编辑
                </Button>
                <Button onClick={() => { this.openEditModal('close') }} type="primary">
                  关闭
                </Button>
              </div>
            ) : (
                <Button onClick={() => { this.openEditModal(enable ? 'edit' : 'add') }} type="primary">
                  开启
              </Button>
              )
          }
        >

          {
            rulesList && rulesList.length > 0 ? <Row gutter={24} className={styles.automaTictelescoping}>
              <Col span={6} className={styles.automaTictelescopingContent}>
                <div>
                  <img src={Minimg} alt="" />
                </div>
                <div>
                  <div>最小个数</div>
                  <div>{rulesList[0].min_replicas || '-'}</div>
                </div>

              </Col>
              <Col span={6} className={styles.automaTictelescopingContent}>
                <div>
                  <img src={Maximg} alt="" />
                </div>
                <div>
                  <div>最大个数</div>
                  <div>{rulesList[0].max_replicas || '-'}</div>
                </div>
              </Col>
              <Col span={6} className={styles.automaTictelescopingContent}>
                <div>
                  <img src={Cpuimg} alt="" />
                </div>
                <div>
                  <div>cpu使用{this.setMetric_target_value(rulesList[0].metrics, 'cpu', true) || '率'}</div>
                  <div>{this.setMetric_target_value(rulesList[0].metrics, 'cpu') || '-'}</div>
                </div>
              </Col>
              <Col span={6} className={styles.automaTictelescopingContent}>
                <div>
                  <img src={Ramimg} alt="" />
                </div>
                <div>
                  <div>内存使用{this.setMetric_target_value(rulesList[0].metrics, 'memory', true) || '量'}</div>
                  <div>{this.setMetric_target_value(rulesList[0].metrics, 'memory') || '-'}</div>
                </div>
              </Col>
            </Row> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          }

        </Card>

        {showEditAutoScaling && (
          <AddScaling
            data={rulesInfo}
            ref={this.saveForm}
            isvisable={showEditAutoScaling}
            onClose={this.cancelEditAutoScaling}
            onOk={values => {
              enable
                ? this.changeAutoScaling(values)
                : this.openAutoScaling(values);
            }}
            editRules={editRules}
          />
        )}

        <Card className={styles.clearCard} style={{ marginTop: 16 }} title="水平伸缩记录">
          <Table
            className={styles.horizontalExpansionRecordTable}
            dataSource={sclaingRecord}
            pagination={{
              current: page_num,
              pageSize: page_size,
              total: total,
              onChange: this.onPageChange,
            }}
            columns={[
              {
                title: "时间",
                dataIndex: "create_time",
                key: "create_time",
                align: "center",
                width: '15%',
                render: val => (
                  <div style={{ wordWrap: 'break-word', wordBreak: 'break-word' }}>
                    {moment(val).format("YYYY-MM-DD HH:mm:ss")}</div>
                )
              },
              {
                title: "伸缩详情",
                dataIndex: "description",
                key: "description",
                align: "center",
                width: "46%",
                render: description => (
                  <div style={{ textAlign: 'left', wordWrap: 'break-word', wordBreak: 'break-word' }}>
                    {description}</div>
                )
              },
              {
                title: "类型",
                dataIndex: "record_type",
                key: "record_type",
                align: "center",
                width: "13%",
                render: record_type => (
                  <div>
                    {record_type === 'hpa' ? "水平自动伸缩" : record_type === 'manual' ? '手动伸缩' : '垂直自动伸缩'}</div>
                )
              },
              {
                title: "操作人",
                dataIndex: "operator",
                key: "operator",
                align: "center",
                width: "13%",
                render: (operator) => {
                  return (
                    <span>
                      {operator || '-'}
                    </span>
                  );
                }
              },
              {
                title: "原因",
                dataIndex: "reason",
                align: "center",
                key: "reason",
                width: "13%"
              }
            ]}
          ></Table>
        </Card>
      </div>
    );
  }
}
