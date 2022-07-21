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

s
    drawerShow = (val) => {

        if (this.myCodeMirror != (undefined || null)){
            const editor = this.myCodeMirror.getCodeMirror();
            editor.setValue(val.attribute_value)
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
            lineWrapping: true,//CodeMirror是否应滚动或换行以排长行
            smartIndent: true,//是否使用模式提供的上下文相关缩进（或者只是缩进与之前的行相同）。默认为true。
            matchBrackets: true,
            scrollbarStyle: null,//选择滚动条实现。默认为"native"，显示本机滚动条。核心库还提供了"null"完全隐藏滚动条的样式。插件可以实现其他滚动条模型。
            showCursorWhenSelecting: true,//选择是否处于活动状态时是否应绘制光标。默认为false。
            readOnly: "nocursor",//这会禁止用户编辑编辑器内容。如果"nocursor"给出特殊值（而不是简单true），则不允许对编辑器进行聚焦。
        }
        const { codeMirrorVal, } = this.state
        const { value } = this.props
        
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
