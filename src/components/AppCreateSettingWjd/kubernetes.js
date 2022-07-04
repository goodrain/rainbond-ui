import { Button, Card, Form, Select, Switch } from 'antd';
import React, { PureComponent } from 'react';
import DAinput from '../../components/DAinput';
// import DApvcinput from '../../components/DApvcinput.js';
// import DAselect from '../../components/DAseclect';

const FormItem = Form.Item;
const { Option } = Select;
@Form.create()
class Index extends PureComponent {
    handleSwitchOnChange = () => { };
    render() {
        const {
            form: { getFieldDecorator }
        } = this.props;
        const formItemLayout = {
            labelCol: {
                xs: {
                    span: 4
                },
                sm: {
                    span: 4
                }
            },
            wrapperCol: {
                xs: {
                    span: 6
                },
                sm: {
                    span: 6
                }
            }
        };
        const formItemLayouts = {
            labelCol: {
                xs: {
                    span: 4
                },
                sm: {
                    span: 4
                }
            },
            wrapperCol: {
                xs: {
                    span: 14
                },
                sm: {
                    span: 14
                }
            }
        };
        return (
            <div>
                <Card title="Kubernetes属性" style={{ marginBottom: '24px' }}>
                    <Form>
                        <FormItem label="NodeSelector" {...formItemLayout}>
                            {getFieldDecorator('NodeSelector', {
                                rules: [{ required: false, message: '请输入NodeSelector' }]
                            })(<DAinput />)}
                        </FormItem>
                        <FormItem label="label" {...formItemLayout}>
                            {getFieldDecorator('label', {
                                rules: [{ required: false, message: '请输入label' }]
                            })(<DAinput />)}
                        </FormItem>
                        <FormItem label="Tolerations" {...formItemLayouts}>
                            {getFieldDecorator('Tolerations', {
                                rules: [{ required: false, message: '请输入label' }]
                            })(<DAinput />)}
                        </FormItem>
                        <FormItem label="secret" {...formItemLayout}>
                            {getFieldDecorator('secret', {
                                rules: [{ required: false, message: '请输入secret' }]
                            })(<DAinput />)}
                        </FormItem>
                        <FormItem label="pvc" {...formItemLayouts}>
                            {getFieldDecorator('Pvc', {
                                rules: [{ required: false, message: '请输入Pvc' }]
                            })(<DAinput />)}
                        </FormItem>
                        <FormItem
                            label="ServiceAccountName"
                            labelCol={{
                                xs: {
                                    span: 4
                                },
                                sm: {
                                    span: 4
                                }
                            }}
                            wrapperCol={{
                                xs: {
                                    span: 2
                                },
                                sm: {
                                    span: 2
                                }
                            }}
                        >
                            {getFieldDecorator('ServiceAccountName', {
                                rules: [{ required: false, message: '请输入ServiceAccountName' }]
                            })(
                                <Select placeholder="请选择" style={{ width: 157 }}>
                                    <Option value="male">Male</Option>
                                    <Option value="female">Female</Option>
                                    <Option value="other">Other</Option>
                                </Select>
                            )}
                        </FormItem>
                        <FormItem
                            label="Privileged"
                            labelCol={{
                                xs: {
                                    span: 4
                                },
                                sm: {
                                    span: 4
                                }
                            }}
                            wrapperCol={{
                                xs: {
                                    span: 2
                                },
                                sm: {
                                    span: 2
                                }
                            }}
                        >
                            {getFieldDecorator('privileged', {
                                rules: [{}]
                            })(
                                <Switch defaultChecked onChange={this.handleSwitchOnChange} />
                            )}
                        </FormItem>
                        <FormItem
                            wrapperCol={{
                                xs: {
                                    span: 4,
                                    offset: 4
                                },
                                sm: {
                                    span: 4,
                                    offset: 4
                                }
                            }}
                        >
                            {/* <Button type="primary">保存</Button> */}
                        </FormItem>
                    </Form>
                </Card>
            </div>
        );
    }
}

export default Index;
