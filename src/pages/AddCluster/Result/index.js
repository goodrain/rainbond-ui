/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import { Card, Form, Row, Steps, item, Input, Button, Progress } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import SetRegionConfig from '../../../components/Cluster/SetRegionConfig';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import userUtil from '../../../utils/user';
import DAinput from '../component/node'
import Result from '../../../components/Result';
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
            status: 'failure'
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
    toLinkNext = (value) => {
        const { dispatch } = this.props;
        const {
            match: {
                params: { eid }
            }
        } = this.props;
        if (value == 'next') {

            dispatch(
                routerRedux.push(`/enterprise/${eid}/provider/HuaweiList`)
            );
        } else {

        }
    }
    renderBody = () => {
        const {  status  } = this.state;
        let type = '';
        let title = '';
        let desc = '';
        let actions = [];
        if (status === 'success') {
          type = 'success';
          title = '应用同步成功';
          desc = '';
          actions = [
            <Button  className={styles.antd_btn}  type="primary">
              完成
            </Button>
          ];
        }
        if (status === 'failure') {
            type = 'error';
            desc = '请查看以下日志确认问题后重试';
            actions = [
              <Button  className={styles.antd_btn} type="primary">
                  上一步
              </Button>,
              <Button  className={styles.antd_btn} type="primary">
                  刷新进度
              </Button>
            ];
        }
        // if (status === 'checking') {
        //   type = 'ing';
        //   title = '集群对接中';
        //   desc = '此过程可能比较耗时，请耐心等待';
        //   actions = [
        //     <Button  className={styles.antd_btn} type="primary">
        //         上一步
        //     </Button>,
        //     <Button  className={styles.antd_btn} type="primary">
        //         刷新进度
        //     </Button>
        //   ];
        // }
        
        return (
          <Result
            className={styles.lists}
            type={type}
            title={title}
            actions={actions}
            description={
              <div>
                {desc}
              </div>
            }
          />
        );
    };
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
                    <Steps current={3}>
                        {this.loadSteps().map(item => (
                            <Step key={item.title} title={item.title} />
                        ))}
                    </Steps>
                </Row>
                <Card style={{ padding: '24px' }}>
                    <Card bordered={false}>{this.renderBody()}</Card>
                    {/* <div className={styles.antd_row_btn}>
                        <Button className={styles.antd_btn} type="primary" onClick={() => { this.toLinkNext('advanced') }}>
                            查询进度
                        </Button>
                        <Button className={styles.antd_btn} type="primary" onClick={() => { this.toLinkNext('next') }}>
                            跳转集群
                        </Button>
                    </div> */}
                </Card>
            </PageHeaderLayout>
        );
    }
}
