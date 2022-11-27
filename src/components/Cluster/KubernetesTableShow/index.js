/* eslint-disable react/no-unused-state */
/* eslint-disable react/sort-comp */
import {
  Button,
  Col,
  Icon,
  message,
  Modal,
  notification,
  Popconfirm,
  Radio,
  Row,
  Table,
  Tooltip,
  Typography
} from 'antd';
import copy from 'copy-to-clipboard';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import CodeMirror from 'react-codemirror';
import { Link } from 'umi';
import {
  getKubeConfig,
  getUpdateKubernetesTask,
  uninstallRegion
} from '../../../services/cloud';
import cloud from '../../../utils/cloud';
import styles from '../ACKBuyConfig/index.less';
import ClusterComponents from '../ClusterComponents';
import ClusterCreationLog from '../ClusterCreationLog';
import RKEClusterUpdate from '../RKEClusterAdd';
import styless from '../RKEClusterAdd/index.less';
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
      showCreateLog: false,
      isInstallRemind: false,
      installLoading: false,
      isComponents: false,
      initCmd: null
    };
  }
  componentDidMount() {
    this.autoPage();
    this.handleLoadInitNodeCmd();
  }

  handleLoadInitNodeCmd = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'cloud/getInitNodeCmd',
      callback: res => {
        this.setState({
          initCmd: (res && res.response_data && res.response_data.cmd) || ''
        });
      }
    });
  };
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
      this.handleInstallLoading(false);
      return;
    }
    dispatch({
      type: 'cloud/reInstall',
      payload: {
        enterprise_id: eid,
        clusterID
      },
      callback: data => {
        this.handleInstallRemind(false);
        this.handleInstallLoading(false);
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
        this.handleInstallLoading(false);
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
        notification.success({ message: formatMessage({id:'notification.success.cluster_uninstalled'}) });
      }
    });
  };
  handleInstallLoading = installLoading => {
    this.setState({
      installLoading
    });
  };
  handleInstallRemind = isInstallRemind => {
    this.setState({
      isInstallRemind
    });
  };
  handleCommandBox = command => {
    return (
      <Col span={24} style={{ marginTop: '16px' }}>
        <span className={styless.cmd}>
          <Icon
            className={styless.copy}
            type="copy"
            onClick={() => {
              copy(command);
              notification.success({ message: formatMessage({id:'notification.success.copy'}) });
            }}
          />
          {command}
        </span>
      </Col>
    );
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
  handleIsComponents = isComponents => {
    this.setState({
      isComponents
    });
  };
  render() {
    const { selectProvider, linkedClusters, eid, selectCluster } = this.props;
    const { selectClusterName, initCmd } = this.state;
    const columns = [
      {
        width: 50,
        dataIndex: 'radio',
        render: (text, record) => {
          const clusterID = record.cluster_id;
          const disabled =
            record.state !== 'running' ||
            linkedClusters.get(clusterID) ||
            (record.parameters && record.parameters.DisableRainbondInit);
          const msg = record.parameters && record.parameters.Message;
          const recordName = record.name;
          return (
            <Tooltip title={msg}>
              <Radio
                disabled={disabled}
                checked={selectClusterName === recordName}
                onClick={() => {
                  if (!disabled) {
                    this.setState({
                      selectClusterName: recordName
                    });
                    if (selectCluster) {
                      selectCluster({
                        clusterID,
                        name: recordName,
                        can_init: record.can_init,
                        rainbond_init:
                          record.state &&
                          record.state === 'running' &&
                          record.rainbond_init
                      });
                    }
                  }
                }}
              >
                {text}
              </Radio>
            </Tooltip>
          );
        }
      },
      {
        title: formatMessage({id:'enterpriseColony.addCluster.host.name'}),
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
        title: formatMessage({id:'enterpriseColony.addCluster.host.cluster_type'}),
        width: 180,
        dataIndex: 'cluster_type',
        render: text => {
          return cloud.getAliyunClusterName(text);
        }
      }
    ];
    if (selectProvider !== 'custom' && selectProvider !== 'rke') {
      columns.push({
        title: formatMessage({id:'enterpriseColony.addCluster.host.region_id'}),
        dataIndex: 'region_id',
        render: text => {
          return cloud.getAliyunRegionName(text);
        }
      });
      columns.push({
        title: formatMessage({id:'enterpriseColony.addCluster.host.zone_id'}),
        dataIndex: 'zone_id'
      });
    } else {
      columns.push({
        title: formatMessage({id:'enterpriseColony.addCluster.host.master_url'}),
        width: 300,
        dataIndex: 'master_url.api_server_endpoint'
      });
    }
    columns.push({
      title: formatMessage({id:'enterpriseColony.addCluster.host.size'}),
      width: 100,
      dataIndex: 'size'
    });
    columns.push({
      title: formatMessage({id:'enterpriseColony.addCluster.host.current_version'}),
      width: 250,
      dataIndex: 'current_version'
    });
    columns.push({
      title: formatMessage({id:'enterpriseColony.addCluster.host.state'}),
      width: 150,
      dataIndex: 'state',
      render: (text, row) => {
        return cloud.getAliyunClusterStatus(text, row, linkedClusters);
      }
    });
    columns.push({
      title: formatMessage({id:'enterpriseColony.addCluster.host.cluster_id'}),
      dataIndex: 'cluster_id',
      render: (_, row) => {
        return (
          <div>
            {row.state === 'running' && (
              <a onClick={() => this.getKubeConfig(row.cluster_id || row.name)}>
                KubeConfig
              </a>
            )}
            {row.state === 'failed' && selectProvider === 'rke' && (
              <a
                onClick={() => {
                  this.handleInstallRemind(row.cluster_id || row.name);
                }}
              >
                <FormattedMessage id='enterpriseColony.addCluster.host.Reinstall'/>
              </a>
            )}
            {row.rainbond_init === true &&
              !linkedClusters.get(row.cluster_id) && (
                <Link
                  to={`/enterprise/${eid}/provider/${selectProvider}/kclusters/${row.cluster_id}/link`}
                >
                  <FormattedMessage id='enterpriseColony.addCluster.host.Docking'/>
                </Link>
              )}
            {selectProvider !== 'rke' &&
              row.create_log_path &&
              row.create_log_path.startsWith('http') && (
                <Button
                  type="link"
                  style={{ padding: 0 }}
                  onClick={() => {
                    window.open(row.create_log_path, '_blank');
                  }}
                >
                  <FormattedMessage id='enterpriseColony.addCluster.host.view_log'/>
                </Button>
              )}
            {selectProvider === 'rke' && (
              <Button
                type="link"
                style={{ padding: 0 }}
                onClick={() => {
                  this.queryCreateLog(row);
                }}
              >
                <FormattedMessage id='enterpriseColony.addCluster.host.view_log'/>
              </Button>
            )}
            {!row.rainbond_init &&
              (selectProvider === 'rke' || selectProvider === 'custom') && (
                <Popconfirm
                  placement="top"
                  title={<FormattedMessage id='enterpriseColony.addCluster.host.current_cluster'/>}
                  onConfirm={() => {
                    this.deleteCluster(row.cluster_id || row.name);
                  }}
                  okText={<FormattedMessage id='button.confirm'/>}
                  cancelText={<FormattedMessage id='button.cancel'/>}
                >
                  <a><FormattedMessage id='button.delete'/></a>
                </Popconfirm>
              )}

            {selectProvider === 'rke' && (
              <a onClick={() => this.updateCluster(row.cluster_id || row.name)}>
                <FormattedMessage id='enterpriseColony.addCluster.host.Cluster_configuration'/>
              </a>
            )}
            {row.state === 'running' &&
              (selectProvider === 'rke' || selectProvider === 'custom') && (
                <a onClick={() => this.handleIsComponents(row.cluster_id)}>
                  <FormattedMessage id='enterpriseColony.addCluster.host.look'/>
                </a>
                
              )}
            {row.rainbond_init === true && (
              <Popconfirm
                placement="top"
                title={<FormattedMessage id='enterpriseColony.addCluster.host.After_uninstallation'/>}
                onConfirm={() => {
                  this.uninstallCluster(row.cluster_id || row.name);
                }}
                okText={<FormattedMessage id='button.confirm'/>}
                cancelText={<FormattedMessage id='button.cancel'/>}
              >
                <a><FormattedMessage id='button.uninstall'/></a>
              </Popconfirm>
            )}
          </div>
        );
      }
    });

    const {
      data,
      showBuyClusterConfig,
      loadKubernetesCluster,
      loading,
      lastTask,
      showLastTaskDetail
    } = this.props;
    const {
      clusterID,
      kubeConfig,
      showUpdateKubernetes,
      nodeList,
      rkeConfig,
      updateClusterID,
      showUpdateKubernetesTasks,
      updateTask,
      showCreateLog,
      installLoading,
      isComponents,
      isInstallRemind
    } = this.state;
    const cleanRKEClusterScript = `curl -sfL https://get.rainbond.com/clean-rke | bash`;
    return (
      <div>
        <Row style={{ marginBottom: '20px' }}>
          {selectProvider === 'ack' && (
            <Col span={24} style={{ padding: '16px' }}>
              <Paragraph className={styles.describe}>
                <ul>
                  <li>
                    <span><FormattedMessage id='enterpriseColony.addCluster.host.managed'/></span>
                  </li>
                  <li>
                    <span>
                      <FormattedMessage id='enterpriseColony.addCluster.host.click'/>
                      <Button type="link" onClick={showBuyClusterConfig}>
                        <FormattedMessage id='enterpriseColony.addCluster.host.Newly'/>
                      </Button>
                      <FormattedMessage id='enterpriseColony.addCluster.host.Quick'/>
                    </span>
                  </li>
                  <li>
                    <span>
                      <FormattedMessage id='enterpriseColony.addCluster.host.try_again'/>
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
                      <FormattedMessage id='enterpriseColony.addCluster.host.successfully'/>
                    </span>
                  </li>
                </ul>
              </Paragraph>
            </Col>
          )}
          <Col span={12} style={{ textAlign: 'left' }}>
            {selectClusterName && (
              <span style={{ marginRight: '16px' }}>
                <FormattedMessage id='enterpriseColony.addCluster.host.Cluster_selected'/> {selectClusterName},
                <FormattedMessage id='enterpriseColony.addCluster.host.cluster_complies'/>
              </span>
            )}
            {!selectClusterName &&
              lastTask &&
              lastTask.name &&
              showLastTaskDetail && (
                <span>
                   <FormattedMessage id='enterpriseColony.addCluster.host.Last_created'/>{lastTask.name},
                  <Button onClick={showLastTaskDetail} type="link">
                    <FormattedMessage id='enterpriseColony.addCluster.host.creation_progress'/>
                  </Button>
                </span>
              )}
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Button type="primary" onClick={showBuyClusterConfig}>
              <FormattedMessage id='enterpriseColony.addCluster.host.add'/>
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
          scroll={{ x: window.innerWidth > 1500 ? false : 1500 }}
          loading={loading}
          pagination={false}
          columns={columns}
          dataSource={data}
        />
        {isInstallRemind && (
          <Modal
            title={<FormattedMessage id='enterpriseColony.addCluster.host.reinstall_current_cluster'/>}
            confirmLoading={installLoading}
            className={styless.TelescopicModal}
            width={900}
            visible
            onOk={() => {
              this.handleInstallLoading(true);
              this.reInstallCluster(isInstallRemind);
            }}
            onCancel={() => {
              this.handleInstallRemind(false);
            }}
          >
            <Row style={{ padding: '0 16px' }}>
              <span style={{ fontWeight: 600, color: 'red' }}>
                <FormattedMessage id='enterpriseColony.addCluster.host.following'/>
                <FormattedMessage id='enterpriseColony.addCluster.host.commands'/>
                <br />
                <FormattedMessage id='enterpriseColony.addCluster.host.permission'/>
              </span>
              {this.handleCommandBox(cleanRKEClusterScript)}
              {this.handleCommandBox(initCmd)}
            </Row>
          </Modal>
        )}
        {showCreateLog && (
          <ClusterCreationLog
            eid={eid}
            clusterID={clusterID}
            selectProvider={selectProvider}
            onCancel={() => {
              this.setState({ clusterID: '', showCreateLog: false });
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
              notification.success({ message: formatMessage({id:'notification.success.copy'}) });
            }}
            okText={<FormattedMessage id='button.copy'/>}
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
            onOK={task => {
              this.setState({
                clusterID: task.clusterID,
                showUpdateKubernetes: false,
                updateTask: task,
                showUpdateKubernetesTasks: true
              });
            }}
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
            clusterID={clusterID}
            task={updateTask}
            selectProvider={selectProvider}
            onCancel={this.cancelShowUpdateKubernetes}
          />
        )}
        {isComponents && (
          <ClusterComponents
            eid={eid}
            clusterID={isComponents}
            providerName={selectProvider}
            onCancel={() => {
              this.handleIsComponents(false);
            }}
          />
        )}
      </div>
    );
  }
}
