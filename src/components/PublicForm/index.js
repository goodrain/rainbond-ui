import { Col, Input, InputNumber, Radio, Row, Select } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import styles from './index.less';

const { Option } = Select;

@connect(({ user, loading }) => ({
  currUser: user.currentUser,
  addHttpStrategyLoading: loading.effects['gateWay/addHttpStrategy'],
  editHttpStrategyLoading: loading.effects['gateWay/editHttpStrategy']
}))
class PublicForm extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }
  onChangeSwitch = (value, info) => {
    const { upDateQuestions, data } = this.props;
    data.map(item => {
      if (item.variable === info.variable) {
        item.default = value;
      }
    });
    if (upDateQuestions) {
      upDateQuestions(data);
    }
  };

  handleOk = e => {
    e.preventDefault();
    const { onOk, form } = this.props;
    form.validateFields((err, values) => {
      if (!err && onOk) {
        onOk(values);
      }
    });
  };
  handleFormItem = data => {
    const setGroup = [];
    return data.map((item, index) => {
      const {
        type,
        subquestions,
        default: defaults,
        group,
        show_subquestion_if = 'false'
      } = item;
      const box = (
        <Fragment>
          {this.FormItemBox(item)}
          {subquestions &&
            subquestions.length > 0 &&
            (type !== 'boolean' || `${defaults}` == `${show_subquestion_if}`) &&
            subquestions.map(items => {
              return this.FormItemBox(items);
            })}
        </Fragment>
      );
      const setIndex = index < 1 ? 0 : index - 1;
      if (index > 0) {
        setGroup.push(data[setIndex].group);
      }
      return (
        <Fragment>
          {!setGroup.includes(group) ? (
            <Fragment>
              <Col span={24}>
                <div className={styles.over_hr}>
                  <span>{group}</span>
                </div>
              </Col>
              {box}
            </Fragment>
          ) : (
            box
          )}
        </Fragment>
      );
    });
  };
  FormItemBox = item => {
    const { Form, getFieldDecorator } = this.props;
    const FormItem = Form.Item;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 24 }
      },
      wrapperCol: {
        xs: { span: 23 },
        sm: { span: 23 }
      }
    };
    const {
      variable,
      required = false,
      default: defaults,
      description,
      label,
      type,
      min = ''
    } = item;
    const box = this.handleBox(item, type, defaults);
    const setVariable = variable.replace(new RegExp('\\.', 'g'), '#-#');

    if (box) {
      return (
        <Col span={12}>
          <FormItem
            {...formItemLayout}
            label={label}
            className={styles.antd_form}
          >
            {getFieldDecorator(setVariable, {
              rules: [
                {
                  required,
                  message: `${label}必须设置`
                }
              ],
              initialValue: min || (defaults && `${defaults}`)
            })(box)}
            <div>{description}</div>
          </FormItem>
        </Col>
      );
    }
    return null;
  };
  handleBox = (item, type, defaults) => {
    if (type === 'string') {
      return <Input placeholder="请输入" />;
    } else if (type === 'boolean') {
      return (
        <Radio.Group
          defaultChecked={`${defaults}`}
          onChange={e => {
            this.onChangeSwitch(e.target.value, item);
          }}
        >
          <Radio value="true">是</Radio>
          <Radio value="false">否</Radio>
        </Radio.Group>
      );
    } else if (type === 'int') {
      return (
        <InputNumber
          style={{ width: '100%' }}
          min={item.min || 1}
          max={item.max || 255}
          placeholder="节点数量"
        />
      );
    } else if (type === 'enum') {
      return (
        <Select placeholder="请选择">
          {item.options &&
            item.options.map(items => {
              return (
                <Option key={items} value={items}>
                  {items}
                </Option>
              );
            })}
        </Select>
      );
    } else if (type === 'password') {
      return (
        <Input
          autoComplete="new-password"
          type="password"
          placeholder="请输入密码"
        />
      );
    }
    return null;
  };
  render() {
    const { data } = this.props;
    return (
      <Fragment>
        <Row>{this.handleFormItem(data)}</Row>
      </Fragment>
    );
  }
}
export default PublicForm;
