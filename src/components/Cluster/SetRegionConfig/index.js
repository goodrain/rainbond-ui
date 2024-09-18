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
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import Result from '../../../components/Result';
import cloud from '../../../utils/cloud';
import styles from './index.less'
@connect()
@Form.create()
export default class SetRegionConfig extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      configs: {},
      guideStep: 13,
      task: null,
      cluster_id: '',
      cluster_name: '',
    };
  }
  componentDidMount() {
    this.getCluterName()
    this.loadTask();
  }
  getCluterName = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'region/fetchClusterInfo',
      payload: {
        cluster_id: ''
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            cluster_id: res.bean.cluster_id,
            cluster_name: res.bean.cluster_name,
          })
        }
      }
    });
  }
  createClusters = () => {
    const { dispatch, eid, form, selectProvider } = this.props;
    const { configsYaml, cluster_name, cluster_id } = this.state;
    let desc;
    switch (selectProvider) {
      case 'ack':
        desc = `${formatMessage({ id: 'enterpriseColony.SetRegionConfig.staackrt' })}`;
        break;
      case 'tke':
        desc = `${formatMessage({ id: 'enterpriseColony.SetRegionConfig.tke' })}`;
        break;
      case 'custom':
        desc = `${formatMessage({ id: 'enterpriseColony.SetRegionConfig.custom' })}`;
        break;
      case 'rke':
        desc = `${formatMessage({ id: 'enterpriseColony.SetRegionConfig.rke' })}`;
        break;
      default:
        desc = `${formatMessage({ id: 'enterpriseColony.SetRegionConfig.Self' })}`;
    }
    this.setState({ commitloading: true });
    dispatch({
      type: 'region/createEnterpriseCluster',
      payload: {
        region_alias: cluster_name,
        region_name: cluster_id,
        enterprise_id: eid,
        desc,
        token: configsYaml,
        region_type: ['custom'],
        provider: selectProvider,
        providerClusterID: window.localStorage.getItem('event_id')
      },
      callback: res => {
        if (res && res._condition === 200) {
          notification.success({ message: formatMessage({ id: 'notification.success.add' }) });
          dispatch(routerRedux.push(`/enterprise/${eid}/clusters`));
        }
      },
      handleError: errs => {
        cloud.handleCloudAPIError(errs);
        this.setState({ commitloading: false });
      }
    });
  };
  loadTask = () => {
    const { dispatch, eid, selectClusterID, selectProvider } = this.props;
    dispatch({
      type: 'region/getReginConfig',
      callback: data => {
        if (data) {
          this.setState({
            configs: data.bean.configs,
            configsYaml: data.bean.configs_yaml,
            loading: false
          });
        }
      },
      handleError: res => {
        if (res.data && res.data.code === 404) {
          return;
        }
        cloud.handleCloudAPIError(res);
        this.setState({ loading: false });
      }
    });
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
        clusterTitle = `${formatMessage({ id: 'enterpriseColony.SetRegionConfig.ali' })}`;
        break;
      case 'tke':
        clusterTitle = `${formatMessage({ id: 'enterpriseColony.SetRegionConfig.tenxun' })}`;
        break;
      case 'custom':
        clusterTitle = `${formatMessage({ id: 'enterpriseColony.SetRegionConfig.docking' })}`;
        break;
      case 'rke':
        clusterTitle = `${formatMessage({ id: 'enterpriseColony.SetRegionConfig.Self' })}`;
        break;
      default:
        clusterTitle = `${formatMessage({ id: 'enterpriseColony.SetRegionConfig.Self' })}`;
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
        <Card bordered={false} style={{ padding: '0 16px' }}>
          {loading ? (
            <Result
              type="ing"
              title={formatMessage({id:'enterpriseColony.newHostInstall.node.ing'})}
              style={{ padding: '48px' }}
            />
          ) : (
            !configs?.apiAddress ? (
              <Result
                type="error"
                title={formatMessage({id:'enterpriseColony.newHostInstall.node.Notpass'})}
                description={`${formatMessage({id:'enterpriseColony.newHostInstall.node.Api'})} ${configs?.apiAddress} ${formatMessage({id:'enterpriseColony.newHostInstall.node.check'})}`}
                style={{ padding: '48px' }}
              />
            ) : (
              <>
                <Result
                  type="success"
                  title={formatMessage({id:'enterpriseColony.newHostInstall.node.pass'})}
                  style={{ padding: '48px' }}
                />
                <Row>
                  <Col style={{ textAlign: 'center', marginTop: '32px' }} span={24}>
                    <Button
                      loading={commitloading}
                      onClick={this.createClusters}
                      disabled={!configs.apiAddress}
                      type="primary"
                    >
                      <FormattedMessage id='button.Completed' />
                    </Button>
                  </Col>
                </Row>
              </>
            )
          )}


        </Card>
      </Form>
    );
  }
}
