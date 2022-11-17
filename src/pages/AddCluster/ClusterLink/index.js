/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import { Card, Form, Row, Steps } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import SetRegionConfig from '../../../components/Cluster/SetRegionConfig';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
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
export default class ClusterLink extends PureComponent {
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

  render() {
    const {
      match: {
        params: { eid, provider, clusterID }
      }
    } = this.props;
    return (
      <PageHeaderLayout
      title={<FormattedMessage id='enterpriseColony.button.text'/>}
      content={<FormattedMessage id='enterpriseColony.PageHeaderLayout.content'/>}
      titleSvg={pageheaderSvg.getSvg('clusterSvg',18)}
      >
        <Row style={{ marginBottom: '16px' }}>
          <Steps current={3}>
            {this.loadSteps().map(item => (
              <Step key={item.title} title={item.title} />
            ))}
          </Steps>
        </Row>
        <Card>
          <Row style={{ marginBottom: '16px' }}>
            <SetRegionConfig
              eid={eid}
              selectProvider={provider}
              selectClusterID={clusterID}
            />
          </Row>
        </Card>
      </PageHeaderLayout>
    );
  }
}
