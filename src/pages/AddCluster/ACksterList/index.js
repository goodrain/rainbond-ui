/* eslint-disable no-nested-ternary */
/* eslint-disable react/sort-comp */
import {
  Alert,
  Button,
  Checkbox,
  Col,
  Form,
  Modal,
  notification,
  Typography,
  Input,
  Row,
  AutoComplete,
  Radio,
  Switch,
  Menu,
  Icon,
  Card,
  message,
  Collapse,
  Tooltip
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import copy from 'copy-to-clipboard';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import cloud from '../../../utils/cloud';
import globalUtil from '../../../utils/global';
import CodeMirrorForm from '../../../components/CodeMirrorForm';
import CommandModal from '../../../components/CommandModal';
import yaml from 'js-yaml'
import DAinput from '../component/node';
import IpNode from '../component/ip';
import Etcd from '../component/etcd';
import styles from './index.less';

const { Panel } = Collapse;
const { TextArea } = Input;

@connect(({ global }) => ({
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise
}))
@Form.create()
export default class RainbondClusterInit extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      checked: false,
      loading: false,
      showInitDetail: false,
      task: null,
      isComponents: false,
      guideStep: 10,
      ipArray: [],
      isStorage: 'default',
      isEtcd: 'default',
      isImage: 'default',
      isDatabase: 'default',
      isMirror: 'default',
      isEctype: 'default',
      menuKey: 'basics',
      isModal: false,
      token: '',
      isCheck: false,
    };
    this.formObj = {
      operator: {
        env: [
          {
            name: 'CONTAINER_RUNTIME',
            value: 'docker'
          },
          {
            name: 'HELM_TOKEN',
            value: ''
          },
        ]
      },
      Cluster: {},
      Component: {
        rbd_app_ui: {
          enable: false
        }
      }
    }
  }
  componentDidMount() {
    this.handleHelmEvents()
  }

  handleHelmEvents = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      },
    } = this.props;
    dispatch({
      type: 'region/fetchHelmEvents',
      payload: {
        eid
      },
      callback: res => {
        if (res.create_status) {
          dispatch(routerRedux.push(`/enterprise/${eid}/provider/ACksterList/result?token=${res.token}&host=${res.api_host}`))
        } else {
          this.helmToken()
        }
      }
    });
  }

  helmToken = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      },
    } = this.props;

    dispatch({
      type: 'region/fetchHelmToken',
      payload: { eid },
      callback: res => {
        if (res.bean) {
          this.setState({
            token: res.bean
          })
        }
      }
    });
  };

  // 校验节点名称
  handleValidatorsNodes = (_, value, callback) => {
    if (value && value.length > 0) {
      let isPass = false;
      value.some(item => {
        if (item.ip || item.name) {
          isPass = true;
        } else {
          isPass = false;
          return true;
        }
      });
      if (isPass) {
        this.setState({
          isCheck: true
        })
        callback();
      } else {
        this.setState({
          isCheck: false
        })
        callback(formatMessage({ id:'enterpriseColony.ACksterList.node_name' }));
      }
    } else {
      this.setState({
        isCheck: true
      })
      callback();
    }
  };

  handleClick = e => {
    this.setState({
      menuKey: e.key
    });
  }
  onChangeRunTime = e => {
    this.formObj.operator.env[0].value = e.target.value
  }
  handleOnChangeIp = e => {
    const value = e.target.value;
    if (value) {
      this.formObj.Cluster.gatewayIngressIPs = value
    } else {
      delete this.formObj.Cluster.gatewayIngressIPs
    }
  }
  handleOnChangeGateway = e => {
    if (e) {
      this.formObj.Cluster.nodesForGateway = e
    } else {
      delete this.formObj.Cluster.nodesForGateway
    }
  }
  handleOnChangeForChaos = e => {
    if (e) {
      this.formObj.Cluster.nodesForChaos = e
    } else {
      delete this.formObj.Cluster.nodesForChaos
    }
  }
  handleOnChangeRwx = e => {
    const value = e.target.value;
    if (value) {
      this.formObj.Cluster.RWX = {
        config: {
          storageClassName: value
        }
      }
    } else {
      delete this.formObj.Cluster.RWX
    }
  }
  handleOnChangeRwo = e => {
    const value = e.target.value;
    if (value) {
      this.formObj.Cluster.RWO = {
        storageClassName: value
      }
    } else {
      delete this.formObj.Cluster.RWO
    }
  }
  handleOnChangeSecretName = e => {
    const value = e.target.value;
    if (value) {
      if (!this.formObj.Cluster.etcd) {
        this.formObj.Cluster.etcd = {};
      }
      this.formObj.Cluster.etcd.secretName = value
    } else {
      delete this.formObj.Cluster.etcd.secretName
    }
  }
  handleOnChangeEndpoints = e => {
    if (e) {
      if (!this.formObj.Cluster.regionDatabase) {
        this.formObj.Cluster.etcd = {};
      }
      this.formObj.Cluster.etcd.endpoints = e.map(item => item.ip)
    } else {
      if (this.formObj.Cluster.etcd) {
        delete this.formObj.Cluster.etcd.endpoints
        if (Object.keys(this.formObj.Cluster.imageHub).length === 0) {
          delete this.formObj.Cluster.imageHub;
        }
      }
    }
  }
  handleOnChangeDomain = e => {
    const value = e.target.value;
    if (value) {
      if (!this.formObj.Cluster.imageHub) {
        this.formObj.Cluster.imageHub = {};
      }
      this.formObj.Cluster.imageHub.domain = value
    } else {
      if (this.formObj.Cluster.imageHub) {
        delete this.formObj.Cluster.imageHub.domain;
        if (Object.keys(this.formObj.Cluster.imageHub).length === 0) {
          delete this.formObj.Cluster.imageHub;
        }
      }
    }
  }
  handleOnChangeNamespace = e => {
    const value = e.target.value;
    if (value) {
      if (!this.formObj.Cluster.imageHub) {
        this.formObj.Cluster.imageHub = {};
      }
      this.formObj.Cluster.imageHub.namespace = value
    } else {
      if (this.formObj.Cluster.imageHub) {
        delete this.formObj.Cluster.imageHub.namespace;
        if (Object.keys(this.formObj.Cluster.imageHub).length === 0) {
          delete this.formObj.Cluster.imageHub;
        }
      }
    }
  }
  handleOnChangeUsername = e => {
    const value = e.target.value;
    if (value) {
      if (!this.formObj.Cluster.imageHub) {
        this.formObj.Cluster.imageHub = {};
      }
      this.formObj.Cluster.imageHub.username = value;
    } else {
      if (this.formObj.Cluster.imageHub) {
        delete this.formObj.Cluster.imageHub.username;
        if (Object.keys(this.formObj.Cluster.imageHub).length === 0) {
          delete this.formObj.Cluster.imageHub;
        }
      }
    }
  }
  handleOnChangePassword = e => {
    const value = e.target.value;
    if (value) {
      if (!this.formObj.Cluster.imageHub) {
        this.formObj.Cluster.imageHub = {};
      }
      this.formObj.Cluster.imageHub.password = value
    } else {
      if (this.formObj.Cluster.imageHub) {
        delete this.formObj.Cluster.imageHub.password;
        if (Object.keys(this.formObj.Cluster.imageHub).length === 0) {
          delete this.formObj.Cluster.imageHub;
        }
      }
    }
  }
  handleOnChangeDbHost = e => {
    const value = e.target.value;
    if (value) {
      if (!this.formObj.Cluster.regionDatabase) {
        this.formObj.Cluster.regionDatabase = {};
      }
      this.formObj.Cluster.regionDatabase.host = value
    } else {
      if (this.formObj.Cluster.regionDatabase) {
        delete this.formObj.Cluster.regionDatabase.host;
        if (Object.keys(this.formObj.Cluster.regionDatabase).length === 0) {
          delete this.formObj.Cluster.regionDatabase;
        }
      }
    }
  }
  handleOnChangeDbPort = e => {
    const value = e.target.value;
    if (value) {
      if (!this.formObj.Cluster.regionDatabase) {
        this.formObj.Cluster.regionDatabase = {};
      }
      this.formObj.Cluster.regionDatabase.port = value
    } else {
      if (this.formObj.Cluster.regionDatabase) {
        delete this.formObj.Cluster.regionDatabase.port;
        if (Object.keys(this.formObj.Cluster.regionDatabase).length === 0) {
          delete this.formObj.Cluster.regionDatabase;
        }
      }
    }
  }
  handleOnChangeDbUsername = e => {
    const value = e.target.value;
    if (value) {
      if (!this.formObj.Cluster.regionDatabase) {
        this.formObj.Cluster.regionDatabase = {};
      }
      this.formObj.Cluster.regionDatabase.username = value
    } else {
      if (this.formObj.Cluster.regionDatabase) {
        delete this.formObj.Cluster.regionDatabase.username;
        if (Object.keys(this.formObj.Cluster.regionDatabase).length === 0) {
          delete this.formObj.Cluster.regionDatabase;
        }
      }
    }
  }
  handleOnChangeDbPassword = e => {
    const value = e.target.value;
    if (value) {
      if (!this.formObj.Cluster.regionDatabase) {
        this.formObj.Cluster.regionDatabase = {};
      }
      this.formObj.Cluster.regionDatabase.password = value
    } else {
      if (this.formObj.Cluster.regionDatabase) {
        delete this.formObj.Cluster.regionDatabase.password;
        if (Object.keys(this.formObj.Cluster.regionDatabase).length === 0) {
          delete this.formObj.Cluster.regionDatabase;
        }
      }
    }
  }
  handleOnChangeDbName = e => {
    const value = e.target.value;
    if (value) {
      if (!this.formObj.Cluster.regionDatabase) {
        this.formObj.Cluster.regionDatabase = {};
      }
      this.formObj.Cluster.regionDatabase.name = value
    } else {
      if (this.formObj.Cluster.regionDatabase) {
        delete this.formObj.Cluster.regionDatabase.name;
        if (Object.keys(this.formObj.Cluster.regionDatabase).length === 0) {
          delete this.formObj.Cluster.regionDatabase;
        }
      }
    }
  }
  handleOnChangeMirrorAddress = e => {
    const value = e.target.value;
    if (value) {
      this.formObj.Cluster.rainbondImageRepository = value
    } else {
      delete this.formObj.Cluster.rainbondImageRepository
    }
  }

  handleOpenModal = () => {
    this.setState({
      isModal: true
    })
  }
  handleCancleModal = () => {
    this.setState({
      isModal: false
    })
  }
  render() {
    const { form } = this.props;
    const {
      ipArray,
      menuKey,
      isModal,
      token,
      isCheck
    } = this.state;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 }
      },
      wrapperCol: {
        xs: { span: 24 }
      }
    };
    const is_formItemLayout = {
      labelCol: {
        xs: { span: 4 },
        sm: { span: 4 }
      },
      wrapperCol: {
        xs: { span: 16 },
        sm: { span: 16 }
      }
    };
    const mode = this.props.location.query.mode || 'helm';
    this.formObj.operator.env[1].value = token
    const { getFieldDecorator, setFieldsValue } = form;
    const yamlJson = yaml.dump(this.formObj)
    const dataInfo = this.formObj.Cluster || {};
    const isDisabled = dataInfo.gatewayIngressIPs && dataInfo.nodesForGateway && dataInfo.nodesForChaos && isCheck;

    return (
      <Fragment>
        <PageHeaderLayout
          title={<FormattedMessage id='enterpriseColony.button.text' />}
          content={<FormattedMessage id='enterpriseColony.PageHeaderLayout.content' />}
          titleSvg={pageheaderSvg.getSvg('clusterSvg', 18)}
        >
          <Col span={24} style={{ padding: '0px 24px', marginBottom: '24px' }}>
            <Form style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Col span={12}>
                <Card className={styles.cardBox}>
                  <Col span={4}>
                    <div className={styles.menuBox}>
                      <Menu
                        defaultSelectedKeys={['basics']}
                        mode="inline"
                        theme="dark"
                        onClick={this.handleClick}
                      >
                        <Menu.Item key="basics">
                          <span>{formatMessage({id:'enterpriseColony.ACksterList.basic'})}</span>
                        </Menu.Item>
                        <Menu.Item key="advanced">
                          <span>{formatMessage({id:'enterpriseColony.ACksterList.senior'})}</span>
                        </Menu.Item>
                      </Menu>
                    </div>
                  </Col>
                  <Col span={20}>
                    <div className={styles.nextBtn}>
                      <Tooltip placement="bottom" title={!isDisabled ? formatMessage({id:'enterpriseColony.ACksterList.not_required'}) : ''}>
                        <Button
                          onClick={() => {
                            this.handleOpenModal()
                          }}
                          disabled={!isDisabled}
                          style={{ float: 'right' }}
                          type='primary'
                        >
                          {formatMessage({id:'button.next_step'})}
                        </Button>
                      </Tooltip>
                    </div>
                    <div className={styles.basics}>
                      {menuKey == 'basics' && <>
                        <Row className={styles.row}>
                          <div className={styles.title_name}>
                          {formatMessage({id:'enterpriseColony.ACksterList.runtimeTitle'})}
                          </div>
                          <Form.Item
                            {...is_formItemLayout}
                            label={formatMessage({id:'enterpriseColony.ACksterList.change_runtime'})}
                          >
                            {getFieldDecorator('runtime', {
                              initialValue: this.formObj.operator.env.CONTAINER_RUNTIME || 'docker',
                            })(
                              <Radio.Group onChange={this.onChangeRunTime}>
                                <Radio value={'docker'}>Docker</Radio>
                                <Radio value={'containerd'}>Containerd</Radio>
                              </Radio.Group>
                            )}
                          </Form.Item>
                        </Row>
                        <Row className={styles.row}>
                          <div className={styles.title_name}>
                            {mode == 'ack'
                              ? formatMessage({id: 'enterpriseColony.cloud.slb'})
                              : mode == 'huawei'
                                ? formatMessage({id: 'enterpriseColony.cloud.elb'})
                                : mode == 'tencent'
                                  ? formatMessage({id: 'enterpriseColony.cloud.load'})
                                  : formatMessage({id: 'enterpriseColony.cloud.load'})
                            }
                            <span> *</span>
                          </div>
                          <Form.Item
                            {...is_formItemLayout}
                            label={formatMessage({id:'enterpriseColony.ACksterList.ip_address'})}
                          >
                            {getFieldDecorator('gatewayIngressIPs', {
                              initialValue: dataInfo.gatewayIngressIPs || '',
                              rules: [
                                {
                                  pattern: /((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})(\.((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})){3}/g,
                                  message: formatMessage({ id: 'enterpriseColony.ACksterList.input_correct_ip' })
                                },
                                {
                                  pattern: /^[^\s]*$/,
                                  message: formatMessage({ id: 'placeholder.no_spaces' })
                                }
                              ]
                            })(
                              <Input placeholder={formatMessage({ id: 'enterpriseColony.ACksterList.ip_demo' })} onChange={this.handleOnChangeIp} />
                            )}
                          </Form.Item>
                        </Row>
                        <Row className={styles.row}>
                          <div className={styles.title_name}>
                            {formatMessage({id:'enterpriseColony.ACksterList.gateway'})}
                            <span> *</span>
                          </div>
                          <Form.Item
                            {...is_formItemLayout}
                            label={formatMessage({id:'enterpriseColony.ACksterList.nodeIP'})}
                          >
                            {getFieldDecorator('nodesForGateway', {
                              initialValue: dataInfo.nodesForGateway || '',
                              rules: [
                                {
                                  validator: this.handleValidatorsNodes
                                }
                              ]
                            })(<DAinput valueArr={dataInfo.nodesForGateway} onChange={this.handleOnChangeGateway} keys='gateway' />)}
                          </Form.Item>
                        </Row>
                        <Row className={styles.row}>
                          <div className={styles.title_name}>
                            {formatMessage({id:'enterpriseColony.Advanced.creat_node'})}
                            <span> *</span>
                          </div>
                          <Form.Item
                            {...is_formItemLayout}
                            label={formatMessage({id:'enterpriseColony.Advanced.node_name'})}
                          >
                            {getFieldDecorator('nodesForChaos', {
                              initialValue: dataInfo.nodesForChaos || '',
                              rules: [
                                {
                                  validator: this.handleValidatorsNodes
                                }
                              ]
                            })(<IpNode valueArr={dataInfo.nodesForChaos} onChange={this.handleOnChangeForChaos} keys='chaos' />)}
                          </Form.Item>
                        </Row>
                        <Row className={styles.row}>
                          <div className={styles.title_name}>
                            {mode == 'ack'
                              ? formatMessage({id:'enterpriseColony.cloud.nas'})
                              : mode == 'huawei'
                                ? formatMessage({id:'enterpriseColony.cloud.sfs'})
                                : mode == 'tencent'
                                  ? formatMessage({id:'enterpriseColony.cloud.cfs'})
                                  : formatMessage({id:'enterpriseColony.Advanced.storage'})
                            }
                          </div>
                          <Form.Item
                            {...is_formItemLayout}
                            label="RWX"
                          >
                            {getFieldDecorator('storageClassName1', {
                              initialValue: dataInfo.RWX ? dataInfo.RWX.config.storageClassName : '',
                              rules: [
                                {
                                  pattern: /^[^\s]*$/,
                                  message: formatMessage({ id: 'placeholder.no_spaces' })
                                }
                              ]
                            })(<Input onChange={this.handleOnChangeRwx} placeholder={formatMessage({ id: 'enterpriseColony.Advanced.input_StorageClass' })} />)}
                          </Form.Item>

                          <Form.Item
                            {...is_formItemLayout}
                            label="RWO"
                          >
                            {getFieldDecorator('storageClassName2', {
                              initialValue: dataInfo.RWO ? dataInfo.RWO.storageClassName : '',
                              rules: [
                                {
                                  pattern: /^[^\s]*$/,
                                  message: formatMessage({ id: 'placeholder.no_spaces' })
                                }
                              ]
                            })(<Input onChange={this.handleOnChangeRwo} placeholder={formatMessage({ id: 'enterpriseColony.Advanced.input_storage' })} />)}
                          </Form.Item>
                        </Row>

                      </>}
                      {/* 高级配置 */}
                      {menuKey == 'advanced' && <>
                        <Row className={styles.row}>
                          <div className={styles.title_name}>
                            Etcd
                          </div>
                          <Form.Item
                            {...is_formItemLayout}
                            label={formatMessage({id:'enterpriseColony.Advanced.name'})}
                          >
                            {getFieldDecorator('secretName', {
                              initialValue: dataInfo.etcd ? dataInfo.etcd.secretName : '',
                              rules: [
                                {
                                  pattern: /^[^\s]*$/,
                                  message: formatMessage({ id: 'placeholder.no_spaces' })
                                }
                              ]
                            })(<Input onChange={this.handleOnChangeSecretName} placeholder={formatMessage({ id: 'enterpriseColony.Advanced.inpiut_Name' })} />)}
                          </Form.Item>
                          <Form.Item
                            {...is_formItemLayout}
                            label={formatMessage({id:'enterpriseColony.Advanced.node'})}
                          >
                            {getFieldDecorator('endpoints', {
                              initialValue: dataInfo.etcd ? dataInfo.etcd.endpoints : '',
                              rules: [
                                {
                                  validator: this.handleValidatorsNodes
                                }
                              ]
                            })(<Etcd valueArr={dataInfo.etcd && dataInfo.etcd.endpoints} onChange={this.handleOnChangeEndpoints} />)}
                          </Form.Item>
                        </Row>
                        {/* 镜像仓库 */}
                        <Row className={styles.row}>
                          <div className={styles.title_name}>
                          {mode == 'helm' ? formatMessage({id:'enterpriseColony.Advanced.mirror'}) : formatMessage({id:'enterpriseColony.cloud.image'})}
                          </div>
                          <Form.Item
                            {...is_formItemLayout}
                            label={formatMessage({id:'enterpriseColony.cloud.image_address'})}
                          >
                            {getFieldDecorator('domain', {
                              initialValue: dataInfo.imageHub ? dataInfo.imageHub.domain : '',
                              rules: [
                                {
                                  pattern: /^[^\s]*$/,
                                  message: formatMessage({ id: 'placeholder.no_spaces' })
                                }
                              ]
                            })(<Input onChange={this.handleOnChangeDomain} placeholder={formatMessage({ id: 'enterpriseColony.Advanced.input_mirror' })} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />)}
                          </Form.Item>
                          <Form.Item
                            {...is_formItemLayout}
                            label={<FormattedMessage id='enterpriseColony.Advanced.namespace' />}
                          >
                            {getFieldDecorator('namespace', {
                              initialValue: dataInfo.imageHub ? dataInfo.imageHub.namespace : '',
                              rules: [
                                {
                                  pattern: /^[^\s]*$/,
                                  message: formatMessage({ id: 'placeholder.no_spaces' })
                                }
                              ]
                            })(
                              <Input onChange={this.handleOnChangeNamespace} placeholder={formatMessage({ id: 'enterpriseColony.Advanced.input_namespace' })} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />
                            )}
                          </Form.Item>
                          <Form.Item
                            {...is_formItemLayout}
                            label={<FormattedMessage id='enterpriseColony.Advanced.user_name' />}
                          >
                            {getFieldDecorator('hub_username', {
                              initialValue: dataInfo.imageHub ? dataInfo.imageHub.username : '',
                              rules: [
                                {
                                  pattern: /^[^\s]*$/,
                                  message: formatMessage({ id: 'placeholder.no_spaces' })
                                }
                              ]
                            })(<Input onChange={this.handleOnChangeUsername} placeholder={formatMessage({ id: 'enterpriseColony.Advanced.input_user_name' })} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />)}
                          </Form.Item>
                          <Form.Item
                            {...is_formItemLayout}
                            label={<FormattedMessage id='enterpriseColony.Advanced.password' />}
                          >
                            {getFieldDecorator('hub_password', {
                              initialValue: dataInfo.imageHub ? dataInfo.imageHub.password : '',
                              rules: [
                                {
                                  pattern: /^[^\s]*$/,
                                  message: formatMessage({ id: 'placeholder.no_spaces' })
                                }
                              ]
                            })(<Input type='password' autoComplete="new-password" onChange={this.handleOnChangePassword} placeholder={formatMessage({ id: 'enterpriseColony.Advanced.input_password' })} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />)}
                          </Form.Item>
                        </Row>
                        {/* 数据库 */}
                        <Row className={styles.row}>
                          <div className={styles.title_name}>
                          {mode == 'helm' ? formatMessage({id:'enterpriseColony.Advanced.access'}) : formatMessage({id:'enterpriseColony.cloud.access'})}
                          </div>
                          <Form.Item
                            {...is_formItemLayout}
                            label={<FormattedMessage id='enterpriseColony.Advanced.address' />}
                          >
                            {/* 控制台数据库 */}
                            {getFieldDecorator('regionDatabase_host', {
                              initialValue: dataInfo.regionDatabase ? dataInfo.regionDatabase.host : '',
                              rules: [
                                {
                                  pattern: /^[^\s]*$/,
                                  message: formatMessage({ id: 'placeholder.no_spaces' })
                                }
                              ]
                            })(<Input onChange={this.handleOnChangeDbHost} placeholder={formatMessage({ id: 'enterpriseColony.Advanced.input_address' })} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />)}
                          </Form.Item>
                          {/* 连接端口 */}
                          <Form.Item
                            {...is_formItemLayout}
                            label={<FormattedMessage id='enterpriseColony.Advanced.port' />}
                          >
                            {/* 控制台数据库 */}
                            {getFieldDecorator('regionDatabase_port', {
                              initialValue: dataInfo.regionDatabase ? dataInfo.regionDatabase.port : '',
                              rules: [
                                {
                                  pattern: /^[^\s]*$/,
                                  message: formatMessage({ id: 'placeholder.no_spaces' })
                                }
                              ]
                            })(<Input onChange={this.handleOnChangeDbPort} placeholder={formatMessage({ id: 'enterpriseColony.Advanced.input_Port' })} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />)}
                          </Form.Item>
                          {/* 用户名 */}
                          <Form.Item
                            {...is_formItemLayout}
                            label={<FormattedMessage id='enterpriseColony.Advanced.user_name' />}
                          >
                            {/* 控制台数据库 */}
                            {getFieldDecorator('regionDatabase_username', {
                              initialValue: dataInfo.regionDatabase ? dataInfo.regionDatabase.username : '',
                              rules: [
                                {
                                  pattern: /^[^\s]*$/,
                                  message: formatMessage({ id: 'placeholder.no_spaces' })
                                }
                              ]
                            })(<Input onChange={this.handleOnChangeDbUsername} placeholder={formatMessage({ id: 'enterpriseColony.Advanced.input_user_Name' })} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />)}
                          </Form.Item>
                          {/* 密码 */}
                          <Form.Item
                            {...is_formItemLayout}
                            label={<FormattedMessage id='enterpriseColony.Advanced.password' />}
                          >
                            {/* 控制台数据库 */}
                            {getFieldDecorator('regionDatabase_password', {
                              initialValue: dataInfo.regionDatabase ? dataInfo.regionDatabase.password : '',
                              rules: [
                                {
                                  pattern: /^[^\s]*$/,
                                  message: formatMessage({ id: 'placeholder.no_spaces' })
                                }
                              ]
                            })(<Input type='password' autoComplete="new-password" onChange={this.handleOnChangeDbPassword} placeholder={formatMessage({ id: 'enterpriseColony.Advanced.input_password' })} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />)}
                          </Form.Item>
                          {/* 数据库名称 */}
                          <Form.Item
                            {...is_formItemLayout}
                            label={<FormattedMessage id='enterpriseColony.Advanced.access_name' />}
                          >
                            {/* 控制台数据库 */}
                            {getFieldDecorator('regionDatabase_dbname', {
                              initialValue: dataInfo.regionDatabase ? dataInfo.regionDatabase.name : '',
                              rules: [
                                {
                                  pattern: /^[^\s]*$/,
                                  message: formatMessage({ id: 'placeholder.no_spaces' })
                                }
                              ]
                            })(
                              <Input onChange={this.handleOnChangeDbName} placeholder={formatMessage({ id: 'enterpriseColony.Advanced.input_access_Name' })} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />
                            )}
                          </Form.Item>
                        </Row>
                        {/* 组件镜像源 */}
                        <Row className={styles.row}>
                          <div className={styles.title_name}>
                            {formatMessage({id:'enterpriseColony.ACksterList.component_image'})}
                          </div>
                          <Form.Item
                            {...is_formItemLayout}
                            label={formatMessage({id:'enterpriseColony.ACksterList.warehouse_address'})}
                          >
                            {/* 仓库地址 */}
                            {getFieldDecorator('mirror_address', {
                              initialValue: dataInfo.rainbondImageRepository || '',
                              rules: [
                                {
                                  pattern: /^[^\s]*$/,
                                  message: formatMessage({ id: 'placeholder.no_spaces' })
                                }
                              ]
                            })(<Input style={{ marginBottom: '36px' }} onChange={this.handleOnChangeMirrorAddress} />)}
                          </Form.Item>
                        </Row>
                      </>}
                    </div>
                  </Col>
                </Card>
              </Col>
              <Col span={12} style={{ paddingLeft: '12px' }}>
                <div className={styles.yamlBox}>
                  <div className={styles.titleYaml}>
                    <span>{formatMessage({id:'enterpriseColony.ACksterList.yaml_file_title'})}</span>
                    <Button
                      onClick={() => {
                        copy(yamlJson)
                        message.success(formatMessage({id:'notification.success.copy'}));
                      }}
                    >
                      {formatMessage({id:'button.copy'})}
                    </Button>
                  </div>
                  <Form.Item>
                    <TextArea value={yamlJson} style={{ height: '632px', overflow: 'auto', border: 'none', color: '#fff' }} disabled rows={46} />
                  </Form.Item>
                </div>

              </Col>
            </Form>
          </Col>
        </PageHeaderLayout >
        {isModal &&
          <CommandModal
            dataObj={this.formObj}
            copyData={yamlJson}
            {...this.props}
            onCancle={this.handleCancleModal}
            onOk={this.handleCancleModal}
          />
        }
      </Fragment>
    );
  }
}
