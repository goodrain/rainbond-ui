/* eslint-disable no-nested-ternary */
/* eslint-disable react/sort-comp */
import NewbieGuiding from '@/components/NewbieGuiding';
import {
  Alert,
  Button,
  Checkbox,
  Col,
  Form,
  Modal,
  notification,
  Typography,
  Collapse,
  Input,
  Row,
  AutoComplete,
  Radio,
  Switch,
  Tooltip,
  Card
} from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import cloud from '../../../utils/cloud';
import globalUtil from '../../../utils/global';
import yaml from 'js-yaml'
import SelectNode from '../../SelectNode';
import Result from '../../../components/Result';
import ConfirmModal from '../../../components/ConfirmModal';
import styles from './index.less';


const { Panel } = Collapse;
const { Paragraph } = Typography;

@connect(({ global }) => ({
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise
}))
@Form.create()
export default class RainbondClusterInit extends PureComponent {
  constructor(props) {
    super(props);
    this.timer = null;
    this.state = {
      checked: false,
      loading: false,
      task: null,
      isComponents: false,
      guideStep: 10,
      ipArray: [],
      isStorage: 'default',
      isImage: 'default',
      isDatabase: 'default',
      isMirror: 'default',
      isEctype: 'default',
      installLoading: false,
      showhandleSubmitModal: false
    };
  }
  componentDidMount() {
    this.handelClusterInfo();
    const {type} = this.props
    if(type == 'installing'){
      this.setState({
        installLoading: true
      })
      this.toClusterList()
    }

  }
  componentWillUnmount() {
    this.closeTimer()
  }
  closeTimer = () => {
    if (this.timer) {
      clearInterval(this.timer);
    }
  };
  handleTimers = (timerName, callback, times) => {
    this[timerName] = setTimeout(() => {
      callback();
    }, times);
  };
  toClusterList = () => {
    const {
      dispatch,
      completeInit
    } = this.props;
    dispatch({
      type: 'region/fetchClusterInfo',
      callback: res => {
        if (res && res.status_code === 200) {
          const status = res.bean.create_status;
          if(status == 'installing'){
            this.setState({
              installLoading: true
            },()=>{
              this.handleTimers(
                'timer',
                () => {
                  this.toClusterList();
                },
                2000
              );
            })
          }else{
            if (this.timer) {
              clearInterval(this.timer);
            }
            completeInit && completeInit()
          }
         
      }
      }
    });

  };
  handelClusterInfo = () => {
    const {
      dispatch,
      clusterID,
      selectProvider,
      eid,
      rainbondInfo,
      enterprise,
      nextStep
    } = this.props;
    dispatch({
      type: 'region/fetchClusterNodeInfo',
      callback: res => {
        if (res && res.status_code === 200) {
          const arr = res.response_data.data.list.map(item => {
            return { node_name: item, host: item }
          })
          this.setState({
            ipArray: arr
          })
        }
      }
    })
  };
  handleSubmit = () => {
    const { form, eid, clusterID, nextStep, dispatch, completeInit } = this.props;
    const { ipArray } = this.state;
    form.validateFields((err, values) => {
      let dataObj = {
        Component:{rbd_app_ui:{enable: false}},
        Cluster: {
          rainbondImageRepository: 'registry.cn-hangzhou.aliyuncs.com/goodrain',
          containerdRuntimePath: '/var/run/k3s/containerd',
        }
      };
      if (!err) {
        this.setState({
          installLoading: true,
          showhandleSubmitModal: false
        })
        if (values.gatewayIngressIPs) {
          dataObj.Cluster.gatewayIngressIPs = values.gatewayIngressIPs
        }

        if (values.nodesForGateway) {
          const gatewayArr = [];
          for (let i = 0; i < values.nodesForGateway.length; i++) {
            for (let j = 0; j < ipArray.length; j++) {
              if (values.nodesForGateway[i].name === ipArray[j].node_name) {
                // 合并两个对象
                let mergedObject = {
                  name: values.nodesForGateway[i].name,
                  externalIP: ipArray[j].host,
                  internalIP: ipArray[j].host,
                };
                gatewayArr.push(mergedObject);
              }
            }
          }
          dataObj.Cluster.nodesForGateway = gatewayArr
        }
        if (values.nodesForChaos) {
          const forChaos = [];
          for (let i = 0; i < values.nodesForChaos.length; i++) {
            let nodesChaos = {
              name: values.nodesForChaos[i].name,
            };
            forChaos.push(nodesChaos);
          }
          dataObj.Cluster.nodesForChaos = forChaos
        }

        if (values.image == 'custom') {
          dataObj.Cluster.imageHub = {
            enable: true,
            domain: values.domain,
            namespace: values.namespace,
            username: values.username,
            password: values.password
          }
        }
        if (values.database == 'custom') {
          dataObj.Cluster.regionDatabase = {
            enable: true,
            host: values.regionDatabase_host,
            port: Number(values.regionDatabase_port),
            username: values.regionDatabase_username,
            password: values.regionDatabase_password,
            name: values.regionDatabase_dbname
          }
        }
        if (values.mirror == 'custom') {
          dataObj.Cluster.rainbondImageRepository = values.mirror_address
        }
        dataObj.Cluster.enableEnvCheck = false
        const yamls = yaml.dump(dataObj)
        dispatch({
          type: 'region/installCluster',
          payload: {
            value_yaml: yamls
          },
          callback: res => {
            if (res && res.status_code === 200) {
              notification.success({ message: formatMessage({id:'enterpriseColony.newHostInstall.node.initializeSuccess'}) })
              completeInit && completeInit()
            } else {
              this.setState({
                installLoading: false
              })
              notification.error({ message: formatMessage({id:'enterpriseColony.newHostInstall.node.initializeLose'}) })
            }
          },
          handleError: err => {
            this.setState({
              installLoading: false
            })
            notification.error({ message: formatMessage({id:'enterpriseColony.newHostInstall.node.initializeLose'}) })
          }
        })
      }
    });
  };
  handleNewbieGuiding = info => {
    const { prevStep, nextStep, handleClick = () => { } } = info;
    return (
      <NewbieGuiding
        {...info}
        totals={14}
        handleClose={() => {
          this.handleGuideStep('close');
        }}
        handlePrev={() => {
          if (prevStep) {
            this.handleGuideStep(prevStep);
          }
        }}
        handleNext={() => {
          if (nextStep) {
            handleClick();
            this.handleGuideStep(nextStep);
          }
        }}
      />
    );
  };
  handleGuideStep = guideStep => {
    this.setState({
      guideStep
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
  hanldeStorageChange = (e) => {
    this.setState({ isStorage: e.target.value });
  }
  hanldeImageChange = (e) => {
    this.setState({ isImage: e.target.value });
  }
  hanldeDatabaseChange = (e) => {
    this.setState({ isDatabase: e.target.value });
  }
  hanldeMirrorChange = (e) => {
    this.setState({ isMirror: e.target.value });
  }
  hanldeEctypeChange = (e) => {
    this.setState({ isEctype: e.target.value });
  }
  onCancelSubmit = () => {
    this.setState({
      showhandleSubmitModal: false
    })
  }
  render() {
    const { preStep, eid, selectProvider, form, clusterID } = this.props;
    const {
      task,
      initconfig,
      isComponents,
      guideStep,
      checked,
      ipArray,
      isStorage,
      isImage,
      isDatabase,
      isMirror,
      isEctype,
      installLoading,
      showhandleSubmitModal
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
        xs: { span: 2 },
        sm: { span: 2 }
      },
      wrapperCol: {
        xs: { span: 8 },
        sm: { span: 8 }
      }
    };
    const { getFieldDecorator, setFieldsValue } = form;
    const highlighted =
      guideStep === 10
        ? {
          position: 'relative',
          zIndex: 1000,
          padding: '0 16px',
          margin: '0 -16px',
          background: '#fff'
        }
        : {};
    return (
      <div>
        {!installLoading ?
          <Form>
            <Col span={24}>
              <Form onSubmit={this.handleSubmit}>
                {/* 基础配置说明 */}
                <Collapse className={styles.basics} expandIconPosition='right' defaultActiveKey={['basics']}>
                  <Panel
                    header={
                      <span className={styles.spanBox}>
                        <span className={styles.panelTitle} style={{ color: '#000' }}>{formatMessage({ id: 'enterpriseColony.RainbondClusterInit.collapse.basics' })}</span>
                      </span>}
                    key="basics"
                  >
                    <Row className={styles.row}>
                      <div className={styles.title_name}>
                        {formatMessage({ id: 'enterpriseColony.RainbondClusterInit.row.title.gatewayIngressIPs' })}
                        <Tooltip
                          placement="right"
                          title={<div>
                            {formatMessage({ id: 'enterpriseColony.RainbondClusterInit.row.tip.gatewayIngressIPs' })}
                          </div>}
                        >
                          <div>
                            {globalUtil.fetchSvg('tip')}
                          </div>
                        </Tooltip>
                      </div>
                      <Form.Item
                        {...is_formItemLayout}
                        label={formatMessage({ id: 'enterpriseColony.RainbondClusterInit.form.label.gatewayIngressIPs' })}
                      >
                        {getFieldDecorator('gatewayIngressIPs', {
                          rules: [
                            {
                              required: true,
                              message: formatMessage({ id: 'enterpriseColony.ACksterList.input_ip' })
                            },
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
                          <AutoComplete>
                            {(ipArray && ipArray.length > 0)
                              ? ipArray.map((item) => {
                                const res = (
                                  <AutoComplete.Option value={item.host}>
                                    {item.host}
                                  </AutoComplete.Option>
                                );
                                return res;
                              })
                              : null}
                          </AutoComplete>)}
                      </Form.Item>
                    </Row>
                    <Row className={styles.row}>
                      <div className={styles.title_name}>
                        {formatMessage({ id: 'enterpriseColony.RainbondClusterInit.row.title.nodesForGateway' })}
                        <Tooltip
                          placement="right"
                          title={<div>
                            {formatMessage({ id: 'enterpriseColony.RainbondClusterInit.row.tip.nodesForGateway' })}
                          </div>}
                        >
                          <div>
                            {globalUtil.fetchSvg('tip')}
                          </div>
                        </Tooltip>
                      </div>
                      <Form.Item
                        {...is_formItemLayout}
                        label={formatMessage({ id: 'enterpriseColony.RainbondClusterInit.form.label.nodesForGateway' })}
                      >
                        {getFieldDecorator('nodesForGateway', {
                          rules: [
                            {
                              required: true,
                              message: formatMessage({ id: 'enterpriseColony.ACksterList.input_ip' })
                            },
                            {
                              validator: this.handleValidatorsNodes
                            }
                          ]
                        })(<SelectNode type='1' keys='gateway' ipArr={ipArray} />)}
                      </Form.Item>
                    </Row>
                    <Row className={styles.row}>
                      <div className={styles.title_name}>
                        {formatMessage({ id: 'enterpriseColony.RainbondClusterInit.row.title.nodesForChaos' })}
                        <Tooltip
                          placement="right"
                          title={<div>
                            {formatMessage({ id: 'enterpriseColony.RainbondClusterInit.row.tip.nodesForChaos' })}
                          </div>}
                        >
                          <div>
                            {globalUtil.fetchSvg('tip')}
                          </div>
                        </Tooltip>
                      </div>
                      <Form.Item
                        {...is_formItemLayout}
                        label={formatMessage({ id: 'enterpriseColony.RainbondClusterInit.form.label.nodesForChaos' })}
                      >
                        {getFieldDecorator('nodesForChaos', {
                          rules: [
                            {
                              required: true,
                              message: formatMessage({ id: 'enterpriseColony.ACksterList.input_ip' })
                            },
                            {
                              validator: this.handleValidatorsNodes
                            }
                          ]
                        })(<SelectNode type='1' keys='chaos' ipArr={ipArray} />)}
                      </Form.Item>
                    </Row>
                  </Panel>
                </Collapse>

                {/* 高级配置说明 */}
                <Collapse className={styles.basics} style={{ marginTop: '24px' }} expandIconPosition='right'>
                  <Panel
                    header={
                      <span className={styles.spanBox}>
                        <span className={styles.panelTitle} style={{ color: '#000' }}>{formatMessage({ id: 'enterpriseColony.RainbondClusterInit.collapse.advanced' })}</span>
                      </span>}
                    key="advanced"
                  >
                    {/* 镜像仓库 */}
                    <Row className={styles.row}>
                      <div className={styles.row_flex}>
                        <div className={styles.title_name}>
                          {formatMessage({ id: 'enterpriseColony.RainbondClusterInit.row.title.image' })}
                          <Tooltip
                            placement="right"
                            title={<div>
                              {formatMessage({ id: 'enterpriseColony.RainbondClusterInit.row.tip.image' })}
                            </div>}
                          >
                            <div>
                              {globalUtil.fetchSvg('tip')}
                            </div>
                          </Tooltip>
                        </div>
                        <Form.Item
                          {...formItemLayout}
                        >
                          {getFieldDecorator('image', {
                            initialValue: isImage
                          })(
                            <Radio.Group onChange={this.hanldeImageChange}>
                              <Radio value="default">{formatMessage({ id: 'enterpriseColony.RainbondClusterInit.radio.default' })}</Radio>
                              <Radio value="custom">{formatMessage({ id: 'enterpriseColony.RainbondClusterInit.radio.custom' })}</Radio>
                            </Radio.Group>
                          )}
                        </Form.Item>
                      </div>
                      {isImage == 'custom' &&
                        <>
                          <Form.Item
                            {...is_formItemLayout}
                            label={<FormattedMessage id='enterpriseColony.Advanced.mirror_name' />}
                          >
                            {getFieldDecorator('domain', {
                              rules: [
                                {
                                  required: true,
                                  message: formatMessage({ id: 'enterpriseColony.Advanced.add_mirror' })
                                },
                                {
                                  pattern: /^[^\s]*$/,
                                  message: formatMessage({ id: 'placeholder.no_spaces' })
                                }
                              ]
                            })(<Input placeholder={formatMessage({ id: 'enterpriseColony.Advanced.input_mirror' })} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />)}
                          </Form.Item>
                          <Form.Item
                            {...is_formItemLayout}
                            label={<FormattedMessage id='enterpriseColony.Advanced.namespace' />}
                          >
                            {getFieldDecorator('namespace', {
                              rules: [
                                {
                                  required: true,
                                  message: formatMessage({ id: 'enterpriseColony.Advanced.input_namespace' })
                                },
                                {
                                  pattern: /^[^\s]*$/,
                                  message: formatMessage({ id: 'placeholder.no_spaces' })
                                }
                              ]
                            })(
                              <Input placeholder={formatMessage({ id: 'enterpriseColony.Advanced.input_namespace' })} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />
                            )}
                          </Form.Item>
                          <Form.Item
                            {...is_formItemLayout}
                            label={<FormattedMessage id='enterpriseColony.Advanced.user_name' />}
                          >
                            {getFieldDecorator('username', {
                              rules: [
                                {
                                  required: true,
                                  message: formatMessage({ id: 'enterpriseColony.Advanced.input_user_name' })
                                },
                                {
                                  pattern: /^[^\s]*$/,
                                  message: formatMessage({ id: 'placeholder.no_spaces' })
                                }
                              ]
                            })(<Input placeholder={formatMessage({ id: 'enterpriseColony.Advanced.input_user_name' })} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />)}
                          </Form.Item>
                          <Form.Item
                            {...is_formItemLayout}
                            label={<FormattedMessage id='enterpriseColony.Advanced.password' />}
                          >
                            {getFieldDecorator('password', {
                              rules: [
                                {
                                  required: true,
                                  message: formatMessage({ id: 'enterpriseColony.Advanced.input_password' })
                                },
                                {
                                  pattern: /^[^\s]*$/,
                                  message: formatMessage({ id: 'placeholder.no_spaces' })
                                }
                              ]
                            })(<Input.Password type="password" placeholder={formatMessage({ id: 'enterpriseColony.Advanced.input_password' })} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />)}
                          </Form.Item>
                        </>}
                    </Row>
                    {/* 数据库 */}
                    <Row className={styles.row}>
                      <div className={styles.row_flex}>
                        <div className={styles.title_name}>
                          {formatMessage({ id: 'enterpriseColony.RainbondClusterInit.row.title.database' })}
                          <Tooltip
                            placement="right"
                            title={<div>
                              {formatMessage({ id: 'enterpriseColony.RainbondClusterInit.row.tip.database' })}
                            </div>}
                          >
                            <div>
                              {globalUtil.fetchSvg('tip')}
                            </div>
                          </Tooltip>
                        </div>
                        <Form.Item
                          {...formItemLayout}
                        >
                          {getFieldDecorator('database', {
                            initialValue: isDatabase
                          })(
                            <Radio.Group onChange={this.hanldeDatabaseChange}>
                              <Radio value="default">{formatMessage({ id: 'enterpriseColony.RainbondClusterInit.radio.default' })}</Radio>
                              <Radio value="custom">{formatMessage({ id: 'enterpriseColony.RainbondClusterInit.radio.custom' })}</Radio>
                            </Radio.Group>
                          )}
                        </Form.Item>
                      </div>
                      {isDatabase == 'custom' &&
                        <>
                          <Form.Item
                            {...is_formItemLayout}
                            label={<FormattedMessage id='enterpriseColony.Advanced.address' />}
                          >
                            {/* 控制台数据库 */}
                            {getFieldDecorator('regionDatabase_host', {
                              rules: [
                                {
                                  required: true,
                                  message: formatMessage({ id: 'enterpriseColony.Advanced.input_address' })
                                },
                                {
                                  pattern: /^[^\s]*$/,
                                  message: formatMessage({ id: 'placeholder.no_spaces' })
                                }
                              ]
                            })(<Input placeholder={formatMessage({ id: 'enterpriseColony.Advanced.input_address' })} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />)}
                          </Form.Item>
                          {/* 连接端口 */}
                          <Form.Item
                            {...is_formItemLayout}
                            label={<FormattedMessage id='enterpriseColony.Advanced.port' />}
                          >
                            {/* 控制台数据库 */}
                            {getFieldDecorator('regionDatabase_port', {
                              rules: [
                                {
                                  required: true,
                                  message: formatMessage({ id: 'enterpriseColony.Advanced.input_port' })
                                },
                                {
                                  pattern: /^[^\s]*$/,
                                  message: formatMessage({ id: 'placeholder.no_spaces' })
                                }
                              ]
                            })(<Input placeholder={formatMessage({ id: 'enterpriseColony.Advanced.input_Port' })} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />)}
                          </Form.Item>
                          {/* 用户名 */}
                          <Form.Item
                            {...is_formItemLayout}
                            label={<FormattedMessage id='enterpriseColony.Advanced.user_name' />}
                          >
                            {/* 控制台数据库 */}
                            {getFieldDecorator('regionDatabase_username', {
                              rules: [
                                {
                                  required: true,
                                  message: formatMessage({ id: 'enterpriseColony.Advanced.input_user_name' })
                                },
                                {
                                  pattern: /^[^\s]*$/,
                                  message: formatMessage({ id: 'placeholder.no_spaces' })
                                }
                              ]
                            })(<Input placeholder={formatMessage({ id: 'enterpriseColony.Advanced.input_user_Name' })} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />)}
                          </Form.Item>
                          {/* 密码 */}
                          <Form.Item
                            {...is_formItemLayout}
                            label={<FormattedMessage id='enterpriseColony.Advanced.password' />}
                          >
                            {/* 控制台数据库 */}
                            {getFieldDecorator('regionDatabase_password', {
                              rules: [
                                {
                                  required: true,
                                  message: formatMessage({ id: 'enterpriseColony.Advanced.input_password' })
                                },
                                {
                                  pattern: /^[^\s]*$/,
                                  message: formatMessage({ id: 'placeholder.no_spaces' })
                                }
                              ]
                            })(<Input.Password type="password" placeholder={formatMessage({ id: 'enterpriseColony.Advanced.input_password' })} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />)}
                          </Form.Item>
                          {/* 数据库名称 */}
                          <Form.Item
                            {...is_formItemLayout}
                            label={<FormattedMessage id='enterpriseColony.Advanced.access_name' />}
                          >
                            {/* 控制台数据库 */}
                            {getFieldDecorator('regionDatabase_dbname', {
                              rules: [
                                {
                                  required: true,
                                  message: formatMessage({ id: 'enterpriseColony.Advanced.input_access_name' })
                                },
                                {
                                  pattern: /^[^\s]*$/,
                                  message: formatMessage({ id: 'placeholder.no_spaces' })
                                }
                              ]
                            })(
                              <Input placeholder={formatMessage({ id: 'enterpriseColony.Advanced.input_access_Name' })} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />
                            )}
                          </Form.Item>
                        </>}
                    </Row>
                    {/* 组件镜像源 */}
                    <Row className={styles.row}>
                      <div className={styles.row_flex}>
                        <div className={styles.title_name}>
                          {formatMessage({ id: 'enterpriseColony.RainbondClusterInit.row.title.mirror' })}
                          <Tooltip
                            placement="right"
                            title={<div>
                              {formatMessage({ id: 'enterpriseColony.RainbondClusterInit.row.tip.mirror' })}
                            </div>}
                          >
                            <div>
                              {globalUtil.fetchSvg('tip')}
                            </div>
                          </Tooltip>
                        </div>
                        <Form.Item
                          {...formItemLayout}
                        >
                          {getFieldDecorator('mirror', {
                            initialValue: isMirror
                          })(
                            <Radio.Group onChange={this.hanldeMirrorChange}>
                              <Radio value="default">{formatMessage({ id: 'enterpriseColony.RainbondClusterInit.radio.default' })}</Radio>
                              <Radio value="custom">{formatMessage({ id: 'enterpriseColony.RainbondClusterInit.radio.custom' })}</Radio>
                            </Radio.Group>
                          )}
                        </Form.Item>
                      </div>
                      {isMirror == 'custom' &&
                        <Form.Item
                          {...is_formItemLayout}
                          label={formatMessage({ id: 'enterpriseColony.RainbondClusterInit.form.label.mirror_address' })}
                        >
                          {/* 仓库地址 */}
                          {getFieldDecorator('mirror_address', {
                            rules: [
                              {
                                required: true,
                                message: formatMessage({ id: 'enterpriseColony.RainbondClusterInit.input.mirror_address.desc' })
                              },
                              {
                                pattern: /^[^\s]*$/,
                                message: formatMessage({ id: 'placeholder.no_spaces' })
                              }
                            ]
                          })(<Input placeholder={formatMessage({ id: 'enterpriseColony.RainbondClusterInit.input.mirror_address.desc' })} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />)}
                        </Form.Item>}
                    </Row>
                  </Panel>
                </Collapse>
              </Form>
            </Col>
            <Col style={{ textAlign: 'center', marginTop: '32px' }} span={24}>
              <Fragment>
                <Button onClick={preStep} style={{ marginRight: '16px' }}>
                  <FormattedMessage id='button.previous' />
                </Button>
                <Button
                  onClick={() => { this.setState({ showhandleSubmitModal: true }) }}
                  type="primary"
                >
                  <FormattedMessage id='enterpriseColony.RainbondClusterInit.start' />
                </Button>
              </Fragment>
              {guideStep === 11 &&
                this.handleNewbieGuiding({
                  tit: formatMessage({ id: 'enterpriseColony.RainbondClusterInit.start' }),
                  desc: formatMessage({ id: 'enterpriseColony.RainbondClusterInit.configuration' }),
                  send: true,
                  configName: 'kclustersAttentionAttention',
                  nextStep: 12,
                  conPosition: { left: '63%', bottom: '-39px' },
                  svgPosition: { left: '58%', marginTop: '-13px' },
                  handleClick: () => {
                    this.handleSubmit();
                  }
                })}
            </Col>
          </Form>
          :
          <Card>
            <Result
              type="ing"
              title={ formatMessage({id:'enterpriseColony.newHostInstall.node.initialize'})}
              description={ formatMessage({id:'enterpriseColony.newHostInstall.node.await'})}
              style={{ padding: '48px' }}
            />
          </Card>}
        {showhandleSubmitModal && (
          <ConfirmModal
            onOk={this.handleSubmit}
            title={ formatMessage({id:'enterpriseColony.newHostInstall.node.initializeCluster'})}
            desc={ formatMessage({id:'enterpriseColony.newHostInstall.node.verifyCluster'})}
            onCancel={this.onCancelSubmit}
          />
        )}
      </div>
    );
  }
}
