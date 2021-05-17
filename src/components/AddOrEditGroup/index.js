import { Form, Input, Modal } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import styles from '../CreateTeam/index.less';
const FormItem = Form.Item;
@connect()
@Form.create()
export default class EditGroupName extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      addGroupLoading: false
    };
  }
  handleCannelLoading = () => {
    this.setState({
      addGroupLoading: false
    });
  };
  onOk = e => {
    e.preventDefault();
    const { form, onOk, dispatch, team_name, region_name } = this.props;
    form.validateFields({ force: true }, (err, vals) => {
      if (!err && onOk) {
        this.setState({
          addGroupLoading: true
        });
        // 新建应用的异步
        setTimeout(() => {
          this.handleCannelLoading();
          onOk(vals);
        }, 2000);
      }
    });
  };
  render() {
    const {
      title,
      onCancel,
      form,
      group_name: groupName,
      note,
      loading = false
    } = this.props;
    const { addGroupLoading } = this.state;
    const { getFieldDecorator } = form;
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
        title={title || '新建应用'}
        visible
        confirmLoading={addGroupLoading}
        className={styles.TelescopicModal}
        onCancel={onCancel}
        onOk={this.onOk}
      >
        <Form onSubmit={this.onOk}>
          <FormItem {...formItemLayout} label="应用名称">
            {getFieldDecorator('group_name', {
              initialValue: groupName || '',
              rules: [
                { required: true, message: '请填写应用名称' },
                {
                  max: 24,
                  message: '应用名称最大长度24位'
                }
              ]
            })(<Input placeholder="请填写应用名称" />)}
          </FormItem>
          <FormItem {...formItemLayout} label="应用备注">
            {getFieldDecorator('note', {
              initialValue: note || '',
              rules: [
                {
                  max: 255,
                  message: '最大长度255位'
                }
              ]
            })(<Input.TextArea placeholder="请填写应用备注信息" />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
