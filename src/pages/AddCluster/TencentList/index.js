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
  enableHA: true,
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
      enable: false,
      server: '',
      path: ''
    }
  },
  type: 'nfs',
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
  handleSubmit = e => { };
  // 下一步或者高级配置
  toLinkNext = value => {
    const { dispatch } = this.props;
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
        dataObj.nodesForGateway.nodes = values.nodesForGateway || '';
        // 镜像仓库
        if (values.domain || values.namespace || values.username || values.password) {
          dataObj.imageHub.enable = true;
        } else {
          dataObj.imageHub.enable = false;
        }
        dataObj.imageHub.domain = values.domain || '';
        dataObj.imageHub.namespace = values.namespace || '';
        dataObj.imageHub.username = values.username || '';
        dataObj.imageHub.password = values.password || '';
        dataObj.etcd.endpoints = values.endpoints || [];
        dataObj.etcd.secretName = values.secretName || '';
        // 存储
        if (values.server || values.path) {
          dataObj.estorage.enable = true;
          dataObj.estorage.NFS.enable = true;
        } else {
          dataObj.estorage.enable = false;
          dataObj.estorage.NFS.enable = false;
        }
        dataObj.estorage.NFS.server = values.server || '';
        dataObj.estorage.NFS.path = values.path || '';
        // 数据库
        if (values.regionDatabase_host || values.regionDatabase_port || values.regionDatabase_username || values.regionDatabase_password || values.regionDatabase_dbname) {
          dataObj.database.enable = true;
          dataObj.database.regionDatabase.enable = true;
        } else {
          dataObj.database.enable = false;
          dataObj.database.regionDatabase.enable = false;
        }
        dataObj.database.regionDatabase.host = values.regionDatabase_host || '';
        dataObj.database.regionDatabase.port = values.regionDatabase_port || '';
        dataObj.database.regionDatabase.username =
          values.regionDatabase_username || '';
        dataObj.database.regionDatabase.password =
          values.regionDatabase_password || '';
        dataObj.database.regionDatabase.dbname =
          values.regionDatabase_dbname || '';
        dataObj.nodesForChaos.nodes = [];
        dataObj.etcd.endpoints = values.endpoints || [];
        dataObj.etcd.secretName = values.secretName || '';
        // 页面跳转高级配置
        if (value === 'advanced') {
          router.push({
            pathname: `/enterprise/${eid}/provider/ACksterList/advanced`,
            search: Qs.stringify({ data: dataObj, name: 'tencent', cloudserver: 'tencent' })
          });
        } else {
          // 跳转下一步
          router.push({
            pathname: `/enterprise/${eid}/provider/ACksterList/install`,
            search: Qs.stringify({
              data: dataObj,
              name: 'tencent',
              step: 'base',
              cloudserver: 'tencent'
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
    const storageFormItemLayout = {
      labelCol: {
        xs: { span: 3 },
        sm: { span: 3 }
      },
      wrapperCol: {
        xs: { span: 7 },
        sm: { span: 7 }
      }
    };
    const formItemLayouts = {
      labelCol: {
        xs: { span: 3 },
        sm: { span: 3 }
      },
      wrapperCol: {
        xs: { span: 6 },
        sm: { span: 6 }
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
                    负载均衡:
                  </span>
                </div>
                <FormItem
                  {...formItemLayout}
                  className={styles.antd_form}
                  extra={
                    <div>
                      根据自身需求，提前在腾讯云官网准备好云资源：负载均衡。
                      腾讯云负载均衡，会负载流量到后端网关节点的 80、443、6060、6443、7070、8443 端口，所以需要配置负载均衡监听端口，
                      <a target="_blank" href="https://cloud.tencent.com/document/product/214/36386">
                        详细配置见官方文档。
                      </a>
                    </div>
                  }
                >
                  {getFieldDecorator('gatewayIngressIPs', {
                    rules: [
                      {
                        required: false,
                        message: '请填写IP地址'
                      },
                      {
                        pattern: /^[^\s]*$/,
                        message: '禁止输入空格'
                      }
                    ]
                  })(<Input placeholder="请填写IP地址  例：1.2.3.4" />)}
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
                  extra="rainbond网关安装到的节点，可以安装到多个节点，实现网关高可用,节点名称填写是k8s集群中node名称。"
                >
                  {getFieldDecorator('nodesForGateway', {
                    rules: [
                      {
                        required: false,
                        message: '请填写网关安装节点'
                      },
                      {
                        validator: this.handleValidatorsGateway
                      }
                    ]
                  })(<DAinput />)}
                </FormItem>
              </Row>
              <Row className={styles.antd_rows}>
                <div className={styles.titleBox}>
                  <div className={styles.title}>
                    <span className={styles.titleSpan}>CFS 存储:</span>
                  </div>
                  <div className={styles.desc}>
                  (非必填) 根据自身需求，在腾讯云官网准备好CFS文件系统，用于持久化数据，
                    <a target="_blank" href="https://cloud.tencent.com/document/product/582/9132">
                      详细配置见官方文档。
                    </a>
                  </div>
                </div>
                <div className={styles.config}>
                  <FormItem {...storageFormItemLayout} label="挂载点地址">
                    {getFieldDecorator('server', {
                      rules: [
                        {
                          required: false,
                          message: '请填写挂载点地址'
                        },
                        {
                          pattern: /^[^\s]*$/,
                          message: '禁止输入空格'
                        }
                      ]
                    })(
                      <Input placeholder="请填写挂载点地址  例：192.168.0.12" />
                    )}
                  </FormItem>
                  <FormItem {...storageFormItemLayout} label="挂载点路径">
                    {getFieldDecorator('path', {
                      rules: [
                        {
                          required: false,
                          message: '请填写挂载点路径'
                        },
                        {
                          pattern: /^[^\s]*$/,
                          message: '禁止输入空格'
                        }
                      ]
                    })(
                      <Input placeholder="请填写挂载点路径  例：/" />
                    )}
                  </FormItem>
                </div>
              </Row>
              {/* 数据库 */}
              <Row className={styles.antd_rows}>
                <div className={styles.titleBox}>
                  <div className={styles.title}>
                    <span className={styles.titleSpan}>RDS 数据库</span>
                  </div>
                  <div className={styles.desc}>
                    (非必填) 根据自身需求，在腾讯云官网准备好”云数据库 MySQL 8.0“，并开放3306连接端口，登录RDS创建，授权用户，创建好相对应的数据库，
                    <a target="_blank" href="https://cloud.tencent.com/document/product/236/3130">
                      详细配置见官方文档。
                    </a>
                  </div>
                </div>
                <div className={styles.config}>
                  {/* 连接地址 */}
                  <FormItem {...formItemLayouts} label="连接地址">
                    {/* 控制台数据库 */}
                    {getFieldDecorator('regionDatabase_host', {
                      rules: [
                        {
                          required: false,
                          message: '请填写连接地址'
                        },
                        {
                          pattern: /^[^\s]*$/,
                          message: '禁止输入空格'
                        }
                      ]
                    })(<Input placeholder="请填写数据库连接地址" />)}
                  </FormItem>
                  {/* 连接端口 */}
                  <FormItem {...formItemLayouts} label="连接端口">
                    {/* 控制台数据库 */}
                    {getFieldDecorator('regionDatabase_port', {
                      rules: [
                        {
                          required: false,
                          message: '请填写连接端口'
                        },
                        {
                          pattern: /^[^\s]*$/,
                          message: '禁止输入空格'
                        }
                      ]
                    })(<Input placeholder="请填写连接端口  例：3306" />)}
                  </FormItem>
                  {/* 用户名 */}
                  <FormItem {...formItemLayouts} label="用户名">
                    {/* 控制台数据库 */}
                    {getFieldDecorator('regionDatabase_username', {
                      rules: [
                        {
                          required: false,
                          message: '请填写用户名'
                        },
                        {
                          pattern: /^[^\s]*$/,
                          message: '禁止输入空格'
                        }
                      ]
                    })(<Input placeholder="请填写用户名  例：root" />)}
                  </FormItem>
                  {/* 密码 */}
                  <FormItem {...formItemLayouts} label="密码">
                    {/* 控制台数据库 */}
                    {getFieldDecorator('regionDatabase_password', {
                      rules: [
                        {
                          required: false,
                          message: '请填写密码'
                        },
                        {
                          pattern: /^[^\s]*$/,
                          message: '禁止输入空格'
                        }
                      ]
                    })(<Input type="password" placeholder="请填写密码" />)}
                  </FormItem>
                  {/* 数据库名称 */}
                  <FormItem {...formItemLayouts} label="数据库名称">
                    {/* 控制台数据库 */}
                    {getFieldDecorator('regionDatabase_dbname', {
                      rules: [
                        {
                          required: false,
                          message: '请填写数据库名称'
                        },
                        {
                          pattern: /^[^\s]*$/,
                          message: '禁止输入空格'
                        }
                      ]
                    })(<Input placeholder="请填写数据库库名称  例：region" />)}
                  </FormItem>
                </div>
              </Row>
              {/* 镜像仓库 */}
              <Row className={styles.antd_rows}>
                <div className={styles.titleBox}>
                  <div className={styles.title}>
                    <span className={styles.titleSpan}>容器镜像服务</span>
                  </div>
                  <div className={styles.desc}>
                    (非必填) 根据自身需求，在腾讯云官网准备好“容器镜像服务”，根据提示开通之后，会得到一个仓库域名，组织名称（或命名空间），登录镜像仓库的用户名，密码。
                  </div>
                </div>
                <div className={styles.config}>
                  <FormItem
                    {...formItemLayouts}
                    label="镜像仓库域名"
                    className={styles.antd_form}
                  >
                    {getFieldDecorator('domain', {
                      rules: [
                        {
                          required: false,
                          message: '请填写镜像仓库域名'
                        },
                        {
                          pattern: /^[^\s]*$/,
                          message: '禁止输入空格'
                        }
                      ]
                    })(<Input placeholder="请填写镜像仓库域名" />)}
                  </FormItem>
                  <FormItem
                    {...formItemLayouts}
                    label="命名空间"
                    className={styles.antd_form}
                  >
                    {getFieldDecorator('namespace', {
                      rules: [
                        {
                          required: false,
                          message: '请填写命名空间'
                        },
                        {
                          pattern: /^[^\s]*$/,
                          message: '禁止输入空格'
                        }
                      ]
                    })(
                      <Input placeholder="请填写命名空间" />
                    )}
                  </FormItem>
                  <FormItem
                    {...formItemLayouts}
                    label="用户名"
                    className={styles.antd_form}
                  >
                    {getFieldDecorator('username', {
                      rules: [
                        {
                          required: false,
                          message: '请填写用户名'
                        },
                        {
                          pattern: /^[^\s]*$/,
                          message: '禁止输入空格'
                        }
                      ]
                    })(<Input placeholder="请填写用户名" />)}
                  </FormItem>
                  <FormItem
                    {...formItemLayouts}
                    label="密码"
                    className={styles.antd_form}
                  >
                    {getFieldDecorator('password', {
                      rules: [
                        {
                          required: false,
                          message: '请填写密码'
                        },
                        {
                          pattern: /^[^\s]*$/,
                          message: '禁止输入空格'
                        }
                      ]
                    })(<Input type="password" placeholder="请填写密码" />)}
                  </FormItem>
                </div>
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
