/* eslint-disable array-callback-return */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import { Button, Card, Form, Input, Row, Steps } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import Qs from 'qs';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import router from 'umi/router';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import userUtil from '../../../utils/user';
import DAinput from '../component/node';
import styles from './index.less';
import cookie from '../../../utils/cookie';


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
  type: 'aliyun',
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
      adminer,
      language: cookie.get('language') === 'zh-CN' ? true : false
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
  handleSubmit = e => {};
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
        dataObj.nodesForGateway.nodes = values.nodesForGateway || [];
        // 镜像仓库
        if(values.domain || values.namespace || values.username || values.password) {
          dataObj.imageHub.enable = true;
        }else{
          dataObj.imageHub.enable = false;
        }
        
        dataObj.imageHub.domain = values.domain || '';
        dataObj.imageHub.namespace = values.namespace || '';
        dataObj.imageHub.username = values.username || '';
        dataObj.imageHub.password = values.password || '';
        dataObj.etcd.endpoints = values.endpoints || [];
        dataObj.etcd.secretName = values.secretName || '';
        // 存储
        if(values.server){
          dataObj.estorage.enable = true;
          dataObj.estorage.RWX.enable = true;
          dataObj.estorage.RWO.enable = true;
        }else{
          dataObj.estorage.enable = false;
          dataObj.estorage.RWX.enable = false;
          dataObj.estorage.RWO.enable = false;
        }
        dataObj.estorage.RWX.config.server = values.server || '';
        // 数据库
        if(values.regionDatabase_host || values.regionDatabase_port || values.regionDatabase_username || values.regionDatabase_password || values.regionDatabase_dbname){
          dataObj.database.enable = true;
          dataObj.database.regionDatabase.enable = true;
        }else{
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
            search: Qs.stringify({ data: dataObj, name: 'ack', cloudserver:'aliyun' })
          });
        } else {
          // 跳转下一步
          router.push({
            pathname: `/enterprise/${eid}/provider/ACksterList/install`,
            search: Qs.stringify({
              data: dataObj,
              name: 'ack',
              step: 'base',
              cloudserver:'aliyun'
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
        const patt = /^[^\s]*$/;
        if(item.externalIP.match(patt) && item.internalIP.match(patt) && item.name.match(patt)){
          callback();
        }else{
          callback(new Error(formatMessage({id:'placeholder.no_spaces'})));
        }
        isPass = true;
      } else {
        isPass = false;
        return true;
      }
    });
    if (isPass) {
      callback();
    } else {
      callback(new Error(`${formatMessage({id:'enterpriseColony.cloud.gateway_node'})}`));
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
    const {language} = this.state
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
        xs: { span: 10 },
        sm: { span: 10 }
      }
    };
    const en_storageFormItemLayout = {
      labelCol: {
        xs: { span: 5 },
        sm: { span: 5 }
      },
      wrapperCol: {
        xs: { span: 10 },
        sm: { span: 10 }
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
    const en_formItemLayouts = {
      labelCol: {
        xs: { span: 6 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 6 },
        sm: { span: 6 }
      }
    };
    const is_language = language ? formItemLayouts : en_formItemLayouts
    const is_storageFormItemLayout =  language ? storageFormItemLayout : en_storageFormItemLayout
    const docs = (
      <div>
        <a href=''>详细配置见官方文档</a>
      </div>
    )
    return (
      <PageHeaderLayout
      title={<FormattedMessage id='enterpriseColony.button.text'/>}
      content={<FormattedMessage id='enterpriseColony.PageHeaderLayout.content'/>}
      titleSvg={pageheaderSvg.getSvg('clusterSvg',18)}
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
              <Row className={language ? styles.antd_row : styles.en_antd_row}>
                <div>
                  <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                    <FormattedMessage id='enterpriseColony.cloud.slb'/>
                  </span>
                </div>
                <FormItem
                  {...formItemLayout}
                  extra={<div><FormattedMessage id='enterpriseColony.alcloud.slb'/><a target="_blank" href="https://help.aliyun.com/document_detail/29863.html?spm=5176.21213303.J_6704733920.9.6ff053c9SQg0bg&scm=20140722.S_help%40%40%E6%96%87%E6%A1%A3%40%4029863._.ID_help%40%40%E6%96%87%E6%A1%A3%40%4029863-RL_SLB-LOC_main-OR_ser-V_2-P0_1"><FormattedMessage id='enterpriseColony.alcloud.doc'/></a></div>}
                  className={styles.antd_form}
                >
                  {getFieldDecorator('gatewayIngressIPs', {
                    rules: [
                      {
                        required: true,
                        message: formatMessage({id:'enterpriseColony.cloud.ip'})
                      },
                      {
                        pattern: /((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})(\.((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})){3}/g,
                        message: formatMessage({id:'enterpriseColony.cloud.input_ip'})
                      },
                      {
                        pattern: /^[^\s]*$/,
                        message: formatMessage({id:'placeholder.no_spaces'})
                      }
                    ]
                  })(<Input placeholder={formatMessage({id:'enterpriseColony.cloud.demo_ip'})} style={{textOverflow: 'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'}}/>)}
                </FormItem>
              </Row>
              {/* 网关安装节点 */}
              <Row className={language ? styles.antd_row : styles.en_antd_row}>
                <div>
                  <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                    <FormattedMessage id='enterpriseColony.cloud.gateway'/>
                  </span>
                </div>
                <FormItem
                  {...formItemLayout}
                  className={styles.antd_form}
                  extra={formatMessage({id:'enterpriseColony.alcloud.gateway'})}
                >
                  {getFieldDecorator('nodesForGateway', {
                    rules: [
                      {
                        required: true,
                        message: formatMessage({id:'enterpriseColony.cloud.input_gateway'})
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
                    <span className={language ?  styles.titleSpan :  styles.en_titleSpan}><FormattedMessage id='enterpriseColony.cloud.nas'/></span>
                  </div>
                  <div className={styles.desc}>
                   <FormattedMessage id='enterpriseColony.alcloud.nas'/><a target="_blank" href="https://help.aliyun.com/document_detail/312360.html"><FormattedMessage id='enterpriseColony.alcloud.doc'/></a>
                  </div>
                </div>
                <div className={language ? styles.config : styles.enconfig}>
                  <FormItem {...is_storageFormItemLayout} label={formatMessage({id:'enterpriseColony.cloud.mount'})}>
                    {getFieldDecorator('server', {
                      rules: [
                        {
                          required: false,
                          message: formatMessage({id:'enterpriseColony.cloud.mount_add'})
                        },
                        {
                          pattern: /^[^\s]*$/,
                          message: formatMessage({id:'placeholder.no_spaces'})
                        }
                      ]
                    })(
                      <Input placeholder={formatMessage({id:'enterpriseColony.cloud.dome_mount'})} style={{textOverflow: 'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'}}/>
                    )}
                  </FormItem>
                  {/* <FormItem
                    {...storageFormItemLayout}
                    label="RWO 所用存储 storageClass 名称"
                  >
                    {getFieldDecorator('storageClassName2', {
                      rules: [
                        {
                          required: false,
                          message: '请填写RWO 所用存储 storageClass 名称'
                        },
                          {
                            pattern: /^[^\s]*$/,
                            message: formatMessage({id:'placeholder.no_spaces'})
                          }
                      ]
                    })(
                      <Input placeholder="请填写存储名称  例：glusterfs-simple" />
                    )}
                  </FormItem> */}
                </div>
              </Row>
              {/* 数据库 */}
              <Row className={styles.antd_rows}>
                <div className={styles.titleBox}>
                  <div className={styles.title}>
                    <span className={language ?  styles.titleSpan :  styles.en_titleSpan}><FormattedMessage id='enterpriseColony.cloud.access'/></span>
                  </div>
                  <div className={styles.desc}>
                  <FormattedMessage id='enterpriseColony.alcloud.access'/>
                  <a target="_blank" href="https://help.aliyun.com/document_detail/309008.html"><FormattedMessage id='enterpriseColony.alcloud.doc'/></a>
                  </div>
                </div>
                <div className={language ? styles.config :styles.config_en}>
                  {/* 连接地址 */}
                  <FormItem {...is_language} label={formatMessage({id:'enterpriseColony.cloud.address'})}>
                    {/* 控制台数据库 */}
                    {getFieldDecorator('regionDatabase_host', {
                      rules: [
                        {
                          required: false,
                          message: formatMessage({id:'enterpriseColony.cloud.address'})
                        },
                        {
                          pattern: /^[^\s]*$/,
                          message: formatMessage({id:'placeholder.no_spaces'})
                        }
                      ]
                    })(<Input placeholder={formatMessage({id:'enterpriseColony.cloud.input_address'})} style={{textOverflow: 'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'}}/>)}
                  </FormItem>
                  {/* 连接端口 */}
                  <FormItem {...is_language} label={formatMessage({id:'enterpriseColony.cloud.port'})}>
                    {/* 控制台数据库 */}
                    {getFieldDecorator('regionDatabase_port', {
                      rules: [
                        {
                          required: false,
                          message: formatMessage({id:'enterpriseColony.cloud.inpiut_port'})
                        },
                        {
                          pattern: /^[^\s]*$/,
                          message: formatMessage({id:'placeholder.no_spaces'})
                        }
                      ]
                    })(<Input placeholder={formatMessage({id:'enterpriseColony.cloud.demo_port'})} style={{textOverflow: 'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'}}/>)}
                  </FormItem>
                  {/* 用户名 */}
                  <FormItem {...is_language} label={formatMessage({id:'enterpriseColony.cloud.name'})}>
                    {/* 控制台数据库 */}
                    {getFieldDecorator('regionDatabase_username', {
                      rules: [
                        {
                          required: false,
                          message: formatMessage({id:'enterpriseColony.cloud.input_name'})
                        },
                        {
                          pattern: /^[^\s]*$/,
                          message: formatMessage({id:'placeholder.no_spaces'})
                        }
                      ]
                    })(<Input placeholder={formatMessage({id:'enterpriseColony.cloud.demo_name'})}style={{textOverflow: 'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'}}/>)}
                  </FormItem>
                  {/* 密码 */}
                  <FormItem {...is_language} label={formatMessage({id:'enterpriseColony.cloud.password'})}>
                    {/* 控制台数据库 */}
                    {getFieldDecorator('regionDatabase_password', {
                      rules: [
                        {
                          required: false,
                          message: formatMessage({id:'enterpriseColony.cloud.input_password'})
                        },
                        {
                          pattern: /^[^\s]*$/,
                          message: formatMessage({id:'placeholder.no_spaces'})
                        }
                      ]
                    })(<Input type="password" placeholder={formatMessage({id:'enterpriseColony.cloud.input_password'})} style={{textOverflow: 'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'}}/>)}
                  </FormItem>
                  {/* 数据库名称 */}
                  <FormItem {...is_language} label={formatMessage({id:'enterpriseColony.cloud.access_name'})}>
                    {/* 控制台数据库 */}
                    {getFieldDecorator('regionDatabase_dbname', {
                      rules: [
                        {
                          required: false,
                          message: formatMessage({id:'enterpriseColony.cloud.input_access_name'})
                        },
                        {
                          pattern: /^[^\s]*$/,
                          message: formatMessage({id:'placeholder.no_spaces'})
                        }
                      ]
                    })(<Input placeholder={formatMessage({id:'enterpriseColony.cloud.demo_access_name'})} style={{textOverflow: 'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'}}/>)}
                  </FormItem>
                </div>
              </Row>
              {/* 镜像仓库 */}
              <Row className={styles.antd_rows}>
                <div className={styles.titleBox}>
                  <div className={styles.title}>
                    <span className={language ?  styles.titleSpan :  styles.en_titleSpan}><FormattedMessage id='enterpriseColony.cloud.image'/></span>
                  </div>
                  <div className={styles.desc}>
                   <FormattedMessage id='enterpriseColony.alcloud.acr'/>
                  </div>
                </div>
                <div className={language ? styles.config :styles.en_config}>
                  <FormItem
                    {...is_language}
                    label={formatMessage({id:'enterpriseColony.cloud.image_address'})}
                    className={styles.antd_form}
                  >
                    {getFieldDecorator('domain', {
                      rules: [
                        {
                          required: false,
                          message: formatMessage({id:'enterpriseColony.cloud.input_image_address'})
                        },
                        {
                          pattern: /^[^\s]*$/,
                          message: formatMessage({id:'placeholder.no_spaces'})
                        }
                      ]
                    })(<Input placeholder={formatMessage({id:'enterpriseColony.cloud.input_image_address'})} style={{textOverflow: 'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'}}/>)}
                  </FormItem>
                  <FormItem
                    {...is_language}
                    label={formatMessage({id:'enterpriseColony.cloud.namespace'})}
                    className={styles.antd_form}
                  >
                    {getFieldDecorator('namespace',{
                      rules: [
                        {
                          required: false,
                          message: formatMessage({id:'enterpriseColony.cloud.input_namespace'})
                        },
                          {
                            pattern: /^[^\s]*$/,
                            message: formatMessage({id:'placeholder.no_spaces'})
                          }
                      ]
                    })(
                      <Input placeholder={formatMessage({id:'enterpriseColony.cloud.input_namespace'})} style={{textOverflow: 'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'}}/>
                    )}
                  </FormItem>
                  <FormItem
                    {...is_language}
                    label={formatMessage({id:'enterpriseColony.cloud.name'})}
                    className={styles.antd_form}
                  >
                    {getFieldDecorator('username', {
                      rules: [
                        {
                          required: false,
                          message: formatMessage({id:'enterpriseColony.cloud.input_name'})
                        },
                          {
                            pattern: /^[^\s]*$/,
                            message: formatMessage({id:'placeholder.no_spaces'})
                          }
                      ]
                    })(<Input placeholder={formatMessage({id:'enterpriseColony.cloud.demo_name'})} style={{textOverflow: 'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'}}/>)}
                  </FormItem>
                  <FormItem
                    {...is_language}
                    label={formatMessage({id:'enterpriseColony.cloud.password'})}
                    className={styles.antd_form}
                  >
                    {getFieldDecorator('password', {
                      rules: [
                        {
                          required: false,
                          message: formatMessage({id:'enterpriseColony.cloud.input_password'})
                        },
                        {
                          pattern: /^[^\s]*$/,
                          message: formatMessage({id:'placeholder.no_spaces'})
                        }
                      ]
                    })(<Input type="password" placeholder={formatMessage({id:'enterpriseColony.cloud.input_password'})} style={{textOverflow: 'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'}}/>)}
                  </FormItem>
                </div>
              </Row>
            </div>
            <Row>
              <FormItem className={styles.antd_row_btn}>
                <Button
                  className={styles.antd_btn}
                  // type="primary"
                  onClick={() => {
                    this.props.dispatch(
                      routerRedux.push(`/enterprise/${eid}/addCluster`)
                    );
                  }}
                >
                  <FormattedMessage id='button.return'/>
                </Button>
                <Button
                  className={styles.antd_btn}
                  // type="primary"
                  onClick={() => {
                    this.toLinkNext('advanced');
                  }}
                >
                  <FormattedMessage id='button.configuration'/>
                </Button>
                <Button
                  className={styles.antd_btn}
                  type="primary"
                  onClick={() => {
                    this.toLinkNext('next');
                  }}
                >
                  <FormattedMessage id='button.next'/>
                </Button>
              </FormItem>
            </Row>
          </Form>
        </Card>
      </PageHeaderLayout>
    );
  }
}
