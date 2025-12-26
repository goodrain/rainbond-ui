import { Button, Form, InputNumber, Modal, Select } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import Indicators from '../../../../../public/images/indicators.png';
import Shangxian from '../../../../../public/images/shangxian.png';
import Testimg from '../../../../../public/images/test.png';
import cookie from '../../../../utils/cookie';
import styles from './AddScaling.less';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';

const FormItem = Form.Item;
const { Option } = Select;

// 常量定义
const MIN_VALUE = 1;
const MAX_VALUE = 65535;

@connect(({ loading }) => ({
  changeScalingRules: loading.effects['appControl/changeScalingRules'],
  addScalingRules: loading.effects['appControl/addScalingRules']
}))
class AddScaling extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      selectMemoryList: [
        { value: 'memoryaverage_value', name: formatMessage({id:'componentOverview.body.Expansion.AddScaling.memory_usage'}) },
        { value: 'memoryutilization', name: formatMessage({id:'componentOverview.body.Expansion.AddScaling.memory_rate'}) },
        { value: 'cpuaverage_value', name: formatMessage({id:'componentOverview.body.Expansion.AddScaling.usage'}) },
        { value: 'cpuutilization', name: formatMessage({id:'componentOverview.body.Expansion.AddScaling.rate'}) }
      ],
      language: cookie.get('language') === 'zh-CN'
    };
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
  // 获取指标目标值
  setMetric_target_value = (arr, types, Symbol = false) => {
    if (!arr || arr.length === 0) {
      return 0;
    }

    const foundItem = arr.find(item => item.metric_name === types);
    if (!foundItem) {
      return 0;
    }

    return Symbol ? foundItem.metric_target_type : foundItem.metric_target_value;
  };
  // 校验输入内容
  checkContent = (res, value, callback) => {
    const num = Number(value);
    if (num || num === 0) {
      if (num < MIN_VALUE) {
        callback(<FormattedMessage id='componentOverview.body.Expansion.AddScaling.input_min' values={{num: MIN_VALUE}}/>);
        return;
      }
      if (num > MAX_VALUE) {
        callback(<FormattedMessage id='componentOverview.body.Expansion.AddScaling.input_max'/>);
        return;
      }
    }
    callback();
  };

  // 判断是否为内存指标
  isMemoryMetric = (metricType) => {
    return metricType === 'memoryaverage_value' || metricType === 'memoryutilization';
  };

  // 判断是否为平均值指标
  isAverageMetric = (metricType) => {
    return metricType === 'memoryaverage_value' || metricType === 'cpuaverage_value';
  };

  render() {
    const {
      isvisable,
      onClose,
      editRules,
      data,
      isaddindicators,
      memoryList
    } = this.props;
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const { selectMemoryList, language } = this.state;
    const propsData = data || false;

    const minNumber = getFieldValue('minNum') || 0;
    const selectMemoryDesc = getFieldValue('selectMemory');

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
    const enFormItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 8 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 }
      }
    };
    const currentFormLayout = language ? formItemLayout : enFormItemLayout;
    return (
      <div>
        <Modal
          className={styles.TelescopicModal}
          title={editRules ? <FormattedMessage id='componentOverview.body.Expansion.AddScaling.add_indicator'/> : <FormattedMessage id='componentOverview.body.Expansion.AddScaling.flex'/>}
          visible={isvisable}
          onOk={this.handleSubmit}
          onCancel={onClose}
          footer={[
            <Button key="submit" type="primary" onClick={this.handleSubmit}>
              {/* 确定 */}
              <FormattedMessage id='componentOverview.body.Expansion.AddScaling.determine'/>
            </Button>
          ]}
        >
          <Form
            layout="horizontal"
            hideRequiredMark
            onSubmit={this.handleSubmit}
          >
            {!isaddindicators && (
              <FormItem
                className={styles.clearConform}
                label={
                  <div className={styles.clearConformMinTitle}>
                    <img src={Shangxian} alt="" />
                    {/* 最小数量 */}
                    <FormattedMessage id='componentOverview.body.Expansion.AddScaling.minimum_quantity'/> 
                    &nbsp;:
                  </div>
                }
                {...currentFormLayout}
                style={{ textAlign: 'left' }}
              >
                {getFieldDecorator('minNum', {
                  initialValue: MIN_VALUE,
                  rules: [
                    {
                      pattern: new RegExp(/^[0-9]\d*$/, 'g'),
                      message: formatMessage({id:'componentOverview.body.Expansion.AddScaling.number'})

                    },
                    { required: true, message: formatMessage({id:'componentOverview.body.Expansion.AddScaling.placese_input_min'}) },
                    { validator: this.checkContent }
                  ]
                })(
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder={formatMessage({id:'componentOverview.body.Expansion.AddScaling.placese_input_min'})}
                  />
                )}
                <div className={styles.conformDesc}><FormattedMessage id='componentOverview.body.Expansion.AddScaling.lower_limit'/> </div>
              </FormItem>
            )}
            {!isaddindicators && (
              <FormItem
                className={styles.clearConform}
                label={
                  <div className={styles.clearConformMinTitle}>
                    <img src={Testimg} alt="" />
                    <FormattedMessage id='componentOverview.body.Expansion.AddScaling.max'/> 
                    &nbsp;:
                  </div>
                }
                {...currentFormLayout}
                style={{ textAlign: 'left' }}
              >
                {getFieldDecorator('maxNum', {
                  initialValue: propsData ? propsData.max_replicas : MIN_VALUE,
                  rules: [
                    {
                      pattern: new RegExp(/^[0-9]\d*$/, 'g'),
                      message: formatMessage({id:'componentOverview.body.Expansion.AddScaling.number'})
                    },
                    { required: true, message: formatMessage({id:'componentOverview.body.Expansion.AddScaling.placese_input_max'}) },
                    { validator: this.checkContent }
                  ]
                })(
                  <InputNumber
                    placeholder={formatMessage({id:'componentOverview.body.Expansion.AddScaling.placese_input_max'})}
                    style={{ width: '100%' }}
                    min={minNumber}
                  />
                )}
                <div className={styles.conformDesc}><FormattedMessage id='componentOverview.body.Expansion.AddScaling.upper_limit'/> </div>
              </FormItem>
            )}

            <FormItem
              className={styles.clearConform}
              {...currentFormLayout}
              label={
                <div className={styles.clearConformMinTitle}>
                  <img src={Indicators} alt="" />
                  <FormattedMessage id='componentOverview.body.Expansion.AddScaling.index'/> &nbsp;:
                </div>
              }
              style={{ textAlign: 'left' }}
            >
              {getFieldDecorator('selectMemory', {
                initialValue:
                  isaddindicators && memoryList && memoryList.length > 0
                    ? memoryList[0].value
                    : 'memoryaverage_value',
                rules: [
                  {
                    required: true,
                    message: formatMessage({id:'componentOverview.body.Expansion.AddScaling.select_needs'})
                  }
                ]
              })(
                <Select
                  getPopupContainer={triggerNode => triggerNode.parentNode}
                >
                  {(isaddindicators && memoryList && memoryList.length > 0
                    ? memoryList
                    : selectMemoryList
                  ).map(item => (
                    <Option value={item.value} key={item.value}>
                      {item.name}
                    </Option>
                  ))}
                </Select>
              )}
            </FormItem>

            <FormItem
              className={styles.clearConform}
              label={
                <div className={styles.clearConformMinTitle}>
                  <img src={Testimg} alt="" />
                  <FormattedMessage id='componentOverview.body.Expansion.AddScaling.target_value'/> 
                  &nbsp;:
                </div>
              }
              {...currentFormLayout}
              style={{ textAlign: 'left' }}
            >
              {getFieldDecorator('value', {
                initialValue: propsData ? propsData.max_replicas : MIN_VALUE,
                rules: [
                  {
                    pattern: new RegExp(/^[0-9]\d*$/, 'g'),
                    message: formatMessage({id:'componentOverview.body.Expansion.AddScaling.number'})
                  },
                  { required: true,  message: formatMessage({id:'componentOverview.body.Expansion.AddScaling.number'})},
                  { validator: this.checkContent }
                ]
              })(
                <InputNumber
                  placeholder={formatMessage({id:'componentOverview.body.Expansion.AddScaling.number'})}
                  min={MIN_VALUE}
                  max={MAX_VALUE}
                  style={{ width: '100%' }}
                />
              )}
              <div className={styles.conformDesc}>
                <FormattedMessage id='componentOverview.body.Expansion.AddScaling.dang'/>
                {this.isMemoryMetric(selectMemoryDesc)
                  ? <FormattedMessage id='componentOverview.body.Expansion.AddScaling.Memory'/>
                  : 'cpu'}
                <FormattedMessage id='componentOverview.body.Expansion.AddScaling.use'/>
                {this.isAverageMetric(selectMemoryDesc)
                  ? <FormattedMessage id='componentOverview.body.Expansion.AddScaling.amount'/>
                  : <FormattedMessage id='componentOverview.body.Expansion.AddScaling.rate_unit'/>}
                <FormattedMessage id='componentOverview.body.Expansion.AddScaling.numberOfInstances'/>
              </div>
            </FormItem>
          </Form>
        </Modal>
      </div>
    );
  }
}
const AddScalingrule = Form.create()(AddScaling);
export default AddScalingrule;
