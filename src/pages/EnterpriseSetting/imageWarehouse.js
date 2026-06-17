import { Card, notification, Table, Button } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import AddOrEditImageRegistry from '../../components/AddOrEditImageRegistry';
import ConfirmModal from '../../components/ConfirmModal';

@connect(({ teamControl, loading, user }) => ({
    regions: teamControl.regions,
    currentTeam: teamControl.currentTeam,
    toMoveTeamLoading: loading.effects['teamControl/moveTeam'],
    currentUser: user.currentUser,
}))
export default class ImageWarehouse extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            showAddMember: false,
            toDeleteImageHub: null,
            editData: null,
            page: 1,
            pageSize: 8,
            total: 0,
            imageList: [],
            imageHubLoading: false,
            clusters: []
        };
    }
    componentDidMount() {
        this.loadClusters()
        this.getImageHub()
    }
    isEnterpriseMode = () => this.props.mode === 'enterprise';
    getEnterpriseId = () => {
        const { currentUser, enterpriseId } = this.props;
        return enterpriseId || (currentUser && currentUser.enterprise_id);
    };
    getActionType = action => {
        const prefix = this.isEnterpriseMode() ? 'Enterprise' : 'Platform';
        return `global/${action}${prefix}ImageHub`;
    };
    // 获取数据
    getImageHub = () => {
        const { dispatch } = this.props
        dispatch({
            type: this.getActionType('fetch'),
            payload: this.isEnterpriseMode() ? { enterprise_id: this.getEnterpriseId() } : {},
            callback: data => {
                if (data) {
                    const list = data.list || [];
                    this.setState({
                        imageList: list,
                        total: list.length
                    });
                }
            }
        })
    }
    // 添加仓库
    handleAddImageHub = values => {
        const { dispatch } = this.props
        dispatch({
            type: this.getActionType('add'),
            payload: {
                enterprise_id: this.getEnterpriseId(),
                secret_id: values.secret_id,
                domain: values.domain,
                username: values.username,
                password: values.password,
                hub_type: values.hub_type
            },
            callback: res => {
                if (res && res.response_data && res.response_data.code == 200) {
                    notification.success({
                        message: formatMessage({ id: 'notification.success.add' })
                    })
                    this.getImageHub()
                }
                this.setState({
                    showAddMember: false,
                    imageHubLoading: false
                })
            }
        })
    };
    // 修改仓库
    handleEditImageHub = data => {
        const { editData } = this.state
        const { dispatch } = this.props
        dispatch({
            type: this.getActionType('update'),
            payload: {
                enterprise_id: this.getEnterpriseId(),
                secret_id: editData.secret_id,
                domain: editData.domain,
                username: data.username,
                password: data.password,
                hub_type: data.hub_type
            },
            callback: res => {
                if (res && res.response_data && res.response_data.code == 200) {
                    notification.success({
                        message: formatMessage({ id: 'notification.success.change' })
                    })
                    this.getImageHub()
                }
                this.setState({
                    editData: null,
                    showAddMember: false,
                    imageHubLoading: false
                })
            }
        })
    };
    // 删除仓库
    handleDelImageHub = () => {
        const { toDeleteImageHub } = this.state
        const { dispatch } = this.props
        dispatch({
            type: this.getActionType('delete'),
            payload: {
                enterprise_id: this.getEnterpriseId(),
                secret_id: toDeleteImageHub.secret_id
            },
            callback: res => {
                if (res && res.response_data && res.response_data.code == 200) {
                    notification.success({
                        message: formatMessage({ id: 'notification.success.delete' })
                    })
                    this.getImageHub()
                }
                this.setState({
                    toDeleteImageHub: null,
                })
            }
        })
    };
    loadClusters = () => {
        const {
            dispatch,
            currentUser
        } = this.props;
        dispatch({
            type: 'region/fetchEnterpriseClusters',
            payload: {
                enterprise_id: currentUser?.enterprise_id
            },
            callback: res => {
                if (res && res.list) {
                    const clusters = [];
                    res.list.map((item, index) => {
                        item.key = `cluster${index}`;
                        clusters.push(item);
                        return item;
                    });
                    this.setState({ clusters });
                } else {
                    this.setState({ clusters: [] });
                }
            }
        });
    };

    onSubmite = (value) => {
        const { editData } = this.state
        this.setState({ imageHubLoading: true })
        if (editData) {
            this.handleEditImageHub(value)
        } else {
            this.handleAddImageHub(value)
        }
    };
    handleEditModel = (data) => {
        this.setState({ showAddMember: true, editData: data });
    };
    handleOpenModel = () => {
        this.setState({ showAddMember: true });
    };
    handleCancelModel = () => {
        this.setState({ showAddMember: false, editData: null });
    };
    handleDelImageHubModel = (data) => {
        this.setState({ toDeleteImageHub: data });
    };
    handleCancelDelImageHubModel = () => {
        this.setState({ toDeleteImageHub: null });
    };

    render() {
        const { mode } = this.props;
        const enterpriseMode = this.isEnterpriseMode();
        const {
            page,
            pageSize,
            total,
            showAddMember,
            members,
            editData,
            toDeleteImageHub,
            toMoveTeam,
            imageList,
            imageHubLoading,
            clusters
        } = this.state;
        const columns = [
            {
                title: formatMessage({ id: 'confirmModal.common.image.lable.name' }),
                dataIndex: 'secret_id',
                key: "secret_id",
                align: 'center'

            },
            {
                title: formatMessage({ id: 'teamManage.tabs.image.table.imageAddress' }),
                dataIndex: 'domain',
                key: "domain",
                align: 'center'

            },
            {
                title: formatMessage({ id: 'teamManage.tabs.image.table.user' }),
                dataIndex: 'username',
                key: "username",
                align: 'center'
            },
            ...(!enterpriseMode ? [{
                title: formatMessage({ id: 'teamManage.tabs.image.table.scope' }),
                dataIndex: 'scope',
                key: "scope",
                align: 'center',
                render: text => (
                    <span>{text === 'enterprise' ? formatMessage({ id: 'teamManage.tabs.image.scope.enterprise' }) : formatMessage({ id: 'teamManage.tabs.image.scope.user' })}</span>
                )
            }] : []),
            {
                title: formatMessage({ id: 'teamManage.tabs.image.table.password' }),
                dataIndex: 'password',
                key: "password",
                align: 'center',
                render: text => {
                    const num = text ? text.length : 6;
                    let str = '';
                    for (let index = 0; index <= num - 1; index++) {
                        str += "*";
                    }
                    return <span>{str}</span>
                }
            },
            {
                title: formatMessage({ id: 'teamManage.tabs.image.table.operate' }),
                dataIndex: 'action',
                key: "action",
                align: 'center',
                render: (_, data) => {
                    if (!enterpriseMode && data.scope === 'enterprise') {
                        return <span>{formatMessage({ id: 'teamManage.tabs.image.scope.enterprise' })}</span>;
                    }
                    return (
                        <div>
                            <a
                                style={{
                                    marginLeft: 6,
                                }}
                                onClick={() => { this.handleEditModel(data) }}
                            >
                                {formatMessage({ id: 'teamManage.tabs.image.table.btn.edit' })}
                            </a>
                            <a
                                onClick={() => this.handleDelImageHubModel(data)}
                            >
                                {formatMessage({ id: 'teamManage.tabs.image.table.btn.delete' })}
                            </a>
                        </div>
                    );
                },
            },
        ];

        return (
            <div>
                <Card
                    extra={<Button
                        type="primary"
                        onClick={this.handleOpenModel}
                        icon="plus"
                    >
                        {formatMessage({ id: 'confirmModal.add.common.image.title' })}
                    </Button>}
                >
                    <Table
                        rowKey={(record, index) => index}
                        pagination={{
                            current: page,
                            pageSize: pageSize,
                            total: total,
                            showTotal: (total) => `共 ${total} 条`,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            pageSizeOptions: ['8', '16', '24', '32'],
                            onChange: (page, pageSize) => {
                                this.setState({ page, pageSize });
                            },
                            onShowSizeChange: (page, pageSize) => {
                                this.setState({ page: 1, pageSize });
                            }
                        }}
                        dataSource={imageList}
                        columns={columns}
                    />

                </Card>
                {showAddMember && (
                    <AddOrEditImageRegistry
                        loading={imageHubLoading}
                        clusters={clusters}
                        imageList={imageList}
                        data={editData}
                        onOk={this.onSubmite}
                        onCancel={this.handleCancelModel}
                    />
                )}
                {toDeleteImageHub && (
                    <ConfirmModal
                        onOk={this.handleDelImageHub}
                        title={formatMessage({ id: 'confirmModal.image_warehouse.delete.title' })}
                        subDesc={formatMessage({ id: 'confirmModal.delete.strategy.subDesc' })}
                        desc={formatMessage({ id: 'confirmModal.delete.image_warehouse.desc' })}
                        onCancel={this.handleCancelDelImageHubModel}
                    />
                )}
            </div>
        );
    }
}
