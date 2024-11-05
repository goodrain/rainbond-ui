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
import globalUtil from '../../../utils/global';
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
    const adminer = userUtil.isCompanyAdmin(user);
    this.state = {
      adminer,
      status: 'installing',
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
    clearInterval(this.pollingTimer);
  }

  componentDidMount() {
    this.startPolling();
  }

  startPolling = () => {
    this.getRegionLength();
    this.pollingTimer = setInterval(this.getRegionLength, 3000);
  };

  getRegionLength = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    const token = this.props.location.query.token;
    const host = this.props.location.query.host;
    dispatch({
      type: 'region/fetchHelmJoinStatus',
      payload: {
        eid,
        token: token,
        api_host: host
      },
      callback: res => {
        if (res.status_code === 200) {
          if(res.bean.health_status === 'installed'){
            clearInterval(this.pollingTimer);
          }
          this.setState({
            status: res.bean.health_status
          });
        }
      }
    });
  };

  // 返回上一步
  toLinkNext = value => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    const enterpriseID = eid || globalUtil.getCurrEnterpriseId()
    dispatch({
      type: 'region/deleteHelmEvents',
      payload: { 
        eid,
      },
      callback: res => {
        if (value === 'install') {
          dispatch(routerRedux.push(`/enterprise/${enterpriseID}/provider/ACksterList`));
        } else if (value === 'finish') {
          dispatch(routerRedux.push(`/enterprise/${enterpriseID}/clusters`));
        }
      }
    });
    
  };

  renderBody = () => {
    const { status } = this.state;
    let type = '';
    let title = '';
    let desc = '';
    let actions = [];
    const installDesc = (
      <div>
        {formatMessage({id:'enterpriseColony.cloud.Refresh1'})}
        <a href='https://www.rainbond.com/docs/installation/install-with-helm/install-from-kubernetes' target='_blank'>{formatMessage({id:'enterpriseColony.cloud.Refresh2'})}</a>
        {formatMessage({id:'enterpriseColony.cloud.Refresh3'})}
      </div>
    )
    if (status === 'installed') {
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
        </Button>
      ];
    }
    if (status === 'installing') {
      type = 'ing';
      title = `正在对接集群`;
      actions = [
        <Button
          className={styles.antd_btn}
          onClick={() => {
            this.toLinkNext('install');
          }}
        >
          <FormattedMessage id='button.cancel'/>
        </Button>
      ];
    }

    return (
      <Result
        className={styles.lists}
        type={type}
        title={title}
        actions={actions}
        description={<div>{status === 'installing' ? installDesc : desc}</div>}
      />
    );
  };
  render() {

    return (
      <PageHeaderLayout
      title={<FormattedMessage id='enterpriseColony.button.text'/>}
      content={<FormattedMessage id='enterpriseColony.PageHeaderLayout.content'/>}
      titleSvg={pageheaderSvg.getPageHeaderSvg('clusters', 18)}
      >
        <Card style={{ padding: '24px' }}>
          {<Card bordered={false}>{this.renderBody()}</Card>}
        </Card>
      </PageHeaderLayout>
    );
  }
}
