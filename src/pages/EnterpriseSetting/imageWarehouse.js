import { Card, notification, Table, Row, Col, Button } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import globalUtil from '../../utils/global';
import AddOrEditImageRegistry from '../../components/AddOrEditImageRegistry';
import EditAdmin from '../../components/EditAdmin';
import ConfirmModal from '../../components/ConfirmModal';
import ScrollerX from '../../components/ScrollerX';
import TeamMemberTable from '../../components/TeamImageTable';

@connect(({ teamControl, loading }) => ({
    regions: teamControl.regions,
    currentTeam: teamControl.currentTeam,
    toMoveTeamLoading: loading.effects['teamControl/moveTeam'],
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
            imageHubLoading: false
        };
    }
    componentDidMount() {
        this.getImageHub()
    }
    // 获取数据
    getImageHub = () => {
        const { dispatch } = this.props
        dispatch({
            type: 'global/fetchPlatformImageHub',
            payload: {
                team_name: globalUtil.getCurrTeamName()
            },
            callback: data => {
                if (data) {
                    this.setState({
                        imageList: data.list
                    });
                }
            }
        })
    }
    // 添加仓库
    handleAddImageHub = values => {
        const { dispatch } = this.props
        dispatch({
            type: 'global/addPlatformImageHub',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                secret_id: values.secret_id,
                domain: values.domain,
                username: values.username,
                password: values.password
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
            type: 'global/updatePlatformImageHub',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                secret_id: editData.secret_id,
                username: data.username,
                password: data.password
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
            type: 'global/deletePlatformImageHub',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
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
    onSubmite = (value) => {
        const { editData } = this.state
        this.setState({ imageHubLoading: true  })
        if(editData){
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
        const {
            currentTeam,
            memberPermissions,
            toMoveTeamLoading,
        } = this.props;
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
            imageHubLoading
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
            {
                title: formatMessage({ id: 'teamManage.tabs.image.table.password' }),
                dataIndex: 'password',
                key: "password",
                align: 'center',
                render: (text, data) => {
                    let num = text.length
                    let str = ''
                    for (let index = 0; index <= num - 1; index++) {
                        str += "*"
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
                    return (
                        <div>
                            <a
                                style={{
                                    marginLeft: 6,
                                }}
                                onClick={() => {this.handleEditModel(data)}}
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
                <Row
                    style={{
                        padding: '10px 0',
                        marginBottom: 10,
                    }}
                >
                    <Col span={4} offset={20} style={{ textAlign: 'right', marginRight: 10, }}>
                        <Button
                            type="primary"
                            onClick={this.handleOpenModel}
                        >
                            {formatMessage({ id: 'confirmModal.add.common.image.title' })}
                        </Button>
                    </Col>
                </Row>
                <Table rowKey={(record,index) => index} pagination={imageList.length > 8 ? pagination : false} dataSource={imageList} columns={columns} />
                {showAddMember && (
                    <AddOrEditImageRegistry
                        loading={imageHubLoading}
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
