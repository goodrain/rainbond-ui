import React, { PureComponent } from "react";
import {
  Button,
  Modal,
  Alert,
  Table,
  Radio,
  Input,
  Form,
  notification,
  Icon,
  Tooltip
} from "antd";
import { connect } from "dva";
import { formatMessage } from '@/utils/intl';
import globalUtil from "../../utils/global";
import handleAPIError from "../../utils/error";
import cookie from "@/utils/cookie";
import {
  getArchRules,
  getK8sComponentNameRules,
  getServiceNameRules
} from "../CodeJwarForm/validations";
import styles from "./setting.less";
import moduleHelpers from "./helpers";

const {
  envListToMap,
  getDefaultOpenJDKVersion,
  getDefaultSelectedKeys,
  getSelectedModules,
  isK8sNameDuplicate,
  normalizeDetectedModules,
  reconcileSelectedKeys
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
    this.mounted = false;
    const memoryList = normalizeDetectedModules(this.props.data);
    this.state = {
      memoryList,
      isEdit: false,
      editData: false,
      selectedRowKeys: getDefaultSelectedKeys(memoryList),
      language: cookie.get('language') === 'zh-CN' ? true : false,
      archInfo: [],
      archInfoLoading: true
    };
  }

  // shouldComponentUpdate(){
  //     return true
  // }
  componentDidMount() {
    this.mounted = true;
    this.submitSelectedModules();
    this.handleArchCpuInfo()
  }
  componentWillUnmount() {
    this.mounted = false;
  }
  componentDidUpdate(prevProps) {
    if (prevProps.data !== this.props.data) {
      const memoryList = normalizeDetectedModules(this.props.data);
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
    if (!this.mounted) {
      return;
    }
    const { memoryList, selectedRowKeys } = this.state;
    const selectedRows = getSelectedModules(memoryList, selectedRowKeys);
    this.props.onSubmit && this.props.onSubmit(selectedRows);
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
        if (!this.mounted) {
          return;
        }
        const archInfo = res && res.bean && Array.isArray(res.list)
          ? res.list
          : [];
        this.setState(
          previousState => ({
            archInfo,
            archInfoLoading: false,
            memoryList: archInfo.length
              ? previousState.memoryList.map(item => ({
                  ...item,
                  arch: item.arch || archInfo[0]
                }))
              : previousState.memoryList
          }),
          this.submitSelectedModules
        );
      },
      handleError: err => {
        if (!this.mounted) {
          return;
        }
        this.setState({ archInfoLoading: false });
        handleAPIError(err);
      }
    });
  }

  handleEdit = editData => {
    const { archInfo, archInfoLoading } = this.state;
    if (archInfoLoading || !(editData.arch || archInfo.length)) {
      return;
    }
    this.props.form.resetFields();
    this.setState({
      isEdit: true,
      editData
    });
  };

  handleOk = () => {
    const { editData, memoryList } = this.state;
    const form = this.props.form;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      const { cname, k8s_component_name, arch } = fieldsValue;
      if (isK8sNameDuplicate(memoryList, k8s_component_name, editData.id)) {
        form.setFields({
          k8s_component_name: {
            value: k8s_component_name,
            errors: [
              new Error(formatMessage({id:'JavaMaven.k8s_name_duplicate'}))
            ]
          }
        });
        return;
      }
      this.setState(
        previousState => ({
          memoryList: previousState.memoryList.map(item => {
            if (item.id != editData.id) {
              return item;
            }
            return {
              ...item,
              cname,
              k8s_component_name,
              arch: typeof arch === 'undefined' ? item.arch : arch
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
      editData: false
    });
  };
  render() {
    const openJDKVersion = this.props.cnbVersionPolicyLoading
      ? "--"
      : getDefaultOpenJDKVersion(this.props.cnbVersionPolicy) || "--";
    const columns = [
      {
        title: formatMessage({id:'JavaMaven.name'}),
        dataIndex: "name",
        rowKey: "name",
        width: "14%"
      },
      {
        title: formatMessage({id:'JavaMaven.component_info'}),
        dataIndex: "cname",
        rowKey: "cname",
        width: "18%",
        render: (value, record) => (
          <div>
            <div>{value}</div>
            <small>{record.k8s_component_name}</small>
          </div>
        )
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
        width: "8%",

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
        title: (
          <span>
            {formatMessage({id:'JavaMaven.source_build_parameters'})}
            <Tooltip title={formatMessage({id:'JavaMaven.source_build_parameters_tip'})}>
              <Icon
                type="exclamation-circle-o"
                className={styles.sourceBuildTip}
              />
            </Tooltip>
          </span>
        ),
        dataIndex: "envs",
        rowKey: "envs",
        width: "44%",

        render: (val, row, index) => {
          const { archInfo } = this.state
          const envMap = envListToMap(val);
          const buildModule = envMap.BP_MAVEN_BUILT_MODULE || row.name || "--";
          const arch = row.arch || (archInfo && archInfo[0]) || "--";

          return (
            <div key={index}>
              <div style={{ display: "flex", marginBottom:6 }}>
                <p style={{ width: "30%" }}>{formatMessage({ id: 'JavaMaven.openjdk_version' })}:</p>
                <div style={{ width: "70%" }}>{openJDKVersion}</div>
              </div>
              <div style={{ display: "flex", marginBottom:6 }}>
                <p style={{ width: "30%" }}>{formatMessage({ id: 'JavaMaven.GOALS' })}:</p>
                <div style={{ width: "70%" }}>clean package</div>
              </div>
              <div style={{ display: "flex", marginBottom:6 }}>
                <p style={{ width: "30%" }}>{formatMessage({ id: 'JavaMaven.build_module' })}:</p>
                <div style={{ width: "70%" }}>{buildModule}</div>
              </div>
              <div style={{ display: "flex", marginBottom:6 }}>
                <p style={{ width: "30%" }}>{formatMessage({id:'JavaMaven.arch'})}:</p>
                <div style={{ width: "70%" }}>{arch}</div>
              </div>
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
          const { archInfo, archInfoLoading } = this.state;
          const archUnavailable =
            archInfoLoading || !(index.arch || archInfo.length);
          return (
            <Button
              disabled={archUnavailable}
              loading={archInfoLoading}
              onClick={() => {
                this.handleEdit(index);
              }}
            >
              {formatMessage({id:'JavaMaven.edit'})}
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
        disabled:
          record.operation ||
          this.state.archInfoLoading ||
          !(record.arch || this.state.archInfo.length),
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
      language,
      archInfo,
      archInfoLoading
    } = this.state;
    const isLanguage = language ? formItemLayout : en_formItemLayout
    const archOptions = archInfo && archInfo.length
      ? archInfo
      : editData && editData.arch
        ? [editData.arch]
        : [];
    return (
      <div>
        {isEdit && (
          <Modal
            title={formatMessage({id:'JavaMaven.edit'})}
            visible={isEdit}
            onOk={this.handleOk}
            onCancel={this.handleCancel}
            width={600}
            confirmLoading={archInfoLoading}
          >
            <Form.Item {...isLanguage} label={formatMessage({id:'JavaMaven.cname'})}>
              {getFieldDecorator("cname", {
                initialValue: editData && editData.cname,
                rules: getServiceNameRules()
              })(<Input placeholder={formatMessage({ id: 'placeholder.component_cname' })} />)}
            </Form.Item>
            <Form.Item
              {...isLanguage}
              label={formatMessage({id:'teamAdd.create.form.k8s_component_name'})}
            >
              {getFieldDecorator("k8s_component_name", {
                initialValue: editData && editData.k8s_component_name,
                rules: getK8sComponentNameRules()
              })(<Input placeholder={formatMessage({ id: 'placeholder.k8s_component_name' })} />)}
            </Form.Item>
            <Form.Item {...isLanguage} label={formatMessage({id:'JavaMaven.arch'})}>
              {getFieldDecorator("arch", {
                initialValue: (editData && editData.arch) || archOptions[0],
                rules: getArchRules()
              })(
                <Radio.Group>
                  {archOptions.map(item => <Radio key={item} value={item}>{item}</Radio>)}
                </Radio.Group>
              )}
            </Form.Item>
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
