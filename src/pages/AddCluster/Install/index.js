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
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import globalUtile from "@/utils/global"
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
      match: {
        params: { eid }
      },
      location: { search }
    } = this.props;
    const enterpriseID = eid || globalUtile.getCurrEnterpriseId()
    const { helmToken, resCommand, copyCommand } = this.state;
    const { data, name, step } = Qs.parse(search.substr(1)) || {};
    // 返回上一步
    if (value === 'goback') {
      switch (name) {
        case 'helm':
            router.push(`/enterprise/${enterpriseID}/provider/ACksterList`);
          break;
        case 'ack':
            router.push(`/enterprise/${enterpriseID}/provider/Aliack`);
          break;
        case 'huawei':
            router.push(`/enterprise/${enterpriseID}/provider/HuaweiList`);
          break;
        case 'tencent':
            router.push(`/enterprise/${enterpriseID}/provider/tencentList`);
          break;
        default:
          break;
      }
    } else {
      router.push({
        pathname: `/enterprise/${enterpriseID}/provider/ACksterList/result`,
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
  helmToken = values => {
    const {
      dispatch,
      match: {
        params: { eid }
      },
      location: { search }
    } = this.props;
    const { data, name, step, cloudserver } = Qs.parse(search.substr(1)) || {};
    const strDomain = window.location.href;
    const domain = strDomain.match(/(\S*)\/#\//)[1];
    dispatch({
      type: 'region/fetchHelmToken',
      payload: { eid },
      callback: res => {
        if (res.status_code === 200) {
          if (res.bean) {
            dispatch({
              type: 'region/fetchHelmCommand',
              payload: {
                eid: eid,
                domain: domain,
                token: res.bean,
                data: values,
                cloudserver
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
      message: formatMessage({id:'notification.success.copy'})
    });
  };
  render() {
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
    const strDomain = window.location.href;
    const domain = strDomain.match(/(\S*)\/#\//)[1];
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
                // style={{ fontSize: '16px' }}
                type="info"
                message={<>
                {formatMessage({id:'enterpriseColony.cloud.msg1'})}
                {formatMessage({id:'enterpriseColony.cloud.msg2'})}
                  {domain}
                {formatMessage({id:'enterpriseColony.cloud.msg3'})}
                </>}
              />
            </Col>
          </Row>
          <Row>
            <div className={styles.antd_row_btn}>
              <Button
                className={styles.antd_btn}
                onClick={() => this.toLinkNext('goback')}
              >
                <FormattedMessage id='button.previous'/>
              </Button>
              <Button
                className={styles.antd_btn}
                type="primary"
                onClick={() => this.toLinkNext('next')}
              >
                <FormattedMessage id='button.next'/>
              </Button>
            </div>
          </Row>
        </Card>
      </PageHeaderLayout>
    );
  }
}
