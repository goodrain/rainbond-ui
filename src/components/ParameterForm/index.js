import React, { PureComponent } from 'react';
import Search from '../Search';
import Parameterinput from '../Parameterinput'

import { connect } from 'dva';
import {
    Row,
    Col,
    Card,
    Table,
    Button,
    Drawer,
    Form,
    Input,
    Select,
    Radio,
    InputNumber,
    Checkbox,
    Icon,
    Modal
} from 'antd';
import globalUtil from '../../utils/global';
import styles from './index.less'
import { number } from 'prop-types';
const FormItem = Form.Item;
const Option = Select.Option;
const RadioGroup = Radio.Group;

@connect(
    ({ user, loading }) => ({
        currUser: user.currentUser,
        addHttpStrategyLoading: loading.effects['gateWay/addHttpStrategy'],
        editHttpStrategyLoading: loading.effects['gateWay/editHttpStrategy']
    }),
)
class ParameterForm extends PureComponent {
    constructor(props) {
        super(props)
        this.state = {
            serviceComponentList: [],
            portList: [],
            licenseList: [],
            service_id: "",
            group_name: "",
            descriptionVisible: false,
            rule_extensions_visible: false
        }
    }

    handleOk = (e) => {
        e.preventDefault();
        const { onOk } = this.props
        this.props.form.validateFields((err, values) => {
            if (!err) {
                onOk && onOk(values);
            }
        });
    }

    onChange = (e) => {
        // console.log(`checked = ${e.target.checked}`);
    }


    render() {
        const { getFieldDecorator } = this.props.form;
        const formItemLayout = {
            labelCol: {
                xs: { span: 8 },
                sm: { span: 8 }
            },
            wrapperCol: {
                xs: { span: 16 },
                sm: { span: 16 }
            }
        };
        const {editInfo}=this.props

        return (
            <div>
                <Drawer
                    title={"参数配置"}
                    placement="right"
                    width={500}
                    closable={false}
                    // onClose={onClose}
                    visible={this.props.visible}
                    maskClosable={true}
                    closable={true}
                    style={{
                        overflow: 'auto',
                    }}
                >
                    <Form >
                        <FormItem
                            {...formItemLayout}
                            label="连接超时时间"
                            className={styles.antd_form}
                        >
                            {getFieldDecorator('proxy_connect_timeout', {
                                rules: [
                                    {
                                        required: true,
                                        message: "请输入超时时间",
                                    }
                                ],
                                initialValue: editInfo?editInfo.proxy_connect_timeout:"60"
                            })(
                                <InputNumber formatter={value => `${value}S`} placeholder="请输入域名" style={{ width: "100%" }} />
                            )}
                        </FormItem>


                        <FormItem
                            {...formItemLayout}
                            label="请求超时时间"
                            className={styles.antd_form}
                        >
                            {getFieldDecorator('proxy_send_timeout', {
                                rules: [
                                    {
                                        required: true,
                                        message: "请添加域名",
                                    }
                                ],
                                initialValue: editInfo?editInfo.proxy_send_timeout:"60"
                            })(
                                <InputNumber formatter={value => `${value}S`} placeholder="请输入域名" style={{ width: "100%" }} />
                            )}
                        </FormItem>

                        <FormItem
                            {...formItemLayout}
                            label="响应超时时间"
                            className={styles.antd_form}
                        >
                            {getFieldDecorator('proxy_read_timeout', {
                                rules: [
                                    {
                                        required: true,
                                        message: "请添加域名",
                                    }
                                ],
                                initialValue:editInfo?editInfo.proxy_read_timeout: "60"
                            })(
                                <InputNumber formatter={value => `${value}S`} placeholder="请输入域名" style={{ width: "100%" }} />
                            )}
                        </FormItem>

                        <FormItem
                            {...formItemLayout}
                            label="最大请求正文"
                            className={styles.antd_form}
                        >
                            {getFieldDecorator('proxy_body_size', {
                                rules: [
                                    {
                                        required: true,
                                        message: "请添加域名",
                                    }
                                ],
                                initialValue:editInfo?editInfo.proxy_body_size: "1"
                            })(
                                <InputNumber formatter={value => `${value}S`} placeholder="请输入域名" style={{ width: "100%" }} />
                            )}
                        </FormItem>


                        <FormItem
                            {...formItemLayout}
                            label="响应缓存数量"
                            className={styles.antd_form}
                        >
                            {getFieldDecorator('proxy_buffers_number', {
                                rules: [
                                    {
                                        required: true,
                                        message: "请添加域名",
                                    }
                                ],
                                initialValue:editInfo?editInfo.proxy_buffers_number: "4"
                            })(
                                <InputNumber formatter={value => `${value}`} placeholder="请输入域名" style={{ width: "100%" }} />
                            )}
                        </FormItem>




                        <FormItem
                            {...formItemLayout}
                            label="响应缓存单位"
                            className={styles.antd_form}
                        >
                            {getFieldDecorator('proxy_buffer_size', {
                                rules: [
                                    {
                                        required: true,
                                        message: "请添加域名",
                                    }
                                ],
                                initialValue: editInfo?editInfo.proxy_buffer_size:"1"
                            })(
                                <InputNumber formatter={value => `${value}k`} placeholder="请输入域名" style={{ width: "100%" }} />
                            )}
                        </FormItem>

                        <FormItem
                            {...formItemLayout}
                            label="是否开启响应缓存"
                            className={styles.antd_form}
                        >
                            {getFieldDecorator('proxy_buffering', {
                                rules: [
                                    {
                                        required: true,
                                        message: "请添加域名",
                                    }
                                ],
                                initialValue:editInfo?editInfo.proxy_buffering: ""
                            })(
                                <Checkbox onChange={this.onChange}></Checkbox>
                            )}
                        </FormItem>

                        <FormItem
                            {...formItemLayout}
                            label="自定义请求头"
                        >
                            {getFieldDecorator("set_headers", { initialValue:editInfo?editInfo.set_headers: "" })(<Parameterinput editInfo={editInfo}/>)}
                        </FormItem>
                    </Form>
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            width: '100%',
                            borderTop: '1px solid #e8e8e8',
                            padding: '10px 16px',
                            textAlign: 'right',
                            left: 0,
                            background: '#fff',
                            borderRadius: '0 0 4px 4px',
                            zIndex: 9999,
                        }}
                    >
                        <Button
                            style={{
                                marginRight: 8,
                            }}
                        onClick={this.props.onClose}
                        >
                            取消
                        </Button>
                        <Button type="primary" onClick={this.handleOk}>确认</Button>
                    </div>
                </Drawer>
            </div>
        )
    }
}
const parameterForm = Form.create()(ParameterForm);
export default parameterForm;