import React, { Component } from 'react';
import {
    Card,
    Row,
    Col,
    Button,
    Tooltip,
    Drawer,
    Form,
    Skeleton
} from 'antd';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { connect } from 'dva';
import DApvcinput from '../../components/DApvcinput'
import styles from "./index.less";

@connect()
@Form.create()
class Index extends Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: false,
        }
    }
    handleClick = () => {
        this.setState({
            visible: true
        })
    }
    onClose = () => {
        this.setState({
            visible: false,
        });
    }
    handleSubmit = (e) => {
        e.preventDefault()
        const { form, dispatch } = this.props;
        form.validateFields((err, value) => {
            const { keyandval } = value;
            const obj = {}
            keyandval.map(item => {
                obj[item.key || ''] = item.value || ''
            })
            this.props.updataLabel(obj)
            this.setState({
                visible: false,
            })
        })
    }
    render() {
        const { form, labelList, clusterInfo, showLable } = this.props;
        const { getFieldDecorator, setFieldsValue } = form;
        const arr = Object.entries(labelList)
        const labelListArr = []
        arr.map(item => {
            const obj = {}
            obj.key = item[0]
            obj.value = item[1]
            labelListArr.push(obj)
        })
        const formItemLayouts = {
            labelCol: {
                xs: {
                    span: 8
                },
                sm: {
                    span: 8
                }
            },
            wrapperCol: {
                xs: {
                    span: 16
                },
                sm: {
                    span: 16
                }
            }
        };
        return (
            <>
                <Card
                    extra={showLable && <Button icon="form" onClick={this.handleClick}>{formatMessage({id:'enterpriseColony.mgt.node.editLable'})}</Button>}
                    style={
                        { boxShadow: 'rgba(36, 46, 66, 0.16) 2px 4px 10px 0px' }
                    }
                >
                    {showLable ?
                        <div className={styles.labelStyle}>
                            {labelListArr && labelListArr.length > 0 && labelListArr.map((ele, index) => {
                                return <Tooltip key={index} placement="top" title={<div><p>Key: {ele.key}</p><p>Value: {ele.value}</p></div>}>
                                    <div className={styles.tipText_style}>
                                        <span>{ele.key}</span>
                                        <span>{ele.value}</span>
                                    </div>
                                </Tooltip>
                            })}
                        </div>
                        :
                        <Skeleton active />
                    }
                </Card>
                <Drawer
                    title={formatMessage({id:'enterpriseColony.mgt.node.editLable'})}
                    placement="right"
                    closable={false}
                    onClose={this.onClose}
                    visible={this.state.visible}
                    width={500}
                    bodyStyle={{ padding: 0 }}
                >
                    <Form onSubmit={this.handleSubmit} style={{ padding: 20 }}>
                        <Form.Item >
                            {getFieldDecorator(`keyandval`, {
                                initialValue: labelListArr || [],
                                rules: [{ required: false, message: formatMessage({id:'enterpriseColony.mgt.node.key'}) }]
                            })(<DApvcinput setspan={10} />)}
                        </Form.Item>
                    </Form>
                    <div className={styles.submitStyle}>
                        <Button onClick={this.onClose}>{formatMessage({id:'button.cancel'})}</Button>
                        <Button type="primary" onClick={this.handleSubmit}>{formatMessage({id:'button.confirm'})}</Button>
                    </div>
                </Drawer>

            </>
        );
    }
}

export default Index;