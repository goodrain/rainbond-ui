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
  Switch
} from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import {
  getRainbondClusterConfig,
  setRainbondClusterConfig
} from '../../../services/cloud';
import cloud from '../../../utils/cloud';
import globalUtil from '../../../utils/global';
import CodeMirrorForm from '../../CodeMirrorForm';
import ClusterComponents from '../ClusterComponents';
import InitRainbondDetail from '../ShowInitRainbondDetail';
import yaml from 'js-yaml'
import SelectNode from './selectNode';
import Etcd from '../../../pages/AddCluster/component/etcd';
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
      isEctype: 'default'
    };
  }
  componentDidMount() {
    const storedJsonString = window.localStorage.getItem("ipAddresses");
    const storedIpAddressArray = JSON.parse(storedJsonString);
    this.setState({ ipArray: storedIpAddressArray });
    this.loadTask();
  }

  initRainbondCluster = () => {
    const {
      dispatch,
      clusterID,
      selectProvider,
      eid,
      rainbondInfo,
      enterprise
    } = this.props;
    const { task } = this.state;
    this.setState({ loading: true });
    dispatch({
      type: 'cloud/initRainbondRegion',
      payload: {
        enterprise_id: eid,
        providerName: selectProvider,
        clusterID,
        retry: task && task.status === 'complete'
      },
      callback: data => {
        if (data) {
          globalUtil.putInstallClusterLog(enterprise, rainbondInfo, {
            eid,
            taskID: data.taskID,
            status: 'start',
            install_step: 'createRainbond',
            provider: selectProvider
          });
          this.setState({
            loading: false,
            task: data,
            showInitDetail: true
          });
        }
      },
      handleError: res => {
        if (res && res.data && res.data.code === 7005) {
          this.setState({
            loading: false,
            showInitDetail: true,
            task: res.data.data
          });
          return;
        }
        cloud.handleCloudAPIError(res);
      }
    });

  };

  loadTask = noopen => {
    const {
      dispatch,
      eid,
      clusterID,
      selectProvider,
      completeInit
    } = this.props;
    dispatch({
      type: 'cloud/loadInitRainbondTask',
      payload: {
        enterprise_id: eid,
        clusterID,
        providerName: selectProvider
      },
      callback: res => {
        if (
          res &&
          res.status_code === 200 &&
          res.response_data &&
          res.response_data.data
        ) {
          const { data } = res.response_data;
          this.setState({ task: data });
          if (data.status === 'inited') {
            if (completeInit) {
              completeInit(data);
            }
          } else if (data.status === 'complete') {
            // init failure
          } else if (!noopen) {
            this.setState({ showInitDetail: true });
          }
        }
      },
      handleError: res => {
        if (res && res.data && res.data.code === 404) {
          return;
        }
        cloud.handleCloudAPIError(res);
        this.setState({ loading: false });
      }
    });
  };

  cancelShowInitDetail = () => {
    this.setState({ showInitDetail: false });
    this.loadTask(true);
  };

  setChecked = val => {
    this.setState({ checked: val.target.checked });
  };
  showSetRainbondCluster = () => {
    const { eid, clusterID } = this.props;
    getRainbondClusterConfig({ enterprise_id: eid, clusterID }, res => {
      if (res && res.data && res.data.code === 404) {
        return;
      }
      cloud.handleCloudAPIError(res);
    }).then(re => {
      this.setState({ showClusterInitConfig: true, initconfig: re.config });
    });
  };
  handleSubmit = () => {
    const { form, eid, clusterID } = this.props;
    const { ipArray } = this.state;
    form.validateFields((err, values) => {
      let dataObj = {
        apiVersion: 'rainbond.io/v1alpha1',
        kind: 'RainbondCluster',
        metadata: {
          name: 'rainbondcluster',
          namespace: 'rbd-system'
        },
        spec: {}
      };
      if (!err) {
        if (values.gatewayIngressIPs) {
          dataObj.spec.gatewayIngressIPs = values.gatewayIngressIPs
        }

        if (values.nodesForGateway) {
          const gatewayArr = [];
          for (let i = 0; i < values.nodesForGateway.length; i++) {
            for (let j = 0; j < ipArray.length; j++) {
              if (values.nodesForGateway[i].name === ipArray[j].ip) {
                // 合并两个对象
                let mergedObject = {
                  name: values.nodesForGateway[i].name,
                  internalIP: ipArray[j].internalIP,
                  externalIP: ipArray[j].ip
                };
                gatewayArr.push(mergedObject);
              }
            }
          }
          dataObj.spec.nodesForGateway = gatewayArr
        }
        if (values.nodesForChaos) {
          dataObj.spec.nodesForChaos = values.nodesForChaos
        }
        if (values.isEtcd == 'custom') {
          dataObj.spec.etcdConfig = {
            endpoints: values.endpoints.map(item => item.ip)
          }
          dataObj.spec.etcdConfig = {
            secretName: values.secretName
          }
        }
        if (values.advanced) {
          dataObj.spec.enableHA = true
        } else {
          dataObj.spec.enableHA = false
        }
        if (values.image == 'custom') {
          dataObj.spec.imageHub = {
            domain: values.domain
          }

          dataObj.spec.imageHub = {
            namespace: values.namespace
          }
          dataObj.spec.imageHub = {
            username: values.username
          }
          dataObj.spec.imageHub = {
            password: values.password
          }
        }
        if (values.isStorage == 'custom') {
          dataObj.spec.rainbondVolumeSpecRWX = {
            storageClassName: values.storageClassName1
          }
          dataObj.spec.rainbondVolumeSpecRWO = {
            storageClassName: values.storageClassName2
          }
        }
        if (values.database == 'custom') {
          dataObj.spec.regionDatabase = {
            host: values.regionDatabase_host,
            port: values.regionDatabase_port,
            username: values.regionDatabase_username,
            password: values.regionDatabase_password,
            dbname: values.regionDatabase_dbname
          }
        }
        if (values.mirror == 'custom') {
          dataObj.spec.rainbondImageRepository = values.mirror_address
        }
        if (values.ectype == 'custom') {
          dataObj.spec.replicas = Number(values.replicas)
        }

        const yamls = yaml.dump(dataObj)
        setRainbondClusterConfig({ 
          enterprise_id: eid, 
          clusterID, 
          config: yamls 
        }).then(res => {
          if (res && res.status_code === 200) {
            this.initRainbondCluster()
          }
        });
      }
    });
  };
  handleIsComponents = isComponents => {
    this.setState({
      isComponents
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
  hanldeEtcdChange = (e) => {
    this.setState({ isEtcd: e.target.value });
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
  render() {
    const { preStep, eid, selectProvider, form, clusterID } = this.props;
    const {
      showInitDetail,
      loading,
      task,
      showClusterInitConfig,
      initconfig,
      isComponents,
      guideStep,
      checked,
      ipArray,
      isStorage,
      isEtcd,
      isImage,
      isDatabase,
      isMirror,
      isEctype
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
        xs: { span: 6 },
        sm: { span: 6 }
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
    const showComponent = (selectProvider === 'rke' ||
      selectProvider === 'custom') && (
        <Button
          style={{ marginRight: '16px' }}
          onClick={() => this.handleIsComponents(true)}
        >
          <FormattedMessage id='enterpriseColony.RainbondClusterInit.look' />
        </Button>
      );
    return (
      <Form>
        <Col span={24}>
          <Form onSubmit={this.handleSubmit}>
            {/* 基础配置说明 */}
            <Collapse className={styles.basics} expandIconPosition='right' defaultActiveKey={['basics']}>
              <Panel
                header={
                  <span className={styles.spanBox}>
                    <span className={styles.panelTitle} style={{ color: '#000' }}>基础配置说明</span>
                    {/* <span className={styles.panelSpan}>
                        {formatMessage({ id: 'enterpriseColony.import.recognition.port.desc' })}
                    </span> */}
                  </span>}
                key="basics"
              >
                <Row className={styles.row}>
                  <div className={styles.title_name}>
                    负载均衡
                  </div>
                  <Form.Item
                    {...is_formItemLayout}
                    label="IP地址"
                    className={styles.antd_form}
                  // extra={<FormattedMessage id='enterpriseColony.ACksterList.open_ip' />}
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
                        {(ipArray.length > 0)
                          ? ipArray.map((item) => {
                            const res = (
                              <AutoComplete.Option value={item.ip}>
                                {item.ip}
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
                    网关节点
                  </div>
                  <Form.Item
                    {...is_formItemLayout}
                    label="公网IP"
                    className={styles.antd_form}
                  // extra={<FormattedMessage id='enterpriseColony.ACksterList.open_ip' />}
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
                    })(<SelectNode keys='gateway' ipArr={ipArray} />)}
                  </Form.Item>
                </Row>
                <Row className={styles.row}>
                  <div className={styles.title_name}>
                    构建节点
                  </div>
                  <Form.Item
                    {...is_formItemLayout}
                    label="节点名称"
                    className={styles.antd_form}
                  // extra={<FormattedMessage id='enterpriseColony.ACksterList.open_ip' />}
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
                    })(<SelectNode keys='chaos' ipArr={ipArray} />)}
                  </Form.Item>
                </Row>
                <Row className={styles.row}>
                  <div className={styles.title_name}>
                    存储
                  </div>
                  <Form.Item
                    {...is_formItemLayout}
                    label="选择存储"
                    className={styles.antd_form}
                  // extra={<FormattedMessage id='enterpriseColony.ACksterList.open_ip' />}
                  >
                    {getFieldDecorator('isStorage', {
                      initialValue: isStorage
                    })(
                      <Radio.Group onChange={this.hanldeStorageChange}>
                        <Radio value="default">默认</Radio>
                        <Radio value="custom">自定义</Radio>
                      </Radio.Group>
                    )}
                  </Form.Item>
                  {isStorage == 'custom' &&
                    <Form.Item
                      {...is_formItemLayout}
                      label="RWX"
                      className={styles.antd_form}
                    // extra={<FormattedMessage id='enterpriseColony.ACksterList.open_ip' />}
                    >
                      {getFieldDecorator('storageClassName1', {
                        rules: [
                          {
                            required: true,
                            message: formatMessage({ id: 'enterpriseColony.Advanced.input_storageClass' })
                          },
                          {
                            pattern: /^[^\s]*$/,
                            message: formatMessage({ id: 'placeholder.no_spaces' })
                          }
                        ]
                      })(<Input placeholder={formatMessage({ id: 'enterpriseColony.Advanced.input_StorageClass' })} />)}
                    </Form.Item>}

                  {isStorage == 'custom' &&
                    <Form.Item
                      {...is_formItemLayout}
                      label="RWO"
                      className={styles.antd_form}
                    // extra={<FormattedMessage id='enterpriseColony.ACksterList.open_ip' />}
                    >
                      {getFieldDecorator('storageClassName2', {
                        rules: [
                          {
                            required: true,
                            message: formatMessage({ id: 'enterpriseColony.Advanced.StorageClass' })
                          },
                          {
                            pattern: /^[^\s]*$/,
                            message: formatMessage({ id: 'placeholder.no_spaces' })
                          }
                        ]
                      })(<Input placeholder={formatMessage({ id: 'enterpriseColony.Advanced.input_storage' })} />)}
                    </Form.Item>}
                </Row>
                <Row className={styles.row}>
                  <div className={styles.title_name}>
                    Etcd
                  </div>
                  <Form.Item
                    {...is_formItemLayout}
                    label="选择Etcd"
                    className={styles.antd_form}
                  // extra={<FormattedMessage id='enterpriseColony.ACksterList.open_ip' />}
                  >
                    {getFieldDecorator('isEtcd', {
                      initialValue: isEtcd
                    })(
                      <Radio.Group onChange={this.hanldeEtcdChange}>
                        <Radio value="default">默认</Radio>
                        <Radio value="custom">自定义</Radio>
                      </Radio.Group>
                    )}
                  </Form.Item>
                  {isEtcd == 'custom' &&
                    <Form.Item
                      {...is_formItemLayout}
                      label="secret名称"
                      className={styles.antd_form}
                    // extra={<FormattedMessage id='enterpriseColony.ACksterList.open_ip' />}
                    >
                      {getFieldDecorator('secretName', {
                        rules: [
                          {
                            required: true,
                            message: formatMessage({ id: 'enterpriseColony.Advanced.inpiut_name' })
                          },
                          {
                            pattern: /^[^\s]*$/,
                            message: formatMessage({ id: 'placeholder.no_spaces' })
                          }
                        ]
                      })(<Input placeholder={formatMessage({ id: 'enterpriseColony.Advanced.inpiut_Name' })} />)}
                    </Form.Item>}
                  {isEtcd == 'custom' &&
                    <Form.Item
                      {...is_formItemLayout}
                      label="节点名称"
                      className={styles.antd_form}
                    // extra={<FormattedMessage id='enterpriseColony.ACksterList.open_ip' />}
                    >
                      {getFieldDecorator('endpoints', {
                        rules: [
                          {
                            required: true,
                            message: formatMessage({ id: 'enterpriseColony.Advanced.input_node' })
                          },
                          {
                            validator: this.handleValidatorsNodes
                          }
                        ]
                      })(<Etcd />)}
                    </Form.Item>}
                </Row>
              </Panel>
            </Collapse>

            {/* 高级配置说明 */}
            <Collapse className={styles.basics} style={{ marginTop: '24px' }} expandIconPosition='right'>
              <Panel
                header={
                  <span className={styles.spanBox}>
                    <span className={styles.panelTitle} style={{ color: '#000' }}>高级配置说明</span>
                  </span>}
                key="advanced"
              >
                {/* 高可用 */}
                <Row className={styles.row}>
                  <div className={styles.title_name}>
                    高可用
                  </div>
                  <Form.Item
                    {...is_formItemLayout}
                    label="是否开启"
                    className={styles.antd_form}
                  // extra={<FormattedMessage id='enterpriseColony.ACksterList.open_ip' />}
                  >
                    {getFieldDecorator('advanced', {
                    })(
                      <Switch defaultChecked={false} />
                    )}
                  </Form.Item>
                </Row>
                {/* 镜像仓库 */}
                <Row className={styles.row}>
                  <div className={styles.title_name}>
                    镜像仓库
                  </div>
                  <Form.Item
                    {...is_formItemLayout}
                    label="选择镜像仓库"
                    className={styles.antd_form}
                  // extra={<FormattedMessage id='enterpriseColony.ACksterList.open_ip' />}
                  >
                    {getFieldDecorator('image', {
                      initialValue: isImage
                    })(
                      <Radio.Group onChange={this.hanldeImageChange}>
                        <Radio value="default">默认</Radio>
                        <Radio value="custom">自定义</Radio>
                      </Radio.Group>
                    )}
                  </Form.Item>
                  {isImage == 'custom' &&
                    <>
                      <Form.Item
                        {...is_formItemLayout}
                        label={<FormattedMessage id='enterpriseColony.Advanced.mirror_name' />}
                        className={styles.antd_form}
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
                        className={styles.antd_form}
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
                        className={styles.antd_form}
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
                        className={styles.antd_form}
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
                        })(<Input type="password" placeholder={formatMessage({ id: 'enterpriseColony.Advanced.input_password' })} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />)}
                      </Form.Item>
                    </>}
                </Row>
                {/* 数据库 */}
                <Row className={styles.row}>
                  <div className={styles.title_name}>
                    数据库
                  </div>
                  <Form.Item
                    {...is_formItemLayout}
                    label="选择数据库"
                    className={styles.antd_form}
                  // extra={<FormattedMessage id='enterpriseColony.ACksterList.open_ip' />}
                  >
                    {getFieldDecorator('database', {
                      initialValue: isDatabase
                    })(
                      <Radio.Group onChange={this.hanldeDatabaseChange}>
                        <Radio value="default">默认</Radio>
                        <Radio value="custom">自定义</Radio>
                      </Radio.Group>
                    )}
                  </Form.Item>
                  {isDatabase == 'custom' &&
                    <>
                      <Form.Item
                        {...is_formItemLayout}
                        label={<FormattedMessage id='enterpriseColony.Advanced.address' />}
                        style={{ display: 'flex' }}
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
                        style={{ display: 'flex' }}
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
                        style={{ display: 'flex' }}
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
                        style={{ display: 'flex' }}
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
                        })(<Input type="password" placeholder={formatMessage({ id: 'enterpriseColony.Advanced.input_password' })} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />)}
                      </Form.Item>
                      {/* 数据库名称 */}
                      <Form.Item
                        {...is_formItemLayout}
                        label={<FormattedMessage id='enterpriseColony.Advanced.access_name' />}
                        style={{ display: 'flex' }}
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
                  <div className={styles.title_name}>
                    组件镜像源
                  </div>
                  <Form.Item
                    {...is_formItemLayout}
                    label="选择镜像源"
                    className={styles.antd_form}
                  // extra={<FormattedMessage id='enterpriseColony.ACksterList.open_ip' />}
                  >
                    {getFieldDecorator('mirror', {
                      initialValue: isMirror
                    })(
                      <Radio.Group onChange={this.hanldeMirrorChange}>
                        <Radio value="default">默认</Radio>
                        <Radio value="custom">自定义</Radio>
                      </Radio.Group>
                    )}
                  </Form.Item>
                  {isMirror == 'custom' &&
                    <Form.Item
                      {...is_formItemLayout}
                      label={'仓库地址'}
                      style={{ display: 'flex' }}
                    >
                      {/* 仓库地址 */}
                      {getFieldDecorator('mirror_address', {
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
                    </Form.Item>}
                </Row>
                {/* 副本数 */}
                <Row className={styles.row}>
                  <div className={styles.title_name}>
                    副本数
                  </div>
                  <Form.Item
                    {...is_formItemLayout}
                    label="选择副本"
                    className={styles.antd_form}
                  // extra={<FormattedMessage id='enterpriseColony.ACksterList.open_ip' />}
                  >
                    {getFieldDecorator('ectype', {
                      initialValue: isEctype
                    })(
                      <Radio.Group onChange={this.hanldeEctypeChange}>
                        <Radio value="default">默认</Radio>
                        <Radio value="custom">自定义</Radio>
                      </Radio.Group>
                    )}
                  </Form.Item>
                  {isEctype == 'custom' &&
                    <Form.Item
                      {...is_formItemLayout}
                      label={'副本数'}
                      style={{ display: 'flex' }}
                    >
                      {/* 仓库地址 */}
                      {getFieldDecorator('replicas', {
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
                      })(<Input type='number' placeholder={formatMessage({ id: 'enterpriseColony.Advanced.input_address' })} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />)}
                    </Form.Item>}
                </Row>
              </Panel>
            </Collapse>
          </Form>
        </Col>

        <Col style={{ textAlign: 'center', marginTop: '32px' }} span={24}>
          {task && task.status !== 'complete' ? (
            <Fragment>
              <Button onClick={preStep} style={{ marginRight: '16px' }}>
                <FormattedMessage id='button.previous' />
              </Button>
              {showComponent}
              <Button
                onClick={() => {
                  this.setState({ showInitDetail: true });
                }}
                type="primary"
              >
                <FormattedMessage id='enterpriseColony.RainbondClusterInit.Initializing' />
              </Button>

            </Fragment>
          ) : (
            <Fragment>
              <Button onClick={preStep} style={{ marginRight: '16px' }}>
                <FormattedMessage id='button.previous' />
              </Button>
              {showComponent}
              <Button
                loading={loading}
                onClick={this.handleSubmit}
                type="primary"
              >
                {task ? <FormattedMessage id='enterpriseColony.RainbondClusterInit.Reinitialize' /> : <FormattedMessage id='enterpriseColony.RainbondClusterInit.start' />}
              </Button>
            </Fragment>
          )}
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

        {isComponents && clusterID && (
          <ClusterComponents
            eid={eid}
            clusterID={clusterID}
            providerName={selectProvider}
            onCancel={() => {
              this.handleIsComponents(false);
            }}
          />
        )}
        {showInitDetail && task && (
          <InitRainbondDetail
            onCancel={this.cancelShowInitDetail}
            eid={eid}
            guideStep={guideStep}
            handleNewbieGuiding={this.handleNewbieGuiding}
            providerName={selectProvider}
            clusterID={task.clusterID}
            taskID={task.taskID}
          />
        )}
        {/* <Modal
            visible
            title={<FormattedMessage id='enterpriseColony.RainbondClusterInit.set'/>}
            onOk={this.handleSubmit}
            width={800}
            confirmLoading={loading}
            onCancel={() => {
              this.setState({ showClusterInitConfig: false });
            }}
          >
            <Alert
              message={<FormattedMessage id='enterpriseColony.RainbondClusterInit.Example'/>}
              type="warning"
              style={{ marginBottom: '16px' }}
            />
            <CodeMirrorForm
              titles={<FormattedMessage id='enterpriseColony.RainbondClusterInit.all'/>}
              setFieldsValue={setFieldsValue}
              formItemLayout={formItemLayout}
              Form={Form}
              getFieldDecorator={getFieldDecorator}
              mode="yaml"
              name="config"
              data={initconfig}
              label={<FormattedMessage id='enterpriseColony.RainbondClusterInit.Cluster'/>}
              message={<FormattedMessage id='enterpriseColony.RainbondClusterInit.required'/>}
              width="750px"
            />
          </Modal> */}
      </Form>
    );
  }
}
