import { Badge, Button, Card, Col, notification, Row, Table } from 'antd';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import EditClusterInfo from '../../components/Cluster/EditClusterInfo';
import ConfirmModal from '../../components/ConfirmModal';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import userUtil from '../../utils/user';

@connect(({ user, list, loading, global, index }) => ({
  user: user.currentUser,
  list,
  loading: loading.models.list,
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  isRegist: global.isRegist,
  oauthLongin: loading.effects['global/creatOauth'],
  overviewInfo: index.overviewInfo,
}))
export default class EnterpriseClusters extends PureComponent {
  constructor(props) {
    super(props);
    const { user } = this.props;
    const adminer =
      userUtil.isSystemAdmin(user) || userUtil.isCompanyAdmin(user);
    this.state = {
      adminer,
      clusters: [],
      editClusterShow: false,
      regionInfo: false,
      text: '',
      delVisible: false,
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
    this.loadClusters();
  }

  handleDelete = () => {
    const { regionInfo } = this.state;
    const {
      dispatch,
      match: {
        params: { eid },
      },
    } = this.props;
    dispatch({
      type: 'region/deleteEnterpriseCluster',
      payload: {
        region_id: regionInfo.region_id,
        enterprise_id: eid,
      },
      callback: res => {
        if (res && res._condition === 200) {
          this.loadClusters();
          this.cancelClusters();
          notification.success({ message: '删除成功' });
        }
      },
    });
  };

  loadClusters = name => {
    const {
      dispatch,
      match: {
        params: { eid },
      },
    } = this.props;
    dispatch({
      type: 'region/fetchEnterpriseClusters',
      payload: {
        enterprise_id: eid,
        name,
      },
      callback: res => {
        if (res && res.list) {
          let clusters = [];
          res.list.map((item, index) => {
            item.key = `cluster${index}`;
            clusters.push(item);
          });
          this.setState({ clusters: clusters });
        }
      },
    });
  };

  // 添加集群
  addClusterShow = () => {};

  cancelEditClusters = () => {
    this.setState({
      editClusterShow: false,
      text: '',
      regionInfo: false,
    });
  };

  handleEdit = item => {
    this.loadPutCluster(item.region_id);
  };

  delUser = regionInfo => {
    this.setState({
      delVisible: true,
      regionInfo,
    });
  };
  cancelClusters = () => {
    this.setState({
      delVisible: false,
      regionInfo: false,
    });
  };

  handlUnit = num => {
    if (num) {
      return (num/1024).toFixed(2) / 1;
    }
    return 0;
  };

  loadPutCluster = regionID => {
    const {
      dispatch,
      match: {
        params: { eid },
      },
    } = this.props;
    dispatch({
      type: 'region/fetchEnterpriseCluster',
      payload: {
        enterprise_id: eid,
        region_id: regionID,
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            regionInfo: res.bean,
            editClusterShow: true,
            text: '编辑集群',
          });
        }
      },
    });
  };

  render() {
    const { clusters, text, regionInfo, delVisible } = this.state;

    const {
      match: {
        params: { eid },
      },
    } = this.props;

    const colorbj = (color, bg) => {
      return {
        width: '100px',
        color,
        background: bg,
        borderRadius: '15px',
        padding: '2px 0',
      };
    };
    const columns = [
      {
        title: '名称',
        dataIndex: 'region_alias',
        align: 'center',
      },
      {
        title: '类型',
        dataIndex: 'region_type',
        align: 'center',
        render: (val, _) => {
          return (
            <span>
              {val && val instanceof Array && val.length>0 ? val.map(item => {
                if (item == "development") {
                  return <span style={{marginRight:"8px"}} key={item}>开发集群</span>
                }
                if (item == "ack-manage") {
                  return <span style={{marginRight:"8px"}} key={item}>阿里云-托管集群</span>
                }
              }) : "普通集群"}
            </span>
          );
        },
      },
      {
        title: '内存(GB)',
        dataIndex: 'total_memory',
        align: 'center',
        width: '20%',
        render: (_, val) => {
          return (
            <span>
              {this.handlUnit(val.used_memory)}/
              {this.handlUnit(val.total_memory)}
            </span>
          );
        },
      },
      {
        title: '版本',
        dataIndex: 'rbd_version',
        align: 'center',
        width: '30%',
      },
      {
        title: '状态',
        dataIndex: 'status',
        align: 'center',
        width: '10%',
        render: (val, data) => {
          if (data.health_status === 'failure') {
            return <span style={{ color: 'red' }}>异常</span>;
          }
          switch (val) {
            case '0':
              return (
                <div style={colorbj('#1890ff', '#e6f7ff')}>
                  <Badge color="#1890ff" />
                  编辑中
                </div>
              );
            case '1':
              return (
                <div style={colorbj('#52c41a', '#e9f8e2')}>
                  <Badge color="#52c41a" />
                  运行中
                </div>
              );
            case '2':
              return (
                <div style={colorbj('#b7b7b7', '#f5f5f5')}>
                  <Badge color="#b7b7b7" />
                  已下线
                </div>
              );

            case '3':
              return (
                <div style={colorbj('#1890ff', '#e6f7ff')}>
                  <Badge color="#1890ff" />
                  维护中
                </div>
              );
            case '5':
              return (
                <div style={colorbj('#fff', '#f54545')}>
                  <Badge color="#fff" />
                  异常
                </div>
              );
            default:
              return (
                <div style={colorbj('#fff', '#ffac38')}>
                  <Badge color="#fff" />
                  未知
                </div>
              );
          }
        },
      },
      {
        title: '操作',
        dataIndex: 'method',
        align: 'center',
        width: '10%',
        render: (_, item) => {
          return [
            <a
              onClick={() => {
                this.delUser(item);
              }}
            >
              删除
            </a>,
            <a
              onClick={() => {
                this.handleEdit(item);
              }}
            >
              编辑
            </a>,
          ];
        },
      },
    ];

    return (
      <PageHeaderLayout
        title="集群管理"
        content="集群是资源的集合，以Kubernetes集群为基础，部署Rainbond Region服务即可成为Rainbond集群资源。"
      >
        <Row style={{ marginBottom: '20px' }}>
          <Col span={24} style={{ textAlign: 'right' }}>
            <Link to={`/enterprise/${eid}/addCluster`}>
              <Button type="primary">添加集群</Button>
            </Link>
          </Col>
        </Row>
        <Card>
          {delVisible && (
            <ConfirmModal
              onOk={this.handleDelete}
              title="删除集群"
              subDesc="此操作不可恢复"
              desc="确定要删除此集群吗？"
              onCancel={this.cancelClusters}
            />
          )}

          {this.state.editClusterShow && (
            <EditClusterInfo
              regionInfo={regionInfo}
              title={text}
              eid={eid}
              onOk={this.cancelEditClusters}
              onCancel={this.cancelEditClusters}
            />
          )}
          <Table size="middle" dataSource={clusters} columns={columns} />
        </Card>
      </PageHeaderLayout>
    );
  }
}
