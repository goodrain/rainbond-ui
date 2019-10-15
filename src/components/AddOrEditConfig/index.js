/*
  添加或者修改插件配置
*/
import React, { PureComponent, Fragment } from "react";
import { connect } from "dva";
import { Link, Switch, Route } from "dva/router";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Icon,
  Menu,
  Input,
  Dropdown,
  Table,
  Modal,
  Radio,
  Select,
  Tooltip,
} from "antd";
import globalUtil from "../../utils/global";

const RadioGroup = Radio.Group;
const Option = Select.Option;

@Form.create()
class EvnOption extends React.Component {
  checkAttrAltValue = (rule, value, callback) => {
    const { getFieldValue } = this.props.form;
    if (getFieldValue("attr_type") !== "string" && !value) {
      callback("请输入可选值");
    } else {
      callback();
    }
  };
  componentWillMount() {
    this.props.onDidMount && this.props.onDidMount(this.props.index, this);
  }
  componentDidMount() {
    this.props.onChange && this.props.onChange(this.props.index, this.props.form.getFieldsValue());
  }
  componentWillUnmount() {
    this.props.onUnmount && this.props.onUnmount(this.props.index);
  }
  validAttrName = (rule, value, callback) => {
    if (!value) {
      callback("属性名");
      return;
    }

    if (!/^[A-Za-z].*$/.test(value || "")) {
      callback("大小写英文_");
      return;
    }
    callback();
  };
  check(callback) {
    const form = this.props.form;
    form.validateFields((err, fieldsValue) => {
      callback && callback(err);
    });
  }
  handleOnchange = (key) => {
    this.props.form.validateFields([key], (err, fieldsValue) => {
      setTimeout(() => {
        this.props.onChange &&
          this.props.onChange(this.props.index, this.props.form.getFieldsValue());
      });
      if (err) return;
    });
  };
  render() {
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const attr_type = getFieldValue("attr_type") || "string";
    const data = this.props.data || {};
    const protocols = this.props.protocols || [];

    return (
      <Form style={{ display: "inline-block", verticalAlign: "middle" }} layout="inline">
        <Form.Item hasFeedback={false} style={{ display: "none" }}>
          {getFieldDecorator("ID", {
            initialValue: data.ID || "",
          })(<Input />)}
        </Form.Item>
        <Form.Item hasFeedback={false}>
          {getFieldDecorator("attr_name", {
            initialValue: data.attr_name || "",
            rules: [{ validator: this.validAttrName }],
          })(<Input
            onChange={() => {
                this.handleOnchange("attr_name");
              }}
            style={{ width: 80 }}
            placeholder="属性名"
          />)}
        </Form.Item>
        <Form.Item hasFeedback={false}>
          {getFieldDecorator("protocol", {
            initialValue: data.protocol || "",
            rules: [{ required: false, message: "协议" }],
          })(<Select
            onChange={() => {
                this.handleOnchange("protocal");
              }}
            style={{ width: 100 }}
          >
            <Option value="">协议</Option>
            {protocols.map(item => <Option value={item}>{item}</Option>)}
          </Select>)}
        </Form.Item>
        <Form.Item hasFeedback={false}>
          {getFieldDecorator("attr_type", {
            initialValue: data.attr_type || "string",
            rules: [{ required: true, message: "属性名" }],
          })(<Select
            onChange={() => {
                this.handleOnchange("attr_type");
              }}
            style={{ width: 100 }}
          >
            <Option value="string">字符串</Option>
            <Option value="radio">单选</Option>
            <Option value="checkbox">多选</Option>
             </Select>)}
        </Form.Item>
        <Form.Item hasFeedback={false}>
          {getFieldDecorator("attr_default_value", {
            initialValue: data.attr_default_value || "",
            rules: [{ required: false, message: "默认值" }],
          })(<Input
            onChange={() => {
                this.handleOnchange("attr_default_value");
              }}
            style={{ width: 80 }}
            placeholder="默认值"
          />)}
        </Form.Item>
        <Form.Item hasFeedback={false} style={{ display: attr_type === "string" ? "none" : "" }}>
          <Tooltip title="单选或多选的可选值， 多个用逗号分割，如：value1, value2">
            {getFieldDecorator("attr_alt_value", {
              initialValue: data.attr_alt_value || "",
              rules: [{ validator: this.checkAttrAltValue }],
            })(<Input
              onChange={() => {
                  this.handleOnchange("attr_alt_value");
                }}
              style={{ width: 100 }}
              placeholder="可选值"
            />)}
          </Tooltip>
        </Form.Item>
        <Form.Item hasFeedback={false}>
          {getFieldDecorator("is_change", {
            initialValue: data.is_change === void 0 ? true : data.is_change,
            rules: [{ required: false, message: "默认值" }],
          })(<Select
            onChange={() => {
                this.handleOnchange("is_change");
              }}
            style={{ width: 100 }}
          >
            <Option value>可修改</Option>
            <Option value={false}>不可修改</Option>
             </Select>)}
        </Form.Item>
        <Form.Item hasFeedback={false}>
          {getFieldDecorator("attr_info", {
            initialValue: data.attr_info || "",
            rules: [{ required: false, message: "默认值" }],
          })(<Input
            onChange={() => {
                this.handleOnchange("attr_info");
              }}
            style={{ width: 100 }}
            placeholder="简要说明"
          />)}
        </Form.Item>
      </Form>
    );
  }
}

@Form.create()
class EnvGroup extends PureComponent {
  constructor(props) {
    super(props);
    let group = (this.props.value || []).map(item => ({
      key: Math.random(),
      value: item,
    }));

    if (!group.length) {
      group = [{ key: Math.random() }];
    }

    this.state = {
      group,
    };

    // 保存组建引用
    this.groupItem = [];
  }
  componentWillMount() {
    this.props.onDidMount && this.props.onDidMount(this);
  }
  check() {
    let res = true;
    for (let i = 0; i < this.groupItem.length; i++) {
      this.groupItem[i].com.check((err) => {
        res = !err;
      });
      if (!res) break;
    }
    return res;
  }
  handlePlus = (key) => {
    let group = this.state.group;
    let index = 0;
    group = group.filter((item, i) => {
      if (item.key === key) {
        index = i;
      }
      return true;
    });
    group.splice(index + 1, 0, { key: Math.random() });
    this.state.group = group;
    this.setState({ group });
    this.forceUpdate();
  };
  handleMinus = (key) => {
    let group = [].concat(this.state.group);
    if (group.length === 1) return;
    group = group.filter(item => !!item).filter(item => item.key !== key);
    this.state.group = group;
    this.setState({ group });
    this.props.onChange && this.props.onChange(this.state.group.map(item => item.value));
    this.forceUpdate();
  };
  handleChange = (index, val) => {
    this.state.group.map((item) => {
      if (item.key === index) {
        item.value = val;
      }
      return item;
    });
    const onchangeVal = this.state.group.map(item => item.value);
    this.props.onChange && this.props.onChange(onchangeVal);
  };
  handleOptionMount = (k, com) => {
    this.groupItem.push({ key: k, com });
  };
  handleOptionUnmout = (k) => {
    this.groupItem = this.groupItem.filter(item => item.key !== k);
  };
  render() {
    const { getFieldDecorator, getFieldValue } = this.props.form;
    let group = this.state.group;
    group = group.filter(item => !!item);
    return (
      <div>
        {(group || []).map((item, index) => (
          <div key={item.key}>
            <EvnOption
              onDidMount={this.handleOptionMount}
              onUnmount={this.handleOptionUnmout}
              protocols={this.props.protocols}
              data={item.value}
              key={item.key}
              index={item.key}
              onChange={this.handleChange}
            />
            <Icon
              onClick={() => {
                this.handlePlus(item.key);
              }}
              style={{ verticalAlign: "middle", cursor: "pointer", fontSize: 20 }}
              type="plus"
            />
            <Icon
              onClick={() => {
                this.handleMinus(item.key);
              }}
              style={{ verticalAlign: "middle", cursor: "pointer", fontSize: 20 }}
              type="minus"
            />
          </div>
        ))}
      </div>
    );
  }
}

const formItemLayout = {
  labelCol: {
    span: 5,
  },
  wrapperCol: {
    span: 19,
  },
};

@Form.create()
@connect(({ region }) => ({
  protocols: region.protocols || [],
}))
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      selectedRowKeys: [],
      apps: [],
    };
    this.envGroup = null;
  }
  componentDidMount() {}
  handleSubmit = () => {
    const form = this.props.form;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      this.props.onSubmit && this.props.onSubmit(fieldsValue);
    });
  };
  handleCancel = () => {
    this.props.onCancel && this.props.onCancel();
  };
  hanldeMetaTypeChange = (e) => {
    const { getFieldDecorator, setFieldsValue } = this.props.form;
    const value = e.target.value;
    if (value !== "un_define") {
      setFieldsValue({ injection: "auto" });
    }
  };
  checkInjection = (rule, value, callback) => {
    if (this.envGroup) {
      if (this.envGroup.check()) {
        callback();
      } else {
        callback("    ");
      }
    }
  };
  handleEvnGroupMount = (com) => {
    this.envGroup = com;
  };
  render() {
    const title = this.props.title;

    const { getFieldDecorator, getFieldValue } = this.props.form;
    const data = this.props.data || {};
    const metaType = getFieldValue("service_meta_type") || "un_define";

    return (
      <Modal
        title={title || "新增配置组"}
        width={1000}
        visible
        onOk={this.handleSubmit}
        onCancel={this.handleCancel}
      >
        <Form>
          <Form.Item style={{ marginRight: 8 }} {...formItemLayout} label="配置组名">
            {getFieldDecorator("config_name", {
              initialValue: data.config_name || "",
              rules: [
                { required: true, message: "请输入配置组名" }
              ],
              validateFirst: true,
            })(<Input placeholder="请输入配置组名" />)}
          </Form.Item>
          <Form.Item {...formItemLayout} label="依赖元数据类型">
            {getFieldDecorator("service_meta_type", {
              initialValue: data.service_meta_type || "un_define",
              rules: [{ required: true, message: "请输入配置组名" }],
            })(<RadioGroup onChange={this.hanldeMetaTypeChange}>
              <Radio value="un_define">不依赖</Radio>
              <Radio value="upstream_port">组件端口</Radio>
              <Radio value="downstream_port">下游组件端口</Radio>
            </RadioGroup>)}
          </Form.Item>
          <Form.Item {...formItemLayout} label="注入类型">
            {getFieldDecorator("injection", {
              initialValue: data.injection || "env",
              rules: [{ required: true, message: "请输入配置组名" }],
            })(<RadioGroup>
              <Radio style={{ display: metaType === "un_define" ? "" : "none" }} value="env">
                  环境变量
              </Radio>
              <Radio value="auto">主动发现</Radio>
            </RadioGroup>)}
          </Form.Item>
          <Form.Item validateStatus="t" hasFeedback={false} {...formItemLayout} label="配置项">
            {getFieldDecorator("options", {
              initialValue: data.options || [],
              rules: [{ validator: this.checkInjection }],
            })(<EnvGroup onDidMount={this.handleEvnGroupMount} protocols={this.props.protocols} />)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}
