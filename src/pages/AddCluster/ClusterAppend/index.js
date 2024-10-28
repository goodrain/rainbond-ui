/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import { Card, Form, Row, Steps, Col, Input, Button } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import SetRegionConfig from '../../../components/Cluster/SetRegionConfig';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import GlobalUtile from '../../../utils/global'
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
  componentDidMount() { }
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
        title: formatMessage({ id: 'enterpriseColony.addCluster.clusterInit' })
      },
      {
        title: formatMessage({ id: 'enterpriseColony.addCluster.docking' })
      }
    ];
    return steps;
  };
  createClusters = () => {
    const { dispatch, eid, form,
      match: {
        params: { provider }
      }
     } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (err) {
        return;
      }
      dispatch({
        type: 'region/addReginConfig',
        payload: {
          ...fieldsValue
        },
        callback: res => {
          if (res && res.status_code === 200) {
            dispatch(routerRedux.push(`/enterprise/${eid || GlobalUtile.getCurrEnterpriseId()}/provider/${provider}/kclusters?event_id=${res.bean.event_id}`));
          }
        },
        handleError: errs => {
        }
      });
    });
  };
  lastOrNextSteps = (type) => {
    const { dispatch } = this.props;
    const {
      match: {
        params: { eid, provider }
      }
    } = this.props;
    if (type == 'last') {
      dispatch(routerRedux.push(`/enterprise/${eid || GlobalUtile.getCurrEnterpriseId()}/addCluster`));
    } 
  }

  render() {
    const {
      form,
      match: {
        params: { eid, provider }
      }
    } = this.props;
    const { getFieldDecorator } = form;
    return (
      <PageHeaderLayout
        title={<FormattedMessage id='enterpriseColony.button.text' />}
        content={<FormattedMessage id='enterpriseColony.PageHeaderLayout.content' />}
        titleSvg={pageheaderSvg.getSvg('clusterSvg', 18)}
      >
        <Row style={{ marginBottom: '16px' }}>
          <Steps current={0}>
            {this.loadSteps().map(item => (
              <Step key={item.title} title={item.title} />
            ))}
          </Steps>
        </Row>
        <Card>
          <Form>
            <Row>
              <Col span={6} style={{ paddingRight: '16px' }}>
                <Form.Item label={<FormattedMessage id='enterpriseColony.SetRegionConfig.id' />}>
                  {getFieldDecorator('cluster_id', {
                    initialValue: '',
                    rules: [
                      {
                        required: true,
                        message: formatMessage({ id: 'enterpriseColony.SetRegionConfig.input_id' })
                      },
                      {
                        pattern: /^[a-z0-9A-Z-_]+$/,
                        message: formatMessage({ id: 'enterpriseColony.SetRegionConfig.only' })
                      }
                    ]
                  })(<Input placeholder={formatMessage({ id: 'enterpriseColony.SetRegionConfig.input_id' })} />)}
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label={<FormattedMessage id='applicationMarket.CreateHelmAppModels.colony' />}>
                  {getFieldDecorator('cluster_name', {
                    initialValue: '',
                    rules: [
                      { required: true, message: formatMessage({ id: 'enterpriseColony.BaseAddCluster.name' }) },
                      { max: 24, message: formatMessage({ id: 'enterpriseColony.addCluster.host.max' }) }
                    ]
                  })(<Input placeholder={formatMessage({ id: 'enterpriseColony.BaseAddCluster.name' })} />)}
                </Form.Item>
              </Col>
            </Row>
            <Row type="flex" justify="center">
            <Button onClick={() => this.lastOrNextSteps('last')} style={{ marginRight: 24 }}>取消</Button>
            <Button
                onClick={this.createClusters}
                type="primary"
              >
                {formatMessage({ id: 'enterpriseColony.newHostInstall.node.next' })}
              </Button>
            </Row>
          </Form>
        </Card>
      </PageHeaderLayout>
    );
  }
}
