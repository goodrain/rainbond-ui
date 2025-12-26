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
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import { Link } from 'umi';
import {
  uninstallRegion
} from '../../../services/cloud';
import cloud from '../../../utils/cloud';
import ClusterCreationLog from '../ClusterCreationLog';
import ShowKubernetesCreateDetail from '../ShowKubernetesCreateDetail'
import styless from '../RKEClusterAdd/index.less';
import istyles from './index.less';

const { Paragraph } = Typography;

@connect()
export default class KubernetesClusterShow extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      selectClusterName: '',
      clusterID: '',
      showCreateProgress: false,
      isInstallRemind: false,
      installLoading: false,
      isComponents: false,
      initCmd: null
    };
  }
  componentDidMount() {
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
  deleteCluster(clusterID) {
    const { dispatch, eid, selectProvider, loadKubernetesCluster } = this.props;
    dispatch({
      type: 'cloud/deleteKubernetesCluster',
      payload: {
        enterprise_id: eid,
        clusterID
      },
      callback: (res) => {
        notification.success({message: res.response_data.msg})
        if (loadKubernetesCluster) {
          loadKubernetesCluster();
        }
      },
      handleError: res => {
        cloud.handleCloudAPIError(res);
      }
    });
  }
  handleCreateProgress = row => {
    this.setState({ showCreateProgress: true, clusterID: row.cluster_id });
  };

  reInstallCluster = clusterID => {
    const {
      dispatch,
      eid,
      selectProvider,
      loadKubernetesCluster,
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
        }
      },
      handleError: res => {
        this.handleInstallLoading(false);
        cloud.handleCloudAPIError(res);
      }
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
        title: formatMessage({id:'enterpriseColony.addCluster.host.state'}),
        width: 150,
        dataIndex: 'state',
        render: (text, row) => {
          return cloud.getAliyunClusterStatus(text, row, linkedClusters);
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
      title: formatMessage({id:'enterpriseColony.addCluster.host.cluster_id'}),
      dataIndex: 'cluster_id',
      render: (_, row) => {
        return (
          <div>
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
            <Button
              type="link"
              style={{ padding: 0 }}
              onClick={() => {
                this.handleCreateProgress(row);
              }}
            >
              <FormattedMessage id='enterpriseColony.addCluster.host.view_log' />
            </Button>
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
    } = this.props;
    const {
      clusterID,
      nodeList,
      rkeConfig,
      updateClusterID,
      updateTask,
      showCreateProgress,
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
              <Paragraph className={istyles.describe}>
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
          rowKey={(record,index) => index}
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
        {showCreateProgress && (
          <ShowKubernetesCreateDetail
            onCancel={() => {
              this.setState({ clusterID: '', showCreateProgress: false });
            }}
            eid={eid}
            clusterList={data}
            isShowNodeComponent='showNode'
            clusterID={clusterID}
          />
        )}
      </div>
    );
  }
}
