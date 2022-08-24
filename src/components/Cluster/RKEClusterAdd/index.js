/* eslint-disable no-unused-expressions */
/* eslint-disable consistent-return */
/* eslint-disable react/no-unused-state */
/* eslint-disable react/jsx-indent */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-return-assign */
/* eslint-disable react/no-multi-comp */
/* eslint-disable react/sort-comp */
import CodeMirrorForm from '@/components/CodeMirrorForm';
import {
  Alert,
  Button,
  Col,
  Form,
  Icon,
  Input,
  InputNumber,
  message,
  Modal,
  notification,
  Popconfirm,
  Row,
  Select,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography
} from 'antd';
import copy from 'copy-to-clipboard';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import { rkeconfig } from '../../../services/cloud';
import cloud from '../../../utils/cloud';
import styles from './index.less';

const { Paragraph } = Typography;
const { TabPane } = Tabs;
const ipRegs = /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
const portRegs = /^[1-9]\d*$/;

const EditableContext = React.createContext();

const EditableRow = ({ form, index, ...props }) => {
  return (
    <EditableContext.Provider value={form}>
      <tr {...props} />
    </EditableContext.Provider>
  );
};

const EditableFormRow = Form.create()(EditableRow);

class EditableCell extends React.Component {
  componentWillMount() {
    const { handleClustersMount } = this.props;
    if (handleClustersMount) {
      handleClustersMount(this);
    }
  }
  state = {
    editing: false
  };
  toggleEdit = () => {
    const editing = !this.state.editing;
    this.setState({ editing }, () => {
      if (editing) {
        this.input.focus();
      }
    });
  };

  save = (e, targets) => {
    const { record, handleSave } = this.props;
    this.form.validateFields((error, values) => {
      handleSave({ ...record, ...values });
      if (error && error[targets || (e && e.currentTarget.id)]) {
        return;
      }
      this.toggleEdit();
    });
  };

  renderCell = form => {
    this.form = form;
    const { children, dataIndex, record, title, dataSource } = this.props;
    const { editing } = this.state;
    const rules = [
      {
        required: true,
        message: `${title} 是必需的`
      }
    ];
    const ips = dataIndex === 'ip' || dataIndex === 'internalIP';
    if (ips) {
      rules.push({
        message: '请输入正确的IP地址',
        pattern: new RegExp(ipRegs, 'g')
      });
    }
    const sshPort = dataIndex === 'sshPort';
    if (sshPort) {
      rules.push({
        message: '请输入正确的端口号',
        min: 1,
        max: 65536,
        pattern: new RegExp(portRegs, 'g')
      });
    }
    const initialValues = record[dataIndex];
    return editing || (ips && !initialValues) ? (
      <Form.Item style={{ margin: 0 }}>
        {form.getFieldDecorator(dataIndex, {
          rules,
          initialValue: initialValues
        })(
          dataIndex === 'roles' ? (
            <Select
              getPopupContainer={triggerNode => triggerNode.parentNode}
              ref={node => (this.input = node)}
              onPressEnter={this.save}
              onBlur={() => {
                this.save(false, dataIndex);
              }}
              allowClear
              mode="multiple"
            >
              <Select.Option value="controlplane">管理</Select.Option>
              <Select.Option value="etcd">ETCD</Select.Option>
              <Select.Option value="worker">计算</Select.Option>
            </Select>
          ) : sshPort ? (
            <InputNumber
              style={{ width: '100%' }}
              ref={node => (this.input = node)}
              onPressEnter={this.save}
              onBlur={this.save}
              min={1}
              max={65536}
            />
          ) : (
            <Input
              placeholder={`请输入${title}`}
              ref={node => {
                this.input = node;
                if (
                  dataIndex === 'ip' &&
                  !initialValues &&
                  dataSource &&
                  dataSource.length > 1
                ) {
                  node.focus();
                }
              }}
              onPressEnter={this.save}
              onBlur={this.save}
            />
          )
        )}
      </Form.Item>
    ) : (
      <Tooltip title="点击修改">
        <div
          className="editable-cell-value-wrap"
          style={{ cursor: 'pointer' }}
          onClick={this.toggleEdit}
        >
          {children}
        </div>
      </Tooltip>
    );
  };

  render() {
    const { editable, children, ...restProps } = this.props;
    return (
      <td {...restProps}>
        {editable ? (
          <EditableContext.Consumer>{this.renderCell}</EditableContext.Consumer>
        ) : (
          children
        )}
      </td>
    );
  }
}

@Form.create()
@connect()
export default class RKEClusterConfig extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      dataSource: [],
      count: 0,
      isCheck: false,
      yamlVal: '',
      initNodeCmd: '',
      activeKey: '1',
      helpError: '',
      helpType: '',
      forbiddenConfig: true,
      countConfig: true,
      countNum: 15,
      countContent: null,
      clusters: null
    };
    this.clusters = [];
  }

  componentDidMount = () => {
    const { clusterID } = this.props;
    this.loadInitNodeCmd();
    this.loadClusters();
    if (clusterID) {
      this.setNodeList();
    } else {
      this.fetchRkeconfig();
      this.handleAdd();
    }
  };

  loadClusters = () => {
    const {
      dispatch,
      eid 
    } = this.props;
    dispatch({
      type: 'region/fetchEnterpriseClusters',
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.list) {
          const clusters = [];
          res.list.map((item, index) => {
            item.key = `cluster${index}`;
            clusters.push(item);
            return item;
          });
          this.setState({ clusters });
        } else {
          this.setState({ clusters: [] });
        }
      }
    });
  };
  setNodeList = () => {
    const { nodeList, rkeConfig, form } = this.props;
    const { setFieldsValue } = form;
    if (nodeList && nodeList.length > 0) {
      for (let i = 0; i < nodeList.length; i++) {
        nodeList[i].key = Math.random();
        if (!nodeList[i].sshPort || nodeList[i].sshPort === 0) {
          nodeList[i].sshPort = 22;
        }
        nodeList[i].disable = true;
      }
    }

    if (rkeConfig) {
      const val = this.decodeBase64Content(rkeConfig);
      setFieldsValue({
        yamls: val
      });
      this.setState({
        yamlVal: val
      });
    }

    this.setState({
      dataSource: nodeList || [],
      count: (nodeList && nodeList.length) || 0
    });
  };

  handleClustersMount = com => {
    this.clusters = com;
  };
  encodeBase64Content = commonContent => {
    const base64Content = Buffer.from(commonContent).toString('base64');
    return base64Content;
  };

  decodeBase64Content = base64Content => {
    let commonContent = base64Content.replace(/\s/g, '+');
    commonContent = Buffer.from(commonContent, 'base64').toString();
    return commonContent;
  };
  loadInitNodeCmd = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'cloud/getInitNodeCmd',
      callback: res => {
        const info = (res && res.response_data) || {};
        const data = (res && res.response_data && res.data) || {};
        const cmd = (res && res.cmd) || data.cmd || info.cmd;
        this.setState({ initNodeCmd: cmd });
      }
    });
  };
  fetchRkeconfig = (obj = {}, isNext) => {
    const { form, eid } = this.props;
    const { activeKey } = this.state;
    const { setFieldsValue } = form;
    const info = Object.assign({}, obj, { enterprise_id: eid });
    rkeconfig(info)
      .then(res => {
        if (res && res.status_code === 200 && res.response_data) {
          const data = res.response_data || {};
          const { encodeRKEConfig, nodes } = data;
          const val = this.decodeBase64Content(encodeRKEConfig);
          setFieldsValue({
            yamls: val
          });
          let helpError = '';
          let helpType = '';
          if (nodes) {
            if (nodes && nodes.length) {
              nodes.map(item => {
                item.key = Math.random();
                if (isNext) {
                  if (!ipRegs.test(item.ip || '')) {
                    helpError = '请输入正确的IP地址';
                    helpType = 'ip';
                  } else if (!ipRegs.test(item.internalIP || '')) {
                    helpError = '请输入正确的IP地址';
                    helpType = 'internalIP';
                  } else if (!portRegs.test(item.sshPort || '')) {
                    helpError = '请输入正确的端口号';
                    helpType = 'sshPort';
                  } else if (item.sshPort > 65536) {
                    helpType = 'sshPort';
                    helpError = '端口号最大65536';
                  } else if (!item.roles) {
                    helpType = 'roles';
                    helpError = '节点类型是必须的';
                  }
                }
              });
            }
            if (helpError) {
              this.handleCheck(false);
            }
            this.setState({
              helpType,
              helpError,
              dataSource: nodes
            });
          }
          this.setState({
            yamlVal: val
          });
          if (activeKey === '1' && isNext && helpError) {
            notification.warning({ message: helpError });
          }
          if (isNext && !helpError) {
            this.handleStartCheck(isNext);
          }
        }
      })
      .catch(err => {
        if (err) {
          const code = err.data ? err.data.code : err.code;

          if (!code) {
            if (isNext) {
              this.setState({
                activeKey: '2'
              });
            }
            this.setState({
              isCheck: false,
              helpType: 'RKE',
              helpError: 'RKE集群配置不合格、请重新配置'
            });
            return null;
          }
        }
        this.handleCheck(false);
        cloud.handleCloudAPIError(err);
      });
  };

  updateCluster = () => {
    const { dispatch, eid, clusterID, form } = this.props;
    const { dataSource, yamlVal } = this.state;
    if (dataSource && dataSource.length === 0) {
      message.warning('请定义集群节点');
    }
    form.validateFields((error, values) => {
      if (!error) {
        this.setState({ loading: true });
        dispatch({
          type: 'cloud/updateKubernetesCluster',
          payload: {
            enterprise_id: eid,
            clusterID,
            provider: 'rke',
            encodedRKEConfig: this.encodeBase64Content(values.yamls || yamlVal)
          },
          callback: data => {
            this.handleOk(data && data.response_data);
          },
          handleError: res => {
            this.handleError(res);
          }
        });
      }
    });
  };

  createCluster = () => {
    const { form, dispatch, eid, clusterID } = this.props;
    if (clusterID) {
      this.updateCluster();
      return null;
    }
    form.validateFields((err, fieldsValue) => {
      if (!err) {
        this.setState({ loading: true });

        dispatch({
          type: 'cloud/createKubernetesCluster',
          payload: {
            enterprise_id: eid,
            provider_name: 'rke',
            encodedRKEConfig: this.encodeBase64Content(fieldsValue.yamls),
            ...fieldsValue
          },
          callback: data => {
            this.handleOk(data);
          },
          handleError: res => {
            this.handleError(res);
          }
        });
      }
    });
  };
  handleOk = data => {
    const { onOK } = this.props;
    if (data && onOK) {
      onOK(data || {});
    }
  };
  handleError = res => {
    const { onOK } = this.props;
    if (res && res.data && res.data.code === 7005 && onOK) {
      onOK(res.data.data);
      return;
    }
    cloud.handleCloudAPIError(res);
    this.setState({ loading: false });
  };
  handleDelete = key => {
    const dataSource = [...this.state.dataSource];
    this.setState({ dataSource: dataSource.filter(item => item.key !== key) });
  };

  handleEnvGroup = (callback, handleError) => {
    if (this.clusters && this.clusters.form) {
      this.clusters.form.validateFields(
        {
          force: true
        },
        err => {
          if (!err && callback) {
            return callback();
          }
          handleError();
        }
      );
    } else if (handleError) {
      handleError();
    }
    return false;
  };
  handleAdd = () => {
    const { count, dataSource } = this.state;
    const newData = {
      key: Math.random(),
      ip: '',
      internalIP: '',
      sshPort: 22,
      roles: ['etcd', 'controlplane', 'worker']
    };
    if (count > 2) {
      newData.roles = ['worker'];
    }
    const updata = () => {
      this.setState({
        dataSource: [...dataSource, newData],
        count: count + 1
      });
    };
    this.handleEnvGroup(updata, updata);
  };

  handleSave = row => {
    const newData = [...this.state.dataSource];
    const index = newData.findIndex(item => row.key === item.key);
    const item = newData[index];
    newData.splice(index, 1, {
      ...item,
      ...row
    });
    this.setState({ dataSource: newData });
  };
  beforeUpload = (file, isMessage) => {
    const fileArr = file.name.split('.');
    const { length } = fileArr;
    const isRightType =
      fileArr[length - 1] === 'yaml' || fileArr[length - 1] === 'yml';
    if (!isRightType) {
      if (isMessage) {
        notification.warning({
          message: '请上传以.yaml、.yml结尾的 Region Config 文件'
        });
      }
      return false;
    }
    return true;
  };
  nodeRole = role => {
    switch (role) {
      case 'controlplane':
        return '管理';
      case 'worker':
        return '计算';
      case 'etcd':
        return 'ETCD';
      default:
        return '未知';
    }
  };
  handleStartCheck = isNext => {
    let next = false;
    const { activeKey } = this.state;
    if (activeKey === '1') {
      this.handleEnvGroup(
        () => {
          next = true;
        },
        () => {
          this.handleActiveKey('1');
          this.handleCheck(false);
        }
      );
    } else {
      next = true;
    }

    this.props.form.validateFields(err => {
      if (next && err && err.yamls) {
        this.handleActiveKey('2');
        next = false;
      }
      if (err && err.yamls) {
        this.setState({
          isCheck: false,
          helpType: 'RKE',
          helpError: '填写RKE集群配置'
        });
      }
      if (!err && next) {
        console.log('2')
        this.handleCheck(next);
      }
    });
    if (next && isNext) {
      this.createCluster();
    }
  };
  handleCheck = isCheck => {
    this.setState(
      {
        isCheck,
        forbiddenConfig: true,
        countNum: 15,
        countConfig: true,
        countContent: null
      },

      () => {
        const { guideStep } = this.props;
        isCheck && guideStep !== 7 && this.handleCountDown();
        !isCheck && clearInterval(this.timerId);
      }
    );
  };
  handleActiveKey = activeKey => {
    this.setState({
      activeKey
    });
  };
  handleTabs = (key, isNext = false) => {
    const { dataSource, yamlVal } = this.state;
    const { form } = this.props;
    const { getFieldValue } = form;
    const info = {};
    const yamls = getFieldValue('yamls') || yamlVal;
    if (yamls || (dataSource && dataSource.length > 0)) {
      if (key === '2') {
        info.nodes = dataSource;
        info.encodedRKEConfig = yamls && this.encodeBase64Content(yamls);
      } else {
        info.encodedRKEConfig = yamls && this.encodeBase64Content(yamls);
      }
    }
    this.fetchRkeconfig(info, isNext);
    if (!isNext) {
      this.handleActiveKey(`${key}`);
    }
  };
  // 倒计时处理
  handleCountDown = () => {
    let { countNum } = this.state;
    this.setState({
      countConfig: false,
      countContent: `${countNum}s`
    });
    this.timerId = setInterval(() => {
      this.setState({ countNum: countNum--, countContent: `${countNum}s` });
      if (countNum < 0) {
        clearInterval(this.timerId);
        this.setState(() => ({
          forbiddenConfig: false,
          countConfig: true
        }));
        return null;
      }
    }, 1000);
  };
  render() {
    const {
      onCancel,
      form,
      clusterID,
      guideStep,
      handleNewbieGuiding
    } = this.props;
    const { getFieldDecorator, setFieldsValue } = form;
    const {
      helpType,
      helpError,
      loading,
      dataSource,
      initNodeCmd,
      isCheck,
      activeKey,
      yamlVal,
      forbiddenConfig,
      countContent,
      countConfig,
      clusters
    } = this.state;
    const formItemLayout = {
      labelCol: {
        xs: { span: 3 }
      },
      wrapperCol: {
        xs: { span: 24 }
      }
    };

    const components = {
      body: {
        row: EditableFormRow,
        cell: EditableCell
      }
    };
    const columns = [
      {
        title: 'IP 地址',
        dataIndex: 'ip',
        width: 150,
        editable: true
      },
      {
        title: '内网 IP 地址',
        dataIndex: 'internalIP',
        width: 170,
        editable: true
      },
      {
        title: 'SSH 端口',
        dataIndex: 'sshPort',
        width: 140,
        editable: true
      },
      {
        title: '节点类型',
        dataIndex: 'roles',
        width: 160,
        editable: true,
        render: text =>
          text &&
          text.length > 0 &&
          text.map(item => <Tag color="blue">{this.nodeRole(item)}</Tag>)
      },
      {
        title: '操作',
        dataIndex: 'name',
        width: 80,
        align: 'center',
        render: (_, record) => {
          return dataSource && dataSource.length > 1 ? (
            <Popconfirm
              title="确定要删除吗?"
              onConfirm={() => this.handleDelete(record.key)}
            >
              <a>删除</a>
            </Popconfirm>
          ) : (
            '-'
          );
        }
      }
    ];
    const columnEdits = columns.map(col => {
      if (!col.editable) {
        return col;
      }
      return {
        ...col,
        onCell: record => {
          return {
            record,
            helpType,
            helpError,
            index: record.key,
            editable: col.editable,
            dataIndex: col.dataIndex,
            title: col.title,
            dataSource,
            handleClustersMount: this.handleClustersMount,
            handleSave: this.handleSave
          };
        }
      };
    });
    const highlighted = {
      position: 'relative',
      zIndex: 1000,
      background: '#fff'
    };

    return (
      <Modal
        visible
        title={clusterID ? '配置集群' : '基于主机安装集群'}
        className={styles.TelescopicModal}
        width={900}
        destroyOnClose
        footer={
          <Fragment>
            <Button
              type="primary"
              onClick={() => {
                this.handleStartCheck();
              }}
              loading={loading}
            >
              {clusterID ? '更新集群' : '开始安装'}
            </Button>
            {guideStep && guideStep === 6 && handleNewbieGuiding && clusters && clusters.length === 0  && (
              <Fragment>
                {handleNewbieGuiding({
                  tit: '6.开始安装',
                  send: true,
                  configName: 'kclustersAttention',
                  desc: '确认RKE集群配置信息填写正确并立即开始安装。',
                  nextStep: 7,
                  btnText: formatMessage({id:'button.install'}),
                  conPosition: { right: '110px', bottom: 0 },
                  svgPosition: { right: '50px', marginTop: '-11px' },
                  handleClick: () => {
                    this.handleStartCheck();
                  }
                })}
              </Fragment>
            )}
          </Fragment>
        }
        confirmLoading={loading}
        onCancel={onCancel}
        maskClosable={false}
      >
        {isCheck && (
          <Modal
            title={`确定已完成所有节点的初始化并开始
            ${clusterID ? '配置' : formatMessage({id:'button.install'})}
           集群吗?`}
            confirmLoading={loading}
            className={styles.TelescopicModal}
            width={900}
            visible
            footer={[
              <Button
                key="back"
                onClick={() => {
                  this.handleCheck(false);
                }}
              >
                取消
              </Button>,
              <Button
                key="link"
                type="primary"
                onClick={() => {
                  this.setState(
                    {
                      loading: true
                    },
                    () => {
                      this.handleTabs(activeKey === '1' ? '2' : '1', true);
                    }
                  );
                }}
                disabled={forbiddenConfig}
              >
                {(!countConfig &&
                  `我已在所有节点执行上述命令,开始安装(${countContent})`) ||
                  ' 我已在所有节点执行上述命令,开始安装'}
              </Button>
            ]}
          >
            <Row style={{ padding: '0 16px' }}>
              <span style={{ fontWeight: 600, color: 'red' }}>
                请在开始{clusterID ? '配置前在新加' : '安装前所有'}
                节点先执行以下初始化命令（执行用户需要具有sudo权限）：
              </span>

              <Col span={24} style={{ marginTop: '16px' }}>
                <span className={styles.cmd}>
                  <Icon
                    className={styles.copy}
                    type="copy"
                    onClick={() => {
                      copy(initNodeCmd);
                      notification.success({ message: '复制成功' });
                    }}
                  />
                  {guideStep &&
                    guideStep === 7 &&
                    handleNewbieGuiding({
                      tit: '节点的初始化',
                      send: true,
                      configName: 'nodeInitialization',
                      handleClick: () => {
                        copy(initNodeCmd);
                        this.handleCountDown();
                      },
                      handleClosed: () => {
                        this.handleCountDown();
                      },
                      desc:
                        '请复制上述命令完成所有节点的初始化,点击确定、请等待 RKE 集群安装完成。',
                      prevStep: false,
                      btnText: '复制命令',
                      nextStep: 8,
                      conPosition: { left: '0', bottom: '-156px' },
                      svgPosition: { right: '-20px', marginTop: '-11px' }
                    })}
                  {initNodeCmd}
                </span>
              </Col>
            </Row>
          </Modal>
        )}

        {clusterID && (
          <Alert
            type="warning"
            message="集群节点配置特别是管理节点、ETCD节点配置具有一定风险，请选择合适的时间进行"
          />
        )}
        <Form>
          <Row>
            <Col span={24} style={{ padding: '16px' }}>
              <Paragraph
                className={styles.describe}
                style={(guideStep && guideStep === 3 && highlighted) || {}}
              >
                <ul>
                  <li>
                    <span>基于提供的主机安装集群。</span>
                  </li>
                  <li>
                    <span>
                      请确保提供的主机{!clusterID && '的 IP 地址的'}
                      <b>SSH 端口</b>和<b>6443端口</b>
                      都可以被当前网络直接访问。
                    </span>
                  </li>
                  <li>
                    <span>
                      节点初始化脚本会进行<b>系统检查</b>、<b>配置SSH免密</b>、
                      <b>Docker安装</b>三项动作。
                    </span>
                  </li>
                  <li>
                    <span>
                      如果你的主机已经安装 Docker，请确保不能大于
                      <b>19.03.x</b> 和低于
                      <b>1.13.x</b> 版本。
                    </span>
                  </li>
                </ul>
              </Paragraph>

              {guideStep && guideStep === 3 && handleNewbieGuiding && clusters && clusters.length === 0 && (
                <Fragment>
                  {handleNewbieGuiding({
                    tit: '注意事项',
                    send: false,
                    configName: 'kclustersAttention',
                    showSvg: false,
                    showArrow: true,
                    desc: '注意查看主机需要满足的前提条件和安装说明。',
                    nextStep: 4,
                    conPosition: { right: '15px', bottom: '-134px' }
                  })}
                </Fragment>
              )}
            </Col>
          </Row>
          {!clusterID && (
            <Row>
              <Col
                span={12}
                style={{
                  padding: guideStep && guideStep === 4 ? '' : '0 16px'
                }}
              >
                <Form.Item
                  label="集群名称"
                  style={
                    (guideStep &&
                      guideStep === 4 &&
                      Object.assign({}, { padding: '0 16px' }, highlighted)) ||
                    {}
                  }
                >
                  {getFieldDecorator('name', {
                    initialValue: '',
                    rules: [
                      { required: true, message: '集群名称必填' },
                      {
                        pattern: /^[a-z0-9A-Z-]+$/,
                        message: '只支持字母、数字和中划线组合'
                      },
                      { max: 24, message: '最大长度24位' }
                    ]
                  })(<Input placeholder="集群名称,请确保其保持唯一" />)}
                </Form.Item>
                {guideStep && guideStep === 4 && handleNewbieGuiding && clusters && clusters.length === 0  && (
                  <Fragment>
                    {handleNewbieGuiding({
                      tit: '填写集群名称',
                      showSvg: false,
                      showArrow: true,
                      send: false,
                      configName: 'kclustersAttention',
                      desc:
                        '填写RKE集群的配置信息，初次体验单节点也可以进行安装哦。',
                      nextStep: 5,
                      conPosition: { marginTop: '-22px' }
                    })}
                  </Fragment>
                )}
              </Col>
            </Row>
          )}

          <Tabs
            activeKey={activeKey}
            onChange={key => {
              this.handleTabs(key);
            }}
          >
            <TabPane tab="可视化配置" key="1">
              <div>
                <Row>
                  <Col span={24} style={{ padding: '0 16px' }}>
                    <Form.Item
                      label="节点列表"
                      style={
                        (guideStep &&
                          guideStep === 5 &&
                          Object.assign(
                            {},
                            { padding: '0 16px' },
                            highlighted
                          )) ||
                        {}
                      }
                    >
                      {getFieldDecorator('nodeLists', {
                        initialValue: ''
                      })(
                        <Table
                          dataSource={dataSource}
                          columns={columnEdits}
                          components={components}
                          bordered
                          rowClassName={() => 'editable-row'}
                          pagination={false}
                        />
                      )}
                    </Form.Item>
                    <Button
                      onClick={this.handleAdd}
                      style={{ marginBottom: 16 }}
                    >
                      增加节点
                    </Button>
                  </Col>
                </Row>
              </div>
            </TabPane>
            <TabPane tab="自定义配置" key="2" />
          </Tabs>
          {guideStep && guideStep === 5 && handleNewbieGuiding && clusters && clusters.length === 0 && (
            <Fragment>
              {handleNewbieGuiding({
                tit: '填写节点',
                showSvg: false,
                showArrow: true,
                send: false,
                configName: 'kclustersAttention',
                desc: '填写RKE集群的配置信息，初次体验单节点也可以进行安装哦。',
                nextStep: 6,
                conPosition: { bottom: '-14px', left: '39px' }
              })}
            </Fragment>
          )}
          <div style={{ display: activeKey === '1' ? 'none' : 'block' }}>
            {((clusterID && activeKey === '2') || !clusterID) && (
              <CodeMirrorForm
                help={helpError}
                data={yamlVal || ''}
                label="RKE集群配置"
                bg="151718"
                width="100%"
                marginTop={120}
                setFieldsValue={setFieldsValue}
                formItemLayout={formItemLayout}
                Form={Form}
                getFieldDecorator={getFieldDecorator}
                beforeUpload={this.beforeUpload}
                mode="yaml"
                name="yamls"
                message="填写RKE集群配置"
              />
            )}
          </div>
        </Form>
      </Modal>
    );
  }
}
