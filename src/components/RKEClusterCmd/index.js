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

const plainOptions = ['ETCD', 'Control-plane', 'Worker'];
const defaultCheckedList = ['ETCD', 'Control-plane', 'Worker'];

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
      Localhost: window.location.origin,
      internalIP: '',
      externalIP: '',
      token: '',
      serverURL: '',
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
  updateCommand = () => {
    const { checkedList, token, internalIP, externalIP, Localhost, serverURL } = this.state;
    this.setState({
      copyText: this.initializeCmd(Localhost, checkedList, token, { internalIP: internalIP, externalIP: externalIP, serverURL: serverURL })
    })
  }
  onChange = checkedList => {
    this.setState({
      checkedList
    }, () => {
      this.updateCommand()
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
        Localhost: window.location.origin,
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
      cmd = `curl -sfL ${ip}/install-cluster.sh | sh -s - --rbd-url ${ip}${this.getNodeInfo(node)}` + `  --token  ${token} --mirror cn`
    } else {
      cmd = `curl -sfL ${ip}/install-cluster.sh | sh -s - --rbd-url ${ip}${this.getNodeInfo(node)}` +
      `${ipobj.externalIP != '' ? `  --external-ip ${ipobj.externalIP}` : ''}` +
      `${ipobj.internalIP != '' ? `  --internal-ip ${ipobj.internalIP}` : ''}` +
      `${ipobj.serverURL != '' ? `  --server-url ${ipobj.serverURL}` : ''}` +
      `  --token  ${token} --mirror cn` }
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
      Localhost,
      serverURL
    } = this.state
    return (
      <>
        <Modal
          width={1024}
          title={formatMessage({ id: 'enterpriseColony.newHostInstall.node.addnode' })}
          visible
          footer={<Button onClick={this.handleCancel}>{formatMessage({ id: 'enterpriseColony.newHostInstall.node.Cancel' })}</Button>}
          onCancel={this.handleCancel}
          style={{ position: "relative" }}
        >
          <Alert
            message={formatMessage({ id: 'enterpriseColony.newHostInstall.node.lookOut' })}
            description={formatMessage({ id: 'enterpriseColony.newHostInstall.node.msgs' })}
            type="warning"
            showIcon
            style={{ marginBottom: 24 }}
          />
          <div className={styles.moreConfig}>
            <Button type="link" onClick={this.ipInputShowFun}>{!ipInputShow ? formatMessage({ id: 'enterpriseColony.newHostInstall.node.advanced' }) : formatMessage({ id: 'enterpriseColony.newHostInstall.node.Cancel' })}</Button>
          </div>
          <div className={styles.hostInfo}>
            <h1>{formatMessage({ id: 'enterpriseColony.newHostInstall.node.nodeRole' })}</h1>
            <p>{formatMessage({ id: 'enterpriseColony.newHostInstall.node.select' })}</p>
            <CheckboxGroup
              options={plainOptions.map(option => ({
                label: formatMessage({ id: `enterpriseColony.newHostInstall.node.select.${option}` }),
                value: option
              }))}
              value={this.state.checkedList}
              onChange={this.onChange}
            />
          </div>
          <Divider />
          {ipInputShow &&
            <>
              <div className={styles.hostInfo}>
                <h1>{formatMessage({ id: 'enterpriseColony.newHostInstall.node.advancedopt' })}</h1>
                <p>{formatMessage({ id: 'enterpriseColony.newHostInstall.node.ipMsg' })}</p>
                <Input
                  placeholder={formatMessage({ id: 'enterpriseColony.newHostInstall.node.externalIP' })}
                  style={{ marginBottom: 12, width: 350, height: 40 }}
                  value={externalIP}
                  onChange={(e) => {
                    this.setState({
                      externalIP: e.target.value
                    }, () => {
                      this.updateCommand()
                    })
                  }} />
                <Input
                  placeholder={formatMessage({ id: 'enterpriseColony.newHostInstall.node.internalIP' })}
                  style={{ marginBottom: 12, width: 350, height: 40, marginLeft: 24 }}
                  value={internalIP}
                  onChange={(e) => {
                    this.setState({
                      internalIP: e.target.value
                    }, () => {
                      this.updateCommand()
                    })
                  }} />
              </div>
              <div className={styles.hostInfo}>
                <p>{formatMessage({ id: 'enterpriseColony.newHostInstall.node.inputConsole' })}</p>
                <Input
                  placeholder={formatMessage({ id: 'enterpriseColony.newHostInstall.node.consoleAdd' })}
                  style={{ marginBottom: 12, width: 350, height: 40 }}
                  value={Localhost}
                  onChange={(e) => {
                    this.setState({
                      Localhost: e.target.value
                    }, () => {
                      this.updateCommand()
                    })
                  }} />
              </div>
              <div className={styles.hostInfo}>
                <p>{formatMessage({ id: 'enterpriseColony.newHostInstall.node.serverURL' })}</p>
                <Input
                  placeholder={formatMessage({ id: 'enterpriseColony.newHostInstall.node.serverURL.desc' })}
                  style={{ marginBottom: 12, width: 350, height: 40 }}
                  value={serverURL}
                  onChange={(e) => {
                    this.setState({
                      serverURL: e.target.value
                    }, () => {
                      this.updateCommand()
                    })
                  }} />
              </div>
              <Divider />
            </>
          }

          <div className={styles.hostInfo}>
            <h1>{formatMessage({ id: 'enterpriseColony.newHostInstall.node.cmd' })}</h1>
            <p>{formatMessage({ id: 'enterpriseColony.newHostInstall.node.Linux' })}</p>
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
