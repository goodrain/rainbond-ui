import { connect } from 'dva';
import React, { PureComponent } from 'react';
import appProbeUtil from '../../../../utils/appProbe-util';
import { Button, Card, Form, Input, Row, Steps, Select, Collapse, Icon, Affix, Table, Col, Radio, Switch } from 'antd';
@connect(null, null, null, { withRef: true })
class Jiankang extends PureComponent {
    constructor(props) {
        super(props)

    }
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
                    </div>
                }
            >
                <div style={{ display: 'flex' }}>
                    <div style={{ width: '33%', textAlign: 'center' }}>
                        当前状态:{startProbe.status ? startProbe.status:"暂无状态"}
                    </div>
                    <div style={{ width: '33%', textAlign: 'center' }}>
                        检测方式:{startProbe.detection_method ? startProbe.detection_method : '未设置'}
                    </div>
                    <div style={{ width: '33%', textAlign: 'center' }}>
                        不健康处理方式:
                        {startProbe.unhealthy_handle_method ? startProbe.unhealthy_handle_method : "无"}
                    </div>
                </div>

            </Card>

        );
    }
}

export default Jiankang;
