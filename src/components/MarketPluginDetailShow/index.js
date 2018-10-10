import React, {PureComponent} from 'react';
import {Modal} from 'antd';
import ReactMarkdown from "react-markdown"
import styles from './index.less';

export default class Index extends PureComponent {
    constructor(props){
        super(props);
        this.state = {
            details: this.props.plugin.details,
            title: this.props.plugin.plugin_name,
            key: this.props.plugin.plugin_key
        }
    }
    render(){
        return (
            <Modal
            visible={true}
            onOk={this.props.onOk}
            onCancel={this.props.onCancel}
            title={this.state.title}
            width={700}
            >
            <ReactMarkdown className={styles.markdown} source={this.state.details} />
            {
             (!this.state.details)&&(
                  <span>未编辑插件详情 <a style={{textAlign: "center"}} target="_blank" href="https://t.goodrain.com"> 更多插件制作请参阅社区用户文献 </a></span>
            )
            }
            </Modal>
        )
    }
}