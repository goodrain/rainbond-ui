import React, { Component } from 'react'
import { connect } from 'dva';
import {
    Row,
    Col,
    Button,
    Card,
    Table,
    Skeleton,
    Modal,
    Upload,
    Form,
    Input,
    Icon,
    Tabs,
    Popconfirm,
    notification
} from 'antd';
import globalUtil from '../../utils/global'
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import styles from './index.less'
@connect(({ region }) => ({
    cluster_info: region.cluster_info,
}))
@Form.create()

export default class upload extends Component {
    constructor(props) {
        super(props);
        this.state = {
            languageArr: [
                { key: 'openJDK', value: 'JDK' },
                { key: 'golang', value: 'Golang' },
                { key: 'node', value: 'Node' },
                { key: 'web_compiler', value: 'JavaServer' },
                { key: 'web_runtime', value: 'WebRuntime' },
                { key: 'maven', value: 'Maven' },
                { key: 'python', value: 'Python' },
                { key: 'net_compiler', value: '.NetSDK' },
                { key: 'net_runtime', value: '.NetRuntime' },
                { key: 'php', value: 'PHP' },
            ],
            activeKey: "openJDK",
            tableLoading: false,
            modalVisible: false,
            clusterUrl: '',
            tableList: [],
            fileList: [],
            fileInfo: {},
        };
    }
    componentDidMount() {
        if (this.props.cluster_info.length > 0) {
            this.setState({
                regionID: this.props.cluster_info[0].region_id
            }, () => {
                this.fetchPakeVs()
                this.loadPutCluster()
            })
        }
    }
    handleOk = (e) => {
        e.preventDefault();
        const { form, dispatch } = this.props;
        const { fileInfo, regionID } = this.state
        form.validateFields((err, values) => {
            if (!err) {
                if (Object.keys(fileInfo).length || values.lang === 'net_runtime' || values.lang === 'net_compiler') 
                values.event_id = fileInfo.event_id || ''
                dispatch({
                    type: 'global/uploadLanguageFile',
                    payload: {
                        enterprise_id: globalUtil.getCurrEnterpriseId(),
                        region_id: regionID,
                        lang: values.lang,
                        version: values.version,
                        event_id: values.event_id || '',
                        file_name: values.file_name || ''
                    },
                    callback: res => {
                        if (res) {
                            notification.success({ message: formatMessage({ id: 'notification.success.succeeded' }) });
                            this.setState({
                                modalVisible: false
                            }, () => {
                                this.fetchPakeVs()
                            })
                        }
                    },
                    handleError: err => {
                        this.setState({
                            tableList: [],
                            tableLoading: false
                        })
                    }
                });
            

            }
        });
    }
    handleCancel = () => {
        this.setState({
            modalVisible: false
        })
    }
    tabsChange = (key) => {
        this.setState({
            activeKey: 'golang',
            regionID: key
        }, () => {
            this.fetchPakeVs()
        })
    }
    loadPutCluster = () => {
        const {
            dispatch,
        } = this.props;
        const { regionID } = this.state;
        dispatch({
            type: 'region/fetchEnterpriseCluster',
            payload: {
                enterprise_id: globalUtil.getCurrEnterpriseId(),
                region_id: regionID
            },
            callback: res => {
                if (res && res.status_code === 200) {
                    const wsAddress = res.bean.wsurl
                    const httpAddress = wsAddress.replace(/^ws:/, 'http:');
                    this.setState({
                        clusterUrl: httpAddress
                    })
                }
            }
        });
    };
    //获取对应语言的包版本
    fetchPakeVs = (region_id) => {
        this.setState({
            tableLoading: true
        })
        const { activeKey, clusterUrl, regionID } = this.state
        const { dispatch } = this.props
        dispatch({
            type: 'global/fetchLanguageVersion',
            payload: {
                enterprise_id: globalUtil.getCurrEnterpriseId(),
                region_id: region_id || regionID,
                language: activeKey
            },
            callback: res => {
                if (res)
                    this.setState({
                        tableList: res.list,
                        tableLoading: false
                    })
            },
            handleError: err => {
                this.setState({
                    tableList: [],
                    tableLoading: false
                })
            }
        });
    }
    setDefault = (vs) => {
        const { activeKey, regionID } = this.state
        const { dispatch } = this.props
        dispatch({
            type: 'global/editLanguageDefault',
            payload: {
                enterprise_id: globalUtil.getCurrEnterpriseId(),
                region_id: regionID,
                lang: activeKey,
                version: vs
            },
            callback: res => {
                if (res && res.status_code === 200)
                    notification.success({ message: formatMessage({ id: 'notification.success.succeeded' }) });
                this.fetchPakeVs()
            },
            handleError: err => {
                this.setState({
                    tableList: [],
                    tableLoading: false
                })
            }
        });
    }
    confirm = (row) => {
        const { dispatch } = this.props;
        const { regionID } = this.state
        dispatch({
            type: 'global/deleteLanguageFile',
            payload: {
                enterprise_id: globalUtil.getCurrEnterpriseId(),
                region_id: regionID,
                lang: row.lang,
                version: row.version,
            },
            callback: res => {
                if (res && res.status_code === 200) {
                    this.fetchPakeVs()
                    notification.success({ message: '删除成功' });
                }
            },
            handleError: err => {
                notification.error({ message: '操作失败' });
                this.setState({
                    tableList: [],
                    tableLoading: false
                })
            }
        });
    }
    onChangeUpload = info => {
        let { fileList } = info;
        fileList = fileList.filter(file => {
            if (file.response) {
                notification.success({ message: '上传成功' });
                this.setState({
                    fileInfo: file.response.bean
                })
                return file.response.msg === 'success';
            }
            return true;
        });
        if (info && info.event && info.event.percent) {
            this.setState({
                percents: info.event.percent
            });
        }

        const { status } = info.file;
        if (status === 'done') {
            this.setState({
                percents: false
            });
        }
        this.setState({ fileList });
    };

    render() {
        const { form } = this.props;
        const { languageArr, activeKey, tableLoading, modalVisible, tableList, fileList, fileInfo } = this.state;
        const { getFieldDecorator } = form
        const columns = [
            {
                title: '版本',
                dataIndex: 'version',
                key: 'version',
                align: 'center',
                with: '30%'
            },
            {
                title: '文件名',
                dataIndex: 'file_name',
                key: 'file_name',
                align: 'center',
                with: '30%',
                render: i => (
                    <span> {i || '-'}</span>
                )
            },
            {
                title: '操作',
                dataIndex: 'handle',
                key: 'handle',
                align: 'center',
                with: '40%',
                render: (item, row) => (
                    <>
                        <Button type="link" disabled={row.first_choice} onClick={() => this.setDefault(row.version)}>设为默认</Button>
                        <Popconfirm
                            title="你确定删除该版本吗？"
                            icon={<Icon type="question-circle-o" style={{ color: 'red' }} />}
                            onConfirm={() => this.confirm(row)}
                            okText="确定"
                            cancelText="取消"
                        >
                            {!row.system && !row.first_choice && <Button type="link">删除</Button>}
                        </Popconfirm>

                    </>
                )
            },
        ];
        const formItemLayout = {
            labelCol: {
                xs: { span: 24 },
                sm: { span: 6 }
            },
            wrapperCol: {
                xs: { span: 24 },
                sm: { span: 16 }
            }
        };
        const { cluster_info } = this.props;
        return (
            <>
                {cluster_info && cluster_info.length > 0 ? (
                    <Tabs onChange={this.tabsChange} className={styles.UploadtabsStyle}>
                        {cluster_info.map(item => {
                            return <Tabs.TabPane tab={item.region_alias} key={item.region_id}>
                            </Tabs.TabPane>
                        })}
                    </Tabs>
                ) : (
                    <div>请先选择集群</div>
                )}
                <Row type="flex">
                    <Col span={3} >
                        <div className={styles.leftBox}>
                            {languageArr.map(item => {
                                const { key, value } = item
                                return <div
                                    className={styles.languageBox}
                                    style={{ background: activeKey == key ? '#e6f7ff' : 'transparent' }}
                                    onClick={() => {
                                        this.setState({
                                            activeKey: key,
                                        }, () => {
                                            this.fetchPakeVs()
                                        })
                                    }}
                                >
                                    {value}
                                </div>
                            })}

                        </div>
                    </Col>
                    <Col span={21}>
                        <div className={styles.rightBox}>
                            <Row>
                                <Button
                                    type='primary'
                                    icon='plus'
                                    onClick={() => {
                                        this.setState({
                                            modalVisible: true
                                        })
                                    }}
                                >
                                    添加版本
                                </Button>
                            </Row>

                            <Skeleton
                                active
                                loading={tableLoading}
                                paragraph={{ rows: 6 }}
                            >
                                <Table dataSource={tableList} columns={columns} rowKey={row => row.ID} />
                            </Skeleton>
                        </div>
                    </Col>
                </Row>
                <Modal
                    title="语言包上传"
                    visible={modalVisible}
                    onOk={this.handleOk}
                    onCancel={this.handleCancel}
                >
                    <Form onSubmit={this.handleOk}>
                        <Form.Item label="语言类型" {...formItemLayout}>
                            {getFieldDecorator(`lang`, {
                                initialValue: activeKey,
                                rules: [
                                    {
                                        required: true,
                                        message: '请填写语言类型',
                                    },
                                ],
                            })(<Input placeholder="请填写语言类型" disabled={true} />)}
                        </Form.Item>
                        <Form.Item label={`版本号`} {...formItemLayout}>
                            {getFieldDecorator(`version`, {
                                rules: [
                                    {
                                        required: true,
                                        message: '请填写版本号',
                                    },
                                ],
                            })(<Input placeholder="请填写版本号" />)}
                        </Form.Item>


                        {(activeKey === 'net_runtime' || activeKey === 'net_compiler') ?
                            <Form.Item label="镜像地址" {...formItemLayout}>
                                {getFieldDecorator(`file_name`, {
                                    initialValue: '',
                                    rules: [
                                        {
                                            required: true,
                                            message: '请填写镜像地址',
                                        },
                                    ],
                                })(<Input placeholder="请填写镜像地址" />)}
                            </Form.Item>
                            :
                            <>
                                <Form.Item label="上传文件" {...formItemLayout}>
                                    {getFieldDecorator('file', {
                                    })(<Upload
                                        fileList={fileList}
                                        name="file"
                                        onChange={this.onChangeUpload}
                                        action={`${this.state.clusterUrl}/lg_pack_operate/upload`}
                                        multiple={true}
                                    >
                                        <Button>
                                            <Icon type="upload" />
                                            {formatMessage({ id: 'teamAdd.create.upload.uploadFiles' })}
                                        </Button>
                                    </Upload>
                                    )}
                                </Form.Item>
                                {Object.keys(fileInfo).length > 0 &&
                                    <Form.Item label="文件名" {...formItemLayout}>
                                        {getFieldDecorator(`file_name`, {
                                            initialValue: fileInfo.file_name,
                                            rules: [
                                                {
                                                    required: true,
                                                    message: '请填写文件名',
                                                },
                                            ],
                                        })(<Input placeholder="请填写文件名" disabled={true} />)}
                                    </Form.Item>
                                }
                            </>

                        }
                    </Form>
                </Modal>
            </>
        )
    }
}
