import React, { PureComponent } from "react";
import { connect } from "dva";
import { routerRedux } from "dva/router";
import { Row, Col, Card, Form, Button, Select, notification,Spin } from "antd";
import sourceUtil from "../../utils/source";
import { horizontal, vertical } from "../../services/app";
import globalUtil from "../../utils/global";
import appUtil from "../../utils/app";
import NoPermTip from "../../components/NoPermTip";
import InstanceList from "../../components/AppInstanceList";

const { Option } = Select;

@connect(({ user, appControl }) => ({
  currUser: user.currentUser,
  baseInfo: appControl.baseInfo,
  extendInfo: appControl.extendInfo,
  instances: appControl.pods,
}))
@Form.create()
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      node: 0,
      memory: 0,
      instances:this.props.instances?this.props.instances:[],
      loading:this.props.instances?true:false
    };
  }

  componentDidMount() {
    if (!this.canView()) return;
    this.fetchInstanceInfo(1);
    this.fetchExtendInfo();
  }
  componentWillUnmount() {
    const { dispatch } = this.props;
    dispatch({ type: "appControl/clearExtendInfo" });
    clearTimeout(this.timeout);
  }

  componentWillReceiveProps(nextProps){
    const node = this.props.form.getFieldValue("node");
    if(nextProps.instances!==this.state.instances){
    clearTimeout(this.timeout);
        if(nextProps.instances&&nextProps.instances.length==node){
          this.setState({
            instances:nextProps.instances,
            loading:true
          })
        }else{
          this.fetchInstanceInfo()
        }
    }
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
      new_memory: memory,
    }).then((data) => {
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
      new_node: node,
    }).then((data) => {
      if (data && !data.status) {
        notification.success({ message: "操作成功，执行中" });
      }
    });
  };
  handlePodClick = (podName, manageName) => {
    let adPopup = window.open("about:blank");
    const appAlias = this.props.appAlias;
    if (podName && manageName) {
      this
        .props
        .dispatch({
          type: "appControl/managePod",
          payload: {
            team_name: globalUtil.getCurrTeamName(),
            app_alias: appAlias,
            pod_name: podName,
            manage_name: manageName,
          },
          callback: () => {
            adPopup.location.href = `/console/teams/${globalUtil.getCurrTeamName()}/apps/${appAlias}/docker_console/`;
          },
        });
    }
  }
  fetchExtendInfo = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "appControl/fetchExtendInfo",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
      },
      handleError: (res) => {
        if (res && res.status === 403) {
          this.props.dispatch(routerRedux.push("/exception/403"));
        }
      },
    });
  };
  fetchInstanceInfo = (times) => {
    const { dispatch } = this.props;
    this.setState({
      loading:false
    })
    const node = this.props.form.getFieldValue("node");
    let time=times?times:node<=4?1500:node<=8?2000:node<=20?3000:1500
    this.timeout = setTimeout(() => {
      dispatch({
        type: "appControl/fetchPods",
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: this.props.appAlias,
        },
      });
    }, time);
  };

  showInstanceList = ()=>{
   return <InstanceList handlePodClick={this.handlePodClick} list={this.state.instances} />
  }
  render() {
    if (!this.canView()) return <NoPermTip />;
    const { extendInfo } = this.props;
    const { getFieldDecorator } = this.props.form;
    if (!extendInfo) {
      return null;
    }
    return (
      <div>
        <Card
          title="实例情况"
          extra={
            <a onClick={this.fetchInstanceInfo} href="javascript:;">
              刷新
            </a>
        }
        >
          <Spin tip="Loading..." spinning={!this.state.loading}>
              <div style={{minHeight:this.state.loading?"":"190px"}}>
                {this.state.loading&&this.showInstanceList()}
              </div>
          </Spin>
        </Card>
        <Card style={{ marginTop: 16 }} title="手动伸缩">
          <Row gutter={16}>
            <Col lg={12} md={12} sm={24}>
              <Form layout="inline" hideRequiredMark>
                <Form.Item label="内存">
                  {getFieldDecorator("memory", {
                  initialValue: `${extendInfo.current_memory}`,
                })(<Select
                  style={{
                      width: 200,
                    }}
                >
                  {(extendInfo.memory_list || []).map(item => <Option key={item} value={item}>{sourceUtil.getMemoryAndUnit(item)}</Option>)}
                   </Select>)}{" "}
                  <Button onClick={this.handleVertical} size="default" type="primary">
                  设置
                  </Button>
                </Form.Item>
              </Form>
            </Col>
            <Col lg={12} md={12} sm={24}>
              <Form layout="inline" hideRequiredMark>
                <Form.Item label="实例数量">
                  {getFieldDecorator("node", { initialValue: extendInfo.current_node })(<Select
                    style={{
                      width: 200,
                    }}
                  >
                    {(extendInfo.node_list || []).map(item => <Option key={item} value={item}>{item}</Option>)}
                  </Select>)}{" "}
                  <Button onClick={this.handleHorizontal} size="default" type="primary">
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
