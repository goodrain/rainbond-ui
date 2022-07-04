import { Button, Card, Form, Select, Switch, Table } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import ScrollerX from '../ScrollerX';
import globalUtil from '../../utils/global';
import appProbeUtil from '../../utils/appProbe-util';
import EditHealthCheck from '../../pages/Component/setting/edit-health-check'

const EditableContext = React.createContext();

@connect(
    ({ user, appControl, teamControl }) => ({
        currUser: user.currentUser,
        startProbe: appControl.startProbe,
        runningProbe: appControl.runningProbe,
        ports: appControl.ports,
        baseInfo: appControl.baseInfo,
        // tags: appControl.tags,
        appDetail: appControl.appDetail,
        teamControl,
        appControl
    }),
    null,
    null,
    { withRef: true }
)

@Form.create()
class Index extends PureComponent {
    constructor(arge) {
        super(arge);
        this.state = {
            loading: false,
            startProbe: {
                ID: 1,
                cmd: "",
                failure_threshold: 3,
                http_header: "",
                initial_delay_second: 2,
                is_used: true,
                mode: "readiness",
                path: "",
                period_second: 3,
                port: 80,
                probe_id: "2406c2e9a97948458f4bff8f8aebbae3",
                scheme: "tcp",
                service_id: "4bc1a895f55a2e24178bfe9e90a718dd",
                success_threshold: 1,
                timeout_second: 20,
            },
            editStartHealth: null
        };
    }

    handleState = data => {
        if (appProbeUtil.isStartProbeUsed(data)) {
            if (appProbeUtil.isStartProbeStart(data)) {
                return '已启用';
            }
            return '已禁用';
        }
        return '未设置';
    };

    fetchStartProbe() {
        this.props.dispatch({
            type: 'appControl/fetchStartProbe',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                app_alias: this.props.appAlias
            }
        });
    }

    // 禁用/启用
    handleStartProbeStart = isUsed => {
        const { startProbe } = this.props;
        console.log("this.props")
        console.log(this.props)
        console.log(startProbe)
        this.props.dispatch({
            type: 'appControl/editStartProbe',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                app_alias: this.props.appAlias,
                ...startProbe,
                is_used: isUsed
            },
            callback: res => {
                if (res && res.status_code) {
                    if (res.status_code === 200) {
                        this.fetchStartProbe();
                        if (isUsed) {
                            notification.success({ message: '启用成功,请更新组件后生效' });
                        } else {
                            notification.success({ message: '禁用成功,请更新组件后生效' });
                        }
                    }
                }
            }
        });
    };
    // 编辑确定
    handleEditHealth = vals => {
        const { startProbe } = this.props;
        console.log("健康检测")
        console.log(vals)
        console.log(this.props);
        return;
        this.setState({
            loading: true
        });
        if (appProbeUtil.isStartProbeUsed(this.state.editStartHealth)) {
            this.props.dispatch({
                type: 'appControl/editStartProbe',
                payload: {
                    team_name: globalUtil.getCurrTeamName(),
                    app_alias: this.props.appAlias,
                    ...vals,
                    old_mode: startProbe.mode
                },
                callback: res => {
                    if (res && res.status_code && res.status_code === 200) {
                        this.onCancelEditStartProbe();
                        this.fetchStartProbe();
                        notification.success({ message: '编辑成功,请更新组件后生效!' });
                    }
                }
            });
        } else {
            this.props.dispatch({
                type: 'appControl/addStartProbe',
                payload: {
                    team_name: globalUtil.getCurrTeamName(),
                    app_alias: this.props.appAlias,
                    ...vals
                },
                callback: res => {
                    if (res && res.status_code && res.status_code === 200) {
                        this.onCancelEditStartProbe();
                        this.fetchStartProbe();
                        notification.success({ message: '添加成功' });
                        notification.info({ message: '需要更新后才能生效' });
                    }
                }
            });
        }
    };
    // 编辑取消
    onCancelEditStartProbe = () => {
        this.setState({ editStartHealth: null, loading: false });
    };

    render() {

        const { startProbe, ports, loading } = this.state;

        return (
            <div>
                <Card
                    style={{
                        marginBottom: 24,
                    }}
                    title={
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            健康检测
                            {startProbe && (
                                <div>
                                    <a
                                        onClick={() => {
                                            this.setState({ editStartHealth: startProbe });
                                        }}
                                        style={{
                                            marginRight: '5px',
                                            fontSize: '14px',
                                            fontWeight: 400
                                        }}
                                    >
                                        {JSON.stringify(startProbe) != '{}' ? '编辑' : '设置'}
                                    </a>

                                    {JSON.stringify(startProbe) != '{}' &&
                                        appProbeUtil.isStartProbeStart(startProbe) ? (
                                        <a
                                            onClick={() => {
                                                this.handleStartProbeStart(false);
                                            }}
                                            style={{ fontSize: '14px', fontWeight: 400 }}
                                        >
                                            禁用
                                        </a>
                                    ) : (
                                        JSON.stringify(startProbe) != '{}' && (
                                            <a
                                                onClick={() => {
                                                    this.handleStartProbeStart(true);
                                                }}
                                                style={{ fontSize: '14px', fontWeight: 400 }}
                                            >
                                                启用
                                            </a>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    }
                >
                    {startProbe && (
                        <div style={{ display: 'flex', alignItems: "center", minHeight: '70px' }}>
                            <div style={{ width: '33%', textAlign: 'center' }}>
                                当前状态:{this.handleState(startProbe)}
                            </div>
                            <div style={{ width: '33%', textAlign: 'center' }}>
                                检测方式:{startProbe.scheme ? startProbe.scheme : '未设置'}
                            </div>
                            <div style={{ width: '33%', textAlign: 'center' }}>
                                不健康处理方式:
                                {startProbe.mode === 'readiness'
                                    ? '下线'
                                    : startProbe.mode === 'liveness'
                                        ? '重启'
                                        : '未设置'}
                            </div>
                        </div>
                    )}
                    {/* 设置/编辑的页面 */}
                    {this.state.editStartHealth && (
                        <EditHealthCheck
                            ports={ports}
                            onOk={this.handleEditHealth}
                            title="健康检测"
                            data={this.state.editStartHealth}
                            onCancel={this.onCancelEditStartProbe}
                            loading={loading}
                        />
                    )}
                </Card>
            </div>
        );
    }
}

export default Index;
