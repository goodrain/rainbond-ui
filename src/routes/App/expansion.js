import React, { PureComponent } from "react";
import { connect } from "dva";
import { routerRedux } from "dva/router";
import { Row, Col, Card, Form, Button, Select, notification } from "antd";
import sourceUtil from "../../utils/source";
import { horizontal, vertical } from "../../services/app";
import globalUtil from "../../utils/global";
import appUtil from "../../utils/app";
import NoPermTip from "../../components/NoPermTip";

const { Option } = Select;

@connect(({ user, appControl }) => ({
  currUser: user.currentUser,
  baseInfo: appControl.baseInfo,
  extendInfo: appControl.extendInfo,
}))
@Form.create()
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      node: 0,
      memory: 0,
    };
  }

  componentDidMount() {
    if (!this.canView()) return;
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
  render() {
    if (!this.canView()) return <NoPermTip />;
    const { extendInfo } = this.props;
    const { getFieldDecorator } = this.props.form;

    if (!extendInfo) {
      return null;
    }

    return (
      <Card title="手动伸缩">
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
                  {(extendInfo.memory_list || []).map(item => <Option value={item}>{sourceUtil.getMemoryAndUnit(item)}</Option>)}
                   </Select>)}{" "}
                <Button onClick={this.handleVertical} size="md" type="primary">
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
                  {(extendInfo.node_list || []).map(item => <Option value={item}>{item}</Option>)}
                </Select>)}{" "}
                <Button onClick={this.handleHorizontal} size="md" type="primary">
                  设置
                </Button>
              </Form.Item>
            </Form>
          </Col>
        </Row>
      </Card>
    );
  }
}
