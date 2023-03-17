import {
    Col,
    Icon,
    Input,
    notification,
    Row,
    Select,
    Card,
    AutoComplete
} from 'antd';
import React, { Component } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import styles from './index.less'
const { Option } = Select;
class DAinputs extends Component {
    constructor(props) {
        super(props);
        this.state = {
            values: [
                {
                    name: "",
                    weight: "",
                    kind: "",
                    namespace: "",
                    port: ""
                }
            ],
            showport: false,
            showName: false
        };
    }
    componentDidMount() {
        this.initFromProps();
    }

    componentWillReceiveProps(nextProps) {
        if ('value' in nextProps) {
            const { value } = nextProps;
            this.initFromProps(value);
        }
    }
    onNameChange = (value, index) => {
        const { values } = this.state;
        values[index].name = value;
        this.triggerChange(values);
        this.setValues(values);
    };
    onWeightChange = (value, index) => {
        const { values } = this.state;
        values[index].weight = value;
        this.triggerChange(values);
        this.setValues(values);
    };
    onNamespaceChange = (value, index) => {
        const { values } = this.state;
        values[index].namespace = value;
        this.triggerChange(values);
        this.setValues(values);
    };
    onPortChange = (value, index) => {
        const { values } = this.state;
        values[index].port = value;
        this.triggerChange(values);
        this.setValues(values);
    };
    onSelectChange = (value, index) => {
        const { values } = this.state;
        if (value == "Service") {
            this.setState({
                showport: true,
                showName: false
            })
        } else {
            this.setState({
                showName: true
            })
            values[index].port = null;
        }
        values[index].kind = value;
        this.triggerChange(values);
        this.setValues(values);
    };

    setValues(arr) {
        const setArr = arr || [];
        if (!setArr.length) {
            setArr.push({ name: '', weight: '', kind: '', namespace: '', port: '' });
        }
        this.setState({ values: setArr });
    }
    initFromProps(value) {
        const setValue = value || this.props.value;
        if (setValue) {
            this.setValues(setValue);
        }
    }
    add = () => {
        const { nameSpace } = this.props
        const { values } = this.state;
        if (values.length > 100) {
            notification.warning({
                message: formatMessage({ id: 'notification.warn.add_max' })
            });
            return null;
        }
        this.setState({
            values: values.concat({ name: '', weight: 100, kind: 'Service', namespace: nameSpace, port: 80 })
        },()=>{
            this.triggerChange(this.state.values)
        });
    };

    remove = index => {
        const { values } = this.state;
        values.splice(index, 1);
        this.setValues(values);
        this.triggerChange(values);
    };
    triggerChange(values) {
        const res = [];
        for (let i = 0; i < values.length; i++) {
            res.push({
                name: values[i].name,
                weight: values[i].weight,
                kind: values[i].kind,
                namespace: values[i].namespace,
                port: values[i].port
            });
        }
        const { onChange } = this.props;
        if (onChange) {
            onChange(res, this.props.index);
        }
    }
    render() {
        const { editState, removeShow, ports = [], nameSpace } = this.props
        const { values, showport, showName } = this.state;
        const Svg = <svg t="1678257351883" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2079" width="14" height="14"><path d="M534.869333 490.496a1403.306667 1403.306667 0 0 0 50.858667-25.813333c16.042667-8.618667 29.013333-15.061333 38.570667-19.029334 9.557333-3.925333 17.066667-6.058667 22.869333-6.058666 9.557333 0 17.749333 3.2 24.917333 10.026666 6.826667 6.826667 10.581333 15.061333 10.581334 25.088 0 5.76-1.706667 11.818667-5.12 17.92-3.413333 6.101333-7.168 10.069333-10.922667 11.861334-35.157333 14.677333-74.410667 25.429333-116.736 31.872 7.850667 7.168 17.066667 17.237333 28.330667 29.781333 11.264 12.544 17.066667 18.986667 17.749333 20.053333 4.096 6.101333 9.898667 13.653333 17.408 22.613334 7.509333 8.96 12.629333 15.786667 15.36 20.778666 2.730667 5.034667 4.437333 11.093333 4.437333 18.304a33.706667 33.706667 0 0 1-9.898666 24.021334 33.834667 33.834667 0 0 1-25.6 10.410666c-10.24 0-22.186667-8.618667-35.157334-25.472-12.970667-16.512-30.037333-46.933333-50.517333-91.050666-20.821333 39.424-34.816 65.962667-41.642667 78.506666-7.168 12.544-13.994667 22.186667-20.48 28.672a30.976 30.976 0 0 1-22.528 9.685334 32.256 32.256 0 0 1-25.258666-11.093334 35.413333 35.413333 0 0 1-9.898667-23.68c0-7.893333 1.365333-13.653333 4.096-17.578666 25.258667-35.84 51.541333-67.413333 78.848-93.568a756.650667 756.650667 0 0 1-61.44-12.544 383.061333 383.061333 0 0 1-57.685333-20.48c-3.413333-1.749333-6.485333-5.717333-9.557334-11.818667a30.208 30.208 0 0 1-5.12-16.853333 32.426667 32.426667 0 0 1 10.581334-25.088 33.152 33.152 0 0 1 24.234666-10.026667c6.485333 0 14.677333 2.133333 24.576 6.101333 9.898667 4.266667 22.186667 10.026667 37.546667 18.261334 15.36 7.893333 32.426667 16.853333 51.882667 26.538666-3.413333-18.261333-6.485333-39.082667-8.874667-62.378666-2.389333-23.296-3.413333-39.424-3.413333-48.042667 0-10.752 3.072-19.712 9.557333-27.264A30.677333 30.677333 0 0 1 512.341333 341.333333c9.898667 0 18.090667 3.925333 24.576 11.477334 6.485333 7.893333 9.557333 17.92 9.557334 30.464 0 3.584-0.682667 10.410667-1.365334 20.48-0.682667 10.368-2.389333 22.570667-4.096 36.906666-2.048 14.677333-4.096 31.146667-6.144 49.834667z" fill="#FF3838" p-id="2080"></path></svg>
        const spanStyle = {
            color: '#8d9ba',
            fontSize: 14,
            fontWeight: 800,
            textAlign: 'right'
        }
        const options = 
        ports
            .map((group,index) => (
                        <Option key={index} value={group.service_name}>
                            {group.service_name}
                            <span style={{ color: 'rgb(0 0 0 / 39%)' }}>({group.component_name})</span>
                        </Option>
            ))
        return (
            <div>
                <h4>
                    {formatMessage({ id: 'teamGateway.DrawerGateWayAPI.BackEnd.title' })}
                </h4>
                {values.map((item, index) => {
                    const first = index === 0;
                    return (
                        <Row key={index} className={styles.RowStyle}>
                            <Card style={{ width: '100%' }}>
                                <Col span={22}>
                                    <Row>
                                        <Col span={8}>
                                            <span style={spanStyle}>{Svg}{showName ? formatMessage({id:'confirmModal.openRegion.table.region_alias'}) : formatMessage({ id: 'teamGateway.DrawerGateWayAPI.BackEnd.Internal' })}：</span>
                                        </Col>
                                        <Col span={16}>
                                            <AutoComplete
                                                onChange={ e=>
                                                    this.onNameChange(e,index)
                                                }
                                                style={{ width: "80%" }}
                                                dataSource={options}
                                                value={item.name}
                                                placeholder={showName ? formatMessage({id:'placeholder.appShare.appPublish.name'}) : formatMessage({id:'teamGateway.DrawerGateWayAPI.BackEnd.input_Internal'})}
                                                optionLabelProp="value"
                                            />
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col span={8}>
                                            <span style={spanStyle}>{Svg}{formatMessage({ id: 'teamGateway.DrawerGateWayAPI.BackEnd.type' })}：</span>
                                        </Col>
                                        <Col span={16}>
                                            <Select
                                                name="select"
                                                allowClear
                                                value={item.kind || ''}
                                                onChange={e => {
                                                    this.onSelectChange(e, index);
                                                }}
                                                style={{ width: "80%" }}
                                                placeholder={formatMessage({ id: 'teamGateway.DrawerGateWayAPI.BackEnd.input_type' })}
                                            >
                                                <Select.Option value="HTTPRoute">HTTPRoute</Select.Option>
                                                <Select.Option value="Service">Service</Select.Option>
                                            </Select>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col span={8}>
                                            <span style={spanStyle}>{formatMessage({ id: 'teamGateway.DrawerGateWayAPI.BackEnd.namespance' })}：</span>
                                        </Col>
                                        <Col span={16}>
                                            <Input
                                                style={{ width: "80%" }}
                                                name="key"
                                                onChange={e => {
                                                    this.onNamespaceChange(e.target.value, index);
                                                }}
                                                value={item.namespace}
                                                placeholder={formatMessage({ id: 'teamGateway.DrawerGateWayAPI.BackEnd.input_namespace' })}
                                            />
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col span={8}>
                                            <span style={spanStyle}>{Svg}{formatMessage({ id: 'teamGateway.DrawerGateWayAPI.BackEnd.weight' })}：</span>
                                        </Col>
                                        <Col span={16}>
                                            <Input
                                                style={{ width: "80%" }}
                                                name="value"
                                                onChange={e => {
                                                    this.onWeightChange(e.target.value, index);
                                                }}
                                                value={item.weight}
                                                placeholder={formatMessage({ id: 'teamGateway.DrawerGateWayAPI.BackEnd.input_weight' })}
                                                type='number'

                                            />
                                        </Col>
                                    </Row>
                                    {(item.kind == "Service") &&
                                        <Row>
                                            <Col span={8}>
                                                <span style={spanStyle}>{Svg}{formatMessage({ id: 'teamGateway.DrawerGateWayAPI.BackEnd.port' })}：</span>
                                            </Col>
                                            <Col span={16}>
                                                <Input
                                                    style={{ width: "80%" }}
                                                    name="value"
                                                    onChange={e => {
                                                        this.onPortChange(e.target.value, index);
                                                    }}
                                                    defaultValue={item.port || 80}
                                                    placeholder={formatMessage({ id: 'teamGateway.DrawerGateWayAPI.BackEnd.input_port' })}
                                                    type='number'

                                                />
                                            </Col>
                                        </Row>
                                    }

                                </Col>
                                {!editState &&
                                    <Col span={2}>
                                        <Icon
                                            type={first ? 'plus-circle' : 'minus-circle'}
                                            style={{ fontSize: '20px', }}
                                            onClick={() => {
                                                if (first) {
                                                    this.add();
                                                } else {
                                                    this.remove(index);
                                                }
                                            }}
                                        />
                                    </Col>
                                }
                            </Card>
                        </Row>
                    );
                })}
            </div>
        );
    }
}

export default DAinputs;