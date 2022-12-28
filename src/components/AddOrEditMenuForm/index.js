/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */
/* eslint-disable camelcase */
import { Button, Card, Form, Icon, Input, Radio, Upload, Select, message, notification, Modal, Switch, TreeSelect } from 'antd';
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
    //表单提交
    handleSubmit = e => {
        e.preventDefault();
        const { form, dispatch, onOk } = this.props;
        form.validateFields((err, value) => {
            if (!err && onOk) {
                onOk(value)
            }
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
        const { onCancel, treeData, editData, isAddOrEdit } = this.props
        return (
            <Modal
                title={isAddOrEdit ? '新增菜单' : '编辑菜单'}
                visible
                onOk={this.handleSubmit}
                onCancel={onCancel}
            >
                <Form {...formItemLayout} onSubmit={this.handleSubmit}>
                    <Form.Item label='菜单标题' style={{ display: 'flex' }}>
                        {getFieldDecorator('title', {
                            initialValue: editData.title || '',
                            rules: [
                                {
                                    required: true,
                                    message: formatMessage({ id: 'placeholder.group_name' })
                                }
                            ]
                        })(<Input placeholder="请输入菜单标题"/>)}
                    </Form.Item>
                    <Form.Item label='菜单链接' style={{ display: 'flex' }}>
                        {getFieldDecorator('path', {
                            initialValue: editData.path || '',
                            rules: [
                                {
                                    required: true,
                                    message: formatMessage({ id: 'placeholder.group_name' })
                                }
                            ]
                        })(<Input placeholder="请输入菜单链接"/>)}
                    </Form.Item>
                    <Form.Item label='上级类目' style={{ display: 'flex' }}>
                        {getFieldDecorator('parent_id', {
                            initialValue: editData.parent_id || 0,
                            rules: [
                                {
                                    required: true,
                                    message: formatMessage({ id: 'placeholder.group_name' })
                                }
                            ]
                        })(
                            <TreeSelect
                                onChange={this.handleChange}
                                placeholder='请选择上级类目'
                                treeData={treeData}
                            />   
                                
                        )}
                    </Form.Item>
                    <Form.Item label='打开方式' style={{ display: 'flex' }}>
                        {getFieldDecorator('iframe', {
                            initialValue: editData.iframe || true,
                            rules: [
                                {
                                    required: true,
                                    message: formatMessage({ id: 'placeholder.group_name' })
                                }
                            ]
                        })(
                            <Radio.Group buttonStyle="solid">
                                <Radio.Button value={true}>新开窗口</Radio.Button>
                                <Radio.Button value={false}>当前窗口</Radio.Button>
                            </Radio.Group>
                        )}
                    </Form.Item>
                </Form>
            </Modal>
        );
    }
}
