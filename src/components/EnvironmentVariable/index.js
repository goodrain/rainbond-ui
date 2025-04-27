/* eslint-disable camelcase */
import {
  Button,
  Card,
  Form,
  Icon,
  Input,
  notification,
  Pagination,
  Table,
  Tooltip
} from 'antd';
import { connect } from 'dva';
import React, { Fragment } from 'react';
import globalUtil from '../../utils/global';
import ConfirmModal from '../ConfirmModal';
import ScrollerX from '../ScrollerX';
import cookie from '../../utils/cookie';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import styles from './Index.less';

const { Search } = Input;

const EditableContext = React.createContext();
@connect()
class EditableCell extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      list: []
    };
  }

  getInput = () => {
    return <Input />;
  };

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
        Array.from(new Set(arr));
        if (arr && arr.length > 0 && arr[0] == 'null') {
          return;
        }
        this.setState({ list: arr });
        if (attr_name) {
          form.setFieldsValue({
            attr_name
          });
        }
        if (attr_value) {
          form.setFieldsValue({
            attr_value
          });
        }
      },
      handleError: err => {
        if (err && err.data && err.data.code == 10401) {
          return null;
        }
        if (err && err.data && err.data.msg_show) {
          notification.warning({
            message: formatMessage({id:'notification.warn.error'}),
            description: err.data.msg_show
          });
        }
      }
    });
  };

  renderCell = ({ getFieldDecorator }) => {
    const {
      editing,
      dataIndex,
      title,
      inputType,
      record,
      index,
      children,
      addVariable,
      autoQuery,
      form,
      ...restProps
    } = this.props;
    const { list } = this.state;
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
                disabled={!addVariable && dataIndex === 'attr_name'}
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
          notification.success({ message:  formatMessage({id:'notification.success.edit'})});
          this.fetchInnerEnvs();
          this.handleCancelAddVariabl();
        }
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
          notification.success({ message:  formatMessage({id:'notification.success.delete'})});
          this.fetchInnerEnvs();
        }
        this.cancelDeleteVariabl();
        this.handleCancelAddVariabl();
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
        scope: transfer.scope == 'inner' ? 'outer' : 'inner'
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({ message:  formatMessage({id:'notification.success.transfer'})});
          this.fetchInnerEnvs();
          this.cancelTransfer();
          this.handleCancelAddVariabl();
        }
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
            res.list.map(item => {
              const isHidden = globalUtil.confirmEnding(
                `${item.attr_name}`,
                'PASS'
              );
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
    const arr = isAttrNameList;
    if (isHidden) {
      const index = arr.indexOf(ID);
      arr.splice(index, 1);
    } else {
      arr.push(ID);
    }
    this.setState({
      isAttrNameList: arr
    });
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
          extra={type === 'Outer' && addButton}
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
              {addButton}
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
