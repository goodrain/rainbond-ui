/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import { Card, Form, Row, Steps, Button, Col } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import React, { PureComponent } from 'react';
import cloud from '../../../utils/cloud';
import globalUtil from '../../../utils/global';
import ClusterComponents from '../../../components/Cluster/ClusterComponentsInfo';
import InitRainbondDetail from '../../../components/Cluster/ShowInitRainbondDetail';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import userUtil from '../../../utils/user';
import styles from './index.less';
const { Step } = Steps;

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
export default class RainbondInit extends PureComponent {
  constructor(props) {
    super(props);
    const { user } = this.props;
    const adminer = userUtil.isCompanyAdmin(user);
    this.state = {
      adminer,
      showInitDetail: false,
      guideStep: 10,
      task: null
    };
  }
  componentWillMount() {
    const { adminer } = this.state;
    const { dispatch } = this.props;
    if (!adminer) {
      dispatch(routerRedux.push(`/`));
    }
  }

  componentWillUnmount() {
    this.refresh = false;
  }

  componentDidMount() {
    // this.toClusterList()
  }
  toClusterList = (provider = 'rke') => {
    const { dispatch } = this.props;
    const {
      match: {
        params: { eid }
      }
    } = this.props;
    const TOCLUSTERLIST_PATHS = {
      initializing: '/enterprise/{eid}/provider/{provider}/kclusters/append?event_id={eventId}',
      initialized: '/enterprise/{eid}/provider/{provider}/kclusters?event_id={eventId}',
      installing: '/enterprise/{eid}/provider/{provider}/kclusters?type=installing&event_id={eventId}',
      installed: '/enterprise/{eid}/provider/{provider}/kclusters?event_id={eventId}',
      integrating: '/enterprise/{eid}/provider/{provider}/kclusters/init?event_id={eventId}',
      integrated: '/enterprise/{eid}/provider/{provider}/kclusters/check?event_id={eventId}',
    };
    dispatch({
      type: 'region/fetchClusterInfo',
      payload: {
        cluster_id: ''
      },
      callback: res => {
        if (res && res.status_code === 200) {
          window.localStorage.setItem('event_id', res.bean.event_id)
          const status = res.bean.create_status;
          let path = TOCLUSTERLIST_PATHS[status] || TOCLUSTERLIST_PATHS.initializing;
          path = path.replace('{eid}', eid).replace('{provider}', provider);
          if (path.includes('{eventId}')) {
            path = path.replace('{eventId}', res.bean.event_id);
          }
          dispatch(routerRedux.push(path));
        }
      }
    });
  };



  loadTask = noopen => {
    const {
      dispatch,
      match: {
        params: { eid, provider, clusterID }
      }
    } = this.props;
    const enterpriseID = eid || globalUtil.getCurrEnterpriseId()
    dispatch({
      type: 'cloud/loadInitRainbondTask',
      payload: {
        enterprise_id: enterpriseID,
        clusterID,
        providerName: provider
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
        }
      },
      handleError: res => {

      }
    });
  };
  addClusterOK = () => {
    const { dispatch } = this.props;
    const {
      match: {
        params: { eid }
      }
    } = this.props;
    const enterpriseID = eid || globalUtil.getCurrEnterpriseId()
    dispatch(routerRedux.push(`/enterprise/${enterpriseID}/clusters`));
  };
  preStep = () => {
    const { dispatch } = this.props;
    const {
      match: {
        params: { eid, provider }
      }
    } = this.props;
    const enterpriseID = eid || globalUtil.getCurrEnterpriseId()
    dispatch(
      routerRedux.push(`/enterprise/${enterpriseID}/provider/${provider}/kclusters?event_id=${window.localStorage.getItem('event_id')}`)
    );
  };
  loadSteps = () => {
    const steps = [
      {
        title: formatMessage({ id: 'enterpriseColony.addCluster.supplier' })
      },
      {
        title: formatMessage({ id: 'enterpriseColony.addCluster.cluster' })
      },
      {
        title: formatMessage({ id: 'enterpriseColony.addCluster.Initialize' })
      },
      {
        title: formatMessage({id : 'enterpriseColony.addCluster.clusterInit'})
      },
      {
        title: formatMessage({ id: 'enterpriseColony.addCluster.docking' })
      }
    ];
    return steps;
  };
  completeInit = () => {
    const { dispatch } = this.props;
    const {
      match: {
        params: { eid, provider, clusterID }
      }
    } = this.props;
    const enterpriseID = eid || globalUtil.getCurrEnterpriseId()
    dispatch(
      routerRedux.push(
        `/enterprise/${enterpriseID}/provider/${provider}/kclusters/link`
      )
    );
  };

  cancelShowInitDetail = () => {
    this.setState({ showInitDetail: false });
  }

  render() {
    const {
      match: {
        params: { eid, provider, clusterID, taskID }
      }
    } = this.props;
    const { showInitDetail, guideStep, task } = this.state;
    return (
      <PageHeaderLayout
        title={<FormattedMessage id='enterpriseColony.button.text' />}
        content={<FormattedMessage id='enterpriseColony.PageHeaderLayout.content' />}
        titleSvg={pageheaderSvg.getPageHeaderSvg('clusters', 18)}
      >
        <Row style={{ marginBottom: '16px' }}>
          <Steps current={3}>
            {this.loadSteps().map(item => (
              <Step key={item.title} title={item.title} />
            ))}
          </Steps>
        </Row>
        <div className={styles.clusterInit}>
          <div className={styles.clusterComponent}>
            <ClusterComponents
              eid={eid}
              clusterID={clusterID}
              providerName={provider}
              completeInit={this.completeInit}
              preStep={this.preStep}
            />
          </div>
        </div>
      </PageHeaderLayout>
    );
  }
}
