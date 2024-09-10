/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import { Button, Card, Col, Form, Row, Steps, Tooltip, Alert, Table, Modal, Checkbox, notification, Icon } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import RKEClusterCmd from '../../../components/RKEClusterCmd'
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import globalUtil from '../../../utils/global';
import userUtil from '../../../utils/user';

const { Step } = Steps;
const CheckboxGroup = Checkbox.Group;

const plainOptions = ['ETCD', 'control-plane', 'Worker'];
const defaultCheckedList = ['ETCD', 'control-plane'];

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
      nextBtnstatus: {}
    };
  }
  componentWillMount() {
    const { adminer } = this.state;
    const { dispatch, location: {
      query: { event_id }
    } } = this.props;
    if (!adminer) {
      dispatch(routerRedux.push(`/`));
    }else{
      this.setState({
        eventId:event_id == undefined ? window.localStorage.getItem('event_id') : event_id
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
    const {eventId} = this.state
    dispatch({
      type: 'region/fetchClusterInfoList',
      payload: {
        event_id: eventId
      },
      callback: res => {
        if (res && res.status_code == 200) {
          this.setState({
            clusterInfoList: res.response_data.data.bean,
            nextBtnstatus: this.countRoles(res.response_data.data.bean),
          },()=>{
            this.handleTimers(
              'timer',
              () => {
                this.fetchClusterInfoList();
              },
              3000
            );
          })
        }
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
    dispatch(routerRedux.push(`/enterprise/${eid}/clusters`));
  };
  preStep = () => {
    const { dispatch } = this.props;
    const {
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch(routerRedux.push(`/enterprise/${eid}/addCluster`));
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
    if (type == 'last') {
      dispatch(routerRedux.push(`/enterprise/${eid}/addCluster`));
    } else {
      dispatch(routerRedux.push(`/enterprise/${eid}/provider/${provider}/kclusters/init`));
    }
  }

  countRoles = (clusterInfoList) => {
    if (clusterInfoList && clusterInfoList.length > 0) {
      const allRoles = clusterInfoList.flatMap(info => info.roles.split(', ').filter(role => role.trim() !== '')).map(role => role.trim());
      // 使用 reduce 来统计每个角色的数量
      const countObj = allRoles.reduce((acc, role) => {
        if (role in acc) {
          acc[role]++;
        } else {
          acc[role] = 1;
        }
        return acc;
      }, {});
      const requiredRoles = ['etcd'];
      for (let role of requiredRoles) {
        if (!(role in countObj)) {
          return { disabled: true, msg: "缺少etcd节点" };
        }
      }
      if (countObj['etcd'] % 2 === 1) {
        return { disabled: false, msg: '' };
      } else {
        return { disabled: true, msg: "etcd节点个数应为单数" };
      }
    } else {
      return { disabled: true, msg: "暂无任何节点信息" };
    }
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
      eventId
    } = this.state
    const columns = [
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
      },
      {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: '外网/内网 IP',
        dataIndex: 'age',
        key: 'age',
      },
      {
        title: '操作系统',
        dataIndex: 'os_image',
        key: 'os_image',
      },
      {
        title: '角色',
        dataIndex: 'roles',
        key: 'roles',
      },
      {
        title: '存活时间',
        dataIndex: 'uptime',
        key: 'uptime',
      },
    ];
    return (
      <PageHeaderLayout
        title={<FormattedMessage id='enterpriseColony.button.text' />}
        content={<FormattedMessage id='enterpriseColony.PageHeaderLayout.content' />}
        titleSvg={pageheaderSvg.getSvg('clusterSvg', 18)}
      >
        <Row style={{ marginBottom: '16px' }}>
          <Steps current={1}>
            {this.loadSteps().map(item => (
              <Step key={item.title} title={item.title} />
            ))}
          </Steps>
        </Row>
        <Card
          title="主机列表"
          extra={<Button type="primary" onClick={this.showModal}>添加节点</Button>}
        >
          <Alert
            message="注意"
            description="请至少等待一个ETCD节点完成注册，且ETCD节点数量为单数，方可进行下一步。"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          <Table dataSource={clusterInfoList} columns={columns} />
        </Card>
        {visible &&
          <RKEClusterCmd onCancel={this.handleCancel} eventId={eventId}/>
        }
        <div style={{display:'flex',justifyContent:'center',marginTop:24}}>
        <Button onClick={() => this.lastOrNextSteps('last')} style={{marginRight:24}}>上一步</Button>
        <Tooltip title={nextBtnstatus.msg}>
          <Button onClick={() => this.lastOrNextSteps('next')} type="primary" disabled={nextBtnstatus.disabled}>下一步</Button>
        </Tooltip>
        </div>

      </PageHeaderLayout>
    );
  }
}
