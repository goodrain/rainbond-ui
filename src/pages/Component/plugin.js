/* eslint-disable no-multi-assign */
/* eslint-disable react/no-multi-comp */
/* eslint-disable react/jsx-no-undef */
/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-console */
/* eslint-disable camelcase */
/* eslint-disable no-sparse-arrays */
import {
  Button,
  Card,
  Col,
  Form,
  Icon,
  Input,
  List,
  Modal,
  notification,
  Radio,
  Row,
  Select,
  Spin,
  Table,
  Tooltip
} from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import ConfirmModal from '../../components/ConfirmModal';
import EditStorageConfig from '../../components/EditStorageConfig';
import MemoryForm from '../../components/MemoryForm';
import NoPermTip from '../../components/NoPermTip';
import appPluginUtil from '../../utils/appPlugin';
import globalUtil from '../../utils/global';
import pluginUtil from '../../utils/plugin';
import styles from './Index.less';

const { Option } = Select;

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const FormItem = Form.Item;
@Form.create()
class UpdateMemory extends PureComponent {
  handleOk = () => {
    const { onOk } = this.props;
    this.props.form.validateFields((err, values) => {
      if (!err && onOk) {
        values.min_cpu = Number(values.min_cpu);
        onOk(values);
      }
    });
  };

  render() {
    const { minCpu, memory, form, onCancel } = this.props;
    const { getFieldDecorator } = form;

    return (
      <Modal title="资源配置" visible onOk={this.handleOk} onCancel={onCancel}>
        <Form onSubmit={this.handleOk} layout="horizontal">
          <MemoryForm
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 19 }}
            form={form}
            FormItem={Form.Item}
            initialValue={memory}
            setkey="memory"
            getFieldDecorator={getFieldDecorator}
          />
          <Form.Item
            label="CPU"
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 19 }}
          >
            {getFieldDecorator('min_cpu', {
              initialValue: minCpu || 0,
              rules: [
                {
                  required: true,
                  message: '请输入CPU'
                },
                {
                  pattern: new RegExp(/^[0-9]\d*$/, 'g'),
                  message: '只允许输入整数'
                }
              ]
            })(
              <Input
                type="number"
                min={0}
                addonAfter="m"
                placeholder="请输入CPU"
              />
            )}
            <div style={{ color: '#999999', fontSize: '12px' }}>
              CPU分配额0为不限制，1000m=1core。
            </div>
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

// eslint-disable-next-line react/no-multi-comp
@Form.create()
class ConfigItems extends PureComponent {
  componentWillReceiveProps() {}
  onChange = (val, index) => {
    const { data } = this.props;
    data &&
      data.map((item, i) => {
        if (index === i) {
          item.attr_value = val;
        }
        return item;
      });
    this.props.onChange && this.props.onChange(data);
    this.forceUpdate();
  };
  renderItem = (item, index) => {
    if (item.attr_type === 'string') {
      return (
        <FormItem
          style={{
            width: '90%'
          }}
          label={
            <Tooltip title={item.attr_info || item.attr_name}>
              <div className={styles.nowarpText}>
                {' '}
                {item.attr_name}
                {item.attr_info ? <span>({item.attr_info})</span> : ''}{' '}
              </div>
            </Tooltip>
          }
        >
          <Input
            disabled={!item.is_change}
            defaultValue={
              item.attr_value ? item.attr_value : item.attr_default_value
            }
            onChange={e => {
              this.onChange(e.target.value, index);
            }}
          />
        </FormItem>
      );
    }
    if (item.attr_type === 'radio') {
      const options = item.attr_alt_value.split(',');
      return (
        <FormItem
          style={{
            width: '90%'
          }}
          label={
            <Tooltip title={item.attr_info || item.attr_name}>
              <div className={styles.nowarpText}>
                {' '}
                {item.attr_name}
                {item.attr_info ? <span>({item.attr_info})</span> : ''}{' '}
              </div>
            </Tooltip>
          }
        >
          <Select
            getPopupContainer={triggerNode => triggerNode.parentNode}
            onChange={val => {
              this.onChange(val, index);
            }}
            disabled={!item.is_change}
            value={item.attr_value || item.attr_default_value || ''}
          >
            {options.map(v => (
              <Option key={v} value={v}>
                {v}
              </Option>
            ))}
          </Select>
        </FormItem>
      );
    }
    if (item.attr_type === 'checkbox') {
      const options = item.attr_alt_value.split(',');
      return (
        <FormItem
          style={{
            width: '90%'
          }}
          label={
            <Tooltip title={item.attr_info || item.attr_name}>
              <div className={styles.nowarpText}>
                {' '}
                {item.attr_name}
                {item.attr_info ? <span>({item.attr_info})</span> : ''}{' '}
              </div>
            </Tooltip>
          }
        >
          <Select
            getPopupContainer={triggerNode => triggerNode.parentNode}
            disabled={!item.is_change}
            onChange={val => {
              this.onChange(val.join(','), index);
            }}
            value={(item.attr_value || item.attr_default_value || '').split(
              ','
            )}
            mode="multiple"
          >
            {options.map(v => (
              <Option key={v} value={v}>
                {v}
              </Option>
            ))}
          </Select>
        </FormItem>
      );
    }
  };
  render() {
    const data = this.props.data || [];
    return (
      <Form layout="vertical">
        <Row>
          {data.map((item, index) => (
            <Col span="8">{this.renderItem(item, index)}</Col>
          ))}
        </Row>
      </Form>
    );
  }
}

// 下游应用端口类配置组
// eslint-disable-next-line react/no-multi-comp
class ConfigDownstreamPort extends PureComponent {
  constructor(props) {
    super(props);
    const { data } = this.props;
    this.state = {
      currApp: data[0].dest_service_alias,
      currPort: data[0].port,
      config_name: data[0].config_group_name,
      currAppLoading: false
    };
  }
  getAppByName = appAlias =>
    this.props.data.filter(item => item.dest_service_alias === appAlias);
  handleAppChange = appAlias => {
    const apps = this.getAppByName(appAlias);
    this.setState(
      {
        currAppLoading: true
      },
      () => {
        this.setState({
          currApp: appAlias,
          currPort: apps[0].port,
          currAppLoading: false
        });
      }
    );
  };
  handlePortChange = port => {
    this.setState(
      {
        currAppLoading: true
      },
      () => {
        this.setState({ currPort: port, currAppLoading: false });
      }
    );
  };
  getCurrPorts = () => {
    const apps = this.getAppByName(this.state.currApp);
    return apps.map(item => item.port);
  };
  getCurrData = () => {
    const { currPort } = this.state;
    const { currApp } = this.state;
    const apps = this.getAppByName(currApp);
    return apps.filter(item => item.port === currPort)[0];
  };
  getApps = () => {
    const { data } = this.props;
    const n = [];
    const apps = [];
    data.map(item => {
      if (n.indexOf(item.dest_service_alias) == -1) {
        n.push(item.dest_service_alias);
        apps.push({
          dest_service_alias: item.dest_service_alias,
          dest_service_cname: item.dest_service_cname,
          port: item.port
        });
      }
    });
    return apps;
  };
  render() {
    const currData = this.getCurrData();
    const {
      currPort,
      currApp,
      config_name: configName,
      currAppLoading
    } = this.state;
    const ports = this.getCurrPorts();
    const apps = this.getApps();
    return (
      <Card
        style={{
          marginBottom: 24
        }}
        type="inner"
        title={
          <div>
            {configName}
            <span
              style={{
                marginRight: 24,
                marginLeft: 16
              }}
            >
              下游应用:{' '}
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                onChange={this.handleAppChange}
                value={currApp}
              >
                {apps.map(
                  item =>
                    item && (
                      <Option
                        key={item.dest_service_alias + item.port}
                        value={item.dest_service_alias}
                      >
                        {item.dest_service_cname}
                      </Option>
                    )
                )}
              </Select>
            </span>{' '}
            <span style={{ marginRight: 24 }}>
              {' '}
              端口号 :{' '}
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                onChange={this.handlePortChange}
                value={currPort}
              >
                {ports.map(item => (
                  <Option value={item}>{item}</Option>
                ))}
              </Select>{' '}
            </span>{' '}
            <span style={{ marginRight: 24 }}>
              端口协议: {currData.protocol}
            </span>{' '}
          </div>
        }
      >
        {currAppLoading ? (
          <Spin />
        ) : (
          <ConfigItems onChange={this.handleOnChange} data={currData.config} />
        )}
      </Card>
    );
  }
}

// 应用端口类配置组
// eslint-disable-next-line react/no-multi-comp
class ConfigUpstreamPort extends PureComponent {
  constructor(props) {
    super(props);
    const { data } = this.props;
    if (data.length > 0) {
      this.state = {
        currAppLoading: false,
        currPort: data[0].port,
        config_name: data[0].config_group_name
      };
    }
  }
  handlePortChange = port => {
    this.setState(
      {
        currAppLoading: true
      },
      () => {
        this.setState({ currPort: port, currAppLoading: false });
      }
    );
  };
  getCurrData = port => this.props.data.filter(item => item.port === port)[0];
  render() {
    const { data } = this.props;

    const { currAppLoading, config_name, currPort } = this.state;
    const currData = this.getCurrData(currPort);
    return (
      <>
        <Card
          style={{
            marginBottom: 24
          }}
          type="inner"
          title={
            <div>
              {config_name}
              <span
                style={{
                  marginRight: 24,
                  marginLeft: 16
                }}
              >
                端口号:{' '}
                <Select
                  getPopupContainer={triggerNode => triggerNode.parentNode}
                  onChange={this.handlePortChange}
                  value={currPort}
                >
                  {data.map(item => (
                    <Option key={item.port} value={item.port}>
                      {item.port}
                    </Option>
                  ))}
                </Select>
              </span>{' '}
              <span style={{ marginRight: 24 }}>
                {' '}
                端口协议 : {currData.protocol}{' '}
              </span>{' '}
            </div>
          }
        >
          {currAppLoading ? (
            <Spin />
          ) : (
            <ConfigItems
              onChange={this.handleOnChange}
              data={currData.config}
            />
          )}
        </Card>
      </>
    );
  }
}

// 不依赖的配置组
// eslint-disable-next-line react/no-multi-comp
class ConfigUnDefine extends PureComponent {
  render() {
    const data = this.props.data || [];
    const configName = this.props.data.config_group_name;
    return (
      <>
        <h4>配置组</h4>
        <Card
          style={{
            marginBottom: 24
          }}
          type="inner"
          title={<div>{configName}</div>}
        >
          <ConfigItems onChange={this.handleOnChange} data={data.config} />
        </Card>
      </>
    );
  }
}
// 存储管理
@connect(
  ({ user, loading }) => ({
    currUser: user.currentUser,
    loading: loading.appControl
  }),
  null,
  null,
  { withRef: true }
)
class StorageManage extends PureComponent {
  state = {
    editStoragData: false
  };
  handleSubmitStorageConfig = (vals, data) => {
    const team_name = globalUtil.getCurrTeamName();
    const {
      pluginInfo: { plugin_id, configs, appAlias },
      dispatch
    } = this.props;
    const newData = JSON.parse(JSON.stringify(data)) || {};
    const newVals = JSON.parse(JSON.stringify(vals)) || {};
    const newConfigs = JSON.parse(JSON.stringify(configs)) || {};
    const { attr_value } = newData;
    const str = (attr_value && JSON.parse(attr_value)) || {};
    newData.volume_name = str.volume_name = newVals.volume_name;
    newData.volume_path = str.volume_path = newVals.volume_path;
    newData.attr_type = str.volume_type = newVals.volume_type;
    newData.file_content = str.file_content = newVals.file_content || '';
    newData.attr_value = str && JSON.stringify(str);
    if (newConfigs && newConfigs.storage_env && newConfigs.storage_env.config) {
      const {
        storage_env: { config }
      } = newConfigs;
      newConfigs.storage_env.config =
        config &&
        config.map(item => {
          if (item.attr_name === newData.attr_name) {
            item = newData;
          }
          return item;
        });
    }

    // 更新配置
    dispatch({
      type: 'appControl/editPluginConfigs',
      payload: {
        team_name,
        app_alias: appAlias,
        plugin_id,
        data: newConfigs
      },
      callback: () => {
        notification.success({ message: '修改成功' });
        this.handleCancelAddStorageConfig();
      }
    });
  };
  handleCancelAddStorageConfig = () => {
    this.setState({ editStoragData: false });
  };
  handleEdit = data => {
    this.setState({
      editStoragData: data
    });
  };
  render() {
    const {
      data: { config }
    } = this.props;
    const { editStoragData } = this.state;
    let storageList = [];
    storageList =
      config &&
      config.reduce(
        (pre, current) =>
          current.attr_type === 'config-file' || current.attr_type === 'storage'
            ? [...pre, current]
            : pre,
        []
      );
    storageList.length > 0 &&
      storageList.map(item => {
        const { attr_value } = item;
        const str = (attr_value && JSON.parse(attr_value)) || {};
        item.volume_path = str.volume_path;
        item.volume_name = str.volume_name;
        item.attr_type = str.attr_type;
        item.file_content = str.file_content;
      });

    return (
      <>
        <h4>配置文件和共享存储</h4>
        <Table
          columns={[
            {
              title: '名称',
              dataIndex: 'volume_name'
            },
            {
              title: '挂载路径',
              dataIndex: 'volume_path'
            },
            {
              title: '存储类型',
              dataIndex: 'attr_type',
              render(_, data) {
                const { attr_type } = data;
                return attr_type === 'config-file' ? '配置文件' : '共享存储';
              }
            },
            {
              title: '操作',
              dataIndex: 'action',
              render: (_, data) => {
                return (
                  <a
                    onClick={() => {
                      this.handleEdit(data);
                    }}
                  >
                    修改
                  </a>
                );
              }
            }
          ]}
          dataSource={storageList}
          pagination={false}
        />
        {/* 修改 */}
        {editStoragData && (
          <EditStorageConfig
            onCancel={this.handleCancelAddStorageConfig}
            onSubmit={this.handleSubmitStorageConfig}
            data={this.state.editStoragData} // 编辑数据
            editor // 默认是编辑
          />
        )}
      </>
    );
  }
}
// eslint-disable-next-line react/no-multi-comp
class PluginConfigs extends PureComponent {
  renderConfig = (configs, type, storage_manage = false) => {
    if (type === 'upstream_port') {
      return <ConfigUpstreamPort data={configs} />;
    }
    if (type === 'downstream_port') {
      return (
        <Fragment>
          <ConfigDownstreamPort data={configs} />
        </Fragment>
      );
    }
    if (type === 'un_define') {
      return (
        <Fragment>
          <ConfigUnDefine data={configs} />
        </Fragment>
      );
    }
    if (type === 'storage_env') {
      return (
        <Fragment>
          <StorageManage data={configs} pluginInfo={storage_manage} />
        </Fragment>
      );
    }
    return null;
  };
  render() {
    const configs = this.props.configs || {};
    const undefine_env = configs.undefine_env || {};
    const downstream_env = configs.downstream_env || [];
    const upstream_env = configs.upstream_env || [];
    const storage_env = configs.storage_env || []; // 存储管理

    return (
      <div style={{ padding: '20px 0' }}>
        {JSON.stringify(undefine_env) !== '{}'
          ? this.renderConfig(undefine_env, 'un_define')
          : null}
        {upstream_env.length
          ? this.renderConfig(upstream_env, 'upstream_port')
          : null}
        {downstream_env.length
          ? this.renderConfig(downstream_env, 'downstream_port')
          : null}
        {/* 存储管理 */}
        {JSON.stringify(storage_env) !== '{}'
          ? this.renderConfig(storage_env, 'storage_env', this.props)
          : null}
      </div>
    );
  }
}
// eslint-disable-next-line react/no-multi-comp
@connect(
  ({ user, loading }) => ({
    currUser: user.currentUser,
    loading: loading.appControl
  }),
  null,
  null,
  { withRef: true }
)
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      installedList: null,
      unInstalledList: null,
      category: '',
      type: 'installed',
      showDeletePlugin: null,
      openedPlugin: {}
    };
    this.isInit = true;
  }

  componentDidMount() {
    if (!this.canView()) return;
    this.getPlugins();
  }
  // 是否可以浏览当前界面
  canView() {
    const {
      componentPermissions: { isPlugin }
    } = this.props;
    return isPlugin;
  }
  getPlugins = () => {
    const team_name = globalUtil.getCurrTeamName();
    const app_alias = this.props.appAlias;
    this.props.dispatch({
      type: 'appControl/getPlugins',
      payload: {
        team_name,
        app_alias,
        category: this.state.category
      },
      callback: data => {
        if (data) {
          const installedList = data.bean.installed_plugins || [];
          const unInstalledList = data.bean.not_install_plugins || [];
          this.setState({ installedList, unInstalledList });
          if (this.isInit) {
            this.isInit = false;
            if (!installedList.length) {
              this.setState({ type: 'uninstalled' });
            }
          }
        }
      }
    });
  };
  handleCategoryChange = e => {
    this.setState(
      {
        category: e.target.value
      },
      () => {
        this.getPlugins();
      }
    );
  };
  handleTypeChange = e => {
    this.setState({ type: e.target.value });
  };
  handleStartPlugin = plugin => {
    const team_name = globalUtil.getCurrTeamName();
    const app_alias = this.props.appAlias;
    this.props.dispatch({
      type: 'appControl/startPlugin',
      payload: {
        team_name,
        app_alias,
        plugin_id: plugin.plugin_id
      },
      callback: () => {
        this.getPlugins();
        notification.success({ message: '启用成功' });
      }
    });
  };
  handleStopPlugin = plugin => {
    const team_name = globalUtil.getCurrTeamName();
    const app_alias = this.props.appAlias;
    this.props.dispatch({
      type: 'appControl/stopPlugin',
      payload: {
        team_name,
        app_alias,
        plugin_id: plugin.plugin_id
      },
      callback: () => {
        this.getPlugins();
        notification.success({ message: '停用成功' });
      }
    });
  };
  // 判断是否展开配置
  isOpenedPlugin = plugin => {
    const { openedPlugin } = this.state;
    return !!openedPlugin[plugin.plugin_id];
  };
  openPlugin = plugin => {
    const team_name = globalUtil.getCurrTeamName();
    const app_alias = this.props.appAlias;
    this.props.dispatch({
      type: 'appControl/getPluginConfigs',
      payload: {
        team_name,
        app_alias,
        plugin_id: plugin.plugin_id,
        build_version: plugin.build_version
      },
      callback: data => {
        if (data) {
          const temp = {};
          temp[plugin.plugin_id] = data.bean || {};
          this.setState({
            openedPlugin: Object.assign({}, temp)
          });
        }
      }
    });
  };
  closePlugin = plugin => {
    delete this.state.openedPlugin[plugin.plugin_id];
    this.forceUpdate();
  };
  // 更新配置
  handleUpdateConfig = (plugin_id, data) => {
    const team_name = globalUtil.getCurrTeamName();
    const app_alias = this.props.appAlias;
    this.props.dispatch({
      type: 'appControl/editPluginConfigs',
      payload: {
        team_name,
        app_alias,
        plugin_id,
        data
      },
      callback: () => {
        notification.success({ message: '修改成功' });
      }
    });
  };
  onUpdateMemory = plugin => {
    this.setState({ updateMemory: plugin });
  };
  cancelUpdateMemory = () => {
    this.setState({ updateMemory: null });
  };
  renderInstalled = () => {
    const { installedList } = this.state;
    const loading = this.state.unInstalledList === null;
    return (
      <List
        size="large"
        rowKey="id"
        loading={loading}
        pagination={false}
        dataSource={installedList || []}
        renderItem={item => (
          <div>
            <List.Item
              actions={[
                this.isOpenedPlugin(item) ? (
                  <a
                    onClick={() => {
                      this.closePlugin(item);
                    }}
                    href="javascript:;"
                  >
                    隐藏配置
                  </a>
                ) : (
                  <a
                    onClick={() => {
                      this.openPlugin(item);
                    }}
                    href="javascript:;"
                  >
                    查看配置
                  </a>
                ),
                ,
                appPluginUtil.isStart(item) ? (
                  <a
                    onClick={() => {
                      this.handleStopPlugin(item);
                    }}
                    href="javascript:;"
                  >
                    停用
                  </a>
                ) : (
                  <a
                    onClick={() => {
                      this.handleStartPlugin(item);
                    }}
                    href="javascript:;"
                  >
                    启用
                  </a>
                ),
                <a
                  onClick={() => {
                    this.onUpdateMemory(item);
                  }}
                  href="javascript:;"
                >
                  资源配置
                </a>,
                ,
                <a
                  onClick={() => {
                    this.onDeletePlugin(item);
                  }}
                  href="javascript:;"
                >
                  {' '}
                  卸载{' '}
                </a>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Icon
                    type="api"
                    style={{ fontSize: 40, color: 'rgba(0, 0, 0, 0.2)' }}
                  />
                }
                title={
                  <div>
                    {' '}
                    <Link
                      to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/myplugns/${
                        item.plugin_id
                      }`}
                    >
                      {item.plugin_alias}
                    </Link>{' '}
                    <p style={{ fontSize: 12, color: '#dcdcdc' }}>
                      {' '}
                      <span
                        style={{
                          marginRight: 24
                        }}
                      >
                        类别： {pluginUtil.getCategoryCN(item.category)}
                      </span>{' '}
                      <span
                        style={{
                          marginRight: 24
                        }}
                      >
                        {' '}
                        版本： {item.build_version}{' '}
                      </span>{' '}
                      <span> 内存： {item.min_memory} MB </span>
                    </p>{' '}
                  </div>
                }
                description={item.desc}
              />
            </List.Item>
            {this.isOpenedPlugin(item) ? (
              <Fragment>
                <PluginConfigs
                  configs={this.state.openedPlugin[item.plugin_id] || []}
                  plugin_id={item.plugin_id}
                  appAlias={this.props.appAlias}
                />
                <div
                  style={{
                    textAlign: 'right',
                    marginBottom: 80
                  }}
                >
                  <Button
                    style={{
                      marginRight: 8
                    }}
                    onClick={() => {
                      this.handleUpdateConfig(
                        item.plugin_id,
                        this.state.openedPlugin[item.plugin_id]
                      );
                    }}
                    type="primary"
                  >
                    更新配置
                  </Button>
                  <Button
                    onClick={() => {
                      this.closePlugin(item);
                    }}
                    type="default"
                  >
                    隐藏配置
                  </Button>
                </div>
              </Fragment>
            ) : null}
          </div>
        )}
      />
    );
  };
  renderUnInstalled = () => {
    const { unInstalledList } = this.state;
    const loading = this.state.unInstalledList === null;
    if (!unInstalledList.length) {
      return (
        <center>
          暂无可用插件{' '}
          <Link
            style={{ marginTop: 32 }}
            to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/myplugns`}
          >
            去安装
          </Link>
        </center>
      );
    }
    return (
      <List
        size="large"
        rowKey="id"
        loading={loading}
        pagination={false}
        dataSource={unInstalledList || []}
        renderItem={item => (
          <List.Item
            actions={[
              <a
                onClick={() => {
                  this.installPlugin(item);
                }}
                href="javascript:;"
              >
                {' '}
                开通{' '}
              </a>
            ]}
          >
            <List.Item.Meta
              avatar={
                <Icon
                  type="api"
                  style={{ fontSize: 40, color: 'rgba(0, 0, 0, 0.2)' }}
                />
              }
              title={
                <div>
                  {' '}
                  <Link
                    to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/myplugns/${
                      item.plugin_id
                    }`}
                  >
                    {item.plugin_alias}
                  </Link>{' '}
                  <p style={{ fontSize: 12, color: '#dcdcdc' }}>
                    {' '}
                    <span
                      style={{
                        marginRight: 24
                      }}
                    >
                      类别： {pluginUtil.getCategoryCN(item.category)}
                    </span>{' '}
                    <span> 版本： {item.build_version} </span>
                  </p>{' '}
                </div>
              }
              description={item.desc}
            />
          </List.Item>
        )}
      />
    );
  };
  // 是否有已安装的插件
  hasInstalled = () => {
    const { installedList } = this.state;
    return installedList && !!installedList.length;
  };
  installPlugin = plugin => {
    const team_name = globalUtil.getCurrTeamName();
    const app_alias = this.props.appAlias;
    this.props.dispatch({
      type: 'appControl/installPlugin',
      payload: {
        team_name,
        app_alias,
        plugin_id: plugin.plugin_id,
        build_version: plugin.build_version
      },
      callback: () => {
        notification.success({ message: '开通成功,需要更新才能生效' });
        this.getPlugins();
        this.props.onshowRestartTips(true);
      }
    });
  };
  onDeletePlugin = plugin => {
    this.setState({ showDeletePlugin: plugin });
  };
  cancelDeletePlugin = () => {
    this.setState({ showDeletePlugin: null });
  };
  hanldeUnInstallPlugin = () => {
    const team_name = globalUtil.getCurrTeamName();
    const app_alias = this.props.appAlias;
    const plugin = this.state.showDeletePlugin;
    this.props.dispatch({
      type: 'appControl/unInstallPlugin',
      payload: {
        team_name,
        app_alias,
        plugin_id: plugin.plugin_id
      },
      callback: () => {
        delete this.state.openedPlugin[plugin.plugin_id];
        notification.success({ message: '卸载成功，需要更新才能生效' });
        this.cancelDeletePlugin();
        this.getPlugins();
        this.props.onshowRestartTips(true);
      }
    });
  };
  handleUpdateMemory = (info = {}) => {
    const team_name = globalUtil.getCurrTeamName();
    const app_alias = this.props.appAlias;
    const plugin = this.state.updateMemory;
    this.props.dispatch({
      type: 'appControl/updatePluginMemory',
      payload: {
        team_name,
        app_alias,
        plugin_id: plugin.plugin_id,
        min_memory: info.memory,
        min_cpu: info.min_cpu
      },
      callback: () => {
        this.getPlugins();
        this.cancelUpdateMemory();
        notification.success({ message: '操作成功' });
      }
    });
  };
  render() {
    if (!this.canView()) return <NoPermTip />;
    const { type } = this.state;
    return (
      <Card>
        <p
          style={{
            overflow: 'hidden'
          }}
        >
          <RadioGroup
            onChange={this.handleTypeChange}
            value={type}
            style={{
              marginRight: 16,
              float: 'left'
            }}
          >
            <RadioButton value="installed">已开通</RadioButton>
            <RadioButton value="uninstalled">未开通</RadioButton>
          </RadioGroup>
          <RadioGroup
            onChange={this.handleCategoryChange}
            defaultValue=""
            style={{
              marginRight: 16,
              float: 'right'
            }}
          >
            <RadioButton value="">全部</RadioButton>
            <RadioButton value="analysis">性能分析类</RadioButton>
            <RadioButton value="net_manage">网络治理类</RadioButton>
          </RadioGroup>
        </p>
        {type === 'installed'
          ? this.renderInstalled()
          : this.renderUnInstalled()}
        {this.state.showDeletePlugin && (
          <ConfirmModal
            onOk={this.hanldeUnInstallPlugin}
            onCancel={this.cancelDeletePlugin}
            title="卸载插件"
            desc="确定要卸载此插件吗？"
          />
        )}

        {this.state.updateMemory && (
          <UpdateMemory
            onOk={this.handleUpdateMemory}
            onCancel={this.cancelUpdateMemory}
            minCpu={this.state.updateMemory.min_cpu}
            memory={this.state.updateMemory.min_memory}
          />
        )}
      </Card>
    );
  }
}
