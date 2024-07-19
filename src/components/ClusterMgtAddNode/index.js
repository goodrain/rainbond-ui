import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  notification,
  Popconfirm,
  Row,
  Select,
  Table,
  Tooltip,
  Spin
} from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import global from '@/utils/global';

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
    this.handleAdd();
  };

  handleClustersMount = com => {
    this.clusters = com;
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
    const { loading } = this.state
    if (loading) {
      notification.warning({message: '检测中请勿操作'})
      return
    }
    const dataSource = [...this.state.dataSource];
    this.setState({ dataSource: dataSource.filter(item => item.key !== key) });
  };

  handleEnvGroup = (callback, handleError) => {
    let flag
    if (this.clusters && this.clusters.form) {
      this.clusters.form.validateFields(
        {
          force: true
        },
        err => {
          if (!err && callback) {
            flag = true
            return callback();
          }
          flag = false
          handleError();
        }
      );
    } else if (handleError) {
      flag = false
      handleError();
    }
    return flag;
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
    const updata = () => {
      this.setState({
        dataSource: [...dataSource, newData],
        count: count + 1
      });
    };
    this.handleEnvGroup(updata, updata);
  };
  handleAddValidate = () => {
    const { dataSource } = this.state;
    const updata = () => {
      this.setState({
        dataSource: [...dataSource]
      });
    };
    return this.handleEnvGroup(updata, updata);
  }

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
  handleClose = (type) => {
    // type: 0 => 点击右上角触发关闭弹窗, 1 => 添加节点成功触发关闭弹窗
    this.props.onAddNodeClose(type)
  }
  // 添加节点
  handleCreateNode = (nodeList) => {
    const { dispatch, rowClusterInfo } = this.props
    dispatch({
      type: 'region/addClusterNode',
      payload: {
        enterprise_id: rowClusterInfo.enterprise_id,
        clusterID: rowClusterInfo.region_id,
        data: nodeList
      },
      callback: res => {
        if (res && res.response_data && res.response_data.code === 200) {
          notification.success({message: res.response_data.msg})
          this.setState({
            loading: false
          })
          this.handleClose(1)
        }
      },
      handleError: err => {

      }
    })
  }
  // 检查ssh
  handleCheckSsh = () => {
    const { dataSource, isCheckSsh, activeKey } = this.state;
    const { dispatch, form, eid } = this.props;
    let nodeList = []

    this.handleCheck(false)
    dataSource.forEach(item => {
      delete item.code;
    });
    this.setState({
      isCheckStatus: true,
      dataSource,
      loading: true,
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
                  loading: false,
                })
              } else {
                if (index + 1 === dataSource.length) {
                  this.setState({
                    isCheckStatus: false
                  })
                  this.handleCreateNode(nodeList)
                }
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
  // 检测节点账号密码是否正确
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
            handleSave: this.handleSave,
          };
        }
      };
    });

    return (
      <Modal
        visible
        title={formatMessage({ id: 'enterpriseColony.mgt.cluster.addNode' })}
        width={1200}
        destroyOnClose
        footer={
          <Fragment>
            <Button
              disabled={isCheckStatus}
              type='primary'
              onClick={() => {
                this.handleAddValidate() && this.handleCheckSsh()
              }}
              loading={loading}
            >
              {isCheckStatus ? formatMessage({ id: 'enterpriseColony.addCluster.host.checking' }) : <FormattedMessage id='enterpriseColony.mgt.cluster.addNode' />}
            </Button>
          </Fragment>
        }
        confirmLoading={loading}
        onCancel={() => this.handleClose(0)}
        maskClosable={false}
      >
        <Form>
          <div>
            <Row>
              <Col span={24} style={{ padding: '0 16px' }}>
                <Form.Item>
                  {getFieldDecorator('nodeLists', {
                    initialValue: ''
                  })(
                    <Table
                      dataSource={dataSource}
                      rowKey={(record, index) => index}
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
                  disabled={loading}
                >
                  <FormattedMessage id='enterpriseColony.addCluster.host.add_node' />
                </Button>
              </Col>
            </Row>
          </div>
        </Form>
      </Modal>
    );
  }
}
