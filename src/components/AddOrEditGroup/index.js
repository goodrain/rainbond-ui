import React, { PureComponent } from 'react';
import { Form, Button, Input, Modal} from 'antd';
const FormItem = Form.Item;

@Form.create()
export default class EditGroupName extends PureComponent {
   onOk = (e) => {
      e.preventDefault();
    this.props.form.validateFields({force: true}, (err, vals)=>{
       if(!err){
          this.props.onOk && this.props.onOk(vals)
       }
    })
   }
   render() {
     const {title, onCancel, onOk, group_name, group_note} = this.props;
     const { getFieldDecorator, getFieldValue } = this.props.form;
     const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 }
      },
    };
     return (
        <Modal
           title={title  || '新建应用'}
           visible = {true}
           onCancel={onCancel}
           onOk={this.onOk}
        >
          <Form onSubmit={this.onOk}>
              <FormItem
              {...formItemLayout}
              label="应用名称"
              >
              {
                getFieldDecorator('group_name', {
                  initialValue: group_name || '',
                  rules:[{required: true, message: '请填写应用名称'}]
                })(
                  <Input placeholder="请填写应用名称" />
                )
              }
              </FormItem>
              <FormItem
              {...formItemLayout}
              label="应用备注"
              >
              {
                getFieldDecorator('group_note', {
                  initialValue: group_note || '',
                })(
                  <Input.TextArea placeholder="请填写应用备注信息" />
                )
              }
              </FormItem>
          </Form>
        </Modal>
      )
   }
}