// import React, { Component } from 'react';
// import { Card, Collapse, Form, Button } from 'antd';


// @Form.create()
// class Index extends Component {
//     constructor(props) {
//         super(props);
//         this.state = {
//             data: [{ name: '111', weight: '2222', type: 'HTTPRoute', namespace: '3333', port: '44444' }],
//             datas: [{ Headers: [{ name: '111', value: '2222', type: 'RegularExpression' }], path: { type: 'RegularExpression', value: '111' } }]
//         }
//     }
//     render() {
//         const { form } = this.props;
//         const { Panel } = Collapse;
//         return (
//             <Collapse >
//                 <Panel>
//                     <Rule />
//                     <BackEnd />
//                 </Panel>
//             </Collapse>
//         );
//     }
// }

// export default Index;


import {
    Card,
    Col,
    Icon,
    Input,
    notification,
    Row,
    Select,
    Collapse,
    Button
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
                      headers:  [
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
                Headers: values[i].Headers,
                path: values[i].path,
            });
        }
        const { onChange } = this.props;
        if (onChange) {
            onChange(res);
        }
    }
    triggerChanges = (val, index) => {
        const { values } = this.state
        const arr = values
        arr[index].Headers = val
        this.setState({
            values: arr
        })
    }
    backendTriggerChange = (val ,index) =>{
        const { values } = this.state
        const arr = values
        arr[index].backend_refs_rule = val
        this.setState({
            values: arr
        })
    }
    ruleTriggerChange = (val ,index) =>{
        const { values } = this.state
        const arr = values
        arr[index].matches_rule= val
        this.setState({
            values: arr
        })
    }
    render() {
        const { setspan = false, editState, removeShow } = this.props
        const { values } = this.state;
        console.log(values,"values");
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
                                    <Panel header="规则集">
                                        <Rule value={matches_rule} onChange={this.ruleTriggerChange} index={index}/>
                                        <BackEnd value={backend_refs_rule } onChange={this.backendTriggerChange} index={index}/>
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