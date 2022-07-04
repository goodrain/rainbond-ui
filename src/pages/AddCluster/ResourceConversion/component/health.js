import { connect } from 'dva';
import React, { PureComponent } from 'react';
import appProbeUtil from '../../../../utils/appProbe-util';
import appStatusUtil from '../../../../utils/appStatus-util';
import globalUtil from '../../../../utils/global';
import { Button, Card, Form, Input, Row, Steps, Select, Collapse, Icon, Affix, Table, Col, Radio, Switch } from 'antd';
@connect(null, null, null, { withRef: true })
class Jiankang extends PureComponent {
    constructor(props) {
        super(props)
        this.state = {
            editStartHealth: null,
        }
    }
    handleStartProbeStart = isUsed => {
        const { startProbe } = this.props;
        const { dispatch } = this.props
        dispatch({
            type: 'appControl/editStartProbe',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                app_alias: this.props.startProbe.appAlias,
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
    handleState = data => {
        if (appProbeUtil.isStartProbeUsed(data)) {
            if (appProbeUtil.isStartProbeStart(data)) {
                return '已启用';
            }
            return '已禁用';
        }
        return '未设置';
    };
    render() {
        const {startProbe} =this.props
        return (
            <Card
                style={{
                    marginBottom: 24
                }}
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        健康检测

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

                    </div>
                }
            >

                <div style={{ display: 'flex' }}>
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

            </Card>

        );
    }
}

export default Jiankang;
