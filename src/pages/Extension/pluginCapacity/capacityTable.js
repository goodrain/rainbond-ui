import { Tabs, Card, Col, Table, Button, Drawer, Form, notification } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import yaml from 'js-yaml'
import CodeMirrorForm from '../../../components/CodeMirrorForm';
import global from '../../../utils/global';
import styles from './index.less'
const { TabPane } = Tabs;
@Form.create()
@connect(null, null, null, { withRef: true })
class Index extends PureComponent {
    constructor(props) {
        super(props)
        this.state = {
            visible: false,
            abilitiesList: [],
            abilityId: '',
            resourceVersion: '',
            yamlData: '',
            loading: true,
        }
    }
    componentDidMount() {
        this.handleAbilitiesList()
    }
    handleAbilitiesList = () => {
        const { dispatch, regionName } = this.props
        const eid = global.getCurrEnterpriseId();
        dispatch({
            type: 'global/getAbilitiesList',
            payload: {
                enterprise_id: eid,
                region_name: regionName,
            },
            callback: res => {
                if (res && res.list) {
                    this.setState({
                        abilitiesList: res.list,
                        loading: false
                    })
                }
            }
        })
    }
    handleAbilitiesEdit = (data) => {
        const { dispatch, regionName } = this.props
        const { abilityId, resourceVersion } = this.state
        const eid = global.getCurrEnterpriseId();
        dispatch({
            type: 'global/abilitiesEdit',
            payload: {
                enterprise_id: eid,
                region_name: regionName,
                data,
                ability_id: abilityId,
            },
            callback: res => {
                if(res){
                    this.handleAbilitiesList()
                    this.setState({
                        visible: false,
                        yamlData: ''
                    })
                }
            },
            handleError: res => {
                if(res){
                    notification.error({ message: res.data.msg_show, duration: 30 })
                    this.handleAbilitiesList()
                }
            }
        })
    }
    handleAbilitiesDetail = () => {
        const { dispatch, regionName } = this.props
        const { abilityId } = this.state
        const eid = global.getCurrEnterpriseId();
        dispatch({
            type: 'global/abilitiesDetail',
            payload: {
                enterprise_id: eid,
                region_name: regionName,
                ability_id: abilityId,
            },
            callback: res => {
                if (res) {
                    const yamlData = yaml.dump(res.bean)
                    this.setState({
                        yamlData: yamlData,
                    })
                }
            }
        })
    }
    handleEdit = (value) => {
        this.setState({
            visible: true,
            abilityId: value.ability_id,
        }, () => {
            this.handleAbilitiesDetail()
        })
    }
    onClose = () => {
        this.setState({
            visible: false,
            yamlData: ''
        },()=>{
            this.handleAbilitiesList()
        })
    }
    handJsonTransitionYaml = (value) => {
        try {
            if(value){
                const jsonData = yaml.load(value)
                return jsonData
            }   
        } catch (e) {
            const errorInfo = e.message.indexOf("\n")
            const str = e.message.substring(0, errorInfo);
            notification.error({ message: str, duration: 30, top: 10 })
        }
    }
    handleSubmit = () => {
        const { form } = this.props;
        const { validateFields } = form;
        validateFields((err, values) => {
            if (!err) {
                const { dispatch, regionName } = this.props
                const { abilityId, yamlData } = this.state
                const eid = global.getCurrEnterpriseId();
                const jsonData = this.handJsonTransitionYaml(values.yaml)
                if(jsonData){
                    dispatch({
                        type: 'global/abilitiesDetail',
                        payload: {
                            enterprise_id: eid,
                            region_name: regionName,
                            ability_id: abilityId,
                        },
                        callback: res => {
                            if (res) {
                                const resourceVersion = res.bean && res.bean.metadata && res.bean.metadata.resourceVersion
                                jsonData.metadata.resourceVersion = resourceVersion
                                this.handleAbilitiesEdit(jsonData)
                            }
                        }
                    })
                }
            }
        });
    }
    render() {
        const { abilitiesList, yamlData, abilityId, loading } = this.state
        const columns = [
            {
                title: formatMessage({ id: 'extensionEnterprise.capacity.table.name' }),
                dataIndex: "name",
                rowKey: "name",
                width: "15%"
            },
            {
                title: 'apiVersions',
                dataIndex: "api_version",
                rowKey: "api_version",
                width: "15%"
            },
            {
                title: 'Kind',
                dataIndex: "kind",
                rowKey: "kind",
                width: "15%"
            },
            {
                title: formatMessage({ id: 'extensionEnterprise.capacity.table.operate' }),
                width: "15%",
                render: (val, index) => {
                    return (
                        <Button
                            onClick={() => {
                                this.handleEdit(index);
                            }}
                        >
                            {formatMessage({ id: 'extensionEnterprise.capacity.table.btn.edit' })}
                        </Button>
                    );
                }
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

                xs: { span: 24 },
                sm: { span: 24 }
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
                    dataSource={abilitiesList}
                    columns={columns}
                    loading={loading}
                    pagination={false}
                    rowKey="ability_id"
                    style={{ background: "#fff", marginTop: "20px" }}
                />
                <Drawer
                    title={formatMessage({ id: 'extensionEnterprise.capacity.table.btn.edit' })}
                    placement="right"
                    width="430"
                    onClose={this.onClose}
                    visible={this.state.visible}
                >
                    <Form {...formItemLayout} onSubmit={this.handleSubmit}>
                        <CodeMirrorForm
                            setFieldsValue={setFieldsValue}
                            Form={Form}
                            style={{ marginBottom: '20px' }}
                            getFieldDecorator={getFieldDecorator}
                            formItemLayout={formItemLayouts}
                            name={"yaml"}
                            message={formatMessage({ id: 'notification.hint.confiuration.editContent' })}
                            data={yamlData}
                            mode={'yaml'}
                            isAuto={true}
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
