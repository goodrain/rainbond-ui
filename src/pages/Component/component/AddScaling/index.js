import { Button, Form, InputNumber, Modal, Select } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import Indicators from '../../../../../public/images/indicators.png';
import Shangxian from '../../../../../public/images/shangxian.png';
import Testimg from '../../../../../public/images/test.png';
import cookie from '../../../../utils/cookie';
import styles from './AddScaling.less';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';

const FormItem = Form.Item;
const { Option } = Select;

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
      language: cookie.get('language') === 'zh-CN' ? true : false
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
    const min = 1;
    const num = Number(value);
    if (num || num === 0) {
      if (num < min) {
        callback(<FormattedMessage id='componentOverview.body.Expansion.AddScaling.input_min' values={{num:min}}/>);
        return;
      }
      if (num > 65535) {
        callback(<FormattedMessage id='componentOverview.body.Expansion.AddScaling.input_max'/>);
        return;
      }
    }
    callback();
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
    const en_formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 8 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 }
      }
    };
 const is_language = language ? formItemLayout : en_formItemLayout
    return (
      <div>
        <Modal
          className={styles.TelescopicModal}
          title={editRules ? <FormattedMessage id='componentOverview.body.Expansion.AddScaling.add_indicator'/> : <FormattedMessage id='componentOverview.body.Expansion.AddScaling.flex'/>}
          visible={isvisable}
          onOk={this.handleSubmit}
          onCancel={onClose}
          footer={[
            <Button type="primary" onClick={this.handleSubmit}>
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
                {...is_language}
                style={{ textAlign: 'left' }}
              >
                {getFieldDecorator('minNum', {
                  initialValue: 1,
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
                {...is_language}
                style={{ textAlign: 'left' }}
              >
                {getFieldDecorator('maxNum', {
                  initialValue: propsData ? propsData.max_replicas : 1,
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
              {...is_language}
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
                  ).map(item => {
                    return (
                      <Option value={item.value} key={item.value}>
                        {item.name}
                      </Option>
                    );
                  })}
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
              {...is_language}
              style={{ textAlign: 'left' }}
            >
              {getFieldDecorator('value', {
                initialValue: propsData ? propsData.max_replicas : 1,

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
                  min={1}
                  max={65535}
                  style={{ width: '100%' }}
                />
              )}
              <div className={styles.conformDesc}>
                <FormattedMessage id='componentOverview.body.Expansion.AddScaling.dang'/> 
                {selectMemoryDesc === 'memoryaverage_value' ||
                selectMemoryDesc === 'memoryutilization'
                  ? <FormattedMessage id='componentOverview.body.Expansion.AddScaling.Memory'/> 
                  : 'cpu'}
                <FormattedMessage id='componentOverview.body.Expansion.AddScaling.use'/> 
                {selectMemoryDesc === 'memoryaverage_value' ||
                selectMemoryDesc === 'cpuaverage_value'
                  ? <FormattedMessage id='componentOverview.body.Expansion.AddScaling.amount'/> 
                  : <FormattedMessage id='componentOverview.body.Expansion.AddScaling.rate_unit'/> }
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
