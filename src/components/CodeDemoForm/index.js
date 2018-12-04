import React, { PureComponent } from "react";
import { connect } from "dva";
import { Link, Switch, Route, routerRedux } from "dva/router";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Icon,
  Menu,
  Dropdown,
  notification,
  Select,
  Input,
} from "antd";
import AddGroup from "../../components/AddOrEditGroup";
import globalUtil from "../../utils/global";

const { Option } = Select;
const formItemLayout = {
  labelCol: {
    span: 5,
  },
  wrapperCol: {
    span: 19,
  },
};

@connect(
  ({ user, global }) => ({
    groups: global.groups,
  }),
  null,
  null,
  { withRef: true },
)
@Form.create()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      addGroup: false,
    };
  }
  onAddGroup = () => {
    this.setState({ addGroup: true });
  };
  cancelAddGroup = () => {
    this.setState({ addGroup: false });
  };
  handleSubmit = (e) => {
    e.preventDefault();
    const form = this.props.form;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      this.props.onSubmit && this.props.onSubmit(fieldsValue);
    });
  };
  handleAddGroup = (vals) => {
    const { setFieldsValue } = this.props.form;
    this.props.dispatch({
      type: "groupControl/addGroup",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        ...vals,
      },
      callback: (group) => {
        if (group) {
          // 获取群组
          this.props.dispatch({
            type: "global/fetchGroups",
            payload: {
              team_name: globalUtil.getCurrTeamName(),
              region_name: globalUtil.getCurrRegionName(),
            },
            callback: () => {
              setFieldsValue({ group_id: group.ID });
              this.cancelAddGroup();
            },
          });
        }
      },
    });
  };
  fetchGroup = () => {
    this.props.dispatch({
      type: "global/fetchGroups",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
      },
    });
  };
  render() {
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const { groups } = this.props;
    const data = this.props.data || {};

    return (
      <Form layout="horizontal" hideRequiredMark>
       <Form.Item {...formItemLayout} label="应用">
          {getFieldDecorator("group_id", {
            initialValue: data.groupd_id,
            rules: [{ required: true, message: "请选择" }],
          })(<Select style={{ display: "inline-block", width: 292, marginRight: 15 }}>
            {(groups || []).map(group => <Option key={group.group_id} value={group.group_id}>{group.group_name}</Option>)}
          </Select>)}
          <Button onClick={this.onAddGroup}>新建应用</Button>
        </Form.Item>
        <Form.Item {...formItemLayout} label="服务组件名称">
          {getFieldDecorator("service_cname", {
            initialValue: data.service_cname || "",
            rules: [{ required: true, message: "要创建的服务组件还没有名字" }],
          })(<Input placeholder="请为创建的服务组件起个名字吧" />)}
        </Form.Item>
        <Form.Item {...formItemLayout} label="Demo">
          {getFieldDecorator("git_url", {
            initialValue: data.git_url || "http://code.goodrain.com/demo/2048.git",
            rules: [{ required: true, message: "请选择" }],
          })(<Select>
            <Option value="http://code.goodrain.com/demo/2048.git">2048小游戏</Option>
            <Option value="http://code.goodrain.com/demo/static-hello.git">
                静态Web：hello world !
            </Option>
            <Option value="http://code.goodrain.com/demo/php-hello.git">
                PHP：hello world !
            </Option>
            <Option value="http://code.goodrain.com/demo/python-hello.git">
                Python：hello world !
            </Option>
            <Option value="http://code.goodrain.com/demo/nodejs-hello.git">
                Node.js：hello world !
            </Option>
            <Option value="http://code.goodrain.com/demo/go-hello.git">
                Golang：hello world !
            </Option>
            <Option value="http://code.goodrain.com/demo/java-spring-boot-demo.git">
                Java SpringBoot Demo
            </Option>
            <Option value="http://code.goodrain.com/demo/netcore-demo.git">.NetCore Demo</Option>
          </Select>)}
        </Form.Item>
        <Form.Item
          wrapperCol={{
            xs: { span: 24, offset: 0 },
            sm: { span: formItemLayout.wrapperCol.span, offset: formItemLayout.labelCol.span },
          }}
          label=""
        >
          <Button onClick={this.handleSubmit} type="primary">
            新建应用
          </Button>
        </Form.Item>
        {this.state.addGroup && (
          <AddGroup onCancel={this.cancelAddGroup} onOk={this.handleAddGroup} />
        )}
      </Form>
    );
  }
}
