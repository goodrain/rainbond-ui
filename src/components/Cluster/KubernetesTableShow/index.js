/* eslint-disable react/sort-comp */
import {
  Button,
  Col,
  Icon,
  message,
  Modal,
  notification,
  Popconfirm,
  Row,
  Table,
  Tooltip,
  Typography
} from 'antd';
import copy from 'copy-to-clipboard';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import CodeMirror from 'react-codemirror';
import { Link } from 'umi';
import {
  getKubeConfig,
  getUpdateKubernetesTask,
  uninstallRegion
} from '../../../services/cloud';
import cloud from '../../../utils/cloud';
import styles from '../ACKBuyConfig/index.less';
import ClusterCreationLog from '../ClusterCreationLog';
import RKEClusterUpdate from '../RKEClusterAdd';
import ShowUpdateClusterDetail from '../ShowUpdateClusterDetail';
import istyles from './index.less';

const { Paragraph } = Typography;

@connect()
export default class KubernetesClusterShow extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      selectClusterName: '',
      clusterID: '',
      showCreateLog: false
    };
  }
  componentDidMount() {
    this.autoPage();
  }

  autoPage = () => {
    const { updateKubernetes, updateKubernetesClusterID } = this.props;
    if (updateKubernetes && updateKubernetesClusterID) {
      this.updateCluster(updateKubernetesClusterID);
    }
  };
  deleteCluster(clusterID) {
    const { dispatch, eid, selectProvider, loadKubernetesCluster } = this.props;
    dispatch({
      type: 'cloud/deleteKubernetesCluster',
      payload: {
        enterprise_id: eid,
        providerName: selectProvider,
        clusterID
      },
      callback: () => {
        if (loadKubernetesCluster) {
          loadKubernetesCluster();
        }
      },
      handleError: res => {
        cloud.handleCloudAPIError(res);
      }
    });
  }
  queryCreateLog = row => {
    this.setState({ showCreateLog: true, clusterID: row.cluster_id });
  };

  reInstallCluster = clusterID => {
    const {
      dispatch,
      eid,
      selectProvider,
      loadKubernetesCluster,
      loadLastTask
    } = this.props;
    if (selectProvider !== 'rke') {
      message.warning('该提供商不支持集群重装');
      return;
    }
    dispatch({
      type: 'cloud/reInstall',
      payload: {
        enterprise_id: eid,
        clusterID
      },
      callback: data => {
        if (data) {
          if (loadKubernetesCluster) {
            loadKubernetesCluster();
          }
          if (loadLastTask) {
            loadLastTask();
          }
        }
      },
      handleError: res => {
        cloud.handleCloudAPIError(res);
      }
    });
  };
  updateCluster = clusterID => {
    const { eid, selectProvider } = this.props;
    getUpdateKubernetesTask(
      {
        clusterID,
        providerName: selectProvider,
        enterprise_id: eid
      },
      err => {
        cloud.handleCloudAPIError(err);
      }
    )
      .then(re => {
        if (re.task && re.task.status !== 'complete') {
          this.setState({
            showUpdateKubernetesTasks: true,
            updateTask: re.task
          });
          return;
        }
        this.setState({
          showUpdateKubernetes: true,
          nodeList: re.nodeList,
          rkeConfig: re.rkeConfig,
          updateClusterID: clusterID
        });
      })
      .catch(err => {
        console.log(err);
      });
  };
  uninstallCluster = clusterID => {
    const { eid, selectProvider } = this.props;
    uninstallRegion(
      {
        provider_name: selectProvider,
        enterprise_id: eid,
        clusterID
      },
      err => {
        cloud.handleCloudAPIError(err);
      }
    ).then(re => {
      if (re && re.status_code === 200) {
        notification.success({ message: '集群正在卸载中，稍后请刷新列表' });
      }
    });
  };
  cancelShowUpdateKubernetes = () => {
    const { loadKubernetesCluster } = this.props;
    this.setState({
      showUpdateKubernetesTasks: false,
      updateTask: null
    });
    if (loadKubernetesCluster) {
      loadKubernetesCluster();
    }
  };
  getKubeConfig = clusterID => {
    const { eid, selectProvider } = this.props;
    getKubeConfig({
      clusterID,
      enterprise_id: eid,
      providerName: selectProvider
    }).then(res => {
      if (res.status_code === 200) {
        this.setState({ kubeConfig: res.config });
      }
    });
  };

  render() {
    const { selectProvider, linkedClusters, eid } = this.props;
    const columns = [
      {
        title: '名称(ID)',
        width: 120,
        dataIndex: 'name',
        render: (text, row) => {
          const val = `${text}(${row.cluster_id})`;
          return (
            <Tooltip title={val}>
              <div className={istyles.nameID}>{val}</div>
            </Tooltip>
          );
        }
      },
      {
        title: '类型',
        dataIndex: 'cluster_type',
        render: text => {
          return cloud.getAliyunClusterName(text);
        }
      }
    ];
    if (selectProvider !== 'custom' && selectProvider !== 'rke') {
      columns.push({
        title: '区域',
        dataIndex: 'region_id',
        render: text => {
          return cloud.getAliyunRegionName(text);
        }
      });
      columns.push({
        title: '可用区',
        dataIndex: 'zone_id'
      });
    } else {
      columns.push({
        title: 'API地址',
        dataIndex: 'master_url.api_server_endpoint'
      });
    }
    columns.push({
      title: '节点数量',
      dataIndex: 'size'
    });
    columns.push({
      title: '版本',
      dataIndex: 'current_version'
    });
    columns.push({
      title: '状态',
      dataIndex: 'state',
      render: (text, row) => {
        return cloud.getAliyunClusterStatus(text, row, linkedClusters);
      }
    });

    columns.push({
      title: '操作',
      dataIndex: 'cluster_id',
      render: (text, row) => {
        return (
          <div>
            {row.state === 'running' && (
              <a onClick={() => this.getKubeConfig(row.cluster_id || row.name)}>
                KubeConfig
              </a>
            )}
            {row.state === 'failed' && selectProvider === 'rke' && (
              <Popconfirm
                placement="top"
                title="确认要重新安装当前集群吗？"
                onConfirm={() => {
                  this.reInstallCluster(row.cluster_id || row.name);
                }}
                okText="确定"
                cancelText="取消"
              >
                <a>重新安装</a>
              </Popconfirm>
            )}
            {row.rainbond_init === true &&
              !linkedClusters.get(row.cluster_id) && (
                <Link
                  to={`/enterprise/${eid}/provider/${selectProvider}/kclusters/${row.cluster_id}/link`}
                >
                  对接
                </Link>
              )}
            <Button
              type="link"
              style={{ padding: 0 }}
              onClick={() => {
                if (
                  row.create_log_path &&
                  row.create_log_path.startsWith('http')
                ) {
                  window.open(row.create_log_path, '_blank');
                } else {
                  this.queryCreateLog(row);
                }
              }}
            >
              查看日志
            </Button>

            {!row.rainbond_init &&
              (selectProvider === 'rke' || selectProvider === 'custom') && (
                <Popconfirm
                  placement="top"
                  title="确认要删除当前集群吗？"
                  onConfirm={() => {
                    this.deleteCluster(row.cluster_id || row.name);
                  }}
                  okText="确定"
                  cancelText="取消"
                >
                  <a>删除</a>
                </Popconfirm>
              )}

            {selectProvider === 'rke' && (
              <a onClick={() => this.updateCluster(row.cluster_id || row.name)}>
                集群配置
              </a>
            )}

            {row.rainbond_init === true && (
              <Popconfirm
                placement="top"
                title="卸载后不可恢复，确认要卸载当前集群的平台服务吗？"
                onConfirm={() => {
                  this.uninstallCluster(row.cluster_id || row.name);
                }}
                okText="确定"
                cancelText="取消"
              >
                <a>卸载</a>
              </Popconfirm>
            )}
          </div>
        );
      }
    });

    // rowSelection object indicates the need for row selection
    const rowSelection = {
      onChange: (selectedRowKeys, selectedRows) => {
        if (selectedRows[0]) {
          this.setState({
            selectClusterName: selectedRows[0].name
          });
          if (this.props.selectCluster) {
            this.props.selectCluster({
              clusterID: selectedRows[0].cluster_id,
              name: selectedRows[0].name
            });
          }
        }
      },
      getCheckboxProps: record => ({
        disabled:
          record.state !== 'running' ||
          linkedClusters.get(record.cluster_id) ||
          (record.parameters && record.parameters.DisableRainbondInit), // Column configuration not to be checked
        name: record.name,
        title: record.parameters && record.parameters.Message
      })
    };
    const {
      data,
      showBuyClusterConfig,
      loadKubernetesCluster,
      loading,
      lastTask,
      showLastTaskDetail
    } = this.props;
    const {
      selectClusterName,
      clusterID,
      showCreateLog,
      kubeConfig,
      showUpdateKubernetes,
      nodeList,
      rkeConfig,
      updateClusterID,
      showUpdateKubernetesTasks,
      updateTask
    } = this.state;
    return (
      <div>
        <Row style={{ marginBottom: '20px' }}>
          {selectProvider === 'ack' && (
            <Col span={24} style={{ padding: '16px' }}>
              <Paragraph className={styles.describe}>
                <ul>
                  <li>
                    <span>目前平台支持阿里云托管集群自动化购买</span>
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
                      若集群创建出现错误，请再次确保以下服务已开通或授权已授予后重试：
                      {cloud.getAliyunCountDescribe().map(item => {
                        return (
                          <a
                            style={{ marginRight: '8px' }}
                            href={item.href}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {item.title}
                          </a>
                        );
                      })}
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
          )}
          <Col span={12} style={{ textAlign: 'left' }}>
            {selectClusterName && (
              <span style={{ marginRight: '16px' }}>
                已选择集群: {selectClusterName},
                该集群符合平台接入规则，可以开始平台集群初始化。
              </span>
            )}
            {!selectClusterName &&
              lastTask &&
              lastTask.name &&
              showLastTaskDetail && (
                <span>
                  上一次创建任务: {lastTask.name},
                  <Button onClick={showLastTaskDetail} type="link">
                    点击查看创建进度
                  </Button>
                </span>
              )}
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Button type="primary" onClick={showBuyClusterConfig}>
              新增集群
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
          loading={loading}
          rowSelection={{
            type: 'radio',
            ...rowSelection
          }}
          pagination={false}
          columns={columns}
          dataSource={data}
        />
        {showCreateLog && (
          <ClusterCreationLog
            eid={eid}
            clusterID={clusterID}
            selectProvider={selectProvider}
            onCancel={() => {
              this.setState({ showCreateLog: false, clusterID: '' });
            }}
          />
        )}
        {kubeConfig && (
          <Modal
            visible
            width={1000}
            maskClosable={false}
            onCancel={() => {
              this.setState({ kubeConfig: '' });
            }}
            title="KubeConfig"
            bodyStyle={{ background: '#000' }}
            onOk={() => {
              copy(kubeConfig);
              notification.success({ message: '复制成功' });
            }}
            okText="复制"
          >
            <div className={istyles.cmd}>
              <CodeMirror
                value={kubeConfig}
                options={{
                  mode: { name: 'javascript', json: true },
                  lineNumbers: true,
                  theme: 'seti',
                  lineWrapping: true,
                  smartIndent: true,
                  matchBrackets: true,
                  scrollbarStyle: null,
                  showCursorWhenSelecting: true,
                  height: 500
                }}
              />
            </div>
          </Modal>
        )}
        {showUpdateKubernetes && (
          <RKEClusterUpdate
            eid={eid}
            onOK={task =>
              this.setState({
                showUpdateKubernetes: false,
                updateTask: task,
                showUpdateKubernetesTasks: true
              })
            }
            onCancel={() => {
              this.setState({ showUpdateKubernetes: false });
            }}
            clusterID={updateClusterID}
            nodeList={nodeList}
            rkeConfig={rkeConfig}
          />
        )}
        {showUpdateKubernetesTasks && (
          <ShowUpdateClusterDetail
            eid={eid}
            task={updateTask}
            onCancel={this.cancelShowUpdateKubernetes}
          />
        )}
      </div>
    );
  }
}
