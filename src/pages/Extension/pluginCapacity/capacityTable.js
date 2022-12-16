import { Tabs, Card, Col, Table, Button, Drawer, Form } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import CodeMirrorForm from '../../../components/CodeMirrorForm';
import styles from './index.less'
const { TabPane } = Tabs;
@Form.create()
@connect(null, null, null, { withRef: true })
class Index extends PureComponent {
    constructor(props) {
        super(props)
        this.state = {
            visible: false
        }
    }
    handleEdit = () => {    
        this.setState({
            visible: true
        })
    }
    onClose = () => {
        this.setState({
            visible: false
        })
    }
    handleSubmit = () => {
        this.setState({
            visible: false
        })
    }
    render() {
        const columns = [
            {
                title: '名称',
                dataIndex: "name",
                rowKey: "name",
                width: "15%"
            },
            {
                title: 'apiVersions',
                dataIndex: "apiVersions",
                rowKey: "apiVersions",
                width: "15%"
            },
            {
                title: 'Kind',
                dataIndex: "Kind",
                rowKey: "Kind",
                width: "15%"
            },
            {
                title: '操作',
                width: "15%",
                render: (val, index) => {
                    return (
                        <Button
                            onClick={() => {
                                this.handleEdit(index);
                            }}
                        >
                            编辑
                        </Button>
                    );
                }
            },
        ]
        const memoryList = [
            {
                id: 1,
                name: 'listio',
                apiVersions: 'networking.istio.io/v1apiha3',
                Kind: 'VirtualService',

            },
            {
                id: 2,
                name: 'listio',
                apiVersions: 'networking.istio.io/v1apiha3',
                Kind: 'VirtualService',

            },
            {
                id: 3,
                name: 'listio',
                apiVersions: 'networking.istio.io/v1apiha3',
                Kind: 'VirtualService',

            },
        ]
        const {
            form: { getFieldDecorator, setFieldsValue },
      
        } = this.props;
        const formItemLayout = {
            labelCol: {
              xs: { span: 4 },
              sm: { span: 4 }
            },
            wrapperCol: {
      
              xs: { span: 20 },
              sm: { span: 20 }
            }
        };
        const formItemLayouts = {
            labelCol: {
              xs: { span: 24 },
              sm: { span: 24 }
            },
            wrapperCol: {
              xs: { span: 24 },
              sm: { span: 24 }
            }
        };
        return (
            <div>
                <Table
                    dataSource={memoryList}
                    columns={columns}
                    pagination={false}
                    style={{ background: "#fff", marginTop: "20px" }}
                />
                <Drawer
                    title='编辑'
                    placement="right"
                    width="400"
                    onClose={this.onClose}
                    visible={this.state.visible}
                >
                    <Form {...formItemLayout}>
                        <CodeMirrorForm
                            setFieldsValue={setFieldsValue}
                            Form={Form}
                            style={{ marginBottom: '20px' }}
                            getFieldDecorator={getFieldDecorator}
                            formItemLayout={formItemLayouts}
                            name={"yaml"}
                            message={formatMessage({ id: 'notification.hint.confiuration.editContent' })}
                            data={""}
                            mode={'yaml'}
                        />
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
                            textAlign: 'right'
                        }}
                    >
                        <Button onClick={this.onClose} style={{ marginRight: 8 }}>
                            {formatMessage({ id: 'button.cancel' })}
                        </Button>
                        <Button onClick={this.handleSubmit} type="primary">
                            {formatMessage({ id: 'button.confirm' })}
                        </Button>
                    </div>
                </Drawer>
            </div>
        );
    }
}

export default Index;
