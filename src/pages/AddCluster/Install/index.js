/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import { Card, Form, Row, Steps, item, Input, Button, Alert, Col, notification, Spin } from 'antd';
import { CopyOutlined } from '@ant-design/icons'
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import router from 'umi/router';
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
            commandFlag:false,
            resCommand:[],
            copyCommand:'',
            helmToken:''
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
        const name = this.props.location.params.name
        if(name == 'one' || name == 'two'){
            const data = this.props.location.params.data
            this.helmToken(data)
        }else if( name == 'four'){
            const data = this.props.location.params.data
            const resArrCopy = this.props.location.params.copy
            const routerParams = this.props.location.params.token
            this.setState({
                resCommand: data,
                copyCommand: resArrCopy,
                commandFlag: true,
                helmToken:routerParams
            })
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
    toLinkNext = (value) => {
        const { dispatch } = this.props;
        const {
            match: {
                params: { eid }
            }
        } = this.props;
        const { helmToken, resCommand, resArrCopy, backToken } = this.state
        const routerParams = this.props.location.params.name
        console.log(routerParams,'routerParams')
        if (value == 'next') {
            router.push({
                pathname: `/enterprise/${eid}/provider/ACksterList/result`,
                params:{ token: helmToken, data: resCommand, copy: resArrCopy}
            });
        } else if (value == 'goback') {
            if(routerParams == 'one'){
                dispatch(
                    routerRedux.push(`/enterprise/${eid}/provider/ACksterList`)
                );
            }else if(routerParams == 'two'){
                dispatch(
                    routerRedux.push(`/enterprise/${eid}/provider/ACksterList/advanced`)
                );
            }else{
                dispatch(
                    routerRedux.push(`/enterprise/${eid}/provider/ACksterList`)
                );
            }
            
        }

    }
    helmToken = (data) => {
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
                this.setState({
                    helmToken: res.bean
                })
                dispatch({
                    type:'region/fetchHelmCommand',
                    payload:{
                        eid: 'f0a3efe26ebff6e2a87b176fbd3256ec',
                        domain: 'http://5000.gr5b266d.2c9v614j.17f4cc.grapps.cn',
                        token: res.bean,
                        data: data
                    },
                    callback: (res)=>{
                        console.log(res,'res')
                        const resArr = res.response_data.command.split(' & ')
                        const resArrCopy = resArr.join('\n ')
                        console.log(resArrCopy,'resArrCopy')
                        this.setState({
                            resCommand: resArr,
                            copyCommand: resArrCopy,
                            commandFlag: true
                        })
                    }
                })
            }
        }})
    }
    onCopy = ()=>{
        const { copyCommand } = this.state
        copy(copyCommand)
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
        const { commandFlag, resCommand } = this.state
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
                    { commandFlag && 
                        <div className={styles.commandBox}> 
                            <div className={styles.commandIcon}><CopyOutlined  onClick={this.onCopy}/></div>
                            <div className={styles.command}>
                                {resCommand.length > 0 && resCommand.map((item, index) => {
                                    return (
                                        <span key={index} className={styles.commandSpan}>
                                            {item}
                                        </span>
                                    )
                                })}
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
