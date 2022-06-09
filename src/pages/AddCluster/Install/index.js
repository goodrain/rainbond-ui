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
    handleSubmit = () => {
        console.log('打印')
    }
    toLinkNext = () => {
        const { dispatch } = this.props;
        const {
            match: {
                params: { eid }
            }
        } = this.props;
        dispatch(
            routerRedux.push(`/enterprise/${eid}/provider/ACksterList/result`)
        );
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
                    <div className={styles.commandBox}>
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
                    <Row >
                        <div className={styles.antd_row_btn}>
                            <Button className={styles.antd_btn} type="primary" onClick={this.toLinkNext}>
                                查询进度
                            </Button>
                            <Button className={styles.antd_btn} type="primary">
                                复制
                            </Button>
                        </div>
                    </Row>
                </Card>
            </PageHeaderLayout>
        );
    }
}
