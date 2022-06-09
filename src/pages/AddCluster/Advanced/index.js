/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import { Card, Form, Row, Steps, item, Input, Button, Switch } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import SetRegionConfig from '../../../components/Cluster/SetRegionConfig';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import userUtil from '../../../utils/user';
import Etcd from '../component/etcd'
import Build from '../component/build'
import styles from './index.less'
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
            etcd: false,
            storage: false,
            database: false,
            build: false,
            gateway: false,
            repositories:false
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
    handleSubmit = () => {

    }
    toLinkNext = (value) => {
        const { dispatch } = this.props;
        const {
            match: {
            params: { eid }
            }
        } = this.props;
        if(value == 'next'){
            dispatch(
              routerRedux.push(`/enterprise/${eid}/provider/ACksterList/install`)
            );
        }else if (value == 'goback'){
            dispatch(
                routerRedux.push(`/enterprise/${eid}/provider/ACksterList`)
            );
        }
    }
    onEtcd = (e)=>{
        this.setState({
            etcd:e
        })
    }
    onStorage = (e)=>{
        this.setState({
            etcd:e
        })
    }
    onDatabase = (e)=>{
        this.setState({
            etcd:e
        })
    }
    onEtcd = (e)=>{
        this.setState({
            etcd:e
        })
    }
    onEtcd = (e)=>{
        this.setState({
            etcd:e
        })
    }
    render() {
        const {
            match: {
                params: { eid, provider, clusterID }
            }
        } = this.props;

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
                xs: { span: 5 },
                sm: { span: 5 }
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
                        <Row className={styles.antd_row}>
                            <div className={styles.titleBox}>
                            <span className={styles.titleSpan}>Etcd</span>
                            <Switch
                                onClick={this.onEtcd}
                                style={{marginLeft:'5px'}}
                                checkedChildren='开'
                                unCheckedChildren='关'
                            />
                            </div>
                            
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
                                        },
                                        {
                                            pattern: /^(?=^.{3,255}$)[a-zA-Z0-9*][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/,
                                            message: '请填写正确的域名格式，支持泛域名'
                                        }
                                    ],
                                    // initialValue: editInfo.domain_name
                                })(<Etcd/>)}
                            </FormItem>
                            <FormItem
                                {...formItemLayout}
                                label="secret名称"
                            >
                                {getFieldDecorator('secretName', {
                                    rules: [
                                        {
                                            required: true,
                                            message: ''
                                        },
                                        {
                                            pattern: /^(?=^.{3,255}$)[a-zA-Z0-9*][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/,
                                            message: '请填写正确的域名格式，支持泛域名'
                                        }
                                    ],
                                    // initialValue: editInfo.domain_name
                                })(<Input placeholder="请输入secret名称  例：rbd-etcd-secret"/>)}
                            </FormItem>
                        </Row>
                        <Row className={styles.antd_row}>
                            <div className={styles.titleBox}>
                            <span className={styles.titleSpan}>存储</span>
                            <Switch
                                onClick={this.onStorage}
                                style={{marginLeft:'5px'}}
                                checkedChildren='开'
                                unCheckedChildren='关'
                                defaultChecked
                            />
                            </div>
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
                                        },
                                        {
                                            pattern: /^(?=^.{3,255}$)[a-zA-Z0-9*][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/,
                                            message: '请填写正确的域名格式，支持泛域名'
                                        }
                                    ],
                                    // initialValue: editInfo.domain_name
                                })(<Input placeholder='请输入存储名称  例：glusterfs-simple'/>)}
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
                                        },
                                        {
                                            pattern: /^(?=^.{3,255}$)[a-zA-Z0-9*][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/,
                                            message: '请填写正确的域名格式，支持泛域名'
                                        }
                                    ],
                                    // initialValue: editInfo.domain_name
                                })(<Input placeholder='请输入存储名称  例：glusterfs-simple'/>)}
                            </FormItem>
                        </Row>
                        <Row className={styles.antd_row}>
                            <div className={styles.titleBox}>
                                <span className={styles.titleSpan}>数据库</span>
                                <Switch
                                    onClick={this.onDatabase}
                                    style={{marginLeft:'5px'}}
                                    checkedChildren='开'
                                    unCheckedChildren='关'
                                    defaultChecked
                                />
                            </div>
                            <FormItem
                                {...formItemLayout}
                                label="节点配置"
                                className={styles.antd_form}
                            >
                                {getFieldDecorator('nodesForGateway', {
                                    rules: [
                                        {
                                            required: true,
                                            message: '请添加域名'
                                        },
                                        {
                                            pattern: /^(?=^.{3,255}$)[a-zA-Z0-9*][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/,
                                            message: '请填写正确的域名格式，支持泛域名'
                                        }
                                    ],
                                    // initialValue: editInfo.domain_name
                                })(<Input placeholder='请输入存储名称  例：glusterfs-simple'/>)}
                            </FormItem>
                        </Row>
                        <Row className={styles.antd_row}>
                            <div className={styles.titleBox}>
                            <span className={styles.titleSpan}>镜像仓库</span>
                            <Switch
                                style={{marginLeft:'5px'}}
                                checkedChildren='开'
                                unCheckedChildren='关'
                                defaultChecked
                            />
                            </div>
                            <FormItem
                                {...formItemLayout}
                                label="镜像仓库域名"
                                className={styles.antd_form}
                            >
                                {getFieldDecorator('nodesForGateway', {
                                    rules: [
                                        {
                                            required: true,
                                            message: '请添加域名'
                                        },
                                        {
                                            pattern: /^(?=^.{3,255}$)[a-zA-Z0-9*][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/,
                                            message: '请填写正确的域名格式，支持泛域名'
                                        }
                                    ],
                                    // initialValue: editInfo.domain_name
                                })(<Input placeholder='请输入镜像仓库域名'/>)}
                            </FormItem>
                            <FormItem
                                {...formItemLayout}
                                label="命名空间"
                                className={styles.antd_form}
                            >
                                {getFieldDecorator('nodesForGateway', {
                                    // initialValue: editInfo.domain_name
                                })(<Input placeholder='请输入命名空间'/>)}
                            </FormItem>
                            <FormItem
                                {...formItemLayout}
                                label="用户名"
                                className={styles.antd_form}
                            >
                                {getFieldDecorator('nodesForGateway', {
                                    rules: [
                                        {
                                            required: true,
                                            message: '请输入用户名'
                                        }
                                    ],
                                    // initialValue: editInfo.domain_name
                                })(<Input placeholder='请输入存储名称  例：glusterfs-simple'/>)}
                            </FormItem>
                            <FormItem
                                {...formItemLayout}
                                label="密码"
                                className={styles.antd_form}
                            >
                                {getFieldDecorator('nodesForGateway', {
                                    rules: [
                                        {
                                            required: true,
                                            message: '请输入密码'
                                        }
                                    ],
                                    // initialValue: editInfo.domain_name
                                })(<Input placeholder='请输入密码'/>)}
                            </FormItem>
                        </Row>
                        <Row className={styles.antd_row}>
                            <div className={styles.titleBox}>
                            <span className={styles.titleSpan}>构建节点</span>
                            <Switch
                                style={{marginLeft:'5px'}}
                                checkedChildren='开'
                                unCheckedChildren='关'
                                defaultChecked
                            />
                            </div>
                            <FormItem
                                {...formItemLayout}
                                label="节点名称"
                                className={styles.antd_form}
                            >
                                {getFieldDecorator('nodesForChaos', {
                                    rules: [
                                        {
                                            required: true,
                                            message: '请添加域名'
                                        },
                                        {
                                            pattern: /^(?=^.{3,255}$)[a-zA-Z0-9*][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/,
                                            message: '请填写正确的域名格式，支持泛域名'
                                        }
                                    ],
                                    // initialValue: editInfo.domain_name
                                })(<Build/>)}
                            </FormItem>
                        </Row>
                        <Row >
                        <FormItem className={styles.antd_row_btn}>
                            <Button className={styles.antd_btn} type="primary" onClick={()=>{this.toLinkNext('goback')}}>
                                上一步
                            </Button>
                            <Button className={styles.antd_btn} type="primary" onClick={()=>{this.toLinkNext('next')}}>
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
