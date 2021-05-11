/* eslint-disable no-nested-ternary */
/* eslint-disable no-return-assign */
/* eslint-disable react/no-multi-comp */
/* eslint-disable react/sort-comp */
import {
  Alert,
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Table,
  Tag,
  Tooltip,
  Typography
} from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import cloud from '../../../utils/cloud';
import styles from './index.less';

const { Paragraph } = Typography;

const EditableContext = React.createContext();

const EditableRow = ({ form, index, ...props }) => (
  <EditableContext.Provider value={form}>
    <tr {...props} />
  </EditableContext.Provider>
);

const EditableFormRow = Form.create()(EditableRow);

class EditableCell extends React.Component {
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

  save = e => {
    const { record, handleSave } = this.props;
    this.form.validateFields((error, values) => {
      if (error && error[e.currentTarget.id]) {
        return;
      }
      this.toggleEdit();
      handleSave({ ...record, ...values });
    });
  };

  renderCell = form => {
    this.form = form;
    const { children, dataIndex, record, title } = this.props;
    const { editing } = this.state;
    const rules = [
      {
        required: true,
        message: `${title} 是必需的`
      }
    ];
    if (dataIndex === 'ip' || dataIndex === 'internalIP') {
      rules.push({
        message: '请输入正确的IP地址',
        pattern: new RegExp(
          /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
          'g'
        )
      });
    }
    if (dataIndex === 'sshPort') {
      rules.push({
        message: '请输入正确的端口号',
        min: 1,
        max: 65536,
        pattern: new RegExp(/^[1-9]\d*$/, 'g')
      });
    }
    return editing ? (
      <Form.Item style={{ margin: 0 }}>
        {form.getFieldDecorator(dataIndex, {
          rules,
          initialValue: record[dataIndex]
        })(
          dataIndex === 'roles' ? (
            <Select
              ref={node => (this.input = node)}
              onPressEnter={this.save}
              onBlur={this.save}
              allowClear
              mode="multiple"
            >
              <Select.Option value="controlplane">管理</Select.Option>
              <Select.Option value="etcd">ETCD</Select.Option>
              <Select.Option value="worker">计算</Select.Option>
            </Select>
          ) : dataIndex === 'sshPort' ? (
            <InputNumber
              ref={node => (this.input = node)}
              onPressEnter={this.save}
              onBlur={this.save}
              min={1}
              max={65536}
            />
          ) : (
            <Input
              ref={node => (this.input = node)}
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
          style={{ paddingRight: 24, cursor: 'pointer' }}
          onClick={this.toggleEdit}
        >
          {children}
        </div>
      </Tooltip>
    );
  };

  render() {
    const {
      editable,
      dataIndex,
      title,
      record,
      index,
      handleSave,
      children,
      disable,
      ...restProps
    } = this.props;
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
      initNodeCmd: ''
    };
  }

  componentDidMount = () => {
    this.setNodeList();
    this.loadInitNodeCmd();
  };

  setNodeList = () => {
    const { nodeList } = this.props;
    for (let i = 0; i < nodeList.length; i++) {
      nodeList[i].key = `key${i}`;
      if (!nodeList[i].sshPort || nodeList[i].sshPort === 0) {
        nodeList[i].sshPort = 22;
      }
      nodeList[i].disable = true;
    }
    this.setState({ dataSource: nodeList, count: nodeList.length });
  };

  loadInitNodeCmd = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'cloud/getInitNodeCmd',
      callback: data => {
        this.setState({ initNodeCmd: data.cmd });
      }
    });
  };

  updateCluster = () => {
    const { dispatch, eid, onOK, clusterID } = this.props;
    const { dataSource } = this.state;
    if (dataSource.length < 1) {
      message.warning('请定义集群节点');
    }
    this.setState({ loading: true });
    dispatch({
      type: 'cloud/updateKubernetesCluster',
      payload: {
        enterprise_id: eid,
        clusterID,
        provider: 'rke',
        nodes: dataSource
      },
      callback: data => {
        if (data && onOK) {
          onOK(data);
        }
      },
      handleError: res => {
        if (res && res.data && res.data.code === 7005) {
          onOK(res.data.data);
          return;
        }
        cloud.handleCloudAPIError(res);
        this.setState({ loading: false });
      }
    });
  };

  handleDelete = key => {
    const dataSource = [...this.state.dataSource];
    this.setState({ dataSource: dataSource.filter(item => item.key !== key) });
  };
  getNextIP = () => {
    const { count, dataSource } = this.state;
    let init = `192.168.1.${count + 1}`;
    if (dataSource.length > 0 && dataSource[dataSource.length - 1].ip !== '') {
      const ips = dataSource[dataSource.length - 1].ip.split('.');
      if (ips.length > 3) {
        init = `${ips.slice(0, 3).join('.')}.${Number(ips[3]) + 1}`;
      }
    }
    return init;
  };
  getNextInternalIP = () => {
    const { count, dataSource } = this.state;
    let init = `192.168.1.${count + 1}`;
    if (
      dataSource.length > 0 &&
      dataSource[dataSource.length - 1].internalIP !== ''
    ) {
      const ips = dataSource[dataSource.length - 1].internalIP.split('.');
      if (ips.length > 3) {
        init = `${ips.slice(0, 3).join('.')}.${Number(ips[3]) + 1}`;
      }
    }
    return init;
  };
  handleAdd = () => {
    const { count, dataSource } = this.state;
    const newData = {
      key: count,
      ip: this.getNextIP(),
      internalIP: this.getNextInternalIP(),
      sshPort: 22,
      roles: ['etcd', 'controlplane', 'worker']
    };
    if (count > 2) {
      newData.roles = ['worker'];
    }
    this.setState({
      dataSource: [...dataSource, newData],
      count: count + 1
    });
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
  render() {
    const { onCancel } = this.props;
    const { getFieldDecorator } = this.props.form;
    const { loading, dataSource, initNodeCmd } = this.state;
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
        width: '150px',
        editable: true
      },
      {
        title: '内网 IP 地址',
        dataIndex: 'internalIP',
        width: '150px',
        editable: true
      },
      {
        title: 'SSH 端口',
        dataIndex: 'sshPort',
        width: '100px',
        editable: true
      },
      {
        title: '节点类型',
        dataIndex: 'roles',
        width: '220px',
        editable: true,
        render: text =>
          text.map(item => <Tag color="blue">{this.nodeRole(item)}</Tag>)
      },
      {
        title: '操作',
        dataIndex: 'name',
        render: (text, record) =>
          this.state.dataSource.length > 1 && !record.disable ? (
            <Popconfirm
              title="确定要删除吗?"
              onConfirm={() => this.handleDelete(record.key)}
            >
              <a>删除</a>
            </Popconfirm>
          ) : null
      }
    ];
    const columnEdits = columns.map(col => {
      if (!col.editable) {
        return col;
      }
      return {
        ...col,
        onCell: record => {
          if (record.disable) {
            return {
              record,
              editable: false,
              dataIndex: col.dataIndex,
              title: col.title
            };
          }
          return {
            record,
            editable: col.editable,
            dataIndex: col.dataIndex,
            title: col.title,
            handleSave: this.handleSave
          };
        }
      };
    });
    return (
      <Modal
        visible
        title="扩容 Kubernetes 集群"
        className={styles.TelescopicModal}
        width={800}
        destroyOnClose
        footer={
          <Popconfirm
            title="确定已完成所有节点的初始化并开始扩容集群吗?"
            onConfirm={this.updateCluster}
          >
            {' '}
            <Button type="primary">开始扩容</Button>
          </Popconfirm>
        }
        confirmLoading={loading}
        onCancel={onCancel}
        maskClosable={false}
      >
        <Alert
          type="warning"
          message="集群节点扩容特别是管理节点、ETCD节点扩容具有一定风险，请选择合适的时间进行"
        />
        <Form>
          <Row>
            <Col span={24} style={{ padding: '16px' }}>
              <Paragraph className={styles.describe}>
                <ul>
                  <li>
                    <span>
                      采用 RKE 方案基于提供的主机安装 Kubernetes 集群。
                    </span>
                  </li>
                  <li>
                    <span>
                      请确保提供的主机<b>SSH端口</b>和<b>6443端口</b>
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
                    <span>Kubernetes 集群扩容成功后自动纳入平台管理。</span>
                  </li>
                </ul>
              </Paragraph>
            </Col>
          </Row>
          <Row>
            <Col span={24} style={{ padding: '0 16px' }}>
              <Form.Item label="节点列表(已有节点不支持变更)">
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
              <Button onClick={this.handleAdd} style={{ marginBottom: 16 }}>
                增加节点
              </Button>
            </Col>
          </Row>
          <Row style={{ padding: '0 16px' }}>
            <span style={{ fontWeight: 600, color: 'red' }}>
              请在所有节点先执行以下初始化命令（执行用户需要具有sudo权限）：
            </span>
            <Col span={24} style={{ marginTop: '16px' }}>
              <span className={styles.cmd}>{initNodeCmd}</span>
            </Col>
          </Row>
        </Form>
      </Modal>
    );
  }
}
