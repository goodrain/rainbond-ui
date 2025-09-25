import React, { Component } from 'react';
import { connect } from 'dva';
import {
    Table,
    Card,
    Button,
    Row,
    Col,
    Form,
    Input,
    notification,
    Popconfirm,
    Tag,
    Tooltip,
    Modal,
    Select,
    InputNumber,
    Spin,
    Icon,
    Divider
} from 'antd';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { routerRedux } from 'dva/router';
import globalUtil from '../../utils/global';
import styles from './index.less';

const { Option } = Select;
const { TextArea } = Input;

@Form.create()
@connect()
export default class GatewayRouteLoadBalancer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            dataSource: [],
            tableLoading: true,
            pageSize: 10,
            page: 1,
            searchKey: '',
            modalVisible: false,
            editingRecord: null,
            modalLoading: false,
            type: 'add', // add 或 edit
            comList: [], // 组件列表
            serviceComponentLoading: true,
            portList: [],
            portLoading: false,
            token: null,
            portConfigs: [{ target_port: '', protocol: 'TCP' }], // 多端口配置
            pollingTimer: null // 轮询定时器
        };
    }

    componentDidMount() {
        this.getTableData();
        this.fetchInfo();
        this.startPolling();
    }

    componentWillUnmount() {
        // 清理轮询定时器
        this.stopPolling();
    }

    // 获取LoadBalancer列表数据
    getTableData = () => {
        this.setState({ tableLoading: true });
        const { dispatch, appID } = this.props;
        const { searchKey } = this.state;
        const teamName = globalUtil.getCurrTeamName();
        const region_name = globalUtil.getCurrRegionName();

        dispatch({
            type: 'gateWay/getLoadBalancerList',
            payload: {
                teamName,
                appID,
                region_name,
                service_name: searchKey || undefined
            },
            callback: (res) => {
                if (res && res.status_code === 200) {
                    const dataSource = res.list || [];
                    this.setState({
                        dataSource,
                        tableLoading: false
                    });
                    
                } else {
                    this.setState({ tableLoading: false });
                }
            },
            handleError: (res) => {
                notification.error({
                    message: formatMessage({ id: 'componentOverview.body.LoadBalancer.get_list_failed' }),
                    description: res.msg || formatMessage({ id: 'componentOverview.body.LoadBalancer.wait_data_update' })
                });
                this.setState({ tableLoading: false });
            }
        });
    };

    // 简化的轮询逻辑已移除，直接在componentDidMount启动轮询

    // 开始轮询
    startPolling = () => {
        if (this.state.pollingTimer) {
            clearInterval(this.state.pollingTimer);
        }
        
        const timer = setInterval(() => {
            this.getTableDataSilent();
        }, 2000); // 每2秒轮询一次
        
        this.setState({
            pollingTimer: timer
        });
    };

    // 停止轮询
    stopPolling = () => {
        if (this.state.pollingTimer) {
            clearInterval(this.state.pollingTimer);
            this.setState({
                pollingTimer: null
            });
        }
    };

    // 静默获取数据（不显示loading）
    getTableDataSilent = () => {
        const { dispatch, appID } = this.props;
        const { searchKey } = this.state;
        const teamName = globalUtil.getCurrTeamName();
        const region_name = globalUtil.getCurrRegionName();

        dispatch({
            type: 'gateWay/getLoadBalancerList',
            payload: {
                teamName,
                appID,
                region_name,
                service_name: searchKey || undefined
            },
            callback: (res) => {
                if (res && res.status_code === 200) {
                    const dataSource = res.list || [];
                    this.setState({ dataSource });
                }
            },
            handleError: () => {
                // 静默处理错误，不显示通知
            }
        });
    };

    // 获取访问令牌token
    fetchInfo = () => {
        const { dispatch } = this.props;
        const teamName = globalUtil.getCurrTeamName();
        dispatch({
            type: 'teamControl/fetchToken',
            payload: {
                team_name: teamName,
                tokenNode: 'spring'
            },
            callback: res => {
                if (res && res.status_code === 200) {
                    this.setState({
                        token: res.bean.access_key || false
                    }, () => {
                        this.fetchGetServiceAddress(res.bean.access_key);
                    });
                }
            }
        });
    };

    // 获取当前团队的服务地址列表
    fetchGetServiceAddress = (token) => {
        const { dispatch, appID } = this.props;
        const teamName = globalUtil.getCurrTeamName();
        const regionName = globalUtil.getCurrRegionName();
        dispatch({
            type: 'gateWay/fetchGetServiceAddress',
            payload: {
                team_name: teamName,
                region_name: regionName,
                token: token,
                appID
            },
            callback: res => {
                // 对comList进行service_alias去重处理
                const originalList = res.bean.ports || [];
                const uniqueComList = [];
                const seenServiceAlias = new Set();
                
                originalList.forEach(item => {
                    if (!seenServiceAlias.has(item.service_alias)) {
                        seenServiceAlias.add(item.service_alias);
                        uniqueComList.push(item);
                    }
                });
                this.setState({
                    comList: uniqueComList,
                    serviceComponentLoading: false
                });
            }
        });
    };

    // 获取端口列表
    handlePorts = (service_alias) => {
        this.setState({ portLoading: true });
        const { dispatch } = this.props;
        const { comList } = this.state;
        const team_name = globalUtil.getCurrTeamName();
        
        const service_obj = comList.filter(item => {
            return item.service_alias === service_alias;
        });
        
        const serviceAlias = service_obj && service_obj.length > 0 && service_obj[0].service_alias;
        
        if (!serviceAlias) {
            this.setState({ portLoading: false });
            notification.error({
                message: formatMessage({ id: 'componentOverview.body.LoadBalancer.get_ports_failed' }),
                description: formatMessage({ id: 'componentOverview.body.LoadBalancer.service_alias_empty' })
            });
            return;
        }
        
        dispatch({
            type: 'appControl/fetchPorts',
            payload: {
                app_alias: serviceAlias,
                team_name
            },
            callback: data => {
                const list = (data && data.list) || [];
                
                if (list.length > 0) {
                    this.setState({ 
                        portList: list,
                        portLoading: false
                    });
                } else {
                    notification.warning({
                        message: formatMessage({ id: 'componentOverview.body.LoadBalancer.no_available_ports' }),
                        description: formatMessage({ id: 'componentOverview.body.LoadBalancer.ensure_port_config' })
                    });
                    this.setState({ 
                        portList: [],
                        portLoading: false
                    });
                }
            },
            handleError: (error) => {
                this.setState({ portLoading: false });
                notification.error({
                    message: formatMessage({ id: 'componentOverview.body.LoadBalancer.get_ports_failed' }),
                    description: error.msg || formatMessage({ id: 'componentOverview.body.LoadBalancer.wait_data_update' })
                });
            }
        });
    };

    // 搜索
    handleSearch = (value) => {
        this.setState({
            searchKey: value,
            page: 1
        }, () => {
            this.getTableData();
        });
    };

    // 显示添加/编辑模态框
    showModal = (record = null) => {
        const portConfigs = record && record.ports ? 
            record.ports.map(port => ({
                target_port: port.target_port,
                protocol: port.protocol
            })) : 
            [{ target_port: '', protocol: 'TCP' }];

        this.setState({
            modalVisible: true,
            editingRecord: record,
            type: record ? 'edit' : 'add',
            portList: [],
            portLoading: false,
            portConfigs
        });
        // 如果是编辑模式且有服务信息，获取端口列表
        if (record && record.service_name) {
            const { comList } = this.state;
            const service_obj = comList.find(item => item.service_alias === record.service_name);
            if (service_obj) {
                this.handlePorts(service_obj.service_alias);
            }
        }
    };

    // 关闭模态框
    handleCancel = () => {
        this.setState({
            modalVisible: false,
            editingRecord: null,
            portList: [],
            portLoading: false,
            portConfigs: [{ target_port: '', protocol: 'TCP' }]
        });
        this.props.form.resetFields();
    };

    // 添加端口配置
    addPortConfig = () => {
        const { portConfigs, portList } = this.state;
        if (portConfigs.length >= 10) {
            notification.warning({
                message: formatMessage({ id: 'componentOverview.body.LoadBalancer.port_config_limit' }),
                description: formatMessage({ id: 'componentOverview.body.LoadBalancer.max_port_configs' })
            });
            return;
        }
        
        // 检查是否还有可用端口
        const availablePorts = (portList || []).filter(port => 
            port.inner_url !== '' && 
            !portConfigs.some(config => config.target_port === port.container_port)
        );
        
        if (availablePorts.length === 0 && portList.length > 0) {
            notification.warning({
                message: '无可用端口',
                description: '所有端口都已被选择，无法添加更多端口配置'
            });
            return;
        }
        
        this.setState({
            portConfigs: [...portConfigs, { target_port: '', protocol: 'TCP' }]
        });
    };

    // 删除端口配置
    removePortConfig = (index) => {
        const { portConfigs } = this.state;
        if (portConfigs.length <= 1) {
            notification.warning({
                message: formatMessage({ id: 'componentOverview.body.LoadBalancer.min_port_configs' })
            });
            return;
        }
        const newConfigs = portConfigs.filter((_, i) => i !== index);
        this.setState({ portConfigs: newConfigs });
    };

    // 更新端口配置
    updatePortConfig = (index, field, value) => {
        const { portConfigs, portList } = this.state;
        const newConfigs = [...portConfigs];
        
        if (field === 'target_port') {
            // 根据选择的端口自动设置协议
            const selectedPort = portList.find(port => port.container_port === value);
            if (selectedPort) {
                let protocol = 'TCP'; // 默认协议
                if (selectedPort.protocol) {
                    // 根据端口名称推断协议
                    const portName = selectedPort.port_alias ? selectedPort.port_alias.toLowerCase() : '';
                    if (portName === 'http' || portName === 'https') {
                        protocol = 'TCP';
                    } else if (portName === 'tcp') {
                        protocol = 'TCP';
                    } else if (portName === 'udp') {
                        protocol = 'UDP';
                    }
                }
                newConfigs[index] = { 
                    ...newConfigs[index], 
                    target_port: value,
                    protocol: protocol
                };
            } else {
                newConfigs[index] = { ...newConfigs[index], [field]: value };
            }
        } else {
            newConfigs[index] = { ...newConfigs[index], [field]: value };
        }
        
        this.setState({ portConfigs: newConfigs });
    };

    // 提交表单
    handleSubmit = (e) => {
        e.preventDefault();
        const { form, dispatch, appID } = this.props;
        const { editingRecord } = this.state;
        const teamName = globalUtil.getCurrTeamName();
        const region_name = globalUtil.getCurrRegionName();
        form.validateFields((err, values) => {
            if (!err) {
                const { portConfigs } = this.state;
                
                // 验证端口配置
                const validPorts = portConfigs.filter(config => config.target_port);
                if (validPorts.length === 0) {
                    notification.error({
                        message: formatMessage({ id: 'componentOverview.body.LoadBalancer.port_config_error' })
                    });
                    return;
                }

                this.setState({ modalLoading: true });

                // 处理annotations
                let annotations = {};                
                if (values.annotations) {
                    try {
                        annotations = JSON.parse(values.annotations);
                    } catch (error) {
                        notification.error({
                            message: formatMessage({ id: 'componentOverview.body.LoadBalancer.annotations_format_error' }),
                            description: formatMessage({ id: 'componentOverview.body.LoadBalancer.annotations_json_invalid' })
                        });
                        this.setState({ modalLoading: false });
                        return;
                    }
                }

                // 根据service_alias获取service_name
                const { comList } = this.state;
                const service_obj = comList.find(item => item.service_alias === values.service_alias);
                const service_name = service_obj ? service_obj.service_alias : values.service_name;

                // 构建端口配置
                const ports = validPorts.map((config, index) => ({
                    port: parseInt(config.target_port), // 使用目标端口作为监听端口
                    target_port: parseInt(config.target_port),
                    protocol: config.protocol,
                    name: `port-${config.target_port}`
                }));

                const payload = {
                    teamName,
                    appID,
                    service_name: service_name,
                    ports,
                    annotations,
                    region_name
                };                

                const action = editingRecord ? 'updateLoadBalancer' : 'createLoadBalancer';
                const actionText = editingRecord ? '更新' : '创建';

                if (editingRecord) {
                    payload.name = editingRecord.name;
                }
                
                dispatch({
                    type: `gateWay/${action}`,
                    payload,
                    callback: (res) => {
                        if (res && res.status_code === 200) {
                            notification.success({
                                message: actionText === '创建' ? formatMessage({ id: 'componentOverview.body.LoadBalancer.create_success' }) : formatMessage({ id: 'componentOverview.body.LoadBalancer.update_success' }),
                                description: formatMessage({ id: 'componentOverview.body.LoadBalancer.wait_data_update' })
                            });
                            this.handleCancel();
                            this.getTableData();
                            // 创建成功后立即开始轮询
                            setTimeout(() => {
                                this.startPolling();
                            }, 1000);
                        }
                        this.setState({ modalLoading: false });
                    },
                    handleError: (res) => {                      
                        notification.error({
                            message: actionText === '创建' ? formatMessage({ id: 'componentOverview.body.LoadBalancer.create_failed' }) : formatMessage({ id: 'componentOverview.body.LoadBalancer.update_failed' }),
                            description: res.data.msg || null
                        });
                        this.setState({ modalLoading: false });
                    }
                });
            }
        });
    };

    // 处理IP点击事件
    handleIPClick = (ip) => {        
        // 在新标签页中打开
        window.open(ip, '_blank');
        
    };

    // 删除LoadBalancer
    handleDelete = (record) => {
        const { dispatch } = this.props;
        const teamName = globalUtil.getCurrTeamName();
        const region_name = globalUtil.getCurrRegionName();
        dispatch({
            type: 'gateWay/deleteLoadBalancer',
            payload: {
                teamName,
                name: record.name,
                region_name,
            },
            callback: (res) => {
                if (res && res.status_code === 200) {
                    notification.success({
                        message: formatMessage({ id: 'componentOverview.body.LoadBalancer.delete_success' }),
                        description: formatMessage({ id: 'componentOverview.body.LoadBalancer.wait_data_update' })
                    });
                    this.getTableData();
                }
            },
            handleError: (res) => {
                notification.error({
                    message: formatMessage({ id: 'componentOverview.body.LoadBalancer.delete_failed' }),
                    description: res.msg || formatMessage({ id: 'componentOverview.body.LoadBalancer.wait_data_update' })
                });
            }
        });
    };

    // 渲染状态标签
    renderStatus = (status) => {
        const statusConfig = {
            'Ready': { color: 'green', text: formatMessage({ id: 'componentOverview.body.LoadBalancer.ready' }) },
            'Creating': { color: 'blue', text: formatMessage({ id: 'componentOverview.body.LoadBalancer.creating' }) },
            'Pending': { color: 'orange', text: formatMessage({ id: 'componentOverview.body.LoadBalancer.pending' }) },
            'Error': { color: 'red', text: formatMessage({ id: 'componentOverview.body.LoadBalancer.error' }) }
        };
        const config = statusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
    };

    render() {
        const { form,             
          permission: {
          isCreate,
          isDelete,
          isEdit
      } } = this.props;
        const { getFieldDecorator } = form;
        const {
            dataSource,
            tableLoading,
            searchKey,
            modalVisible,
            editingRecord,
            modalLoading,
            type,
            comList,
            serviceComponentLoading,
            portList,
            portLoading,
            portConfigs
        } = this.state;

        const columns = [
            {
                title: formatMessage({ id: 'componentOverview.body.LoadBalancer.backend_service' }),
                dataIndex: 'service_name',
                key: 'service_name'
            },
            {
                title: formatMessage({ id: 'componentOverview.body.LoadBalancer.port_config' }),
                dataIndex: 'ports',
                key: 'ports',
                render: (ports) => (
                    <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                        {ports && ports.length > 0 ? (
                            ports.map((port, index) => (
                                <Tag key={index} color="blue" style={{ alignSelf: 'flex-start' }}>
                                    {port.target_port} ({port.protocol})
                                </Tag>
                            ))
                        ) : (
                            <Tag color="default">{formatMessage({ id: 'componentOverview.body.LoadBalancer.no_port_config' })}</Tag>
                        )}
                    </div>
                )
            },
            {
                title: formatMessage({ id: 'componentOverview.body.LoadBalancer.external_ip' }),
                dataIndex: 'access_urls',
                key: 'access_urls',
                render: (ips, record) => (
                    <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                        {ips && ips.length > 0 ? (
                            ips.map((ip, index) => (
                                <Tag 
                                    key={index} 
                                    color="blue"
                                    style={{ 
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        userSelect: 'none',
                                        alignSelf: 'flex-start'
                                    }}
                                    onClick={() => this.handleIPClick(ip)}
                                    onMouseEnter={(e) => {
                                        e.target.style.transform = 'scale(1.05)';
                                        e.target.style.opacity = '0.8';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.transform = 'scale(1)';
                                        e.target.style.opacity = '1';
                                    }}
                                    title="点击访问此IP地址"
                                >
                                    {ip}
                                </Tag>
                            ))
                        ) : (
                            <Tag 
                                color="orange" 
                                style={{ 
                                    animation: record.status === 'Creating' || record.status === 'Pending' ? 'blink 1.5s infinite' : 'none',
                                    fontWeight: 'bold'
                                }}
                            >
                                <Icon type="loading" style={{ marginRight: 4 }} />
                                {formatMessage({ id: 'componentOverview.body.LoadBalancer.waiting_allocation' })}
                            </Tag>
                        )}
                    </div>
                )
            },
            {
                title: formatMessage({ id: 'componentOverview.body.LoadBalancer.status' }),
                dataIndex: 'status',
                key: 'status',
                render: this.renderStatus
            },
            {
                title: formatMessage({ id: 'componentOverview.body.LoadBalancer.create_time' }),
                dataIndex: 'created_at',
                key: 'created_at',
                render: (text) => text ? new Date(text).toLocaleString() : '-'
            },
            {
                title: formatMessage({ id: 'componentOverview.body.LoadBalancer.operation' }),
                key: 'action',
                render: (text, record) => (
                    <div>
                        {isEdit  && (
                            <Button 
                                type="link" 
                                size="small" 
                                onClick={() => this.showModal(record)}
                                style={{ padding: 0, marginRight: 8 }}
                            >
                                {formatMessage({ id: 'componentOverview.body.LoadBalancer.edit' })}
                            </Button>
                        )}
                        {isDelete && (
                            <Popconfirm
                                title={formatMessage({ id: 'componentOverview.body.LoadBalancer.confirm_delete' })}
                                onConfirm={() => this.handleDelete(record)}
                                okText={formatMessage({ id: 'componentOverview.body.Ports.determine' })}
                                cancelText={formatMessage({ id: 'componentOverview.body.Ports.cancel' })}
                            >
                                <Button type="link" size="small" style={{ color: '#ff4d4f', padding: 0 }}>
                                    {formatMessage({ id: 'componentOverview.body.LoadBalancer.delete' })}
                                </Button>
                            </Popconfirm>
                        )}
                    </div>
                )
            }
        ];

        return (
            <div className={styles.container}>
                <Card>
                    <Row style={{ marginBottom: 16 }}>
                        <Col span={12}>
                            <Input.Search
                                placeholder={formatMessage({ id: 'componentOverview.body.LoadBalancer.search' })}
                                value={searchKey}
                                onChange={(e) => this.setState({ searchKey: e.target.value })}
                                onSearch={this.handleSearch}
                                style={{ width: 300 }}
                            />
                        </Col>
                        <Col span={12} style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <Button
                                type="link"
                                icon="question-circle"
                                onClick={() => window.open('https://www.rainbond.com/docs/how-to-guides/app-ops/gateway', '_blank')}
                                style={{ marginRight: 8, padding: '4px 8px' }}
                            >
                                {formatMessage({ id: 'componentOverview.body.LoadBalancer.documentation' })}
                            </Button>
                            {isCreate && (
                                <Button
                                    type="primary"
                                    onClick={() => this.showModal()}
                                >
                                    {formatMessage({ id: 'componentOverview.body.LoadBalancer.create' })}
                                </Button>
                            )}
                        </Col>
                    </Row>

                    <Table
                        columns={columns}
                        dataSource={dataSource}
                        loading={tableLoading}
                        rowKey="name"
                        pagination={{
                            pageSize: this.state.pageSize,
                            current: this.state.page,
                            total: dataSource.length,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total) => formatMessage({ id: 'componentOverview.body.LoadBalancer.total_records' }, { total })
                        }}
                    />
                </Card>

                <Modal
                    title={type === 'add' ? formatMessage({ id: 'componentOverview.body.LoadBalancer.create' }) : formatMessage({ id: 'componentOverview.body.LoadBalancer.edit' })}
                    visible={modalVisible}
                    onCancel={this.handleCancel}
                    footer={[
                        <Button key="cancel" onClick={this.handleCancel}>
                            {formatMessage({ id: 'componentOverview.body.Ports.cancel' })}
                        </Button>,
                        <Button
                            key="submit"
                            type="primary"
                            loading={modalLoading}
                            onClick={this.handleSubmit}
                        >
                            {type === 'add' ? formatMessage({ id: 'componentOverview.body.LoadBalancer.create' }) : formatMessage({ id: 'componentOverview.body.LoadBalancer.update' })}
                        </Button>
                    ]}
                    width={600}
                >
                    <Spin spinning={modalLoading}>
                        <Form layout="vertical">
                            <Form.Item label={formatMessage({ id: 'componentOverview.body.LoadBalancer.backend_service' })}>
                                {getFieldDecorator('service_alias', {
                                    rules: [
                                        { required: true, message: formatMessage({ id: 'componentOverview.body.LoadBalancer.select_backend_service' }) }
                                    ],
                                    initialValue: editingRecord ? 
                                        comList.find(item => item.service_alias === editingRecord.service_name)?.service_alias : 
                                        undefined
                                })(
                                    <Select
                                        placeholder={formatMessage({ id: 'componentOverview.body.LoadBalancer.select_backend_service' })}
                                        disabled={type === 'edit' || serviceComponentLoading}
                                        loading={serviceComponentLoading}
                                        onChange={(service_alias) => {
                                            this.handlePorts(service_alias);
                                            // 重置端口配置
                                            this.setState({
                                                portConfigs: [{ target_port: '', protocol: 'TCP' }]
                                            });
                                        }}
                                        showSearch
                                        filterOption={(input, option) =>
                                            option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                        }
                                    >
                                        {(comList || []).map((service, index) => (
                                            <Option value={service.service_alias} key={index}>
                                               {formatMessage({ id: 'componentOverview.body.LoadBalancer.component_name' })}：{service.component_name} ({service.service_alias})
                                            </Option>
                                        ))}
                                    </Select>
                                )}
                            </Form.Item>

                            <Form.Item label={formatMessage({ id: 'componentOverview.body.LoadBalancer.port_config' })}>
                                <div style={{ marginBottom: 16 }}>
                                    {(() => {
                                        // 计算可用端口数量
                                        const availablePorts = (portList || []).filter(port => 
                                            port.inner_url !== '' && 
                                            !portConfigs.some(config => config.target_port === port.container_port)
                                        );
                                        const isDisabled = availablePorts.length === 0 || portConfigs.length >= 10;
                                        
                                        return (
                                            <Button 
                                                type="dashed" 
                                                onClick={this.addPortConfig}
                                                icon="plus"
                                                style={{ width: '100%' }}
                                                disabled={isDisabled}
                                                title={
                                                    availablePorts.length === 0 && portList.length > 0 
                                                        ? '所有端口都已被选择' 
                                                        : portConfigs.length >= 10 
                                                        ? '最多支持10个端口配置' 
                                                        : ''
                                                }
                                            >
                                                {formatMessage({ id: 'componentOverview.body.LoadBalancer.add_port_config' })}
                                                {availablePorts.length > 0 && portList.length > 0 && (
                                                    <span style={{ marginLeft: 8, color: '#1890ff' }}>
                                                        (还可添加 {availablePorts.length} 个)
                                                    </span>
                                                )}
                                            </Button>
                                        );
                                    })()}
                                </div>
                                {portConfigs.map((config, index) => (
                                    <div key={index} style={{ 
                                        border: '1px solid #d9d9d9', 
                                        borderRadius: 6, 
                                        padding: 16, 
                                        marginBottom: 16,
                                        position: 'relative'
                                    }}>
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item label={formatMessage({ id: 'componentOverview.body.LoadBalancer.target_port' })} style={{ marginBottom: 16 }}>
                                                    <Select
                                                        placeholder={formatMessage({ id: 'componentOverview.body.LoadBalancer.select_port' })}
                                                        value={config.target_port}
                                                        onChange={(value) => this.updatePortConfig(index, 'target_port', value)}
                                                        disabled={portList.length === 0}
                                                        loading={portLoading}
                                                        showSearch
                                                    >
                                                        {(portList || []).map((port, portIndex) => {
                                                            if (port.inner_url !== '') {
                                                                // 检查当前端口是否已被其他配置选择
                                                                const isSelected = portConfigs.some((otherConfig, otherIndex) => 
                                                                    otherIndex !== index && 
                                                                    otherConfig.target_port === port.container_port
                                                                );
                                                                
                                                                return (
                                                                    <Option 
                                                                        value={port.container_port} 
                                                                        key={portIndex}
                                                                        disabled={isSelected}
                                                                        style={isSelected ? { color: '#ccc', backgroundColor: '#f5f5f5' } : {}}
                                                                    >
                                                                        {port.container_port} ({port.protocol})
                                                                        {isSelected && <span style={{ color: '#ff7875', marginLeft: 8 }}>已选择</span>}
                                                                    </Option>
                                                                );
                                                            }
                                                            return null;
                                                        })}
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item label={formatMessage({ id: 'componentOverview.body.LoadBalancer.protocol' })} style={{ marginBottom: 16 }}>
                                                    <Input
                                                        value={config.protocol}
                                                        disabled
                                                        placeholder={formatMessage({ id: 'componentOverview.body.LoadBalancer.auto_set_protocol' })}
                                                        style={{ backgroundColor: '#f5f5f5' }}
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        {portConfigs.length > 1 && (
                                            <Button
                                                type="link"
                                                icon="delete"
                                                onClick={() => this.removePortConfig(index)}
                                                style={{
                                                    position: 'absolute',
                                                    top: 8,
                                                    right: 8,
                                                    color: '#ff4d4f'
                                                }}
                                            >
                                                {formatMessage({ id: 'componentOverview.body.LoadBalancer.delete_port_config' })}
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </Form.Item>

                            <Form.Item label={formatMessage({ id: 'componentOverview.body.LoadBalancer.annotations_config' })}>
                                {getFieldDecorator('annotations', {
                                    initialValue: editingRecord?.annotations ? 
                                        JSON.stringify(editingRecord.annotations, null, 2) : 
                                        '{\n  "service.beta.kubernetes.io/aws-load-balancer-type": "nlb"\n}'
                                })(
                                    <TextArea
                                        placeholder={formatMessage({ id: 'componentOverview.body.LoadBalancer.annotations_placeholder' })}
                                        rows={6}
                                    />
                                )}
                            </Form.Item>
                        </Form>
                    </Spin>
                </Modal>
            </div>
        );
    }
}
