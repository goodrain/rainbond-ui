/* eslint-disable no-param-reassign */
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable react/self-closing-comp */
/* eslint-disable camelcase */
import {
    Button,
    Checkbox,
    Col,
    Divider,
    Drawer,
    Form,
    Icon,
    Input,
    InputNumber,
    Modal,
    Row,
    Select,
    Skeleton,
    Spin,
    Collapse,
    Switch,
    Radio,
    notification
  } from 'antd';
  import { connect } from 'dva';
  import React, { Fragment, PureComponent } from 'react';
  import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
  import globalUtil from '../../utils/global';
  import cookie from '../../utils/cookie';
  import rainbondUtil from '../../utils/rainbond';
  import teamUtil from '../../utils/team';
  import DAHosts from '../DAHosts';
  import userUtil from '../../utils/user';
  import styles from './index.less';
  import Parameterinput from '../Parameterinput';
  
  const FormItem = Form.Item;
  const { Option, OptGroup } = Select;
  const { Panel } = Collapse;
  
  @connect(({ user, loading, global }) => ({
    currUser: user.currentUser,
    enterprise: global.enterprise,
    addHttpStrategyLoading: loading.effects['gateWay/addHttpStrategy'],
    editHttpStrategyLoading: loading.effects['gateWay/editHttpStrategy']
  }))
  class DrawerForm extends PureComponent {
    constructor(props) {
      super(props);
      const { editInfo } = this.props;
  
      this.state = {
        componentLoading: false,
        portLoading: false,
        serviceComponentList: [],
        serviceComponentLoading: true,
        portList: [],
        licenseList: [],
        isAddLicense: false,
        page: 1,
        page_size: 99999,
        group_name: '',
        is_httptohttps: true,
        descriptionVisible: false,
        rule_extensions_visible: false,
        is_httptohttps: true,
        automaticCertificateVisible: (editInfo && editInfo.auto_ssl) || false,
        isPerform: true,
        rewrite: false,
        routingConfiguration: !!(
          props.editInfo &&
          (props.editInfo.domain_heander ||
            props.editInfo.domain_cookie ||
            props.editInfo.path_rewrite ||
            (props.editInfo.rewrites && props.editInfo.rewrites.length > 0) ||
            props.editInfo.certificate_id)
        ),
        WebSocket: !!(editInfo && editInfo.value && editInfo.value.WebSocket),
        proxyBuffering: !!(
          props.editInfo &&
          props.editInfo.value &&
          props.editInfo.value.proxy_buffering &&
          props.editInfo.value.proxy_buffering === 'on'
        ),
        webSockets: [
          { item_key: 'Connection', item_value: 'Upgrade' },
          { item_key: 'Upgrade', item_value: '$http_upgrade' }
        ],
        language: cookie.get('language') === 'zh-CN' ? true : false,
        gateWayArr: [],
        GateWayIpList: [],
      };
    }
  
    componentDidMount(){
      this.handleBatchGateWay()
    }
  
    componentWillMount() {
    //   this.heandleEditInfo(this.props);
    }


  
    addLicense = () => {
      this.setState(
        {
          page_size: this.state.page_size + 10
        },
        () => {
          this.heandleEditInfo(this.props);
        }
      );
    };
    handleOk = () => {
      const { onOk, form } = this.props;
      form.validateFields((err, values) => {
        if (!err && onOk) {
        //   onOk();
        }
      });
    };

    // 获取 gateway 下拉列表
    handleBatchGateWay = () => {
      const { dispatch, currUser } = this.props
      const regionName = globalUtil.getCurrRegionName()
      dispatch({
        type: 'gateWay/getBatchGateWay',
        payload: {
          enterprise_id: currUser.enterprise_id,
          region_name: regionName
        },
        callback: res => {
          this.setState({
            gateWayArr: res.list
          },()=>{
                const { gateWayArr }  = this.state
                this.handleGateWay(gateWayArr[0].name, gateWayArr[0].namespace)
          })
        }
      })
    }
    // 获取 GateWay ip 地址
    handleGateWay = (name,namespace) => {
        const { dispatch, currUser } = this.props
        const regionName = globalUtil.getCurrRegionName()
        dispatch({
          type: 'gateWay/getGateWay',
          payload: {
            enterprise_id: currUser.enterprise_id,
            region_name: regionName,
            name,
            namespace,
          },
          callback: res => {
              if(res){
                  const ipList = []
                  if(res.bean.load_balancer_ip){
                    res.bean.load_balancer_ip.map((item)=>{
                        return ipList.push(item)
                    })
                  }
                  if(res.bean.node_port_ip){
                    res.bean.node_port_ip.map((item)=>{
                        return ipList.push(item)
                    })
                  }
                this.setState({
                    GateWayIpList: ipList
                })
            }
          }
        })
    }

    handleCkeckName = (value, callbacks) => {
        const { dispatch, appID } = this.props
        dispatch({
            type: 'gateWay/queryDetailGateWayApi',
            payload: {
              team_name: globalUtil.getCurrTeamName(),
              app_id: appID || '',
              name: value,
              check: 'check'
            },
            callback: data => {
              if (data.bean && data.bean.exist) {
                callbacks('名称已存在');
                notification.warning({
                    message: '名称已存在'
                });
              }
            }
        });
        callbacks();
    };


    handleGateWayIp = (value) => {
        console.log(value,'value')
        const name = value.name
        const namespace = value.namespace
        this.handleGateWay(name, namespace)
    }
    render() {
      const {
        onClose,
        enterprise,
        groups,
        editInfo,
        addHttpStrategyLoading,
        editHttpStrategyLoading
      } = this.props;
      const { getFieldDecorator } = this.props.form;
      const formItemLayout = {
        labelCol: {
          xs: { span: 6 },
          sm: { span: 6 }
        },
        wrapperCol: {
          xs: { span: 18 },
          sm: { span: 18 }
        }
      };
      const formItemLayouts = {
        labelCol: {
          xs: { span: 7 },
          sm: { span: 7 }
        },
        wrapperCol: {
          xs: { span: 17 },
          sm: { span: 17 }
        }
      };
      const zh_formItemLayouts = {
        labelCol: {
          xs: { span: 7 },
          sm: { span: 7 }
        },
        wrapperCol: {
          xs: { span: 17 },
          sm: { span: 17 }
        }
      };
      const en_formItemLayouts = {
        labelCol: {
          xs: { span: 10},
          sm: { span: 10}
        },
        wrapperCol: {
          xs: { span: 14 },
          sm: { span: 14 }
        },
      };
     
      const {
        language,
        gateWayArr,
        GateWayIpList
      } = this.state;
      const is_languages = language ? zh_formItemLayouts : en_formItemLayouts
      const is_language = language ? formItemLayout : formItemLayouts
      return (
        <div>
          <Drawer
            title={editInfo ? '编辑 GateWayAPI' : '添加 GateWayAPI'}
            placement="right"
            width={500}
            closable={false}
            onClose={onClose}
            visible={this.props.visible}
            maskClosable={false}
            style={{
              overflow: 'auto'
            }}
          >
            <Form>
                <FormItem
                    {...formItemLayout}
                    label='名称'
                    className={styles.antd_form}
                >
                    {getFieldDecorator('name', {
                    validateTrigger: 'onBlur',
                    rules: [
                        {
                            required: true,
                            message: formatMessage({id:'placeholder.addDomain'})
                        },
                        {
                            validator: (_, value, callback)=>{
                                this.handleCkeckName(value, callback)
                            }
                        }
                        
                    ],
                    initialValue: editInfo.name
                    })(<Input placeholder={formatMessage({id:'placeholder.addDomain'})} />)}
                </FormItem>
                <FormItem {...formItemLayout} label='域名'>
                    {getFieldDecorator('hosts', {
                    rules: [
                        {
                        required: false,
                        message: '/'
                        },
                        { max: 1024, message: formatMessage({id:'placeholder.max1024'}) },
                        {
                        pattern: /^\/+.*/,
                        message: formatMessage({id:'placeholder.path.absolute'})
                        }
                    ],
                    initialValue: editInfo.hosts
                    })(<DAHosts />)}
                </FormItem>
                <Form.Item {...is_language} label='GateWay'>
                    {getFieldDecorator('gateway_class_name', {
                    initialValue: gateWayArr.length > 0 ? gateWayArr[0].name : null,
                    rules: [{ required: true, message: formatMessage({id: 'placeholder.select'}) }]
                    })(
                    <Select
                        getPopupContainer={triggerNode => triggerNode.parentNode}
                        placeholder={formatMessage({id: 'placeholder.appName'})}
                    >
                        {(gateWayArr || []).map(item => {
                            return (
                                <Option onClick={()=>{this.handleGateWayIp(item)}} key={item.name} value={item.name}>
                                    {item.name}
                                </Option>
                            )
                        })}
                    </Select>
                    )}
                    {GateWayIpList.length > 0 && GateWayIpList.map((item)=>{
                        return (
                            <div style={{display: 'flex', justifyContent: 'start'}}>
                                <span style={{ width: '40%', fontWeight: 'bold', fontSize: '16px', color:'red' }}>
                                    {item}
                                </span>
                            </div>
                        )
                    })}
                </Form.Item>
            </Form>
  
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                width: '100%',
                borderTop: '1px solid #e8e8e8',
                padding: '10px 16px',
                textAlign: 'right',
                left: 0,
                background: '#fff',
                borderRadius: '0 0 4px 4px',
                zIndex: 9999
              }}
            >
              <Button
                style={{
                  marginRight: 8
                }}
                onClick={onClose}
              >
                {formatMessage({id:'popover.cancel'})}
              </Button>
              <Button
                onClick={() => {
                    this.handleOk();
                }}
                type="primary"
                loading={addHttpStrategyLoading || editHttpStrategyLoading}
              >
                {formatMessage({id:'popover.confirm'})}
              </Button>
            </div>
          </Drawer>
        </div>
      );
    }
  }
  const drawerForm = Form.create()(DrawerForm);
  export default drawerForm;
  