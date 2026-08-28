import React, { PureComponent } from "react";
import {
  Button,
  Modal,
  Alert,
  Table,
  Radio,
  Input,
  Form,
  notification
} from "antd";
import { connect } from "dva";
import { formatMessage } from '@/utils/intl';
import globalUtil from "../../utils/global";
import cookie from "@/utils/cookie";
import JavaCNBConfig from "../CodeBuildConfig/java-cnb";
import styles from "./setting.less";
import moduleHelpers from "./helpers";

const {
  MODULE_ROLE_POSSIBLE_DEPENDENCY,
  envListToMap,
  getDefaultSelectedKeys,
  getSelectedModules,
  mergeModuleBuildEnvs,
  reconcileSelectedKeys,
  sortModules
} = moduleHelpers;

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
    const memoryList = sortModules(this.props.data);
    this.state = {
      isShow: [true, true],
      memoryList,
      isEdit: false,
      editData: false,
      editEnvMap: {},
      selectedRowKeys: getDefaultSelectedKeys(memoryList),
      language: cookie.get('language') === 'zh-CN' ? true : false,
      archInfo: []
    };
  }

  // shouldComponentUpdate(){
  //     return true
  // }
  componentDidMount() {
    this.submitSelectedModules();
    this.handleArchCpuInfo()
  }
  componentDidUpdate(prevProps) {
    if (prevProps.data !== this.props.data) {
      const memoryList = sortModules(this.props.data);
      this.setState(
        previousState => ({
          memoryList,
          selectedRowKeys: reconcileSelectedKeys(
            previousState.memoryList,
            memoryList,
            previousState.selectedRowKeys
          )
        }),
        this.submitSelectedModules
      );
    }
  }
  submitSelectedModules = () => {
    const { memoryList, selectedRowKeys } = this.state;
    const selectedRows = getSelectedModules(memoryList, selectedRowKeys);
    this.props.onSubmit && this.props.onSubmit(selectedRows);
  };
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
          const archInfo = Array.isArray(res.list) ? res.list : [];
          this.setState(
            previousState => ({
              archInfo,
              memoryList: archInfo.length
                ? previousState.memoryList.map(item => ({
                    ...item,
                    arch: item.arch || archInfo[0]
                  }))
                : previousState.memoryList
            }),
            this.submitSelectedModules
          );
        }
      }
    });
  }

  handleEdit = editData => {
    if (this.props.cnbVersionPolicyLoading) {
      return;
    }
    this.props.form.resetFields();
    this.setState({
      isEdit: true,
      editData,
      editEnvMap: envListToMap(editData && editData.envs)
    });
  };

  handleOk = () => {
    const { editData } = this.state;
    const form = this.props.form;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      const { cname, arch, ...buildFields } = fieldsValue;
      this.setState(
        previousState => ({
          memoryList: previousState.memoryList.map(item => {
            if (item.id != editData.id) {
              return item;
            }
            return {
              ...item,
              cname,
              arch: typeof arch === 'undefined' ? item.arch : arch,
              envs: mergeModuleBuildEnvs(item.envs, buildFields)
            };
          })
        }),
        () => {
          this.submitSelectedModules();
          notification.destroy();
          notification.success({ message: formatMessage({id:'notification.success.edit'}) });
          this.handleCancel();
        }
      );
    });
  };

  handleCancel = () => {
    this.props.form.resetFields();
    this.setState({
      isEdit: false,
      editData: false,
      editEnvMap: {}
    });
  };
  render() {
    const columns = [
      {
        title: formatMessage({id:'JavaMaven.name'}),
        dataIndex: "name",
        rowKey: "name",
        width: "15%",
        render: (value, record) => (
          <div>
            <div>{value}</div>
            {record.module_role === MODULE_ROLE_POSSIBLE_DEPENDENCY && (
              <small>
                {formatMessage({id:'JavaMaven.possible_dependency'})}
              </small>
            )}
          </div>
        )
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
          const envMap = envListToMap(val);
          const CUSTOM_OPTS =
            envMap.BP_MAVEN_ADDITIONAL_BUILD_ARGUMENTS ||
            envMap.BUILD_MAVEN_CUSTOM_OPTS ||
            "";
          const CUSTOM_GOALS =
            envMap.BP_MAVEN_BUILD_ARGUMENTS ||
            envMap.BUILD_MAVEN_CUSTOM_GOALS ||
            "";
          const startValue = envMap.BUILD_PROCFILE || "";

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
              disabled={this.props.cnbVersionPolicyLoading}
              loading={this.props.cnbVersionPolicyLoading}
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
      selectedRowKeys: this.state.selectedRowKeys,
      onChange: selectedRowKeys => {
        this.setState({ selectedRowKeys }, this.submitSelectedModules);
      },
      getCheckboxProps: record => ({
        disabled: record.operation, // Column configuration not to be checked
        operation: record.operation
      })
    };

    const { getFieldDecorator } = this.props.form;
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
    const {
      memoryList,
      isEdit,
      editData,
      editEnvMap,
      language,
      archInfo
    } = this.state;
    const isLanguage = language ? formItemLayout : en_formItemLayout
    return (
      <div>
        {isEdit && (
          <Modal
            title={formatMessage({id:'teamOther.manage.edit'})}
            visible={isEdit}
            onOk={this.handleOk}
            onCancel={this.handleCancel}
            width={1000}
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
            <JavaCNBConfig
              languageType="java-maven"
              envs={editEnvMap}
              form={this.props.form}
              cnbVersionPolicy={this.props.cnbVersionPolicy}
            />
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
          rowKey="id"
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
            <BaseInfo
              data={data}
              onSubmit={this.props.onSubmit}
              cnbVersionPolicy={this.props.cnbVersionPolicy}
              cnbVersionPolicyLoading={this.props.cnbVersionPolicyLoading}
            />
          </div>
        </div>
      </div>
    );
  }
}
