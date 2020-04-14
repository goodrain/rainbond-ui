import { Button, Col, Icon, Row, Table, Typography } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import cloud from '../../../utils/cloud';
import styles from '../ACKBuyConfig/index.less';
import ShowKubernetesCreateDetail from '../ShowKubernetesCreateDetail';
const { Paragraph } = Typography;

@connect()
export default class KubernetesClusterShow extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      selectClusterName: '',
      selectClusterID: '',
      showTaskDetail: false,
      lastTask: {},
    };
  }
  componentDidMount() {
    this.loadLastTask();
  }
  startInit = () => {
    const { selectClusterID } = this.state;
    const { startInit } = this.props;
    startInit && startInit(selectClusterID);
  };
  loadLastTask = () => {
    const { dispatch, eid, taskID, selectProvider } = this.props;
    dispatch({
      type: 'cloud/loadLastTask',
      payload: {
        enterprise_id: eid,
        provider_name: selectProvider,
        taskID: taskID,
      },
      callback: data => {
        if (data) {
          // to load create event
          this.setState({ lastTask: data });
        }
      },
      handleError: res => {
        cloud.handleCloudAPIError(res);
      },
    });
  };
  showTaskDetail = () => {
    this.setState({ showTaskDetail: true });
  };
  cancelShowCreateDetail = () => {
    this.setState({ showTaskDetail: false });
  };
  render() {
    const columns = [
      {
        title: '名称(ID)',
        dataIndex: 'name',
        render: (text, row) => `${text}(${row.cluster_id})`,
      },
      {
        title: '区域',
        dataIndex: 'region_id',
        render: text => {
          return cloud.getAliyunRegionName(text);
        },
      },
      {
        title: '可用区',
        dataIndex: 'zone_id',
      },
      {
        title: '类型',
        dataIndex: 'cluster_type',
        render: text => {
          return cloud.getAliyunClusterName(text);
        },
      },
      {
        title: '节点数量',
        dataIndex: 'size',
      },
      {
        title: '版本',
        dataIndex: 'current_version',
      },
      {
        title: '状态',
        dataIndex: 'state',
        render: (text, row) => {
          return cloud.getAliyunClusterStatus(text, row);
        },
      },
    ];

    // rowSelection object indicates the need for row selection
    const rowSelection = {
      onChange: (selectedRowKeys, selectedRows) => {
        if (selectedRows[0]) {
          this.setState({
            selectClusterID: selectedRows[0].cluster_id,
            selectClusterName: selectedRows[0].name,
          });
        }
      },
      getCheckboxProps: record => ({
        disabled:
          record.cluster_type != 'ManagedKubernetes' ||
          record.state != 'running' ||
          record.rainbond_init, // Column configuration not to be checked
        name: record.name,
      }),
    };
    const {
      data,
      preStep,
      showBuyClusterConfig,
      eid,
      loadKubernetesCluster,
    } = this.props;
    const {
      selectClusterName,
      selectClusterID,
      lastTask,
      showTaskDetail,
    } = this.state;
    let nextDisable = selectClusterID == '';
    return (
      <div>
        <Row style={{ marginBottom: '20px' }}>
          <Col span={24} style={{ padding: '16px' }}>
            <Paragraph className={styles.describe}>
              <ul>
                <li>
                  <span>
                    为保障服务质量，目前Rainbond
                    Cloud仅支持阿里云托管集群进行对接
                  </span>
                </li>
                <li>
                  <span>
                    若暂无可用集群，可点击
                    <Button type="link" onClick={showBuyClusterConfig}>
                      新购买集群
                    </Button>
                    快速购买
                  </span>
                </li>
                <li>
                  <span>
                    集群购买成功后处于初始化中的状态，阿里云将完成集群创建，正常情况下10分钟左右即可初始化完成
                  </span>
                </li>
              </ul>
            </Paragraph>
          </Col>
          <Col span={12} style={{ textAlign: 'left' }}>
            {selectClusterName && (
              <span>
                已选择集群: {selectClusterName},
                该集群符合Rainbond接入规则，可以开始Rainbond集群初始化
              </span>
            )}
            {lastTask && lastTask.name && lastTask.status != 'complete' && (
              <span>
                正在购买集群: {lastTask.name},
                <Button onClick={this.showTaskDetail} type="link">
                  点击查看购买进度
                </Button>
              </span>
            )}
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Button type="primary" onClick={showBuyClusterConfig}>
              新购买集群
            </Button>
            <Button
              style={{ marginLeft: '16px' }}
              onClick={loadKubernetesCluster}
            >
              <Icon type="reload" />
            </Button>
          </Col>
        </Row>

        <Table
          rowSelection={{
            type: 'radio',
            ...rowSelection,
          }}
          pagination={false}
          columns={columns}
          dataSource={data}
        />
        <Col style={{ textAlign: 'center', marginTop: '32px' }} span={24}>
          <Button onClick={preStep}>上一步</Button>
          <Button
            style={{ marginLeft: '16px' }}
            type="primary"
            onClick={this.startInit}
            disabled={nextDisable}
          >
            下一步
          </Button>
        </Col>
        {showTaskDetail && lastTask && (
          <ShowKubernetesCreateDetail
            onCancel={this.cancelShowCreateDetail}
            eid={eid}
            taskID={lastTask.taskID}
          />
        )}
      </div>
    );
  }
}
