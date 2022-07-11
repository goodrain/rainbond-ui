import React, { PureComponent } from 'react'
import { Button, Card, Form, Input, Row, Steps, Select, Collapse, Icon, Affix, Table, Col, Radio, Switch } from 'antd';
import DAinput from '../../../../components/DAinput';
import DApvcinput from '../../../../components/DApvcinput.js/index'
import DAselect from '../../../../components/DAseclect';

const { Option, OptGroup } = Select;
const FormItem = Form.Item;

@Form.create()
export default class teshu extends PureComponent {
    constructor(props){
        super(props)
    }
        // 特殊属性
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
        <Card title="特殊属性" style={{ marginBottom: '24px' }}>
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
                })(<DAselect />)}
            </FormItem>
            <FormItem label="secret" {...formItemLayout}>
                {getFieldDecorator('secret', {
                    rules: [{ required: false, message: '请输入secret' }]
                })(<DAinput />)}
            </FormItem>
            <FormItem label="pvc" {...formItemLayouts}>
                {getFieldDecorator('Pvc', {
                    rules: [{ required: false, message: '请输入Pvc' }]
                })(<DApvcinput />)}
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
        </Form>
    </Card>
    )
  }
}
