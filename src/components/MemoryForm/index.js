/* eslint-disable no-nested-ternary */
import { Select } from 'antd';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';

const { Option } = Select;

class Index extends PureComponent {
  handleOnchange = (key, value) => {
    const { form } = this.props;
    const { setFieldsValue } = form;
    setFieldsValue({ [key]: value });
  };
  render() {
    const {
      labelCol,
      wrapperCol,
      disabled = false,
      FormItem,
      setkey,
      getFieldDecorator,
      labelName = `${formatMessage({id:'componentOverview.MemoryForm.title'})}`,
      initialValue,
      message = `${formatMessage({id:'componentOverview.MemoryForm.message'})}`
    } = this.props;

    return (
      <FormItem label={labelName} labelCol={labelCol} wrapperCol={wrapperCol}>
        {getFieldDecorator(setkey, {
          initialValue: initialValue || 32,
          rules: [
            {
              required: true,
              message
            }
          ]
        })(
          <Select
            disabled={disabled}
            getPopupContainer={triggerNode => triggerNode.parentNode}
            onChange={values => {
              this.handleOnchange(setkey, values);
            }}
          >
            <Option value={32}>32M</Option>
            <Option value={64}>64M</Option>
            <Option value={128}>128M</Option>
            <Option value={256}>256M</Option>
            <Option value={512}>512M</Option>
            <Option value={1024}>1G</Option>
            <Option value={2048}>2G</Option>
            <Option value={2048 * 2}>4G</Option>
            <Option value={2048 * 4}>8G</Option>
            <Option value={2048 * 8}>16G</Option>
            <Option value={2048 * 16}>32G</Option>
            <Option value={2048 * 32}>64G</Option>
          </Select>
        )}
      </FormItem>
    );
  }
}

export default Index;
