import React, { PureComponent } from 'react';
import { Form, Modal, Input, notification, Select } from 'antd';
import { connect } from 'dva';
import globalUtil from '../../../utils/global';

const FormItem = Form.Item;
const Option = Select.Option;
@connect(
  ({ user, appControl, teamControl }) => ({
    currUser: user.currentUser,
    innerEnvs: appControl.innerEnvs,
    startProbe: appControl.startProbe,
    runningProbe: appControl.runningProbe,
    ports: appControl.ports,
    baseInfo: appControl.baseInfo,
    tags: appControl.tags,
    teamControl,
    appControl,
  }),
  null,
  null,
  { withRef: true }
)
// 添加、编辑变量
@Form.create()
export default class AddVarModal extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      fontSizeVal: '',
      list: [],
    };
  }

  handleSubmit = e => {
    e.preventDefault();
    const { form, onSubmit, isShowRestartTips } = this.props;
    form.validateFields((err, values) => {
      if (!err) {
        onSubmit && onSubmit(values);
        isShowRestartTips && isShowRestartTips(true);
      }
    });
  };
  handleCancel = () => {
    this.props.onCancel && this.props.onCancel();
  };

  handleList = (attr_name, attr_value) => {
    if (attr_name == null && attr_value == null) {
      return false;
    }
    const { dispatch } = this.props;
    dispatch({
      type: 'appControl/getVariableList',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        attr_name,
        attr_value,
      },
      callback: res => {
        const arr = res && res.list ? res.list : [];
        arr.unshift(attr_name ? `${attr_name}` : `${attr_value}`);
        Array.from(new Set(arr));
        if (arr && arr.length > 0 && arr[0] == 'null') {
          return;
        }
        this.setState({ list: arr });
        if (attr_name) {
          form.setFieldsValue({
            attr_name,
          });
        }
        if (attr_value) {
          form.setFieldsValue({
            attr_value,
          });
        }
      },
      handleError: err => {
        if (err && err.data && err.data.code == 10401) {
          return null;
        }
        if (err && err.data && err.data.msg_show) {
          notification.warning({
            message: `请求错误`,
            description: err.data.msg_show,
          });
        }
      },
    });
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    const data = this.props.data || '';
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24,
        },
        sm: {
          span: 6,
        },
      },
      wrapperCol: {
        xs: {
          span: 24,
        },
        sm: {
          span: 16,
        },
      },
    };
    const { list } = this.state;
    return (
      <Modal
        title={data ? '编辑变量' : '添加变量'}
        onOk={this.handleSubmit}
        maskClosable={false}
        onCancel={this.handleCancel}
        visible
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...formItemLayout} label="变量名">
            {getFieldDecorator('attr_name', {
              initialValue: (data && data.attr_name) || '',
              rules: [
                {
                  required: true,
                  message: '请输入变量名称',
                },
                {
                  pattern: /[-._a-zA-Z][-._a-zA-Z0-9]/,
                  message: ' 必须由字母、数字和 - . _ 组成，不支持数字开头',
                },
              ],
            })(
              <Input
                disabled={!!(data && data.attr_name)}
                placeholder="请输入变量名称"
              />
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="变量值">
            {getFieldDecorator('attr_value', {
              initialValue: (data && data.attr_value) || '',
              rules: [
                {
                  required: true,
                  message: '请输入变量值',
                },
              ],
            })(<Input placeholder="请输入变量值" />)}
          </FormItem>
          <FormItem {...formItemLayout} label="说明">
            {getFieldDecorator('name', {
              initialValue: (data && data.name) || '',
              rules: [
                {
                  required: false,
                  message: '请输入变量说明',
                },
              ],
            })(<Input placeholder="请输入变量说明" />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
