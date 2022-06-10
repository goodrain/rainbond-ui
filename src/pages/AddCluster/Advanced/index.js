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
      etcd_enabled: '隐藏Etcd配置',
      storage_enabled: '隐藏存储',
      database_enabled: '隐藏数据库配置',
      image_enabled: '隐藏镜像仓库配置',
      node_enabled: '隐藏构建节点配置'
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
  handleSubmit = () => {};
  toLinkNext = value => {
    const { dispatch } = this.props;
    const {
      match: {
        params: { eid }
      },
      form
    } = this.props;
    //   页面跳转
    if (value === 'next') {
      // 表单校验
      form.validateFields((err, values) => {
        if (err) return;
        // http请求
        router.push({
          pathname: `/enterprise/${eid}/provider/ACksterList/install`
        });
      });
    } else if (value === 'goback') {
      const {
        form: { getFieldsValue }
      } = this.props;
      const data = getFieldsValue();
      // 保存数据
      dispatch({
        type: 'region/advanceConfiguration',
        payload: data
      });
      router.push({
        pathname: `/enterprise/${eid}/provider/ACksterList`
      });
    }
  };
  onEtcd = e => {
    this.setState({
      etcd: e
    });
  };
  onStorage = e => {
    this.setState({
      etcd: e
    });
  };
  onDatabase = e => {
    this.setState({
      etcd: e
    });
  };
  onEtcd = e => {
    this.setState({
      etcd: e
    });
  };
  onEtcd = e => {
    this.setState({
      etcd: e
    });
  };
  render() {
    const {
      match: {
        params: { eid, provider, clusterID }
      }
    } = this.props;
    const {
      etcd_enabled,
      storage_enabled,
      database_enabled,
      image_enabled,
      node_enabled
    } = this.state;
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 2 },
        sm: { span: 2 }
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
        xs: { span: 7 },
        sm: { span: 7 }
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
                    checked={etcd_enabled !== '隐藏Etcd配置' || false}
                    onChange={() => {
                      this.setState(state => {
                        return {
                          ...state,
                          etcd_enabled:
                            etcd_enabled === '展示Etcd配置'
                              ? '隐藏Etcd配置'
                              : '展示Etcd配置'
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
              {etcd_enabled !== '展示Etcd配置' && (
                <div className={styles.config}>
                  <FormItem {...formItemLayouts} label="secret名称">
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
                    {...formItemLayouts}
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
              )}
            </Row>
            {/* 存储 */}
            <Row className={styles.antd_row}>
              <div className={styles.titleBox}>
                {/* <span className={styles.titleSpan}>存储</span>
                <Switch
                  onClick={this.onStorage}
                  style={{ marginLeft: '5px' }}
                  checkedChildren="开"
                  unCheckedChildren="关"
                  defaultChecked
                /> */}
                <div className={styles.title}>
                  <span className={styles.titleSpan}>存储</span>
                  <CheckableTag
                    checked={storage_enabled !== '隐藏存储' || false}
                    onChange={() => {
                      this.setState(state => {
                        return {
                          ...state,
                          storage_enabled:
                            storage_enabled === '展示存储'
                              ? '隐藏存储'
                              : '展示存储'
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
              {storage_enabled !== '展示存储' && (
                <div className={styles.config}>
                  <FormItem
                    {...formItemLayouts}
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
                    {...formItemLayouts}
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
              )}
            </Row>
            {/* 数据库 */}
            <Row className={styles.antd_row}>
              <div className={styles.titleBox}>
                {/* <span className={styles.titleSpan}>数据库</span>
                <Switch
                  onClick={this.onDatabase}
                  style={{ marginLeft: '5px' }}
                  checkedChildren="开"
                  unCheckedChildren="关"
                  defaultChecked
                /> */}
                <div className={styles.title}>
                  <span className={styles.titleSpan}>数据库</span>
                  <CheckableTag
                    checked={database_enabled !== '隐藏数据库配置' || false}
                    onChange={() => {
                      this.setState(state => {
                        return {
                          ...state,
                          database_enabled:
                            database_enabled === '展示数据库配置'
                              ? '隐藏数据库配置'
                              : '展示数据库配置'
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
              {database_enabled !== '展示数据库配置' && (
                <div className={`${styles.config} ${styles.data_base}`}>
                  {/* 连接地址 */}
                  <div style={{ position: 'relative', width: '800px' }}>
                    <h3
                      style={{
                        position: 'absolute',
                        left: '99px',
                        top: '-35px'
                      }}
                    >
                      控制台数据库:
                    </h3>
                    <h3
                      style={{
                        position: 'absolute',
                        right: '212px',
                        top: '-35px'
                      }}
                    >
                      数据中心数据库:
                    </h3>
                  </div>
                  <FormItem
                    {...formItemLayouts}
                    label="连接地址"
                    style={{ display: 'flex' }}
                  >
                    {/* 控制台数据库 */}
                    {getFieldDecorator('uiDatabase_host', {
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
                      <Input placeholder="请输入存储名称123  例：glusterfs-simple" />
                    )}
                    {getFieldDecorator('regionDatabase_host', {
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
                  {/* 连接端口 */}
                  <FormItem
                    {...formItemLayouts}
                    label="连接端口"
                    style={{ display: 'flex' }}
                  >
                    {/* 控制台数据库 */}
                    {getFieldDecorator('uiDatabase_port', {
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
                    {getFieldDecorator('regionDatabase_port', {
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
                  {/* 用户名 */}
                  <FormItem
                    {...formItemLayouts}
                    label="用户名"
                    style={{ display: 'flex' }}
                  >
                    {/* 控制台数据库 */}
                    {getFieldDecorator('uiDatabase_username', {
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
                    {getFieldDecorator('regionDatabase_username', {
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
                  {/* 密码 */}
                  <FormItem
                    {...formItemLayouts}
                    label="密码"
                    style={{ display: 'flex' }}
                  >
                    {/* 控制台数据库 */}
                    {getFieldDecorator('uiDatabase_password', {
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
                    {getFieldDecorator('regionDatabase_password', {
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
                  {/* 数据库名称 */}
                  <FormItem
                    {...formItemLayouts}
                    label="数据库名称"
                    style={{ display: 'flex' }}
                  >
                    {/* 控制台数据库 */}
                    {getFieldDecorator('uiDatabase_dbname', {
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
                    {getFieldDecorator('regionDatabase_dbname', {
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
              )}
            </Row>
            {/* 镜像仓库 */}
            <Row className={styles.antd_row}>
              <div className={styles.titleBox}>
                {/* <span className={styles.titleSpan}>镜像仓库</span>
                <Switch
                  style={{ marginLeft: '5px' }}
                  checkedChildren="开"
                  unCheckedChildren="关"
                  defaultChecked
                />
              </div> */}
                <div className={styles.title}>
                  <span className={styles.titleSpan}>镜像仓库</span>
                  <CheckableTag
                    checked={image_enabled !== '隐藏镜像仓库配置' || false}
                    onChange={() => {
                      this.setState(state => {
                        return {
                          ...state,
                          image_enabled:
                            image_enabled === '展示镜像仓库配置'
                              ? '隐藏镜像仓库配置'
                              : '展示镜像仓库配置'
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
              {image_enabled !== '展示镜像仓库配置' && (
                <div className={styles.config}>
                  <FormItem
                    {...formItemLayouts}
                    // labelCol={{ xs: { span: 3 }, sm: { span: 3 } }}
                    // wrapperCol={{ xs: { span: 7 }, sm: { span: 7 } }}
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
                    // labelCol={{ xs: { span: 3 }, sm: { span: 3 } }}
                    // wrapperCol={{ xs: { span: 7 }, sm: { span: 7 } }}
                    label="命名空间"
                    className={styles.antd_form}
                  >
                    {getFieldDecorator('namespace', {
                      // initialValue: editInfo.domain_name
                    })(<Input placeholder="请输入命名空间" />)}
                  </FormItem>
                  <FormItem
                    {...formItemLayouts}
                    // labelCol={{ xs: { span: 3 }, sm: { span: 3 } }}
                    // wrapperCol={{ xs: { span: 7 }, sm: { span: 7 } }}
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
                    })(
                      <Input placeholder="请输入存储名称  例：glusterfs-simple" />
                    )}
                  </FormItem>
                  <FormItem
                    {...formItemLayouts}
                    // labelCol={{ xs: { span: 3 }, sm: { span: 3 } }}
                    // wrapperCol={{ xs: { span: 7 }, sm: { span: 7 } }}
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
              )}
            </Row>
            {/* 构建节点 */}
            <Row className={styles.antd_row}>
              <div className={styles.titleBox}>
                {/* <span className={styles.titleSpan}>构建节点</span>
                <Switch
                  style={{ marginLeft: '5px' }}
                  checkedChildren="开"
                  unCheckedChildren="关"
                  defaultChecked
                />
              </div> */}
                <div className={styles.title}>
                  <span className={styles.titleSpan}>构建节点</span>
                  <CheckableTag
                    checked={node_enabled !== '隐藏构建节点配置' || false}
                    onChange={() => {
                      this.setState(state => {
                        return {
                          ...state,
                          node_enabled:
                            node_enabled === '展示构建节点配置'
                              ? '隐藏构建节点配置'
                              : '展示构建节点配置'
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
              {node_enabled !== '展示构建节点配置' && (
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
                  下一步1
                </Button>
              </FormItem>
            </Row>
          </Form>
        </Card>
      </PageHeaderLayout>
    );
  }
}
