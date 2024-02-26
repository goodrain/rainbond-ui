/* eslint-disable react/sort-comp */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import NewbieGuiding from '@/components/NewbieGuiding';
import {
  Card,
  Col,
  Divider,
  Dropdown,
  Form,
  Input,
  Menu,
  Row,
  Steps,
  Typography
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import BaseAddCluster from '../../components/Cluster/BaseAddCluster';
import CustomClusterAdd from '../../components/Cluster/CustomClusterAdd';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import globalUtil from '../../utils/global';
import cloud from '../../utils/cloud';
import rainbondUtil from '../../utils/rainbond';
import userUtil from '../../utils/user';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import styles from './index.less';

const { Step } = Steps;
const { Paragraph } = Typography;

@Form.create()
@connect(({ user, list, loading, global, index }) => ({
  user: user.currentUser,
  list,
  loading: loading.models.list,
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  isRegist: global.isRegist,
  oauthLongin: loading.effects['global/creatOauth'],
  overviewInfo: index.overviewInfo
}))
export default class EnterpriseClusters extends PureComponent {
  constructor(props) {
    super(props);
    const { user } = this.props;
    const adminer = userUtil.isCompanyAdmin(user);
    this.state = {
      adminer,
      addClusterShow: false,
      addCustomClusterShow: false,
      selectProvider: 'ack',
      currentStep: 0,
      guideStep: 2,
      providerAccess: {},
      loading: false,
      initTask: {},
      clusters: null
    };
  }
  componentWillMount() {
    const { adminer } = this.state;
    const { dispatch } = this.props;

    if (!adminer) {
      dispatch(routerRedux.push(`/`));
    }
  }
  componentDidMount() {
    this.getAccessKey();
    this.loadClusters();
  }

  // getAccessKey get enterprise accesskey
  getAccessKey = () => {
    const { dispatch } = this.props;
    const { selectProvider } = this.state;
    const {
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: 'cloud/getAccessKey',
      payload: {
        enterprise_id: eid,
        provider_name: selectProvider
      },
      callback: access => {
        this.setState({ providerAccess: access });
      }
    });
  };
  setProvider = value => {
    this.setState({ selectProvider: value });
  };
  setAccessKey = () => {
    const { form, dispatch } = this.props;
    const {
      match: {
        params: { eid }
      }
    } = this.props;
    const { selectProvider } = this.state;
    form.validateFields((err, fieldsValue) => {
      if (err) {
        return;
      }
      this.setState({ loading: true });
      dispatch({
        type: 'cloud/setAccessKey',
        payload: {
          enterprise_id: eid,
          provider_name: selectProvider,
          access_key: fieldsValue.access_key,
          secret_key: fieldsValue.secret_key
        },
        callback: access => {
          if (access) {
            // load clusters
            this.toClusterList(selectProvider);
          }
        }
      });
    });
  };
  loadClusters = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: 'region/fetchEnterpriseClusters',
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.list) {
          const clusters = [];
          res.list.map((item, index) => {
            item.key = `cluster${index}`;
            clusters.push(item);
            return item;
          });
          this.setState({ clusters });
        } else {
          this.setState({ clusters: [] });
        }
      }
    });
  };
  cancelAddCluster = () => {
    this.setState({ addClusterShow: false });
  };
  cancelAddCustomCluster = () => {
    this.setState({ addCustomClusterShow: false });
  };
  // add Cluster
  addClusterShow = () => {
    this.setState({
      addClusterShow: true
    });
  };
  toClusterList = provider => {
    const { dispatch } = this.props;
    const {
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch(
      routerRedux.push(`/enterprise/${eid}/provider/${provider}/kclusters`)
    );
  };
  handleInstallRegion = type => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    switch (type) {
      case 'helm':
        dispatch(routerRedux.push(`/enterprise/${eid}/provider/ACksterList`));
        break;
      case 'aliyun':
        dispatch(routerRedux.push(`/enterprise/${eid}/provider/ACksterList?mode=ack`));
        break;
      case 'tencent':
        dispatch(routerRedux.push(`/enterprise/${eid}/provider/ACksterList?mode=tencent`));
        break;
      case 'huawei':
        dispatch(routerRedux.push(`/enterprise/${eid}/provider/ACksterList?mode=huawei`));
        break;
      default:
        break;
    }
  };
  addClusterOK = () => {
    const { dispatch } = this.props;
    const {
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch(routerRedux.push(`/enterprise/${eid}/clusters`));
  };
  preStep = () => {
    const { currentStep } = this.state;
    this.setState({ currentStep: currentStep - 1 });
  };
  loadSteps = () => {
    const steps = [
      {
        title: formatMessage({id:'enterpriseColony.addCluster.supplier'})
      },
      {
        title: formatMessage({id:'enterpriseColony.addCluster.cluster'})
      },
      {
        title: formatMessage({id:'enterpriseColony.addCluster.Initialize'})
      },
      {
        title: formatMessage({id : 'enterpriseColony.addCluster.clusterInit'})
      },
      {
        title: formatMessage({id:'enterpriseColony.addCluster.docking'})
      }
    ];
    return steps;
  };
  showInitTaskDetail = selectTask => {
    this.setState({ showInitTaskDetail: true, initTask: selectTask });
  };
  completeInit = task => {
    this.setState({
      currentStep: 3,
      selectProvider: task.providerName
    });
  };
  cancelShowInitDetail = () => {
    this.setState({ showInitTaskDetail: false });
  };

  handleGuideStep = guideStep => {
    this.setState({
      guideStep
    });
  };
  handleNewbieGuiding = info => {
    const { prevStep, nextStep } = info;
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
            this.toClusterList('rke');
            this.handleGuideStep(nextStep);
            if (nextStep === 4) {
              document.getElementById('cloudServiceBtn').scrollIntoView();
            }
          }
        }}
      />
    );
  };

  render() {
    const {
      addClusterShow,
      addCustomClusterShow,
      selectProvider,
      currentStep,
      guideStep,
      loading,
      showInitTaskDetail,
      initTask,
      clusters
    } = this.state;
    const {
      match: {
        params: { eid }
      }
    } = this.props;

    const K8sCluster = rainbondUtil.isEnableK8sCluster() || false;
    const menu = (
      <Menu>
        <Menu.Item>
          <a
            rel="noopener noreferrer"
            onClick={e => {
              e.preventDefault();
              this.toClusterList('custom');
            }}
          >
            <FormattedMessage id='enterpriseColony.addCluster.adopt'/>
          </a>
        </Menu.Item>
        <Menu.Item>
          <a
            onClick={e => {
              e.preventDefault();
              this.addClusterShow();
            }}
          >
            <FormattedMessage id='enterpriseColony.addCluster.cluster'/>
          </a>
        </Menu.Item>
      </Menu>
    );
    const extraContent = (
      <div>
        <Dropdown overlay={menu} placement="bottomRight">
          {globalUtil.fetchSvg('omitIcon')}
        </Dropdown>
      </div>
    );
    return (
      <PageHeaderLayout
        title={<FormattedMessage id='enterpriseColony.button.text'/>}
        content={<FormattedMessage id='enterpriseColony.PageHeaderLayout.content'/>}
        extraContent={extraContent}
        titleSvg={pageheaderSvg.getSvg('clusterSvg',18)}
      >
        <Card style={{ 
            marginBottom: '16px',            
            borderRadius: 5,
            boxShadow:'rgb(36 46 66 / 16%) 2px 4px 10px 0px',
             }}>
          <Row>
            <h3><FormattedMessage id='enterpriseColony.addCluster.infrastructure'/></h3>
            <Divider />
          </Row>
          <Row>
            <Col span={12}>
              <div
                onClick={() => this.toClusterList('rke')}
                className={styles.import}
              >
                <div className={styles.importicon}>{globalUtil.fetchSvg('hostIcon')}</div>
                <div className={styles.importDesc}>
                  <h3><FormattedMessage id='enterpriseColony.addCluster.host'/></h3>
                  <p><FormattedMessage id='enterpriseColony.addCluster.automatically'/></p>
                </div>
              </div>
              {guideStep === 2 &&
                clusters &&
                clusters.length === 0 &&
                this.handleNewbieGuiding({
                  tit: formatMessage({id:'enterpriseColony.addCluster.install'}),
                  configName: 'hostInstall',
                  desc: formatMessage({id:'enterpriseColony.addCluster.common'}),
                  nextStep: 3,
                  svgPosition: { marginLeft: '58px' }
                })}
            </Col>
            <Col span={12}>
              <div
                onClick={() => {
                  this.handleInstallRegion('helm');
                }}
                className={styles.import}
              >
                <div className={styles.importicon}>{globalUtil.fetchSvg('kubernetesIcon')}</div>
                <div className={styles.importDesc}>
                  <h3><FormattedMessage id='enterpriseColony.addCluster.colony'/></h3>
                  <p> <FormattedMessage id='enterpriseColony.addCluster.management'/></p>
                </div>
              </div>
            </Col>
          </Row>
        </Card>
        <Card style={{
                      borderRadius: 5,
                      boxShadow:'rgb(36 46 66 / 16%) 2px 4px 10px 0px',
        }}>
          <Row>
            <h3><FormattedMessage id='enterpriseColony.addCluster.service'/></h3>
            <Divider />
          </Row>
          <Row style={{ display: 'flex', justifyContent: 'space-around' }}>
            <Col style={{ width: '33%' }}>
              <div
                onClick={() => {
                  this.handleInstallRegion('aliyun');
                }}
                className={styles.import}
              >
                <div className={styles.importicon}>{globalUtil.fetchSvg('aliIcon')}</div>
                <div className={styles.importDesc}>
                  <h3><FormattedMessage id='enterpriseColony.addCluster.ali'/></h3>
                  <p><FormattedMessage id='enterpriseColony.addCluster.manage'/></p>
                </div>
              </div>
            </Col>
            <Col style={{ width: '33%' }}>
              <div
                onClick={() => {
                  this.handleInstallRegion('huawei');
                }}
                className={styles.import}
              >
                <div className={styles.importicon}>{globalUtil.fetchSvg('huaweiIcon')}</div>
                <div className={styles.importDesc}>
                  <h3><FormattedMessage id='enterpriseColony.addCluster.huawei'/></h3>
                  <p><FormattedMessage id='enterpriseColony.addCluster.Docking'/></p>
                </div>
              </div>
            </Col>
            <Col style={{ width: '33%' }}>
              <div
                onClick={() => {
                  this.handleInstallRegion('tencent');
                }}
                className={styles.import}
              >
                <div className={styles.importicon}>{globalUtil.fetchSvg('tencentIcon')}</div>
                <div className={styles.importDesc}>
                  <h3><FormattedMessage id='enterpriseColony.addCluster.tenxun'/></h3>
                  <p><FormattedMessage id='enterpriseColony.addCluster.clusters'/></p>
                </div>
              </div>
            </Col>
          </Row>
        </Card>
        {addClusterShow && (
          <BaseAddCluster
            eid={eid}
            onOk={this.addClusterOK}
            onCancel={this.cancelAddCluster}
          />
        )}
        {addCustomClusterShow && (
          <CustomClusterAdd eid={eid} onCancel={this.cancelAddCustomCluster} />
        )}
      </PageHeaderLayout>
    );
  }
}
