/* eslint-disable no-dupe-keys */
/* eslint-disable react/jsx-no-duplicate-props */
/* eslint-disable no-shadow */
/* eslint-disable no-unused-expressions */
/* eslint-disable camelcase */
/* eslint-disable react/no-unused-state */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import { Button, Card, Form, Input, Row, Steps, Tag } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import Qs from 'qs';
import React, { PureComponent } from 'react';
import router from 'umi/router';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import userUtil from '../../../utils/user';
import Build from '../component/build';
import Etcd from '../component/etcd';
import styles from './index.less';

const FormItem = Form.Item;
const { Step } = Steps;
const { CheckableTag } = Tag;

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
  advanceConfiguration: region.advance_configuration
}))
export default class ClusterLink extends PureComponent {
  constructor(props) {
    super(props);
    const { user } = this.props;
    const adminer = userUtil.isCompanyAdmin(user);
    this.state = {
      adminer,
      etcd: false,
      storage: false,
      database: false,
      build: false,
      gateway: false,
      repositories: false,
      etcd_enabled: '自定义配置',
      storage_enabled: '自定义配置',
      database_enabled: '自定义配置',
      image_enabled: '自定义配置',
      node_enabled: '自定义配置'
    };
  }
  componentWillMount() {
    const { adminer } = this.state;
    const { dispatch } = this.props;
    if (!adminer) {
      dispatch(routerRedux.push(`/`));
    }
  }

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
  handleSubmit = () => {};
  toLinkNext = value => {
    const {
      match: {
        params: { eid }
      },
      location: { search },
      form
    } = this.props;
    const { data, name } =
      search && Qs.parse(this.props.location.search.substr(1));
    const {
      etcd_enabled,
      storage_enabled,
      database_enabled,
      image_enabled,
      node_enabled
    } = this.state;
    //   页面跳转
    if (value === 'next') {
      const routeData = data || {};
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
          type: routeData.estorage.type,
          RWX: {
            enable: false,
            config: {
              server: routeData.estorage.RWX.config.server,
              storageClassName: ''
            }
          },
          RWO: {
            enable: false,
            storageClassName: ''
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
      // 表单校验
      form.validateFields((err, values) => {
        if (err) return;
        // http请求
        if (values) {
          //   debugger;
          // etcd
          if (etcd_enabled === '自定义配置') {
            dataObj.etcd.enable = false;
          } else {
            dataObj.etcd.enable = true;
          }
          // 存储
          if (storage_enabled === '自定义配置') {
            dataObj.estorage.enable = false;
            dataObj.estorage.RWX.enable = false;
            dataObj.estorage.RWO.enable = false;
          } else {
            dataObj.estorage.enable = true;
            dataObj.estorage.RWX.enable = true;
            dataObj.estorage.RWO.enable = true;
          }
          // 数据库
          if (database_enabled === '自定义配置') {
            dataObj.database.enable = false;
            dataObj.database.regionDatabase.enable = false;
          } else {
            dataObj.database.enable = true;
            dataObj.database.regionDatabase.enable = true;
          }
          // 镜像仓库
          if (image_enabled === '自定义配置') {
            dataObj.imageHub.enable = false;
          } else {
            dataObj.imageHub.enable = true;
          }
          // 构建节点
          if (node_enabled === '自定义配置') {
            dataObj.nodesForChaos.enable = false;
          } else {
            dataObj.nodesForChaos.enable = true;
          }
          // 表单参数
          dataObj.gatewayIngressIPs =
            values.gatewayIngressIPs || routeData.gatewayIngressIPs || '';
          dataObj.nodesForGateway.nodes =
            values.nodesForGateway ||
            (routeData &&
              routeData.nodesForGateway &&
              routeData.nodesForGateway.nodes) ||
            [];
          dataObj.imageHub.domain = values.domain || '';
          dataObj.imageHub.namespace = values.namespace || '';
          dataObj.imageHub.username = values.username || '';
          dataObj.imageHub.password = values.password || '';
          dataObj.etcd.endpoints = values.endpoints || [];
          dataObj.etcd.secretName = values.secretName || '';
          dataObj.estorage.RWX.config.storageClassName =
            values.storageClassName1 || '';
          dataObj.estorage.RWO.storageClassName =
            values.storageClassName2 || '';
          dataObj.database.regionDatabase.host =
            values.regionDatabase_host || '';
          dataObj.database.regionDatabase.port =
            values.regionDatabase_port || '';
          dataObj.database.regionDatabase.username =
            values.regionDatabase_username || '';
          dataObj.database.regionDatabase.password =
            values.regionDatabase_password || '';
          dataObj.database.regionDatabase.dbname =
            values.regionDatabase_dbname || '';
          dataObj.nodesForChaos.nodes = values.nodesForChaos || [];

          // 路由跳转
          router.push({
            pathname: `/enterprise/${eid}/provider/ACksterList/install`,
            search: Qs.stringify({
              name,
              step: 'advanced',
              data: dataObj
            })
          });
        }
      });
    } else if (value === 'goback') {
      // 返回上一步
      switch (name) {
        case 'helm':
          router.push({
            pathname: `/enterprise/${eid}/provider/ACksterList`
          });
          break;
        case 'ack':
          router.push({
            pathname: `/enterprise/${eid}/provider/Aliack`
          });
          break;
        case 'huawei':
          router.push({
            pathname: `/enterprise/${eid}/provider/HuaweiList`
          });
          break;
        default:
          break;
      }
    }
  };

  render() {
    const {
      match: {
        params: { eid, provider, clusterID }
      },
      form: { getFieldDecorator },
      location: { search }
    } = this.props;
    const { data, name } =
      search && Qs.parse(this.props.location.search.substr(1));
    const {
      etcd_enabled,
      storage_enabled,
      database_enabled,
      image_enabled,
      node_enabled
    } = this.state;
    const formItemLayout = {
      labelCol: {
        xs: { span: 3 },
        sm: { span: 3 }
      },
      wrapperCol: {
        xs: { span: 9 },
        sm: { span: 9 }
      }
    };
    const storageFormItemLayout = {
      labelCol: {
        xs: { span: 7 },
        sm: { span: 7 }
      },
      wrapperCol: {
        xs: { span: 8 },
        sm: { span: 8 }
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
        <Row style={{ marginBottom: '16px' }}>
          <Steps current={1}>
            {this.loadSteps().map(item => (
              <Step key={item.title} title={item.title} />
            ))}
          </Steps>
        </Row>
        <Card style={{ padding: '24px' }}>
          <Form onSubmit={this.handleSubmit}>
            {/* Etcd */}
            <Row className={styles.antd_row}>
              <div className={styles.titleBox}>
                <div className={styles.title}>
                  <span className={styles.titleSpan}>Etcd</span>
                  <CheckableTag
                    checked={etcd_enabled !== '关闭配置' || false}
                    onChange={() => {
                      this.setState(state => {
                        return {
                          ...state,
                          etcd_enabled:
                            etcd_enabled === '自定义配置'
                              ? '关闭配置'
                              : '自定义配置'
                        };
                      });
                    }}
                    style={{
                      fontSize: '13px',
                      fontWeight: 'bold',
                      lineHeight: '30px',
                      height: '30px'
                    }}
                  >
                    {etcd_enabled}
                  </CheckableTag>
                </div>
              </div>
              {/* 配置项 */}
              {etcd_enabled !== '自定义配置' ? (
                <div className={styles.config}>
                  <FormItem {...formItemLayout} label="secret名称">
                    {getFieldDecorator('secretName', {
                      rules: [
                        {
                          required: true,
                          message: ''
                        }
                        // {
                        //   pattern: /^(?=^.{3,255}$)[a-zA-Z0-9*][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/,
                        //   message: '请填写正确的域名格式，支持泛域名'
                        // }
                      ]
                      // initialValue: editInfo.domain_name
                    })(
                      <Input placeholder="请输入secret名称  例：rbd-etcd-secret" />
                    )}
                  </FormItem>
                  <FormItem
                    {...formItemLayout}
                    label="节点名称"
                    className={styles.antd_form}
                  >
                    {getFieldDecorator('endpoints', {
                      rules: [
                        {
                          required: true,
                          message: ''
                        }
                        // {
                        //   pattern: /^(?=^.{3,255}$)[a-zA-Z0-9*][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/,
                        //   message: '请填写正确的域名格式，支持泛域名'
                        // }
                      ]
                      // initialValue: editInfo.domain_name
                    })(<Etcd />)}
                  </FormItem>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginLeft: '36px',
                    fontSize: '14px',
                    paddingRight: '12px'
                  }}
                >
                  设置外部独立的ETCD服务的访问地址。
                </div>
              )}
            </Row>
            {/* 存储 */}
            {name !== 'ack' && (
              <Row className={styles.antd_row}>
                <div className={styles.titleBox}>
                  <div className={styles.title}>
                    <span className={styles.titleSpan}>存储</span>
                    <CheckableTag
                      checked={storage_enabled !== '关闭配置' || false}
                      onChange={() => {
                        this.setState(state => {
                          return {
                            ...state,
                            storage_enabled:
                              storage_enabled === '自定义配置'
                                ? '关闭配置'
                                : '自定义配置'
                          };
                        });
                      }}
                      style={{
                        fontSize: '13px',
                        fontWeight: 'bold',
                        lineHeight: '30px',
                        height: '30px'
                      }}
                    >
                      {storage_enabled}
                    </CheckableTag>
                  </div>
                </div>
                {storage_enabled !== '自定义配置' ? (
                  <div className={styles.config}>
                    <FormItem
                      {...storageFormItemLayout}
                      label="RWX 所用存储 storageClass 名称"
                      className={styles.antd_form}
                    >
                      {getFieldDecorator('storageClassName1', {
                        rules: [
                          {
                            required: true,
                            message: '请添加域名'
                          }
                          // {
                          //   pattern: /^(?=^.{3,255}$)[a-zA-Z0-9*][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/,
                          //   message: '请填写正确的域名格式，支持泛域名'
                          // }
                        ]
                        // initialValue: editInfo.domain_name
                      })(
                        <Input placeholder="请输入存储名称  例：glusterfs-simple" />
                      )}
                    </FormItem>
                    <FormItem
                      {...storageFormItemLayout}
                      label="RWO 所用存储 storageClass 名称"
                      className={styles.antd_form}
                    >
                      {getFieldDecorator('storageClassName2', {
                        rules: [
                          {
                            required: true,
                            message: '请添加域名'
                          }
                          // {
                          //   pattern: /^(?=^.{3,255}$)[a-zA-Z0-9*][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/,
                          //   message: '请填写正确的域名格式，支持泛域名'
                          // }
                        ]
                        // initialValue: editInfo.domain_name
                      })(
                        <Input placeholder="请输入存储名称  例：glusterfs-simple" />
                      )}
                    </FormItem>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginLeft: '36px',
                      fontSize: '14px',
                      paddingRight: '12px'
                    }}
                  >
                    设置外部共享存储的StorageClass。
                  </div>
                )}
              </Row>
            )}
            {/* 数据库 */}
            {name !== 'ack' && (
              <Row className={styles.antd_row}>
                <div className={styles.titleBox}>
                  <div className={styles.title}>
                    <span className={styles.titleSpan}>数据库</span>
                    <CheckableTag
                      checked={database_enabled !== '关闭配置' || false}
                      onChange={() => {
                        this.setState(state => {
                          return {
                            ...state,
                            database_enabled:
                              database_enabled === '自定义配置'
                                ? '关闭配置'
                                : '自定义配置'
                          };
                        });
                      }}
                      style={{
                        fontSize: '13px',
                        fontWeight: 'bold',
                        lineHeight: '30px',
                        height: '30px'
                      }}
                    >
                      {database_enabled}
                    </CheckableTag>
                  </div>
                </div>
                {database_enabled !== '自定义配置' ? (
                  <div className={`${styles.config} ${styles.data_base}`}>
                    {/* 连接地址 */}
                    <FormItem
                      {...formItemLayouts}
                      label="连接地址"
                      style={{ display: 'flex' }}
                    >
                      {/* 控制台数据库 */}
                      {getFieldDecorator('regionDatabase_host', {
                        rules: [
                          {
                            required: true,
                            message: '请输入数据库连接地址'
                          }
                          // {
                          //   pattern: /^(?=^.{3,255}$)[a-zA-Z0-9*][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/,
                          //   message: '请填写正确的域名格式，支持泛域名'
                          // }
                        ]
                        // initialValue: editInfo.domain_name
                      })(<Input placeholder="请输入数据库连接地址" />)}
                    </FormItem>
                    {/* 连接端口 */}
                    <FormItem
                      {...formItemLayouts}
                      label="连接端口"
                      style={{ display: 'flex' }}
                    >
                      {/* 控制台数据库 */}
                      {getFieldDecorator('regionDatabase_port', {
                        rules: [
                          {
                            required: true,
                            message: '请输入连接端口'
                          }
                          // {
                          //   pattern: /^(?=^.{3,255}$)[a-zA-Z0-9*][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/,
                          //   message: '请填写正确的域名格式，支持泛域名'
                          // }
                        ]
                        // initialValue: editInfo.domain_name
                      })(<Input placeholder="请输入连接端口  例：3306" />)}
                    </FormItem>
                    {/* 用户名 */}
                    <FormItem
                      {...formItemLayouts}
                      label="用户名"
                      style={{ display: 'flex' }}
                    >
                      {/* 控制台数据库 */}
                      {getFieldDecorator('regionDatabase_username', {
                        rules: [
                          {
                            required: true,
                            message: '请输入用户名'
                          }
                          // {
                          //   pattern: /^(?=^.{3,255}$)[a-zA-Z0-9*][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/,
                          //   message: '请填写正确的域名格式，支持泛域名'
                          // }
                        ]
                        // initialValue: editInfo.domain_name
                      })(<Input placeholder="请输入用户名  例：root" />)}
                    </FormItem>
                    {/* 密码 */}
                    <FormItem
                      {...formItemLayouts}
                      label="密码"
                      style={{ display: 'flex' }}
                    >
                      {/* 控制台数据库 */}
                      {getFieldDecorator('regionDatabase_password', {
                        rules: [
                          {
                            required: true,
                            message: '请输入密码'
                          }
                          // {
                          //   pattern: /^(?=^.{3,255}$)[a-zA-Z0-9*][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/,
                          //   message: '请填写正确的域名格式，支持泛域名'
                          // }
                        ]
                        // initialValue: editInfo.domain_name
                      })(<Input placeholder="请输入密码" />)}
                    </FormItem>
                    {/* 数据库名称 */}
                    <FormItem
                      {...formItemLayouts}
                      label="数据库名称"
                      style={{ display: 'flex' }}
                    >
                      {/* 控制台数据库 */}
                      {getFieldDecorator('regionDatabase_dbname', {
                        rules: [
                          {
                            required: true,
                            message: '内容不能为空'
                          }
                          // {
                          //   pattern: /^(?=^.{3,255}$)[a-zA-Z0-9*][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/,
                          //   message: '请填写正确的域名格式，支持泛域名'
                          // }
                        ]
                        // initialValue: editInfo.domain_name
                      })(
                        <Input placeholder="请输入数据库库名称  例：region" />
                      )}
                    </FormItem>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginLeft: '36px',
                      fontSize: '14px',
                      paddingRight: '12px'
                    }}
                  >
                    设置外部独立Mysql数据库服务地址。
                  </div>
                )}
              </Row>
            )}
            {/* 镜像仓库 */}
            {name !== 'ack' && (
              <Row className={styles.antd_row}>
                <div className={styles.titleBox}>
                  <div className={styles.title}>
                    <span className={styles.titleSpan}>镜像仓库</span>
                    <CheckableTag
                      checked={image_enabled !== '关闭配置' || false}
                      onChange={() => {
                        this.setState(state => {
                          return {
                            ...state,
                            image_enabled:
                              image_enabled === '自定义配置'
                                ? '关闭配置'
                                : '自定义配置'
                          };
                        });
                      }}
                      style={{
                        fontSize: '13px',
                        fontWeight: 'bold',
                        lineHeight: '30px',
                        height: '30px'
                      }}
                    >
                      {image_enabled}
                    </CheckableTag>
                  </div>
                </div>
                {image_enabled !== '自定义配置' ? (
                  <div className={styles.config}>
                    <FormItem
                      {...formItemLayouts}
                      label="镜像仓库域名"
                      className={styles.antd_form}
                    >
                      {getFieldDecorator('domain', {
                        rules: [
                          {
                            required: true,
                            message: '请添加域名'
                          }
                          // {
                          //   pattern: /^(?=^.{3,255}$)[a-zA-Z0-9*][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/,
                          //   message: '请填写正确的域名格式，支持泛域名'
                          // }
                        ]
                        // initialValue: editInfo.domain_name
                      })(<Input placeholder="请输入镜像仓库域名" />)}
                    </FormItem>
                    <FormItem
                      {...formItemLayouts}
                      label="命名空间"
                      className={styles.antd_form}
                    >
                      {getFieldDecorator('namespace', {
                        // initialValue: editInfo.domain_name
                      })(<Input placeholder="请输入命名空间" />)}
                    </FormItem>
                    <FormItem
                      {...formItemLayouts}
                      label="用户名"
                      className={styles.antd_form}
                    >
                      {getFieldDecorator('username', {
                        rules: [
                          {
                            required: true,
                            message: '请输入用户名'
                          }
                        ]
                        // initialValue: editInfo.domain_name
                      })(<Input placeholder="请输入用户名" />)}
                    </FormItem>
                    <FormItem
                      {...formItemLayouts}
                      label="密码"
                      className={styles.antd_form}
                    >
                      {getFieldDecorator('password', {
                        rules: [
                          {
                            required: true,
                            message: '请输入密码'
                          }
                        ]
                        // initialValue: editInfo.domain_name
                      })(<Input placeholder="请输入密码" />)}
                    </FormItem>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginLeft: '36px',
                      fontSize: '14px',
                      paddingRight: '12px'
                    }}
                  >
                    设置外部独立容器镜像仓库地址。
                  </div>
                )}
              </Row>
            )}
            {/* 构建节点 */}
            <Row className={styles.antd_row}>
              <div className={styles.titleBox}>
                <div className={styles.title}>
                  <span className={styles.titleSpan}>构建节点</span>
                  <CheckableTag
                    checked={node_enabled !== '关闭配置' || false}
                    onChange={() => {
                      this.setState(state => {
                        return {
                          ...state,
                          node_enabled:
                            node_enabled === '自定义配置'
                              ? '关闭配置'
                              : '自定义配置'
                        };
                      });
                    }}
                    style={{
                      fontSize: '13px',
                      fontWeight: 'bold',
                      lineHeight: '30px',
                      height: '30px'
                    }}
                  >
                    {node_enabled}
                  </CheckableTag>
                </div>
              </div>
              {node_enabled !== '自定义配置' ? (
                <div className={styles.config}>
                  <FormItem
                    {...formItemLayouts}
                    label="节点名称"
                    className={styles.antd_form}
                  >
                    {getFieldDecorator('nodesForChaos', {
                      rules: [
                        {
                          required: true,
                          message: '请添加域名'
                        }
                        // {
                        //   pattern: /^(?=^.{3,255}$)[a-zA-Z0-9*][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/,
                        //   message: '请填写正确的域名格式，支持泛域名'
                        // }
                      ]
                      // initialValue: editInfo.domain_name
                    })(<Build />)}
                  </FormItem>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginLeft: '36px',
                    fontSize: '14px',
                    paddingRight: '12px'
                  }}
                >
                  设置源码构建的节点，节点名是kubernetes的Nodename。
                </div>
              )}
            </Row>
            {/* 按钮 */}
            <Row>
              <FormItem className={styles.antd_row_btn}>
                <Button
                  className={styles.antd_btn}
                  type="primary"
                  onClick={() => {
                    this.toLinkNext('goback');
                  }}
                >
                  上一步
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
