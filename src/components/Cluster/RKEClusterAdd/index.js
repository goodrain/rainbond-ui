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
  Typography,
  Badge,
  Spin
} from 'antd';
import copy from 'copy-to-clipboard';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { rkeconfig } from '../../../services/cloud';
import cloud from '../../../utils/cloud';
import global from '../../../utils/global';
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
  validateIP = (_, value, callback) => {
    if (value.startsWith('127')) {
      callback(`${formatMessage({ id: 'enterpriseColony.addCluster.ipcheck1' })}}`);
    } else if (value.startsWith('169.254')) {
      callback(`${formatMessage({ id: 'enterpriseColony.addCluster.ipcheck2' })}}`);
    } else if (value.startsWith('224.0.0')) {
      callback(`${formatMessage({ id: 'enterpriseColony.addCluster.ipcheck3' })}}`);
    } else {
      callback();
    }
  };

  renderCell = form => {
    this.form = form;
    const { children, dataIndex, record, title, dataSource } = this.props;
    const { editing } = this.state;
    const rules = [
      {
        required: true,
        message: formatMessage({ id: 'enterpriseColony.addCluster.host.Required' }, { title: title })
      },
    ];
    const ips = dataIndex === 'ip';
    if (ips) {
      rules.push({
        message: formatMessage({ id: 'enterpriseColony.addCluster.host.correct_IP' }),
        pattern: new RegExp(ipRegs, 'g')
      },{
        validator: this.validateIP 
      });
    }
    const port = dataIndex === 'port';
    if (port) {
      rules.push({
        message: formatMessage({ id: 'enterpriseColony.addCluster.host.Correct_port' }),
        min: 1,
        max: 65536,
        pattern: new RegExp(portRegs, 'g')
      });
    }
    const initialValues = record[dataIndex];
    return editing || ('ips' && !initialValues) ? (
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
            >
              <Select.Option value="server">server</Select.Option>
              <Select.Option value="agent">agent</Select.Option>
            </Select>
          ) : port ? (
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
              placeholder={formatMessage({ id: 'enterpriseColony.addCluster.host.placese_input' }, { title: title })}
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
              style={{
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap', width: '100%'
              }}
            />
          )
        )}
      </Form.Item>
    ) : (
      <Tooltip title={<FormattedMessage id='enterpriseColony.addCluster.host.click_edit' />}>
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
      clusters: null,
      isCheckSsh: false,
      isCheckStatus: false,
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
        if (!nodeList[i].port || nodeList[i].port === 0) {
          nodeList[i].port = 22;
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
                    helpError = `${formatMessage({ id: 'enterpriseColony.addCluster.host.input_ip' })}`;
                    helpType = 'ip';
                  } else if (!ipRegs.test(item.internalIP || '')) {
                    helpError = `${formatMessage({ id: 'enterpriseColony.addCluster.host.input_ip' })}`;
                    helpType = 'internalIP';
                  } else if (!portRegs.test(item.port || '')) {
                    helpError = `${formatMessage({ id: 'enterpriseColony.addCluster.host.input_port' })}`;
                    helpType = 'port';
                  } else if (item.port > 65536) {
                    helpType = 'port';
                    helpError = `${formatMessage({ id: 'enterpriseColony.addCluster.host.port_max' })}`;
                  } else if (!item.roles) {
                    helpType = 'roles';
                    helpError = `${formatMessage({ id: 'enterpriseColony.addCluster.host.mast' })}`;
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
            this.handleStartCheck(isNext)
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
              helpError: formatMessage({ id: 'enterpriseColony.addCluster.host.rke' })
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
    if (dataSource && dataSource.length === 0) {
      message.warning('请定义集群节点');
    }
    form.validateFields((error, values) => {
      if (!error) {
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

  createCluster = () => {
    const { form, dispatch, eid, clusterID } = this.props;
    const { dataSource, yamlVal } = this.state;
    if (clusterID) {
      this.updateCluster();
      return null;
    }
    form.validateFields((err, fieldsValue) => {
      if (!err) {

        const etcdCount = dataSource.reduce((acc, curr) => {
          return acc + (curr.roles.includes("etcd") ? 1 : 0);
        }, 0);
        // 判断 "etcd" 出现的总次数是否为奇数
        const isOdd = etcdCount % 2 === 1;
        if(isOdd){
          this.setState({ loading: true });
          this.handleCheckSsh(fieldsValue)
        } else {
          notification.warning({
            message: 'etcd节点数量必须为奇数'
          });
        }
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
      user: '',
      password: '',
      port: 22,
      roles: 'server',
      node_name: '',
    };
    // if (count > 2) {
    //   newData.roles = ['worker'];
    // }
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
          message: formatMessage({ id: 'notification.warn.yaml_file' })
        });
      }
      return false;
    }
    return true;
  };
  nodeRole = role => {
    switch (role) {
      case 'control-plane':
        return `${formatMessage({ id: 'enterpriseColony.addCluster.host.Administration' })}`;
      case 'worker':
        return `${formatMessage({ id: 'enterpriseColony.addCluster.host.calculation' })}`;
      case 'etcd':
        return 'ETCD';
      default:
        return `${formatMessage({ id: 'enterpriseColony.addCluster.host.unkonw' })}`;
    }
  };
  handleStartCheck = (isNext) => {
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
          helpError: formatMessage({ id: 'enterpriseColony.addCluster.host.input_rke' })
        });
      }
      if (!err && next) {
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
    const ipArr = dataSource.map(item => {
      return {
        ip: item.ip,
        internalIP: item.internalIP,
      }
    });
    const jsonString = JSON.stringify(ipArr);
    // 使用localStorage存储JSON字符串
    window.localStorage.setItem("ipAddresses", jsonString);
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
  // 检查ssh
  handleCheckSsh = () => {
    const { dataSource, isCheckSsh, activeKey } = this.state;
    const { dispatch, form, eid } = this.props;
    let name
    let nodeList = []
    form.validateFields((err, values) => {
      if (!err) {
        name = values.name
        this.handleCheck(false)
        dataSource.forEach(item => {
          delete item.code;
        });
        this.setState({
          isCheckStatus: true,
          dataSource
        })
        let arr = []
        for (let i = 0, l = dataSource.length; i < l; i++) {
          let data = {
            id: i,
            host: dataSource[i].ip,
            pass: String(dataSource[i].password),
            port: Number(dataSource[i].port),
            user: dataSource[i].user,
            role: dataSource[i].roles,
            node_name: dataSource[i].node_name,
          }
          arr.push(this.getCode(data))
        }
        Promise.all(arr).then(values => {
          values.map((item, index) => {
            dataSource[index].code = item.codeNum;
            dataSource[index].status = item.status;
            let itemNode = {
              host: item.host,
              pass: item.pass,
              port: item.port,
              user: item.user,
              role: item.role,
              node_name: item.node_name
            }
            nodeList.push(itemNode)
            setTimeout(() => {
              this.setState({ dataSource, isCheckSsh: !isCheckSsh }, () => {
                if (dataSource.length === values.length) {
                  const filterArr = dataSource.filter(v => v.status != true)
                  if (filterArr.length > 0) {
                    this.setState({
                      isCheckStatus: false,
                    })
                  } else {
                    this.setState(
                      {
                        loading: true
                      },
                      () => {
                        if (index + 1 === dataSource.length) {
                          this.handleCreate(name, nodeList)
                        }
                      }
                    );
                  }
                }
              })
            }, 10)
          })
        }, reason => {
          console.log(reason)
        }
        );
      }
    })
  }

  getCode(data) {
    const { dataSource, isCheckSsh } = this.state
    const { dispatch } = this.props;
    let defaultData = data
    delete defaultData.id
    return new Promise((resolve, reject) => {
      dispatch({
        type: 'cloud/fetchCheckSshPwd',
        payload: {
          data: JSON.stringify(defaultData)
        },
        callback: res => {
          if (res && res.response_data.code === 200) {
            data.status = res.response_data.data.status;
            data.codeNum = res.response_data.code;
            setTimeout(() => {
              this.setState({
                dataSource,
                isCheckSsh: data.id,
              })
            }, 10)
            resolve(data)
          }
        },
        handleError: err => {
          reject(err)
        }
      })
    })
  }
  handleCreate = (name, nodeList) => {
    const { dispatch, eid, onOK } = this.props;
    dispatch({
      type: 'cloud/AddClusterRke2',
      payload: {
        eid,
        name: name,
        nodes: nodeList
      },
      callback: res => {
        this.setState({
          loading: false,
          isCheckStatus: false,
        })
        if (res && res.response_data && res.response_data.code === 200) {
          notification.success({ message: res.response_data.msg });
          onOK(res.response_data.clusterID)
        } else {
          notification.warning({ message: res.response_data.msg });
        }
      },
      handleError: err => {
        notification.error({ message: err.data.msg })
        this.setState({
          loading: false,
          isCheckStatus: false
        })
      }
    })
  }

  handleChangeCheckSsh = () => {
    this.setState({
      isCheckSsh: true
    })
  }
  onClickDocsLink = () => {
    // 跳转到外面的文档地址
    window.open('https://rainbond.com/docs/troubleshooting/installation/ui')
  }
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
      clusters,
      isCheckSsh,
      isCheckStatus
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
        title: formatMessage({ id: 'enterpriseColony.RainbondClusterInit.form.label.nodesForChaos' }),
        dataIndex: 'node_name',
        width: 120,
        editable: true
      },
      {
        title: formatMessage({ id: 'enterpriseColony.addCluster.host.ip' }),
        dataIndex: 'ip',
        width: 120,
        editable: true
      },
      {
        title: formatMessage({ id: 'enterpriseColony.addCluster.host.ssh_port' }),
        dataIndex: 'port',
        width: 80,
        editable: true
      },
      {
        title: formatMessage({ id: 'enterpriseColony.addCluster.host.user' }),
        dataIndex: 'user',
        width: 120,
        editable: true
      },
      {
        title: formatMessage({ id: 'enterpriseColony.addCluster.host.password' }),
        dataIndex: 'password',
        width: 120,
        editable: true,
      },
      {
        title: formatMessage({ id: 'enterpriseColony.addCluster.host.Node_type' }),
        dataIndex: 'roles',
        width: 80,
        editable: true,
      },
      {
        title: formatMessage({ id: 'enterpriseColony.addCluster.host.Detection_status' }),
        dataIndex: 'msg',
        width: 80,
        render: (text, record) => {
          const { code, status } = record
          return code ? (
            <div>
              <div>
                { status ? <div style={{ color: global.getPublicColor('success-color') }}>success</div> : <div style={{ color: global.getPublicColor('error-color') }}>error</div>}
              </div>
            </div>
          ) : (
            <div>
              {isCheckStatus ?
                <div>
                  {formatMessage({ id: 'enterpriseColony.addCluster.host.checking' })} <Spin spinning={isCheckStatus} />
                </div> :
                (
                  <div>
                    {formatMessage({ id: 'enterpriseColony.addCluster.host.await_check' })}
                  </div>
                )}
            </div>
          )
        }
      },
      {
        title: formatMessage({ id: 'enterpriseColony.addCluster.host.operation' }),
        dataIndex: 'name',
        width: 80,
        align: 'center',
        render: (_, record) => {
          return dataSource && dataSource.length > 1 ? (
            <Popconfirm
              title={<FormattedMessage id='enterpriseColony.addCluster.host.delete' />}
              onConfirm={() => this.handleDelete(record.key)}
            >
              <a><FormattedMessage id='button.delete' /></a>
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
        title={clusterID ? <FormattedMessage id='enterpriseColony.addCluster.host.Configure_cluster' /> : <FormattedMessage id='enterpriseColony.addCluster.host.Host' />}
        className={styles.TelescopicModal}
        width={1200}
        destroyOnClose
        footer={
          <Fragment>
            <Button
              type="primary"
              style={(guideStep && guideStep === 6 && {
                position: 'relative',
                zIndex: 1000,
              }) || {}}
              disabled={isCheckStatus}
              onClick={() => {
                this.handleCheckSsh()
              }}
              loading={loading}
            >
              {clusterID ? <FormattedMessage id='enterpriseColony.addCluster.host.updata' /> : (isCheckStatus ? formatMessage({ id: 'enterpriseColony.addCluster.host.checking' }) : <FormattedMessage id='enterpriseColony.addCluster.host.start_install' />)}
            </Button>
            {guideStep && guideStep === 6 && handleNewbieGuiding && clusters && clusters.length === 0 && (
              <Fragment>
                {handleNewbieGuiding({
                  tit: formatMessage({ id: 'enterpriseColony.addCluster.host.start_install_six' }),
                  send: true,
                  configName: 'kclustersAttention',
                  desc: formatMessage({ id: 'enterpriseColony.addCluster.host.Start_installation_now' }),
                  nextStep: 7,
                  btnText: formatMessage({ id: 'button.install' }),
                  conPosition: { right: '110px', bottom: 0 },
                  svgPosition: { right: '50px', marginTop: '-11px' },
                  handleClick: () => {
                    this.handleCheckSsh()
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

        {clusterID && (
          <Alert
            type="warning"
            message={<FormattedMessage id='enterpriseColony.addCluster.host.suitable' />}
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
                    <span><FormattedMessage id='enterpriseColony.addCluster.host.provided_hosts' /></span>
                  </li>
                  <li>
                    <span>
                      <FormattedMessage id='enterpriseColony.addCluster.host.provided_host' />{!clusterID && <FormattedMessage id='enterpriseColony.addCluster.host.and_ip' />}
                      <b><FormattedMessage id='enterpriseColony.addCluster.host.and_ssh' /></b><FormattedMessage id='enterpriseColony.addCluster.host.and' /><b><FormattedMessage id='enterpriseColony.addCluster.host.port' /></b>
                      <FormattedMessage id='enterpriseColony.addCluster.host.visit' />
                    </span>
                  </li>
                  <li>
                    <span>
                      <FormattedMessage id='enterpriseColony.addCluster.host.script' /><b><FormattedMessage id='enterpriseColony.addCluster.host.System_check' /></b>、<b><FormattedMessage id='enterpriseColony.addCluster.host.secret_free' /></b>、
                      <b><FormattedMessage id='enterpriseColony.addCluster.host.docker' /></b><FormattedMessage id='enterpriseColony.addCluster.host.movements' />
                    </span>
                  </li>
                  <li>
                    <span>
                      <FormattedMessage id='enterpriseColony.addCluster.host.already_installed' />
                      <b> 1.19.x</b>
                    </span>
                  </li>
                </ul>
              </Paragraph>

              {guideStep && guideStep === 3 && handleNewbieGuiding && clusters && clusters.length === 0 && (
                <Fragment>
                  {handleNewbieGuiding({
                    tit: formatMessage({ id: 'enterpriseColony.addCluster.host.matters_attention' }),
                    send: false,
                    configName: 'kclustersAttention',
                    showSvg: false,
                    showArrow: true,
                    desc: formatMessage({ id: 'enterpriseColony.addCluster.host.explain' }),
                    nextStep: 4,
                    conPosition: { left: '0px', bottom: '-100px' }
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
                  label={<FormattedMessage id='enterpriseColony.addCluster.host.name_Cluster' />}
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
                      { required: true, message: formatMessage({ id: 'enterpriseColony.addCluster.host.required' }) },
                      {
                        pattern: /^[a-z0-9A-Z-]+$/,
                        message: formatMessage({ id: 'enterpriseColony.addCluster.host.supported' })
                      },
                      { max: 24, message: formatMessage({ id: 'enterpriseColony.addCluster.host.max' }) }
                    ]
                  })(<Input placeholder={formatMessage({ id: 'enterpriseColony.addCluster.host.only' })}
                    style={{
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    }} />)}
                </Form.Item>
                {guideStep && guideStep === 4 && handleNewbieGuiding && clusters && clusters.length === 0 && (
                  <Fragment>
                    {handleNewbieGuiding({
                      tit: formatMessage({ id: 'enterpriseColony.addCluster.host.input_name' }),
                      showSvg: false,
                      showArrow: true,
                      send: false,
                      configName: 'kclustersAttention',
                      desc: formatMessage({ id: 'enterpriseColony.addCluster.host.configuration_information' }),
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
            <TabPane tab={<FormattedMessage id='enterpriseColony.addCluster.host.Visual_configuration' />} key="1">
              <div>
                <Row>
                  <Col span={24} style={{ padding: '0 16px' }}>
                    <Form.Item
                      label={<FormattedMessage id='enterpriseColony.addCluster.host.list' />}
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
                          rowKey={(record,index) => index}
                          columns={columnEdits}
                          components={components}
                          bordered
                          key={isCheckSsh}
                          rowClassName={() => 'editable-row'}
                          pagination={false}
                        />
                      )}
                    </Form.Item>
                    <Button
                      onClick={this.handleAdd}
                      style={{ marginBottom: 16 }}
                    >
                      <FormattedMessage id='enterpriseColony.addCluster.host.add_node' />
                    </Button>
                  </Col>
                </Row>
              </div>
            </TabPane>
          </Tabs>
          {guideStep && guideStep === 5 && handleNewbieGuiding && clusters && clusters.length === 0 && (
            <Fragment>
              {handleNewbieGuiding({
                tit: formatMessage({ id: 'enterpriseColony.addCluster.host.Fill_in_node' }),
                showSvg: false,
                showArrow: false,
                send: true,
                btnText: '我知道了',
                configName: 'kclustersAttention',
                desc: formatMessage({ id: 'enterpriseColony.addCluster.host.configuration_information' }),
                nextStep: 6,
                conPosition: { top: '240px', left: '200px' },
              })}
            </Fragment>
          )}
          <div style={{ display: activeKey === '1' ? 'none' : 'block' }}>
            {((clusterID && activeKey === '2') || !clusterID) && (
              <CodeMirrorForm
                help={helpError}
                data={yamlVal || ''}
                label={<FormattedMessage id='enterpriseColony.addCluster.host.RKE_cluste_configuration' />}
                bg="151718"
                width="1000px"
                marginTop={120}
                setFieldsValue={setFieldsValue}
                formItemLayout={formItemLayout}
                Form={Form}
                getFieldDecorator={getFieldDecorator}
                beforeUpload={this.beforeUpload}
                mode="yaml"
                name="yamls"
                message={<FormattedMessage id='enterpriseColony.addCluster.host.input_rke' />}
              />
            )}
          </div>
        </Form>
      </Modal>
    );
  }
}
