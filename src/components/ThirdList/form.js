import React, { PureComponent, Fragment } from "react";
import debounce from "lodash.debounce";
import globalUtil from "../../utils/global";
import { connect } from "dva";
import { routerRedux } from "dva/router";
import config from "../../config/config";
import App from "../../../public/images/app.svg";
import Branches from "../../../public/images/branches.svg";
import Application from "../../../public/images/application.svg";
import Component from "../../../public/images/component.svg";
import Unlock from "../../../public/images/unlock.svg";
import AddGroup from "../../components/AddOrEditGroup";
import styles from "./Index.less";

import {
  List,
  Avatar,
  Icon,
  Skeleton,
  Badge,
  Row,
  Tabs,
  Col,
  Input,
  Card,
  Typography,
  Pagination,
  Modal,
  Form,
  Select,
  Button,
  Cascader,
  Switch
} from "antd";

const { Search } = Input;
const { Text } = Typography;
const { Option, OptGroup } = Select;
const { TabPane } = Tabs;

const formItemLayout = {
  labelCol: {
    span: 5
  },
  wrapperCol: {
    span: 19
  }
};

const formItemLayoutOrder = {
  labelCol: {
    span: 21
  },
  wrapperCol: {
    span: 3
  }
};
@connect(
  ({ user, global, loading }) => ({
    currUser: user.currentUser,
    groups: global.groups,
    createAppByCodeLoading: loading.effects["createApp/createAppByCode"]
  }),
  null,
  null,
  { withRef: true }
)
@Form.create()
class Index extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      addGroup: false,
      tags: [],
      tabType: "branches"
    };
  }
  componentDidMount() {
    this.handleCodeWarehouseType(this.props);
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.type !== this.props.type) {
      this.handleCodeWarehouseType(nextProps);
    }
  }
  //获取类型
  handleCodeWarehouseType = props => {
    const { dispatch, type, thirdInfo } = props;
    const { tabType } = this.state;

    dispatch({
      type: "global/codeWarehouseType",
      payload: {
        type: tabType,
        full_name: thirdInfo ? thirdInfo.project_full_name : "",
        oauth_service_id: type
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            tags: res.data.bean[tabType]
          });
        }
      }
    });
  };

  handleSearch = env_name => {
    // this.setState(
    //   {
    //     page: 1,
    //     env_name
    //   },
    //   () => {
    //     this.fetchInnerEnvs();
    //   }
    // );
  };
  onAddGroup = () => {
    this.setState({ addGroup: true });
  };
  cancelAddGroup = () => {
    this.setState({ addGroup: false });
  };
  showModal = () => {
    this.setState({
      visible: true
    });
  };

  handleOk = e => {
    console.log(e);
    this.setState({
      visible: false
    });
  };

  handleCancel = e => {
    console.log(e);
    this.setState({
      visible: false
    });
  };
  handleSubmit = e => {
    e.preventDefault();
    const form = this.props.form;
    form.validateFields((err, fieldsValue) => {
      if (err) {
        return;
      }
      this.props.onSubmit && this.props.onSubmit(fieldsValue);
    });
  };

  onChange = (value, selectedOptions) => {
    console.log(value, selectedOptions);
  };
  onTabChange = tabType => {
    this.setState({ tabType });
  };
  render() {
    const data = ["goodrain", "goodrain"];
    const { tags, addGroup } = this.state;
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const { groups, createAppByCodeLoading, ServiceComponent } = this.props;
    const showCreateGroup =
      this.props.showCreateGroup === void 0 ? true : this.props.showCreateGroup;

    const showSubmitBtn =
      this.props.showSubmitBtn === void 0 ? true : this.props.showSubmitBtn;
    const versionSelector = getFieldDecorator("version_type", {
      initialValue: "branch"
    })(
      <Select style={{ width: 100 }}>
        <Option value="branch">分支</Option>
        <Option value="tag">Tag</Option>
      </Select>
    );
    return (
      <Fragment>
        <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
          <Form.Item
            className={styles.clearConform}
            {...formItemLayout}
            label={
              <div className={styles.clearConformMinTitle}>
                <img src={Application} alt="" />
                应用&nbsp;:
              </div>
            }
          >
            {getFieldDecorator("group_id", {
              initialValue:
                this.props.handleType && this.props.handleType === "Service"
                  ? Number(this.props.groupId)
                  : data.group_id,
              rules: [{ required: true, message: "请选择" }]
            })(
              <Select
                placeholder="请选择要所属应用"
                style={{
                  display: "inline-block",
                  width:
                    this.props.handleType && this.props.handleType === "Service"
                      ? ""
                      : 292,
                  marginRight: 15
                }}
                disabled={
                  this.props.handleType && this.props.handleType === "Service"
                    ? true
                    : false
                }
              >
                {(groups || []).map(group => (
                  <Option key={group.group_id} value={group.group_id}>
                    {group.group_name}
                  </Option>
                ))}
              </Select>
            )}
            {this.props.handleType &&
            this.props.handleType === "Service" ? null : showCreateGroup ? (
              <Button onClick={this.onAddGroup}>新建应用</Button>
            ) : null}
          </Form.Item>
          <Form.Item
            className={styles.clearConform}
            {...formItemLayout}
            label={
              <div className={styles.clearConformMinTitle}>
                <img src={Component} alt="" />
                组件名称&nbsp;:
              </div>
            }
          >
            {getFieldDecorator("service_cname", {
              initialValue: data.service_cname || "",
              rules: [{ required: true, message: "要创建的组件还没有名字" }]
            })(<Input placeholder="请为创建的组件起个名字吧" />)}
          </Form.Item>

          <Form.Item
            className={styles.clearConform}
            {...formItemLayout}
            label={
              <div className={styles.clearConformMinTitle}>
                <img src={Branches} alt="" />
                代码版本&nbsp;:
              </div>
            }
          >
            {getFieldDecorator("code_version", {
              initialValue: "",
              rules: [{ required: true, message: "请输入代码版本" }]
            })(
              <Select  placeholder="请输入代码版本">
                <OptGroup
                  label={
                    <Tabs
                      defaultActiveKey="branches"
                      onChange={this.onTabChange}
                      className={styles.selectTabs}
                    >
                      <TabPane tab="分支" key="branches" />
                      <TabPane tab="Tab" key="tags" />
                    </Tabs>
                  }
                >
                  {tags.map(item => {
                    return (
                      <Option key={item} value={item}>
                        {item}
                      </Option>
                    );
                  })}
                </OptGroup>
              </Select>
            )}
          </Form.Item>
          <Form.Item
            className={styles.clearConform}
            {...formItemLayoutOrder}
            label={
              <div className={styles.clearConformMinTitle}>
                <img src={Unlock} alt="" />
                是否开启自动构建&nbsp;:
              </div>
            }
          >
            {getFieldDecorator("Cascader", {
              rules: [{ required: true, message: "请选择" }]
            })(<Switch defaultChecked onChange={this.onChange} />)}
          </Form.Item>

          {showSubmitBtn ? (
            <div style={{ textAlign: "center" }}>
              {this.props.handleType &&
              this.props.handleType === "Service" &&
              this.props.ButtonGroupState
                ? this.props.handleServiceBotton(
                    <Button
                      onClick={this.handleSubmit}
                      type="primary"
                      loading={createAppByCodeLoading}
                    >
                      新建组件
                    </Button>,
                    false
                  )
                : !this.props.handleType && (
                    <Button
                      onClick={this.handleSubmit}
                      type="primary"
                      loading={createAppByCodeLoading}
                    >
                      确认创建
                    </Button>
                  )}
            </div>
          ) : null}
        </Form>
        {addGroup && (
          <AddGroup onCancel={this.cancelAddGroup} onOk={this.handleAddGroup} />
        )}
      </Fragment>
    );
  }
}

export default Index;
