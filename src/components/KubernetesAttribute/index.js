import React, { PureComponent } from 'react'
import { Card, Table, Button, Drawer, Empty, Form } from 'antd';
import CodeMirrorForm from "../CodeMirrorForm"

@Form.create()
export default class index extends PureComponent {
    constructor(porps) {
        super(porps)
        this.state = {
            drawerValue: "",
            showDrawerSwitchVal: false,
            name:'',
        }
    }
    showDrawer = (text, record) => {
        this.setState({
            drawerValue: text,
            showDrawerSwitchVal: !this.state.showDrawerSwitchVal,
            name:record.name
        })
    }
    onClose = () => {
        this.setState({
            showDrawerSwitchVal: false,
        });
    };
    render() {
        const { form, value } = this.props;
        const { getFieldDecorator, setFieldsValue } = form;
        const { drawerValue, name } = this.state;
        return (
            <Card
                title="k8s资源"
                style={{
                    marginBottom: 16,
                }}>
                {(value && value.length > 0) ? (
                    <>
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
                                render: (text, record) => {
                                    return <>
                                        <Button onClick={() => this.showDrawer(text, record)}>查看详情</Button>
                                    </>
                                }
                            },
                        ]}
                        dataSource={value}
                        pagination={true}
                    >
                    </Table>
                <Drawer
                    title="yaml"
                    placement="right"
                    closable={false}
                    onClose={this.onClose}
                    visible={this.state.showDrawerSwitchVal}
                    width={500}
                >
                    <CodeMirrorForm
                        setFieldsValue={setFieldsValue}
                        Form={Form}
                        style={{ marginBottom: '20px' }}
                        getFieldDecorator={getFieldDecorator}
                        name={ name }
                        data={drawerValue || ''}
                        mode={'yaml'}
                        isUpload={false}
                        disabled={true}
                    />
                </Drawer>
                </>
                ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )
                }
            </Card>
        )
    }
}
