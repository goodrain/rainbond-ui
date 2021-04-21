import styles from '@/components/CreateTeam/index.less';
import globalUtil from '@/utils/global';
import { Form, Input, Modal, Select } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';

const FormItem = Form.Item;
const { Option } = Select;

@Form.create()
@connect()
export default class AddAssociatedComponents extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      submitLoading: false
    };
  }
  onOk = e => {
    e.preventDefault();
    const { form, onOk } = this.props;
    form.validateFields({ force: true }, (err, vals) => {
      if (!err && onOk) {
        this.setState(
          {
            submitLoading: true
          },
          () => {
            this.handleAddAssociatedComponents(vals);
          }
        );
      }
    });
  };
  handleAddAssociatedComponents = values => {
    const { dispatch, groupId, onOk } = this.props;
    dispatch({
      type: 'application/addAssociatedComponents',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id: groupId,
        ...values
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            submitLoading: false
          });
          onOk();
        }
      }
    });
  };
  render() {
    const { title, onCancel, form, data = {} } = this.props;
    const { getFieldDecorator } = form;
    const { submitLoading } = this.state;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 }
      }
    };
    return (
      <Modal
        title={title}
        visible
        confirmLoading={submitLoading}
        className={styles.TelescopicModal}
        onCancel={onCancel}
        onOk={this.onOk}
        okText="添加"
      >
        <Form onSubmit={this.onOk}>
          <FormItem {...formItemLayout} label="服务名">
            {getFieldDecorator('service_name', {
              initialValue: data.service_name || '',
              rules: [{ required: true, message: '请填写服务名' }]
            })(
              <Input disabled={data.service_name} placeholder="请填写服务名" />
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="端口号">
            {getFieldDecorator('port', {
              initialValue:
                data.tcp_ports &&
                (data.tcp_ports.length > 0 ? data.tcp_ports[0] : ''),
              rules: [{ required: true, message: '请选择端口号' }]
            })(
              <Select placeholder="请选择端口号">
                {data.tcp_ports.map(items => {
                  return (
                    <Option value={items} key={items}>
                      {items}
                    </Option>
                  );
                })}
              </Select>
            )}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
