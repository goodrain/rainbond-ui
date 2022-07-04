import {
    Card,
    Form,
    Radio,
} from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import AddPort from '../../components/AddPort';
import ConfirmModal from '../../components/ConfirmModal';
import EditPortAlias from '../../components/EditPortAlias';
import Port from '../../components/Port';
import {
    addMnt,
    batchAddRelationedApp,
    getMnt,
    getRelationedApp,
    removeRelationedApp
} from '../../services/app';
import appUtil from '../../utils/app';
import globalUtil from '../../utils/global';
import roleUtil from '../../utils/role';
import { getVolumeTypeShowName } from '../../utils/utils';
import CodeBuildConfig from '../CodeBuildConfig';
import styles from '../AppCreateSetting/setting.less';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

@connect(null, null, null, { withRef: true })
@Form.create()

// 端口
// eslint-disable-next-line react/no-multi-comp
@connect(null, null, null, { withRef: true })
class Ports extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            showEditAlias: null,
            showDeleteDomain: null,
            showDeletePort: null,
            showDeleteDomain: null,
            showAddPort: false,
            ports: []
        };
    }
    componentDidMount() {
        this.fetchPorts();
    }
    //端口
    fetchPorts = () => {
        const { dispatch } = this.props;
        dispatch({
            type: 'appControl/fetchPorts',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                app_alias: this.props.appDetail.service.service_alias
            },
            callback: data => {
                this.setState({
                    ports: (data && data.list) || []
                });
            }
        });
    };
    //端口
    handleSubmitProtocol = (protocol, port, callback) => {
        const { dispatch } = this.props;
        dispatch({
            type: 'appControl/changeProtocol',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                app_alias: this.props.appDetail.service.service_alias,
                port,
                protocol
            },
            callback: () => {
                this.fetchPorts();
                callback();
            }
        });
    };
    //端口
    showEditAlias = port => {
        this.setState({ showEditAlias: port });
    };
    //端口
    hideEditAlias = () => {
        this.setState({ showEditAlias: null });
    };
    //端口
    handleEditAlias = vals => {
        this.props.dispatch({
            type: 'appControl/editPortAlias',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                app_alias: this.props.appDetail.service.service_alias,
                port: this.state.showEditAlias.container_port,
                port_alias: vals.alias
            },
            callback: () => {
                this.fetchPorts();
                this.hideEditAlias();
            }
        });
    };
    //端口
    handleOpenInner = port => {
        this.props.dispatch({
            type: 'appControl/openPortInner',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                app_alias: this.props.appDetail.service.service_alias,
                port
            },
            callback: () => {
                this.fetchPorts();
            }
        });
    };
    //端口
    onCloseInner = port => {
        this.props.dispatch({
            type: 'appControl/closePortInner',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                app_alias: this.props.appDetail.service.service_alias,
                port
            },
            callback: () => {
                this.fetchPorts();
            }
        });
    };
    //端口
    handleOpenOuter = port => {
        this.props.dispatch({
            type: 'appControl/openPortOuter',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                app_alias: this.props.appDetail.service.service_alias,
                port
            },
            callback: () => {
                this.fetchPorts();
            }
        });
    };
    //端口
    onCloseOuter = port => {
        this.props.dispatch({
            type: 'appControl/closePortOuter',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                app_alias: this.props.appDetail.service.service_alias,
                port
            },
            callback: () => {
                this.fetchPorts();
            }
        });
    };
    //端口
    handleDeletePort = port => {
        this.setState({ showDeletePort: port });
    };
    //端口
    cancalDeletePort = () => {
        this.setState({ showDeletePort: null });
    };
    //端口
    handleSubmitDeletePort = () => {
        this.props.dispatch({
            type: 'appControl/deletePort',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                app_alias: this.props.appDetail.service.service_alias,
                port: this.state.showDeletePort
            },
            callback: () => {
                this.cancalDeletePort();
                this.fetchPorts();
            }
        });
    };
    //端口
    showAddPort = () => {
        this.setState({ showAddPort: true });
    };

    //端口
    onCancelAddPort = () => {
        this.setState({ showAddPort: false });
    };
    //端口
    handleAddPort = val => {
        this.props.dispatch({
            type: 'appControl/addPort',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                app_alias: this.props.appDetail.service.service_alias,
                protocol: val.protocol,
                port: val.port
            },
            callback: () => {
                this.onCancelAddPort();
                this.fetchPorts();
            }
        });
    };
    render() {
        const ports = this.state.ports || [];
        const isImageApp = appUtil.isImageApp(this.props.appDetail);
        const isDockerfile = appUtil.isDockerfile(this.props.appDetail);
        return (
            <Card
                title="端口管理"
                style={{
                    marginBottom: "40px"
                }}
            >
                <div className={styles.ports}>
                    {ports.map(port => {
                        return (
                            <Port
                                style={{
                                    marginBottom: "0", padding: "0"
                                }}
                                key={port.ID}
                                showOuterUrl={false}
                                showDomain={false}
                                port={port}
                                onDelete={this.handleDeletePort}
                                onEditAlias={this.showEditAlias}
                                onSubmitProtocol={this.handleSubmitProtocol}
                                onOpenInner={this.handleOpenInner}
                                onCloseInner={this.onCloseInner}
                                onOpenOuter={this.handleOpenOuter}
                                onCloseOuter={this.onCloseOuter}
                            />
                        );
                    })}
                    {!ports.length ? (
                        <p
                            style={{
                                textAlign: 'center'
                            }}
                        >
                            暂无端口
                        </p>
                    ) : (
                        ''
                    )}
                </div>
                <div
                    style={{
                        textAlign: 'right',
                        paddingTop: 20
                    }}
                >
                    {/* <Button type="default" onClick={this.showAddPort}>
                        <Icon type="plus" />
                        添加端口
                    </Button> */}
                </div>
                {this.state.showEditAlias && (
                    <EditPortAlias
                        port={this.state.showEditAlias}
                        onOk={this.handleEditAlias}
                        onCancel={this.hideEditAlias}
                    />
                )}
                {this.state.showDeletePort && (
                    <ConfirmModal
                        title="端口删除"
                        desc="确定要删除此端口吗？"
                        subDesc="此操作不可恢复"
                        onOk={this.handleSubmitDeletePort}
                        onCancel={this.cancalDeletePort}
                    />
                )}
                {this.state.showDeleteDomain && (
                    <ConfirmModal
                        title="域名解绑"
                        desc="确定要解绑此域名吗？"
                        subDesc={this.state.showDeleteDomain.domain}
                        onOk={this.handleSubmitDeleteDomain}
                        onCancel={this.cancalDeleteDomain}
                    />
                )}
                {this.state.showAddPort && (
                    <AddPort
                        isImageApp={isImageApp}
                        isDockerfile={isDockerfile}
                        onCancel={this.onCancelAddPort}
                        onOk={this.handleAddPort}
                    />
                )}
            </Card>
        );
    }
}
// eslint-disable-next-line react/no-multi-comp
@connect(null, null, null, { withRef: true })
class RenderProperty extends PureComponent {
    render() {
        //通过RenderProperty传入的值
        const {
            appDetail,
            visible,
            componentPermissions: { isEnv, isRely, isStorage, isPort }
        } = this.props;
        console.log("this.props")
        console.log(this.props)
        console.log(appDetail)
        return (
            <div
                style={{
                    display: visible ? 'block' : 'none'
                }}
            >
                {isPort && <Ports appDetail={appDetail} />}
            </div>
        );
    }
}
// eslint-disable-next-line react/no-multi-comp
@connect(
    ({ teamControl }) => ({
        currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
    }),
    null,
    null,
    {
        withRef: true
    }
)
export default class Index extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            componentPermissions: this.handlePermissions('queryComponentInfo'),
            type: 'property'
        };
    }

    handlePermissions = type => {
        const { currentTeamPermissionsInfo } = this.props;
        return roleUtil.querySpecifiedPermissionsInfo(
            currentTeamPermissionsInfo,
            type
        );
    };
    render() {
        //接上层传递的数据
        const { appDetail } = this.props;
        console.log("端口页面appDetail=")
        console.log(appDetail)
        const { type, componentPermissions } = this.state;

        return (
            <div>
                <div
                    style={{
                        overflow: 'hidden'
                    }}
                >

                    <div
                        className={styles.content}
                        style={{
                            overflow: 'hidden',
                            marginBottom: 90
                        }}
                    >
                        <RenderProperty
                            key={appDetail.service.extend_method}
                            appDetail={appDetail}
                            visible={type !== 'deploy'}
                            componentPermissions={componentPermissions}
                        />
                    </div>
                </div>
            </div>
        );
    }
}
