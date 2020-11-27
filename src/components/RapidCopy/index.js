/*
   快速复制
*/
import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import {
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  Modal,
  notification,
  Row,
  Select,
  Spin,
  Tooltip
} from 'antd';
import appUtil from '../../utils/app';
import globalUtil from '../../utils/global';
import AddGroup from '../AddOrEditGroup';
import styless from '../CreateTeam/index.less';
import styles from './index.less';

const FormItem = Form.Item;
const { Option } = Select;

@Form.create()
@connect(({ user, enterprise, application }) => ({
  currentUser: user.currentUser,
  currentEnterprise: enterprise.currentEnterprise,
  groupDetail: application.groupDetail || {}
}))
export default class Index extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      userTeamList: [],
      Loading: true,
      loading: true,
      dataSource: [],
      app_page_size: 10,
      app_page: 1,
      apps: [],
      checkedList: [],
      inputValue: '',
      checkAllList: [],
      indeterminate: false,
      checkAll: true,
      addGroup: false
    };
  }
  componentDidMount() {
    this.fetchCopyComponent();
    this.getUserTeams();
    this.fetchTeamApps();
  }
  onAddGroup = () => {
    this.setState({ addGroup: true });
  };
  onSelectChange = (value) => {
    this.handleOpenLoging();
    const { form } = this.props;
    const { userTeamList } = this.state;
    const { setFieldsValue } = form;
    const arr = userTeamList.filter((item) => item.name === value);
    if (arr) {
      if (arr.length > 0) {
        this.fetchTeamApps(arr[0].value[0], arr[0].value[1]);
      } else {
        this.handleCloseLoging();
        setFieldsValue({ apps: '' });
      }
    }
  };
  onGroupChange = (checkedList) => {
    const { checkAllList } = this.state;
    this.setState({
      checkedList,
      indeterminate:
        !!checkedList.length && checkedList.length < checkAllList.length,
      checkAll: checkedList.length === checkAllList.length
    });
  };

  onCheckAllChange = (e) => {
    const { checkAllList } = this.state;
    this.setState({
      checkedList: e.target.checked ? checkAllList : [],
      indeterminate: false,
      checkAll: e.target.checked
    });
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
        page_size: 999
      },
      callback: (res) => {
        if (res && res._code === 200) {
          const { list } = res;
          const arr = [];
          if (list && list.length > 0) {
            list.map((team) => {
              team.region_list.map((region) => {
                const item = {
                  name: `${team.team_alias} | ${region.region_alias}`,
                  value: [team.team_name, region.region_name]
                };
                arr.push(item);
              });
            });
          }
          this.setState({
            userTeamList: arr
          });
        }
      }
    });
  };

  handleOpenLoging = () => {
    this.setState({ Loading: true, loading: true });
  };
  handleCloseLoging = () => {
    this.setState({ Loading: false, loading: false });
  };
  cancelAddGroup = () => {
    this.setState({ addGroup: false });
  };
  fetchCopyComponent = () => {
    const { dispatch, groupDetail } = this.props;
    dispatch({
      type: 'application/fetchCopyComponent',
      payload: {
        tenantName: globalUtil.getCurrTeamName(),
        group_id: groupDetail.app_id
      },
      callback: (res) => {
        if (res && res._code === 200) {
          const { list } = res;
          const arr = [];
          if (list && list.length > 0) {
            list.map((item, index) => {
              arr.push(index);
            });
          }

          this.setState({
            checkAllList: arr,
            checkedList: arr,
            dataSource: res.list,
            loading: false,
            Loading: false
          });
        }
      }
    });
  };

  handleAddGroup = (vals) => {
    const { getFieldValue } = this.props.form;
    const { userTeamList } = this.state;
    const teamRegion = getFieldValue('teamRegion');
    const arrs = userTeamList.filter((item) => item.name === teamRegion);
    let teamName = '';
    let regionName = '';
    if (arrs.length > 0) {
      teamName = arrs && arrs[0].value[0];
      regionName = arrs && arrs[0].value[1];
    }
    this.handleOpenLoging();
    this.props.dispatch({
      type: 'application/addGroup',
      payload: {
        team_name: teamName || globalUtil.getCurrTeamName(),
        region_name: regionName || globalUtil.getCurrRegionName(),
        ...vals
      },
      callback: (group) => {
        console.log('group', group);
        if (group) {
          // 获取群组
          this.fetchTeamApps(teamName, regionName, group.group_id);
          this.cancelAddGroup();
        }
        this.handleCloseLoging();
      }
    });
  };

  // 应用
  fetchTeamApps = (teamName, regionName, groupId) => {
    const { dispatch, form } = this.props;
    const { app_page, app_page_size } = this.state;
    const { setFieldsValue } = form;
    dispatch({
      type: 'global/fetchGroups',
      payload: {
        query: '',
        team_name: teamName || globalUtil.getCurrTeamName(),
        region_name: regionName || globalUtil.getCurrRegionName(),
        page: app_page,
        page_size: app_page_size
      },
      callback: (data) => {
        if (data) {
          if (teamName) {
            setFieldsValue({
              apps: groupId || (data.length > 0 ? data[0].group_id : '')
            });
          }
          this.setState({ apps: data });
        }
        this.handleCloseLoging();
      }
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

  AddCopyTeamApps = (values) => {
    const { dispatch, groupDetail, onCancel } = this.props;
    const { dataSource, checkedList, userTeamList } = this.state;
    const obj = {};
    const { apps, teamRegion } = values;
    obj.tar_group_id = apps;
    const arrs = userTeamList.filter((item) => item.name === teamRegion);
    obj.tar_team_name = arrs && arrs[0].value[0];
    obj.tar_region_name = arrs && arrs[0].value[1];

    const arr = [];
    checkedList.map((item) => {
      const { service_id, build_source } = dataSource[item];
      const { code_version, version } = build_source;
      const isCodeApp = appUtil.isCodeAppByBuildSource(build_source);
      const versions = isCodeApp ? code_version : version;
      const objs = {
        service_id,
        change: { build_source: { version: versions } }
      };
      arr.push(objs);
    });
    obj.services = arr;
    dispatch({
      type: 'application/addCopyTeamApps',
      payload: {
        tenantName: globalUtil.getCurrTeamName(),
        group_id: groupDetail.app_id,
        ...obj
      },
      callback: (res) => {
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
      handleError: (err) => {
        if (err && err.data && err.data.msg_show) {
          notification.warning({ message: err.data.msg_show });
        }
        this.handleCloseLoading();
      }
    });
  };

  handleCloseLoading = () => {
    this.setState({ Loading: false, loading: false });
  };

  handleSave = (row) => {
    const newData = [...this.state.dataSource];
    const index = newData.findIndex(
      (item) => row.service_id === item.service_id
    );
    const item = newData[index];
    newData.splice(index, 1, {
      ...item,
      ...row
    });
    this.setState({ inputValue: '', dataSource: newData });
  };

  handleOverDiv = (content) => {
    return <div>{content}</div>;
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

  save = (item, isCodeApp) => {
    const { inputValue } = this.state;
    const names = isCodeApp ? 'code_version' : 'version';
    const str = item;
    str.build_source[names] = inputValue;
    this.handleSave({ ...str });
  };

  render() {
    const { title, onCancel, form, groupDetail } = this.props;
    const { getFieldDecorator } = form;
    const {
      userTeamList,
      dataSource,
      checkedList,
      apps,
      loading,
      Loading,
      addGroup,
      indeterminate,
      checkAll
    } = this.state;
    const userTeams = userTeamList && userTeamList.length > 0 && userTeamList;
    let defaultTeamRegion = '';
    const team_name = globalUtil.getCurrTeamName();
    const region_name = globalUtil.getCurrRegionName();
    if (userTeams) {
      userTeamList.map((item) => {
        if (item.value[0] === team_name && item.value[1] === region_name) {
          defaultTeamRegion = item.name;
        }
      });
    }
    const appList = apps && apps.length > 0 && apps;
    const hasSelected = checkedList && checkedList.length > 0;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 17 }
      }
    };

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
          </Button>
        ]}
      >
        <Spin spinning={loading} tip="Loading...">
          <div className={styles.copyBox}>
            {addGroup && (
              <AddGroup
                onCancel={this.cancelAddGroup}
                onOk={this.handleAddGroup}
              />
            )}

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
                        initialValue: defaultTeamRegion,
                        rules: [
                          {
                            required: true,
                            validator: this.checkTeams
                          }
                        ]
                      })(
                        <Select
                          onChange={this.onSelectChange}
                          placeholder="团队/集群"
                        >
                          {userTeams.map((item) => {
                            return (
                              <Option value={item.name}>{item.name}</Option>
                            );
                          })}
                        </Select>
                      )}
                    </FormItem>
                  </Col>
                )}
                <Col
                  span={10}
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <FormItem {...formItemLayout} label="">
                    {getFieldDecorator('apps', {
                      initialValue: groupDetail.app_id,
                      rules: [
                        {
                          required: true,
                          message: '请选择应用'
                        }
                      ]
                    })(
                      <Select
                        style={{ width: '180px' }}
                        placeholder="请选择应用"
                      >
                        {appList &&
                          appList.map((item) => (
                            <Option key={item.group_id} value={item.group_id}>
                              {item.group_name}
                            </Option>
                          ))}
                      </Select>
                    )}
                  </FormItem>
                  <Button
                    style={{ margin: '0 0 24px 10px' }}
                    onClick={this.onAddGroup}
                  >
                    新建应用
                  </Button>
                </Col>
              </Row>
            </Form>
            <div className={styles.tabTitle}>
              <div className={`${styles.w300} ${styles.over}`}>
                <Checkbox
                  indeterminate={indeterminate}
                  onChange={this.onCheckAllChange}
                  checked={checkAll}
                >
                  组件名称
                </Checkbox>
              </div>
              <div className={`${styles.w500} ${styles.over}`}>构建源信息</div>
              <div className={`${styles.w300} ${styles.over}`}>版本修改</div>
            </div>
            <Checkbox.Group
              style={{ width: '100%' }}
              value={checkedList}
              onChange={this.onGroupChange}
            >
              {dataSource.map((item, index) => {
                const { service_cname, build_source, service_id } = item;
                const {
                  code_version,
                  version,
                  image,
                  git_url,
                  rain_app_name,
                  service_source
                } = build_source;

                const isImageApp = appUtil.isImageAppByBuildSource(
                  build_source
                );
                const isMarketApp = appUtil.isMarketAppByBuildSource(
                  build_source
                );
                const isCodeApp = appUtil.isCodeAppByBuildSource(build_source);
                const versions = isCodeApp ? code_version : version;
                const isThirdParty = service_source === 'third_party';

                const tit = isImageApp
                  ? image
                  : isCodeApp
                  ? git_url
                  : isMarketApp
                  ? rain_app_name
                  : isThirdParty
                  ? '第三方组件'
                  : '';

                let versionConetent = '';
                const versionSelector = (
                  <Select
                    style={{ width: 70 }}
                    defaultValue={isImageApp ? 'Tag' : 'branch'}
                  >
                    {!isImageApp && <Option value="branch">分支</Option>}
                    {isCodeApp && <Option value="Tag">Tag</Option>}
                  </Select>
                );
                if (isImageApp || isCodeApp) {
                  versionConetent = (
                    <FormItem>
                      {getFieldDecorator(service_id, {
                        initialValue: versions || '',
                        rules: [
                          {
                            required: true,
                            message: '不能为空'
                          }
                        ]
                      })(
                        <Input
                          addonBefore={versionSelector}
                          onPressEnter={() => {
                            this.save(item, isCodeApp);
                          }}
                          onBlur={() => {
                            this.save(item, isCodeApp);
                          }}
                          style={{
                            width: '268px'
                          }}
                          onChange={(e) => {
                            this.setState({
                              inputValue: e.target.value
                            });
                          }}
                        />
                      )}
                    </FormItem>
                  );
                } else {
                  versionConetent = isThirdParty ? '-' : '暂不支持变更版本';
                }

                return (
                  <div className={styles.tabTr} key={service_id}>
                    <Tooltip title={service_cname}>
                      <div className={`${styles.w300} ${styles.over}`}>
                        <Checkbox value={index}>{service_cname}</Checkbox>
                      </div>
                    </Tooltip>

                    <Tooltip title={tit}>
                      <div className={`${styles.w500} ${styles.over}`}>
                        <div
                          style={{
                            paddingRight: '5px',
                            width: '80px',
                            color: 'rgba(0, 0, 0, 0.85)'
                          }}
                        >
                          {isImageApp
                            ? '镜像:'
                            : isCodeApp
                            ? '源码:'
                            : isMarketApp
                            ? '组件库:'
                            : isThirdParty
                            ? '第三方组件'
                            : '-'}
                        </div>
                        <div className={`${styles.w380} ${styles.over}`}>
                          {isImageApp
                            ? image
                            : isCodeApp
                            ? git_url
                            : isMarketApp
                            ? rain_app_name
                            : isThirdParty
                            ? ''
                            : '-'}
                        </div>
                      </div>
                    </Tooltip>
                    <div className={`${styles.w300} ${styles.over}`}>
                      {versionConetent}
                    </div>
                  </div>
                );
              })}
            </Checkbox.Group>
          </div>
        </Spin>
      </Modal>
    );
  }
}
