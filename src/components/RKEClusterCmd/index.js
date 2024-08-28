/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import {
  Button,
  Card,
  Col,
  Form,
  Row,
  Steps,
  Tooltip,
  Alert,
  Table,
  Modal,
  Checkbox,
  notification,
  Icon,
  Divider
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import styles from './index.less'


const { Step } = Steps;
const CheckboxGroup = Checkbox.Group;

const plainOptions = ['ETCD', 'Controlplane', 'Worker'];
const defaultCheckedList = ['ETCD', 'Controlplane'];

@Form.create()
@connect()
export default class EnterpriseClusters extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      confirmLoading: false,
      checkedList: defaultCheckedList,
      registrationCmd: '',
      copyText: ''
    };
  }
  componentWillMount() {
  }
  componentDidMount() {
    const { checkedList } = this.state;
    this.setState({
      copyText: this.initializeCmd('http://127.0.0.1:7071', checkedList)
    })
  }
  initializeCmd(ip, node) {
    let cmd = `CATTLE_AGENT_FALLBACK_PATH="/opt/rke2/bin" curl -fL ${ip}/system-agent-install.sh | sudo CATTLE_AGENT_FALLBACK_PATH="/opt/rke2/bin" sh -s - --server ${ip} --label 'cattle.io/os=linux' --token jfklsbsz4zkwxts4m8lfz5ddvkmh25bjh7b2dwrs6cvmjhv4qk4jjp --ca-checksum b63362daf75923d1b674268fc4d4f701473ce2e9ff54937906809245a99d1028${this.getNodeInfo(node)}`
    console.log(cmd, "cmd");
    return cmd
  }
  getNodeInfo = (list) => {
    let result = '';
    if (list && list.length > 0) {
      result = list.map(e => `  --${e.toLowerCase()}`).join(' ');
    }
    return result;
  }
  onChange = checkedList => {
    this.setState({
      checkedList
    }, () => {
      const { checkedList } = this.state;
      this.setState({
        copyText: this.initializeCmd('http://127.0.0.1:7070', checkedList)
      })
    });
  };

  handleOk = () => {
    this.setState({
      confirmLoading: true,
    });
    setTimeout(() => {
      this.setState({
        confirmLoading: false,
      }, () => {
        this.props.onCancel()
      });
    }, 2000);
  };

  handleCancel = () => {
    this.props.onCancel()
  };


  render() {
    const {
      visible,
      confirmLoading,
      copyText
    } = this.state

    return (
      <>
        <Modal
          width={1024}
          title="添加节点"
          visible
          onOk={this.handleOk}
          confirmLoading={confirmLoading}
          onCancel={this.handleCancel}
        >
          <div className={styles.hostInfo}>
            <h1>节点角色</h1>
            <p>选择节点在集群中的角色。在集群中，每个角色都需要至少一个节点。</p>
            <CheckboxGroup
              options={plainOptions}
              value={this.state.checkedList}
              onChange={this.onChange}
            />
          </div>
          <Divider />
          <div className={styles.hostInfo}>
            <h1>注册命令</h1>
            <p>在需要注册的 Linux 主机上运行此命令。</p>
            <div className={styles.copyBox}>
              <CopyToClipboard
                text={copyText}
                onCopy={() => {
                  notification.success({ message: formatMessage({ id: 'notification.success.copy' }) });
                }}
              >
                <Icon type="copy"  style={{fontSize:16}}/>
              </CopyToClipboard>
              <span>{copyText}</span>
            </div>

          </div>

        </Modal>
      </>
    );
  }
}
