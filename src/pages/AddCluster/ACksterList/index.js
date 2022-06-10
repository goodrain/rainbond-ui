/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import { Button, Card, Form, Input, Row, Steps } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import router from 'umi/router';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import userUtil from '../../../utils/user';
import DAinput from '../component/node';
import styles from './index.less';

const FormItem = Form.Item;
const { Step } = Steps;

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
  baseConfiguration: region.base_configuration
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
  handleSubmit = e => {
    console.log(e, '打印');
  };
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
      // const {
      //   baseConfiguration: { nodesForGateway }
      // } = this.props;
      // if (
      //   values &&
      //   (!values.nodesForGateway || values.nodesForGateway.length === 0) &&
      //   nodesForGateway &&
      //   nodesForGateway.length > 0
      // ) {
      //   values.nodesForGateway = nodesForGateway;
      //   err = null;
      // }
      if (err) return;
      // 存基本设置数据
      dispatch({
        type: 'region/saveBaseConfiguration',
        payload: values
      });
    });
    // 页面跳转
    if (value === 'advanced') {
      router.push({
        pathname: `/enterprise/${eid}/provider/ACksterList/advanced`
      });
    } else {
      router.push({
        pathname: `/enterprise/${eid}/provider/ACksterList/install`
      });
    }
  };

  render() {
    const {
      match: {
        params: { eid, provider, clusterID }
      },
      form: { getFieldDecorator },
      baseConfiguration: { gatewayIngressIPs }
    } = this.props;
    const formItemLayout = {
      labelCol: {
        xs: { span: 2 },
        sm: { span: 2 }
      },
      wrapperCol: {
        xs: { span: 4 },
        sm: { span: 4 }
      }
    };
    return (
      <PageHeaderLayout
        title="添加集群"
        content="集群是资源的集合，以Kubernetes集群为基础，部署平台Region服务即可成为平台集群资源。"
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
        <Card style={{ padding: '24px' }}>
          <Form onSubmit={this.handleSubmit}>
            <div className={styles.base_configuration}>
              {/* 入口IP */}
              <Row className={styles.antd_row}>
                <div>
                  <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                    入口访问IP
                  </span>
                </div>
                <FormItem
                  {...formItemLayout}
                  // labelCol={{ xs: { span: 6 }, sm: { span: 6 } }}
                  // wrapperCol={{ xs: { span: 16 }, sm: { span: 16 } }}
                  label="IP地址"
                  className={styles.antd_form}
                >
                  {getFieldDecorator('gatewayIngressIPs', {
                    initialValue: gatewayIngressIPs || '',
                    rules: [
                      {
                        required: true,
                        message: '请填写IP地址'
                      }
                      // {
                      //   pattern: /^(?=^.{3,255}$)[a-zA-Z0-9*][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/,
                      //   message: '请填写正确的域名格式，支持泛域名'
                      // }
                    ]
                    // initialValue: editInfo.domain_name
                  })(<Input placeholder="请输入IP地址  例：1.2.3.4" />)}
                </FormItem>
              </Row>
              {/* 网关安装节点 */}
              <Row className={styles.antd_row}>
                <div>
                  <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                    网关安装节点
                  </span>
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
                      }
                      // {
                      //   pattern: /^(?=^.{3,255}$)[a-zA-Z0-9*][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/,
                      //   message: '请填写正确的域名格式，支持泛域名'
                      // }
                    ]
                    // initialValue: editInfo.domain_name
                  })(<DAinput />)}
                </FormItem>
              </Row>
            </div>
            <Row>
              <FormItem className={styles.antd_row_btn}>
                <Button
                  className={styles.antd_btn}
                  type="primary"
                  onClick={() => {
                    this.props.dispatch(
                      routerRedux.push(`/enterprise/${eid}/addCluster`)
                    );
                  }}
                >
                  上一步
                </Button>
                <Button
                  className={styles.antd_btn}
                  type="primary"
                  onClick={() => {
                    this.toLinkNext('advanced');
                  }}
                >
                  高级配置
                </Button>
                <Button
                  className={styles.antd_btn}
                  type="primary"
                  onClick={() => {
                    this.toLinkNext('next');
                  }}
                >
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
