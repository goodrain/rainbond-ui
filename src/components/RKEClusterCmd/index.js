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
  Divider,
  Input
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import Cookies from '../../utils/cookie'
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import styles from './index.less'


const { Step } = Steps;
const { TextArea } = Input;
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
      copyText: '',
      hostInputShow: false,
      ipInputShow: false,
      Localhost: window.location.host,
      internalIP: '',
      externalIP: '',
      token: '',
    };
  }
  componentWillMount() {
    const { eventId } = this.props
    this.setState({
      token: eventId
    })
  }
  componentDidMount() {
    this.updateCommand()
  }
  updateCommand = (bool = false) => {
    const { checkedList, token, internalIP, externalIP, Localhost } = this.state;
    this.setState({
      copyText: this.initializeCmd(Localhost, checkedList, token, { internalIP: internalIP, externalIP: externalIP })
    }, () => {
      bool && notification.success({ message: '命令更新成功' })
    })
  }
  onChange = checkedList => {
    this.setState({
      checkedList
    }, () => {
      this.updateCommand(true)
    });
  };
  handleOk = () => {
    this.props.onCancel()
  };
  handleCancel = () => {
    this.props.onCancel()
  };
  ipInputShowFun = () => {
    const { ipInputShow } = this.state
    if (ipInputShow) {
      this.setState({
        externalIP: '',
        internalIP: '',
        Localhost: window.location.host,
        ipInputShow: !ipInputShow
      }, () => {
        this.updateCommand()
      })
    } else {
      this.setState({
        ipInputShow: !ipInputShow
      })
    }
  }
  initializeCmd(ip, node, token, ipobj = {}) {
    let cmd = ''
    if (Object.keys(ipobj).length == 0) {
      cmd = `curl -sfL ${ip}/rke2-install.sh | sh -s -${ip}${this.getNodeInfo(node)}` + `  --token  ${token}`
    } else {
      cmd = `curl -sfL ${ip}/rke2-install.sh | sh -s -${ip}${this.getNodeInfo(node)}` + `${ipobj.externalIP != '' ? `  --external-ip ${ipobj.externalIP}` : ''}` + `${ipobj.internalIP != '' ? `  --internal-ip ${ipobj.internalIP}` : ''}` + `  --token  ${token}`
    }
    return cmd
  }
  getNodeInfo(list) {
    return list.map(e => `  --${e.toLowerCase()}`).join(' ');
  }
  render() {
    const {
      visible,
      confirmLoading,
      copyText,
      ipInputShow,
      hostInputShow,
      internalIP,
      externalIP,
      Localhost
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
          style={{ position: "relative" }}
        >
          <div className={styles.moreConfig}>
              <Button type="link" onClick={this.ipInputShowFun}>{!ipInputShow ? '高级设置':'取消'}</Button>
          </div>
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
          {ipInputShow &&
            <>
              <div className={styles.hostInfo}>
                <h1>高级选项</h1>
                <p>填写需要注册节点的公网IP和内网IP。</p>
                <Input
                  placeholder='节点内网IP'
                  style={{ marginBottom: 12, width: 350,height:40,marginRight:24 }}
                  value={internalIP}
                  onChange={(e) => {
                    this.setState({
                      internalIP: e.target.value
                    }, () => {
                      this.updateCommand()
                    })
                  }} />
                <Input
                  placeholder='节点公网IP'
                  style={{ marginBottom: 12, width: 350,height:40 }}
                  value={externalIP}
                  onChange={(e) => {
                    this.setState({
                      externalIP: e.target.value
                    }, () => {
                      this.updateCommand()
                    })
                  }} />
              </div>
              <div className={styles.hostInfo}>
                {/* <h1>控制台地址调整</h1> */}
                <p>请填写控制台的访问地址，用于替换下方注册命令中的地址。</p>
                <Input
                  placeholder='控制台访问地址'
                  style={{ marginBottom: 12, width: 350,height:40 }}
                  value={Localhost}
                  onChange={(e) => {
                    this.setState({
                      Localhost: e.target.value
                    }, () => {
                      this.updateCommand()
                    })
                  }} />
              </div>
              <Divider />
            </>
          }

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
                <Icon type="copy" style={{ fontSize: 16 }} />
              </CopyToClipboard>
              <span>{copyText}</span>
            </div>

          </div>

        </Modal>
      </>
    );
  }
}
