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
  Divider,
  Select,
  Radio,
  Icon,
  Modal
} from "antd";
import styles from "./AddScaling.less"

const FormItem = Form.Item;
const Option = Select.Option;
const RadioGroup = Radio.Group;

@connect(
  ({ loading }) => ({
      changeScalingRules: loading.effects['appControl/changeScalingRules'],
      addScalingRules: loading.effects['appControl/addScalingRules']
  }),
)
class AddScaling extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {

    };
  }
  handleSubmit = (e) => {
    e.preventDefault();
    const { onOk } = this.props
    this.props.form.validateFields((err, values) => {
        if (!err) {
            onOk && onOk(values);
        }
    });
}

  render() {
    const { isvisable, onClose,editRules,data } = this.props;
    const { getFieldDecorator } = this.props.form;
   let propsData = data&&data.length>0?data[0]:false
    const selectAfterCpu = (
        <FormItem className={styles.selectItem}>
        {getFieldDecorator('selectCpu',{
            initialValue: "utilization",
        })(
              <Select
                
              style={{ width: 80 }}>
                <Option value="utilization">%</Option>
                <Option value="average_value">m</Option>
            </Select>
            )}
         
        </FormItem>
        
      );
    const selectAfterMemory = (
        <FormItem className={styles.selectItem} >
        {getFieldDecorator('selectMemory',{
            initialValue: "utilization",
        })(
            <Select 
             
            style={{ width: 80 }}>
                <Option value="utilization">%</Option>
                <Option value="average_value">Mi</Option>
            </Select>
            )}
           
    </FormItem>
      ); 
      const formItemLayout = {
        labelCol: {
            xs: { span: 24 },
            sm: { span: 4 }
        },
        wrapperCol: {
            xs: { span: 24 },
            sm: { span: 18 }
        }
    };
    return (
      <div>
        <Modal

          title={editRules?"自动伸缩":"编辑规则"}
          visible={isvisable}
          onOk={this.handleSubmit} 
          onCancel={onClose}
        >
          <Form >
            <FormItem 
          label="伸缩类型"
          {...formItemLayout}
          style={{ textAlign: "left" }}
          >
          {getFieldDecorator('scalingType')(
            <RadioGroup>
              <Radio value="hpa">HPA</Radio>
              <Radio value="vpa" disabled>VPA</Radio>
            </RadioGroup>,
          )}
        </FormItem>
            <FormItem
            label="CPU"
            {...formItemLayout}
            style={{ textAlign: "left" }}
                >
                {getFieldDecorator('cpuValue', {
                  initialValue: propsData?propsData.metrics.metric_target_value:'',
                    rules: [{ required: true, message: '请输入目标值!' }]
                })(
                    <Input addonAfter={selectAfterCpu} placeholder="单位：%" />
                )}
                
                
            </FormItem>
            <FormItem
            label="内存"
            {...formItemLayout}
            style={{ textAlign: "left" }}
                >
                {getFieldDecorator('memoryValue', {
                  initialValue: propsData?propsData.metrics.metric_target_value:'',
                    rules: [{ required: true, message: '请输入目标值!' }]
                })(
                    <Input addonAfter={selectAfterMemory} placeholder="单位：%" />
                )}
                
            </FormItem>
            <FormItem
            label="最小数量"
            {...formItemLayout}
            style={{ textAlign: "left" }}
                >
    
                {getFieldDecorator('minNum', {
                  initialValue: propsData?propsData.min_replicas:'',
                    rules: [{ required: true, message: '请输入伸缩副本下限!' }]
                })(
                    <Input />
                )}
                
            </FormItem>
            <FormItem
            label="最大数量"
            {...formItemLayout}
            style={{ textAlign: "left" }}
                >
                {getFieldDecorator('maxNum', {
                  initialValue: propsData?propsData.max_replicas:'',
                    rules: [{ required: true, message: '请输入伸缩副本上限!' }]
                })(
                    <Input />
                )}     
            </FormItem>
          </Form>
        </Modal>
      </div>
    );
  }
}
const AddScalingrule = Form.create()(AddScaling);
export default AddScalingrule;
