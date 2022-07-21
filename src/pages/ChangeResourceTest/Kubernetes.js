import React, { PureComponent } from 'react'
import { Card, Table, Button, Drawer, Empty } from 'antd';

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
export default class kbsziyuan extends PureComponent {
    constructor(porps) {
        super(porps)
        this.state = {
            showDrawerswitch: false
        }
    }
    showDrawer = (val) => {
        if (this.myCodeMirror != (undefined || null)){
            const editor = this.myCodeMirror.getCodeMirror();
            editor.setValue(val)
        }
        this.setState({
            showDrawerswitch: !this.state.showDrawerswitch
        })
    }
    onClose = () => {
        this.setState({
            showDrawerswitch: false,
        });
    };
    render() {
        const { value } = this.props;
        const options = {
            mode: { name: "yaml", json: true },
            lineNumbers: true,
            theme: 'seti',
            lineWrapping: true,//CodeMirror是否应滚动或换行以排长行
            smartIndent: true,//是否使用模式提供的上下文相关缩进（或者只是缩进与之前的行相同）。默认为true。
            matchBrackets: true,
            scrollbarStyle: null,//选择滚动条实现。默认为"native"，显示本机滚动条。核心库还提供了"null"完全隐藏滚动条的样式。插件可以实现其他滚动条模型。
            showCursorWhenSelecting: true,//选择是否处于活动状态时是否应绘制光标。默认为false。
            readOnly: "nocursor",//这会禁止用户编辑编辑器内容。如果"nocursor"给出特殊值（而不是简单true），则不允许对编辑器进行聚焦。
        }

        return (
            <Card
                title="k8s资源"
                style={{
                    marginBottom: 16,
                }}>
            {(value && value.length > 0 ) ? (
                           <Table
                           columns={[
                               {
                                   title: '名称',
                                   dataIndex: 'name',
                                   key: "name",
                                   render: text => {
                                       return <>
                                           {text ? text : "暂无名称"}
                                       </>
                                   }
       
                               },
                               {
                                   title: '类型',
                                   dataIndex: 'kind',
                                   key: "kind",
                                   render: text => {
                                       return <>
                                           {text ? text : "未分类"}
                                       </>
                                   }
                               },
                               {
                                   title: 'yaml',
                                   dataIndex: 'content',
                                   key: "content",
                                   render: text => {
                                       return <>
                                           <Button onClick={() => this.showDrawer(text)}>查看详情</Button>
                                           <Drawer
                                               title="yaml"
                                               placement="right"
                                               closable={false}
                                               onClose={this.onClose}
                                               visible={this.state.showDrawerswitch}
                                               width={500}
                                           >
                                               <CodeMirror
                                                   options={options}
                                                   value={text ? text :"-" }
                                                   ref={(c) => this.myCodeMirror = c}
                                               />
                                           </Drawer>
                                       </>
                                   }
                               },
                           ]}
                           dataSource={value}
                           pagination={true}
                       >
                       </Table>
            ):(
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )
            }
            </Card>
        )
    }
}
