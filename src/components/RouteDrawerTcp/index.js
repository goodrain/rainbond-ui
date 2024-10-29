import React, { Fragment, PureComponent, Component } from 'react';
import { connect } from 'dva';
import { Drawer, Form, Button, Col, Row, Input, Select, DatePicker, Icon, Skeleton, Spin, Radio, Switch } from 'antd';
import globalUtil from '../../utils/global';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import ServiceInput from '../ServiceInput';
import styles from './index.less';
import DAinput from '../DAinput';
import DAHosts from '../DAHosts'
import NewHeader from '../NewHeader'
const { Option } = Select;
@Form.create()

@connect(({ user, global, loading, teamControl, enterprise }) => ({
    currUser: user.currentUser,
    groups: global.groups,
    currentTeam: teamControl.currentTeam,
    currentEnterprise: enterprise.currentEnterprise,
}))

export default class index extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isPerform: true,
            serviceComponentLoading: true,
            portLoading: false,
            dataList: [],
            loading: true,
            page_num: 1,
            page_size: 10,
            total: '',
            http_search: '',
            groupSelect: 'k8s',
            showServiceMore: false,
            showMateMore: false,
            selsectRewrite: 'rewrite',
            comList: [],
            serviceList: [],
            serviceLoading: true
        };
    }
    componentWillMount() {
        const { editInfo } = this.props
        this.fetchInfo()
    }
    extractPreviousCharacters = (inputString) => {
        const pattern = /([^:]+):/;
        const match = inputString.match(pattern);
        return match ? match[1] : '';
    }
    extractAfterColon = (inputString) => {
        const pattern = /:(.+)/;
        const match = inputString.match(pattern);
        return match ? match[1] : '';
    }
    onClose = () => {
        this.props.onClose({}, "add")
    }
    handleSubmit = e => {
        const { editInfo } = this.props
        e.preventDefault();
        this.props.form.validateFieldsAndScroll((err, values) => {
            if (!err) {
                const data = {}
                data.protocol= "TCP"
                data.match = {
                    host: values.host,
                    ingressPort: Number(values.ingressPort)
                }
                data.backend = {
                    serviceName: this.extractPreviousCharacters(values.service_id),
                    servicePort: Number(this.extractAfterColon(values.service_id)),
                }
                this.props.onOk(data)
            }
        });
    };
    // 获取访问令牌token
    fetchInfo = () => {
        const { dispatch } = this.props
        const teamName = globalUtil.getCurrTeamName()
        dispatch({
            type: 'teamControl/fetchToken',
            payload: {
                team_name: teamName,
                tokenNode: 'spring'
            },
            callback: res => {
                if (res && res.status_code == 200) {
                    this.setState({
                        token: res.bean.access_key || false
                    }, () => {
                        this.fetchGetServiceAddress(res.bean.access_key)
                    })
                }
            }
        })
    }
    // 获取当前团队的命名空间
    fetchGetServiceAddress = (token) => {
        const { dispatch, appID } = this.props
        const teamName = globalUtil.getCurrTeamName()
        const regionName = globalUtil.getCurrRegionName()
        dispatch({
            type: 'gateWay/fetchGetServiceAddress',
            payload: {
                team_name: teamName,
                region_name: regionName,
                token: token,
                appID
            },
            callback: res => {
                this.setState({
                    comList: res.bean.ports,
                    serviceComponentLoading: false
                })
            }
        })
    }

    handleService = (data, type) => {
        return 
    }

    render() {
        const { getFieldDecorator } = this.props.form;
        const {
            visible,
            groups,
            editInfo,
            appID
        } = this.props;
        const {
            serviceComponentList,
            serviceComponentLoading,
            portList,
            componentLoading,
            portLoading,
            groupSelect,
            showServiceMore,
            showMateMore,
            selsectRewrite,
            comList,
            serviceLoading,
            serviceList
        } = this.state
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
        const MethodOptions = [
            { label: 'GET', value: 'GET' },
            { label: 'POST', value: 'POST' },
            { label: 'PUT', value: 'PUT' },
            { label: 'DELETE', value: 'DELETE' },
            { label: 'OPTIONS', value: 'OPTIONS' },
            { label: 'HEAD', value: 'HEAD' },
            { label: 'PATCH', value: 'PATCH' },
            { label: 'TRACE', value: 'TRACE' },
        ];
        return (
            <Drawer
                title={editInfo ? formatMessage({id:'teamNewGateway.NewGateway.TCP.edit'}) : formatMessage({id:'teamNewGateway.NewGateway.TCP.add'})}
                width={700}
                onClose={this.onClose}
                visible={visible}
                bodyStyle={{ paddingBottom: 80 }}
            >
                <Form hideRequiredMark onSubmit={this.handleSubmit}>
                    <Row>
                        <Col span={12}>
                        </Col>
                        <Col span={12}>
                        </Col>
                    </Row>
                    <Form.Item {...formItemLayout} label={formatMessage({id:'teamNewGateway.NewGateway.TCP.port'})}>
                        {getFieldDecorator('ingressPort', {
                            rules: [
                                { required: true, message: formatMessage({id:'teamNewGateway.NewGateway.TCP.inputPort'}) },
                                { pattern: /^3[0-1][0-9]{3}$|^32000$/, message: '端口范围 30000-32000之间'  }
                            ],
                            initialValue: (editInfo && editInfo.nodePort) || []
                        })(<Input placeholder={formatMessage({id:'teamNewGateway.NewGateway.TCP.inputPort'})} type='number'/>)}
                    </Form.Item>
                    < Skeleton loading={serviceComponentLoading} active >
                        <Form.Item {...formItemLayout} label={formatMessage({ id: 'popover.access_strategy.lable.component' })}>
                            {getFieldDecorator('service_id', {
                                rules: [{ required: true, message: formatMessage({ id: 'placeholder.select' }) }],
                                initialValue: (Object.keys(editInfo).length  ? `${editInfo.name}:${editInfo.port}` : undefined)
                            })(<Select
                                placeholder={formatMessage({id:'teamNewGateway.NewGateway.TCP.selectService'})}
                                allowClear
                            >
                                {
                                    comList && comList.map((item, index) => {
                                        const { component_name, port, service_name } = item;
                                        if (service_name != null) {
                                            return (
                                                <Option
                                                    value={`${service_name}:${port}`}
                                                    key={index + service_name}
                                                >
                                                    <span>
                                                        {formatMessage({id:'teamNewGateway.NewGateway.TCP.name'})}
                                                        {service_name}
                                                        <span style={{ color: 'rgb(0 0 0 / 31%)' }}>
                                                            ({component_name})
                                                        </span>{' '}
                                                        {formatMessage({id:'teamNewGateway.NewGateway.TCP.ports'})}
                                                        {port}
                                                    </span>
                                                </Option>
                                            );
                                        }
                                    })

                                }

                            </Select>
                            )}
                        </Form.Item>
                    </Skeleton>

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
                    {formatMessage({id:'popover.cancel'})}
                    </Button>
                    <Button type="primary" onClick={this.handleSubmit}>
                    {formatMessage({id:'popover.confirm'})}
                    </Button>
                </div>
            </Drawer>
        )
    }
}
