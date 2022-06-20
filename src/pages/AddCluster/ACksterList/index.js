/* eslint-disable array-callback-return */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import { Button, Card, Form, Input, Row, Steps } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import Qs from 'qs';
import React, { PureComponent } from 'react';
import router from 'umi/router';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import userUtil from '../../../utils/user';
import DAinput from '../component/node';
import styles from './index.less';

const FormItem = Form.Item;
const { Step } = Steps;
const dataObj = {
  enableHA: false,
  gatewayIngressIPs: '',
  imageHub: {
    enable: false,
    domain: '',
    namespace: '',
    username: '',
    password: ''
  },
  etcd: {
    enable: false,
    endpoints: [],
    secretName: ''
  },
  estorage: {
    enable: false,
    type: '',
    RWX: {
      enable: false,
      config: {
        server: '',
        storageClassName: ''
      }
    },
    RWO: {
      enable: false,
      storageClassName: ''
    },
    NFS: {
      enable:false,
      server:'',
      path:''
    }
  },
  database: {
    enable: false,
    uiDatabase: {
      host: '',
      port: '',
      username: '',
      password: '',
      dbname: '',
      enable: false
    },
    regionDatabase: {
      host: '',
      port: '',
      username: '',
      password: '',
      dbname: '',
      enable: false
    }
  },
  nodesForChaos: {
    enable: false,
    nodes: []
  },
  nodesForGateway: {
    enable: true,
    nodes: []
  }
};
@Form.create()
@connect(({ user, list, loading, global, index, region }) => ({
  user: user.currentUser,
  list,
  loading: loading.models.list,
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  isRegist: global.isRegist,
  oauthLongin: loading.effects['global/creatOauth'],
  overviewInfo: index.overviewInfo,
  baseConfiguration: region.base_configuration
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
  handleSubmit = e => {};
  // 下一步或者高级配置
  toLinkNext = value => {
    const {
      match: {
        params: { eid }
      }
    } = this.props;

    // 获取表单的值
    this.props.form.validateFields((err, values) => {
      if (err) return;
      if (values) {
        dataObj.gatewayIngressIPs = values.gatewayIngressIPs || '';
        dataObj.imageHub.domain = values.domain || '';
        dataObj.imageHub.namespace = values.namespace || '';
        dataObj.imageHub.username = values.username || '';
        dataObj.imageHub.password = values.password || '';
        dataObj.etcd.endpoints = values.endpoints || [];
        dataObj.etcd.secretName = values.secretName || '';
        dataObj.estorage.RWX.config.storageClassName =
          values.storageClassName1 || '';
        dataObj.estorage.RWO.storageClassName = values.storageClassName2 || '';
        dataObj.database.uiDatabase.host = values.uiDatabase_host || '';
        dataObj.database.uiDatabase.port = values.uiDatabase_port || '';
        dataObj.database.uiDatabase.username = values.uiDatabase_username || '';
        dataObj.database.uiDatabase.password = values.uiDatabase_password || '';
        dataObj.database.uiDatabase.dbname = values.uiDatabase_dbname || '';
        dataObj.database.regionDatabase.host = values.regionDatabase_host || '';
        dataObj.database.regionDatabase.port = values.regionDatabase_port || '';
        dataObj.database.regionDatabase.username =
          values.regionDatabase_username || '';
        dataObj.database.regionDatabase.password =
          values.regionDatabase_password || '';
        dataObj.database.regionDatabase.dbname =
          values.regionDatabase_dbname || '';
        dataObj.nodesForChaos.nodes = values.nodesForChaos || [];
        dataObj.nodesForGateway.nodes = values.nodesForGateway || [];
        // 页面跳转高级配置
        if (value === 'advanced') {
          router.push({
            pathname: `/enterprise/${eid}/provider/ACksterList/advanced`,
            search: Qs.stringify({
              data: dataObj,
              name: 'helm'
            })
          });
        } else {
          // 跳转下一步
          router.push({
            pathname: `/enterprise/${eid}/provider/ACksterList/install`,
            search: Qs.stringify({
              data: dataObj,
              name: 'helm',
              step: 'base'
            })
          });
        }
      }
    });
  };
  // 网关校验
  handleValidatorsGateway = (_, val, callback) => {
    let isPass = false;
    if (val && val.length > 0) {
      val.some(item => {
        if (item.externalIP && item.internalIP && item.name) {
          isPass = true;
        } else {
          isPass = false;
          return true;
        }
      });
      if (isPass) {
        callback();
      } else {
        callback(new Error('需填写完整的网关安装节点'));
      }
    } else {
      callback();
    }
  };
  render() {
    const {
      match: {
        params: { eid, provider, clusterID }
      },
      form: { getFieldDecorator },
      baseConfiguration: { gatewayIngressIPs }
    } = this.props;
    const formItemLayout = {
      labelCol: {
        xs: { span: 0 },
        sm: { span: 0 }
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
        {/* 步骤 */}
        <Row style={{ marginBottom: '16px' }}>
          <Steps current={0}>
            {this.loadSteps().map(item => (
              <Step key={item.title} title={item.title} />
            ))}
          </Steps>
        </Row>
        {/* 配置 */}
        <Card style={{ padding: '24px 12px' }}>
          <Form onSubmit={this.handleSubmit}>
            <div className={styles.base_configuration}>
              {/* 入口IP */}
              <Row className={styles.antd_row}>
                <div>
                  <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                    入口访问IP:
                  </span>
                </div>
                <FormItem
                  {...formItemLayout}
                  className={styles.antd_form}
                  extra="入口IP请开放 80、443、6060、6443、7070、8443 端口。"
                >
                  {getFieldDecorator('gatewayIngressIPs', {
                    initialValue: gatewayIngressIPs || '',
                    rules: [
                      {
                        required: true,
                        message: '请填写IP地址'
                      },
                      {
                        pattern: /((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})(\.((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})){3}/g,
                        message: '请填写正确的IP地址'
                      }
                    ]
                  })(<Input placeholder="请输入IP地址  例：1.2.3.4" />)}
                </FormItem>
              </Row>
              {/* 网关安装节点 */}
              <Row className={styles.antd_row}>
                <div>
                  <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                    网关安装节点:
                  </span>
                </div>
                <FormItem
                  {...formItemLayout}
                  className={styles.antd_form}
                  extra="网关安装的节点，可以安装到多个节点，实现高可用。"
                >
                  {getFieldDecorator('nodesForGateway', {
                    rules: [
                      { required: true, message: '请填写网关安装节点' },
                      {
                        validator: this.handleValidatorsGateway
                      }
                    ]
                  })(<DAinput />)}
                </FormItem>
              </Row>
            </div>
            <Row>
              <FormItem className={styles.antd_row_btn}>
                <Button
                  className={styles.antd_btn}
                  type="primary"
                  onClick={() => {
                    this.props.dispatch(
                      routerRedux.push(`/enterprise/${eid}/addCluster`)
                    );
                  }}
                >
                  返回
                </Button>
                <Button
                  className={styles.antd_btn}
                  type="primary"
                  onClick={() => {
                    this.toLinkNext('advanced');
                  }}
                >
                  高级配置
                </Button>
                <Button
                  className={styles.antd_btn}
                  type="primary"
                  onClick={() => {
                    this.toLinkNext('next');
                  }}
                >
                  下一步
                </Button>
              </FormItem>
            </Row>
          </Form>
        </Card>
      </PageHeaderLayout>
    );
  }
}
