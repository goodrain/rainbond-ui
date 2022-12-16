/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */
/* eslint-disable camelcase */
import { Button, Card, Form, Icon, Input, Radio, Upload, Select, message, notification, Modal } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import styles from './index.less'

const { Dragger } = Upload;
const { Option } = Select;

@Form.create()
@connect(
    ({ teamControl, global, enterprise }) => ({

    }),
    null,
    null,
    { pure: false }
)
export default class Index extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {

        };
    }

    componentDidMount() {

    }

    //表单提交
    handleSubmit = e => {
        e.preventDefault();
        const { form, dispatch, onOk } = this.props;

        form.validateFields((err, value) => {
            onOk(value)
        });
    };
    handleChange = () => {

    }
    render() {
        const {
            form: { getFieldDecorator },
        } = this.props;

        const formItemLayout = {
            labelCol: {
                span: 6
            },
            wrapperCol: {
                span: 14
            }
        };
        const { onCancel } = this.props
        return (
            <Modal
                title='新增菜单'
                visible
                onOk={this.handleSubmit}
                onCancel={onCancel}
            >
                <Form {...formItemLayout} onSubmit={this.handleSubmit}>
                    <Form.Item label='菜单标题' style={{ display: 'flex' }}>
                        {getFieldDecorator('group_id', {
                            rules: [
                                {
                                    required: true,
                                    message: formatMessage({ id: 'placeholder.group_name' })
                                }
                            ]
                        })(<Input />)}
                    </Form.Item>
                    <Form.Item label='菜单链接' style={{ display: 'flex' }}>
                        {getFieldDecorator('group_id', {
                            rules: [
                                {
                                    required: true,
                                    message: formatMessage({ id: 'placeholder.group_name' })
                                }
                            ]
                        })(<Input />)}
                    </Form.Item>
                    <Form.Item label='上级类目' style={{ display: 'flex' }}>
                        {getFieldDecorator('group_id', {
                            rules: [
                                {
                                    required: true,
                                    message: formatMessage({ id: 'placeholder.group_name' })
                                }
                            ]
                        })(
                            <Select
                                onChange={this.handleChange}
                                placeholder='请选择上级类目'
                            >
                                <Option value='1'>1</Option>
                            </Select>
                        )}
                    </Form.Item>
                    <Form.Item label='打开方式' style={{ display: 'flex' }}>
                        {getFieldDecorator('group_id', {
                            rules: [
                                {
                                    required: true,
                                    message: formatMessage({ id: 'placeholder.group_name' })
                                }
                            ]
                        })(
                            <Select
                                onChange={this.handleChange}
                                placeholder='请选择上级类目'
                            >
                                <Option value='1'>1</Option>
                            </Select>
                        )}
                    </Form.Item>
                </Form>
            </Modal>
        );
    }
}
