import { Tabs, Card, Col, Table, Button, Drawer, Form, Row } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import AddMenuForm from '../../components/AddMenuForm';
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
    onCreateMenu = () => {
        this.setState({
            visible: true
        })
    }
    cancelCreateMenu = () => {
        this.setState({
            visible: false
        })
    }
    render() {
        const columns = [
            {
                title: '菜单名称',
                dataIndex: "name",
                rowKey: "name",
                width: "15%"
            },
            {
                title: '菜单链接',
                dataIndex: "apiVersions",
                rowKey: "apiVersions",
                width: "15%"
            },
            {
                title: '打开方式',
                dataIndex: "Kind",
                rowKey: "Kind",
                width: "15%"
            },
            {
                title: '操作',
                width: "15%",
                render: (val, index) => {
                    return (
                        <>
                            <Button
                                onClick={() => {
                                    this.handleEdit(index);
                                }}
                            >
                                编辑
                            </Button>
                            <Button
                                onClick={() => {
                                    this.handleEdit(index);
                                }}
                            >
                                删除
                            </Button>
                        </>
                    );
                }
            },
        ]
        const memoryList = [
            {
                id: 1,
                name: '菜单',
                apiVersions: 'www.baidu.com',
                Kind: '新开窗口',
            },
            {
                id: 2,
                name: '菜单',
                apiVersions: 'www.baidu.com',
                Kind: '当前窗口',
            },
            {
                id: 3,
                name: '菜单',
                apiVersions: 'www.baidu.com',
                Kind: '新开窗口',
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
        const { visible } = this.state
        const operation = (
            <Col span={4} offset={20} style={{ textAlign: 'right', marginRight: 10 }}>
                <Button
                    type="primary"
                    onClick={this.onCreateMenu}
                    className={styles.btns}
                >
                    创建菜单
                </Button>
            </Col>
        );
        return (
            <div>
                <Row
                    style={{
                        padding: '10px 0',
                    }}
                >
                    {operation}
                </Row>
                <Table
                    dataSource={memoryList}
                    columns={columns}
                    pagination={false}
                    style={{ background: "#fff", marginTop: "20px" }}
                />

                {visible && 
                    <AddMenuForm 
                        onOk={this.handleSubmit}
                        onCancel={this.cancelCreateMenu}
                    />
                }
            </div>
        );
    }
}

export default Index;
