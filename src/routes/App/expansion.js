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
  Table
} from "antd";
import sourceUtil from "../../utils/source";
import { horizontal, vertical } from "../../services/app";
import globalUtil from "../../utils/global";
import appUtil from "../../utils/app";
import NoPermTip from "../../components/NoPermTip";
import InstanceList from "../../components/AppInstanceList";
import AddScaling from "../App/component/AddScaling";

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
      editRules: "",
      rulesList: [],
      sclaingRecord: [],
      page_num: 1,
      page_size: 10,
      enable: false
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
    dispatch({ type: "appControl/clearExtendInfo" });
    clearInterval(this.timeClick);
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

  openEditModal = () => {
    this.setState({ showEditAutoScaling: true });
  };

  cancelEditAutoScaling = () => {
    this.setState({ showEditAutoScaling: false, editRules: "" });
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
    this.setState({
      enable: true
    });
    this.addScalingRules(values);
  };
  changeAutoScaling = values => {

    this.changeScalingRules(values);
  };
/**关闭伸缩 */
  shutDownAutoScaling = () => {
    const { dispatch } = this.props;
    const user = globalUtil.getCurrTeamName();
    const alias = this.props.appDetail.service.service_alias;
    const {  enable } = this.state;
    this.setState({
      id: "",
      enable: false
    });
    dispatch({
      type: "appControl/changeScalingRules",
      payload: {
        selectMemory: "utilization",
        selectCpu: "utilization",
        scalingType: "hpa",
        cpuValue: 1,
        memoryValue: 1,
        maxNum: 1,
        minNum: 1,
        tenant_name: user,
        service_alias: alias,
        enable: enable,
        rule_id: this.state.id
      },
      callback: res => {
        if (res && res._code == 200) {
          notification.success({ message: "关闭成功" });
          this.setState({ showEditAutoScaling: false }, () => {
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
    const { dispatch } = this.props;
    const user = globalUtil.getCurrTeamName();
    const alias = this.props.appDetail.service.service_alias;
    // const { enable } = this.state;
      dispatch({
        type: "appControl/addScalingRules",
        payload: {
          selectMemory: values.selectMemory,
          selectCpu: values.selectCpu,
          scalingType: values.scalingType,
          cpuValue: parseInt(values.cpuValue),
          memoryValue: parseInt(values.memoryValue),
          maxNum: parseInt(values.maxNum),
          minNum: parseInt(values.minNum),
          tenant_name: user,
          service_alias: alias,
          enable: true
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
  changeScalingRules = (values) =>{
    console.log("编辑")
    const { dispatch } = this.props;
    const user = globalUtil.getCurrTeamName();
    const alias = this.props.appDetail.service.service_alias;
    dispatch({
      type: "appControl/changeScalingRules",
      payload: {
        selectMemory:values.selectMemory,
        selectCpu:values.selectCpu,
        scalingType:values.scalingType,
        cpuValue:values.cpuValue,
        memoryValue:values.memoryValue,
        maxNum:values.maxNum,
        minNum:values.minNum,
        tenant_name: user,
        service_alias: alias,
        rule_id:this.state.id
      },
      callback: res => {
        if (res) {
         
          notification.success({ message: "编辑成功！" });
          this.getScalingRules();
          this.setState({
            showEditAutoScaling: false,
            editRules: res.bean,
            id: res.bean.id,
          })
        }else{
          notification.success({ message: "编辑失败！" });
          this.setState({showEditAutoScaling: false})
        }
      }
    });
  }

  /*获取伸缩规则 */
  getScalingRules = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "appControl/getScalingRules",
      payload: {
        tenant_name: globalUtil.getCurrTeamName(),
        service_alias: this.props.appDetail.service.service_alias
      },
      callback: res => {
        if (res && res._code == 200) {
          this.setState({
            enable: res.list[0].enable,
            rulesList: res.list,
            id: res.list[0].rule_id,
            editRules: "",
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

  /*获取伸缩记录 */
  getScalingRecord = () => {
    const { dispatch } = this.props;
    const { sclaingRecord } = this.state;
    dispatch({
      type: "appControl/getScalingRecord",
      payload: {
        tenant_name: globalUtil.getCurrTeamName(),
        service_alias: this.props.appDetail.service.service_alias,
        page: this.state.page_num,
        page_size: this.state.page_size
      },
      callback: res => {
        if (res && res._code == 200) {
          this.setState({
            sclaingRecord: res.bean.data
          });
        }
      }
    });
  };

  saveForm = form => {
    this.form = form;
    if (this.state.editRules && this.form) {
      this.form.setFieldsValue(this.state.editRules);
    }
  };
  render() {
    if (!this.canView()) return <NoPermTip />;
    const { extendInfo } = this.props;
    const { getFieldDecorator } = this.props.form;
    const { loading, rulesList, sclaingRecord } = this.state;
    if (!extendInfo) {
      return null;
    }
    const grctlCmd =
      "grctl service get " +
      this.props.appAlias +
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
          style={{ marginTop: 16 }}
          title="自动伸缩"
          extra={
            (this.state.enable ? (

              <div>
              <Button
                // styles={{ marginRight: "15px" }}
                onClick={this.openEditModal}
                type="default"
              >
                编辑
              </Button>
              <Button onClick={this.shutDownAutoScaling} type="primary">
                关闭
              </Button>
            </div>


            ) : (
              
              <Button onClick={this.openEditModal} type="primary">
                开启
              </Button>
            ))
          }
        >
          <Row gutter={24}>
            <Col span={6}>
              最小个数<div>{rulesList[0].min_replicas}</div>
            </Col>
            <Col span={6}>
              最大个数<div>{rulesList[0].max_replicas}</div>
            </Col>
            <Col span={6}>
              cpu使用率
              <div>
                {rulesList[0].metrics.metric_target_value}%
              </div>
            </Col>
            <Col span={6}>
              内存使用量
              <div>
                {rulesList[0].metrics.metric_target_value}%
              </div>
            </Col>
          </Row>
        </Card>

        {this.state.showEditAutoScaling && (
          <AddScaling
            data={rulesList}
            ref={this.saveForm}
            isvisable={this.state.showEditAutoScaling}
            onClose={this.cancelEditAutoScaling}
            onOk={values => {
              this.state.enable
                ? this.changeAutoScaling(values)
                : this.openAutoScaling(values);
            }}
            editRules={this.state.editRules}
          />
        )}

 
          <Card style={{ marginTop: 16 }} title="水平伸缩记录">
            <Table
              dataSource={sclaingRecord}
              columns={[
                {
                  title: "时间",
                  dataIndex: "create_time",
                  key: "create_time",
                  width: "20%",
                  render: val => (
                    <span>{moment(val).format("YYYY-MM-DD HH:mm:ss")}</span>
                  )
                },
                {
                  title: "伸缩详情",
                  dataIndex: "description",
                  key: "description",
                  width: "20%"
                },
                {
                  title: "类型",
                  dataIndex: "record_type",
                  key: "record_type",
                  width: "20%"
                },
                {
                  title: "原因",
                  dataIndex: "reason",
                  key: "reason",
                  width: "20%"
                }
              ]}
            ></Table>
          </Card>
      </div>
    );
  }
}
