import React, { PureComponent } from "react";
import { connect } from "dva";
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Radio,
  Icon,
  Modal
} from "antd";
import styles from "./AddScaling.less";
import Cpuimg from "../../../../../public/images/cpu.png";
import Typesimg from "../../../../../public/images/types.png";
import Testimg from "../../../../../public/images/test.png";
import Shangxian from "../../../../../public/images/shangxian.png";
import Neicunshiyongimg from "../../../../../public/images/neicunshiyong.png";

const FormItem = Form.Item;
const Option = Select.Option;
const RadioGroup = Radio.Group;

@connect(({ loading }) => ({
  changeScalingRules: loading.effects["appControl/changeScalingRules"],
  addScalingRules: loading.effects["appControl/addScalingRules"]
}))
class AddScaling extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }
  handleSubmit = e => {
    e.preventDefault();
    const { onOk } = this.props;
    this.props.form.validateFields((err, values) => {
      if (!err) {
        onOk && onOk(values);
      }
    });
  };
  setMetric_target_value = (arr, types, Symbol = false) => {
    let values = 0;
    arr &&
      arr.length > 0 &&
      arr.map(item => {
        const { metric_name, metric_target_value, metric_target_type } = item;
        if (types === metric_name) {
          values = Symbol ? metric_target_type : metric_target_value;
          return metric_target_value;
        }
      });
    return values === undefined ? 0 : values;
  };
  checkContent = (res, value, callback) => {
    let min = res.field === "maxNum" || res.field === "minNum" ? 1 : 0;
    let num = Number(value);
    if (num || num === 0) {
      if (num < min) {
        callback("最小输入值" + min);
        return;
      }
      if (num > 65535) {
        callback("最大输入值65535");
        return;
      }
    }
    callback();
  };

  render() {
    const { isvisable, onClose, editRules, data } = this.props;
    const { getFieldDecorator, getFieldValue } = this.props.form;

    let propsData = data ? data : false;
    const selectAfterCpu = (
      <FormItem className={styles.selectItem}>
        {getFieldDecorator("selectCpu", {
          initialValue: propsData
            ? this.setMetric_target_value(propsData.metrics, "cpu", true)
            : "utilization"
        })(
          <Select className={styles.setSelect}>
            <Option value="utilization">%</Option>
            <Option value="average_value">m</Option>
          </Select>
        )}
      </FormItem>
    );
    const selectAfterMemory = (
      <FormItem className={styles.selectItem}>
        {getFieldDecorator("selectMemory", {
          initialValue: propsData
            ? this.setMetric_target_value(propsData.metrics, "memory", true)
            : "utilization"
        })(
          <Select className={styles.setSelect}>
            <Option value="utilization">%</Option>
            <Option value="average_value">Mi</Option>
          </Select>
        )}
      </FormItem>
    );

    const minNumber = getFieldValue("minNum") || 0;
    const cpuSymbolPrompt =
      getFieldValue("selectCpu") === "utilization" ? "率" : "量";
    const memorySymbolPrompt =
      getFieldValue("selectMemory") === "utilization" ? "率" : "量";

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 5 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 19 }
      }
    };

    return (
      <div>
        <Modal
          className={styles.TelescopicModal}
          title={editRules ? "编辑规则" : "自动伸缩"}
          visible={isvisable}
          onOk={this.handleSubmit}
          onCancel={onClose}
          footer={[
            <Button typs="primary" onClick={this.handleSubmit}>
              确定
            </Button>
          ]}
        >
          <Form
            layout="horizontal"
            hideRequiredMark
            onSubmit={this.handleSubmit}
          >
            <FormItem
              className={styles.clearConform}
              label={
                <div className={styles.clearConformMinTitle}>
                  <img src={Cpuimg} alt="" />
                  CPU&nbsp;:
                </div>
              }
              {...formItemLayout}
              style={{ textAlign: "left" }}
            >
              {getFieldDecorator("cpuValue", {
                initialValue: propsData
                  ? this.setMetric_target_value(propsData.metrics, "cpu")
                  : 0,
                rules: [
                  {
                    pattern: new RegExp(/^[0-9]\d*$/, "g"),
                    message: "请输入数字"
                  },
                  { required: true, message: "请输入CPU" },
                  { validator: this.checkContent }
                ]
              })(
                <Input
                  type="number"
                  addonAfter={selectAfterCpu}
                  placeholder="请输入CPU"
                />
              )}
              <div className={styles.conformDesc}>
                当CPU的使用{cpuSymbolPrompt}超过低于目标值时, 将创建或删除副本
              </div>
            </FormItem>
            <FormItem
              className={styles.clearConform}
              label={
                <div className={styles.clearConformMinTitle}>
                  <img src={Testimg} alt="" />
                  内存&nbsp;:
                </div>
              }
              {...formItemLayout}
              style={{ textAlign: "left" }}
            >
              {getFieldDecorator("memoryValue", {
                initialValue: propsData
                  ? this.setMetric_target_value(propsData.metrics, "memory")
                  : 0,
                rules: [
                  {
                    pattern: new RegExp(/^[0-9]\d*$/, "g"),
                    message: "请输入数字"
                  },
                  { required: true, message: "请输入内存" },
                  { validator: this.checkContent }
                ]
              })(
                <Input
                  type="number"
                  addonAfter={selectAfterMemory}
                  placeholder="请输入内存"
                />
              )}
              <div className={styles.conformDesc}>
                当内存的使用{memorySymbolPrompt}超过或低于目标值时,
                将创建或删除副本
              </div>
            </FormItem>
            <FormItem
              className={styles.clearConform}
              label={
                <div className={styles.clearConformMinTitle}>
                  <img src={Shangxian} alt="" />
                  最小数量&nbsp;:
                </div>
              }
              {...formItemLayout}
              style={{ textAlign: "left" }}
            >
              {getFieldDecorator("minNum", {
                initialValue: propsData ? propsData.min_replicas : 1,
                rules: [
                  {
                    pattern: new RegExp(/^[0-9]\d*$/, "g"),
                    message: "请输入数字"
                  },
                  { required: true, message: "请输入最小数量" },
                  { validator: this.checkContent }
                ]
              })(
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="请输入最小数量"
                />
              )}
              <div className={styles.conformDesc}>自动伸缩副本数的下限</div>
            </FormItem>
            <FormItem
              className={styles.clearConform}
              label={
                <div className={styles.clearConformMinTitle}>
                  <img src={Neicunshiyongimg} alt="" />
                  最大数量&nbsp;:
                </div>
              }
              {...formItemLayout}
              style={{ textAlign: "left" }}
            >
              {getFieldDecorator("maxNum", {
                initialValue: propsData ? propsData.max_replicas : 1,
                rules: [
                  {
                    pattern: new RegExp(/^[0-9]\d*$/, "g"),
                    message: "请输入数字"
                  },
                  { required: true, message: "请输入最大数量" },
                  { validator: this.checkContent }
                ]
              })(
                <InputNumber
                  placeholder="请输入最大数量"
                  style={{ width: "100%" }}
                  min={minNumber}
                />
              )}
              <div className={styles.conformDesc}>自动伸缩副本数的上限</div>
            </FormItem>
          </Form>
        </Modal>
      </div>
    );
  }
}
const AddScalingrule = Form.create()(AddScaling);
export default AddScalingrule;
