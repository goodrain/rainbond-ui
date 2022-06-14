/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import { Button, Card, Form, Row, Spin, Steps } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import Qs from 'qs';
import React, { PureComponent } from 'react';
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
        title: '基本配置'
      },
      {
        title: '高级配置'
      },
      {
        title: '执行安装'
      },
      {
        title: '对接集群'
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
      title = '集群对接成功';
      desc = '点击完成按钮查看当前对接的集群';
      actions = [
        <Button
          className={styles.antd_btn}
          onClick={() => {
            this.toLinkNext('finish');
          }}
          type="primary"
        >
          完成
        </Button>
      ];
    }
    if (status === 'failed') {
      type = 'error';
      title = '当前集群对接失败';
      desc =
        '可能服务器命令还没有执行完毕，可以“刷新进度”或去服务器执行“ watch kubectl get po -n rbd-system ”命令，查看Pod状态。';
      actions = [
        <Button
          className={styles.antd_btn}
          onClick={() => {
            this.toLinkNext('install');
          }}
          type="primary"
        >
          上一步
        </Button>,
        <Button
          onClick={() => {
            this.refreshStatus();
          }}
          className={styles.antd_btn}
          type="primary"
        >
          刷新进度
        </Button>
      ];
    }
    // if (status === 'checking') {
    //   type = 'ing';
    //   title = '集群对接中';
    //   desc = '此过程可能比较耗时，请耐心等待';
    //   actions = [
    //     <Button  className={styles.antd_btn} type="primary">
    //         上一步
    //     </Button>,
    //     <Button  className={styles.antd_btn} type="primary">
    //         刷新进度
    //     </Button>
    //   ];
    // }

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
        title="添加集群"
        content="集群是资源的集合，以Kubernetes集群为基础，部署平台Region服务即可成为平台集群资源。"
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
