import React, { PureComponent } from 'react'
import { Card, Table, Button, Drawer, Empty, Form } from 'antd';
import CodeMirrorForm from "../CodeMirrorForm"

@Form.create()
export default class index extends PureComponent {
    constructor(porps) {
        super(porps)
        this.state = {
            showDrawerswitch: false
        }
    }
    showDrawer = (val) => {
        this.setState({
            showDrawerswitch: !this.state.showDrawerswitch
        })
    }

    onClose = () => {
        this.setState({
            showDrawerswitch: false,
        });
    };
    render() {
        const { form } = this.props;
        const { getFieldDecorator, setFieldsValue } = form;
        const { value } = this.props;
        return (
            <Card
                title="k8s资源"
                style={{
                    marginBottom: 16,
                }}>
                {(value && value.length > 0) ? (
                    <Table
                        columns={[
                            {
                                title: '名称',
                                dataIndex: 'name',
                                key: "name",
                                width: 500,
                                render: text => {
                                    return <>
                                        {text ? text : "暂无名称"}
                                    </>
                                }

                            },
                            {
                                title: '类型',
                                dataIndex: 'kind',
                                key: "kind",
                                render: text => {
                                    return <>
                                        {text ? text : "未分类"}
                                    </>
                                }
                            },
                            {
                                title: 'yaml',
                                dataIndex: 'content',
                                key: "content",
                                render: text => {
                                    return <>
                                        <Button onClick={() => this.showDrawer(text)}>查看详情</Button>
                                        <Drawer
                                            title="yaml"
                                            placement="right"
                                            closable={false}
                                            onClose={this.onClose}
                                            visible={this.state.showDrawerswitch}
                                            width={500}
                                        >
                                            <CodeMirrorForm
                                                setFieldsValue={setFieldsValue}
                                                Form={Form}
                                                style={{ marginBottom: '20px' }}
                                                getFieldDecorator={getFieldDecorator}
                                                name={"selectval"}
                                                data={text || ''}
                                                mode={'yaml'}
                                                isUpload={false}
                                                disabled={true}
                                            />
                                        </Drawer>
                                    </>
                                }
                            },
                        ]}
                        dataSource={value}
                        pagination={true}
                    >
                    </Table>
                ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )
                }
            </Card>
        )
    }
}
