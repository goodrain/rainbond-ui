import React, { Fragment, PureComponent, Component } from 'react';
import { connect } from 'dva';
import { Drawer, Form, Button, Col, Row, Input, Select, DatePicker, Icon, Skeleton, Spin, Radio, Switch } from 'antd';
import globalUtil from '../../utils/global';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import styles from './index.less';
import DAinput from '../DAinput';
import DAHosts from '../DAHosts'
import NewHeader from '../NewHeader'
const { Option } = Select;
@Form.create()

@connect()

export default class index extends Component {
    constructor(props) {
        super(props);
        this.state = {
            upstreamType: 'node',
        };
    }
    componentWillMount() {
    }
    onClose = () => {
        this.props.onClose()
    }
    handleSubmit = e => {
        e.preventDefault();
        this.props.form.validateFieldsAndScroll((err, values) => {
            if (!err) {
                console.log('Received values of form: ', values);
            }
        });
    };
    upstreamTypeChange = (e) => {
        console.log(e.target.value);
        this.setState({
            upstreamType: e.target.value
        })
    }

    render() {
        const { getFieldDecorator } = this.props.form;
        const { visible, groups, editInfo, appID } = this.props;
        const { upstreamType } = this.state;
        const formItemLayout = {
            labelCol: {
                xs: { span: 24 },
                sm: { span: 3 }
            },
            wrapperCol: {
                xs: { span: 24 },
                sm: { span: 18 }
            }
        };
        const formItemLayouts = {
            labelCol: {
                xs: { span: 24 },
                sm: { span: 0 }
            },
            wrapperCol: {
                xs: { span: 24 },
                sm: { span: 24 }
            }
        };
        return (
            <Drawer
                title={"新增路由"}
                width={700}
                onClose={this.onClose}
                visible={visible}
                bodyStyle={{ paddingBottom: 80 }}
            >
                <Form hideRequiredMark onSubmit={this.handleSubmit}>
                    <Form.Item {...formItemLayout} label="名称">
                        {getFieldDecorator('name', {
                            rules: [{ required: true, message: 'Please enter user name' }],
                        })(<Input placeholder="Please enter user name" />)}
                    </Form.Item>
                    <Form.Item {...formItemLayout} label="上游类型">
                        {getFieldDecorator('radio-button'), {
                            initialValue: upstreamType,
                        }, (<Radio.Group onChange={this.upstreamTypeChange} defaultValue={upstreamType}>
                            <Radio.Button value="node">节点</Radio.Button>
                        </Radio.Group>)}
                    </Form.Item>
                    {upstreamType === 'node' &&
                        <Form.Item {...formItemLayout} label="目标主机">
                            {getFieldDecorator('node', {
                                rules: [{ required: true, message: 'Please enter user name' }],
                            })(<DAinput placeholder="Please enter user name" />)}
                        </Form.Item>
                    }
                    <Form.Item {...formItemLayout} label="Host请求头">
                        {getFieldDecorator('radio-button'), {
                            initialValue: upstreamType,
                        }, (
                                <Radio.Group
                                    // onChange={this.upstreamTypeChange}
                                >
                                    <Radio value="rewrite">使用目标IP</Radio>
                                    <Radio value="unRewrite">保持不变</Radio>
                                </Radio.Group>
                            )}
                    </Form.Item>
                    <Row>
                        <Col span={3} style={{ height: 64, textAlign: 'end', marginTop: 10 }}>重试：</Col>
                        <Col span={9}>
                            <Form.Item  {...formItemLayouts} >
                                {getFieldDecorator('node', {
                                    rules: [{ required: true, message: 'Please enter user name' }],
                                })(<Input placeholder="次数" style={{ width: "95%" }} />)}
                            </Form.Item>
                        </Col>
                        <Col span={9}>
                            <Form.Item {...formItemLayouts}>
                                {getFieldDecorator('node', {
                                    rules: [{ required: true, message: 'Please enter user name' }],
                                })(<Input placeholder="超时" style={{ width: "100%" }} />)}
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item {...formItemLayout} label="协议">
                        {getFieldDecorator('radio-button'), {
                            initialValue: "HTTP",
                        }, (
                                <Radio.Group
                                    // onChange={this.upstreamTypeChange}
                                >
                                    <Radio value="HTTP">HTTP</Radio>
                                    <Radio value="HTTPS">HTTPS</Radio>
                                </Radio.Group>
                            )}
                    </Form.Item>
                    <Row>
                        <Col span={3} style={{ height: 64, textAlign: 'end', marginTop: 10 }}>超时：</Col>
                        <Col span={6}>
                            <Form.Item  {...formItemLayouts} >
                                {getFieldDecorator('node', {
                                    rules: [{ required: true, message: 'Please enter user name' }],
                                })(<Input placeholder="连接" style={{ width: "95%" }} addonAfter="s"/>)}
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item {...formItemLayouts}>
                                {getFieldDecorator('node', {
                                    rules: [{ required: true, message: 'Please enter user name' }],
                                })(<Input placeholder="发送" style={{ width: "95%" }} addonAfter="s"/>)}
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item {...formItemLayouts}>
                                {getFieldDecorator('node', {
                                    rules: [{ required: true, message: 'Please enter user name' }],
                                })(<Input placeholder="接受" style={{ width: "100%" }} addonAfter="s"/>)}
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={3} style={{ height: 64, textAlign: 'end', marginTop: 10 }}>连接池：</Col>
                        <Col span={6}>
                            <Form.Item  {...formItemLayouts} >
                                {getFieldDecorator('node', {
                                    rules: [{ required: true, message: 'Please enter user name' }],
                                })(<Input placeholder="容量" style={{ width: "95%" }}/>)}
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item {...formItemLayouts}>
                                {getFieldDecorator('node', {
                                    rules: [{ required: true, message: 'Please enter user name' }],
                                })(<Input placeholder="空闲超时时间" style={{ width: "95%" }}addonAfter="s"/>)}
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item {...formItemLayouts}>
                                {getFieldDecorator('node', {
                                    rules: [{ required: true, message: 'Please enter user name' }],
                                })(<Input placeholder="请求数量" style={{ width: "100%" }}/>)}
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
                <div
                    style={{
                        position: 'absolute',
                        right: 0,
                        bottom: 0,
                        width: '100%',
                        borderTop: '1px solid #e9e9e9',
                        padding: '10px 16px',
                        background: '#fff',
                        textAlign: 'right',
                    }}
                >
                    <Button onClick={this.onClose} style={{ marginRight: 8 }}>
                        Cancel
                    </Button>
                    <Button type="primary" onClick={this.handleSubmit}>
                        Submit
                    </Button>
                </div>
            </Drawer>
        )
    }
}
