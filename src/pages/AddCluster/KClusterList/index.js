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

const plainOptions = ['ETCD', 'Controlplane', 'Worker'];
const defaultCheckedList = ['ETCD', 'Controlplane'];

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
      visible: true,
      confirmLoading: false,
      checkedList: defaultCheckedList,
      registrationCmd: '',
      copyText: ''
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
    const { checkedList } = this.state;
    this.setState({
      copyText: this.initializeCmd('http://127.0.0.1:7070', checkedList)
    })
  }
  initializeCmd(ip, node) {
    let cmd = `CATTLE_AGENT_FALLBACK_PATH="/opt/rke2/bin" curl -fL ${ip}/system-agent-install.sh | sudo CATTLE_AGENT_FALLBACK_PATH="/opt/rke2/bin" sh -s - --server ${ip} --label 'cattle.io/os=linux' --token jfklsbsz4zkwxts4m8lfz5ddvkmh25bjh7b2dwrs6cvmjhv4qk4jjp --ca-checksum b63362daf75923d1b674268fc4d4f701473ce2e9ff54937906809245a99d1028${this.getNodeInfo(node)}`
    console.log(cmd, "cmd");
    return cmd
  }
  getNodeInfo = (list) => {
    let result = '';
    if (list && list.length > 0) {
      result = list.map(e => `  --${e.toLowerCase()}`).join(' ');
    }
    return result;
  }
  onChange = checkedList => {
    this.setState({
      checkedList
    }, () => {
      const { checkedList } = this.state;
      this.setState({
        copyText: this.initializeCmd('http://127.0.0.1:7070', checkedList)
      })
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

  render() {
    const {
      match: {
        params: { eid, provider }
      },
      location: {
        query: { clusterID, updateKubernetes }
      }
    } = this.props;
    const {
      visible,
      confirmLoading,
      copyText
    } = this.state
    const columns = [
      {
        title: '状态',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: '名称',
        dataIndex: 'address',
        key: 'address',
      },
      {
        title: '节点',
        dataIndex: 'age',
        key: 'age',
      },
      {
        title: '外网/内网 IP',
        dataIndex: 'age',
        key: 'age',
      },
      {
        title: '操作系统',
        dataIndex: 'age',
        key: 'age',
      },
      {
        title: '角色',
        dataIndex: 'age',
        key: 'age',
      },
      {
        title: '存活时间',
        dataIndex: 'age',
        key: 'age',
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
            description="请至少等待一个管理节点、一个ETCD节点和一个计算节点各自完成注册。"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          <Table dataSource={[]} columns={columns} />
        </Card>
        {visible && 
        <RKEClusterCmd onCancel={this.handleCancel}/>
        }
      </PageHeaderLayout>
    );
  }
}
