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
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
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
        desc = `${formatMessage({id:'enterpriseColony.SetRegionConfig.staackrt'})}`;
        break;
      case 'tke':
        desc = `${formatMessage({id:'enterpriseColony.SetRegionConfig.tke'})}`;
        break;
      case 'custom':
        desc = `${formatMessage({id:'enterpriseColony.SetRegionConfig.custom'})}`;
        break;
      case 'rke':
        desc = `${formatMessage({id:'enterpriseColony.SetRegionConfig.rke'})}`;
        break;
      default:
        desc = `${formatMessage({id:'enterpriseColony.SetRegionConfig.Self'})}`;
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
            notification.success({ message: formatMessage({id:'notification.success.add'}) });
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
        clusterTitle = `${formatMessage({id:'enterpriseColony.SetRegionConfig.ali'})}`;
        break;
      case 'tke':
        clusterTitle = `${formatMessage({id:'enterpriseColony.SetRegionConfig.tenxun'})}`;
        break;
      case 'custom':
        clusterTitle = `${formatMessage({id:'enterpriseColony.SetRegionConfig.docking'})}`;
        break;
      case 'rke':
        clusterTitle = `${formatMessage({id:'enterpriseColony.SetRegionConfig.Self'})}`;
        break;
      default:
        clusterTitle = `${formatMessage({id:'enterpriseColony.SetRegionConfig.Self'})}`;
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
                message={<FormattedMessage id='enterpriseColony.SetRegionConfig.state'/>}
                type="error"
              />
            )}
            {configs.apiAddress && (
              <Descriptions>
                <Descriptions.Item  label={<FormattedMessage id='enterpriseColony.SetRegionConfig.api'/>}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {configs.apiAddress}
                    <Alert
                      style={{ marginLeft: '20px' }}
                      message={<FormattedMessage id='enterpriseColony.SetRegionConfig.ip'/>}
                      type="warning"
                    />
                  </div>
                </Descriptions.Item>
              </Descriptions>
            )}
          </Row>
          <Row style={{ marginTop: '32px' }}>
            <h4><FormattedMessage id='enterpriseColony.SetRegionConfig.setting'/></h4>
          </Row>
          <Row style={guideStep === 13 ? highlighted : {}}>
            <Col span={6} style={{ paddingRight: '16px' }}>
              <Form.Item  label={<FormattedMessage id='enterpriseColony.SetRegionConfig.id'/>}>
                {getFieldDecorator('region_name', {
                  initialValue: '',
                  rules: [
                    {
                      required: true,
                      message: formatMessage({id:'enterpriseColony.SetRegionConfig.input_id'})
                    },
                    {
                      pattern: /^[a-z0-9A-Z-_]+$/,
                      message: formatMessage({id:'enterpriseColony.SetRegionConfig.only'})
                    }
                  ]
                })(<Input placeholder={formatMessage({id:'enterpriseColony.SetRegionConfig.input_id'})} />)}
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item  label={<FormattedMessage id='applicationMarket.CreateHelmAppModels.colony'/>}>
                {getFieldDecorator('region_alias', {
                  initialValue: clusterTitle,
                  rules: [
                    { required: true, message:formatMessage({id:'enterpriseColony.BaseAddCluster.name'}) },
                    { max: 24, message:formatMessage({id:'enterpriseColony.addCluster.host.max'}) }
                  ]
                })(<Input  placeholder={formatMessage({id:'enterpriseColony.BaseAddCluster.name'})}/>)}
              </Form.Item>
            </Col>
          </Row>
          {guideStep === 13 &&
            this.handleNewbieGuiding({
              tit: formatMessage({id:'enterpriseColony.SetRegionConfig.success'}),
              desc: formatMessage({id:'enterpriseColony.SetRegionConfig.input'}),
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
                <FormattedMessage id='button.Docking'/>
              </Button>
              {guideStep === 14 &&
                this.handleNewbieGuiding({
                  tit: formatMessage({id:'enterpriseColony.SetRegionConfig.start'}),
                  btnText:formatMessage({id:'button.Docking'}),
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
