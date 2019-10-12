import React, { PureComponent, Fragment } from "react";
import moment from "moment";
import { connect } from "dva";
import { Link } from "dva/router";
import { Table } from "antd";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Input,
  Icon,
  Menu,
  Dropdown,
  Modal,
  notification,
  Select,
  Radio,
  Checkbox,
  List,
  Switch,
  Tabs,
  Divider,
  InputNumber,
  Upload
} from "antd";
import { routerRedux } from "dva/router";
import PageHeaderLayout from "../../layouts/PageHeaderLayout";
import ConfirmModal from "../../components/ConfirmModal";
import Ellipsis from "../../components/Ellipsis";
import FooterToolbar from "../../components/FooterToolbar";
import config from "../../config/config";
import cookie from "../../utils/cookie";

import styles from "./Index.less";
import mytabcss from "./mytab.less";
import globalUtil from "../../utils/global";
import pluginUtil from "../../utils/plugin";
import PluginInfo from "./PluginInfo";

const TabPane = Tabs.TabPane;
const FormItem = Form.Item;
const { TextArea } = Input;
const ButtonGroup = Button.Group;

const RadioGroup = Radio.Group;
const { Option } = Select;
const { SubMenu } = Menu;
const formItemLayout = {
  labelCol: {
    span: 8
  },
  wrapperCol: {
    span: 16
  }
};

const sharingFormItemLayout = {
  labelCol: {
    span: 2
  },
  wrapperCol: {
    span: 22
  }
};
const tailFormItemLayout = {
  wrapperCol: {
    xs: {
      span: 24,
      offset: 0
    },
    sm: {
      span: 14,
      offset: 6
    }
  }
};

const token = cookie.get("token");
const myheaders = {};
if (token) {
  myheaders.Authorization = `GRJWT ${token}`;
}

const uploadButton = (
  <div>
    <Icon type="plus" />
    <div className="ant-upload-text">上传图标</div>
  </div>
);

@Form.create()
class AppInfo extends PureComponent {
  componentDidMount() {
    if (this.props.getref) {
      this.props.getref(this);
    }
  }

  handleSubmitApp = e => {
    const { dispatch } = this.props;
    this.props.form.validateFields((err, values) => {
      if (!err) {
        console.log(values);
      }
    });
  };
  getValue = fun => {
    this.props.form.validateFields((err, values) => {
      if (!err) {
        fun(values);
      }
    });
  };
  handleCheckChange = (appname, val, e) => {
    const name = {};
    const thisval = val;
    name[appname] = "**None**";
    if (e.target.checked) {
      this.props.form.setFieldsValue(name);
    } else {
      name[appname] = thisval;
      this.props.form.setFieldsValue(name);
    }
  };
  renderConnectInfo = () => {
    const app = this.props.app || {};
    const {
      getFieldDecorator,
      getFieldValue,
      setFieldsValue
    } = this.props.form;
    if (
      app.service_connect_info_map_list &&
      app.service_connect_info_map_list.length
    ) {
      return (
        <div
          style={{
            marginBottom: 24
          }}
        >
          <h4
            style={{
              marginBottom: 8
            }}
          >
            连接信息
          </h4>
          <Divider />
          <Row>
            {app.service_connect_info_map_list.map(item => (
              <Col span={8}>
                <FormItem label={item.attr_name} style={{ padding: 16 }}>
                  {getFieldDecorator(`connect||${item.attr_name}||attr_value`, {
                    initialValue: item.attr_value,
                    rules: [
                      {
                        required: true,
                        message: "不能为空"
                      }
                    ]
                  })(<Input placeholder={item.attr_value} />)}
                  {getFieldDecorator(`connect||${item.attr_name}||random`, {
                    valuePropName: "checked",
                    rules: [
                      {
                        required: false,
                        message: ""
                      }
                    ],
                    initialValue: false
                  })(
                    <Checkbox
                      onChange={this.handleCheckChange.bind(
                        this,
                        `connect||${item.attr_name}||attr_value`,
                        item.attr_value
                      )}
                    >
                      生成随机值
                    </Checkbox>
                  )}
                  {getFieldDecorator(`connect||${item.attr_name}||is_change`, {
                    valuePropName: "checked",
                    initialValue: item.is_change,
                    rules: [
                      {
                        required: false,
                        message: ""
                      }
                    ]
                  })(<Checkbox>可修改</Checkbox>)}
                </FormItem>
              </Col>
            ))}
          </Row>
        </div>
      );
    }
    return null;
  };
  renderEvn = () => {
    const {
      getFieldDecorator,
      getFieldValue,
      setFieldsValue
    } = this.props.form;
    const app = this.props.app || {};
    if (app.service_env_map_list && app.service_env_map_list.length) {
      return (
        <div
          style={{
            marginBottom: 24
          }}
        >
          <h4
            style={{
              marginBottom: 8
            }}
          >
            环境变量
          </h4>
          <Divider />
          <Row>
            {app.service_env_map_list.map(item => (
              <Col span={8}>
                <FormItem label={item.attr_name} style={{ padding: 16 }}>
                  {getFieldDecorator(`env||${item.attr_name}||attr_value`, {
                    initialValue: item.attr_value,
                    rules: [
                      {
                        required: true,
                        message: "不能为空"
                      }
                    ]
                  })(<Input />)}
                  {getFieldDecorator(`env||${item.attr_name}||is_change`, {
                    valuePropName: "checked",
                    initialValue: item.is_change,
                    rules: [
                      {
                        required: false,
                        message: ""
                      }
                    ]
                  })(<Checkbox>可修改</Checkbox>)}
                </FormItem>
              </Col>
            ))}
          </Row>
        </div>
      );
    }
    return null;
  };
  renderExtend = () => {
    const app = this.props.app || {};
    const { getFieldDecorator, getFieldValue } = this.props.form;
    if (app.extend_method_map) {
      return (
        <div
          style={{
            marginBottom: 24
          }}
        >
          <h4
            style={{
              marginBottom: 8
            }}
          >
            伸缩规则
          </h4>
          <Divider />
          <Row>
            <Col span={6}>
              <FormItem label="最小节点(个)" style={{ padding: 16 }}>
                {getFieldDecorator("extend||min_node", {
                  initialValue: app.extend_method_map.min_node,
                  rules: [
                    {
                      required: true,
                      message: "输入格式不正确"
                    }
                  ]
                })(
                  <InputNumber
                    style={{ width: "100%" }}
                    placeholder="请输入最小节点"
                    min={1}
                    step={app.extend_method_map.step_node}
                  />
                )}
              </FormItem>
            </Col>
            <Col span={6}>
              <FormItem label="最大节点(个)" style={{ padding: 16 }}>
                {getFieldDecorator("extend||max_node", {
                  initialValue: app.extend_method_map.max_node,
                  rules: [
                    {
                      required: true,
                      message: "输入格式不正确"
                    }
                  ]
                })(
                  <InputNumber
                    style={{ width: "100%" }}
                    placeholder="请输入最大节点"
                    min={1}
                    step={app.extend_method_map.step_node}
                  />
                )}
              </FormItem>
            </Col>
            <Col span={6}>
              <FormItem label="节点步长(个)" style={{ padding: 16 }}>
                {getFieldDecorator("extend||step_node", {
                  initialValue: app.extend_method_map.step_node,
                  rules: [
                    {
                      required: true,
                      message: "输入格式不正确"
                    }
                  ]
                })(
                  <InputNumber
                    style={{ width: "100%" }}
                    placeholder="请输入节点步长"
                    min={app.extend_method_map.min_node}
                    max={app.extend_method_map.max_node}
                  />
                )}
              </FormItem>
            </Col>
            <Col span={6}>
              <FormItem label="最小内存(M)" style={{ padding: 16 }}>
                {getFieldDecorator("extend||min_memory", {
                  initialValue: app.extend_method_map.min_memory,
                  rules: [
                    {
                      required: true,
                      message: "输入格式不正确"
                    }
                  ]
                })(
                  <InputNumber
                    style={{ width: "100%" }}
                    placeholder="请输入最小内存"
                    min={64}
                    // min={app.extend_method_map.min_memory}
                    max={app.extend_method_map.max_memory}
                    step={app.extend_method_map.step_memory}
                  />
                )}
              </FormItem>
            </Col>
          </Row>
        </div>
      );
    }
    return null;
  };

  render() {
    const { getFieldDecorator, getFieldValue } = this.props.form;
    return (
      <Fragment>
        {this.renderConnectInfo()}
        {this.renderEvn()}
        {this.renderExtend()}
      </Fragment>
    );
  }
}

@connect(({ user, groupControl, loading }) => ({
  currUser: user.currentUser,
  apps: groupControl.apps,
  groupDetail: groupControl.groupDetail || {},
  loading
}))
@Form.create()
export default class Main extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      previewVisible: false,
      previewImage: "",
      toDelete: false,
      recordShare: false,
      checkShare: true,
      ShareStep: 0,
      ID: 0,
      info: null,
      selectedApp: "",
      service: null,
      key: "",
      fileList: [],
      shareList: [],
      sharearrs: [],
      shareModal: null,
      isShare: "false",
      service_cname: "",
      dep_service_name: [],
      share_service_list: [],
      ShareTypeShow: false,
      scopeValue: "goodrain:private"
    };
    this.com = [];
    this.share_group_info = null;
    this.share_service_list = null;
  }
  getParams() {
    return {
      groupId: this.props.match.params.groupId,
      shareId: this.props.match.params.shareId
    };
  }
  componentDidMount() {
    this.getShareInfo();
  }
  getShareInfo() {
    const { dispatch, form, index } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    const region_name = globalUtil.getCurrRegionName();
    const params = this.getParams();
    dispatch({
      type: "groupControl/getShareInfo",
      payload: {
        team_name,
        ...params
      },
      callback: data => {
        let selectedApp = "";
        if (data) {
          if (data.bean.share_service_list[0]) {
            selectedApp = data.bean.share_service_list[0].service_alias;
          }
          if (
            data.bean.share_group_info &&
            data.bean.share_group_info.scope == "goodrain"
          ) {
            this.setState({
              ShareTypeShow: true
            });
          }
          this.setState({
            info: data.bean,
            selectedApp,
            key: data.bean.share_service_list[0].service_alias,
            share_service_list: data.bean.share_service_list
          });

          if (data.bean.share_group_info.pic) {
            this.setState({
              fileList: [
                {
                  uid: -1,
                  name: data.bean.share_group_info.pic,
                  status: "done",
                  url: data.bean.share_group_info.pic
                }
              ]
            });
          }
          this.share_group_info = data.bean.share_group_info;
          this.share_service_list = data.bean.share_service_list;

          let arr = [];
          if (
            data.bean.share_service_list &&
            data.bean.share_service_list.length > 0
          ) {
            data.bean.share_service_list.map(item => {
              arr.push(item.service_share_uuid);
            });
            this.setState({
              shareList: arr,
              sharearrs: arr
            });
            // this.props.form.setFieldsValue({ sharing: arr })
          }
        }
      },
      handleError: res => {
        if (res && res.status === 404) {
          this.props.dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/exception/404`
            )
          );
        }
      }
    });
  }

  handleSubmit = e => {
    const { dispatch } = this.props;
    const { scopeValue } = this.state;
    const newinfo = {};
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.share_group_info.describe = values.describe;
        this.share_group_info.group_name = values.group_name;
        this.share_group_info.scope =
          values.scope == "goodrain" ? scopeValue : values.scope;
        this.share_group_info.version = values.version;
        if (this.state.fileList[0] != undefined) {
          this.state.fileList[0].response
            ? (this.share_group_info.pic = this.state.fileList[0].response.data.bean.file_url)
            : this.state.fileList[0].url;
          // this.share_group_info['pic'] = this.state.fileList[0].response.data.bean.file_url || this.state.fileList[0].url;
        } else {
          this.share_group_info.pic = "";
        }

        const share_service_data = this.share_service_list;
        let arr = [];
        let dep_service_key = [];
        this.state.sharearrs.map(item => {
          share_service_data.map(option => {
            if (item == option.service_share_uuid) {
              arr.push(option);
              option.dep_service_map_list &&
                option.dep_service_map_list.length > 0 &&
                option.dep_service_map_list.map(items => {
                  dep_service_key.push(items.dep_service_key);
                });
            }
          });
        });

        const comdata = this.com;
        comdata.map(app => {
          const apptab = app.props.tab;
          let appvalue = null;
          app.props.form.validateFields((err, val) => {
            if (!err) {
              appvalue = val;
            }
          });
          share_service_data.map(option => {
            if (option.service_alias == apptab) {
              for (var index in appvalue) {
                const indexname = "";
                var indexarr = [];
                indexarr = index.split("||");
                if (indexarr[0] == "connect" && indexarr[2] != "random") {
                  option.service_connect_info_map_list.map(serapp => {
                    if (serapp.attr_name == indexarr[1]) {
                      serapp[indexarr[2]] = appvalue[index];
                    }
                  });
                }
                if (indexarr[0] == "env") {
                  option.service_env_map_list.map(serapp => {
                    if (serapp.attr_name == indexarr[1]) {
                      serapp[indexarr[2]] = appvalue[index];
                    }
                  });
                }
                if (indexarr[0] == "extend") {
                  option.extend_method_map[indexarr[1]] = appvalue[index];
                }
              }
            }
          });
        });

        //  if(this.state.isShare){
        //   newinfo.use_force="true"
        //  }else{
        //   newinfo.use_force="false"
        //  }

        newinfo.share_group_info = this.share_group_info;
        // newinfo.share_service_list = share_service_data;
        newinfo.share_service_list = arr;
        newinfo.share_plugin_list = this.state.info.share_plugin_list;
        const team_name = globalUtil.getCurrTeamName();
        const shareId = this.props.match.params.shareId;
        const groupId = this.props.match.params.groupId;

        dispatch({
          type: "groupControl/subShareInfo",
          payload: {
            team_name,
            share_id: shareId,
            use_force: this.state.isShare,
            new_info: newinfo
          },
          callback: data => {
            this.onCancels("false");
            dispatch(
              routerRedux.push(
                `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/share/two/${groupId}/${shareId}`
              )
            );
          }
          // handleError: (res) => {     if(res && res.status === 404){
          // this.props.dispatch(routerRedux.push('/exception/404'));     } }
        });
      }
    });
  };

  onCancels = isShare => {
    this.setState({
      shareModal: null,
      isShare: isShare ? isShare : this.state.isShare,
      service_cname: "",
      dep_service_name: []
    });
  };

  handleGiveup = () => {
    const groupId = this.props.match.params.groupId;

    const { dispatch } = this.props;
    dispatch({
      type: "groupControl/giveupShare",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        share_id: this.props.match.params.shareId
      },
      callback: data => {
        dispatch(
          routerRedux.push(
            `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/${groupId}`
          )
        );
      }
    });
  };

  handleLogoChange = ({ fileList }) => {
    this.setState({ fileList });
  };
  handleLogoRemove = () => {
    this.setState({ fileList: [] });
  };

  componentWillUnmount() {}
  save = val => {
    this.com.push(val);
  };
  tabClick = (val, e) => {
    this.setState({ key: val });
  };

  onFileChange = e => {
    const share_service_data = this.share_service_list;
    const { shareList, sharearrs } = this.state;
    // this.props.form.setFieldsValue({sharing:e})

    if (e.length > 0) {
      var newArray = sharearrs.filter(item => !e.includes(item));

      let arr = [];
      let dep_service_key = [];
      let dep_service_name = [];
      e.map(item => {
        share_service_data.map(option => {
          if (item == option.service_share_uuid) {
            option.dep_service_map_list &&
              option.dep_service_map_list.length > 0 &&
              option.dep_service_map_list.map(items => {
                dep_service_key.push(items.dep_service_key);
                dep_service_name.push(option.service_cname);
              });
          }
        });
      });

      let show = false;
      let name = "";
      if (newArray.length > 0 && dep_service_key.length > 0) {
        newArray.map(item => {
          share_service_data.map(option => {
            if (item == option.service_share_uuid) {
              name = option.service_cname;
            }
          });
          dep_service_key.map(items => {
            if (items == item) {
              show = true;
            }
          });
        });
      }

      if (show && e.length <= sharearrs.length) {
        this.setState({
          shareModal: e,
          service_cname: name,
          dep_service_name
        });
      } else {
        this.setState(
          {
            sharearrs: e
          },
          () => {
            this.handleTabList();
          }
        );
      }
    } else {
      notification.warning({ message: "分享组件不能少于1个" });
    }
  };

  handleSubmits = () => {
    this.setState(
      { sharearrs: this.state.shareModal, isShare: "true", shareModal: null },
      () => {
        this.handleTabList();
      }
    );
  };

  handleTabList = () => {
    const { sharearrs } = this.state;

    const share_service_data = this.share_service_list;
    let arr = [];

    sharearrs.map(item => {
      share_service_data.map(items => {
        if (item == items.service_share_uuid) {
          arr.push(items);
        }
      });
    });

    this.setState({
      share_service_list: arr
    });
    if (arr.length > 0) {
      this.tabClick(arr[0].service_alias);
    }
  };

  hanldeShareTypeChange = e => {
    const { getFieldDecorator, setFieldsValue } = this.props.form;
    const value = e.target.value;
    this.setState({
      ShareTypeShow: value == "goodrain" ? true : false
    });
    setFieldsValue({ scope: value });
  };
  hanldeScopeValueChange = e => {
    const value = e.target.value;
    this.setState({
      scopeValue: value
    });
  };

  getBase64 = file => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  handlePreview = async file => {
    if (!file.url && !file.preview) {
      file.preview = await this.getBase64(file.originFileObj);
    }

    this.setState({
      previewImage: file.url || file.preview,
      previewVisible: true
    });
  };

  handleCancel = () => this.setState({ previewVisible: false });

  render() {
    const info = this.state.info;
    if (!info) {
      return null;
    }
    const appinfo = info.share_group_info || {};
    const apps = info.share_service_list || [];
    const plugins = info.share_plugin_list || [];
    const tabk = this.state.key;
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const loading = this.props.loading;
    const fileList = this.state.fileList;
    const {
      previewVisible,
      previewImage,
      shareModal,
      sharearrs,
      share_service_list,
      ShareTypeShow
    } = this.state;
    const pageHeaderContent = (
      <div className={styles.pageHeaderContent}>
        <div className={styles.content}>
          <div className={styles.contentTitle}>
            {info.share_group_info.group_name || "-"}
          </div>
        </div>
      </div>
    );

    return (
      <PageHeaderLayout content={pageHeaderContent}>
        <div>
          <Card
            style={{
              marginBottom: 24
            }}
            title="基本信息"
            bordered={false}
            bodyStyle={{
              padding: 0
            }}
          >
            <div
              style={{
                padding: "24px"
              }}
            >
              <Form layout="horizontal" className={styles.stepForm}>
                <Row gutter={24}>
                  <Col span="12">
                    <Form.Item {...formItemLayout} label="应用名">
                      {getFieldDecorator("group_name", {
                        initialValue: appinfo.group_name,
                        rules: [
                          {
                            required: true,
                            message: "应用名不能为空"
                          }
                        ]
                      })(<Input placeholder="默认使用上次应用名或应用组名" />)}
                    </Form.Item>
                  </Col>
                  <Col span="12">
                    <Form.Item {...formItemLayout} label="版本">
                      {getFieldDecorator("version", {
                        initialValue: appinfo.version,
                        rules: [
                          {
                            required: true,
                            message: "版本不能为空"
                          }
                        ]
                      })(<Input placeholder="默认使用上次的版本" />)}
                    </Form.Item>
                  </Col>
                  <Col span="12" style={{ height: "104px" }}>
                    <Form.Item {...formItemLayout} label="分享范围">
                      {getFieldDecorator("scope", {
                        initialValue: appinfo.scope || "team",
                        rules: [
                          {
                            required: true
                          }
                        ]
                      })(
                        <RadioGroup onChange={this.hanldeShareTypeChange}>
                          <Radio value="team">团队</Radio>
                          <Radio value="enterprise">公司</Radio>
                          <Radio value="goodrain">应用市场</Radio>
                        </RadioGroup>
                      )}

                      {ShareTypeShow && (
                        <div className={styles.connect}>
                          <Icon
                            className={styles.icon}
                            type="caret-up"
                            theme="filled"
                          />

                          <RadioGroup
                            onChange={this.hanldeScopeValueChange}
                            value={this.state.scopeValue}
                          >
                            <Radio value="goodrain:publish">公开应用</Radio>
                            <Radio value="goodrain:private">私有应用</Radio>
                          </RadioGroup>
                        </div>
                      )}
                    </Form.Item>
                  </Col>
                  <Col span="12" style={{ height: "104px" }}>
                    <Form.Item {...formItemLayout} label="应用说明">
                      {getFieldDecorator("describe", {
                        initialValue: appinfo.describe,
                        rules: [
                          {
                            required: false,
                            message: "请输入应用说明"
                          }
                        ]
                      })(
                        <TextArea
                          placeholder="请输入应用说明"
                          style={{ height: "70px" }}
                        />
                      )}
                    </Form.Item>
                  </Col>
                  <Col span="12">
                    <Form.Item {...formItemLayout} label="图标">
                      {getFieldDecorator("pic", {
                        rules: [
                          {
                            required: false,
                            message: "请上传图标"
                          }
                        ]
                      })(
                        <Upload
                          className="logo-uploader"
                          name="file"
                          accept="image/jpg,image/jpeg,image/png"
                          action={config.imageUploadUrl}
                          listType="picture-card"
                          fileList={fileList}
                          headers={myheaders}
                          onChange={this.handleLogoChange}
                          onRemove={this.handleLogoRemove}
                          onPreview={this.handlePreview}
                        >
                          {fileList.length > 0 ? null : uploadButton}
                        </Upload>
                      )}
                    </Form.Item>
                    <Modal
                      visible={previewVisible}
                      footer={null}
                      onCancel={this.handleCancel}
                    >
                      <img
                        alt="example"
                        style={{ width: "100%" }}
                        src={previewImage}
                      />
                    </Modal>
                  </Col>
                </Row>
              </Form>
            </div>
          </Card>
          <Card
            style={{
              marginBottom: 24
            }}
            title="应用信息配置"
            bordered={false}
            bodyStyle={{
              padding: 0
            }}
          >
            <div
              style={{
                padding: "24px"
              }}
            >
              <div className={mytabcss.mytab}>
                {/* <Form layout="horizontal" className={styles.stepForm}>
                  <Form.Item {...sharingFormItemLayout} label="分享组件" required={true}> */}
                {/* {getFieldDecorator("sharing", {
                      initialValue: shareList,
                      // setFieldsValue:shareList,
                      rules: [
                        {
                          required: true,
                          message: "请选择分享的组件",
                        },
                      ],
                    })( */}
                {/* <Checkbox.Group
                      onChange={this.onFileChange}
                      value={sharearrs}
                      style={{ display: "block", marginTop: "9px" }}
                    >
                      {apps.map(order => {
                        return (
                          <Checkbox key={order.service_share_uuid} value={order.service_share_uuid} >
                            {order.service_cname}
                          </Checkbox>
                        );
                      })}
                    </Checkbox.Group> */}
                {/* )} */}
                {/* </Form.Item>
                </Form> */}

                <h4
                  className={mytabcss.required}
                  style={{
                    marginBottom: 8
                  }}
                >
                  分享组件
                </h4>
                <div className={mytabcss.mytabtit} id="mytabtit">
                  <Checkbox.Group
                    onChange={this.onFileChange}
                    value={sharearrs}
                    style={{ display: "block", marginTop: "9px" }}
                  >
                    <Tabs activeKey={tabk} onChange={this.tabClick}>
                      {apps.map(apptit => (
                        <TabPane
                          key={apptit.service_alias}
                          tab={
                            <span className={mytabcss.cont}>
                              <Checkbox
                                onChange={this.onChange}
                                value={apptit.service_share_uuid}
                                style={{ marginRight: "10px" }}
                              />
                              <a
                                tab={apptit.service_cname}
                                href="javacsript:;"
                                onClick={this.tabClick.bind(
                                  this,
                                  apptit.service_alias
                                )}
                              >
                                {apptit.service_cname}
                              </a>
                            </span>
                          }
                        />
                      ))}
                    </Tabs>
                  </Checkbox.Group>
                </div>
                {share_service_list.map(app =>
                  tabk == app.service_alias ? (
                    <div key={app.service_alias}>
                      <AppInfo
                        app={app}
                        getref={this.save}
                        tab={app.service_alias}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "none"
                      }}
                      key={app.service_alias}
                    >
                      <AppInfo
                        app={app}
                        getref={this.save}
                        tab={app.service_alias}
                      />
                    </div>
                  )
                )}
              </div>
            </div>
          </Card>
          <Card
            style={{
              marginBottom: 128
            }}
            title="插件信息"
            bordered={false}
          >
            <Table
              size="middle"
              dataSource={plugins}
              columns={[
                {
                  title: "插件名",
                  dataIndex: "plugin_alias"
                },
                {
                  title: "分类",
                  dataIndex: "category",
                  render: (v, data) => {
                    return pluginUtil.getCategoryCN(v);
                  }
                },
                {
                  title: "版本",
                  dataIndex: "build_version"
                }
              ]}
            />
          </Card>

          {shareModal && (
            <Modal
              title="依赖检测"
              visible={shareModal}
              onOk={this.handleSubmits}
              onCancel={this.onCancels}
              okText={"确定"}
              cancelText={"取消"}
            >
              <div>
                <a>{this.state.service_cname}组件</a>被需要分享的
                {this.state.dep_service_name &&
                  this.state.dep_service_name.length > 0 &&
                  this.state.dep_service_name.map((item, index) => {
                    return (
                      <a style={{ marginLeft: "5px" }} key={index}>
                        {item}组件
                      </a>
                    );
                  })}
                依赖,
                <p style={{ marginTop: "5px" }}>
                  是否确定取消分享<a>{this.state.service_cname}</a>组件
                </p>
                .
              </div>
            </Modal>
          )}

          <FooterToolbar>
            <Button
              type="primary"
              htmlType="submit"
              onClick={this.handleSubmit}
            >
              提交
            </Button>
            <Button
              disabled={loading.effects["groupControl/giveupShare"]}
              onClick={this.handleGiveup}
            >
              放弃分享
            </Button>
          </FooterToolbar>
        </div>
      </PageHeaderLayout>
    );
  }
}
