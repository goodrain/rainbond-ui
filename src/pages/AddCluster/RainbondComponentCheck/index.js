/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import { Card, Form, Row, Steps, Button, Col } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import React, { PureComponent } from 'react';
import cloud from '../../../utils/cloud';
import globalUtil from '../../../utils/global';
import ClusterComponents from '../../../components/Cluster/ClusterComponents';
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
    this.loadTask();
  }



  loadTask = noopen => {
    const {
      dispatch,
      match: {
        params: { eid, provider, clusterID }
      }
    } = this.props;
    const {

    } = this.props;
    dispatch({
      type: 'cloud/loadInitRainbondTask',
      payload: {
        enterprise_id: eid,
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
    dispatch(routerRedux.push(`/enterprise/${eid}/clusters`));
  };
  preStep = () => {
    const { dispatch } = this.props;
    const {
      match: {
        params: { eid, provider }
      }
    } = this.props;
    dispatch(
      routerRedux.push(`/enterprise/${eid}/provider/${provider}/kclusters`)
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
    dispatch(
      routerRedux.push(
        `/enterprise/${eid}/provider/${provider}/kclusters/${clusterID}/link`
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
        titleSvg={pageheaderSvg.getSvg('clusterSvg', 18)}
      >
        <Row style={{ marginBottom: '16px' }}>
          <Steps current={3}>
            {this.loadSteps().map(item => (
              <Step key={item.title} title={item.title} />
            ))}
          </Steps>
        </Row>
        <div className={styles.clusterInit}>
          <div className={styles.initRainbond}>
            {task && <InitRainbondDetail
              onCancel={this.cancelShowInitDetail}
              eid={eid}
              guideStep={guideStep}
              providerName={provider}
              clusterID={clusterID}
              taskID={task && task.taskID}
              completeInit={this.completeInit}
            />}
          </div>
          <div className={styles.clusterComponent}>
            <ClusterComponents
              eid={eid}
              clusterID={clusterID}
              providerName={provider}
            />
          </div>
        </div>
      </PageHeaderLayout>
    );
  }
}
