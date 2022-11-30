import React, { PureComponent } from 'react'
import { Card, Table, Button, Drawer, Empty, Form } from 'antd';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
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
                title={formatMessage({id:'enterpriseColony.import.recognition.tabs'})}
                style={{
                    marginBottom: 16,
                    borderRadius: 5,
                    boxShadow:'rgb(36 46 66 / 16%) 2px 4px 10px 0px',
                }}>
                {(value && value.length > 0) ? (
                    <>
                    <Table
                        columns={[
                            {
                                title: formatMessage({id:'enterpriseColony.import.recognition.tabs.k8s.name'}),
                                dataIndex: 'name',
                                key: "name",
                                width: 500,
                                render: text => {
                                    return <>
                                        {text ? text : formatMessage({id:'enterpriseColony.import.recognition.tabs.k8s.name_null'})}
                                    </>
                                }

                            },
                            {
                                title: formatMessage({id:'enterpriseColony.import.recognition.tabs.k8s.kind'}),
                                dataIndex: 'kind',
                                key: "kind",
                                render: text => {
                                    return <>
                                        {text ? text : formatMessage({id:'enterpriseColony.import.recognition.tabs.k8s.not_kind'})}
                                    </>
                                }
                            },
                            {
                                title: formatMessage({id:'enterpriseColony.import.recognition.tabs.k8s.content'}),
                                dataIndex: 'content',
                                key: "content",
                                render: (text, record) => {
                                    return <>
                                        <Button onClick={() => this.showDrawer(text, record)}>
                                            {formatMessage({id:'enterpriseColony.import.recognition.tabs.specialAttr.btn.detail'})}
                                        </Button>
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
