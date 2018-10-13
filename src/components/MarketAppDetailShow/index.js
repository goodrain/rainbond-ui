import React, {PureComponent} from 'react';
import {Modal} from 'antd';
import ReactMarkdown from "react-markdown"
import styles from './index.less';

export default class Index extends PureComponent {
    constructor(props){
        super(props);
        this.state = {
            details: this.props.app.details,
            title: this.props.app.group_name,
            key: this.props.app.group_key
        }
    }
    render(){
        return (
            <Modal
            visible={true}
            onOk={this.props.onOk}
            onCancel={this.props.onCancel}
            footer={<Button onClick={this.props.onOk}>确定</Button>}
            title={this.state.title}
            width={700}
            >
            <ReactMarkdown className={styles.markdown} source={this.state.details} />
            {
             (!this.state.details)&&(
                  <span>未编辑应用详情 <a style={{textAlign: "center"}} target="_blank" href="https://t.goodrain.com"> 更多应用制作请参阅社区用户文献 </a></span>
            )
            }
            </Modal>
        )
    }
}