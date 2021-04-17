import { Button, Form, Input, Modal, Select } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import globalUtil from '../../utils/global';
import styles from '../CreateTeam/index.less';

const { Option } = Select;
const formItemLayout = {
  labelCol: {
    span: 5
  },
  wrapperCol: {
    span: 19
  }
};
const FormItem = Form.Item;

@connect(({ global }) => ({ groups: global.groups }), null, null, {
  withRef: true
})
@Form.create()
export default class Index extends PureComponent {
  fetchGroup = () => {
    this.props.dispatch({
      type: 'global/fetchGroups',
      payload: {
        team_name: globalUtil.getCurrTeamName()
      }
    });
  };
  handleSubmit = e => {
    e.preventDefault();
    const { form, onSubmit, data } = this.props;
    // app_store_name;
    const versions =
      data && data.versions && data.versions.length > 0 && data.versions;
    form.validateFields((err, fieldsValue) => {
      const info = Object.assign({}, fieldsValue, {
        app_template_name: (versions && versions[0].name) || '',
        app_store_name: data.app_store_name,
        app_store_url: data.url
      });
      if (!err && onSubmit) {
        onSubmit(info, true);
      }
    });
  };

  render() {
    const { onCancel, data, form, installLoading = false } = this.props;
    const { getFieldDecorator } = form;
    const versions =
      data && data.versions && data.versions.length > 0 && data.versions;
    return (
      <Modal
        className={styles.TelescopicModal}
        visible={data}
        onCancel={onCancel}
        onOk={this.handleSubmit}
        title="要安装到哪个应用?"
        footer={[
          <Button onClick={onCancel}>取消</Button>,
          <Button
            onClick={this.handleSubmit}
            type="primary"
            style={{ marginRight: '5px' }}
            loading={installLoading}
          >
            安装
          </Button>
        ]}
      >
        <Form onSubmit={this.handleSubmit} layout="horizontal">
          <FormItem {...formItemLayout} label="应用名称">
            {getFieldDecorator('app_name', {
              initialValue: (versions && versions[0].name) || '',
              rules: [
                { required: true, message: '请填写应用名称' },
                {
                  max: 24,
                  message: '应用名称最大长度24位'
                }
              ]
            })(
              <Input placeholder="请填写应用名称" style={{ width: '284px' }} />
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="应用版本">
            {getFieldDecorator('version', {
              initialValue: versions ? versions[0].version : '',
              rules: [
                {
                  required: true,
                  message: '请选择版本'
                }
              ]
            })(
              <Select style={{ width: '284px' }}>
                {versions &&
                  versions.map((item, index) => {
                    return (
                      <Option key={index} value={item.version}>
                        {item.version}
                      </Option>
                    );
                  })}
              </Select>
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="应用备注">
            {getFieldDecorator('note', {
              initialValue: '',
              rules: [
                {
                  max: 255,
                  message: '最大长度255位'
                }
              ]
            })(
              <Input.TextArea
                placeholder="请填写应用备注信息"
                style={{ width: '284px' }}
              />
            )}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
