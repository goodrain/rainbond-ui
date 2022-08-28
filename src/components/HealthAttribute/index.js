import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
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
                title={formatMessage({id:'enterpriseColony.import.recognition.tabs.health'})}
            >
                {value && Object.keys(value).length > 0 ? (
                    <div style={{ display: 'flex' }}>
                        <div style={{ width: '33%', textAlign: 'center' }}>
                        {formatMessage({id:'enterpriseColony.import.recognition.tabs.health.status'})}{value.status && value.status === 1 ? formatMessage({id:'enterpriseColony.import.recognition.tabs.health.start'}) : formatMessage({id:'enterpriseColony.import.recognition.tabs.health.null'})}
                        </div>
                        <div style={{ width: '33%', textAlign: 'center' }}>
                        {formatMessage({id:'enterpriseColony.import.recognition.tabs.health.check'})}{value.detection_method ? value.detection_method : formatMessage({id:'enterpriseColony.import.recognition.tabs.health.notSetting'})}
                        </div>
                        <div style={{ width: '33%', textAlign: 'center' }}>
                        {formatMessage({id:'enterpriseColony.import.recognition.tabs.health.notHealth'})}
                            {value.mode && value.mode === "liveness"? formatMessage({id:'enterpriseColony.import.recognition.tabs.health.restart'}) : formatMessage({id:'enterpriseColony.import.recognition.tabs.health.offLine'})}
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
