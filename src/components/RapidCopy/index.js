/*
   快速复制
*/
import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import {
  Row,
  Col,
  Form,
  Select,
  Table,
  Modal,
  Input,
  Divider,
  Tooltip,
  Button,
  Icon,
  Cascader,
  notification,
} from 'antd';
import globalUtil from '../../utils/global';
import appUtil from '../../utils/app';
import styles from './index.less';
import styless from '../CreateTeam/index.less';

const FormItem = Form.Item;
const Option = Select.Option;
const EditableContext = React.createContext();
const EditableRow = ({ form, index, ...props }) => (
  <EditableContext.Provider value={form}>
    <tr {...props} />
  </EditableContext.Provider>
);

const EditableFormRow = Form.create()(EditableRow);

class EditableCell extends React.Component {
  state = {
    editing: false,
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
    const { isCodeApp, children, dataIndex, record, title } = this.props;
    const { editing } = this.state;
    const versions = isCodeApp
      ? record.build_source.code_version
      : record[dataIndex];
    return editing ? (
      <Form.Item style={{ margin: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {isCodeApp && (
            <span style={{ color: 'rgba(0, 0, 0, 0.85)' }}>分支或Tag</span>
          )}
          {form.getFieldDecorator(dataIndex, {
            rules: [
              {
                required: true,
                message: `${title} is required.`,
              },
            ],
            initialValue: versions,
          })(
            <Input
              style={{
                width: isCodeApp ? '195px' : '259px',
                marginLeft: isCodeApp && '5px',
              }}
              ref={node => (this.input = node)}
              onPressEnter={this.save}
              onBlur={this.save}
            />
          )}
        </div>
      </Form.Item>
    ) : (
      <div className={styles.editableCellValueWrap} onClick={this.toggleEdit}>
        {children}
      </div>
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
      isImageApp,
      isCodeApp,
      ...restProps
    } = this.props;

    return (
      <td {...restProps}>
        {isImageApp || isCodeApp ? (
          <EditableContext.Consumer>{this.renderCell}</EditableContext.Consumer>
        ) : (
          children
        )}
      </td>
    );
  }
}

@Form.create()
@connect(({ user, enterprise, groupControl }) => ({
  currentUser: user.currentUser,
  currentEnterprise: enterprise.currentEnterprise,
  groupDetail: groupControl.groupDetail || {},
}))
export default class Index extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      userTeamList: [],
      Loading: false,
      list: [],
      dataSource: [],
      page_num: 1,
      page_size: 10,
      total: '',
      bean: '',
      loading: true,
      selectedRowKeys: [],
      app_page_size: 10,
      app_page: 1,
      apps: [],
      isAddApps: false,
    };
  }
  componentDidMount() {
    this.fetchCopyComponent();
    this.getUserTeams();
    this.fetchTeamApps();
  }

  fetchCopyComponent = () => {
    const { dispatch, groupDetail } = this.props;
    dispatch({
      type: 'groupControl/fetchCopyComponent',
      payload: {
        tenantName: globalUtil.getCurrTeamName(),
        group_id: groupDetail.group_id,
      },
      callback: res => {
        if (res && res._code === 200) {
          const { list } = res;
          if (list && list.length > 0) {
            const arr = [];
            list.map((item, index) => {
              arr.push(index);
            });
            this.setState({
              selectedRowKeys: arr,
              dataSource: res.list,
              loading: false,
            });
          }
        }
      },
    });
  };

  addApps = () => {
    this.setState(
      {
        app_page_size: this.state.app_page_size + 10,
      },
      () => {
        this.fetchTeamApps();
      }
    );
  };

  // 应用
  fetchTeamApps = teamName => {
    const { dispatch, currentTeam, form } = this.props;
    const { app_page, app_page_size } = this.state;
    const { setFieldsValue } = form;

    dispatch({
      type: 'global/fetchGroups',
      payload: {
        query: '',
        team_name: teamName || globalUtil.getCurrTeamName(),
        page: app_page,
        page_size: app_page_size,
      },
      callback: data => {
        if (data) {
          // const listNum = res.total_count || 0;
          // const isAdd = !!(listNum && listNum > app_page_size);
          teamName &&
            setFieldsValue({ apps: data.length > 0 ? data[0].group_id : '' });
          this.setState({ apps: data });
        }
      },
    });
  };

  handleSubmit = () => {
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.setState({ Loading: true });
        this.AddCopyTeamApps(values);
      }
    });
  };

  AddCopyTeamApps = values => {
    const { dispatch, groupDetail, onCancel } = this.props;
    const { dataSource, selectedRowKeys } = this.state;
    const obj = {};
    const { apps, teamRegion } = values;
    obj.tar_group_id = apps;
    obj.tar_team_name = teamRegion && teamRegion[0];
    obj.tar_region_name = teamRegion && teamRegion[1];
    const arr = [];

    selectedRowKeys.map(item => {
      const { service_id, build_source } = dataSource[item];
      const { code_version, version } = build_source;
      const isCodeApp = appUtil.isCodeAppByBuildSource(build_source);
      const versions = isCodeApp ? code_version : version;
      const objs = {
        service_id,
        change: { build_source: { versions } },
      };
      arr.push(objs);
    });
    obj.services = arr;
    dispatch({
      type: 'groupControl/addCopyTeamApps',
      payload: {
        tenantName: globalUtil.getCurrTeamName(),
        group_id: groupDetail.group_id,
        ...obj,
      },
      callback: res => {
        this.handleCloseLoading();
        if (res && res._code === 200) {
          notification.success({ message: '复制成功' });
          const { tar_team_name, tar_region_name, tar_group_id } = res.bean;
          dispatch(
            routerRedux.push(
              `/team/${tar_team_name}/region/${tar_region_name}/apps/${tar_group_id}`
            )
          );
          onCancel();
        }
      },
      handleError: err => {
        if (err && err.data && err.data.msg_show) {
          notification.error({ message: err.data.msg_show });
        }
        this.handleCloseLoading();
      },
    });
  };

  handleCloseLoading = () => {
    this.setState({ Loading: false });
  };
  onSelectChange = selectedRowKeys => {
    this.setState({ selectedRowKeys });
  };

  handleSave = row => {
    const newData = [...this.state.dataSource];
    const index = newData.findIndex(item => row.service_id === item.service_id);
    const item = newData[index];
    newData.splice(index, 1, {
      ...item,
      ...row,
    });
    this.setState({ dataSource: newData });
  };

  // 团队
  getUserTeams = () => {
    const { dispatch, currentUser, currentEnterprise } = this.props;
    dispatch({
      type: 'global/fetchUserTeams',
      payload: {
        enterprise_id: currentEnterprise.enterprise_id,
        user_id: currentUser.user_id,
        page: 1,
        page_size: 999,
      },
      callback: res => {
        if (res && res._code === 200) {
          const newData = [];
          let obj = {};
          const { list } = res;
          list &&
            list.length > 0 &&
            list.map(item => {
              obj = item;
              obj.region_name = item.team_name;
              obj.region_alias = item.team_alias;
              delete obj.team_name;
              delete obj.team_alias;
              newData.push(obj);
            });
          this.setState({
            userTeamList: newData,
          });
        }
      },
    });
  };

  onChange = value => {
    const { form } = this.props;
    const { setFieldsValue } = form;

    if (value) {
      if (value.length > 1) {
        this.fetchTeamApps(value[0]);
      } else {
        setFieldsValue({ apps: '' });
      }
    }
  };

  handleOverDiv = () => {
    return <div />;
  };

  checkTeams = (rules, value, callback) => {
    if ((value && value.length === 0) || !value) {
      callback(`请选择团队/集群`);
      return;
    }
    if (value && value.length === 1) {
      callback(`请选择集群`);
      return;
    }
    callback();
  };

  render() {
    const { title, onCancel, form, groupDetail } = this.props;
    const { getFieldDecorator } = form;
    const {
      selectedRowKeys,
      userTeamList,
      dataSource,
      isAddApps,
      apps,
      loading,
      Loading,
    } = this.state;
    const userTeams = userTeamList && userTeamList.length > 0 && userTeamList;
    const appList = apps && apps.length > 0 && apps;
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange,
      hideDefaultSelections: true,
    };
    const components = {
      body: {
        row: EditableFormRow,
        cell: EditableCell,
      },
    };

    const overDiv = (type, text) => {
      return (
        <div
          style={{
            width: 400,
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              paddingRight: '5px',
              width: '80px',
              color: 'rgba(0, 0, 0, 0.85)',
            }}
          >
            {type}
          </div>
          <div>{text}</div>
        </div>
      );
    };

    const column = [
      {
        title: '组件名称',
        dataIndex: 'service_cname',
        width: '340px',
        render: v => (
          <Tooltip title={v}>
            <div>{v}</div>
          </Tooltip>
        ),
      },
      {
        title: '构建源信息',
        dataIndex: 'build_source',
        width: '450px',
        render: item => {
          const { image, git_url, rain_app_name, service_source } = item;
          const isImageApp = appUtil.isImageAppByBuildSource(item);
          const isMarketApp = appUtil.isMarketAppByBuildSource(item);
          const isCodeApp = appUtil.isCodeAppByBuildSource(item);
          const isThirdParty = service_source === 'third_party';

          const tit = isImageApp
            ? image
            : isCodeApp
            ? git_url
            : isMarketApp
            ? rain_app_name
            : isThirdParty
            ? '第三方组件: 暂不支持复制'
            : '';
          return (
            <Tooltip title={tit}>
              {isImageApp
                ? overDiv('镜像:', `${image}`)
                : isCodeApp
                ? overDiv('源码:', `${git_url}`)
                : isMarketApp
                ? overDiv('组件库:', `${rain_app_name}`)
                : isThirdParty
                ? overDiv('第三方组件:', '暂不支持复制')
                : '-'}
            </Tooltip>
          );
        },
      },
      {
        title: '版本修改',
        dataIndex: 'version',
        width: '300px',
        editable: true,
        render: (v, item) => {
          const { build_source } = item;
          const { code_version, version } = build_source;
          const isImageApp = appUtil.isImageAppByBuildSource(build_source);
          const isCodeApp = appUtil.isCodeAppByBuildSource(build_source);
          const versions = isCodeApp ? code_version : version;

          if (isImageApp || isCodeApp) {
            return (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {isCodeApp && (
                  <span style={{ color: 'rgba(0, 0, 0, 0.85)' }}>
                    分支或Tag
                  </span>
                )}
                <Input
                  style={{
                    width: isCodeApp ? '195px' : '259px',
                    marginLeft: isCodeApp && '5px',
                  }}
                  value={versions}
                />
              </div>
            );
          }
          return '暂不支持变更版本';
        },
      },
    ];

    const columns = column.map((col, index) => {
      if (!col.editable) {
        return col;
      }
      return {
        ...col,
        onCell: record => ({
          isImageApp: appUtil.isImageAppByBuildSource(record.build_source),
          isCodeApp: appUtil.isCodeAppByBuildSource(record.build_source),
          record,
          editable: col.editable,
          dataIndex: col.dataIndex,
          title: col.title,
          handleSave: this.handleSave,
        }),
      };
    });
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 17 },
      },
    };
    const hasSelected = selectedRowKeys.length > 0;
    const team_name = globalUtil.getCurrTeamName();
    const region_name = globalUtil.getCurrRegionName();
    return (
      <Modal
        className={styless.TelescopicModal}
        onOk={this.handleSubmit}
        title={title}
        width={1200}
        visible
        onCancel={onCancel}
        footer={[
          <Button onClick={onCancel}> 取消 </Button>,
          <Button
            type="primary"
            style={{ marginTop: '20px' }}
            disabled={!hasSelected}
            loading={Loading}
            onClick={this.handleSubmit}
          >
            确定
          </Button>,
        ]}
      >
        <div className={styles.tdPadding}>
          <Form
            onSubmit={this.handleSubmit}
            layout="horizontal"
            hideRequiredMark
          >
            <Row>
              {userTeams && (
                <Col span={6}>
                  <FormItem {...formItemLayout} label="复制到">
                    {getFieldDecorator('teamRegion', {
                      initialValue: [team_name, region_name],
                      rules: [
                        {
                          required: true,
                          validator: this.checkTeams,
                        },
                      ],
                    })(
                      <Cascader
                        fieldNames={{
                          label: 'region_alias',
                          value: 'region_name',
                          children: 'region_list',
                        }}
                        options={userTeams}
                        onChange={this.onChange}
                        placeholder="团队/集群"
                      />
                    )}
                  </FormItem>
                </Col>
              )}
              {appList && (
                <Col span={6}>
                  <FormItem {...formItemLayout} label="">
                    {getFieldDecorator('apps', {
                      initialValue: groupDetail.group_id,
                      rules: [
                        {
                          required: true,
                          message: '请选择应用',
                        },
                      ],
                    })(
                      <Select
                        style={{ width: '100%' }}
                        placeholder="请选择应用"
                        // dropdownRender={menu => (
                        //   <div>
                        //     {menu}
                        //     {isAddApps && (
                        //       <div>
                        //         <Divider style={{ margin: '4px 0' }} />
                        //         <div
                        //           style={{
                        //             padding: '4px 8px',
                        //             cursor: 'pointer',
                        //           }}
                        //           onMouseDown={e => e.preventDefault()}
                        //           onClick={this.addApps}
                        //         >
                        //           <Icon type="plus" /> 加载更多
                        //         </div>
                        //       </div>
                        //     )}
                        //   </div>
                        // )}
                      >
                        {appList.map(item => (
                          <Option key={item.group_id} value={item.group_id}>
                            {item.group_name}
                          </Option>
                        ))}
                      </Select>
                    )}
                  </FormItem>
                </Col>
              )}
            </Row>
          </Form>

          <Table
            id={styles.repidCopyTable}
            pagination={false}
            components={components}
            rowSelection={rowSelection}
            loading={loading}
            dataSource={dataSource}
            columns={columns}
          />
        </div>
      </Modal>
    );
  }
}
