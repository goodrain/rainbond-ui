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
                            weight: "",
                            kind: "",
                            namespace: "",
                            port: ""
                        }
                    ]
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
        if (arr[0].matches_rule && arr[0].matches_rule != []) {
            this.setState({
                ruleShow: true,
                buttonShow: false
            })
        }
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
                ]
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
                ]
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
        const { setspan = false, editState, removeShow } = this.props
        const { values, ruleShow, buttonShow } = this.state;
        const { Panel } = Collapse;
        return (
            <div>
                {values.map((item, index) => {
                    const first = index === 0;
                    const { matches_rule, backend_refs_rule } = item
                    return (
                        <Row key={index} className={styles.RuleStyle}>
                            <Col span={22}>
                                <Collapse>
                                    <Panel header={
                                        <h3 style={{marginBottom:0}}>
                                            规则集
                                            <Tooltip placement="right" title="规则集下的条件匹配选项为选填项，后端选项为必填项。">
                                                <Icon type="question-circle" style={{ marginLeft: 6 }} />
                                            </Tooltip>
                                        </h3>

                                    }
                                    >
                                        {buttonShow &&
                                            <Button type="dashed" block style={{ height: 80,margin:20 }} onClick={this.ruleClick}>
                                                <h3>添加条件匹配</h3>
                                            </Button>
                                        }
                                        {ruleShow &&
                                            <Rule value={matches_rule} onChange={this.ruleTriggerChange} index={index} removeValue={this.removeRuleVal} removeShow={true} />
                                        }
                                        <BackEnd value={backend_refs_rule} onChange={this.backendTriggerChange} index={index} />
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



// if (!err) {
//     values && values.username.map(item =>{
//       const rule = item
//       if (rule.backend_refs_rule) {
//         if (rule.backend_refs_rule.length > 0) {
//           rule.backend_refs_rule.map(item => {
//             const { name, kind, port, weight } = item
//             if (kind == 'Service') {
//               if (port == '') {
//                 notification.warning({
//                   message: "当后端类型为Service时，端口选项必填"
//                 });
//               } else if (name =='' || kind=='' || weight == '') {
//                 notification.warning({
//                   message: "请检查并填写完整的后端配置信息。"
//                 });
//               }
//             } else if (kind != 'Service') {
//               if (!name || !kind || !weight) {
//                 notification.warning({
//                   message: "请检查并填写完整的后端配置信息。"
//                 });
//               }
//             }
//           })
//         }
//       } 
//       if (rule.matches_rule) {
//         if (rule.matches_rule.length > 0) {
//           rule.matches_rule.map((item) => {
//             const { headers, path } = item
//             if (headers.length >= 1) {
//               headers.map(val => {
//                 const { name, type, value } = val
//                 if (name=='' && type == undefined && value == '') {
//                   if (path.type == undefined && path.value == '') {
//                     notification.warning({
//                       message: "条件匹配选项中，headers与path至少二者选其一。"
//                     });
//                   } else if (path.type == undefined || path.value == '') {
//                     notification.warning({
//                       message: "请填写完整的path参数。"
//                     });
//                   }
//                 }else if(name != '' || type != undefined || value != ''){
//                   notification.warning({
//                     message: "请填写完整的headers参数。"
//                   });
//                 }else if(name!='' && type != '' && value != ''){
//                   if (path.type != undefined ||  path.value != '') {
//                     notification.warning({
//                       message: "请填写完整的path参数。"
//                     });
//                   }
//                 }
//               })
//             }
//           })
//         }
//       }
//     })
//   }