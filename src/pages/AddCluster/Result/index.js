/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import { Button, Card, Form, Row, Spin, Steps } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import Qs from 'qs';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import router from 'umi/router';
import Result from '../../../components/Result';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import userUtil from '../../../utils/user';
import styles from './index.less';

const FormItem = Form.Item;
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
    const {
      user,
      location: { search }
    } = this.props;
    const { data, token, copy, name, step } = Qs.parse(search.substr(1)) || {};
    const adminer = userUtil.isCompanyAdmin(user);
    this.state = {
      adminer,
      status: 'failed',
      flagStatus: false,
      data,
      token,
      copy,
      name,
      step
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
    this.getRegionLength();
  }
  getRegionLength = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    const { token } = this.state;
    dispatch({
      type: 'region/fetchHelmJoinStatus',
      payload: {
        eid,
        token
      },
      callback: res => {
        if (res.status_code === 200) {
          this.setState({
            flagStatus: true,
            status: res.response_data.msg
          });
        }
      }
    });
  };
  loadSteps = () => {
    const steps = [
      {
        title: formatMessage({id:'enterpriseColony.ACksterList.basic'})
      },
      {
        title: formatMessage({id:'enterpriseColony.ACksterList.senior'})
      },
      {
        title: formatMessage({id:'enterpriseColony.ACksterList.install'})
      },
      {
        title: formatMessage({id:'enterpriseColony.ACksterList.Docking'})
      }
    ];
    return steps;
  };
  toLinkNext = value => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    const { data, copy, token, name, step } = this.state;
    // 返回上一步
    if (value === 'install') {
      router.push({
        pathname: `/enterprise/${eid}/provider/ACksterList/install`,
        search: Qs.stringify({
          data,
          copy,
          token,
          name,
          step,
          isResult: true
        })
      });
    } else if (value === 'finish') {
      dispatch(routerRedux.push(`/enterprise/${eid}/clusters`));
    }else if (value === 'next') {
      dispatch(routerRedux.push(`/enterprise/${eid}/importMessage?region_id=`));
    }
  };
  //   刷新进度
  refreshStatus = () => {
    this.setState({
      flagStatus: false
    });
    this.getRegionLength();
  };
  renderBody = () => {
    const { status } = this.state;
    let type = '';
    let title = '';
    let desc = '';
    let actions = [];
    if (status === 'success') {
      type = 'success';
      title = `${formatMessage({id:'enterpriseColony.cloud.success'})}`
      desc = `${formatMessage({id:'enterpriseColony.cloud.back'})}`
      actions = [
        <Button
          className={styles.antd_btn}
          onClick={() => {
            this.toLinkNext('finish');
          }}
          type="primary"
        >
          <FormattedMessage id='enterpriseColony.cloud.return'/>
        </Button>,
        <Button
        className={styles.antd_btn}
        onClick={() => {
          this.toLinkNext('next');
        }}
        type="primary"
      >
        <FormattedMessage id='enterpriseColony.cloud.import'/>
      </Button>
      ];
    }
    if (status === 'failed') {
      type = 'error';
      title = `${formatMessage({id:'enterpriseColony.cloud.fail'})}`;
      desc =`${formatMessage({id:'enterpriseColony.cloud.Refresh'})}`;
      actions = [
        <Button
          className={styles.antd_btn}
          onClick={() => {
            this.toLinkNext('install');
          }}
          // type="primary"
        >
          <FormattedMessage id='button.previous'/>
        </Button>,
        <Button
          onClick={() => {
            this.refreshStatus();
          }}
          className={styles.antd_btn}
          type="primary"
        >
          <FormattedMessage id='enterpriseColony.cloud.speed'/>
        </Button>
      ];
    }

    return (
      <Result
        className={styles.lists}
        type={type}
        title={title}
        actions={actions}
        description={<div>{desc}</div>}
      />
    );
  };
  render() {
    const {
      match: {
        params: { eid, provider, clusterID }
      }
    } = this.props;
    const { flagStatus } = this.state;
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 2 },
        sm: { span: 2 }
      },
      wrapperCol: {
        xs: { span: 5 },
        sm: { span: 5 }
      }
    };
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
        <Card style={{ padding: '24px' }}>
          {!flagStatus && (
            <Spin tip="Loading...">
              <Card bordered={false}>{this.renderBody()}</Card>
            </Spin>
          )}
          {flagStatus && <Card bordered={false}>{this.renderBody()}</Card>}
        </Card>
      </PageHeaderLayout>
    );
  }
}
