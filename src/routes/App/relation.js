import React, { PureComponent, Fragment } from "react";
import { connect } from "dva";
import { Link } from "dva/router";
import {
  Row,
  Col,
  Card,
  Form,
  Select,
  Button,
  Icon,
  Input,
  Table,
  Modal,
  notification,
  Tooltip
} from "antd";
import {
  getRelationedApp,
  removeRelationedApp,
  batchAddRelationedApp
} from "../../services/app";

import globalUtil from "../../utils/global";
import ConfirmModal from "../../components/ConfirmModal";
import AddRelation from "../../components/AddRelation";
import ScrollerX from "../../components/ScrollerX";

const FormItem = Form.Item;
const Option = Select.Option;

// 查看连接信息
@connect(({ user, appControl }) => ({
  relationOuterEnvs: appControl.relationOuterEnvs
}))
class ViewRelationInfo extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      list: [],
      page: 1,
      page_size: 8,
      total: 0
    };
  }
  componentDidMount() {
    this.getEnvs();
  }
  onPageChange = page => {
    this.setState(
      {
        page
      },
      () => {
        this.getEnvs();
      }
    );
  };
  getEnvs = () => {
    const { page, page_size } = this.state;
    this.props.dispatch({
      type: "appControl/fetchRelationOuterEnvs",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        page,
        page_size
      },
      callback: res => {
        if (res && res._code == 200) {
          this.setState({ total: res.bean.total });
        }
      }
    });
  };
  // componentWillUnmount() {
  //   this.props.dispatch({
  //     type: "appControl/clearRelationOuterEnvs",
  //   });
  // }

  render() {
    const { relationOuterEnvs } = this.props;
    const { page, page_size, total } = this.state;
    return (
      <Modal
        title="依赖信息查看"
        width={600}
        visible
        onCancel={this.props.onCancel}
        footer={[<Button onClick={this.props.onCancel}>关闭</Button>]}
      >
        <Table
          pagination={{
            current: page,
            pageSize: page_size,
            total,
            onChange: this.onPageChange
          }}
          columns={[
            {
              title: "变量名",
              dataIndex: "attr_name",
              key: "1"
            },
            {
              title: "变量值",
              dataIndex: "attr_value",
              key: "2"
            },
            {
              title: "说明",
              dataIndex: "name",
              key: "3"
            }
          ]}
          dataSource={relationOuterEnvs || []}
        />
      </Modal>
    );
  }
}

// 添加、编辑变量
@Form.create()
// 查看连接信息
@connect(({}) => ({}))
class AddVarModal extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      list: []
    };
  }
  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.props.onSubmit && this.props.onSubmit(values);
      }
    });
  };
  handleCancel = () => {
    this.props.onCancel && this.props.onCancel();
  };
  handleList = (attr_name, attr_value) => {
    if (attr_name == null && attr_value == null) {
      return false;
    }
    this.props.dispatch({
      type: "appControl/getVariableList",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        attr_name,
        attr_value
      },
      callback: res => {
        let arr = res && res.list ? res.list : [];
        arr.unshift(attr_name ? attr_name + "" : attr_value + "");
        Array.from(new Set(arr));

        if (arr && arr.length > 0 && arr[0] == "null") {
          return;
        }

        this.setState({ list: arr });
        attr_name &&
          this.props.form.setFieldsValue({
            attr_name: attr_name
          });
        attr_value &&
          this.props.form.setFieldsValue({
            attr_value: attr_value
          });
      }
    });
  };
  render() {
    const { getFieldDecorator } = this.props.form;
    const data = this.props.data || "";
    const { list } = this.state;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 }
      }
    };
    return (
      <Modal
        title={data ? "编辑变量" : "添加变量"}
        onOk={this.handleSubmit}
        onCancel={this.handleCancel}
        visible
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...formItemLayout} label="变量名">
            {getFieldDecorator("attr_name", {
              initialValue: (data && data.attr_name) || "",
              rules: [
                { required: true, message: "请输入变量名称" },
                {
                  pattern: /[-._a-zA-Z][-._a-zA-Z0-9]/,
                  message: "格式不正确， /^[A-Za-z].*$/"
                }
              ]
            })(
              <Select
                disabled={data && data.attr_name ? true : false}
                placeholder="请输入变量名称 格式/^[A-Za-z].*$/"
                showSearch
                onSearch={val => {
                  this.handleList(val, null);
                }}
              >
                {list &&
                  list.map(item => {
                    return (
                      <Option key={item} value={item}>
                        {item}
                      </Option>
                    );
                  })}
              </Select>
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="变量值">
            {getFieldDecorator("attr_value", {
              initialValue: (data && data.attr_value) || "",
              rules: [{ required: true, message: "请输入变量值" }]
            })(
              <Select
                showSearch
                onSearch={val => {
                  this.handleList(null, val);
                }}
                placeholder="请输入变量值"
              >
                {list &&
                  list.map(item => {
                    return (
                      <Option key={item} value={item}>
                        {item}
                      </Option>
                    );
                  })}
              </Select>
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="说明">
            {getFieldDecorator("name", {
              initialValue: (data && data.name) || "",
              rules: [{ required: false, message: "请输入变量说明" }]
            })(<Input placeholder="请输入变量说明" />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

@connect(
  ({ user, appControl }) => ({
    currUser: user.currentUser,
    outerEnvs: appControl.outerEnvs
  }),
  null,
  null,
  { withRef: true }
)
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      showAddVar: null,
      showEditVar: null,
      showAddRelation: false,
      linkList: [],
      relationList: [],
      viewRelationInfo: null,
      showText: null,
      transfer: null,
      page: 1,
      page_size: 5,
      total: 0
    };
  }

  shouldComponentUpdate() {
    return true;
  }
  componentDidMount() {
    const { dispatch } = this.props;
    this.loadRelationedApp();
    this.fetchOuterEnvs();
  }
  loadRelationedApp = () => {
    getRelationedApp({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias
    }).then(res => {
      if (res) {
        let arr = res.bean.port_list;
        if (res.list && res.list.length > 0) {
          res.list.map((item, index) => {
            const { ports_list } = item;
            arr = arr.concat(ports_list);
          });
        }
        arr = this.isRepeat(arr);
        this.setState({ relationList: res.list || [], showText: arr });
      }
    });
  };
  isRepeat = arr => {
    var hash = {};

    for (var i in arr) {
      if (hash[arr[i]])
        //hash 哈希

        return true;
      hash[arr[i]] = true;
    }
    return false;
  };
  handleAddVar = () => {
    this.setState({ showAddVar: { new: true } });
  };
  handleCancelAddVar = () => {
    this.setState({ showAddVar: null });
  };
  showAddRelation = () => {
    this.setState({ showAddRelation: true });
  };
  handleCancelAddRelation = () => {
    this.setState({ showAddRelation: false });
  };
  handleSubmitAddRelation = ids => {
    batchAddRelationedApp({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias,
      dep_service_ids: ids
    }).then(data => {
      if (data) {
        notification.info({ message: "需要更新才能生效" });
        this.loadRelationedApp();
        this.handleCancelAddRelation();
      }
    });
  };
  handleSubmitAddVar = vals => {
    this.props.dispatch({
      type: "appControl/addOuterEnvs",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        attr_name: vals.attr_name,
        attr_value: vals.attr_value,
        name: vals.name
      },
      callback: res => {
        if (res && res._code == 200) {
          notification.success({ message: "操作成功" });
          this.fetchOuterEnvs();
        }
        this.handleCancelAddVar();
      }
    });
  };
  onDeleteVar = data => {
    this.setState({ deleteVar: data });
  };

  handleRemoveRelationed = app => {
    removeRelationedApp({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias,
      dep_service_id: app.service_id
    }).then(data => {
      if (data) {
        this.loadRelationedApp();
      }
    });
  };
  cancelDeleteVar = () => {
    this.setState({ deleteVar: null });
  };
  handleDeleteVar = () => {
    this.props.dispatch({
      type: "appControl/deleteEnvs",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        ID: this.state.deleteVar.ID
      },
      callback: res => {
        if (res && res._code == 200) {
          notification.success({ message: "操作成功" });
          this.fetchOuterEnvs();
        }
        this.cancelDeleteVar();
      }
    });
  };
  onEditVar = data => {
    this.setState({ showEditVar: data });
  };
  cancelEditVar = () => {
    this.setState({ showEditVar: null });
  };
  handleEditVar = vals => {
    const { showEditVar } = this.state;
    this.props.dispatch({
      type: "appControl/editEvns",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        ID: showEditVar.ID,
        attr_value: vals.attr_value,
        name: vals.name
      },
      callback: res => {
        if (res && res._code == 200) {
          notification.success({ message: "操作成功" });
          this.fetchOuterEnvs();
        }
        this.cancelEditVar();
      }
    });
  };
  fetchOuterEnvs = () => {
    const { page, page_size } = this.state;
    this.props.dispatch({
      type: "appControl/fetchOuterEnvs",
      payload: {
        page,
        page_size,
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias
      },
      callback: res => {
        if (res && res._code == 200) {
          this.setState({ total: res.bean.total });
        }
      }
    });
  };
  onViewRelationInfo = data => {
    this.setState({ viewRelationInfo: data });
  };
  cancelViewRelationInfo = data => {
    this.setState({ viewRelationInfo: null });
  };

  onTransfer = data => {
    this.setState({ transfer: data });
  };

  cancelTransfer = () => {
    this.setState({ transfer: null });
  };

  handleTransfer = () => {
    const { transfer } = this.state;
    this.props.dispatch({
      type: "appControl/putTransfer",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        ID: transfer.ID,
        scope: transfer.scope == "inner" ? "outer" : "inner"
      },
      callback: res => {
        if (res && res._code == 200) {
          notification.success({ message: "操作成功" });
          this.fetchOuterEnvs();
        }
        this.cancelTransfer();
      }
    });
  };

  onServiceInfoPageChange = page => {
    this.setState(
      {
        page
      },
      () => {
        this.fetchOuterEnvs();
      }
    );
  };

  render() {
    const { showText, relationList, page, page_size, total } = this.state;
    const { outerEnvs } = this.props;
    return (
      <Fragment>
        <Card style={{ marginBottom: 24 }} title={<span>组件连接信息</span>}>
          <ScrollerX sm={650}>
            <Table
              pagination={{
                current: page,
                pageSize: page_size,
                total,
                onChange: this.onServiceInfoPageChange
              }}
              columns={[
                {
                  title: "变量名",
                  dataIndex: "attr_name",
                  key: "1",
                  width: "30%",
                  render: v => (
                    <Tooltip title={v}>
                      <div
                        style={{
                          wordBreak: "break-all",
                          wordWrap: "break-word"
                        }}
                      >
                        {v}
                      </div>
                    </Tooltip>
                  )
                },
                {
                  title: "变量值",
                  dataIndex: "attr_value",
                  key: "2",
                  width: "30%",
                  render: v => (
                    <Tooltip title={v}>
                      <div
                        style={{
                          wordBreak: "break-all",
                          wordWrap: "break-word"
                        }}
                      >
                        {v}
                      </div>
                    </Tooltip>
                  )
                },
                {
                  title: "说明",
                  dataIndex: "name",
                  key: "3",
                  width: "25%",
                  render: v => (
                    <Tooltip title={v}>
                      <div
                        style={{
                          wordBreak: "break-all",
                          wordWrap: "break-word"
                        }}
                      >
                        {v}
                      </div>
                    </Tooltip>
                  )
                },
                {
                  title: "操作",
                  dataIndex: "action",
                  key: "4",
                  width: "15%",
                  render: (val, data) => (
                    <Fragment>
                      {data.is_change ? (
                        <a
                          href="javascript:;"
                          onClick={() => {
                            this.onDeleteVar(data);
                          }}
                        >
                          删除
                        </a>
                      ) : (
                        ""
                      )}
                      <Tooltip
                        title={
                          <p>
                            将此连接信息变量转换为
                            <br />
                            环境变量
                          </p>
                        }
                      >
                        <a
                          href="javascript:;"
                          onClick={() => {
                            this.onTransfer(data);
                          }}
                          style={{ marginRight: "5px" }}
                        >
                          转移
                        </a>
                      </Tooltip>

                      {data.is_change ? (
                        <a
                          href="javascript:;"
                          onClick={() => {
                            this.onEditVar(data);
                          }}
                        >
                          修改
                        </a>
                      ) : (
                        ""
                      )}
                    </Fragment>
                  )
                }
              ]}
              dataSource={outerEnvs}
            />
          </ScrollerX>
          <div style={{ marginTop: 10, textAlign: "right" }}>
            <Button onClick={this.handleAddVar}>
              <Icon type="plus" /> 添加变量
            </Button>
          </div>
        </Card>
        <Card
          title={[
            <span>依赖组件信息</span>,
            <span style={{ color: "red" }}>
              {showText && "（依赖的组件有相同的端口冲突,请处理）"}
            </span>
          ]}
        >
          <ScrollerX sm={650}>
            <Table
              pagination={false}
              columns={[
                {
                  title: "组件名",
                  dataIndex: "service_cname",
                  render: (val, data) => (
                    <Link
                      to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/app/${
                        data.service_alias
                      }/overview`}
                    >
                      {val}
                    </Link>
                  )
                },
                {
                  title: "所属应用",
                  dataIndex: "group_name",
                  render: (val, data) => (
                    <Link
                      to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/${
                        data.group_id
                      }`}
                    >
                      {val}
                    </Link>
                  )
                },
                {
                  title: "组件说明",
                  dataIndex: "var",
                  render: (val, data) => {}
                },
                {
                  title: "操作",
                  dataIndex: "var",
                  render: (val, data) => (
                    <Fragment>
                      <a
                        onClick={() => this.onViewRelationInfo(data)}
                        href="javascript:;"
                        style={{ margintRight: 10 }}
                      >
                        连接信息
                      </a>
                      <a
                        onClick={() => {
                          this.handleRemoveRelationed(data);
                        }}
                        href="javascript:;"
                        style={{ margintRight: 10 }}
                      >
                        取消依赖
                      </a>
                    </Fragment>
                  )
                }
              ]}
              dataSource={relationList}
            />
          </ScrollerX>
          <div style={{ marginTop: 10, textAlign: "right" }}>
            <Button onClick={this.showAddRelation}>
              <Icon type="plus" /> 添加依赖
            </Button>
          </div>
        </Card>
        {this.state.showAddVar && (
          <AddVarModal
            onCancel={this.handleCancelAddVar}
            onSubmit={this.handleSubmitAddVar}
            data={this.state.showAddVar}
          />
        )}
        {this.state.showEditVar && (
          <AddVarModal
            onCancel={this.cancelEditVar}
            onSubmit={this.handleEditVar}
            data={this.state.showEditVar}
          />
        )}
        {this.state.transfer && (
          <ConfirmModal
            onOk={this.handleTransfer}
            onCancel={this.cancelTransfer}
            title="转移连接信息变量"
            desc="确定要将此连接信息变量转换为环境变量吗?"
            subDesc="此操作不可恢复"
          />
        )}
        {this.state.deleteVar && (
          <ConfirmModal
            onOk={this.handleDeleteVar}
            onCancel={this.cancelDeleteVar}
            title="删除变量"
            desc="确定要删除此变量吗？"
            subDesc="此操作不可恢复"
          />
        )}
        {this.state.showAddRelation && (
          <AddRelation
            appAlias={this.props.appAlias}
            onCancel={this.handleCancelAddRelation}
            onSubmit={this.handleSubmitAddRelation}
          />
        )}
        {this.state.viewRelationInfo && (
          <ViewRelationInfo
            appAlias={this.state.viewRelationInfo.service_alias}
            onCancel={this.cancelViewRelationInfo}
          />
        )}
      </Fragment>
    );
  }
}
