import { Button, Checkbox, Form, message, Modal } from 'antd';
import React, { PureComponent } from 'react';
import styles from '../CreateTeam/index.less';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';

const FormItem = Form.Item;
const CheckboxGroup = Checkbox.Group;

@Form.create()
export default class DeleteApp extends PureComponent {
  onChangeBounced = checkedValues => {
    const { onCheckedValues } = this.props;
    if (onCheckedValues) {
      onCheckedValues(checkedValues);
    }
  };

  handleSubmit = () => {
    const { form, onOk } = this.props;
    const { validateFields } = form;

    validateFields((err, values) => {
      if (!err && onOk) {
        onOk(values);
      }
    });
  };

  render() {
    const { onCancel, bouncedText, appInfo, form } = this.props;
    const { getFieldDecorator } = form;
    const plainOptions = [];
    if (appInfo && appInfo.versions_info && appInfo.versions_info.length > 0) {
      appInfo.versions_info.map(item => {
        plainOptions.push(item.version);
      });
    }
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 12 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 12 }
      }
    };

    return (
      <Modal
        title={bouncedText}
        visible
        onOk={this.handleSubmit}
        className={styles.TelescopicModal}
        onCancel={onCancel}
        footer={[
          <Button onClick={onCancel}>  <FormattedMessage id='button.cancel'/></Button>,
          <Button type="primary" onClick={this.handleSubmit}>
            <FormattedMessage id='button.confirm'/>
          </Button>
        ]}
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem
            {...formItemLayout}
            label={appInfo &&  `${formatMessage({id:'applicationMarket.DeleteApp'},{name:appInfo.app_name})}`}
          >
            {getFieldDecorator('chooseVersion', {
              initialValue: appInfo &&
                appInfo.versions_info &&
                appInfo.versions_info.length > 0 && [
                  appInfo.versions_info[0].version
                ],
              rules: [
                {
                  required: true,
                  message:formatMessage({id:'applicationMarket.CreateHelmAppModels.select_version'})
                }
              ]
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
