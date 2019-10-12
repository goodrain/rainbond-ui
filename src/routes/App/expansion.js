import React, { PureComponent } from "react";
import { connect } from "dva";
import { routerRedux } from "dva/router";
import { CopyToClipboard } from "react-copy-to-clipboard";
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
  Input
} from "antd";
import sourceUtil from "../../utils/source";
import { horizontal, vertical } from "../../services/app";
import globalUtil from "../../utils/global";
import appUtil from "../../utils/app";
import NoPermTip from "../../components/NoPermTip";
import InstanceList from "../../components/AppInstanceList";

const { Option } = Select;
const { Search } = Input;

@connect(
  ({ user, appControl }) => ({
    currUser: user.currentUser,
    baseInfo: appControl.baseInfo,
    extendInfo: appControl.extendInfo,
    instances: appControl.pods
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
      new_pods: this.props.instances && this.props.instances.new_pods
      ? this.props.instances.new_pods
      : [],
      old_pods:  this.props.instances && this.props.instances.old_pods
      ? this.props.instances.old_pods
      : [],
      instances: [],
      loading: false
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
    this.fetchInstanceInfo();
    this.fetchExtendInfo();
  }
  componentWillUnmount() {
    const { dispatch } = this.props;
    dispatch({ type: "appControl/clearExtendInfo" });
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

  render() {
    if (!this.canView()) return <NoPermTip />;
    const { extendInfo } = this.props;
    const { getFieldDecorator } = this.props.form;
    const { loading } = this.state;
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
      </div>
    );
  }
}
