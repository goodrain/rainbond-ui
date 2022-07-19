import React, { PureComponent } from 'react'
import { Button, Card, Form, Row, Icon, Col, Switch, Empty, Drawer } from 'antd';
import DAinput from "../DAinput";
import DApvcinput from '../DApvcinput.js/index'
import DAselect from '../DAseclect';
import styles from "./index.less"

import CodeMirror from 'react-codemirror';
require('codemirror/lib/codemirror.css');
require('codemirror/theme/seti.css');
require('codemirror/addon/display/fullscreen.css');
require('../../styles/codemirror.less');
require('codemirror/addon/display/panel');
require('codemirror/mode/xml/xml');
require('codemirror/mode/javascript/javascript');
require('codemirror/mode/yaml/yaml');
require('codemirror/addon/display/fullscreen');
require('codemirror/addon/edit/matchbrackets');


export default class SpecialAttribute extends PureComponent {
    constructor(props) {
        super(props)
        this.state = {
            visible: false,
            codeMirrorVal:''

        }
    }
    componentDidMount(){
    }

    drawerShow = (val) => {

        if (this.myCodeMirror != undefined || null){
            const xx = this.myCodeMirror.getCodeMirror();
            xx.setValue(val.attribute_value)
        }
        this.setState({
            visible: true,
            codeMirrorVal:val.attribute_value
        })
    }
    onClose = () => {
        this.setState({
            visible: false,
        });
    }

    render() {
        const options = {
            mode: { name: "yaml" ,json: true},
            lineNumbers: true,
            theme: 'seti',
            lineWrapping: true,
            smartIndent: true,
            matchBrackets: true,
            scrollbarStyle: null,
            showCursorWhenSelecting: true,
            readOnly: true
        }
        const { 
            codeMirrorVal,
        } = this.state
        const { value } = this.props
        const values = [
            {
                ID: 0,
                attribute_value: "- name: sp-tls\n  secret:\n    defaultMode: 420\n    secretName: linkerd-sp-validator-k8s-tls\n- name: policy-tls\n  secret:\n    defaultMode: 420\n    secretName: linkerd-policy-validator-k8s-tls\n- emptyDir: {}\n  name: linkerd-proxy-init-xtables-lock\n- emptyDir:\n    medium: Memory\n  name: linkerd-identity-end-entity\n",
                component_id: "",
                create_time: "0001-01-01T00:00:00Z",
                name: "volumes",
                save_type: "yaml",
                tenant_id: "",
            },
            {
                ID: 0,
                attribute_value: "- mountPath: /var/run/linkerd/identity/end-entity\n  name: linkerd-identity-end-entity\n",
                component_id: "",
                create_time: "0001-01-01T00:00:00Z",
                name: "volumeMounts",
                save_type: "yaml",
                tenant_id: "",
            },
            {
                ID: 0,
                attribute_value: "linkerd-destination",
                component_id: "",
                create_time: "0001-01-01T00:00:00Z",
                name: "serviceAccountName",
                save_type: "string",
                tenant_id: "",
            },
            {
                ID: 0,
                attribute_value: "{\"app.kubernetes.io/name\":\"destination\",\"app.kubernetes.io/part-of\":\"Linkerd\",\"app.kubernetes.io/version\":\"stable-2.11.3\",\"linkerd.io/control-plane-component\":\"destination\",\"linkerd.io/control-plane-ns\":\"linkerd\"}",
                component_id: "",
                create_time: "0001-01-01T00:00:00Z",
                name: "labels",
                save_type: "json",
                tenant_id: "",
            },
            {
                ID: 0,
                attribute_value: "{\"kubernetes.io/os\":\"linux\"}",
                component_id: "",
                create_time: "0001-01-01T00:00:00Z",
                name: "nodeSelector",
                save_type: "json",
                tenant_id: "",
            }
        ]

        return (
            <Card title="特殊属性" style={{ marginBottom: '10px' }}>

                {value && value.length > 0 ? (
                    value.map((item, index) => {
                        return <Row key={index} className={styles.rowstyle}>
                            <Col span={4} className={styles.colstyle}>{item.name ? item.name : "-"}:</Col>
                            <Col span={20} className={styles.colstyleone}>
                                {item.save_type && item.save_type === "json" &&
                                    <>
                                        {item.attribute_value && 
                                        item.attribute_value.length > 0 && 
                                        Object.keys(JSON.parse(item.attribute_value)).map((val, numindex) => {
                                            return <div key={numindex} className={styles.divstyle}>
                                                <span>{val}</span>
                                                <span>{JSON.parse(item.attribute_value).[val]}</span>
                                            </div>
                                        })}

                                    </>
                                }
                                {item.save_type && item.save_type === "yaml" &&
                                    <div className={styles.drawerstyle}>
                                        <Button
                                            onClick={()=>this.drawerShow(item)}
                                        >查看详情
                                        </Button>
                                        <Drawer
                                            width={500}
                                            title={item.name ? item.name : "-"}
                                            placement="right"
                                            closable={false}
                                            onClose={this.onClose}
                                            visible={this.state.visible}
                                        >
                                            <CodeMirror 
                                            options={options} 
                                            value={codeMirrorVal && codeMirrorVal.length>0 ? codeMirrorVal:"-" } 
                                            ref={(c)=>this.myCodeMirror = c}
                                            />
                                        </Drawer>
                                    </div>
                                }
                                {item.save_type && item.save_type === "string" &&
                                    <div className={styles.divstyle}>
                                        {item.attribute_value ? item.attribute_value : "-" }
                                    </div>
                                }

                            </Col>
                        </Row>
                    })
                ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )
                }
            </Card >
        )
    }
}
