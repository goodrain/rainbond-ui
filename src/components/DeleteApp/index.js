import React, { PureComponent } from 'react';
import { Modal, Form, Checkbox, Button } from 'antd';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;
const CheckboxGroup = Checkbox.Group;

@Form.create()
export default class DeleteApp extends PureComponent {
  constructor(props) {
    super(props);
  }

  handleSubmit = () => {
    const { form, onOk } = this.props;
    const { validateFields } = form;

    validateFields((err, values) => {
      if (!err) {
        onOk && onOk(values);
      }
    });
  };
  onChangeBounced = checkedValues => {
    const { onCheckedValues } = this.props;
    onCheckedValues && onCheckedValues(checkedValues);
  };

  render() {
    const { onCancel, bouncedText, appInfo, form } = this.props;
    const { getFieldDecorator } = form;
    let plainOptions = [];
    if (appInfo && appInfo.versions_info && appInfo.versions_info.length > 0) {
      appInfo.versions_info.map(item => {
        plainOptions.push(item.version)
      });
    }
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 12 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 12 },
      },
    };

    return (
      <Modal
        title={bouncedText}
        visible
        onOk={this.handleSubmit}
        className={styles.TelescopicModal}
        onCancel={onCancel}
        footer={[
          <Button onClick={onCancel}> 取消 </Button>,
          <Button type="primary" onClick={this.handleSubmit}>
            确定
          </Button>,
        ]}
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem
            {...formItemLayout}
            label={appInfo && `${appInfo.app_name}版本`}
          >
            {getFieldDecorator('chooseVersion', {
              initialValue: appInfo && [appInfo.versions_info[0].version],
              rules: [
                {
                  required: true,
                  message: '请选择版本',
                },
              ],
            })(
              <CheckboxGroup
                options={plainOptions}
                onChange={this.onChangeBounced}
              />
            )}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
