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
import ShowInitRainbondDetail from '../../components/Cluster/ShowInitRainbondDetail';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import cloud from '../../utils/cloud';
import rainbondUtil from '../../utils/rainbond';
import global from '../../utils/global'
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
        dispatch(routerRedux.push(`/enterprise/${eid}/provider/Aliack`));
        break;
      case 'tencent':
        dispatch(routerRedux.push(`/enterprise/${eid}/provider/TencentList`));
        break;
      case 'huawei':
        dispatch(routerRedux.push(`/enterprise/${eid}/provider/HuaweiList`));
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

  renderAliyunAcountSetting = () => {
    const { providerAccess } = this.state;
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 24 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 24 }
      },
      labelAlign: 'left'
    };
    return (
      <Form {...formItemLayout}>
        <Col span={24}>
          <Paragraph className={styles.describe}>
            <h5><FormattedMessage id='enterpriseColony.addCluster.description'/></h5>
            <ul>
              <li>
                <span>
                  <FormattedMessage id='enterpriseColony.addCluster.starting'/>
                </span>
              </li>
              <li>
                <span>
                  <FormattedMessage id='enterpriseColony.addCluster.authorized'/>
                  {cloud.getAliyunCountDescribe().map(item => {
                    return (
                      <a
                        style={{ marginRight: '8px' }}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {item.title}
                      </a>
                    );
                  })}
                </span>
              </li>
              <li>
                <span>
                  <FormattedMessage id='enterpriseColony.addCluster.recommended'/>
                </span>
              </li>
              <li>
                <span>
                  <FormattedMessage id='enterpriseColony.addCluster.user'/><b>AliyunCSFullAccess</b>、
                  <b>AliyunECSFullAccess</b>、<b>AliyunVPCFullAccess</b>、
                  <b>AliyunRDSFullAccess</b>、<b>AliyunNASFullAccess</b>、
                  <b>AliyunSLBFullAccess</b><FormattedMessage id='enterpriseColony.addCluster.mode'/>
                </span>
              </li>
              <li>
                <span>
                  <FormattedMessage id='enterpriseColony.addCluster.strictly'/>
                </span>
              </li>
              <li>
                <span>
                  <FormattedMessage id='enterpriseColony.addCluster.kubernetes'/>
                  <b>0.5</b><FormattedMessage id='enterpriseColony.addCluster.element'/>
                </span>
              </li>
              <li>
                <span>
                  <FormattedMessage id='enterpriseColony.addCluster.purchased'/>
                  <b>2.5</b><FormattedMessage id='enterpriseColony.addCluster.element'/>
                </span>
              </li>
            </ul>
          </Paragraph>
        </Col>
        <Col span={8} style={{ padding: '16px' }}>
          <Form.Item name="access_key" label="Access Key">
            {getFieldDecorator('access_key', {
              initialValue: providerAccess.access_key || '',
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'enterpriseColony.addCluster.access'})
                }
              ]
            })(<Input placeholder="Access Key" />)}
          </Form.Item>
        </Col>
        <Col span={8} style={{ padding: '16px' }}>
          <Form.Item name="secret_key" label="Secret Key">
            {getFieldDecorator('secret_key', {
              initialValue: providerAccess.secret_key || '',
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'enterpriseColony.addCluster.access'})
                }
              ]
            })(
              <Input
                autoComplete="new-password"
                type="password"
                placeholder="Secret Key"
              />
            )}
          </Form.Item>
        </Col>
      </Form>
    );
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
  onView = () => {
    return (
      <Menu
        items={[
          {
            key: '1',
            label: (
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://www.antgroup.com"
              >
                1st menu item
              </a>
            )
          },
          {
            key: '2',
            label: (
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://www.aliyun.com"
              >
                2nd menu item
              </a>
            )
          }
        ]}
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

    const aliyunAcountSetting = this.renderAliyunAcountSetting();
    const icon = (
      <svg
        t="1610788158830"
        className="icon"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="4505"
      >
        <path
          d="M485.561494 719.136203a36.179 36.179 0 0 0 2.714854 2.457657 35.721761 35.721761 0 0 0 47.810005-2.457657l171.750227-171.764515a35.721761 35.721761 0 0 0-50.524859-50.524859L546.545685 607.641443V0h-71.443522v607.641443l-110.780326-110.780325a35.721761 35.721761 0 1 0-50.524858 50.524858z"
          p-id="4506"
          fill="#4d73b1"
        />
        <path
          d="M920.338191 365.004954H780.880437v71.443522h132.313402V952.485035H110.740201V436.448476h131.24175v-71.443522H103.595849c-35.450276 0-64.29917 29.477597-64.29917 65.72804v527.538966c0 36.221866 28.848894 65.72804 64.29917 65.72804h816.742342c35.450276 0 64.29917-29.463308 64.29917-65.72804V430.690128c0-36.221866-28.848894-65.685174-64.29917-65.685174z"
          p-id="4507"
          fill="#4d73b1"
        />
      </svg>
    );
    const kubernetesIcon = (
      <svg
        t="1610788127045"
        className="icon"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="3690"
      >
        <path
          d="M435.36 612.256l0.288 0.416-42.624 102.944a221.792 221.792 0 0 1-88.032-109.28l-0.48-1.536 109.984-18.656 0.16 0.224a18.784 18.784 0 0 1 20.608 25.984l0.032-0.128z m-35.52-90.816a18.816 18.816 0 0 0 7.424-32.256l-0.032-0.032 0.096-0.48-83.68-74.848a217.088 217.088 0 0 0-32.48 114.848c0 8.448 0.48 16.8 1.408 25.024l-0.096-0.992 107.264-30.944 0.096-0.384z m48.832-84.48a18.784 18.784 0 0 0 29.824-14.336v-0.032l0.416-0.224 6.4-111.776a219.296 219.296 0 0 0-128.448 61.568l0.032-0.032 91.616 64.992 0.16-0.096z m32.448 117.312l30.848 14.88 30.816-14.816 7.68-33.28-21.344-26.592h-34.304l-21.344 26.592 7.648 33.248z m64-132.032a18.784 18.784 0 0 0 29.92 14.304l-0.064 0.032 0.352 0.128 91.04-64.544a220.672 220.672 0 0 0-126.56-61.408l-1.088-0.128 6.304 111.584 0.096 0.032z m464.032 254.72l-246.304 306.4a68.16 68.16 0 0 1-53.088 25.344h-0.16l-395.136 0.128h-0.064a68.096 68.096 0 0 1-53.056-25.312l-0.096-0.128-246.432-306.336a67.104 67.104 0 0 1-12.992-57.632l-0.096 0.448 87.904-382.08A67.52 67.52 0 0 1 126.464 192L482.4 21.888c8.64-4.224 18.816-6.688 29.536-6.688s20.896 2.464 29.952 6.88l-0.416-0.192 356.064 170.016a67.552 67.552 0 0 1 36.832 45.792l87.968 382.08a67.2 67.2 0 0 1-13.152 57.184z m-140.32-87.776c-1.792-0.416-4.384-1.12-6.176-1.44-7.424-1.408-13.44-1.056-20.448-1.632-14.944-1.568-27.232-2.848-38.176-6.304-4.48-1.696-7.68-7.04-9.216-9.216l-8.576-2.528a275.936 275.936 0 0 0-4.832-101.376l0.384 1.856a276.384 276.384 0 0 0-40.544-93.248l0.608 0.96c2.208-2.016 6.4-5.664 7.552-6.784 0.352-3.84 0.032-7.808 4-12.032 8.416-7.904 18.944-14.432 31.712-22.272 6.048-3.584 11.648-5.856 17.696-10.336 1.376-1.024 3.232-2.656 4.704-3.808 10.24-8.16 12.576-22.176 5.248-31.392s-21.6-10.08-31.776-1.92c-1.44 1.152-3.424 2.656-4.736 3.744-5.728 4.96-9.248 9.824-14.08 14.944-10.496 10.656-19.2 19.552-28.704 25.984-4.128 2.4-10.208 1.568-12.928 1.408l-8.096 5.76a278.72 278.72 0 0 0-175.776-85.376l-1.12-0.096-0.512-9.504c-2.784-2.656-6.112-4.896-6.944-10.656-0.928-11.424 0.64-23.776 2.432-38.624 0.992-6.944 2.592-12.704 2.912-20.256 0.032-1.696-0.032-4.224-0.032-6.048 0-13.056-9.568-23.68-21.344-23.68-11.744 0-21.28 10.624-21.28 23.68l0.032 0.608c0 1.76-0.096 3.936 0 5.472 0.256 7.552 1.888 13.312 2.848 20.256 1.792 14.848 3.328 27.168 2.4 38.656a23.36 23.36 0 0 1-6.88 10.976l-0.032 0.032-0.512 8.992a274.08 274.08 0 0 0-177.632 85.312l-0.128 0.128a338.976 338.976 0 0 1-8.672-6.144l0.992 0.704c-3.84 0.512-7.68 1.696-12.672-1.248-9.504-6.4-18.208-15.264-28.704-25.952-4.832-5.12-8.32-9.984-14.048-14.88a97.728 97.728 0 0 0-4.736-3.744 25.184 25.184 0 0 0-14.784-5.632h-0.064l-1.088-0.032a20.48 20.48 0 0 0-15.872 7.488l-0.032 0.032c-7.328 9.216-4.992 23.296 5.248 31.456l0.288 0.224 4.448 3.552c6.048 4.48 11.616 6.784 17.664 10.336 12.768 7.904 23.296 14.432 31.712 22.272 3.232 3.488 3.84 9.632 4.256 12.288l6.816 6.112a273.28 273.28 0 0 0-46.336 152.992c0 13.856 1.024 27.488 3.008 40.8l-0.192-1.504-8.864 2.56c-2.336 3.072-5.664 7.84-9.184 9.248-10.976 3.456-23.296 4.704-38.176 6.272-7.008 0.608-13.024 0.256-20.48 1.664-1.568 0.288-3.84 0.864-5.664 1.28l-0.16 0.096-0.288 0.096c-12.576 3.04-20.64 14.592-18.048 25.952 2.592 11.392 14.88 18.304 27.52 15.584l0.288-0.032 0.416-0.128 5.504-1.248c7.264-1.952 12.544-4.832 19.104-7.328 14.08-5.024 25.76-9.248 37.12-10.912 4.768-0.384 9.824 2.944 12.288 4.32l9.248-1.568a278.912 278.912 0 0 0 121.632 152.736l1.248 0.704-3.84 9.312c1.408 3.584 2.944 8.48 1.888 12.032-4.128 10.752-11.232 22.048-19.296 34.688-3.872 5.792-7.904 10.336-11.424 17.024-0.864 1.568-1.92 4.064-2.72 5.728-5.472 11.744-1.44 25.216 9.088 30.304 10.592 5.12 23.712-0.288 29.44-12.032v-0.096c0.864-1.664 1.952-3.84 2.656-5.408 2.976-6.912 4-12.832 6.144-19.552 5.632-14.176 8.736-29.024 16.512-38.272 2.144-2.56 5.536-3.488 9.184-4.48l4.832-8.736a270.592 270.592 0 0 0 99.008 18.4 274.56 274.56 0 0 0 99.52-18.528l-1.888 0.64 4.512 8.192c3.68 1.184 7.68 1.792 10.912 6.624 5.792 9.888 9.76 21.632 14.592 35.84 2.144 6.656 3.168 12.576 6.176 19.488 0.672 1.568 1.824 3.84 2.656 5.504 5.664 11.776 18.848 17.152 29.44 12.032 10.528-5.024 14.56-18.56 9.088-30.304-0.864-1.664-1.92-4.096-2.784-5.728-3.552-6.656-7.552-11.136-11.424-16.992-8.096-12.64-14.752-23.072-18.912-33.824-1.696-5.536 0.288-8.96 1.632-12.544-0.768-0.928-2.528-6.144-3.552-8.608a278.88 278.88 0 0 0 122.336-152.576l0.544-1.952c2.72 0.416 7.52 1.28 9.088 1.632 3.2-2.144 6.144-4.864 11.936-4.448 11.36 1.664 23.04 5.888 37.12 10.912 6.56 2.56 11.808 5.472 19.104 7.392 1.536 0.416 3.744 0.8 5.536 1.184l0.384 0.128 0.288 0.032c12.672 2.72 24.928-4.192 27.52-15.584 2.56-11.36-5.472-22.912-18.048-25.952z m-169.088-175.264l-83.2 74.496v0.224a18.784 18.784 0 0 0 7.264 32.256l0.128 0.032 0.128 0.416 107.776 31.072a222.4 222.4 0 0 0-4.896-72.96l0.288 1.504a222.336 222.336 0 0 0-28.032-68.064l0.544 0.928z m-171.232 227.2a18.656 18.656 0 0 0-16.48-9.92l-0.8 0.032h0.032a18.72 18.72 0 0 0-15.808 9.856l-0.064 0.096h-0.096l-54.112 97.792a215.712 215.712 0 0 0 71.136 11.808c25.344 0 49.664-4.288 72.32-12.128l-1.536 0.48-54.176-97.952h-0.416z m80.544-55.168a18.784 18.784 0 0 0-11.616 1.568l0.096-0.064a18.816 18.816 0 0 0-9.088 24.512l-0.032-0.128-0.128 0.16 43.104 104.032a220.8 220.8 0 0 0 88.288-110.048l0.48-1.536-110.944-18.784-0.16 0.224z"
          fill="#4d73b1"
          p-id="3691"
        />
      </svg>
    );
    const selectIcon = (
      <svg
        t="1586161102258"
        viewBox="0 0 1293 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="5713"
      >
        <path
          d="M503.376842 1024a79.764211 79.764211 0 0 1-55.080421-22.096842L24.576 595.698526A79.764211 79.764211 0 0 1 22.096842 483.004632c30.342737-31.797895 80.842105-32.929684 112.478316-2.425264l361.849263 346.812632L1152.431158 29.049263a79.494737 79.494737 0 0 1 112.101053-10.832842c33.953684 27.917474 38.696421 78.201263 10.778947 112.101053L564.816842 994.950737c-14.012632 17.084632-34.708211 27.648-56.697263 28.887579C506.394947 1024 504.778105 1024 503.376842 1024z"
          fill="#ffffff"
          p-id="5714"
        />
      </svg>
    );
    const hostIcon = (
      <svg
        t="1610787647584"
        className="icon"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="2590"
      >
        <path
          d="M832 800H192a128 128 0 0 1-128-128V192a128 128 0 0 1 128-128h640a128 128 0 0 1 128 128v480a128 128 0 0 1-128 128z m64-544a128 128 0 0 0-128-128H256a128 128 0 0 0-128 128v352a128 128 0 0 0 128 128h512a128 128 0 0 0 128-128V256zM60.384 864h914.24c50.496 0 61.664 34.048 29.088 71.264C975.008 968.096 921.504 992 881.312 992H153.696c-40.192 0-93.664-23.904-122.4-56.736C-1.248 898.048 9.92 864 60.384 864z"
          fill={global.getPublicColor()}
          p-id="2591"
        />
        <path
          d="M384 928a128 32 0 1 0 256 0 128 32 0 1 0-256 0Z"
          fill={global.getPublicColor()}
          p-id="2592"
        />
        <path
          d="M256 493.504a114.496 114.016 90 1 0 228.032 0 114.496 114.016 90 1 0-228.032 0Z"
          fill={global.getPublicColor()}
          p-id="2593"
        />
        <path
          d="M508.512 380m-123.488 0a123.488 123.488 0 1 0 246.976 0 123.488 123.488 0 1 0-246.976 0Z"
          fill={global.getPublicColor()}
          p-id="2594"
        />
        <path
          d="M654.016 493.504m-114.016 0a114.016 114.016 0 1 0 228.032 0 114.016 114.016 0 1 0-228.032 0Z"
          fill={global.getPublicColor()}
          p-id="2595"
        />
        <path d="M398.016 460.992h256V608h-256z" fill={global.getPublicColor()} p-id="2596" />
      </svg>
    );
    const helmIcon = (
      <svg viewBox="0 0 1024 1024" id="icon-helm">
        <path
          d="M795.776 821.418667c30.037333 42.88 40.96 86.997333 24.448 98.56-16.512 11.562667-54.229333-13.824-84.266667-56.704a214.997333 214.997333 0 0 1-24.917333-46.165334 365.738667 365.738667 0 0 1-166.314667 59.733334c3.456 14.506667 5.546667 31.445333 5.546667 49.749333 0 52.352-16.341333 94.762667-36.522667 94.762667s-36.522667-42.410667-36.522666-94.762667c0-17.92 2.005333-34.432 5.333333-48.725333a365.568 365.568 0 0 1-168.277333-54.784c-5.418667 12.842667-12.8 26.496-22.357334 40.192-30.037333 42.88-67.754667 68.266667-84.266666 56.704-16.512-11.562667-5.589333-55.68 24.448-98.56a218.453333 218.453333 0 0 1 31.701333-36.266667 363.946667 363.946667 0 0 1-55.850667-63.104l47.957334-33.365333a307.2 307.2 0 0 0 252.074666 131.754666 307.2 307.2 0 0 0 252.416-132.181333l48 33.28a365.525333 365.525333 0 0 1-50.474666 58.282667c12.629333 10.282667 25.813333 24.448 37.845333 41.6zM267.818667 239.914667A366.378667 366.378667 0 0 0 201.002667 317.013333l49.066666 31.701334a305.92 305.92 0 0 1 257.962667-140.501334 304.810667 304.810667 0 0 1 262.442667 147.669334l49.92-30.336a369.408 369.408 0 0 0-66.56-80.853334c13.824-10.453333 28.629333-25.728 41.941333-44.757333 30.037333-42.88 40.96-86.997333 24.448-98.56-16.512-11.562667-54.229333 13.824-84.266667 56.704-12.544 17.877333-21.504 35.84-26.752 51.712a362.154667 362.154667 0 0 0-166.4-58.197333c4.608-15.872 7.466667-35.413333 7.466667-56.874667 0-52.309333-16.341333-94.72-36.522667-94.72s-36.522667 42.410667-36.522666 94.762667c0 20.949333 2.688 40.149333 7.125333 55.808a363.562667 363.562667 0 0 0-167.68 53.205333 212.949333 212.949333 0 0 0-24.746667-45.696C261.930667 115.2 224.213333 89.856 207.701333 101.418667c-16.512 11.562667-5.589333 55.68 24.448 98.56 11.306667 16.128 23.722667 29.781333 35.669334 39.936zM21.333333 651.605333h70.314667V546.133333h79.317333v105.514667h70.314667v-265.813333H171.008v98.944h-79.36V385.834667H21.333333v265.770666z m278.869334-265.770666v265.770666h175.829333v-58.88H370.517333V545.28h86.698667V486.4H370.517333v-41.728h101.418667v-58.88l-171.733333 0.042667z m227.328 0v265.770666h170.922666v-58.88h-100.608V385.834667h-70.314666z m216.704 0v265.770666h64.597333v-78.506666c0-6.826667-0.341333-14.293333-1.024-22.485334a2279.936 2279.936 0 0 0-2.261333-25.130666 704.682667 704.682667 0 0 0-2.858667-25.130667 1996.586667 1996.586667 0 0 1-2.858667-22.058667h1.621334l21.248 62.165334 36.821333 89.557333h26.154667l36.778666-89.557333 22.058667-62.165334h1.621333l-2.858666 22.101334c-1.109333 8.192-2.048 16.554667-2.858667 25.130666-0.810667 8.576-1.578667 16.981333-2.261333 25.130667a272 272 0 0 0-1.024 22.485333v78.506667H1002.666667v-265.813333h-72.789334l-40.064 110.421333-14.72 43.349333h-1.621333l-14.72-43.349333-41.728-110.421333h-72.789333z"
          fill="#4d73b1"
        />
      </svg>
    );
    const tencentIcon = (
      <svg
        t="1655178320143"
        className="icon"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="3029"
      >
        <path
          d="M753.066667 516.266667c-12.8-17.066667-27.733333-23.466667-51.2-29.866667-6.4-2.133333-27.733333-2.133333-32-2.133333 0 0-6.4 2.133333-10.666667 4.266666-6.4 2.133333-10.666667 4.266667-17.066667 6.4-8.533333 4.266667-25.6 17.066667-27.733333 19.2-2.133333 2.133333-4.266667 6.4-8.533333 8.533334-8.533333 6.4-59.733333 57.6-74.666667 70.4l-38.4 38.4c-17.066667 17.066667-29.866667 29.866667-29.866667 32 0 2.133333 194.133333 2.133333 217.6 0 8.533333 0 17.066667-2.133333 25.6-2.133334 17.066667-4.266667 34.133333-14.933333 46.933334-32 6.4-8.533333 10.666667-17.066667 14.933333-29.866666 2.133333-8.533333 4.266667-12.8 2.133333-27.733334 2.133333-23.466667-4.266667-38.4-17.066666-55.466666zM832 106.666667H192C145.066667 106.666667 106.666667 145.066667 106.666667 192v640c0 46.933333 38.4 85.333333 85.333333 85.333333h640c46.933333 0 85.333333-38.4 85.333333-85.333333V192c0-46.933333-38.4-85.333333-85.333333-85.333333z m-53.333333 580.266666c-10.666667 8.533333-23.466667 17.066667-29.866667 19.2-2.133333 0-4.266667 2.133333-6.4 2.133334-2.133333 2.133333-23.466667 6.4-36.266667 10.666666-10.666667 2.133333-27.733333 2.133333-194.133333 2.133334-198.4 0-189.866667 0-215.466667-6.4-21.333333-6.4-42.666667-19.2-59.733333-36.266667-29.866667-27.733333-42.666667-64-42.666667-104.533333 0-14.933333 2.133333-29.866667 6.4-44.8 6.4-17.066667 8.533333-23.466667 27.733334-49.066667 4.266667-4.266667 23.466667-21.333333 29.866666-27.733333 10.666667-6.4 44.8-21.333333 51.2-21.333334 4.266667 0 6.4-4.266667 8.533334-10.666666 6.4-21.333333 8.533333-25.6 12.8-40.533334 10.666667-25.6 29.866667-51.2 53.333333-70.4 4.266667-4.266667 8.533333-6.4 12.8-10.666666 2.133333-2.133333 4.266667-2.133333 6.4-4.266667 17.066667-12.8 53.333333-27.733333 78.933333-29.866667 27.733333-4.266667 59.733333-2.133333 81.066667 6.4 17.066667 4.266667 21.333333 6.4 23.466667 8.533334 4.266667 2.133333 10.666667 4.266667 14.933333 6.4 19.2 8.533333 42.666667 27.733333 55.466667 42.666666 10.666667 12.8 23.466667 27.733333 25.6 34.133334 0 2.133333 2.133333 4.266667 4.266666 6.4 2.133333 2.133333 4.266667 6.4 4.266667 10.666666 0 2.133333 2.133333 6.4 4.266667 10.666667 4.266667 8.533333 4.266667 8.533333-19.2 10.666667-10.666667 0-23.466667 2.133333-27.733334 2.133333-2.133333 0-6.4 2.133333-8.533333 2.133333 0 0-4.266667-4.266667-6.4-10.666666-6.4-12.8-19.2-25.6-29.866667-36.266667-17.066667-14.933333-34.133333-23.466667-59.733333-29.866667-12.8-8.533333-17.066667-8.533333-32-8.533333-12.8 0-21.333333 0-27.733333 2.133333-4.266667 2.133333-10.666667 2.133333-12.8 4.266667-17.066667 4.266667-38.4 17.066667-53.333334 29.866667-14.933333 14.933333-25.6 27.733333-32 42.666666-4.266667 6.4-12.8 29.866667-10.666666 32 0 0 6.4 4.266667 12.8 6.4 14.933333 4.266667 27.733333 12.8 40.533333 21.333334 12.8 8.533333 34.133333 27.733333 36.266667 29.866666 4.266667 4.266667 10.666667 8.533333 14.933333 12.8 6.4 6.4 12.8 10.666667 12.8 12.8 0 0-6.4 8.533333-14.933333 17.066667-19.2 17.066667-23.466667 21.333333-25.6 21.333333 0 0-4.266667-4.266667-10.666667-6.4-4.266667-4.266667-10.666667-10.666667-14.933333-12.8-4.266667-2.133333-10.666667-8.533333-14.933334-12.8-23.466667-21.333333-49.066667-34.133333-72.533333-34.133333-19.2 0-44.8 8.533333-57.6 21.333333-12.8 10.666667-25.6 29.866667-29.866667 46.933334-2.133333 10.666667-2.133333 34.133333 0 44.8 8.533333 34.133333 36.266667 57.6 70.4 64 10.666667 2.133333 21.333333 2.133333 32 2.133333h21.333334l10.666666-10.666667 23.466667-23.466666c40.533333-38.4 81.066667-76.8 119.466667-115.2 19.2-19.2 51.2-49.066667 68.266666-61.866667 8.533333-6.4 23.466667-14.933333 32-17.066667 4.266667-2.133333 8.533333-4.266667 12.8-4.266666 10.666667-4.266667 25.6-6.4 49.066667-4.266667 8.533333 0 14.933333 0 23.466667 2.133333 6.4 2.133333 29.866667 10.666667 32 10.666667 2.133333 2.133333 4.266667 2.133333 6.4 2.133333 6.4 2.133333 14.933333 8.533333 27.733333 19.2 12.8 10.666667 19.2 17.066667 23.466667 25.6 2.133333 2.133333 4.266667 6.4 6.4 8.533334 2.133333 2.133333 12.8 23.466667 12.8 25.6 0 2.133333 0 4.266667 2.133333 6.4 4.266667 6.4 8.533333 36.266667 8.533333 46.933333-2.133333 40.533333-23.466667 83.2-55.466666 110.933333z"
          p-id="3030"
          fill="#1296db"
        />
      </svg>
    );
    const aliIcon = (
      <svg
        t="1654472907135"
        className="icon"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="3310"
      >
        <path
          d="M832 106.666667H192C145.066667 106.666667 106.666667 145.066667 106.666667 192v640c0 46.933333 38.4 85.333333 85.333333 85.333333h640c46.933333 0 85.333333-38.4 85.333333-85.333333V192c0-46.933333-38.4-85.333333-85.333333-85.333333zM311.466667 689.066667c-53.333333 0-98.133333-42.666667-98.133334-96v-164.266667c0-53.333333 42.666667-96 98.133334-96v-2.133333H469.333333l-12.8 55.466666-136.533333 29.866667c-12.8 4.266667-21.333333 12.8-21.333333 25.6v138.666667c0 12.8 10.666667 23.466667 21.333333 25.6l134.4 27.733333 12.8 55.466667h-155.733333z m256-189.866667v27.733333h-108.8v-27.733333h108.8zM810.666667 595.2c0 53.333333-42.666667 96-98.133334 96H554.666667l12.8-55.466667 134.4-27.733333c12.8-4.266667 21.333333-12.8 21.333333-25.6v-138.666667c0-12.8-10.666667-23.466667-21.333333-25.6l-134.4-27.733333-12.8-55.466667h155.733333c53.333333 0 98.133333 42.666667 98.133333 96v164.266667z"
          p-id="3311"
          fill="#fb6902"
        />
      </svg>
    );
    const huaweiIcon = (
      <svg
        t="1655178638461"
        className="icon"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="4414"
      >
        <path
          d="M446.50124 183.429683s-71.363328-3.247974-116.870777 55.568596c-45.528939 58.814524-11.337209 148.651598 10.248411 194.994066 21.584598 46.341445 135.480624 228.190119 139.664923 232.190223 4.151553 4.010337 9.154497 2.322905 9.42772-1.276063 0.275269-3.569292 13.010315-264.227893 2.76088-328.498686-10.248412-64.272839-40.591487-145.927557-45.231157-152.978136zM199.86091 304.604486c-8.156774 0.87288-66.697051 59.253522-71.973218 116.331495-5.301749 57.07388 19.128663 95.057983 87.341231 140.499941 68.664869 48.689932 231.852532 138.264017 234.849796 130.547265 3.001357-7.696286-63.235207-125.387755-117.44076-210.986295-54.201459-85.596494-124.656091-177.262216-132.777049-176.392406z m21.946848 526.487969c49.38578 22.079878 126.322034-27.508517 147.604756-41.930994 19.792788-15.121396 56.353472-42.919509 56.353473-42.919509l-279.836383 7.489578s26.491351 55.276954 75.878154 77.360925z m7.030114-226.13532c-50.083675-25.069979-153.122423-82.662675-157.154249-81.560574-4.030803 1.100054-19.553335 72.743768 12.670577 126.742613 32.223912 53.998845 94.978165 70.511937 123.777071 74.924433 32.379455 4.613064 222.75841 2.551102 221.482347-1.277086-1.122567-3.341095-150.662395-93.782943-200.775746-118.829386z m464.281185-365.957833c-45.503357-58.81657-116.869754-55.568596-116.869754-55.568596-4.63353 7.048533-34.983769 88.703251-45.231157 152.978137-10.249435 64.271816 2.517333 324.928371 2.789532 328.500732 0.275269 3.595898 5.244444 5.281283 9.423627 1.27504 4.1536-4.002151 118.081349-185.850825 139.667993-232.19227 21.553898-46.342468 55.748698-136.177496 10.219759-194.993043zM951.064874 523.395538c-4.02978-1.103124-107.068528 56.492642-157.151179 81.560574-50.083675 25.045419-199.652156 115.488291-200.748117 118.829385-1.302669 3.827165 189.076286 5.891174 221.455741 1.277087 28.79686-4.412496 91.551112-20.925588 123.777071-74.924434 32.253588-53.997821 16.697287-125.643582 12.666484-126.742612zM653.344169 789.161461c21.278629 14.421454 98.245581 64.010873 147.634432 41.930994 49.384757-22.086018 75.881225-77.360925 75.881224-77.360925l-279.837406-7.489578c-0.002047 0 36.556591 27.802206 56.32175 42.919509z m241.551428-368.226503c-5.304819-57.07695-63.84305-115.457592-71.970148-116.331495-8.151657-0.86981-78.608336 90.795912-132.809795 176.393429-54.207599 85.59854-120.439046 203.293079-117.438713 210.986295 3.000334 7.715729 166.212556-81.857333 234.851842-130.547265 68.208475-45.442982 92.672656-83.426061 87.366814-140.500964z"
          p-id="4415"
          fill="#fa0000"
        />
      </svg>
    );
    const omitIcon = (
      <svg
        t="1654472665453"
        className="icon"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="2435"
        width="30"
        height="30"
      >
        <path
          d="M221 592c-44.183 0-80-35.817-80-80s35.817-80 80-80 80 35.817 80 80-35.817 80-80 80z m291 0c-44.183 0-80-35.817-80-80s35.817-80 80-80 80 35.817 80 80-35.817 80-80 80z m291 0c-44.183 0-80-35.817-80-80s35.817-80 80-80 80 35.817 80 80-35.817 80-80 80z"
          fill="#768696"
          p-id="2436"
        />
      </svg>
    );
    const providers = cloud.getProviders();
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
          {omitIcon}
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
                <div className={styles.importicon}>{hostIcon}</div>
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
                <div className={styles.importicon}>{kubernetesIcon}</div>
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
                <div className={styles.importicon}>{aliIcon}</div>
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
                <div className={styles.importicon}>{huaweiIcon}</div>
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
                <div className={styles.importicon}>{tencentIcon}</div>
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
        {K8sCluster && showInitTaskDetail && (
          <ShowInitRainbondDetail
            onCancel={this.cancelShowInitDetail}
            eid={eid}
            providerName={selectProvider}
            taskID={initTask.taskID}
            clusterID={initTask.clusterID}
          />
        )}
      </PageHeaderLayout>
    );
  }
}
