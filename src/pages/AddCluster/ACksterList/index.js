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
  Collapse
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
      dataObj: {
        operator:{
          env: {
            CONTAINER_RUNTIME: 'docker',
            HELM_TOKEN: ''
          }
        },
        Cluster: {}
      },
      yamlJson: '',
      isModal: false
    };
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
        if(res.create_status){
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
    const { dataObj } = this.state
    const setdDataObj = dataObj
    dispatch({
      type: 'region/fetchHelmToken',
      payload: { eid },
      callback: res => {
        if (res.status_code === 200) {
          if (res.bean) {
            setdDataObj.operator.env.HELM_TOKEN = res.bean
            const yamls = yaml.dump(setdDataObj)
            this.setState({
              dataObj: setdDataObj,
              yamlJson: yamls,
            })
          }
        }
      }
    });
  };
  handleSubmit = () => {
    const { form } = this.props;
    const { dataObj } = this.state;
    form.validateFields((err, values) => {
      let setdDataObj = {
        Cluster: {}
      };

      if (values.runtime || dataObj.operator) {
        setdDataObj.operator = {
          env: {
            CONTAINER_RUNTIME: values.runtime || dataObj.operator.env.variable_name,
            HELM_TOKEN: dataObj.operator.env.HELM_TOKEN
          }
        }
      }

      // 负载均衡
      if (values.gatewayIngressIPs || dataObj.Cluster.gatewayIngressIPs) {
        setdDataObj.Cluster.gatewayIngressIPs = values.gatewayIngressIPs || dataObj.Cluster.gatewayIngressIPs
      }

      // 网关节点
      if (values.nodesForGateway || dataObj.Cluster.nodesForGateway) {
        setdDataObj.Cluster.nodesForGateway = values.nodesForGateway || dataObj.Cluster.nodesForGateway
      }

      // 构建节点
      if (values.nodesForChaos || dataObj.Cluster.nodesForChaos) {
        setdDataObj.Cluster.nodesForChaos = values.nodesForChaos || dataObj.Cluster.nodesForChaos
      }

      // 存储
      if (values.storageClassName1 || dataObj.Cluster.RWX) {
        setdDataObj.Cluster.RWX = {
          config: {
            storageClassName: values.storageClassName1 || dataObj.Cluster.RWX.config.storageClassName
          }
        }
      }

      if (values.storageClassName2 || dataObj.Cluster.RWO) {
        setdDataObj.Cluster.RWO = {
          storageClassName: values.storageClassName2 || dataObj.Cluster.RWO.storageClassName
        }
      }

      // Etcd
      if (values.endpoints || values.secretName || dataObj.Cluster.etcd) {
        setdDataObj.Cluster.etcd = {
          endpoints: values.endpoints.map(item => item.ip) || dataObj.Cluster.etcd.endpoints || [],
          secretName: values.secretName || dataObj.Cluster.etcd.secretName
        }
      }

      // 镜像仓库
      if (values.domain || values.namespace || values.hub_username || values.hub_password || dataObj.Cluster.imageHub) {
        setdDataObj.Cluster.imageHub = {
          domain: values.domain || dataObj.Cluster.imageHub.domain || "",
          namespace: values.namespace || dataObj.Cluster.imageHub.namespace || "",
          username: values.hub_username || dataObj.Cluster.imageHub.username || "",
          password: values.hub_password || dataObj.Cluster.imageHub.password || "",

        }
      }

      // 数据库
      if (values.regionDatabase_host || values.regionDatabase_port || values.regionDatabase_username || values.regionDatabase_password || values.regionDatabase_dbname || dataObj.Cluster.regionDatabase) {
        setdDataObj.Cluster.regionDatabase = {
          host: values.regionDatabase_host || dataObj.Cluster.regionDatabase.host || "",
          port: values.regionDatabase_port || dataObj.Cluster.regionDatabase.port || "",
          username: values.regionDatabase_username || dataObj.Cluster.regionDatabase.username || "",
          password: values.regionDatabase_password || dataObj.Cluster.regionDatabase.password || "",
          dbname: values.regionDatabase_dbname || dataObj.Cluster.regionDatabase.dbname || ""
        }
      }

      // 镜像仓库地址
      if (values.mirror_address || dataObj.Cluster.rainbondImageRepository) {
        setdDataObj.Cluster.rainbondImageRepository = values.mirror_address || dataObj.Cluster.rainbondImageRepository
      }


      const yamls = yaml.dump(setdDataObj)
      console.log(yamls,'yamls')
      this.setState({
        yamlJson: yamls,
        dataObj: setdDataObj
      })
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
        callback();
      } else {
        callback('请填写完整的节点名称');
      }
    } else {
      callback();
    }
  };

  handleClick = e => {
    this.setState({
      menuKey: e.key
    });
  }
  onChangeRunTime = e => {
    const { form: { setFieldsValue } } = this.props
    setFieldsValue({ runtime: e.target.value })
    this.handleSubmit()
  }
  handleOnChangeIp = e => {
    const { form: { setFieldsValue } } = this.props
    const value = e.target.value;
    setFieldsValue({ gatewayIngressIPs: value })
    this.handleSubmit()
  }
  handleOnChangeGateway = e => {
    const { form: { setFieldsValue } } = this.props
    setFieldsValue({ nodesForGateway: e })
    this.handleSubmit()
  }
  handleOnChangeForChaos = e => {
    const { form: { setFieldsValue } } = this.props
    setFieldsValue({ nodesForChaos: e })
    this.handleSubmit()
  }
  handleOnChangeRwx = e => {
    const { form: { setFieldsValue } } = this.props
    const value = e.target.value;
    setFieldsValue({ storageClassName1: value })
    this.handleSubmit()
  }
  handleOnChangeRwo = e => {
    const { form: { setFieldsValue } } = this.props
    const value = e.target.value;
    setFieldsValue({ storageClassName2: value })
    this.handleSubmit()
  }
  handleOnChangeSecretName = e => {
    const { form: { setFieldsValue } } = this.props
    const value = e.target.value;
    setFieldsValue({ secretName: value })
    this.handleSubmit()
  }
  handleOnChangeEndpoints = e => {
    const { form: { setFieldsValue } } = this.props
    setFieldsValue({ endpoints: e })
    this.handleSubmit()
  }
  handleOnChangeDomain = e => {
    const { form: { setFieldsValue } } = this.props
    const value = e.target.value;
    setFieldsValue({ domain: value })
    this.handleSubmit()
  }
  handleOnChangeNamespace = e => {
    const { form: { setFieldsValue } } = this.props
    const value = e.target.value;
    setFieldsValue({ namespace: value })
    this.handleSubmit()
  }
  handleOnChangeUsername = e => {
    const { form: { setFieldsValue } } = this.props
    const value = e.target.value;
    setFieldsValue({ hub_username: value })
    this.handleSubmit()
  }
  handleOnChangePassword = e => {
    const { form: { setFieldsValue } } = this.props
    const value = e.target.value;
    setFieldsValue({ hub_password: value })
    this.handleSubmit()
  }
  handleOnChangeDbHost = e => {
    const { form: { setFieldsValue } } = this.props
    const value = e.target.value;
    setFieldsValue({ regionDatabase_host: value })
    this.handleSubmit()
  }
  handleOnChangeDbPort = e => {
    const { form: { setFieldsValue } } = this.props
    const value = e.target.value;
    setFieldsValue({ regionDatabase_port: value })
    this.handleSubmit()
  }
  handleOnChangeDbUsername = e => {
    const { form: { setFieldsValue } } = this.props
    const value = e.target.value;
    setFieldsValue({ regionDatabase_username: value })
    this.handleSubmit()
  }
  handleOnChangeDbPassword = e => {
    const { form: { setFieldsValue } } = this.props
    const value = e.target.value;
    setFieldsValue({ regionDatabase_password: value })
    this.handleSubmit()
  }
  handleOnChangeDbName = e => {
    const { form: { setFieldsValue } } = this.props
    const value = e.target.value;
    setFieldsValue({ regionDatabase_dbname: value })
    this.handleSubmit()
  }
  handleOnChangeMirrorAddress = e => {
    const { form: { setFieldsValue } } = this.props
    const value = e.target.value;
    setFieldsValue({ mirror_address: value })
    this.handleSubmit()
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
      yamlJson,
      dataObj,
      isModal
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
    const { getFieldDecorator, setFieldsValue } = form;
    const dataInfo = dataObj.Cluster || {};
    const isDisabled = dataInfo.gatewayIngressIPs && dataInfo.nodesForGateway && dataInfo.nodesForChaos;
    return (
      <Fragment>
        <PageHeaderLayout
          title={<FormattedMessage id='enterpriseColony.button.text' />}
          content={<FormattedMessage id='enterpriseColony.PageHeaderLayout.content' />}
          titleSvg={pageheaderSvg.getSvg('clusterSvg', 18)}
        >
          <Col span={24} style={{ padding: '0px 24px', marginBottom: '24px' }}>
            <Form onSubmit={this.handleSubmit} style={{ display: 'flex', justifyContent: 'space-between' }}> 
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
                          <span>基础配置</span>
                        </Menu.Item>
                        <Menu.Item key="advanced">
                          <span>高级配置</span>
                        </Menu.Item>
                      </Menu>
                    </div>
                  </Col>
                  <Col span={20}>
                    <div className={styles.nextBtn}>
                      <Button 
                        onClick={() => {
                          this.handleOpenModal()
                        }} 
                        disabled={!isDisabled} 
                        style={{ float: 'right'}} 
                        type='primary'
                      >
                        下一步
                      </Button>
                    </div>
                    <div className={styles.basics}>
                      {menuKey == 'basics' && <>
                        <Row className={styles.row}>
                          <div className={styles.title_name}>
                            运行时
                          </div>
                          <Form.Item
                            {...is_formItemLayout}
                            label="选择运行时"
                          >
                            {getFieldDecorator('runtime', {
                              initialValue: dataObj.operator.env.CONTAINER_RUNTIME || 'docker',
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
                            负载均衡 <span>*</span>
                          </div>
                          <Form.Item
                            {...is_formItemLayout}
                            label="IP地址"
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
                              <Input onChange={this.handleOnChangeIp} />
                            )}
                          </Form.Item>
                        </Row>
                        <Row className={styles.row}>
                          <div className={styles.title_name}>
                            网关节点 <span>*</span>
                          </div>
                          <Form.Item
                            {...is_formItemLayout}
                            label="节点IP"
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
                            构建节点 <span>*</span>
                          </div>
                          <Form.Item
                            {...is_formItemLayout}
                            label="节点名称"
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
                            存储
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
                            label="secret名称"
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
                            label="节点名称"
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
                            镜像仓库
                          </div>
                          <Form.Item
                            {...is_formItemLayout}
                            label={'域名'}
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
                            })(<Input onChange={this.handleOnChangePassword} placeholder={formatMessage({ id: 'enterpriseColony.Advanced.input_password' })} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />)}
                          </Form.Item>
                        </Row>
                        {/* 数据库 */}
                        <Row className={styles.row}>
                          <div className={styles.title_name}>
                            数据库
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
                            })(<Input onChange={this.handleOnChangeDbPassword} placeholder={formatMessage({ id: 'enterpriseColony.Advanced.input_password' })} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />)}
                          </Form.Item>
                          {/* 数据库名称 */}
                          <Form.Item
                            {...is_formItemLayout}
                            label={<FormattedMessage id='enterpriseColony.Advanced.access_name' />}
                          >
                            {/* 控制台数据库 */}
                            {getFieldDecorator('regionDatabase_dbname', {
                              initialValue: dataInfo.regionDatabase ? dataInfo.regionDatabase.dbname : '',
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
                            组件镜像源
                          </div>
                          <Form.Item
                            {...is_formItemLayout}
                            label={'仓库地址'}
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
                            })(<Input style={{marginBottom: '36px'}} onChange={this.handleOnChangeMirrorAddress} />)}
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
                    <span>Yaml 预览</span>
                    <Button
                      onClick={() => {
                        copy(yamlJson)
                        message.success('复制成功');
                      }}
                    >
                      复制
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
            dataObj={dataObj}
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
