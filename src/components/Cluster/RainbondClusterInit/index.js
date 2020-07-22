import { Button, Checkbox, Col, Form, notification, Typography } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import cloud from '../../../utils/cloud';
import styles from '../ACKBuyConfig/index.less';
import InitRainbondDetail from '../ShowInitRainbondDetail';
const { Paragraph } = Typography;

@connect()
export default class RainbondClusterInit extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      checked: false,
      loading: false,
      showInitDetail: false,
    };
  }
  componentDidMount() {
    this.loadTask();
  }

  initRainbondCluster = () => {
    const { dispatch, selectClusterID, selectProvider, eid } = this.props;
    const { checked } = this.state;
    if (checked) {
      this.setState({ loading: true });
      dispatch({
        type: 'cloud/initRainbondRegion',
        payload: {
          enterprise_id: eid,
          providerName: selectProvider,
          clusterID: selectClusterID,
        },
        callback: data => {
          if (data) {
            this.setState({
              loading: false,
              task: data,
              showInitDetail: true,
            });
          }
        },
        handleError: res => {
          if (res && res.data && res.data.code == 7005) {
            this.setState({
              loading: false,
              showInitDetail: true,
              showTask: res.data.data,
            });
            return;
          }
          cloud.handleCloudAPIError(res);
        },
      });
    } else {
      notification.warning('请阅读并同意注意事项');
    }
  };

  loadTask = () => {
    const {
      dispatch,
      eid,
      selectClusterID,
      selectProvider,
      completeInit,
    } = this.props;
    dispatch({
      type: 'cloud/loadInitRainbondTask',
      payload: {
        enterprise_id: eid,
        clusterID: selectClusterID,
        providerName: selectProvider,
      },
      callback: data => {
        if (data) {
          this.setState({ task: data });
          if (data.status == 'inited') {
            completeInit && completeInit(data);
          }
        }
      },
      handleError: res => {
        if (res && res.data && res.data.code == 404) {
          return;
        }
        cloud.handleCloudAPIError(res);
        this.setState({ loading: false });
      },
    });
  };

  cancelShowInitDetail = () => {
    const { loadRuningTasks } = this.props;
    loadRuningTasks && loadRuningTasks();
    this.loadTask();
    this.setState({ showInitDetail: false });
  };
  setChecked = val => {
    this.setState({ checked: val.target.checked });
  };
  render() {
    const { preStep, eid, selectProvider } = this.props;
    const { checked, showInitDetail, loading, task } = this.state;
    return (
      <Form>
        <h4>注意事项：</h4>
        <Col span={24} style={{ padding: '16px' }}>
          <Paragraph className={styles.describe}>
            <ul>
            <li>
                <span>
                  若你选择的是已经在使用的Kubernetes集群，不要担心，接下来的初始化动作不会影响集群已有的业务形态。
                </span>
              </li>
              <li>
                <span>
                  Rainbond集群初始化需要以下资源：RDS(1个)、NAS(1个)、SLB(1个)，并将(80\443\8443\6060\10000-11000)端口添加到安全组策略
                </span>
              </li>
              <li>
                <span>
                  新购资源都将采用按需后付费模式，因此请确保你的阿里云账号能够进行按需购买资源，后续用户根据需要进行付费模式变更
                </span>
              </li>
              <li>
                <span>
                  我们将通过Kube
                  API进行相关的资源创建和初始化，集群对接完成后即可关闭Kube
                  API的公网访问（移除绑定的EIP）
                </span>
              </li>
            </ul>
          </Paragraph>
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox onChange={this.setChecked}>
              我已阅读并同意上述注意事项
            </Checkbox>
          </Form.Item>
        </Col>

        {task && task.taskID != '' ? (
          <Col style={{ textAlign: 'center', marginTop: '32px' }} span={24}>
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
              开始初始化
            </Button>
          </Col>
        )}
        {showInitDetail && (
          <InitRainbondDetail
            onCancel={this.cancelShowInitDetail}
            eid={eid}
            providerName={selectProvider}
            clusterID={task.clusterID}
            taskID={task.taskID}
          ></InitRainbondDetail>
        )}
      </Form>
    );
  }
}
