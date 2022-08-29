import React, { PureComponent, Fragment } from "react";
import {
  Button,
  Icon,
  Card,
  Modal,
  Row,
  Col,
  Alert,
  Table,
  Radio,
  Tabs,
  Affix,
  Input,
  Form,
  Tooltip,
  Checkbox,
  notification
} from "antd";
import { connect } from "dva";
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { routerRedux } from "dva/router";
import globalUtil from "../../utils/global";
import httpResponseUtil from "../../utils/httpResponse";
import styles from "./setting.less";

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const TabPane = Tabs.TabPane;
const { TextArea } = Input;
const confirm = Modal.confirm;
@connect(
  ({ user, appControl, teamControl }) => ({ currUser: user.currentUser }),
  null,
  null,
  { withRef: true }
)
@Form.create()
class BaseInfo extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isShow: [true, true],
      memoryList: this.props.data,
      isEdit: false,
      isIndex: false,
      editData: false,
      buildValue: "",
      startValue: "",
      activeselectedRows: [],
      activeselectedRowKeys: ""
    };
  }

  // shouldComponentUpdate(){
  //     return true
  // }
  handleSubmit = e => {
    const form = this.props.form;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      this.props.onSubmit && this.props.onSubmit(fieldsValue);
    });
  };

  handleEdit = editData => {
    let buildValue = "";
    let startValue = "";
    if (editData && editData.envs && editData.envs.length > 0) {
      editData.envs.map(item => {
        item.name == "BUILD_MAVEN_CUSTOM_OPTS" ? (buildValue = item.value) : "";
        item.name == "BUILD_PROCFILE" ? (startValue = item.value) : "";
      });
    }
    this.setState({
      isEdit: true,
      editData,
      buildValue,
      startValue
    });
  };

  handleOk = () => {
    const { memoryList, editData } = this.state;
    const form = this.props.form;
    let arr = memoryList;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      arr.map(item => {
        if (item.id == editData.id) {
          item.cname = fieldsValue.cname;
          item.envs.map(item => {
            item.name == "BUILD_MAVEN_CUSTOM_OPTS"
              ? (item.value = fieldsValue.BUILD_MAVEN_CUSTOM_OPTS)
              : "";
            item.name == "BUILD_PROCFILE"
              ? (item.value = fieldsValue.PROCFILE)
              : "";
          });
        }
      });
      this.setState(
        {
          memoryList: arr
        },
        () => {
          notification.destroy();
          notification.success({ message: formatMessage({id:'notification.success.edit'}) });
          this.handleCancel();
        }
      );
    });
  };

  handleCancel = () => {
    this.setState({
      isEdit: false,
      isIndex: false
    });
  };
  render() {
    const columns = [
      {
        title: "模块名称",
        dataIndex: "name",
        rowKey: "name",
        width: "15%"
      },
      {
        title: "组件名称",
        dataIndex: "cname",
        rowKey: "cname",
        width: "15%"
      },
      {
        title: "包类型",
        dataIndex: "packaging",
        rowKey: "packaging",
        width: "8%"
      },
      {
        title: "端口",
        dataIndex: "index",
        rowKey: "index",
        width: "10%",

        render: (val, index) => {
          return (
            <span key={val}>
              {index.ports && index.ports.length > 0
                ? index.ports[0].container_port
                : val + 5000}
            </span>
          );
        }
      },

      {
        title: "构建变量信息",
        dataIndex: "envs",
        rowKey: "envs",
        width: "45%",

        render: (val, index) => {
          let CUSTOM_OPTS = "";
          let CUSTOM_GOALS = "";
          let startValue = "";
          if (val && val.length > 0) {
            val.map(item => {
              item.name == "BUILD_MAVEN_CUSTOM_OPTS"
                ? (CUSTOM_OPTS = item.value)
                : "";
              item.name == "BUILD_MAVEN_CUSTOM_GOALS"
                ? (CUSTOM_GOALS = item.value)
                : "";
              item.name == "BUILD_PROCFILE" ? (startValue = item.value) : "";
            });
          }

          return (
            <div key={index}>
              <div style={{ display: "flex" }}>
                <p style={{ width: "30%" }}>Maven构建参数:</p>
                <div style={{ width: "70%" }}>{CUSTOM_OPTS}</div>
              </div>
              <div style={{ display: "flex" }}>
                <p style={{ width: "30%" }}>Maven构建命令:</p>
                <div style={{ width: "70%" }}>{CUSTOM_GOALS}</div>
              </div>
              <div style={{ display: "flex" }}>
                <p style={{ width: "30%" }}>启动命令:</p>
                <div style={{ width: "70%" }}>{startValue}</div>
              </div>
            </div>
          );
        }
      },
      {
        title: "操作",
        dataIndex: "id",
        rowKey: "id",
        width: "7%",

        render: (val, index) => {
          return (
            <Button
              onClick={() => {
                this.handleEdit(index);
              }}
            >
              修改
            </Button>
          );
        }
      }
    ];

    const rowSelection = {
      onChange: (selectedRowKeys, selectedRows) => {
        // console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
        // this.setState({
        //     isShow:this.state.isShow[selectedRowKeys]
        // })
        this.props.onSubmit(selectedRows);
      },
      getCheckboxProps: record => ({
        disabled: record.operation, // Column configuration not to be checked
        operation: record.operation
      })
    };

    const { getFieldDecorator, getFieldValue } = this.props.form;
    const radioStyle = {
      display: "block",
      height: "30px",
      lineHeight: "30px"
    };
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 6
        },
        sm: {
          span: 6
        }
      },
      wrapperCol: {
        xs: {
          span: 18
        },
        sm: {
          span: 18
        }
      }
    };
    const { memoryList, isEdit, editData, buildValue, startValue } = this.state;
    return (
      <div>
        {isEdit && (
          <Modal
            title="修改"
            visible={isEdit}
            onOk={this.handleOk}
            onCancel={this.handleCancel}
          >
            <Form.Item {...formItemLayout} label="组件名称">
              {getFieldDecorator("cname", {
                initialValue: editData && editData.cname,
                rules: [
                  {
                    required: true,
                    message: "请输入组件命令"
                  }
                ]
              })(<Input placeholder="" />)}
            </Form.Item>
            <Form.Item {...formItemLayout} label="构建命令">
              {getFieldDecorator("BUILD_MAVEN_CUSTOM_OPTS", {
                initialValue: buildValue && buildValue,
                rules: [
                  {
                    required: true,
                    message: "请输入构建命令"
                  }
                ]
              })(<TextArea placeholder="" />)}
            </Form.Item>
            <Form.Item {...formItemLayout} label="启动命令">
              {getFieldDecorator("PROCFILE", {
                initialValue: startValue && startValue,
                rules: [
                  {
                    required: true,
                    message: "请输入启动命令"
                  }
                ]
              })(<TextArea placeholder="" />)}
            </Form.Item>
          </Modal>
        )}
        <Table
          rowSelection={rowSelection}
          dataSource={memoryList}
          columns={columns}
          pagination={false}
          style={{ background: "#fff", marginTop: "20px" }}
        />
      </div>
    );
  }
}

@connect(
  ({ user, appControl }) => ({ currUser: user.currentUser }),
  null,
  null,
  { withRef: true }
)
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }
  render() {
    const data = this.props.data;
    return (
      <div>
        <div
          style={{
            overflow: "hidden"
          }}
        >
          <div
            className={styles.content}
            style={{
              overflow: "hidden",
              marginBottom: 90
            }}
          >
            <Alert
              message="以下为检测出的Maven多模块项目的模块信息, 请选择需要构建的模块, 并确认构建信息"
              type="success"
            />
            <BaseInfo data={data} onSubmit={this.props.onSubmit} />
          </div>
        </div>
      </div>
    );
  }
}
