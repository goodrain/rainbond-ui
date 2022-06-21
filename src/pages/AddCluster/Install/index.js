/* eslint-disable no-shadow */
/* eslint-disable react/no-did-mount-set-state */
/* eslint-disable valid-typeof */
/* eslint-disable no-restricted-syntax */
/* eslint-disable react/sort-comp */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import { CopyOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  notification,
  Row,
  Spin,
  Steps
} from 'antd';
import copy from 'copy-to-clipboard';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { cloneDeep } from 'lodash';
import Qs from 'qs';
import React, { PureComponent } from 'react';
import router from 'umi/router';
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
    const { user } = this.props;
    const adminer = userUtil.isCompanyAdmin(user);
    this.state = {
      adminer,
      commandFlag: false,
      resCommand: [],
      copyCommand: '',
      helmToken: ''
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
    const {
      location: { search }
    } = this.props;
    const { data, name, step, token, copy, isResult = false } =
      Qs.parse(search.substr(1)) || {};
    const deepClone = cloneDeep(data);
    const newData = this.handleOptionData(deepClone);
    // 从前2步回来
    if (step === 'base' || (step === 'advanced' && !isResult)) {
      // 获取toekn值
      this.helmToken(newData);
    } else if (isResult) {
      //  从第四步跳转过来;
      this.setState({
        resCommand: data,
        copyCommand: copy,
        commandFlag: true,
        helmToken: token
      });
    }
  }
  handleOptionData = data => {
    if (!data) return;
    for (const key in data) {
      if (typeof data[key] !== 'object') {
        if (data[key] === 'true') {
          data[key] = true;
        } else if (data[key] === 'false') {
          data[key] = false;
        }
      } else {
        this.handleOptionData(data[key]);
      }
    }
    return data;
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
      match: {
        params: { eid }
      },
      location: { search }
    } = this.props;
    const { helmToken, resCommand, copyCommand } = this.state;
    const { data, name, step } = Qs.parse(search.substr(1)) || {};
    // 返回上一步
    if (value === 'goback') {
      switch (name) {
        case 'helm':
          if (step === 'base')
            router.push(`/enterprise/${eid}/provider/ACksterList`);
          else
            router.push({
              pathname: `/enterprise/${eid}/provider/ACksterList/advanced`,
              search: Qs.stringify({ name })
            });
          break;
        case 'ack':
          if (step === 'base')
            router.push(`/enterprise/${eid}/provider/Aliack`);
          else
            router.push({
              pathname: `/enterprise/${eid}/provider/ACksterList/advanced`,
              search: Qs.stringify({ name })
            });
          break;
        case 'huawei':
          if (step === 'base')
            router.push(`/enterprise/${eid}/provider/HuaweiList`);
          else
            router.push({
              pathname: `/enterprise/${eid}/provider/ACksterList/advanced`,
              search: Qs.stringify({ name })
            });
          break;
        case 'tencent':
          if (step === 'base')
            router.push(`/enterprise/${eid}/provider/tencentList`);
          else
            router.push({
              pathname: `/enterprise/${eid}/provider/ACksterList/advanced`,
              search: Qs.stringify({ name })
            });
          break;
        default:
          break;
      }
    } else {
      router.push({
        pathname: `/enterprise/${eid}/provider/ACksterList/result`,
        search: Qs.stringify({
          token: helmToken,
          data: resCommand,
          copy: copyCommand,
          name,
          step
        })
      });
    }
  };
  helmToken = data => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: 'region/fetchHelmToken',
      payload: { eid },
      callback: res => {
        if (res.status_code === 200) {
          if (res.bean) {
            dispatch({
              type: 'region/fetchHelmCommand',
              payload: {
                eid: 'f0a3efe26ebff6e2a87b176fbd3256ec',
                domain: 'http://5000.gr5b266d.2c9v614j.17f4cc.grapps.cn',
                token: res.bean,
                data
              },
              callback: result => {
                const resArr = result.response_data.command.split(' & ');
                const resArrCopy = cloneDeep(resArr);
                const resArrCopys = resArrCopy.join('\n ');
                this.setState({
                  helmToken: res.bean,
                  resCommand: resArr,
                  copyCommand: resArrCopys,
                  commandFlag: true
                });
              }
            });
          }
        }
      }
    });
  };
  onCopy = () => {
    const { copyCommand } = this.state;
    copy(copyCommand);
    notification.success({
      message: '复制成功'
    });
  };
  render() {
    const {
      match: {
        params: { eid, provider, clusterID }
      }
    } = this.props;
    const { commandFlag, resCommand } = this.state;
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
          <Steps current={2}>
            {this.loadSteps().map(item => (
              <Step key={item.title} title={item.title} />
            ))}
          </Steps>
        </Row>
        <Card style={{ padding: '24px' }}>
          {!commandFlag && (
            <Spin tip="Loading...">
              <div className={styles.commandBox}> </div>
            </Spin>
          )}
          {commandFlag && (
            <div className={styles.commandBox}>
              <div className={styles.commandIcon}>
                <CopyOutlined onClick={this.onCopy} />
              </div>
              <div className={styles.command}>
                {resCommand.length > 0 &&
                  resCommand.map((item, index) => (
                    <span key={index} className={styles.commandSpan}>
                      {item}
                    </span>
                  ))}
              </div>
            </div>
          )}

          <Row style={{ marginBottom: '10px' }}>
            <Col span={24}>
              <Alert
                style={{ fontSize: '16px', fontWeight: 'bolder' }}
                type="info"
                message="复制命令去服务器执行，服务器执行完成，点击 “下一步”。"
              />
            </Col>
          </Row>
          <Row>
            <div className={styles.antd_row_btn}>
              <Button
                className={styles.antd_btn}
                type="primary"
                onClick={() => this.toLinkNext('goback')}
              >
                上一步
              </Button>
              <Button
                className={styles.antd_btn}
                type="primary"
                onClick={() => this.toLinkNext('next')}
              >
                下一步
              </Button>
            </div>
          </Row>
        </Card>
      </PageHeaderLayout>
    );
  }
}
