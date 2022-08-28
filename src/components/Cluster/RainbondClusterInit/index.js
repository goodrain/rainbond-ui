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
  Typography
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
import styles from '../ACKBuyConfig/index.less';
import ClusterComponents from '../ClusterComponents';
import InitRainbondDetail from '../ShowInitRainbondDetail';

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
      guideStep: 10
    };
  }
  componentDidMount() {
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
    const { checked, task } = this.state;
    if (checked) {
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
    } else {
      notification.warning({ message: formatMessage({id:'notification.warn.read'}) });
    }
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
    form.validateFields((err, values) => {
      if (!err) {
        setRainbondClusterConfig(
          { enterprise_id: eid, clusterID, config: values.config },
          res => {
            if (res && res.data && res.data.code === 404) {
              return;
            }
            cloud.handleCloudAPIError(res);
          }
        ).then(re => {
          if (re && re.status_code === 200) {
            notification.success({ message: formatMessage({id:'notification.success.setting_successfully'}) });
            this.setState({ showClusterInitConfig: false });
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
    const { prevStep, nextStep, handleClick = () => {} } = info;
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
      checked
    } = this.state;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 }
      },
      wrapperCol: {
        xs: { span: 24 }
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
        <FormattedMessage id='enterpriseColony.RainbondClusterInit.look'/>
      </Button>
    );
    return (
      <Form>
        <h4><FormattedMessage id='enterpriseColony.RainbondClusterInit.careful'/></h4>
        <Col span={24} style={{ padding: '16px' }}>
          {selectProvider === 'ack' && (
            <Paragraph className={styles.describe} style={highlighted}>
              <ul>
                <li>
                  <span>
                    <FormattedMessage id='enterpriseColony.RainbondClusterInit.initialization'/>
                  </span>
                </li>
                <li>
                  <span>
                    <FormattedMessage id='enterpriseColony.RainbondClusterInit.resources'/>
                  </span>
                </li>
                <li>
                  <span>
                    <FormattedMessage id='enterpriseColony.RainbondClusterInit.mode'/>
                  </span>
                </li>
                <li>
                  <span>
                    <FormattedMessage id='enterpriseColony.RainbondClusterInit.remove'/>
                  </span>
                </li>
              </ul>
            </Paragraph>
          )}
          {(selectProvider === 'rke' || selectProvider === 'custom') && (
            <Paragraph className={styles.describe} style={highlighted}>
              <ul>
                <li>
                  <span>
                    <FormattedMessage id='enterpriseColony.RainbondClusterInit.select'/>
                  </span>
                </li>
                <li>
                  <span>
                    <FormattedMessage id='enterpriseColony.RainbondClusterInit.default'/>
                  </span>
                </li>
                <li>
                  <span>
                    <FormattedMessage id='enterpriseColony.RainbondClusterInit.port'/>
                  </span>
                </li>
                <li>
                  <span><FormattedMessage id='enterpriseColony.RainbondClusterInit.availability'/></span>
                </li>
                <li>
                  <span>
                    <FormattedMessage id='enterpriseColony.RainbondClusterInit.Installed'/>
                  </span>
                </li>
                <li>
                  <span>
                    <FormattedMessage id='enterpriseColony.RainbondClusterInit.cluster'/>{' '}
                    <a
                      onClick={() => {
                        this.showSetRainbondCluster();
                      }}
                    >
                      <FormattedMessage id='enterpriseColony.RainbondClusterInit.click'/>
                    </a>
                  </span>
                </li>
              </ul>
            </Paragraph>
          )}
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox
              onChange={this.setChecked}
              style={highlighted}
              checked={checked}
            >
              <FormattedMessage id='enterpriseColony.RainbondClusterInit.precautions'/>
            </Checkbox>
            {guideStep === 10 &&
              this.handleNewbieGuiding({
                tit: formatMessage({id:'enterpriseColony.RainbondClusterInit.service'}),
                send: false,
                configName: 'kclustersAttentionAttention',
                nextStep: 11,
                btnText: formatMessage({id:'enterpriseColony.RainbondClusterInit.Known'}),
                conPosition: { left: 0, bottom: '-192px' },
                svgPosition: { left: '3px', marginTop: '-19px' },
                handleClick: () => {
                  this.setState({ checked: true });
                }
              })}
          </Form.Item>
        </Col>
        <Col style={{ textAlign: 'center', marginTop: '32px' }} span={24}>
          {task && task.status !== 'complete' ? (
            <Fragment>
              <Button onClick={preStep} style={{ marginRight: '16px' }}>
                <FormattedMessage id='button.previous'/>
              </Button>
              {showComponent}
              <Button
                onClick={() => {
                  this.setState({ showInitDetail: true });
                }}
                type="primary"
              >
                <FormattedMessage id='enterpriseColony.RainbondClusterInit.Initializing'/>
              </Button>
            </Fragment>
          ) : (
            <Fragment>
              <Button onClick={preStep} style={{ marginRight: '16px' }}>
                <FormattedMessage id='button.previous'/>
              </Button>
              {showComponent}
              <Button
                loading={loading}
                onClick={this.initRainbondCluster}
                type="primary"
              >
                {task ? <FormattedMessage id='enterpriseColony.RainbondClusterInit.Reinitialize'/> : <FormattedMessage id='enterpriseColony.RainbondClusterInit.start'/>}
              </Button>
            </Fragment>
          )}
          {guideStep === 11 &&
            this.handleNewbieGuiding({
              tit: formatMessage({id:'enterpriseColony.RainbondClusterInit.start'}),
              desc: formatMessage({id:'enterpriseColony.RainbondClusterInit.configuration'}),
              send: true,
              configName: 'kclustersAttentionAttention',
              nextStep: 12,
              conPosition: { left: '63%', bottom: '-39px' },
              svgPosition: { left: '58%', marginTop: '-13px' },
              handleClick: () => {
                this.initRainbondCluster();
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
        {showClusterInitConfig && (
          <Modal
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
          </Modal>
        )}
      </Form>
    );
  }
}
