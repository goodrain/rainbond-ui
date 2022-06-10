/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import { Card, Form, Row, Steps, item, Input, Button, Alert, Col, notification, Spin } from 'antd';
import { CopyOutlined } from '@ant-design/icons'
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import copy from 'copy-to-clipboard';
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
            adminer,
            commandFlag:true
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
        this.helmToken()
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
    toLinkNext = (value) => {
        const { dispatch } = this.props;
        const {
            match: {
                params: { eid }
            }
        } = this.props;
        if (value == 'next') {
            dispatch(
                routerRedux.push(`/enterprise/${eid}/provider/ACksterList/result`)
            );
        } else if (value == 'goback') {
            dispatch(
                routerRedux.push(`/enterprise/${eid}/provider/ACksterList/advanced`)
            );
        }

    }
    helmToken = () => {
        const { dispatch } = this.props
        const {
            match: {
                params: { eid }
            }
        } = this.props;
        const domain = window.location.host;
        dispatch({
        type: 'region/fetchHelmToken',
        callback: res => {
            if(res.status_code == 200){
                dispatch({
                    type:'region/fetchHelmCommand',
                    payload:{
                        eid: eid,
                        domain: domain,
                        token: res.bean,
                        data: data
                    },
                    callback: (res)=>{
                        console.log(res,'res')
                        // const resArr = res.data.command.split(' & ')
                        // const resArrCopy = resArr.join('\n ')
                        // this.setState({
                        //     command: res.data.command,
                        //     resCommand: resArr,
                        //     copyCommand: resArrCopy,
                        //     btnFlog: true,
                        //     btnLoading: false,
                        //     btnFlag:false,
                            
                        // })
                    }
                })
            }
        }})
    }
    onCopy = ()=>{
        copy('你好不好')
        notification.success({
            message: '复制成功'
        });
    }
    render() {
        const {
            match: {
                params: { eid, provider, clusterID }
            }
        } = this.props;
        const { commandFlag } = this.state
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
        return (
            <PageHeaderLayout
                title="添加集群"
                content="集群是资源的集合，以Kubernetes集群为基础，部署平台Region服务即可成为平台集群资源。"
            >
                <Row style={{ marginBottom: '16px' }}>
                    <Steps current={2}>
                        {this.loadSteps().map(item => (
                            <Step key={item.title} title={item.title} />
                        ))}
                    </Steps>
                </Row>
                <Card style={{ padding: '24px' }}>
                    {!commandFlag && <Spin tip="Loading..."><div className={styles.commandBox}> </div></Spin>}
                    {commandFlag && 
                        <div className={styles.commandBox}> 
                            <div className={styles.commandIcon}><CopyOutlined  onClick={this.onCopy}/></div>
                            <div className={styles.command}>
                                <span className={styles.commandSpan}>kubectl create namespace rbd-system</span>
                                <span className={styles.commandSpan}>helm repo add rainbond https://openchart.goodrain.com/goodrain/rainbond</span>
                                <span className={styles.commandSpan}>helm repo update</span>
                                <span className={styles.commandSpan}>helm install --set Cluster.gatewayIngressIPs=1.1.1.1 --set Cluster.enableHA=false --set Cluster.imageHub.enable=true --set Cluster.imageHub.domain=www.insteate.cn --set</span>
                                <span className={styles.commandSpan}>Cluster.imageHub.namespace=songyg --set Cluster.imageHub.username=songyg --set Cluster.imageHub.password=769632 --set Cluster.etcd.enable=true --set</span>
                                <span className={styles.commandSpan}>Cluster.etcd.endpoints[0]=etcd0 --set Cluster.etcd.secretName=rbd-etcd --set Cluster.RWX.enable=true --set Cluster.RWX.config.storageClassName=rainbondsslc --set</span>
                                <span className={styles.commandSpan}>Cluster.RWO.enable=true --set Cluster.RWO.storageClassName=rainbondsslc --set Cluster.uiDatabase.host=127.0.0.1 --set Cluster.uiDatabase.port=3307 --set</span>
                                <span className={styles.commandSpan}>Cluster.uiDatabase.username=1.1.1.1 --set Cluster.uiDatabase.password=123456 --set Cluster.uiDatabase.dbname=console --set Cluster.uiDatabase.enable=true --set</span>
                                <span className={styles.commandSpan}>Cluster.regionDatabase.host=127.0.0.1 --set Cluster.regionDatabase.port=3308 --set Cluster.regionDatabase.username=1.1.1.1 --set Cluster.regionDatabase.password=654321 --set</span>
                                <span className={styles.commandSpan}>Cluster.regionDatabase.dbname=region --set Cluster.regionDatabase.enable=true --set Cluster.nodesForChaos[0].name=kkk --set Cluster.nodesForGateway[0].name=gateway1 --set Cluster.nodesForGateway[0].externalIP=192.1.1.1 --set Cluster.nodesForGateway[0].internalIP=10.0.0.1 rainbond rainbond/rainbond-cluster -n rbd-system</span>
                            </div>
                        </div>
                    }
                    <Row style={{marginBottom:'10px'}}>
                        <Col span={24}>
                            <Alert
                                style={{fontSize:'16px',fontWeight:'bolder'}}
                                type="info"
                                message="复制命令去服务器执行，服务器执行完成，点击 “下一步”。"
                            />
                        </Col>
                    </Row>
                    <Row >
                        <div className={styles.antd_row_btn}>
                            <Button className={styles.antd_btn} type="primary" onClick={() => this.toLinkNext('goback')}>
                                上一步
                            </Button>
                            <Button className={styles.antd_btn} type="primary" onClick={() => this.toLinkNext('next')}>
                                下一步
                            </Button>

                        </div>
                    </Row>
                </Card>
            </PageHeaderLayout>
        );
    }
}
