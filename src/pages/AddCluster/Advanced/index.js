/* eslint-disable array-callback-return */
/* eslint-disable no-unused-vars */
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
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import router from 'umi/router';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import userUtil from '../../../utils/user';
import Build from '../component/build';
import Etcd from '../component/etcd';
import cookie from '../../../utils/cookie';
import pageheaderSvg from '@/utils/pageHeaderSvg';
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
      etcd_enabled: formatMessage({id:'enterpriseColony.Advanced.configuration'}),
      storage_enabled: formatMessage({id:'enterpriseColony.Advanced.configuration'}),
      database_enabled: formatMessage({id:'enterpriseColony.Advanced.configuration'}),
      image_enabled: formatMessage({id:'enterpriseColony.Advanced.configuration'}),
      node_enabled: formatMessage({id:'enterpriseColony.Advanced.configuration'}),
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
  handleSubmit = () => { };
  toLinkNext = value => {
    const {
      match: {
        params: { eid }
      },
      location: { search },
      form
    } = this.props;
    const { data, name, cloudserver } =
      search && Qs.parse(this.props.location.search.substr(1));
    const {
      etcd_enabled,
      storage_enabled,
      database_enabled,
      image_enabled,
      node_enabled,
      language
    } = this.state;
    //   页面跳转
    if (value === 'next') {
      const routeData = data || {};
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
        type: routeData.type,
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
          switch (name) {
            case 'helm':
              if (etcd_enabled === `${formatMessage({id:'enterpriseColony.Advanced.configuration'})}`) {
                dataObj.etcd.enable = false;
              } else {
                dataObj.etcd.enable = true;
              }
              // 存储
              if (storage_enabled === `${formatMessage({id:'enterpriseColony.Advanced.configuration'})}`) {
                dataObj.estorage.enable = false;
                dataObj.estorage.RWX.enable = false;
                dataObj.estorage.RWO.enable = false;
              } else {
                dataObj.estorage.enable = true;
                dataObj.estorage.RWX.enable = true;
                dataObj.estorage.RWO.enable = true;
              }
              // 数据库
              if (database_enabled === `${formatMessage({id:'enterpriseColony.Advanced.configuration'})}`) {
                dataObj.database.enable = false;
                dataObj.database.regionDatabase.enable = false;
              } else {
                dataObj.database.enable = true;
                dataObj.database.regionDatabase.enable = true;
              }
              // 镜像仓库
              if (image_enabled === `${formatMessage({id:'enterpriseColony.Advanced.configuration'})}`) {
                dataObj.imageHub.enable = false;
              } else {
                dataObj.imageHub.enable = true;
              }
              // 构建节点
              if (node_enabled === `${formatMessage({id:'enterpriseColony.Advanced.configuration'})}`) {
                dataObj.nodesForChaos.enable = false;
              } else {
                dataObj.nodesForChaos.enable = true;
              }
              break;
            case 'ack':
              dataObj.estorage.enable = routeData && routeData.estorage && routeData.estorage.enable || false;
              dataObj.estorage.RWX.enable = routeData && routeData.estorage && routeData.estorage.RWX && routeData.estorage.RWX.enable || false;
              dataObj.estorage.RWO.enable = routeData && routeData.estorage && routeData.estorage.RWO && routeData.estorage.RWO.enable || false;
              dataObj.database.enable = routeData && routeData.database && routeData.database.enable || false;
              dataObj.database.regionDatabase.enable = routeData && routeData.database && routeData.database.regionDatabase && routeData.database.regionDatabase.enable || false;
              dataObj.imageHub.enable = routeData && routeData.imageHub && routeData.imageHub.enable || false;
              dataObj.nodesForGateway.enable = routeData && routeData.nodesForGateway && routeData.nodesForGateway.enable || false;
              // 构建节点
              if (node_enabled === `${formatMessage({id:'enterpriseColony.Advanced.configuration'})}`) {
                dataObj.nodesForChaos.enable = false;
              } else {
                dataObj.nodesForChaos.enable = true;
              }
              //etcd
              if (etcd_enabled === `${formatMessage({id:'enterpriseColony.Advanced.configuration'})}`) {
                dataObj.etcd.enable = false;
              } else {
                dataObj.etcd.enable = true;
              }
              break;
            case 'huawei':
              dataObj.estorage.enable = routeData && routeData.estorage && routeData.estorage.enable || false;
              dataObj.estorage.RWX.enable = routeData && routeData.estorage && routeData.estorage.RWX && routeData.estorage.RWX.enable || false;
              dataObj.estorage.RWO.enable = routeData && routeData.estorage && routeData.estorage.RWO && routeData.estorage.RWO.enable || false;
              dataObj.estorage.RWX.enable = routeData && routeData.estorage && routeData.estorage.NFS && routeData.estorage.NFS.enable || false;
              dataObj.database.enable = routeData && routeData.database && routeData.database.enable || false;
              dataObj.database.regionDatabase.enable = routeData && routeData.database && routeData.database.regionDatabase && routeData.database.regionDatabase.enable || false;
              dataObj.imageHub.enable = routeData && routeData.imageHub && routeData.imageHub.enable || false;
              dataObj.nodesForGateway.enable = routeData && routeData.nodesForGateway && routeData.nodesForGateway.enable || false;
              // 构建节点
              if (node_enabled === `${formatMessage({id:'enterpriseColony.Advanced.configuration'})}`) {
                dataObj.nodesForChaos.enable = false;
              } else {
                dataObj.nodesForChaos.enable = true;
              }
              //etcd
              if (etcd_enabled === `${formatMessage({id:'enterpriseColony.Advanced.configuration'})}`) {
                dataObj.etcd.enable = false;
              } else {
                dataObj.etcd.enable = true;
              }
              break;
            case 'tencent':
              dataObj.estorage.enable = routeData && routeData.estorage && routeData.estorage.enable || false;
              dataObj.estorage.RWX.enable = routeData && routeData.estorage && routeData.estorage.RWX && routeData.estorage.RWX.enable || false;
              dataObj.estorage.RWO.enable = routeData && routeData.estorage && routeData.estorage.RWO && routeData.estorage.RWO.enable || false;
              dataObj.estorage.RWX.enable = routeData && routeData.estorage && routeData.estorage.NFS && routeData.estorage.NFS.enable || false;
              dataObj.database.enable = routeData && routeData.database && routeData.database.enable || false;
              dataObj.database.regionDatabase.enable = routeData && routeData.database && routeData.database.regionDatabase && routeData.database.regionDatabase.enable || false;
              dataObj.imageHub.enable = routeData && routeData.imageHub && routeData.imageHub.enable || false;
              dataObj.nodesForGateway.enable = routeData && routeData.nodesForGateway && routeData.nodesForGateway.enable || false;
              // 构建节点
              if (node_enabled === `${formatMessage({id:'enterpriseColony.Advanced.configuration'})}`) {
                dataObj.nodesForChaos.enable = false;
              } else {
                dataObj.nodesForChaos.enable = true;
              }
              //etcd
              if (etcd_enabled === `${formatMessage({id:'enterpriseColony.Advanced.configuration'})}`) {
                dataObj.etcd.enable = false;
              } else {
                dataObj.etcd.enable = true;
              }
              break;
            default:
              break;
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
          dataObj.imageHub.domain = values.domain || (routeData && routeData.imageHub && routeData.imageHub.domain) || '';
          dataObj.imageHub.namespace = values.namespace || (routeData && routeData.imageHub && routeData.imageHub.namespace) || '';
          dataObj.imageHub.username = values.username || (routeData && routeData.imageHub && routeData.imageHub.username) || '';
          dataObj.imageHub.password = values.password || (routeData && routeData.imageHub && routeData.imageHub.password) || '';

          dataObj.estorage.RWX.config.storageClassName =
            values.storageClassName1 || '';
          dataObj.estorage.RWO.storageClassName =
            values.storageClassName2 || (routeData && routeData.estorage && routeData.estorage.RWO && routeData.estorage.RWO.storageClassName) || '';
          dataObj.estorage.RWO.server = (routeData && routeData.estorage && routeData.estorage.RWX && routeData.estorage.RWX.config && routeData.estorage.RWX.config.server) || ''
          dataObj.estorage.NFS.server = (routeData && routeData.estorage && routeData.estorage.NFS && routeData.estorage.NFS.server) || ''
          dataObj.estorage.NFS.path = (routeData && routeData.estorage && routeData.estorage.NFS && routeData.estorage.NFS.path) || ''

          dataObj.database.regionDatabase.host =
            values.regionDatabase_host || (routeData && routeData.database && routeData.database.regionDatabase && routeData.database.regionDatabase.host) || '';
          dataObj.database.regionDatabase.port =
            values.regionDatabase_port || (routeData && routeData.database && routeData.database.regionDatabase && routeData.database.regionDatabase.port) || '';
          dataObj.database.regionDatabase.username =
            values.regionDatabase_username || (routeData && routeData.database && routeData.database.regionDatabase && routeData.database.regionDatabase.username) || '';
          dataObj.database.regionDatabase.password =
            values.regionDatabase_password || (routeData && routeData.database && routeData.database.regionDatabase && routeData.database.regionDatabase.password) || '';
          dataObj.database.regionDatabase.dbname =
            values.regionDatabase_dbname || (routeData && routeData.database && routeData.database.regionDatabase && routeData.database.regionDatabase.dbname) || '';

          //高级配置
          dataObj.etcd.endpoints = values.endpoints || [];
          dataObj.etcd.secretName = values.secretName || '';
          dataObj.nodesForChaos.nodes = values.nodesForChaos || [];

          // 路由跳转
          router.push({
            pathname: `/enterprise/${eid}/provider/ACksterList/install`,
            search: Qs.stringify({
              name,
              step: 'advanced',
              data: dataObj,
              cloudserver: cloudserver
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
        case 'tencent':
          router.push({
            pathname: `/enterprise/${eid}/provider/TencentList`
          });
          break;
        default:
          break;
      }
    }
  };
  // 校验节点名称
  handleValidatorsNodes = (_, value, callback) => {
    if (value && value.length > 0) {
      let isPass = false;
      value.some(item => {
        if (item.ip || item.name){
          isPass = true;
          const patt = /^[^\s]*$/;
          if(item.ip.match(patt)){
            callback();
          }else{
            callback(new Error(`${formatMessage({id:'placeholder.no_spaces'})}`));
          }
        } 
        else {
          isPass = false;
          return true;
        }
      });
      if (isPass) {
        callback();
      }
      else {
        
        callback('请填写完整的节点名称');
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
      location: { search }
    } = this.props;
    const { data, name } =
      search && Qs.parse(this.props.location.search.substr(1));
    const {
      etcd_enabled,
      storage_enabled,
      database_enabled,
      image_enabled,
      node_enabled,
      language
    } = this.state;
    const formItemLayout = {
      labelCol: {
        xs: { span: 4 },
        sm: { span: 4 }
      },
      wrapperCol: {
        xs: { span: 9 },
        sm: { span: 9 }
      }
    };
    const en_formItemLayout = {
      labelCol: {
        xs: { span: 4 },
        sm: { span: 4 }
      },
      wrapperCol: {
        xs: { span: 9 },
        sm: { span: 9 }
      }
    };
    const storageFormItemLayout = {
      labelCol: {
        xs: { span: 8 },
        sm: { span: 8 }
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
    const en_formItemLayouts = {
      labelCol: {
        xs: { span: 8 },
        sm: { span: 8 }
      },
      wrapperCol: {
        xs: { span: 6 },
        sm: { span: 6 }
      }
    };
    const formItemLayouts_en = {
      labelCol: {
        xs: { span: 4 },
        sm: { span: 4 }
      },
      wrapperCol: {
        xs: { span: 6 },
        sm: { span: 6 }
      }
    };
    const is_language = language ? formItemLayouts : en_formItemLayouts;
    const is_formItemLayout = language ?  formItemLayout : en_formItemLayout;
    const is_formItemLayouts_en = language ? formItemLayouts : formItemLayouts_en;


    return (
      <PageHeaderLayout
      title={<FormattedMessage id='enterpriseColony.button.text'/>}
      content={<FormattedMessage id='enterpriseColony.PageHeaderLayout.content'/>}
      titleSvg={pageheaderSvg.getSvg('clusterSvg',18)}
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
                  <span className={language ?  styles.titleSpan : styles.en_titleSpan}>Etcd</span>
                  <CheckableTag
                    checked={etcd_enabled !== `${formatMessage({id:'enterpriseColony.Advanced.Close'})}` || false}
                    onChange={() => {
                      this.setState(state => {
                        return {
                          ...state,
                          etcd_enabled:
                            etcd_enabled === `${formatMessage({id:'enterpriseColony.Advanced.configuration'})}`
                              ? formatMessage({id:'enterpriseColony.Advanced.Close'})
                              : formatMessage({id:'enterpriseColony.Advanced.configuration'})
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
              {etcd_enabled !== `${formatMessage({id:'enterpriseColony.Advanced.configuration'})}` ? (
                <div className={styles.config}>
                  <FormItem {...is_formItemLayout} label={<FormattedMessage id='enterpriseColony.Advanced.name'/>}>
                    {getFieldDecorator('secretName', {
                      rules: [
                        {
                          required: true,
                          message: formatMessage({id:'enterpriseColony.Advanced.inpiut_name'})
                        },
                        {
                          pattern: /^[^\s]*$/,
                          message: formatMessage({id:'placeholder.no_spaces'})
                        }
                      ]
                    })(
                      <Input placeholder={formatMessage({id:'enterpriseColony.Advanced.inpiut_Name'})} style={{textOverflow: 'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'}} />
                    )}
                  </FormItem>
                  <FormItem
                    {...is_formItemLayout}
                    label={<FormattedMessage id='enterpriseColony.Advanced.node'/>}
                    className={styles.antd_form}
                  >
                    {getFieldDecorator('endpoints', {
                      rules: [
                        {
                          required: true,
                          message: formatMessage({id:'enterpriseColony.Advanced.input_node'})
                        },
                        {
                          validator: this.handleValidatorsNodes
                        }
                      ]
                    })(<Etcd />)}
                  </FormItem>
                </div>
              ) : (
                <div className={styles.desc}>
                  <FormattedMessage id='enterpriseColony.Advanced.input_Node'/>
                </div>
              )}
            </Row>
            {/* 存储 */}
            {name !== 'ack' && name !== 'huawei' && name !== 'tencent' && (
              <Row className={styles.antd_row}>
                <div className={styles.titleBox}>
                  <div className={styles.title}>
                    <span className={language ?  styles.titleSpan : styles.en_titleSpan}><FormattedMessage id='enterpriseColony.Advanced.storage'/></span>
                    <CheckableTag
                      checked={storage_enabled !== `${formatMessage({id:'enterpriseColony.Advanced.Close'})}` || false}
                      onChange={() => {
                        this.setState(state => {
                          return {
                            ...state,
                            storage_enabled:
                              storage_enabled === `${formatMessage({id:'enterpriseColony.Advanced.configuration'})}`
                              ? formatMessage({id:'enterpriseColony.Advanced.Close'})
                              : formatMessage({id:'enterpriseColony.Advanced.configuration'})
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
                {storage_enabled !== `${formatMessage({id:'enterpriseColony.Advanced.configuration'})}` ? (
                  <div className={styles.config}>
                    <FormItem
                      {...storageFormItemLayout}
                      label={<FormattedMessage id='enterpriseColony.Advanced.storageClass'/>}
                      className={styles.antd_form}
                    >
                      {getFieldDecorator('storageClassName1', {
                        rules: [
                          {
                            required: true,
                            message: formatMessage({id:'enterpriseColony.Advanced.input_storageClass'})
                          },
                          {
                            pattern: /^[^\s]*$/,
                            message: formatMessage({id:'placeholder.no_spaces'})
                          }
                        ]
                      })(
                        <Input placeholder={formatMessage({id:'enterpriseColony.Advanced.input_StorageClass'})} style={{textOverflow: 'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'}} />
                      )}
                    </FormItem>
                    <FormItem
                      {...storageFormItemLayout}
                      label={<FormattedMessage id='enterpriseColony.Advanced.StorageClass'/>}
                      className={styles.antd_form}
                    >
                      {getFieldDecorator('storageClassName2', {
                        rules: [
                          {
                            required: true,
                            message:  formatMessage({id:'enterpriseColony.Advanced.StorageClass'})
                          },
                          {
                            pattern: /^[^\s]*$/,
                            message: formatMessage({id:'placeholder.no_spaces'})
                          }
                        ]
                      })(
                        <Input placeholder= {formatMessage({id:'enterpriseColony.Advanced.input_storage'})} style={{textOverflow: 'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'}}/>
                      )}
                    </FormItem>
                  </div>
                ) : (
                  <div className={styles.desc}>
                    <FormattedMessage id='enterpriseColony.Advanced.Not_required_StorageClass'/>
                  </div>
                )}
              </Row>
            )}
            {/* 数据库 */}
            {name !== 'ack' && name !== 'huawei' && name !== 'tencent' && (
              <Row className={styles.antd_row}>
                <div className={styles.titleBox}>
                  <div className={styles.title}>
                    <span className={language ?  styles.titleSpan : styles.en_titleSpan}><FormattedMessage id='enterpriseColony.Advanced.access'/></span>
                    <CheckableTag
                      checked={database_enabled !== `${formatMessage({id:'enterpriseColony.Advanced.Close'})}` || false}
                      onChange={() => {
                        this.setState(state => {
                          return {
                            ...state,
                            database_enabled:
                              database_enabled === `${formatMessage({id:'enterpriseColony.Advanced.configuration'})}`
                              ? formatMessage({id:'enterpriseColony.Advanced.Close'})
                              : formatMessage({id:'enterpriseColony.Advanced.configuration'})
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
                {database_enabled !== `${formatMessage({id:'enterpriseColony.Advanced.configuration'})}` ? (
                  <div className={`${styles.config} ${styles.data_base}`}>
                    {/* 连接地址 */}
                    <FormItem
                      {...is_language}
                      label={<FormattedMessage id='enterpriseColony.Advanced.address'/>}
                      style={{ display: 'flex' }}
                    >
                      {/* 控制台数据库 */}
                      {getFieldDecorator('regionDatabase_host', {
                        rules: [
                          {
                            required: true,
                            message: formatMessage({id:'enterpriseColony.Advanced.input_address'})
                          },
                          {
                            pattern: /^[^\s]*$/,
                            message: formatMessage({id:'placeholder.no_spaces'})
                          }
                        ]
                      })(<Input placeholder= {formatMessage({id:'enterpriseColony.Advanced.input_address'})} style={{textOverflow: 'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'}}/>)}
                    </FormItem>
                    {/* 连接端口 */}
                    <FormItem
                      {...is_language}
                      label={<FormattedMessage id='enterpriseColony.Advanced.port'/>}
                      style={{ display: 'flex' }}
                    >
                      {/* 控制台数据库 */}
                      {getFieldDecorator('regionDatabase_port', {
                        rules: [
                          {
                            required: true,
                            message: formatMessage({id:'enterpriseColony.Advanced.input_port'})
                          },
                          {
                            pattern: /^[^\s]*$/,
                            message: formatMessage({id:'placeholder.no_spaces'})
                          }
                        ]
                      })(<Input placeholder= {formatMessage({id:'enterpriseColony.Advanced.input_Port'})} style={{textOverflow: 'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'}}/>)}
                    </FormItem>
                    {/* 用户名 */}
                    <FormItem
                      {...is_language}
                      label={<FormattedMessage id='enterpriseColony.Advanced.user_name'/>}
                      style={{ display: 'flex' }}
                    >
                      {/* 控制台数据库 */}
                      {getFieldDecorator('regionDatabase_username', {
                        rules: [
                          {
                            required: true,
                            message: formatMessage({id:'enterpriseColony.Advanced.input_user_name'})
                          },
                          {
                            pattern: /^[^\s]*$/,
                            message: formatMessage({id:'placeholder.no_spaces'})
                          }
                        ]
                      })(<Input placeholder= {formatMessage({id:'enterpriseColony.Advanced.input_user_Name'})} style={{textOverflow: 'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'}}/>)}
                    </FormItem>
                    {/* 密码 */}
                    <FormItem
                      {...is_language}
                      label={<FormattedMessage id='enterpriseColony.Advanced.password'/>}
                      style={{ display: 'flex' }}
                    >
                      {/* 控制台数据库 */}
                      {getFieldDecorator('regionDatabase_password', {
                        rules: [
                          {
                            required: true,
                            message: formatMessage({id:'enterpriseColony.Advanced.input_password'})
                          },
                          {
                            pattern: /^[^\s]*$/,
                            message: formatMessage({id:'placeholder.no_spaces'})
                          }
                        ]
                      })(<Input type="password" placeholder={formatMessage({id:'enterpriseColony.Advanced.input_password'})} style={{textOverflow: 'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'}}/>)}
                    </FormItem>
                    {/* 数据库名称 */}
                    <FormItem
                      {...is_language}
                      label={<FormattedMessage id='enterpriseColony.Advanced.access_name'/>}
                      style={{ display: 'flex' }}
                    >
                      {/* 控制台数据库 */}
                      {getFieldDecorator('regionDatabase_dbname', {
                        rules: [
                          {
                            required: true,
                            message: formatMessage({id:'enterpriseColony.Advanced.input_access_name'})
                          },
                          {
                            pattern: /^[^\s]*$/,
                            message: formatMessage({id:'placeholder.no_spaces'})
                          }
                        ]
                      })(
                        <Input placeholder={formatMessage({id:'enterpriseColony.Advanced.input_access_Name'})} style={{textOverflow: 'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'}}/>
                      )}
                    </FormItem>
                  </div>
                ) : (
                  <div className={styles.desc}>
                    <FormattedMessage id='enterpriseColony.Advanced.Not_required_access'/>
                  </div>
                )}
              </Row>
            )}
            {/* 镜像仓库 */}
            {name !== 'ack' && name !== 'huawei' && name !== 'tencent' && (
              <Row className={styles.antd_row}>
                <div className={styles.titleBox}>
                  <div className={styles.title}>
                    <span className={language ?  styles.titleSpan : styles.en_titleSpan}><FormattedMessage id='enterpriseColony.Advanced.mirror'/></span>
                    <CheckableTag
                      checked={image_enabled !== `${formatMessage({id:'enterpriseColony.Advanced.Close'})}` || false}
                      onChange={() => {
                        this.setState(state => {
                          return {
                            ...state,
                            image_enabled:
                              image_enabled === `${formatMessage({id:'enterpriseColony.Advanced.configuration'})}`
                              ? formatMessage({id:'enterpriseColony.Advanced.Close'})
                              : formatMessage({id:'enterpriseColony.Advanced.configuration'})
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
                {image_enabled !== `${formatMessage({id:'enterpriseColony.Advanced.configuration'})}` ? (
                  <div className={styles.config}>
                    <FormItem
                      {...is_language}
                      label={<FormattedMessage id='enterpriseColony.Advanced.mirror_name'/>}
                      className={styles.antd_form}
                    >
                      {getFieldDecorator('domain', {
                        rules: [
                          {
                            required: true,
                            message: formatMessage({id:'enterpriseColony.Advanced.add_mirror'})
                          },
                          {
                            pattern: /^[^\s]*$/,
                            message: formatMessage({id:'placeholder.no_spaces'})
                          }
                        ]
                      })(<Input placeholder={formatMessage({id:'enterpriseColony.Advanced.input_mirror'})} style={{textOverflow: 'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'}}/>)}
                    </FormItem>
                    <FormItem
                      {...is_language}
                      label={<FormattedMessage id='enterpriseColony.Advanced.namespace'/>}
                      className={styles.antd_form}
                    >
                      {getFieldDecorator('namespace',{
                        rules: [
                          {
                            required: true,
                            message: formatMessage({id:'enterpriseColony.Advanced.input_namespace'})
                          },
                          {
                            pattern: /^[^\s]*$/,
                            message: formatMessage({id:'placeholder.no_spaces'})
                          }
                        ]
                      })(
                        <Input placeholder={formatMessage({id:'enterpriseColony.Advanced.input_namespace'})} style={{textOverflow: 'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'}}/>
                      )}
                    </FormItem>
                    <FormItem
                      {...is_language}
                      label={<FormattedMessage id='enterpriseColony.Advanced.user_name'/>}
                      className={styles.antd_form}
                    >
                      {getFieldDecorator('username', {
                        rules: [
                          {
                            required: true,
                            message: formatMessage({id:'enterpriseColony.Advanced.input_user_name'})
                          },
                          {
                            pattern: /^[^\s]*$/,
                            message: formatMessage({id:'placeholder.no_spaces'})
                          }
                        ]
                      })(<Input placeholder= {formatMessage({id:'enterpriseColony.Advanced.input_user_name'})} style={{textOverflow: 'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'}}/>)}
                    </FormItem>
                    <FormItem
                      {...is_language}
                      label={<FormattedMessage id='enterpriseColony.Advanced.password'/>}
                      className={styles.antd_form}
                    >
                      {getFieldDecorator('password', {
                        rules: [
                          {
                            required: true,
                            message: formatMessage({id:'enterpriseColony.Advanced.input_password'})
                          },
                          {
                            pattern: /^[^\s]*$/,
                            message: formatMessage({id:'placeholder.no_spaces'})
                          }
                        ]
                      })(<Input type="password" placeholder= {formatMessage({id:'enterpriseColony.Advanced.input_password'})} style={{textOverflow: 'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'}}/>)}
                    </FormItem>
                  </div>
                ) : (
                  <div className={styles.desc}>
                    <FormattedMessage id='enterpriseColony.Advanced.Not_required_mirror'/>
                  </div>
                )}
              </Row>
            )}
            {/* 构建节点 */}
            <Row className={styles.antd_row}>
              <div className={styles.titleBox}>
                <div className={styles.title}>
                  <span className={language ?  styles.titleSpan : styles.en_titleSpan}><FormattedMessage id='enterpriseColony.Advanced.creat_node'/></span>
                  <CheckableTag
                    checked={node_enabled !== `${formatMessage({id:'enterpriseColony.Advanced.Close'})}` || false}
                    onChange={() => {
                      this.setState(state => {
                        return {
                          ...state,
                          node_enabled:
                            node_enabled === `${formatMessage({id:'enterpriseColony.Advanced.configuration'})}`
                            ? formatMessage({id:'enterpriseColony.Advanced.Close'})
                            : formatMessage({id:'enterpriseColony.Advanced.configuration'})
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
              {node_enabled !== `${formatMessage({id:'enterpriseColony.Advanced.configuration'})}` ? (
                <div className={styles.config}>
                  <FormItem
                    {...is_formItemLayouts_en}
                    label={<FormattedMessage id='enterpriseColony.Advanced.node_name'/>}
                    className={styles.antd_form}
                  >
                    {getFieldDecorator('nodesForChaos', {
                      rules: [
                        {
                          required: true,
                          message: formatMessage({id:'enterpriseColony.Advanced.input_node'})
                        },
                        {
                          validator: this.handleValidatorsNodes
                        }
                      ]
                    })(<Build />)}
                  </FormItem>
                </div>
              ) : (
                <div className={styles.desc}>
                  <FormattedMessage id='enterpriseColony.Advanced.kubernetes'/>
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
                  <FormattedMessage id='button.previous'/>
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
