/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import { Card, Form, Row, Steps } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import React, { PureComponent } from 'react';
import RainbondClusterInit from '../../../components/Cluster/RainbondClusterInit';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import userUtil from '../../../utils/user';

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
      adminer
    };
  }
  componentWillMount() {
    const { adminer } = this.state;
    const { dispatch } = this.props;
    if (!adminer) {
      dispatch(routerRedux.push(`/`));
    }
  }
  componentDidMount() {}

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
  nextStep = () => {
    const { dispatch } = this.props;
    const {
      match: {
        params: { eid, provider, clusterID }
      }
    } = this.props;
    dispatch(
      routerRedux.push(`/enterprise/${eid}/provider/${provider}/kclusters/${clusterID}/check`)
    );
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

  render() {
    const {
      match: {
        params: { eid, provider, clusterID, taskID }
      }
    } = this.props;
    return (
      <PageHeaderLayout
      title={<FormattedMessage id='enterpriseColony.button.text'/>}
      content={<FormattedMessage id='enterpriseColony.PageHeaderLayout.content'/>}
      titleSvg={pageheaderSvg.getSvg('clusterSvg',18)}
      >
        <Row style={{ marginBottom: '16px' }}>
          <Steps current={2}>
            {this.loadSteps().map(item => (
              <Step key={item.title} title={item.title} />
            ))}
          </Steps>
        </Row>
        <Row>
          <RainbondClusterInit
            eid={eid}
            completeInit={this.completeInit}
            selectProvider={provider}
            taskID={taskID}
            clusterID={clusterID}
            preStep={this.preStep}
            nextStep={this.nextStep}
          />
        </Row>
      </PageHeaderLayout>
    );
  }
}
