import React, { Component } from 'react';
import { 
  Card, 
  Button, 
  Table, 
  Badge, 
  Tooltip, 
  Menu, 
  Dropdown, 
  Icon, 
  Tag, 
  Skeleton, 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  Row, 
  Col,
  notification 
} from 'antd';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import copy from 'copy-to-clipboard';
import {
  getKubeConfig,
  getUpdateKubernetesTask,
  uninstallRegion
} from '../../services/cloud';
import { connect } from 'dva';
import RKEClusterUpdate from '../Cluster/RKEClusterAdd';
import { Link, routerRedux } from 'dva/router';
import global from '../../utils/global'
import SVG from '../../utils/pageHeaderSvg'
import styles from './index.less'

@connect()
@Form.create()


class Index extends Component {
  constructor(props) {
    super(props);
    this.state = {
      eid: global.getCurrEnterpriseId(),
      jumpSwitch: true,
      selectArr: ['controlplane', 'etcd', 'worker'],
      modalVisible: false,
      initNodeCmd: '',
      showUpdateKubernetes: false,
      showUpdateKubernetesTasks: false
    }
  }
  componentDidMount() {
    // this.loadInitNodeCmd()
  }

  //节点状态
  clusterStatus = (status) => {
    switch (status) {
      case "Ready":
        return (
          <span style={{ color: '#52c41a', }}>
            <Badge color="#52c41a" />
            {status}
          </span>
        );
      case 'NotReady':
        return (
          <span style={{ color: 'red',  }}>
            <Badge color="red" />
            {status}
          </span>
        );
      default:
        return (
          <span style={{ color: '#fff',  }}>
            <Badge color="#fff" />
            {/* 未知 */}
            <FormattedMessage id='enterpriseColony.table.state.unknown' />
          </span>
        );
    }
  }
  // 行点击事件
  onClickRow = (record) => {
    const { rowClusterInfo } = this.props
    return {
      onClick: () => {
        const { jumpSwitch } = this.state;
        const {
          dispatch
        } = this.props;
        const eid = global.getCurrEnterpriseId()
        if (jumpSwitch) {
          dispatch(routerRedux.push(`/enterprise/${eid}/clusters/nodemgt/${rowClusterInfo.region_id}?name=${record.name}`));
        }
      },
    };
  }
  clusterNodeAdd = () => {
    const { rowClusterInfo } = this.props
    this.props.updateCluster(rowClusterInfo.provider_cluster_id)
  }
  menuMouseEnter = () => {
    this.setState({
      jumpSwitch: false
    })
  }
  menuMouseLeave = () => {
    this.setState({
      jumpSwitch: true
    })
  }
  editNodeStatus = (active, name, row) => {
    const { rowClusterInfo } = this.props
    if(active == 'evict'){
      if(row.unschedulable == true){
        this.props.active(active, name, rowClusterInfo.region_name)
      }else{
        notification.warning({
          message: "请先禁止调度！"
        });
      }
    }else{
      this.props.active(active, name, rowClusterInfo.region_name)
    }

  }
  render() {
    const { nodeList, rowClusterInfo, showInfo, form, } = this.props
    const { selectArr, } = this.state
    const eid = global.getCurrEnterpriseId()
    const { getFieldDecorator } = form;
    const moreSvg = () => (
      <svg
        t="1581212425061"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="1314"
        width="32"
        height="32"
      >
        <path
          d="M512 192m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
          p-id="1315"
          fill="#999999"
        />
        <path
          d="M512 512m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
          p-id="1316"
          fill="#999999"
        />
        <path
          d="M512 832m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
          p-id="1317"
          fill="#999999"
        />
      </svg>
    );
    const columns = [
      {
        title: <span>名称{<Tooltip placement="top" title={'点击节点行进入节点管理页面'}><span className={styles.nameStyle}>{SVG.getSvg('helpSvg', 18)}</span></Tooltip>}</span>,
        dataIndex: 'name',
        key: 'name',
        render: text => {
          return <Link style={{ fontWeight: 600 }} to={`/enterprise/${eid}/clusters/nodemgt/${rowClusterInfo.region_id}?name=${text}`}>{text}</Link>
        }
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        render: val => {
          return this.clusterStatus(val)
        }
      },
      {
        title: '角色',
        dataIndex: 'role',
        key: 'role',
        render: text =>
          text &&
          text.length > 0 &&
          text.map(item => <Tag color="blue">{item}</Tag>)
      },
      {
        title: '已分配CPU(Core)',
        dataIndex: 'cpu',
        key: 'cpu',
        render: (val, row) => {
          const { req_cpu, cap_cpu } = row
          const cpuUsed = ((req_cpu / cap_cpu) * 100).toFixed(1);
          return <>
            <p className={styles.tdStyle}>已分配{cpuUsed}%</p>
            <p>{req_cpu.toFixed(1)} / {cap_cpu.toFixed(1)} Core</p>
          </>
        }
      },
      {
        title: '已分配内存(GB)',
        dataIndex: 'mey',
        key: 'mey',
        render: (val, row) => {
          const { cap_memory, req_memory } = row
          const cpuUsed = ((req_memory / cap_memory) * 100).toFixed(1);
          return <>
            <p className={styles.tdStyle}>已分配{cpuUsed}%</p>
            <p>{req_memory.toFixed(1)} / {cap_memory.toFixed(1)} GB</p>
          </>

        }
      },
      {
        title: '操作',
        key: 'edit',
        render: (val, roed) => {
          const startList = [
            <span onClick={() => this.editNodeStatus('reschedulable', roed.name, roed)}>调度</span>,
          ]
          const endList = [
            <span onClick={() => this.editNodeStatus('unschedulable', roed.name, roed)}>禁止调度</span>,
          ]
          const list = [<span onClick={() => this.editNodeStatus('evict', roed.name, roed)}>排空</span>]
          const arr = []
          if (roed.unschedulable == false ) {
            arr.push(...endList)
            arr.push(...list)
          } else {
            arr.push(...startList)
            arr.push(...list)
          }
          const MenuList = (
            <Menu
              onMouseEnter={this.menuMouseEnter}
              onMouseLeave={this.menuMouseLeave}
            >
              {arr.map(item => {
                return <Menu.Item>
                  {item}
                </Menu.Item>
              })}
            </Menu>
          )
          return <Dropdown
            overlay={MenuList}
            placement="bottomLeft"
          >
            <Icon component={moreSvg} style={{ width: '50%' }} />
          </Dropdown>;
        }
      }
    ];
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 6
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 16
        }
      }
    };
    return (
      <>
        <Card
          // extra={rowClusterInfo.provider == "rke" && <Button icon="form" onClick={this.clusterNodeAdd}>添加节点</Button>}
          extra={rowClusterInfo && rowClusterInfo.provider == "rke" && <Button icon="form" onClick={this.clusterNodeAdd}>编辑节点</Button>}
          style={
            { boxShadow: 'rgba(36, 46, 66, 0.16) 2px 4px 10px 0px' }
          }
        >
          {showInfo ?
            <Table
              columns={columns}
              dataSource={nodeList}
              pagination={nodeList && nodeList.length > 10 ? true : false}
              onRow={this.onClickRow}
              rowClassName={styles.rowStyle}
            />
            :
            <Skeleton active />
          }
        </Card>

      </>
    );
  }
}

export default Index;
