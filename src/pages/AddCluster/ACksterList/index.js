/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import { Card, Form, Row, Steps, item, Input, Button } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import SetRegionConfig from '../../../components/Cluster/SetRegionConfig';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import userUtil from '../../../utils/user';
import DAinput from '../component/node'
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
    handleSubmit = (e) => {
        console.log(e,'打印')
    }
    //高级配置或下一步
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
        }else if(value == 'advanced'){
            dispatch(
                routerRedux.push(`/enterprise/${eid}/provider/ACksterList/advanced`)
            );
        }
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
        return (
            <PageHeaderLayout
                title="添加集群"
                content="集群是资源的集合，以Kubernetes集群为基础，部署平台Region服务即可成为平台集群资源。"
            >
                <Row style={{ marginBottom: '16px' }}>
                    <Steps current={0}>
                        {this.loadSteps().map(item => (
                            <Step key={item.title} title={item.title} />
                        ))}
                    </Steps>
                </Row>
                <Card style={{ padding: '24px' }}>

                    <Form onSubmit={this.handleSubmit}>
                        <Row className={styles.antd_row}>
                            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>网关地址</span>

                            <FormItem
                                {...formItemLayout}
                                label="IP地址"
                                className={styles.antd_form}
                            >

                                {getFieldDecorator('gatewayIngressIPs', {
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
                                })(<Input placeholder="请输入IP地址  例：1.2.3.4" />)}

                            </FormItem>
                        </Row>
                        <Row className={styles.antd_row}>
                            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>网关节点</span>
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
                                })(<DAinput/>)}
                            </FormItem>
                        </Row>
                        <Row >
                        <FormItem className={styles.antd_row_btn}>
                            <Button className={styles.antd_btn} type="primary" onClick={()=>{this.toLinkNext('advanced')}}>
                                高级配置
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
