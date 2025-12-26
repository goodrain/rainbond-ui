/* eslint-disable camelcase */
import {
  Button,
  Card,
  Form,
  Icon,
  Input,
  Modal,
  notification,
  Table,
  Tooltip
} from 'antd';
import { connect } from 'dva';
import React, { Fragment } from 'react';
import { FormattedMessage } from 'umi';
import cookie from '../../utils/cookie';
import handleAPIError from '../../utils/error';
import globalUtil from '../../utils/global';
import { formatMessage } from '@/utils/intl';
import ConfirmModal from '../ConfirmModal';
import ScrollerX from '../ScrollerX';
import styles from './Index.less';

const { Search } = Input;

const EditableContext = React.createContext();
@connect()
class EditableCell extends React.Component {
  handleList = (attr_name, attr_value, form) => {
    if (attr_name == null && attr_value == null) {
      return false;
    }
    const { dispatch } = this.props;
    dispatch({
      type: 'appControl/getVariableList',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        attr_name,
        attr_value
      },
      callback: res => {
        const arr = res && res.list ? res.list : [];
        arr.unshift(attr_name ? `${attr_name}` : `${attr_value}`);
        if (arr && arr.length > 0 && arr[0] === 'null') {
          return;
        }
        if (attr_name) {
          form.setFieldsValue({ attr_name });
        }
        if (attr_value) {
          form.setFieldsValue({ attr_value });
        }
      },
      handleError: err => {
        if (err && err.data && err.data.code === 10401) {
          return null;
        }
        handleAPIError(err);
      }
    });
  };

  renderCell = ({ getFieldDecorator }) => {
    const {
      editing,
      dataIndex,
      record,
      children,
      ...restProps
    } = this.props;
    let placeholders = '';
    let rulesList = [];

    if (dataIndex === 'attr_name') {
      placeholders = `${formatMessage({id:'componentOverview.body.tab.env.table.attr_name.placeholders'})}`;

      rulesList = [
        {
          required: true,
          message: formatMessage({id:'componentOverview.body.tab.env.table.attr_name.required'})
        },
        {
          max: 1024,
          message: formatMessage({id:'componentOverview.body.tab.env.table.attr_name.max'})
        },
        {
          pattern: /[-._a-zA-Z][-._a-zA-Z0-9]/,
          message: formatMessage({id:'componentOverview.body.tab.env.table.attr_name.pattern'})
        }
      ];
    } else if (dataIndex === 'attr_value') {
      rulesList = [
        {
          required: false,
          message: formatMessage({id:'componentOverview.body.tab.env.table.attr_value.required'})
        },
        {
          max: 65535,
          message: formatMessage({id:'componentOverview.body.tab.env.table.attr_value.max'})
        }
      ];
      placeholders = `${formatMessage({id:'componentOverview.body.tab.env.table.attr_value.placeholders'})}`;
    } else {
      rulesList = [
        {
          required: false,
          message: formatMessage({id:'componentOverview.body.tab.env.table.attr_path.required'})
        },
        {
          max: 1024,
          message: formatMessage({id:'componentOverview.body.tab.env.table.attr_path.max'})
        }
      ];

      // placeholders = '请输入变量说明';
      placeholders = `${formatMessage({id:'componentOverview.body.tab.env.table.attr_path.placeholders'})}`;
    }
    return (
      <td {...restProps}>
        {editing ? (
          <Form.Item style={{ margin: 0 }}>
            {getFieldDecorator(dataIndex, {
              rules: rulesList,
              initialValue: record[dataIndex]
            })(
              <Input
                // disabled={!addVariable && dataIndex === 'attr_name'}
                placeholder={placeholders}
              />
            )}
          </Form.Item>
        ) : (
          children
        )}
      </td>
    );
  };

  render() {
    return (
      <EditableContext.Consumer>{this.renderCell}</EditableContext.Consumer>
    );
  }
}

// eslint-disable-next-line react/no-multi-comp
@connect(({ appControl, loading }) => ({
  editEvnsLoading: loading.effects['appControl/editEvns'],
  addInnerEnvsLoading: loading.effects['appControl/addInnerEnvs'],
  deleteEnvsEnvsLoading: loading.effects['appControl/deleteEnvs'],
  putTransferLoading: loading.effects['appControl/putTransfer'],
  innerEnvs: appControl.innerEnvs
}))
class EnvironmentVariable extends React.Component {
  constructor(arg) {
    super(arg);
    this.state = {
      isAttrNameList: [],
      loading: true,
      env_name: '',
      page: 1,
      page_size: 5,
      total: 0,
      editingID: '',
      innerEnvsList: [],
      addVariable: false,
      deleteVar: false,
      transfer: false,
      showBatchEditModal: false,
      batchEditContent: '',
      batchEditLoading: false,
      batchSaveLoading: false,
      originalAllEnvs: [], // 存储原始的所有环境变量
      language: cookie.get('language') === 'zh-CN' ? true : false
    };
  }
  componentDidMount() {
    this.fetchInnerEnvs();
  }
  onTransfer = data => {
    this.setState({ transfer: data });
  };
  onDeleteVariabl = data => {
    this.setState({ deleteVar: data });
  };
  onShowSizeChange = (page, page_size) => {
    this.setState(
      {
        addVariable: false,
        page,
        page_size,
        editingID: ''
      },
      () => {
        this.fetchInnerEnvs();
      }
    );
  };
  onPageChange = page => {
    this.setState(
      {
        addVariable: false,
        page,
        editingID: ''
      },
      () => {
        this.fetchInnerEnvs();
      }
    );
  };
  isEditing = record => record.ID === this.state.editingID;

  handleAdd = () => {
    const { total, innerEnvsList } = this.state;
    const ID =
      innerEnvsList.length > 0
        ? innerEnvsList[innerEnvsList.length - 1].ID + 1.5
        : 1;
    const newData = {
      ID,
      attr_name: undefined,
      attr_value: undefined,
      name: '',
      container_port: 0
    };
    this.setState(
      {
        addVariable: true,
        innerEnvsList: [newData, ...innerEnvsList],
        total: total + 1
      },
      () => {
        this.edit(ID);
      }
    );
  };
  save = (form, ID, isCancel) => {
    const { addVariable, innerEnvsList } = this.state;
    if (isCancel) {
      if (addVariable) {
        const newData = [...innerEnvsList];
        const index = newData.findIndex(item => ID === item.ID);
        newData.splice(index, 1);
        this.setState({ innerEnvsList: newData });
      }
      this.handleCancelAddVariabl();
      return null;
    }

    form.validateFields((error, row) => {
      if (!error) {
        if (addVariable) {
          this.handleSubmitAddVariable(row);
        } else {
          this.handleEditVariable(row);
        }
      }
    });
  };
  handleEditVariable = vals => {
    const { dispatch, appAlias } = this.props;
    const { editingID } = this.state;
    dispatch({
      type: 'appControl/editEvns',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        ID: editingID,
        attr_value: vals.attr_value,
        name: vals.name
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({ message: formatMessage({id:'notification.success.edit'}) });
          this.fetchInnerEnvs();
          this.handleCancelAddVariabl();
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };
  handleSubmitAddVariable = vals => {
    const { dispatch, appAlias, type } = this.props;
    dispatch({
      type: 'appControl/addInnerEnvs',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        attr_name: vals.attr_name,
        attr_value: vals.attr_value,
        name: vals.name,
        scope: type === 'Inner' ? 'inner' : 'outer'
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({ message: formatMessage({id:'notification.success.add'}) });
          this.fetchInnerEnvs();
          this.handleCancelAddVariabl();
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };

  handleCancelAddVariabl = () => {
    this.setState({
      addVariable: false,
      editingID: ''
    });
  };

  edit = key => {
    this.setState({ editingID: key });
  };

  // 获取所有环境变量（用于批量编辑）
  fetchAllEnvs = () => {
    const { dispatch, appAlias, type } = this.props;

    const obj = {
      team_name: globalUtil.getCurrTeamName(),
      app_alias: appAlias,
      page: 1,
      page_size: 1000, // 设置一个足够大的数值来获取所有数据
      env_name: '' // 批量编辑时不应用搜索过滤，获取所有环境变量
    };
    let request = '';
    if (type === 'Inner') {
      request = 'appControl/fetchInnerEnvs';
    } else if (type === 'Outer') {
      request = 'appControl/fetchOuterEnvs';
    } else {
      request = 'appControl/fetchRelationOuterEnvs';
      obj.env_type = 'outer';
    }

    return new Promise((resolve, reject) => {
      dispatch({
        type: request,
        payload: obj,
        callback: res => {
          if (res && res.status_code === 200) {
            // 只返回可编辑的环境变量（container_port === 0的变量）
            const editableEnvs = (res.list || []).filter(env => env.container_port === 0);
            resolve(editableEnvs);
          } else {
            reject(res);
          }
        },
        handleError: err => {
          reject(err);
        }
      });
    });
  };

  handleBatchEdit = async () => {
    this.setState({ batchEditLoading: true });
    try {
      // 获取所有环境变量
      const allEnvsList = await this.fetchAllEnvs();
      const dotenvContent = this.convertToDotenv(allEnvsList);
      this.setState({
        showBatchEditModal: true,
        batchEditContent: dotenvContent,
        batchEditLoading: false,
        originalAllEnvs: allEnvsList // 保存原始环境变量
      });
    } catch (error) {
      this.setState({ batchEditLoading: false });
      notification.error({
        message: formatMessage({id:'componentOverview.body.tab.env.table.column.batchEditModal.fetchError'}),
        description: formatMessage({id:'componentOverview.body.tab.env.table.column.batchEditModal.fetchErrorDesc'})
      });
    }
  };

  handleCloseBatchEdit = () => {
    this.setState({
      showBatchEditModal: false,
      batchEditContent: '',
      batchSaveLoading: false,
      originalAllEnvs: []
    });
  };

  // 处理批量编辑内容变化
  handleBatchEditContentChange = (e) => {
    this.setState({ batchEditContent: e.target.value });
  };

  // 将Dotenv格式转换为环境变量列表
  parseDotenv = (content) => {
    if (!content || !content.trim()) {
      return [];
    }

    return content.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(line => {
        const commentIndex = line.indexOf(' #');
        let envLine = line;
        let comment = '';

        if (commentIndex !== -1) {
          envLine = line.substring(0, commentIndex);
          comment = line.substring(commentIndex + 2).trim();
        }

        const equalIndex = envLine.indexOf('=');
        if (equalIndex === -1) {
          return null;
        }

        const attr_name = envLine.substring(0, equalIndex).trim();
        const attr_value = envLine.substring(equalIndex + 1).trim();

        if (!attr_name) {
          return null;
        }

        return {
          attr_name,
          attr_value,
          name: comment
        };
      })
      .filter(env => env !== null);
  };

  // 比较环境变量变化
  compareEnvs = (originalEnvs, newEnvs) => {
    const originalMap = new Map();
    originalEnvs.forEach(env => {
      originalMap.set(env.attr_name, env);
    });

    const newMap = new Map();
    newEnvs.forEach(env => {
      newMap.set(env.attr_name, env);
    });

    const toAdd = [];
    const toUpdate = [];
    const toDelete = [];

    // 查找新增和修改的变量
    newEnvs.forEach(newEnv => {
      const original = originalMap.get(newEnv.attr_name);
      if (!original) {
        // 新增的变量
        toAdd.push(newEnv);
      } else if (
        original.attr_value !== newEnv.attr_value ||
        original.name !== newEnv.name
      ) {
        // 修改的变量，保留原始ID
        toUpdate.push({
          ...newEnv,
          ID: original.ID
        });
      }
    });

    // 查找删除的变量
    originalEnvs.forEach(originalEnv => {
      if (!newMap.has(originalEnv.attr_name)) {
        toDelete.push(originalEnv);
      }
    });

    return { toAdd, toUpdate, toDelete };
  };

  // 执行单个环境变量操作
  executeEnvOperation = (operation, env) => {
    const { dispatch, appAlias, type } = this.props;
    const commonPayload = {
      team_name: globalUtil.getCurrTeamName(),
      app_alias: appAlias
    };

    return new Promise((resolve, reject) => {
      let requestType = '';
      let payload = { ...commonPayload };

             switch (operation) {
         case 'add':
           if (type === 'Inner') {
             requestType = 'appControl/addInnerEnvs';
             payload = {
               ...payload,
               attr_name: env.attr_name,
               attr_value: env.attr_value,
               name: env.name,
               scope: 'inner'
             };
           } else {
             requestType = 'appControl/addInnerEnvs';
             payload = {
               ...payload,
               attr_name: env.attr_name,
               attr_value: env.attr_value,
               name: env.name,
               scope: 'outer'
             };
           }
           break;
        case 'update':
          requestType = 'appControl/editEvns';
          payload = {
            ...payload,
            ID: env.ID,
            attr_value: env.attr_value,
            name: env.name
          };
          break;
        case 'delete':
          requestType = 'appControl/deleteEnvs';
          payload = {
            ...payload,
            ID: env.ID
          };
          break;
        default:
          reject(new Error('Unknown operation'));
          return;
      }

      dispatch({
        type: requestType,
        payload,
        callback: res => {
          if (res && res.status_code === 200) {
            resolve(res);
          } else {
            reject(res);
          }
        },
        handleError: err => {
          reject(err);
        }
      });
    });
  };

  // 保存批量编辑的环境变量
  handleSaveBatchEdit = async () => {
    const { batchEditContent, originalAllEnvs } = this.state;

    try {
      // 解析新的环境变量
      const newEnvs = this.parseDotenv(batchEditContent);

            // 比较变化
      const { toAdd, toUpdate, toDelete } = this.compareEnvs(originalAllEnvs, newEnvs);

      // 如果没有任何变化，提示用户
      if (toAdd.length === 0 && toUpdate.length === 0 && toDelete.length === 0) {
        notification.info({
          message: '无变化',
          description: '环境变量没有任何变化，无需保存'
        });
        this.handleCloseBatchEdit();
        return;
      }

      this.setState({ batchSaveLoading: true });

      // 创建所有操作的Promise数组
      const operations = [];

      // 删除操作
      toDelete.forEach(env => {
        operations.push(this.executeEnvOperation('delete', env));
      });

      // 更新操作
      toUpdate.forEach(env => {
        operations.push(this.executeEnvOperation('update', env));
      });

      // 新增操作
      toAdd.forEach(env => {
        operations.push(this.executeEnvOperation('add', env));
      });

      // 执行所有操作
      await Promise.all(operations);

      // 成功提示
      const summary = [];
      if (toAdd.length > 0) summary.push(`新增 ${toAdd.length} 个`);
      if (toUpdate.length > 0) summary.push(`修改 ${toUpdate.length} 个`);
      if (toDelete.length > 0) summary.push(`删除 ${toDelete.length} 个`);

      notification.success({
        message: formatMessage({id:'notification.success.save'}),
        description: `批量操作成功：${summary.join('，')}变量`
      });

      // 刷新数据并关闭弹框
      this.fetchInnerEnvs();
      this.handleCloseBatchEdit();

    } catch (error) {
      console.error('批量保存环境变量失败:', error);
      notification.error({
        message: '保存失败',
        description: '批量保存环境变量时发生错误，请稍后重试'
      });
    } finally {
      this.setState({ batchSaveLoading: false });
    }
  };

  // 将环境变量列表转换为Dotenv格式
  convertToDotenv = (envList) => {
    if (!envList || envList.length === 0) {
      return '';
    }

    return envList.map(env => {
      const name = env.attr_name || '';
      const value = env.attr_value || '';
      const comment = env.name ? ` # ${env.name}` : '';
      return `${name}=${value}${comment}`;
    }).join('\n');
  };

  handleDeleteVariabl = () => {
    const { dispatch, appAlias } = this.props;
    const { deleteVar } = this.state;
    dispatch({
      type: 'appControl/deleteEnvs',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        ID: deleteVar
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({ message: formatMessage({id:'notification.success.delete'}) });
          this.fetchInnerEnvs();
        }
        this.cancelDeleteVariabl();
        this.handleCancelAddVariabl();
      },
      handleError: err => {
        this.cancelDeleteVariabl();
        handleAPIError(err);
      }
    });
  };

  cancelDeleteVariabl = () => {
    this.setState({ deleteVar: false });
  };

  handleTransfer = () => {
    const { transfer } = this.state;
    const { dispatch, appAlias } = this.props;
    dispatch({
      type: 'appControl/putTransfer',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        ID: transfer.ID,
        scope: transfer.scope === 'inner' ? 'outer' : 'inner'
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({ message: formatMessage({id:'notification.success.transfer'}) });
          this.fetchInnerEnvs();
          this.cancelTransfer();
          this.handleCancelAddVariabl();
        }
      },
      handleError: err => {
        this.cancelTransfer();
        handleAPIError(err);
      }
    });
  };
  cancelTransfer = () => {
    this.setState({ transfer: false });
  };
  handleSearch = env_name => {
    this.setState(
      {
        page: 1,
        env_name
      },
      () => {
        this.fetchInnerEnvs();
      }
    );
  };
  // 变量信息
  fetchInnerEnvs = () => {
    const { page, page_size, env_name } = this.state;
    const { dispatch, appAlias, type } = this.props;

    const obj = {
      team_name: globalUtil.getCurrTeamName(),
      app_alias: appAlias,
      page,
      page_size,
      env_name
    };
    let request = '';
    if (type === 'Inner') {
      request = 'appControl/fetchInnerEnvs';
    } else if (type === 'Outer') {
      request = 'appControl/fetchOuterEnvs';
    } else {
      request = 'appControl/fetchRelationOuterEnvs';
      obj.env_type = 'outer';
    }
    dispatch({
      type: request,
      payload: obj,
      callback: res => {
        if (res && res.status_code === 200) {
          const arr = [];
          if (res.list && res.list.length > 0) {
            res.list.forEach(item => {
              const isHidden = globalUtil.confirmEnding(`${item.attr_name}`, 'PASS');
              if (isHidden) {
                arr.push(item.ID);
              }
            });
          }
          this.setState({
            innerEnvsList: res.list,
            isAttrNameList: arr,
            total: res.bean.total,
            loading: false
          });
        }
      },
      handleError: err => {
        this.setState({ loading: false });
        handleAPIError(err);
      }
    });
  };

  AfterPassword = (isHidden, ID) => {
    const passwordShow = globalUtil.fetchSvg('passwordShow');
    const passwordHidden = globalUtil.fetchSvg('passwordHidden');
    return (
      <span
        onClick={() => {
          this.handlePassword(isHidden, ID);
        }}
      >
        {isHidden ? passwordHidden : passwordShow}
      </span>
    );
  };
  handlePassword = (isHidden, ID) => {
    const { isAttrNameList } = this.state;
    if (isHidden) {
      this.setState({
        isAttrNameList: isAttrNameList.filter(item => item !== ID)
      });
    } else {
      this.setState({
        isAttrNameList: [...isAttrNameList, ID]
      });
    }
  };
  handleDiv = v => {
    const wraps = {
      wordBreak: 'break-all',
      wordWrap: 'break-word'
    };
    return (
      <Tooltip title={v}>
        <div style={wraps}>{v}</div>
      </Tooltip>
    );
  };

  render() {
    const {
      title,
      type,
      autoQuery,
      form,
      editEvnsLoading,
      addInnerEnvsLoading,
      deleteEnvsEnvsLoading,
      putTransferLoading,
      isConfigPort = false
    } = this.props;
    const {
      isAttrNameList,
      innerEnvsList,
      addVariable,
      deleteVar,
      transfer,
      showBatchEditModal,
      batchEditContent,
      batchEditLoading,
      batchSaveLoading,
      total,
      page,
      page_size,
      loading,
      language
    } = this.state;
    const wraps = {
      wordBreak: 'break-all',
      wordWrap: 'break-word'
    };
    const components = {
      body: {
        cell: EditableCell
      }
    };

    const column = [
      {
        title: formatMessage({id:'componentOverview.body.tab.env.table.column.attr_name'}),
        dataIndex: 'attr_name',
        key: '1',
        width: '28%',
        editable: true,
        render: v => this.handleDiv(v)
      },
      {
        title: formatMessage({id:'componentOverview.body.tab.env.table.column.attr_value'}),
        dataIndex: 'attr_value',
        key: '2',
        width: '28%',
        editable: true,
        render: (v, item) => {
          const isHidden = isAttrNameList.includes(item.ID);
          const isInput = globalUtil.confirmEnding(`${item.attr_name}`, 'PASS');
          return (
            <Tooltip title={!isInput ? v : !isHidden && v}>
              {isInput ? (
                <Input
                  addonAfter={this.AfterPassword(isHidden, item.ID)}
                  type={isHidden ? 'password' : 'text'}
                  className={styles.hiddeninput}
                  value={v}
                />
              ) : (
                <div style={wraps}>{v}</div>
              )}
            </Tooltip>
          );
        }
      },
      {
        title: formatMessage({id:'componentOverview.body.tab.env.table.column.name'}),
        dataIndex: 'name',
        key: '3',
        width: '24%',
        editable: true,
        render: v => this.handleDiv(v)
      }
    ];

    if (type !== 'OuterEnvs') {
      column.push({
        title: formatMessage({id:'componentOverview.body.tab.env.table.column.action'}),
        dataIndex: 'action',
        key: '4',
        width: '20%',
        render: (v, data) => {
          const { editingID } = this.state;
          const editable = this.isEditing(data);
          const isAction = data.container_port === 0;
          if (isAction) {
            return editable ? (
              <span>
                <EditableContext.Consumer>
                  {form => (
                    <Button
                      loading={editEvnsLoading || addInnerEnvsLoading}
                      onClick={() => this.save(form, data.ID)}
                      type="link"
                    >
                      {/* 保存 */}
                      <FormattedMessage id='componentOverview.body.tab.env.table.column.preservation'/>
                    </Button>
                  )}
                </EditableContext.Consumer>
                <EditableContext.Consumer>
                  {form => (
                    <a
                      onClick={() => this.save(form, data.ID, true)}
                      style={{ marginRight: 8 }}
                    >
                      {/* 取消 */}
                      <FormattedMessage id='componentOverview.body.tab.env.table.column.cancel'/>
                    </a>
                  )}
                </EditableContext.Consumer>
              </span>
            ) : (
              <Fragment>
                <a
                  onClick={() => this.onDeleteVariabl(data.ID)}
                  style={{ marginRight: '5px' }}
                >
                  {/* 删除 */}
                  <FormattedMessage id='componentOverview.body.tab.env.table.column.delete'/>
                </a>
                {(type === 'Inner' || autoQuery) && !isConfigPort && (
                  <Tooltip
                    title={
                      <p>
                        {autoQuery ? (
                          <span>
                            {/* 将此连接信息变量转换为 */}
                            <FormattedMessage id='componentOverview.body.tab.env.table.column.msg'/>
                            <br />
                            {/* 环境变量 */}
                            <FormattedMessage id='componentOverview.body.tab.env.table.column.nextMsg'/>
                          </span>
                        ) : (
                          <span>
                            {/* 将此环境变量转换为 */}
                            <FormattedMessage id='componentOverview.body.tab.env.table.column.explain'/>
                            <br />
                            {/* 组件连接信息变量 */}
                            <FormattedMessage id='componentOverview.body.tab.env.table.column.nextExplain'/>
                          </span>
                        )}
                      </p>
                    }
                  >
                    <a
                      href="javascript:;"
                      onClick={() => {
                        this.onTransfer(data);
                      }}
                      style={{ marginRight: '5px' }}
                    >
                      {/* 转移 */}
                      <FormattedMessage id='componentOverview.body.tab.env.table.column.transfer'/>
                    </a>
                  </Tooltip>
                )}
                <a
                  disabled={editingID !== ''}
                  onClick={() => {
                    this.edit(data.ID);
                  }}
                >
                  {/* 修改 */}
                  <FormattedMessage id='componentOverview.body.tab.env.table.column.edit'/>
                </a>
              </Fragment>
            );
          }
          return '';
        }
      });
    }
    const columns = column.map(col => {
      if (!col.editable) {
        return col;
      }
      return {
        ...col,
        onCell: record => ({
          record,
          form,
          addVariable,
          inputType: 'text',
          dataIndex: col.dataIndex,
          title: col.title,
          autoQuery,
          editing: this.isEditing(record)
        })
      };
    });

    const batchEditButton = (
      <Button
        onClick={this.handleBatchEdit}
        loading={batchEditLoading}
        style={{ marginRight: 8 }}
      >
        <Icon type="edit" />
        {/* 批量编辑 */}
        <FormattedMessage id='componentOverview.body.tab.env.table.column.batchEdit'/>
      </Button>
    );

    const addButton = (
      <Button onClick={this.handleAdd} disabled={addVariable}>
        <Icon type="plus" />
        {/* 添加变量 */}
        <FormattedMessage id='componentOverview.body.tab.env.table.column.add'/>
      </Button>
    );

    return (
      <Fragment>
        {deleteVar && (
          <ConfirmModal
            loading={deleteEnvsEnvsLoading}
            onOk={this.handleDeleteVariabl}
            onCancel={this.cancelDeleteVariabl}
            title={<FormattedMessage id='confirmModal.deldete.env.title'/>}
            desc={<FormattedMessage id='confirmModal.deldete.env.desc'/>}
            subDesc={<FormattedMessage id='confirmModal.deldete.env.subDesc'/>}
          />
        )}

        {transfer && (
          <ConfirmModal
            loading={putTransferLoading}
            onOk={this.handleTransfer}
            onCancel={this.cancelTransfer}
            title={autoQuery ? <FormattedMessage id='confirmModal.deldete.transfer.title_information'/> : <FormattedMessage id='confirmModal.deldete.transfer.title'/>}
            desc={
              autoQuery
                ? <FormattedMessage id='confirmModal.deldete.transfer.desc_information'/>
                : <FormattedMessage id='confirmModal.deldete.transfer.desc'/>
            }
            subDesc={<FormattedMessage id='confirmModal.deldete.transfer.subDesc'/>}
          />
        )}

        {showBatchEditModal && (
          <Modal
            title={<FormattedMessage id='componentOverview.body.tab.env.table.column.batchEditModal.title'/>}
            visible={showBatchEditModal}
            onCancel={this.handleCloseBatchEdit}
            width={800}
            footer={[
              <Button
                key="cancel"
                onClick={this.handleCloseBatchEdit}
                disabled={batchSaveLoading}
              >
                <FormattedMessage id='button.cancel'/>
              </Button>,
              <Button
                key="save"
                type="primary"
                onClick={this.handleSaveBatchEdit}
                loading={batchSaveLoading}
              >
                <FormattedMessage id='button.save'/>
              </Button>
            ]}
          >
            <div style={{ marginBottom: 16 }}>
              <FormattedMessage id='componentOverview.body.tab.env.table.column.batchEditModal.content'/>
            </div>
            <Input.TextArea
              value={batchEditContent}
              onChange={this.handleBatchEditContentChange}
              rows={15}
              placeholder="KEY=value # comment"
              style={{
                fontFamily: 'monospace',
                fontSize: '14px'
              }}
            />
          </Modal>
        )}

        <Card
          style={{
            borderRadius:5,
            border: isConfigPort ? 'none' : '',
            padding: 0
          }}
          loading={loading}
          title={<>
            {isConfigPort ?  null : title}
            {!isConfigPort && <span className={styles.desc}>{formatMessage({ id: 'componentOther.relationMnt.desc' })}</span>}
          </>}
          extra={type === 'Outer' && (
            <div>
              {batchEditButton}
              {addButton}
            </div>
          )}
        >
          {type === 'Inner' && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '20px'
              }}
            >
              <Search
                style={language ? { width: '260px' } : { width: '320px' }}
                placeholder={formatMessage({id:'componentOverview.body.tab.env.table.column.placeholder'})}
                onSearch={this.handleSearch}
              />
              <div>
                {batchEditButton}
                {addButton}
              </div>
            </div>
          )}
          <ScrollerX sm={isConfigPort ? 650 : 600}>
            <EditableContext.Provider value={form}>
              <Table
                style={{ width: '100%', overflowX: 'auto' }}
                rowKey={(record,index) => index}
                components={components}
                columns={columns}
                dataSource={innerEnvsList}
                pagination={{
                  current: page,
                  pageSize: page_size,
                  total: Number(total),
                  onChange: this.onPageChange,
                  onShowSizeChange: this.onShowSizeChange,
                  showQuickJumper: true,
                  showSizeChanger: true,
                  showTotal: (total) => `共 ${total} 条`,
                  pageSizeOptions:['5', '10', '20', '30'],
                  hideOnSinglePage: Number(total) <= 5
                }}
              />
            </EditableContext.Provider>
          </ScrollerX>

        </Card>
      </Fragment>
    );
  }
}

const EditableFormTable = Form.create()(EnvironmentVariable);

export default EditableFormTable;
