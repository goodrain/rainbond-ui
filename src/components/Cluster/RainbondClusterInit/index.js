/* eslint-disable react/sort-comp */
import {
  Alert,
  Button,
  Checkbox,
  Col,
  Form,
  Modal,
  notification,
  Typography
} from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import {
  getRainbondClusterConfig,
  setRainbondClusterConfig
} from '../../../services/cloud';
import cloud from '../../../utils/cloud';
import CodeMirrorForm from '../../CodeMirrorForm';
import styles from '../ACKBuyConfig/index.less';
import InitRainbondDetail from '../ShowInitRainbondDetail';

const { Paragraph } = Typography;

@connect()
@Form.create()
export default class RainbondClusterInit extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      checked: false,
      loading: false,
      showInitDetail: false,
      task: null
    };
  }
  componentDidMount() {
    this.loadTask();
  }

  initRainbondCluster = () => {
    const { dispatch, clusterID, selectProvider, eid } = this.props;
    const { checked, task } = this.state;
    if (checked) {
      this.setState({ loading: true });
      dispatch({
        type: 'cloud/initRainbondRegion',
        payload: {
          enterprise_id: eid,
          providerName: selectProvider,
          clusterID,
          retry: task && task.status === 'complete'
        },
        callback: data => {
          if (data) {
            this.setState({
              loading: false,
              task: data,
              showInitDetail: true
            });
          }
        },
        handleError: res => {
          if (res && res.data && res.data.code === 7005) {
            this.setState({
              loading: false,
              showInitDetail: true,
              task: res.data.data
            });
            return;
          }
          cloud.handleCloudAPIError(res);
        }
      });
    } else {
      notification.warning('请阅读并同意注意事项');
    }
  };

  loadTask = noopen => {
    const {
      dispatch,
      eid,
      clusterID,
      selectProvider,
      completeInit
    } = this.props;
    dispatch({
      type: 'cloud/loadInitRainbondTask',
      payload: {
        enterprise_id: eid,
        clusterID,
        providerName: selectProvider
      },
      callback: data => {
        if (data) {
          this.setState({ task: data });
          if (data.status === 'inited') {
            if (completeInit) {
              completeInit(data);
            }
          } else if (data.status === 'complete') {
            // init failure
          } else if (!noopen) {
            this.setState({ showInitDetail: true });
          }
        }
      },
      handleError: res => {
        if (res && res.data && res.data.code === 404) {
          return;
        }
        cloud.handleCloudAPIError(res);
        this.setState({ loading: false });
      }
    });
  };

  cancelShowInitDetail = () => {
    this.setState({ showInitDetail: false });
    this.loadTask(true);
  };

  setChecked = val => {
    this.setState({ checked: val.target.checked });
  };
  showSetRainbondCluster = () => {
    const { eid, clusterID } = this.props;
    getRainbondClusterConfig({ enterprise_id: eid, clusterID }, res => {
      if (res && res.data && res.data.code === 404) {
        return;
      }
      cloud.handleCloudAPIError(res);
    }).then(re => {
      this.setState({ showClusterInitConfig: true, initconfig: re.config });
    });
  };
  handleSubmit = () => {
    const { form, eid, clusterID } = this.props;
    form.validateFields((err, values) => {
      if (!err) {
        setRainbondClusterConfig(
          { enterprise_id: eid, clusterID, config: values.config },
          res => {
            if (res && res.data && res.data.code === 404) {
              return;
            }
            cloud.handleCloudAPIError(res);
          }
        ).then(re => {
          if (re && re.status_code === 200) {
            notification.success({ message: '设置成功' });
            this.setState({ showClusterInitConfig: false });
          }
        });
      }
    });
  };
  render() {
    const { preStep, eid, selectProvider, form } = this.props;
    const {
      checked,
      showInitDetail,
      loading,
      task,
      showClusterInitConfig,
      initconfig
    } = this.state;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 }
      },
      wrapperCol: {
        xs: { span: 24 }
      }
    };
    const { getFieldDecorator, setFieldsValue } = form;
    return (
      <Form>
        <h4>注意事项：</h4>
        <Col span={24} style={{ padding: '16px' }}>
          {selectProvider === 'ack' && (
            <Paragraph className={styles.describe}>
              <ul>
                <li>
                  <span>
                    若你选择的是已经在使用的Kubernetes集群，不要担心，接下来的初始化动作不会影响集群已有的业务形态。
                  </span>
                </li>
                <li>
                  <span>
                    平台集群初始化需要以下资源：RDS(1个)、NAS(1个)、SLB(1个)，并将(80、443、8443、6060、10000-11000)端口添加到安全组策略。
                  </span>
                </li>
                <li>
                  <span>
                    新购资源都将采用按需后付费模式，因此请确保你的阿里云账号能够进行按需购买资源，后续用户根据需要进行付费模式变更
                  </span>
                </li>
                <li>
                  <span>
                    我们将通过KubeAPI进行相关的资源创建和初始化，集群对接完成后即可关闭KubeAPI的公网访问（移除绑定的EIP）
                  </span>
                </li>
              </ul>
            </Paragraph>
          )}
          {(selectProvider === 'rke' || selectProvider === 'custom') && (
            <Paragraph className={styles.describe}>
              <ul>
                <li>
                  <span>
                    若你选择的是已经在使用的 Kubernetes
                    集群，不要担心，接下来的初始化动作不会影响集群已有的业务形态。
                  </span>
                </li>
                <li>
                  <span>
                    平台
                    集群初始化时默认采用第1、2个节点为网关节点和构建节点，你也可以在Kubernetes节点上增加Annotations来指定对应节点(rainbond.io/gateway-node=true
                    或rainbond.io/chaos-node=true)。
                  </span>
                </li>
                <li>
                  <span>
                    网关节点以下端口必须空闲：80, 443, 6060, 7070, 8443, 10254,
                    18080, 18081，否则将导致初始化失败
                  </span>
                </li>
                <li>
                  <span>如果集群节点数量大于3将默认安装高可用模式。</span>
                </li>
                <li>
                  <span>
                    安装过程中需要访问网关节点6443、8443、6060端口，请确保相关端口可被访问。
                  </span>
                </li>
                <li>
                  <span>
                    若您希望自定义集群初始化参数{' '}
                    <a
                      onClick={() => {
                        this.showSetRainbondCluster();
                      }}
                    >
                      点击这里
                    </a>
                  </span>
                </li>
              </ul>
            </Paragraph>
          )}
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox onChange={this.setChecked}>
              我已阅读并已清楚认识上述注意事项
            </Checkbox>
          </Form.Item>
        </Col>

        {task && task.status !== 'complete' ? (
          <Col style={{ textAlign: 'center', marginTop: '32px' }} span={24}>
            <Button onClick={preStep} style={{ marginRight: '16px' }}>
              上一步
            </Button>
            <Button
              onClick={() => {
                this.setState({ showInitDetail: true });
              }}
              type="primary"
            >
              正在初始化/确认进度
            </Button>
          </Col>
        ) : (
          <Col style={{ textAlign: 'center', marginTop: '32px' }} span={24}>
            <Button onClick={preStep} style={{ marginRight: '16px' }}>
              上一步
            </Button>
            <Button
              disabled={!checked}
              loading={loading}
              onClick={this.initRainbondCluster}
              type="primary"
            >
              {task ? '重新初始化' : '开始初始化'}
            </Button>
          </Col>
        )}
        {showInitDetail && task && (
          <InitRainbondDetail
            onCancel={this.cancelShowInitDetail}
            eid={eid}
            providerName={selectProvider}
            clusterID={task.clusterID}
            taskID={task.taskID}
          />
        )}
        {showClusterInitConfig && (
          <Modal
            visible
            title="设置集群初始化配置"
            onOk={this.handleSubmit}
            width={800}
            confirmLoading={loading}
            onCancel={() => {
              this.setState({ showClusterInitConfig: false });
            }}
          >
            <Alert
              message="请注意，默认数据仅作为示例，各字段若需要使用默认值则不要配置该字段。"
              type="warning"
              style={{ marginBottom: '16px' }}
            />
            <CodeMirrorForm
              titles="集群初始化配置包含平台集群的初始化的全部配置"
              setFieldsValue={setFieldsValue}
              formItemLayout={formItemLayout}
              Form={Form}
              getFieldDecorator={getFieldDecorator}
              mode="yaml"
              name="config"
              data={initconfig}
              label="集群初始化配置"
              message="集群初始化配置配置是必需的"
              width="750px"
            />
          </Modal>
        )}
      </Form>
    );
  }
}
