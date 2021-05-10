import { Button, Checkbox, Form, Input, Modal, Select } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import AddGroup from '../../components/AddOrEditGroup';
import cookie from '../../utils/cookie';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;
const { Option } = Select;

@Form.create()
@connect(({ user, global, teamControl }) => ({
  user: user.currentUser,
  rainbondInfo: global.rainbondInfo,
  currentTeam: teamControl.currentTeam
}))
class CreateHelmAppModels extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      userTeamList: [],
      regionList: [],
      appName: '',
      groups: [],
      isDeploy: true,
      addGroup: false,
      addAppLoading: false,
      helmInstallLoading: false
    };
  }
  componentDidMount() {
    this.fetchCreateAppTeams();
  }
  onAddGroup = () => {
    this.setState({ addGroup: true });
  };
  fetchCreateAppTeams = name => {
    const { dispatch, eid, form, appTypes } = this.props;
    const { setFieldsValue } = form;
    dispatch({
      type: 'global/fetchCreateAppTeams',
      payload: {
        name,
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState(
            {
              userTeamList: res.list || []
            },
            () => {
              if (res.list && res.list.length > 0) {
                const info = res.list[0];

                setFieldsValue({
                  team_name: info.team_name
                });
                if (
                  appTypes === 'helmContent' &&
                  info.region_list &&
                  info.region_list.length > 0
                ) {
                  this.handleCheckAppName(
                    true,
                    info.team_name,
                    info.region_list[0].region_alias
                  );
                }
                this.handleTeamChange(res.list[0].team_name);
              }
            }
          );
        }
      }
    });
  };

  handleCheckAppName = (initial, tenantName, regionNam, name, callbacks) => {
    const { dispatch, appInfo } = this.props;
    const appName = (initial && appInfo && appInfo.name) || name;
    if (!regionNam) {
      return null;
    }
    dispatch({
      type: 'application/checkAppName',
      payload: {
        app_name: appName,
        regionNam,
        tenantName
      },
      callback: res => {
        let validatorValue = '';
        if (res && res.status_code === 200) {
          if (initial) {
            this.setState({
              appName: (res.list && res.list.name) || ''
            });
          } else if (callbacks) {
            validatorValue =
              name === (res.list && res.list.name) ? '' : '应用名称已存在';
            if (validatorValue) {
              callbacks(validatorValue);
            } else {
              callbacks();
            }
          }
        }
      },
      handleError: () => {
        if (callbacks) {
          callbacks();
        }
      }
    });
  };
  handleSubmit = e => {
    e.preventDefault();
    const { form, helmInfo, appInfo, appTypes } = this.props;
    form.validateFields((err, fieldsValue) => {
      const info = Object.assign({}, fieldsValue, {
        app_template_name: (appInfo && appInfo.name) || '',
        app_store_name: helmInfo && helmInfo.name,
        app_store_url: helmInfo && helmInfo.url
      });
      if (!err) {
        this.setState({ helmInstallLoading: true });
        if (appTypes === 'helmContent') {
          this.handleCreateHelm(info);
        } else if (appTypes === 'marketContent') {
          this.handleCloudCreate(fieldsValue);
        } else if (appTypes === 'localsContent') {
          this.handleCreate(fieldsValue);
        }
      }
    });
  };

  handleCloudCreate = vals => {
    const { dispatch, appInfo } = this.props;
    const { isDeploy } = this.state;
    dispatch({
      type: 'createApp/installApp',
      payload: {
        app_id: appInfo.app_id,
        ...vals,
        is_deploy: isDeploy,
        app_version: vals.version,
        install_from_cloud: true,
        marketName: appInfo.local_market_name
      },
      callback: () => {
        this.handleRefresh(vals);
      }
    });
  };
  handleCreate = vals => {
    const { dispatch, appInfo } = this.props;
    const { isDeploy } = this.state;
    dispatch({
      type: 'createApp/installApp',
      payload: {
        ...vals,
        app_id: appInfo.app_id,
        is_deploy: isDeploy,
        app_version: vals.version,
        install_from_cloud: false,
        marketName: 'localApplication'
      },
      callback: () => {
        this.handleRefresh(vals);
      }
    });
  };

  handleRefresh = vals => {
    const { dispatch, onCancel } = this.props;
    dispatch({
      type: 'global/fetchGroups',
      payload: {
        team_name: vals.team_name
      },
      callback: () => {
        onCancel();
        this.jump(vals.team_name, vals.region, vals.group_id);
        this.handleInstallLoading();
      }
    });
  };

  jump = (teaName, regionName, ID) => {
    const { dispatch } = this.props;
    dispatch(
      routerRedux.push(`/team/${teaName}/region/${regionName}/apps/${ID}`)
    );
  };

  handleCreateHelm = vals => {
    const { dispatch, onCancel } = this.props;
    dispatch({
      type: 'createApp/installHelmApp',
      payload: {
        ...vals,
        is_deploy: true
      },
      callback: res => {
        if (res.bean.ID && onCancel) {
          onCancel();
          this.jump(vals.team_name, vals.region, res.bean.ID);
        }
        this.handleInstallLoading();
      }
    });
  };
  handleInstallLoading = () => {
    this.setState({ helmInstallLoading: false });
  };
  handleTeamChange = value => {
    const { form, appTypes } = this.props;
    const { setFieldsValue, getFieldValue } = form;
    const { userTeamList } = this.state;
    let regionList = [];
    userTeamList.map(item => {
      if (item.team_name === value) {
        regionList = item.region_list;
      }
    });
    if (regionList && regionList.length > 0) {
      const regionName = regionList[0].region_name;
      this.setState({ regionList }, () => {
        setFieldsValue({
          region: regionName
        });
        if (appTypes === 'helmContent') {
          this.handleCheckAppName(
            false,
            value,
            getFieldValue('app_name'),
            regionName
          );
        } else {
          this.fetchGroup(value, regionName);
        }
      });
    }
  };

  fetchGroup = (teaName, regionName) => {
    const { setFieldsValue } = this.props.form;
    this.props.dispatch({
      type: 'global/fetchGroups',
      payload: {
        team_name: teaName,
        region_name: regionName
      },
      callback: res => {
        setFieldsValue({
          group_id: res && res.length > 0 ? res[0].group_id : ''
        });
        this.setState({ groups: res });
        this.cancelAddGroup();
      }
    });
  };

  cancelAddGroup = () => {
    this.setState({ addGroup: false });
  };
  handleAddGroup = vals => {
    this.setState({ addAppLoading: true });
    const { dispatch, form } = this.props;
    const { setFieldsValue, getFieldValue } = form;
    const teaName = getFieldValue('team_name');
    const regionName = getFieldValue('region');

    dispatch({
      type: 'application/addGroup',
      payload: {
        team_name: teaName,
        region_name: regionName,
        ...vals
      },
      callback: group => {
        if (group) {
          // 获取群组
          dispatch({
            type: 'global/fetchGroups',
            payload: {
              team_name: teaName,
              region_name: regionName
            },
            callback: res => {
              this.setState({ groups: res, addAppLoading: false });
              setFieldsValue({ group_id: group.group_id });
              this.cancelAddGroup();
            }
          });
        }
      }
    });
  };
  renderSuccessOnChange = () => {
    this.setState({
      isDeploy: !this.state.isDeploy
    });
  };
  render() {
    const { onCancel, title, appInfo, form, appTypes } = this.props;
    const { getFieldDecorator, getFieldValue } = form;
    const {
      regionList,
      userTeamList,
      appName,
      helmInstallLoading,
      groups,
      addGroup,
      addAppLoading,
      isDeploy
    } = this.state;
    const userTeams = userTeamList && userTeamList.length > 0 && userTeamList;
    let versions = [];

    if (appTypes === 'localsContent') {
      versions = appInfo.versions_info && appInfo.versions_info;
    } else if (appTypes === 'marketContent') {
      versions = appInfo.versions && appInfo.versions;
    } else {
      versions = appInfo.versions && appInfo.versions;
    }

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 5 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 19 }
      }
    };

    const token = cookie.get('token');
    const myheaders = {};
    if (token) {
      myheaders.Authorization = `GRJWT ${token}`;
    }
    const teaName = getFieldValue('team_name');
    const regionName = getFieldValue('region');
    return (
      <div>
        {addGroup && (
          <AddGroup
            loading={addAppLoading}
            onCancel={this.cancelAddGroup}
            onOk={this.handleAddGroup}
          />
        )}
        <Modal
          title={title}
          visible
          width={500}
          className={styles.TelescopicModal}
          onOk={this.handleSubmit}
          onCancel={onCancel}
          footer={[
            <Button onClick={onCancel}> 取消 </Button>,
            <Button
              type="primary"
              onClick={this.handleSubmit}
              loading={helmInstallLoading}
            >
              确定
            </Button>
          ]}
        >
          <Form onSubmit={this.handleSubmit} layout="horizontal">
            <FormItem {...formItemLayout} label="团队名称">
              {getFieldDecorator('team_name', {
                rules: [
                  {
                    required: true,
                    message: '请选择团队'
                  }
                ]
              })(
                <Select
                  style={{ width: '323px' }}
                  onChange={this.handleTeamChange}
                  placeholder="请选择团队"
                >
                  {userTeams &&
                    userTeams.map(item => (
                      <Option key={item.team_name} value={item.team_name}>
                        {item.team_alias}
                      </Option>
                    ))}
                </Select>
              )}
              <div className={styles.conformDesc}>请选择团队</div>
            </FormItem>
            <FormItem {...formItemLayout} label="集群名称">
              {getFieldDecorator('region', {
                rules: [
                  {
                    required: true,
                    message: '请选择集群'
                  }
                ]
              })(
                <Select placeholder="请选择集群" style={{ width: '323px' }}>
                  {regionList.map(item => (
                    <Option key={item.region_name} value={item.region_name}>
                      {item.region_alias}
                    </Option>
                  ))}
                </Select>
              )}
              <div className={styles.conformDesc}>请选择集群</div>
            </FormItem>

            {appTypes === 'helmContent' ? (
              <FormItem {...formItemLayout} label="应用名称">
                {getFieldDecorator('app_name', {
                  initialValue: appName,
                  validateTrigger: 'onBlur',
                  rules: [
                    {
                      required: true,
                      message: '请输入应用名称'
                    },
                    {
                      min: 4,
                      message: '应用名称最小长度4位'
                    },
                    {
                      max: 53,
                      message: '应用名称最大长度53位'
                    },
                    {
                      pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/,
                      message: '只支持小写字母和数字开头结尾'
                    },
                    {
                      validator: (_, value, callback) => {
                        this.handleCheckAppName(
                          false,
                          teaName,
                          regionName,
                          value,
                          callback
                        );
                      }
                    }
                  ]
                })(
                  <Input style={{ width: '323px' }} placeholder="请输入名称" />
                )}
                <div className={styles.conformDesc}>
                  请输入创建的应用模版名称，最多53字.
                </div>
              </FormItem>
            ) : (
              <Form.Item {...formItemLayout} label="选择应用">
                {getFieldDecorator('group_id', {
                  rules: [
                    {
                      required: true,
                      message: '请选择'
                    }
                  ]
                })(
                  <Select
                    placeholder="请选择应用"
                    style={{
                      display: 'inline-block',
                      width: 220,
                      marginRight: 15
                    }}
                  >
                    {(groups || []).map(group => (
                      <Option key={group.group_id} value={group.group_id}>
                        {group.group_name}
                      </Option>
                    ))}
                  </Select>
                )}
                <Button onClick={this.onAddGroup}>新建应用</Button>
                <div className={styles.conformDesc}>
                  请输入创建的应用模版名称，最多53字.
                </div>
              </Form.Item>
            )}

            <FormItem {...formItemLayout} label="应用版本">
              {getFieldDecorator('version', {
                initialValue:
                  versions && (versions[0].version || versions[0].app_version),
                rules: [
                  {
                    required: true,
                    message: '请选择版本'
                  }
                ]
              })(
                <Select style={{ width: '323px' }}>
                  {versions &&
                    versions.map((item, indexs) => {
                      const val = item.version || item.app_version;
                      return (
                        <Option key={indexs} value={val}>
                          {val}
                        </Option>
                      );
                    })}
                </Select>
              )}
              <div className={styles.conformDesc}>
                请选择创建的应用的应用版本
              </div>
            </FormItem>
            <FormItem {...formItemLayout} label="应用备注">
              {getFieldDecorator('note', {
                initialValue: appInfo.versions
                  ? appInfo.versions[0].description || appInfo.describe
                  : '',
                rules: [
                  {
                    max: 255,
                    message: '最大长度255位'
                  }
                ]
              })(
                <Input.TextArea
                  placeholder="请填写应用备注信息"
                  style={{ width: '323px' }}
                />
              )}
              <div className={styles.conformDesc}>请输入创建的应用模版描述</div>
            </FormItem>

            {appTypes !== 'helmContent' && (
              <FormItem {...formItemLayout} label="构建启动">
                {getFieldDecorator('is_deploy', {
                  initialValue: isDeploy
                })(
                  <Checkbox
                    checked={isDeploy}
                    onChange={this.renderSuccessOnChange}
                  />
                )}
              </FormItem>
            )}
          </Form>
        </Modal>
      </div>
    );
  }
}

export default CreateHelmAppModels;
