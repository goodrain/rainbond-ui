import React, { PureComponent } from 'react';
import { connect } from "dva";
import TenantSelect from "../../components/TenantSelect"
import { Form, Input, Select, Modal } from 'antd';

const FormItem = Form.Item;
const Option = Select.Option;

@connect(({ }) => ({

}))
class CreateUserForm extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            authorityList: [],
            tenant_name: ""
        }
    }
    /**
     * 表单
     */
    handleChange = (tenant_name) => {
        this.setState({ tenant_name })
    }
    handleSelect = (selectedTeam) => {
        const { dispatch } = this.props
        dispatch({
            type: "global/requestAuthority",
            payload: {
                selectedTeam
            },
            callback: (data) => {
                if (data) {
                    this.setState({
                        authorityList: data.list
                    })
                }
            }
        })
    }
    checkAccount = (rule, value, callback) => {
        if (value.length < 8) {
            callback('密码长度至少为8位');
        } else {
            callback()
        }
    }
    handleSubmit = () => {
        this.props.form.validateFields((err, values) => {
            if (!err) {
                this.props.onOk && this.props.onOk(values);
            }
        });
    }
    render() {
        const { getFieldDecorator } = this.props.form;
        const { onOk, onCancel } = this.props;
        const { authorityList } = this.state;
        const formItemLayout = {
            labelCol: {
                xs: { span: 24 },
                sm: { span: 4 }
            },
            wrapperCol: {
                xs: { span: 24 },
                sm: { span: 18 }
            }
        };
        return (
            <Modal
                visible={true}
                title="添加用户"
                onOk={this.handleSubmit}
                onCancel={onCancel}
            >
                <Form onSubmit={this.handleSubmit}>
                    <FormItem
                        {...formItemLayout}
                        label="用户名"
                    >
                        {getFieldDecorator('user_name', { rules: [{ required: true, message: '请填写用户名!' }] })(
                            <Input placeholder="请填写用户名!" />
                        )}
                    </FormItem>
                    <FormItem
                        {...formItemLayout}
                        label="所属团队"
                    >
                        {getFieldDecorator('tenant_name', { rules: [{ required: true, message: '请选择团队!', }] })(
                            <TenantSelect placeholder="请输入团队名称进行查询" onChange={this.handleChange} onSelect={this.handleSelect} />
                            // <Input type="text" placeholder="请输入团队名称!" />
                        )}
                    </FormItem>
                    <FormItem
                        {...formItemLayout}
                        label="密码"
                        hasFeedback
                    >
                        {getFieldDecorator('password', { rules: [{ required: true, message: '密码长度至少为8位!', validator: this.checkAccount }] })(
                            <Input type="text" placeholder="请填写密码!" />
                        )}
                    </FormItem>
                    <FormItem
                        {...formItemLayout}
                        label="手机号"
                    >
                        {getFieldDecorator('phone', { rules: [{ required: true, message: '请填写手机号!' }] })(
                            <Input type="text" placeholder="请填写手机号!" />
                        )}
                    </FormItem>
                    <FormItem
                        {...formItemLayout}
                        label="邮箱"
                    >
                        {getFieldDecorator('email', {
                            rules: [
                                { required: true, message: '请填写邮箱!' },
                                { type: 'email', message: '邮箱格式不正确!' }
                            ]
                        })(
                            <Input type="text" placeholder="请填写邮箱!" />
                        )}
                    </FormItem>
                    <FormItem
                        {...formItemLayout}
                        label="角色权限"
                    >
                        {getFieldDecorator('identity', {
                            initialValue: [],
                            rules: [{ required: true, message: '请选择用户角色!' }]
                        })(
                            <Select
                                mode="multiple"
                                style={{ width: '100%' }}
                                placeholder="请选择用户角色"
                            >
                                {
                                    authorityList.map((item, index) => {
                                        return (
                                            <Option key={index} value={item.role_id}>{item.role_name}</Option>
                                        )
                                    })
                                }
                            </Select>
                        )}
                    </FormItem>
                </Form>
            </Modal>
        )
    }
}
const createUser = Form.create()(CreateUserForm);
export default createUser