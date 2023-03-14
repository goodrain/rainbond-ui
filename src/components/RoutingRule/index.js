import {
    Card,
    Col,
    Icon,
    Input,
    notification,
    Row,
    Select,
    Collapse,
    Button,
    Tooltip
} from 'antd';
import React, { Component } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import BackEnd from './components/BackEnd/index'
import Rule from "./components/Rule/index"
import AdvancedRule from './components/AdvancedRule'
import styles from './index.less'
const { Option } = Select;
class index extends Component {
    constructor(props) {
        super(props);
        this.state = {
            values: [
                {
                    matches_rule: [
                        {
                            path: {
                                type: "",
                                value: ""
                            },
                            headers: [
                                {
                                    name: "",
                                    type: "",
                                    value: ""
                                }
                            ]
                        }
                    ],
                    backend_refs_rule: [
                        {
                            name: "",
                            weight: 100,
                            kind: "",
                            namespace: "",
                            port: ""
                        }
                    ],
                    filters_rule: [
                        {
                            type: "",
                            request_header_modifier: {
                                set: [
                                    {
                                        name: "",
                                        value: ""
                                    }
                                ],
                                add: [
                                    {
                                        name: "",
                                        value: ""
                                    }
                                ],
                                remove: [
                                    ""
                                ]
                            },
                            request_redirect: {
                                scheme: "",
                                hostname: "",
                                port: '',
                                status_code: ''
                            }
        
                        }
                    ],
                }
            ],
            ruleShow: false,
            buttonShow: true
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
    setValues(arr) {
        const setArr = arr || [];
        if (!setArr.length) {
            setArr.push({
                matches_rule: [
                    {
                        path: {
                            type: "",
                            value: ""
                        },
                        headers: [
                            {
                                name: "",
                                type: "",
                                value: ""
                            }
                        ]
                    }
                ],
                backend_refs_rule: [
                    {
                        name: "",
                        weight: "",
                        kind: "",
                        namespace: "",
                        port: ""
                    }
                ],
                filters_rule: [
                    {
                        type: "",
                        request_header_modifier: {
                            set: [
                                {
                                    name: "",
                                    value: ""
                                }
                            ],
                            add: [
                                {
                                    name: "",
                                    value: ""
                                }
                            ],
                            remove: [
                                ""
                            ]
                        },
                        request_redirect: {
                            scheme: "",
                            hostname: "",
                            port: '',
                            status_code: ''
                        }
    
                    }
                ],
            });
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
        const { values } = this.state;
        if (values.length > 100) {
            notification.warning({
                message: formatMessage({ id: 'notification.warn.add_max' })
            });
            return null;
        }
        this.setState({
            values: values.concat({
                matches_rule: [
                    {
                        path: {
                            type: "",
                            value: ""
                        },
                        headers: [
                            {
                                name: "",
                                type: "",
                                value: ""
                            }
                        ]
                    }
                ],
                backend_refs_rule: [
                    {
                        name: "",
                        weight: "",
                        kind: "",
                        namespace: "",
                        port: ""
                    }
                ],
                filters_rule: [
                    {
                        type: "",
                        request_header_modifier: {
                            set: [
                                {
                                    name: "",
                                    value: ""
                                }
                            ],
                            add: [
                                {
                                    name: "",
                                    value: ""
                                }
                            ],
                            remove: [
                                ""
                            ]
                        },
                        request_redirect: {
                            scheme: "",
                            hostname: "",
                            port: '',
                            status_code: ''
                        }
    
                    }
                ],
            })
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
                matches_rule: values[i].matches_rule,
                backend_refs_rule: values[i].backend_refs_rule,
                filters_rule: values[i].filters_rule
            });
        }
        const { onChange } = this.props;
        if (onChange) {
            onChange(res, this.props.index);
        }
    }
    triggerChanges = (val, index) => {
        const { values } = this.state
        const arr = values
        arr[index].headers = val
        this.setState({
            values: arr
        },()=>{
            this.triggerChange(this.state.values)
        })
    }
    backendTriggerChange = (val, index) => {
        const { values } = this.state
        const arr = values
        arr[index].backend_refs_rule = val
        this.setState({
            values: arr
        },()=>{
            this.triggerChange(this.state.values)
        })
    }
    ruleTriggerChange = (val, index) => {
        const { values } = this.state
        const arr = values
        arr[index].matches_rule = val
        this.setState({
            values: arr
        },()=>{
            this.triggerChange(this.state.values)
        })
    }
     AdvancedRuleTriggerChange = (val, index) => {
        const { values } = this.state
        const arr = values
        arr[index].filters_rule = val
        this.setState({
            values: arr
        },()=>{
            this.triggerChange(this.state.values)
        })
    }
    ruleClick = () => {
        this.setState({
            ruleShow: true,
            buttonShow: false
        })
    }
    removeRuleVal = () => {
        const { values } = this.state
        const arr = values
        arr[0].matches_rule = null
        this.setState({
            values: arr,
            ruleShow: false,
            buttonShow: true
        })
        
    }
    render() {
        const { setspan = false, editState, removeShow, isEdit, ports } = this.props
        const { values, ruleShow, buttonShow } = this.state;
        const { Panel } = Collapse;
        return (
            <div>
                {values.map((item, index) => {
                    const first = index === 0;
                    const { matches_rule, backend_refs_rule, filters_rule } = item
                    return (
                        <Row key={index} className={styles.RuleStyle}>
                            <Col span={22}>
                                <Collapse defaultActiveKey={['1']}>
                                    <Panel 
                                    header={
                                        <h3 style={{marginBottom:0}}>
                                            {formatMessage({id:'teamGateway.DrawerGateWayAPI.RoutingRule.rule'})}
                                        </h3>
                                    }
                                    key="1"
                                    >
                                        <Rule value={matches_rule} onChange={this.ruleTriggerChange} index={index}  />
                                        <AdvancedRule value={filters_rule} onChange={this.AdvancedRuleTriggerChange} index={index}/>
                                        <BackEnd value={backend_refs_rule} onChange={this.backendTriggerChange} index={index} ports={ports}/>
                                    </Panel>
                                </Collapse>
                            </Col>
                            {!editState &&
                                <Col span={2}>
                                    <Icon
                                        type={first ? 'plus-circle' : 'minus-circle'}
                                        style={{ fontSize: '20px' }}
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
                        </Row>
                    );
                })
                }
            </div >
        );
    }
}

export default index;



