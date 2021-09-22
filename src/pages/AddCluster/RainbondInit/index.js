/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import { Card, Form, Row, Steps } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import RainbondClusterInit from '../../../components/Cluster/RainbondClusterInit';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
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
  loadSteps = () => {
    const steps = [
      {
        title: '选择供应商'
      },
      {
        title: '选择(创建)平台集群'
      },
      {
        title: '初始化平台集群'
      },
      {
        title: '完成对接'
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
        title="添加集群"
        content="集群是资源的集合，以Kubernetes集群为基础，部署平台Region服务即可成为平台集群资源。"
      >
        <Row style={{ marginBottom: '16px' }}>
          <Steps current={2}>
            {this.loadSteps().map(item => (
              <Step key={item.title} title={item.title} />
            ))}
          </Steps>
        </Row>
        <Card>
          <Row style={{ marginBottom: '16px' }}>
            <RainbondClusterInit
              eid={eid}
              completeInit={this.completeInit}
              selectProvider={provider}
              taskID={taskID}
              clusterID={clusterID}
              preStep={this.preStep}
            />
          </Row>
        </Card>
      </PageHeaderLayout>
    );
  }
}
