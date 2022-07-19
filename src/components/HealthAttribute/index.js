import React, { PureComponent } from 'react';
import {Card, Empty} from 'antd';
class HealthAttribute extends PureComponent {
    constructor(props) {
        super(props)
    }
    render() {
        const { value } = this.props
        return (
            <Card
                style={{
                    marginBottom: 24
                }}
                title="健康监测"
            >
                {value && Object.keys(value).length > 0 ? (
                    <div style={{ display: 'flex' }}>
                        <div style={{ width: '33%', textAlign: 'center' }}>
                            当前状态:{value.status && value.status === 1 ? "启动" : "暂无状态"}
                        </div>
                        <div style={{ width: '33%', textAlign: 'center' }}>
                            检测方式:{value.detection_method ? value.detection_method : '未设置'}
                        </div>
                        <div style={{ width: '33%', textAlign: 'center' }}>
                            不健康处理方式:
                            {value.mode && value.mode === "liveness"? "重启" : "下线"}
                        </div>
                    </div>
                ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
            </Card>

        );
    }
}
export default HealthAttribute;
