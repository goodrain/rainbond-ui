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
import cookie from "@/utils/cookie";
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
      activeselectedRowKeys: "",
      language: cookie.get('language') === 'zh-CN' ? true : false,
      archInfo: []
    };
  }

  // shouldComponentUpdate(){
  //     return true
  // }
  componentDidMount() {
    this.handleArchCpuInfo()
  }
  handleSubmit = e => {
    const form = this.props.form;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      this.props.onSubmit && this.props.onSubmit(fieldsValue);
    });
  };
  handleArchCpuInfo = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'index/fetchArchOverview',
      payload: {
        region_name: globalUtil.getCurrRegionName(),
        team_name: globalUtil.getCurrTeamName()
      },
      callback: res => {
        if (res && res.bean) {
          this.setState({
            archInfo: res.list
          },()=>{
            const { memoryList, archInfo } = this.state
            const info = memoryList
            if(memoryList && memoryList.length > 0 && archInfo && archInfo.length >0){
              info.map(item => {
                item.arch = archInfo[0]
              })
            }
            this.setState({
              memoryList: info
            })
          })
        }
      }
    });
  }

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
          item.arch = fieldsValue.arch;
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
        title: formatMessage({id:'JavaMaven.name'}),
        dataIndex: "name",
        rowKey: "name",
        width: "15%"
      },
      {
        title: formatMessage({id:'JavaMaven.cname'}),
        dataIndex: "cname",
        rowKey: "cname",
        width: "15%"
      },
      {
        title: formatMessage({id:'JavaMaven.packaging'}),
        dataIndex: "packaging",
        rowKey: "packaging",
        width: "8%"
      },
      {
        title: formatMessage({id:'JavaMaven.index'}),
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
        title: formatMessage({id:'JavaMaven.envs'}),
        dataIndex: "envs",
        rowKey: "envs",
        width: "45%",

        render: (val, row, index) => {
          const { archInfo } = this.state
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
              <div style={{ display: "flex", marginBottom:6 }}>
                <p style={{ width: "30%" }}>{formatMessage({ id: 'JavaMaven.OPTS' })}:</p>
                <div style={{ width: "70%" }}>{CUSTOM_OPTS}</div>
              </div>
              <div style={{ display: "flex", marginBottom:6 }}>
                <p style={{ width: "30%" }}>{formatMessage({ id: 'JavaMaven.GOALS' })}:</p>
                <div style={{ width: "70%" }}>{CUSTOM_GOALS}</div>
              </div>
              <div style={{ display: "flex", marginBottom:6 }}>
                <p style={{ width: "30%" }}>{formatMessage({ id: 'JavaMaven.startValue' })}:</p>
                <div style={{ width: "70%" }}>{startValue}</div>
              </div>
              {(row.arch || (archInfo && archInfo.length >= 1)) &&
                <div style={{ display: "flex", marginBottom:6 }}>
                  <p style={{ width: "30%" }}>{formatMessage({id:'JavaMaven.arch'})}:</p>
                  <div style={{ width: "70%" }}>{row.arch || archInfo[0]}</div>
                </div>
              }
            </div>
          );
        }
      },
      {
        title: formatMessage({id:'JavaMaven.id'}),
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
              {formatMessage({id:'teamOther.manage.edit'})}
            </Button>
          );
        }
      }
    ];

    const rowSelection = {
      onChange: (selectedRowKeys, selectedRows) => {
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
    const en_formItemLayout = {
      labelCol: {
        xs: {
          span: 10
        },
        sm: {
          span: 10
        }
      },
      wrapperCol: {
        xs: {
          span: 14
        },
        sm: {
          span: 14
        }
      }
    };
    const { memoryList, isEdit, editData, buildValue, startValue, language, archInfo } = this.state;
    const isLanguage = language ? formItemLayout : en_formItemLayout
    return (
      <div>
        {isEdit && (
          <Modal
            title={formatMessage({id:'teamOther.manage.edit'})}
            visible={isEdit}
            onOk={this.handleOk}
            onCancel={this.handleCancel}
          >
            <Form.Item {...isLanguage} label={formatMessage({id:'JavaMaven.cname'})}>
              {getFieldDecorator("cname", {
                initialValue: editData && editData.cname,
                rules: [
                  {
                    required: true,
                    message: formatMessage({id:'JavaMaven.cname_input'})
                  }
                ]
              })(<Input placeholder="" />)}
            </Form.Item>
            <Form.Item {...isLanguage} label={formatMessage({id:'JavaMaven.bulid'})}>
              {getFieldDecorator("BUILD_MAVEN_CUSTOM_OPTS", {
                initialValue: buildValue && buildValue,
                rules: [
                  {
                    required: true,
                    message: formatMessage({id:'JavaMaven.bulid_input'})
                  }
                ]
              })(<TextArea placeholder="" />)}
            </Form.Item>
            <Form.Item {...isLanguage} label={formatMessage({id:'JavaMaven.start'})}>
              {getFieldDecorator("PROCFILE", {
                initialValue: startValue && startValue,
                rules: [
                  {
                    required: true,
                    message: formatMessage({id:'JavaMaven.start_input'})
                  }
                ]
              })(<TextArea placeholder="" />)}
            </Form.Item>
            {archInfo && archInfo.length > 0 &&
              <Form.Item {...isLanguage} label={formatMessage({id:'JavaMaven.arch'})}>
                {getFieldDecorator("arch", {
                  initialValue: editData.arch || (archInfo && archInfo.length > 0 && archInfo[0]),
                })(
                  <Radio.Group>
                    {archInfo.map(item =>{
                      return <Radio value={item}>{item}</Radio>
                    })}
                  </Radio.Group>)}
              </Form.Item>
            }
          </Modal>
        )}
        <Table
          rowSelection={rowSelection}
          rowKey={(record,index) => index}
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
              message={formatMessage({id:'JavaMaven.Alert'})}
              type="success"
            />
            <BaseInfo data={data} onSubmit={this.props.onSubmit} />
          </div>
        </div>
      </div>
    );
  }
}
