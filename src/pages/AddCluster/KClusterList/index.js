/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import { Button, Card, Col, Form, Row, Steps, Tooltip, Alert, Table, Modal, Checkbox, notification, Icon, Tag, message } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import RKEClusterCmd from '../../../components/RKEClusterCmd'
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import copy from 'copy-to-clipboard';
import ConfirmModal from '@/components/ConfirmModal';
import globalUtil from '../../../utils/global';
import userUtil from '../../../utils/user';
import styles from './index.less'

const { Step } = Steps;
const CheckboxGroup = Checkbox.Group;

const plainOptions = ['ETCD', 'Master', 'Worker'];
const defaultCheckedList = ['ETCD', 'Master'];

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
export default class EnterpriseClusters extends PureComponent {
  constructor(props) {
    super(props);
    const { user } = this.props;
    const adminer = userUtil.isCompanyAdmin(user);
    this.state = {
      adminer,
      visible: false,
      confirmLoading: false,
      checkedList: defaultCheckedList,
      registrationCmd: '',
      copyText: '',
      clusterInfoList: [],
      nextBtnstatus: {},
      deleteNode: null,
    };
  }
  componentDidMount() {
    // this.toClusterList()
  }
  toClusterList = (provider = 'rke') => {
    const { dispatch } = this.props;
    const {
      match: {
        params: { eid }
      }
    } = this.props;
    const TOCLUSTERLIST_PATHS = {
      initializing: '/enterprise/{eid}/provider/{provider}/kclusters/append?event_id={eventId}',
      initialized: '/enterprise/{eid}/provider/{provider}/kclusters?event_id={eventId}',
      installing: '/enterprise/{eid}/provider/{provider}/kclusters?type=installing&event_id={eventId}',
      installed: '/enterprise/{eid}/provider/{provider}/kclusters?event_id={eventId}',
      integrating: '/enterprise/{eid}/provider/{provider}/kclusters/init?event_id={eventId}',
      integrated: '/enterprise/{eid}/provider/{provider}/kclusters/check?event_id={eventId}',
    };
    dispatch({
      type: 'region/fetchClusterInfo',
      payload: {
        cluster_id: ''
      },
      callback: res => {
        if (res && res.status_code === 200) {
          window.localStorage.setItem('event_id', res.bean.event_id)
          const status = res.bean.create_status;
          let path = TOCLUSTERLIST_PATHS[status] || TOCLUSTERLIST_PATHS.initializing;
          path = path.replace('{eid}', eid).replace('{provider}', provider);
          if (path.includes('{eventId}')) {
            path = path.replace('{eventId}', res.bean.event_id);
          }
          dispatch(routerRedux.push(path));
        }
      }
    });
  };
  componentWillMount() {
    const { adminer } = this.state;
    const { dispatch, location: {
      query: { event_id }
    } } = this.props;
    if (!adminer) {
      dispatch(routerRedux.push(`/`));
    } else {
      this.setState({
        eventId: event_id == undefined ? window.localStorage.getItem('event_id') : event_id
      })
    }
  }
  componentDidMount() {
    const { checkedList } = this.state;
    this.fetchClusterInfoList()
  }
  componentWillUnmount() {
    this.closeTimer()
  }
  closeTimer = () => {
    if (this.timer) {
      clearInterval(this.timer);
    }
  };
  handleTimers = (timerName, callback, times) => {
    this[timerName] = setTimeout(() => {
      callback();
    }, times);
  };
  // 请求所有日志
  fetchClusterInfoList = () => {
    const { dispatch } = this.props;
    const { eventId } = this.state
    dispatch({
      type: 'region/fetchClusterInfoList',
      payload: {
        event_id: eventId
      },
      callback: res => {
        if (res && res.status_code == 200) {
          this.setState({
            clusterInfoList: res.list || [],
            nextBtnstatus: this.countRoles(res.list || []),
          }, () => {
            this.handleTimers(
              'timer',
              () => {
                this.fetchClusterInfoList();
              },
              3000
            );
          })
        }
      },
      handleError: res => {
        this.closeTimer();
        this.fetchClusterInfoList();
      }
    });
  };
  showModal = () => {
    this.setState({
      visible: true,
    });
  };

  handleOk = () => {
    this.setState({
      confirmLoading: true,
    });
    setTimeout(() => {
      this.setState({
        visible: false,
        confirmLoading: false,
      });
    }, 2000);
  };

  handleCancel = () => {
    this.setState({
      visible: false,
    });
  };

  addClusterOK = () => {
    const { dispatch } = this.props;
    const {
      match: {
        params: { eid }
      }
    } = this.props;
    const enterpriseID = eid || globalUtil.getCurrEnterpriseId()
    dispatch(routerRedux.push(`/enterprise/${enterpriseID}/clusters`));
  };
  preStep = () => {
    const { dispatch } = this.props;
    const {
      match: {
        params: { eid }
      }
    } = this.props;
    const enterpriseID = eid || globalUtil.getCurrEnterpriseId()
    dispatch(routerRedux.push(`/enterprise/${enterpriseID}/addCluster`));
  };
  loadSteps = () => {
    const steps = [
      {
        title: formatMessage({ id: 'enterpriseColony.addCluster.supplier' })
      },
      {
        title: formatMessage({ id: 'enterpriseColony.addCluster.cluster' })
      },
      {
        title: formatMessage({ id: 'enterpriseColony.addCluster.Initialize' })
      },
      {
        title: formatMessage({ id: 'enterpriseColony.addCluster.clusterInit' })
      },
      {
        title: formatMessage({ id: 'enterpriseColony.addCluster.docking' })
      }
    ];
    return steps;
  };
  lastOrNextSteps = (type) => {
    const { dispatch } = this.props;
    const {
      match: {
        params: { eid, provider }
      }
    } = this.props;
    const enterpriseID = eid || globalUtil.getCurrEnterpriseId()
    if (type == 'last') {
      dispatch(routerRedux.push(`/enterprise/${enterpriseID}/addCluster`));
    } else {
      dispatch(routerRedux.push(`/enterprise/${enterpriseID}/provider/${provider}/kclusters/init`));
    }
  }

  countRoles = (clusterInfoList) => {
    if (clusterInfoList && clusterInfoList.length > 0) {
      const bool = clusterInfoList.every(cluster => cluster.status === 'Ready');
      if (!bool) {
        return { disabled: true, msg: formatMessage({ id: 'enterpriseColony.newHostInstall.node.nodeNotReady' }) };
      }
      const allRoles = clusterInfoList.flatMap(info => info.roles.split(', ').filter(role => role.trim() !== '')).map(role => role.trim());
      const countObj = allRoles.reduce((acc, role) => {
        if (role in acc) {
          acc[role]++;
        } else {
          acc[role] = 1;
        }
        return acc;
      }, {});
      const requiredRoles = ['etcd', 'master', 'worker'];
      for (let role of requiredRoles) {
        if (!(role in countObj)) {
          return { disabled: true, msg: formatMessage({ id: 'enterpriseColony.newHostInstall.node.etcd' }) };
        }
      }
      if (countObj['etcd'] % 2 === 1) {
        return { disabled: false, msg: '' };
      } else {
        return { disabled: true, msg: formatMessage({ id: 'enterpriseColony.newHostInstall.node.etcdNum' }) };
      }
    } else {
      return { disabled: true, msg: formatMessage({ id: 'enterpriseColony.newHostInstall.node.nodeinfo' }) };
    }
  }
  handleDeleteNode = () => {
    const { dispatch } = this.props;
    const { deleteNode } = this.state;
    dispatch({
      type: 'region/deleteClusterNode',
      payload: {
        node_name: deleteNode.name
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({ message: formatMessage({ id: 'notification.success.delete' }) });
          this.setState({ deleteNode: null })
          this.fetchClusterInfoList()
        }
      }
    });
  }
  // 删除节点弹窗方法
  showDeleteNode = (item) => {
    this.setState({
      deleteNode: item
    })
  }
  // 取消删除节点
  cancalDeleteNode = () => {
    this.setState({
      deleteNode: null
    })
  }

  handleCopy = (copyValue) => {
    copy(copyValue);
    message.success(formatMessage({ id: 'notification.success.copy' }));
  }
  render() {
    const {
      match: {
        params: { eid, provider }
      },
    } = this.props;
    const {
      visible,
      confirmLoading,
      copyText,
      clusterInfoList,
      nextBtnstatus,
      eventId,
      deleteNode
    } = this.state
    const copySvg = (
      <svg width="30" height="30" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><g fill="#fff" fill-rule="evenodd"><rect opacity="0.4" x="7.5" y="4.5" width="8" height="8" rx="1"></rect><rect x="4.5" y="7.5" width="8" height="8" rx="1"></rect></g></svg>
    )
    const columns = [
      {
        title: formatMessage({ id: 'enterpriseColony.newHostInstall.node.status' }),
        dataIndex: 'status',
        key: 'status',
        render: (text, record) => {
          return (
            <p className={styles.status}>
              <Tag color={globalUtil.getPublicColor(text === 'Ready' ? 'rbd-success-status' : 'rbd-warning-status')}>{text}</Tag>
              {text !== 'Ready' &&
                <Tooltip title={`${record?.installation_status}`}>
                  <p className={styles.log}>{record?.installation_status}</p>
                </Tooltip>
              }
            </p>
          );
        },
      },
      {
        title: formatMessage({ id: 'enterpriseColony.newHostInstall.node.bame' }),
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: formatMessage({ id: 'enterpriseColony.newHostInstall.node.ip' }),
        dataIndex: 'external_ip',
        key: 'external_ip',
        render: (text, record) => {
          return (
            <span>
              {record.external_ip || '-'}/{record.internal_ip || '-'}
            </span>
          );
        },
      },
      {
        title: formatMessage({ id: 'enterpriseColony.newHostInstall.node.system' }),
        dataIndex: 'os_image',
        key: 'os_image',
      },
      {
        title: formatMessage({ id: 'enterpriseColony.newHostInstall.node.role' }),
        dataIndex: 'roles',
        key: 'roles',
        render: (text, record) => {
          if (!text || typeof text !== 'string') {
            return <span>-</span>;
          }
          let arr = text.split(',').map((str) => str.trim());
          return (
            <span>
              {arr && arr.length > 0 ? (
                <>
                  {arr.map((item, index) => {
                    switch (item) {
                      case "control-plane":
                        return (
                          <Tag color={globalUtil.getPublicColor()} key={index}>
                            {formatMessage({ id: 'enterpriseColony.newHostInstall.node.select.Control-plane' })}
                          </Tag>
                        );
                      case "etcd":
                        return (
                          <Tag color={globalUtil.getPublicColor()} key={index}>
                            {formatMessage({ id: 'enterpriseColony.newHostInstall.node.select.ETCD' })}
                          </Tag>
                        );
                      case "worker":
                        return (
                          <Tag color={globalUtil.getPublicColor()} key={index}>
                            {formatMessage({ id: 'enterpriseColony.newHostInstall.node.select.Worker' })}
                          </Tag>
                        );
                      default:
                        return null;
                    }
                  })}
                </>
              ) : (
                "-"
              )}
            </span>
          );
        },
      },
      {
        title: formatMessage({ id: 'enterpriseColony.newHostInstall.node.live' }),
        dataIndex: 'uptime',
        key: 'uptime',
      },
      {
        title: formatMessage({ id: 'enterpriseColony.table.handle.quota.table.label.method'}),
        dataIndex: 'operate',
        key: 'operate',
        render: (val, item) => {
          return [
            <a
              onClick={() => {
                this.showDeleteNode(item);
              }}
            >
              {/* 编辑 */}
              <FormattedMessage id='button.delete' />
            </a>
          ];
        }
      },
    ];
    return (
      <PageHeaderLayout
        title={<FormattedMessage id='enterpriseColony.button.text' />}
        content={<FormattedMessage id='enterpriseColony.PageHeaderLayout.content' />}
        titleSvg={pageheaderSvg.getPageHeaderSvg('clusters', 18)}
      >
        <Row style={{ marginBottom: '16px' }}>
          <Steps current={1}>
            {this.loadSteps().map(item => (
              <Step key={item.title} title={item.title} />
            ))}
          </Steps>
        </Row>
        <Card
          title={formatMessage({ id: 'enterpriseColony.newHostInstall.node.hostList' })}
          extra={<Button type="primary" onClick={this.showModal}>{formatMessage({ id: 'enterpriseColony.newHostInstall.node.addnode' })}</Button>}
        >
          <Alert
            message={formatMessage({ id: 'enterpriseColony.newHostInstall.node.lookOut' })}
            description={formatMessage({ id: 'enterpriseColony.newHostInstall.node.msg' })}
            type="warning"
            showIcon
            style={{ marginBottom: 24 }}
          />
          <Table dataSource={clusterInfoList} columns={columns} />
        </Card>
        {visible &&
          <RKEClusterCmd onCancel={this.handleCancel} eventId={eventId} />
        }
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <Button onClick={() => this.lastOrNextSteps('last')} style={{ marginRight: 24 }}>取消</Button>
          <Tooltip title={nextBtnstatus.msg}>
            <Button onClick={() => this.lastOrNextSteps('next')} type="primary" disabled={nextBtnstatus.disabled}>{formatMessage({ id: 'enterpriseColony.newHostInstall.node.next' })}</Button>
          </Tooltip>
        </div>
        {deleteNode && 
          <Modal
            title={formatMessage({ id: 'enterpriseColony.newHostInstall.node.deleteNode' })}
            visible={deleteNode}
            onOk={this.handleDeleteNode}
            onCancel={this.cancalDeleteNode}
          >
            <div className={styles.inner}>
              <span className={styles.icon}>
                <Icon type="exclamation-circle-o" />
              </span>
              <div className={styles.desc}>
                {formatMessage({ id: 'enterpriseColony.newHostInstall.node.deleteNodeDesc' })}
              </div>
            </div>
            <span>{formatMessage({ id: 'enterpriseColony.newHostInstall.node.deleteNodeSubDesc' })}</span>
            <div className={styles.cmd}>
              <p>/usr/local/bin/rke2-uninstall.sh</p>
              <div className={styles.copy} onClick={()=>this.handleCopy('/usr/local/bin/rke2-uninstall.sh')}>{copySvg}</div>
            </div>
          </Modal>}
      </PageHeaderLayout>
    );
  }
}
