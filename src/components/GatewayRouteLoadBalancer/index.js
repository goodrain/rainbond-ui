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
            portConfigs: [{ target_port: '', protocol: 'TCP', port: '' }], // 多端口配置
            pollingTimer: null, // 轮询定时器
            deletingRecords: new Map() // 删除状态管理：Map<recordName, {loading: boolean, timeout: timeoutId}>
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
        // 清理所有删除超时定时器
        this.state.deletingRecords.forEach(record => {
            if (record.timeout) {
                clearTimeout(record.timeout);
            }
        });
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
        const { searchKey, deletingRecords } = this.state;
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
                    let newState = { dataSource };
                    
                    // 检查所有正在删除的记录是否还存在
                    if (deletingRecords.size > 0) {
                        const newDeletingRecords = new Map(deletingRecords);
                        let hasChanges = false;
                        
                        deletingRecords.forEach((deleteInfo, recordName) => {
                            const recordStillExists = dataSource.some(item => item.name === recordName);
                            // 如果记录不存在了，说明删除成功，清除删除loading状态
                            if (!recordStillExists) {
                                // 清理超时定时器
                                if (deleteInfo.timeout) {
                                    clearTimeout(deleteInfo.timeout);
                                }
                                newDeletingRecords.delete(recordName);
                                hasChanges = true;
                            }
                        });
                        
                        if (hasChanges) {
                            newState.deletingRecords = newDeletingRecords;
                        }
                    }
                    
                    this.setState(newState);
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
                protocol: port.protocol,
                port: port.port || ''
            })) : 
            [{ target_port: '', protocol: 'TCP', port: '' }];

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
            portConfigs: [{ target_port: '', protocol: 'TCP', port: '' }]
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
            portConfigs: [...portConfigs, { target_port: '', protocol: 'TCP', port: '' }]
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

    // 验证对外端口
    validateExternalPort = (port, index) => {
        const restrictedPorts = [80, 443, 8443, 7070, 8889, 6060, 7080, 10250, 9180];
        const { portConfigs } = this.state;
        const newConfigs = [...portConfigs];
        
        // 清除之前的错误
        if (newConfigs[index]) {
            delete newConfigs[index].portError;
        }
        
        if (port) {
            const portNumber = parseInt(port);
            
            // 检查是否为限制端口
            if (restrictedPorts.includes(portNumber)) {
                newConfigs[index] = {
                    ...newConfigs[index],
                    portError: `端口 ${portNumber} 为系统保留端口，不允许使用`
                };
            }
            // 检查是否与其他配置重复
            else if (portConfigs.some((config, configIndex) => 
                configIndex !== index && config.port === portNumber
            )) {
                newConfigs[index] = {
                    ...newConfigs[index],
                    portError: `端口 ${portNumber} 已被其他配置使用`
                };
            }
        }
        
        this.setState({ portConfigs: newConfigs });
    };

    // 生成可用的对外端口
    generateAvailableExternalPort = (targetPort) => {
        const restrictedPorts = [80, 443, 8443, 7070, 8889, 6060, 7080, 10250, 9180];
        const { portConfigs } = this.state;
        
        // 获取已使用的端口列表
        const usedPorts = portConfigs
            .map(config => config.port)
            .filter(port => port && !isNaN(port))
            .map(port => parseInt(port));
        
        // 生成候选端口列表，优先使用与目标端口相同的端口
        const candidates = [];
        
        // 第一选择：与目标端口相同
        if (targetPort) {
            candidates.push(parseInt(targetPort));
        }
        
        // 第二选择：目标端口+1000的范围内
        if (targetPort) {
            const basePort = parseInt(targetPort);
            for (let i = 1; i <= 1000; i++) {
                candidates.push(basePort + i);
            }
        }
        
        // 第三选择：常用端口范围
        for (let port = 8000; port <= 9999; port++) {
            candidates.push(port);
        }
        
        // 第四选择：更大范围的端口
        for (let port = 10000; port <= 65535; port++) {
            candidates.push(port);
        }
        
        // 查找第一个可用的端口
        for (const port of candidates) {
            if (port >= 1 && port <= 65535 && 
                !restrictedPorts.includes(port) && 
                !usedPorts.includes(port)) {
                return port;
            }
        }
        
        return null; // 如果找不到可用端口
    };

    // 更新端口配置
    updatePortConfig = (index, field, value) => {
        const { portConfigs, portList } = this.state;
        const newConfigs = [...portConfigs];
        
        if (field === 'target_port') {
            // 根据选择的端口自动设置协议和对外端口
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
                
                // 自动生成对外端口
                const suggestedExternalPort = this.generateAvailableExternalPort(value);
                
                newConfigs[index] = { 
                    ...newConfigs[index], 
                    target_port: value,
                    protocol: protocol,
                    port: suggestedExternalPort || '' // 如果找不到可用端口，留空让用户手动输入
                };
                
                // 清除之前的端口错误
                delete newConfigs[index].portError;
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
                const validPorts = portConfigs.filter(config => config.target_port && config.port);
                if (validPorts.length === 0) {
                    notification.error({
                        message: '端口配置错误',
                        description: '请至少配置一个完整的端口映射（目标端口和对外端口都必须填写）'
                    });
                    return;
                }

                // 检查是否有端口验证错误
                const hasPortError = portConfigs.some(config => config.portError);
                if (hasPortError) {
                    notification.error({
                        message: '端口配置错误',
                        description: '请修复端口配置中的错误后再提交'
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
                    port: parseInt(config.port), // 对外端口
                    target_port: parseInt(config.target_port), // 目标端口
                    protocol: config.protocol,
                    name: `port-${config.port}`
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
        const recordName = record.name;
        
        // 如果该记录已经在删除中，直接返回
        if (this.state.deletingRecords.has(recordName)) {
            return;
        }
        
        // 设置删除loading状态和超时机制
        const timeout = setTimeout(() => {
            // 15秒后强制清除该记录的删除loading状态
            this.setState(prevState => {
                const newDeletingRecords = new Map(prevState.deletingRecords);
                newDeletingRecords.delete(recordName);
                return { deletingRecords: newDeletingRecords };
            });
            notification.warning({
                message: '删除超时',
                description: `记录 ${recordName} 删除操作可能仍在进行中，请稍后手动刷新页面确认`
            });
        }, 15000);
        
        // 添加删除状态
        this.setState(prevState => {
            const newDeletingRecords = new Map(prevState.deletingRecords);
            newDeletingRecords.set(recordName, {
                loading: true,
                timeout: timeout
            });
            return { deletingRecords: newDeletingRecords };
        });
        
        dispatch({
            type: 'gateWay/deleteLoadBalancer',
            payload: {
                teamName,
                name: recordName,
                region_name,
            },
            callback: (res) => {
                if (res && res.status_code === 200) {
                    notification.success({
                        message: formatMessage({ id: 'componentOverview.body.LoadBalancer.delete_success' }),
                        description: formatMessage({ id: 'componentOverview.body.LoadBalancer.wait_data_update' })
                    });
                    // 删除成功后不立即刷新，让轮询机制检测删除结果
                    // 轮询会在检测到记录不存在时自动清除loading状态
                } else {
                    // 删除失败时立即清除该记录的loading状态
                    this.clearDeleteState(recordName);
                }
            },
            handleError: (res) => {
                notification.error({
                    message: formatMessage({ id: 'componentOverview.body.LoadBalancer.delete_failed' }),
                    description: res.msg || formatMessage({ id: 'componentOverview.body.LoadBalancer.wait_data_update' })
                });
                // 删除失败时立即清除该记录的loading状态
                this.clearDeleteState(recordName);
            }
        });
    };

    // 清除指定记录的删除状态
    clearDeleteState = (recordName) => {
        this.setState(prevState => {
            const newDeletingRecords = new Map(prevState.deletingRecords);
            const record = newDeletingRecords.get(recordName);
            if (record && record.timeout) {
                clearTimeout(record.timeout);
            }
            newDeletingRecords.delete(recordName);
            return { deletingRecords: newDeletingRecords };
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

    // 判断LoadBalancer是否可以操作（编辑/删除）
    isLoadBalancerOperatable = (record) => {
        // 如果正在删除中，不可操作
        if (this.state.deletingRecords.has(record.name)) {
            return false;
        }
        
        // 如果状态是分配中（Creating、Pending等），不可操作
        const nonOperatableStates = ['Creating', 'Pending'];
        if (nonOperatableStates.includes(record.status)) {
            return false;
        }
        
        return true;
    };
    handleServiceNameClick = (service_name) => {
      const {comList}=this.state;
      const service_obj = comList.find(item => item.service_alias === service_name);
      console.log(service_obj,"service_obj");
      return service_obj ? `${service_obj.component_name} (${service_obj.service_alias})` : service_name;
      // return service_obj ? `${service_obj.component_name} (${service_obj.service_alias})` : '';
    };
    handleClick = (service_name) => {
      if(service_name){
        this.props.dispatch(routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${globalUtil.getAppID()}/overview?type=components&componentID=${service_name}&tab=overview`));
      }
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
            portConfigs,
            deletingRecords
        } = this.state;

        const columns = [
            {
                title: formatMessage({ id: 'componentOverview.body.LoadBalancer.backend_service' }),
                dataIndex: 'service_name',
                key: 'service_name',
                render: (text, record) => (
                    <Tag color="blue" onClick={() => this.handleClick(text)} style={{cursor:'pointer'}}>
                      {this.handleServiceNameClick(text)}
                    </Tag>
                )
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
                                    style={{ alignSelf: 'flex-start' }}
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
                title: formatMessage({ id: 'componentOverview.body.LoadBalancer.operation' }),
                key: 'action',
                render: (text, record) => (
                    <div>
                        {isEdit  && (
                            <Button 
                                type="link" 
                                size="small" 
                                onClick={() => this.showModal(record)}
                                style={{ 
                                    padding: 0, 
                                    marginRight: 8,
                                    color: this.isLoadBalancerOperatable(record) ? undefined : '#ccc'
                                }}
                                disabled={!this.isLoadBalancerOperatable(record)}
                                title={!this.isLoadBalancerOperatable(record) ? 
                                    (deletingRecords.has(record.name) ? '正在删除中，无法编辑' : 'LoadBalancer分配中，无法编辑') : 
                                    undefined
                                }
                            >
                                {formatMessage({ id: 'componentOverview.body.LoadBalancer.edit' })}
                            </Button>
                        )}
                        {isDelete && (
                            <>
                                {deletingRecords.has(record.name) ? (
                                    // 删除loading状态时显示禁用的按钮
                                    <Button
                                        type="link"
                                        size="small"
                                        style={{ color: '#ccc', padding: 0 }}
                                        disabled={true}
                                    >
                                        {formatMessage({ id: 'componentOverview.body.LoadBalancer.delete' })}
                                        <Icon type="loading" style={{ marginLeft: 4 }} />
                                    </Button>
                                ) : (
                                    // 显示带确认框的删除按钮
                                    <Popconfirm
                                        title={formatMessage({ id: 'componentOverview.body.LoadBalancer.confirm_delete' })}
                                        onConfirm={() => this.handleDelete(record)}
                                        okText={formatMessage({ id: 'componentOverview.body.Ports.determine' })}
                                        cancelText={formatMessage({ id: 'componentOverview.body.Ports.cancel' })}
                                    >
                                        <Button
                                            type="link"
                                            size="small"
                                            style={{ color: '#ff4d4f', padding: 0 }}
                                        >
                                            {formatMessage({ id: 'componentOverview.body.LoadBalancer.delete' })}
                                        </Button>
                                    </Popconfirm>
                                )}
                            </>
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
                                portConfigs: [{ target_port: '', protocol: 'TCP', port: '' }]
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
                                        // 获取当前选择的服务
                                        const currentServiceAlias = form.getFieldValue('service_alias');
                                        const hasSelectedService = currentServiceAlias && currentServiceAlias !== undefined;
                                        
                                        // 计算可用端口数量
                                        const availablePorts = (portList || []).filter(port => 
                                            port.inner_url !== '' && 
                                            !portConfigs.some(config => config.target_port === port.container_port)
                                        );
                                        const isDisabled = !hasSelectedService || availablePorts.length === 0 || portConfigs.length >= 10;
                                        
                                        let tooltipTitle = '';
                                        if (!hasSelectedService) {
                                            tooltipTitle = '请先选择后端服务';
                                        } else if (availablePorts.length === 0 && portList.length > 0) {
                                            tooltipTitle = '所有端口都已被选择';
                                        } else if (portConfigs.length >= 10) {
                                            tooltipTitle = '最多支持10个端口配置';
                                        }
                                        
                                        return (
                                            <Button 
                                                type="dashed" 
                                                onClick={this.addPortConfig}
                                                icon="plus"
                                                style={{ width: '100%' }}
                                                disabled={isDisabled}
                                                title={tooltipTitle}
                                            >
                                                {formatMessage({ id: 'componentOverview.body.LoadBalancer.add_port_config' })}
                                                {hasSelectedService && availablePorts.length > 0 && portList.length > 0 && (
                                                    <span style={{ marginLeft: 8, color: '#1890ff' }}>
                                                        (还可添加 {availablePorts.length} 个)
                                                    </span>
                                                )}
                                            </Button>
                                        );
                                    })()}
                                </div>
                                {portConfigs.map((config, index) => {
                                    // 获取当前选择的服务状态
                                    const currentServiceAlias = form.getFieldValue('service_alias');
                                    const hasSelectedService = currentServiceAlias && currentServiceAlias !== undefined;
                                    const isPortConfigDisabled = !hasSelectedService;
                                    
                                    return (
                                        <div key={index} style={{ 
                                            border: '1px solid #d9d9d9', 
                                            borderRadius: 6, 
                                            padding: 16, 
                                            marginBottom: 16,
                                            position: 'relative',
                                            backgroundColor: isPortConfigDisabled ? '#f5f5f5' : 'transparent',
                                            opacity: isPortConfigDisabled ? 0.6 : 1
                                        }}>
                                            <Row gutter={16}>
                                                <Col span={8}>
                                                    <Form.Item label={formatMessage({ id: 'componentOverview.body.LoadBalancer.target_port' })} style={{ marginBottom: 16 }}>
                                                        <Select
                                                            placeholder={isPortConfigDisabled ? '请先选择后端服务' : formatMessage({ id: 'componentOverview.body.LoadBalancer.select_port' })}
                                                            value={config.target_port}
                                                            onChange={(value) => this.updatePortConfig(index, 'target_port', value)}
                                                            disabled={isPortConfigDisabled || portList.length === 0}
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
                                                <Col span={8}>
                                                    <Form.Item label="对外端口" style={{ marginBottom: 16 }}>
                                                        <InputNumber
                                                            placeholder={isPortConfigDisabled ? '请先选择后端服务' : '请输入对外端口'}
                                                            value={config.port}
                                                            onChange={(value) => this.updatePortConfig(index, 'port', value)}
                                                            min={1}
                                                            max={65535}
                                                            style={{ width: '100%' }}
                                                            onBlur={(e) => this.validateExternalPort(e.target.value, index)}
                                                            disabled={isPortConfigDisabled}
                                                        />
                                                        {config.portError && !isPortConfigDisabled && (
                                                            <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>
                                                                {config.portError}
                                                            </div>
                                                        )}
                                                    </Form.Item>
                                                </Col>
                                                <Col span={8}>
                                                    <Form.Item label={formatMessage({ id: 'componentOverview.body.LoadBalancer.protocol' })} style={{ marginBottom: 16 }}>
                                                        <Input
                                                            value={config.protocol}
                                                            disabled
                                                            placeholder={isPortConfigDisabled ? '请先选择后端服务' : formatMessage({ id: 'componentOverview.body.LoadBalancer.auto_set_protocol' })}
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
                                                    disabled={isPortConfigDisabled}
                                                    style={{
                                                        position: 'absolute',
                                                        top: 8,
                                                        right: 8,
                                                        color: isPortConfigDisabled ? '#ccc' : '#ff4d4f'
                                                    }}
                                                >
                                                    {formatMessage({ id: 'componentOverview.body.LoadBalancer.delete_port_config' })}
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </Form.Item>

                            <Form.Item label={formatMessage({ id: 'componentOverview.body.LoadBalancer.annotations_config' })}>
                                {getFieldDecorator('annotations', {
                                    initialValue: editingRecord?.annotations ? 
                                        JSON.stringify(editingRecord.annotations, null, 2) : null
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
