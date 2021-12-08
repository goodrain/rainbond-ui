/* eslint-disable no-underscore-dangle */
import NewbieGuiding from '@/components/NewbieGuiding';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  notification,
  Row
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import cloud from '../../../utils/cloud';

@connect()
@Form.create()
export default class SetRegionConfig extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      configs: {},
      guideStep: 13,
      task: null
    };
  }
  componentDidMount() {
    this.loadTask();
  }
  createClusters = () => {
    const { dispatch, eid, form, selectClusterID, selectProvider } = this.props;
    const { configsYaml, task } = this.state;
    let desc;
    switch (selectProvider) {
      case 'ack':
        desc = '从阿里云托管集群安装对接';
        break;
      case 'tke':
        desc = '从腾讯云托管集群安装对接';
        break;
      case 'custom':
        desc = '从自定义 Kubernetes 集群对接';
        break;
      case 'rke':
        desc = '提供主机安装 Kubernetes 集群并对接';
        break;
      default:
        desc = '自建集群';
    }
    form.validateFields((err, fieldsValue) => {
      if (err) {
        return;
      }
      this.setState({ commitloading: true });
      dispatch({
        type: 'region/createEnterpriseCluster',
        payload: {
          ...fieldsValue,
          enterprise_id: eid,
          desc,
          token: configsYaml,
          region_type: ['custom'],
          provider: selectProvider,
          providerClusterID: selectClusterID
        },
        callback: res => {
          if (res && res._condition === 200) {
            notification.success({ message: '添加成功' });
            if (task) {
              dispatch({
                type: 'cloud/updateInitTaskStatus',
                payload: {
                  enterprise_id: eid,
                  taskID: task.taskID,
                  status: 'complete'
                },
                callback: () => {
                  dispatch(routerRedux.push(`/enterprise/${eid}/clusters`));
                },
                handleError: herr => {
                  if(herr.data.code == 404){
                    dispatch(routerRedux.push(`/enterprise/${eid}/clusters`));
                  }else{
                    cloud.handleCloudAPIError(herr);
                  }  
                  this.setState({ commitloading: false });
                }
              });
            } else {
              dispatch(routerRedux.push(`/enterprise/${eid}/clusters`));
            }
          }
        },
        handleError: errs => {
          cloud.handleCloudAPIError(errs);
          this.setState({ commitloading: false });
        }
      });
    });
  };
  loadRegionConfig = () => {
    const { dispatch, eid, selectClusterID, selectProvider } = this.props;
    dispatch({
      type: 'cloud/loadRegionConfig',
      payload: {
        enterprise_id: eid,
        clusterID: selectClusterID,
        providerName: selectProvider
      },
      callback: data => {
        if (data) {
          this.setState({
            configs: data.configs,
            configsYaml: data.configs_yaml,
            loading: false
          });
        }
      },
      handleError: res => {
        cloud.handleCloudAPIError(res);
        this.setState({ loading: false });
      }
    });
  };
  loadTask = () => {
    const { dispatch, eid, selectClusterID, selectProvider } = this.props;
    dispatch({
      type: 'cloud/loadInitRainbondTask',
      payload: {
        enterprise_id: eid,
        clusterID: selectClusterID,
        providerName: selectProvider
      },
      callback: data => {
        if (data) {
          this.setState({ task: data });
          this.loadRegionConfig();
        }
      },
      handleError: res => {
        if (res.data && res.data.code === 404) {
          this.loadRegionConfig();
          return;
        }
        cloud.handleCloudAPIError(res);
        this.setState({ loading: false });
      }
    });
  };
  handleNewbieGuiding = info => {
    const { prevStep, nextStep, handleClick = () => {} } = info;
    return (
      <NewbieGuiding
        {...info}
        totals={14}
        handlePrev={() => {
          if (prevStep) {
            this.handleGuideStep(prevStep);
          }
        }}
        handleClose={() => {
          this.handleGuideStep('close');
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
  render() {
    const { selectProvider, form } = this.props;
    const { configs, loading, commitloading, guideStep } = this.state;
    const { getFieldDecorator } = form;
    let clusterTitle;
    switch (selectProvider) {
      case 'ack':
        clusterTitle = '阿里云托管集群';
        break;
      case 'tke':
        clusterTitle = '腾讯云托管集群';
        break;
      case 'custom':
        clusterTitle = '自定义对接集群';
        break;
      case 'rke':
        clusterTitle = '自建集群';
        break;
      default:
        clusterTitle = '自建集群';
    }
    const highlighted = {
      position: 'relative',
      zIndex: 1000,
      padding: '0 16px',
      margin: '0 -16px',
      background: '#fff'
    };
    return (
      <Form>
        <Card loading={loading} bordered={false} style={{ padding: '0 16px' }}>
          <Row>
            {!configs.apiAddress && (
              <Alert
                message="未正常获取到集群的初始化状态，不能进行对接"
                type="error"
              />
            )}
            {configs.apiAddress && (
              <Descriptions>
                <Descriptions.Item label="API通信地址">
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {configs.apiAddress}
                    <Alert
                      style={{ marginLeft: '20px' }}
                      message="请确保该IP地址的8443端口，6060端口对外开放"
                      type="warning"
                    />
                  </div>
                </Descriptions.Item>
              </Descriptions>
            )}
          </Row>
          <Row style={{ marginTop: '32px' }}>
            <h4>集群设置</h4>
          </Row>
          <Row style={guideStep === 13 ? highlighted : {}}>
            <Col span={6} style={{ paddingRight: '16px' }}>
              <Form.Item label="集群ID">
                {getFieldDecorator('region_name', {
                  initialValue: '',
                  rules: [
                    {
                      required: true,
                      message: '请填写辨识度高的集群ID，不可修改'
                    },
                    {
                      pattern: /^[a-z0-9A-Z-_]+$/,
                      message: '只支持字母、数字和-_组合'
                    }
                  ]
                })(<Input placeholder="请填写辨识度高的集群ID，不可修改" />)}
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="集群名称">
                {getFieldDecorator('region_alias', {
                  initialValue: clusterTitle,
                  rules: [
                    { required: true, message: '请填写集群名称!' },
                    { max: 24, message: '最大长度24位' }
                  ]
                })(<Input placeholder="请填写集群名称" />)}
              </Form.Item>
            </Col>
          </Row>
          {guideStep === 13 &&
            this.handleNewbieGuiding({
              tit: '集群服务已经安装成功了',
              desc: '请输入集群设置信息',
              send: false,
              configName: 'clusterDocking',
              showSvg: false,
              showArrow: true,
              nextStep: 14
            })}
          <Row>
            <Col style={{ textAlign: 'center', marginTop: '32px' }} span={24}>
              <Button
                loading={commitloading}
                onClick={this.createClusters}
                disabled={!configs.apiAddress}
                type="primary"
              >
                对接
              </Button>
              {guideStep === 14 &&
                this.handleNewbieGuiding({
                  tit: '集群设置配置完成后请开始对接',
                  btnText: '对接',
                  send: true,
                  configName: 'clusterDocking',
                  nextStep: 15,
                  handleClick: () => {
                    if (configs.apiAddress) {
                      this.createClusters();
                    }
                  },
                  conPosition: { left: '50%', bottom: '-138px' },
                  svgPosition: { left: '50%', marginTop: '-11px' }
                })}
            </Col>
          </Row>
        </Card>
      </Form>
    );
  }
}
