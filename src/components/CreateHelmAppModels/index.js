/* eslint-disable array-callback-return */
import { Button, Checkbox, Form, Input, Modal, Select } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import AddGroup from '../../components/AddOrEditGroup';
import CreateTeam from '../../components/CreateTeam';
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
      showAddTeam: false,
      helmInstallLoading: false
    };
  }
  componentDidMount() {
    this.fetchCreateAppTeams();
  }
  onAddGroup = () => {
    const { form } = this.props;
    const { validateFields } = form;
    validateFields(['team_name', 'region_name'], err => {
      if (!err) {
        this.setState({ addGroup: true });
      }
    });
  };
  onAddTeam = () => {
    this.setState({ showAddTeam: true });
  };
  fetchCreateAppTeams = teamName => {
    const { dispatch, eid } = this.props;
    dispatch({
      type: 'global/fetchCreateAppTeams',
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.status_code === 200) {
          const list = res.list || [];
          this.setState(
            {
              userTeamList: list
            },
            () => {
              if (teamName || (list && list.length)) {
                this.handleTeamChange(teamName || list[0].team_name);
              }
            }
          );
        }
      }
    });
  };

  handleCheckAppName = (tenantName, regionName, name, callbacks) => {
    const { dispatch } = this.props;
    if (!regionName) {
      return null;
    }
    dispatch({
      type: 'application/checkAppName',
      payload: {
        app_name: name,
        regionName,
        tenantName
      },
      callback: res => {
        if (res && res.status_code === 200) {
          const appName = (res.list && res.list.name) || '';
          if (callbacks) {
            if (name === appName) {
              callbacks();
            } else {
              callbacks(`${formatMessage({id:'applicationMarket.CreateHelmAppModels.install'})}`);
            }
          } else {
            this.handleFieldsValue({
              app_name: appName
            });
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
  handleSubmit = () => {
    const { form, helmInfo, appInfo, appTypes } = this.props;
    form.validateFields((err, fieldsValue) => {
      const info = Object.assign({}, fieldsValue, {
        app_template_name: (appInfo && appInfo.name) || '',
        app_store_name: helmInfo && helmInfo.name,
        app_store_url: helmInfo && helmInfo.url
      });
      if (!err) {
        this.setState({ helmInstallLoading: false });
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

  handleFieldsValue = info => {
    const { form } = this.props;
    const { setFieldsValue } = form;
    setFieldsValue(info);
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
        team_name: vals.team_name,
        region_name: vals.region_name
      },
      callback: () => {
        onCancel();
        this.jump(vals.team_name, vals.region_name, vals.group_id);
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
          this.jump(vals.team_name, vals.region_name, res.bean.ID);
        }
        this.handleInstallLoading();
      }
    });
  };
  handleInstallLoading = () => {
    this.setState({ helmInstallLoading: false });
  };
  handleTeamChange = teamName => {
    const { form, appTypes, appInfo } = this.props;
    const { setFieldsValue, getFieldValue } = form;
    const { userTeamList } = this.state;
    let regionList = [];
    userTeamList.map(item => {
      if (item.team_name === teamName) {
        regionList = item.region_list;
      }
    });
    if (regionList && regionList.length > 0) {
      const regionName = regionList[0].region_name;
      this.setState({ regionList }, () => {
        setFieldsValue({
          region_name: regionName
        });
        const appName = getFieldValue('app_name') || (appInfo && appInfo.name);
        if (appTypes === 'helmContent') {
          this.handleCheckAppName(teamName, regionName, appName);
        } else {
          this.fetchGroup(teamName, regionName);
        }
      });
    } else {
      this.setState({
        regionList: [],
        groups: []
      });
      setFieldsValue({
        team_name: teamName || undefined,
        region_name: undefined,
        group_id: undefined
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
  handleAddGroup = (groupId, groups) => {
    const { form } = this.props;
    const { setFieldsValue } = form;
    this.setState({ groups: groups || [] });
    setFieldsValue({ group_id: groupId });
    this.cancelAddGroup();
  };

  handleCreateTeam = values => {
    const { dispatch, form } = this.props;
    const { setFieldsValue } = form;
    dispatch({
      type: 'teamControl/createTeam',
      payload: values,
      callback: res => {
        if (res && res.bean && res.bean.tenant_name) {
          const teamName = res.bean.tenant_name;
          this.fetchCreateAppTeams(teamName);
          setFieldsValue({
            team_name: teamName
          });
        }
        this.cancelCreateTeam();
      }
    });
  };
  cancelCreateTeam = () => {
    this.setState({ showAddTeam: false });
  };

  renderSuccessOnChange = () => {
    this.setState({
      isDeploy: !this.state.isDeploy
    });
  };
  render() {
    const { eid, onCancel, title, appInfo, form, appTypes } = this.props;
    const { getFieldDecorator, getFieldValue } = form;
    const {
      regionList,
      userTeamList,
      appName,
      helmInstallLoading,
      groups,
      addGroup,
      isDeploy,
      showAddTeam
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
    const regionName = getFieldValue('region_name');
    return (
      <div>
        {showAddTeam && (
          <CreateTeam
            enterprise_id={eid}
            onOk={this.handleCreateTeam}
            onCancel={this.cancelCreateTeam}
          />
        )}
        {addGroup && (
          <AddGroup
            teamName={teaName}
            regionName={regionName}
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
          footer={
            <Fragment>
              <Button onClick={onCancel}>  <FormattedMessage id='button.cancel'/></Button>
              <Button
                type="primary"
                onClick={this.handleSubmit}
                loading={helmInstallLoading}
              >
                <FormattedMessage id='button.confirm'/>
              </Button>
            </Fragment>
          }
        >
          <Form onSubmit={this.handleSubmit} layout="horizontal">
            <FormItem {...formItemLayout}  label={<FormattedMessage id='applicationMarket.CreateHelmAppModels.name'/>}>
              {getFieldDecorator('team_name', {
                rules: [
                  {
                    required: true,
                    message:formatMessage({id:'applicationMarket.CreateHelmAppModels.input_team'})
                  }
                ],
                initialValue: (userTeams && userTeams[0].team_name) || undefined
              })(
                <Select
                  style={{ width: 220, marginRight: 15 }}
                  onChange={this.handleTeamChange}
                  placeholder={formatMessage({id:'applicationMarket.CreateHelmAppModels.input_team'})}
                >
                  {userTeams &&
                    userTeams.map(item => (
                      <Option key={item.team_name} value={item.team_name}>
                        {item.team_alias}
                      </Option>
                    ))}
                </Select>
              )}
              <Button onClick={this.onAddTeam}><FormattedMessage id='applicationMarket.CreateHelmAppModels.creat_team'/></Button>
              <div className={styles.conformDesc}>
                <FormattedMessage id='applicationMarket.CreateHelmAppModels.install_app'/>
              </div>
            </FormItem>
            <FormItem {...formItemLayout}  label={<FormattedMessage id='applicationMarket.CreateHelmAppModels.colony'/>}>
              {getFieldDecorator('region_name', {
                initialValue: undefined,
                rules: [
                  {
                    required: true,
                    message:formatMessage({id:'applicationMarket.CreateHelmAppModels.select_colony'})
                  }
                ]
              })(
                <Select  placeholder={formatMessage({id:'applicationMarket.CreateHelmAppModels.select_colony'})}style={{ width: '323px' }}>
                  {regionList.map(item => (
                    <Option key={item.region_name} value={item.region_name}>
                      {item.region_alias}
                    </Option>
                  ))}
                </Select>
              )}
              <div className={styles.conformDesc}><FormattedMessage id='applicationMarket.CreateHelmAppModels.select_app_colony'/></div>
            </FormItem>

            {appTypes === 'helmContent' ? (
              <FormItem {...formItemLayout}  label={<FormattedMessage id='applicationMarket.CreateHelmAppModels.app_name'/>}>
                {getFieldDecorator('app_name', {
                  initialValue: appName,
                  validateTrigger: 'onBlur',
                  rules: [
                    {
                      required: true,
                      message: formatMessage({id:'placeholder.group_name'})
                    },
                    {
                      min: 4,
                      message:formatMessage({id:'applicationMarket.CreateHelmAppModels.min'})
                    },
                    {
                      max: 53,
                      message:formatMessage({id:'applicationMarket.CreateHelmAppModels.max'})
                    },
                    {
                      pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/,
                      message:formatMessage({id:'applicationMarket.CreateHelmAppModels.only'})

                    },
                    {
                      validator: (_, value, callback) => {
                        this.handleCheckAppName(
                          teaName,
                          regionName,
                          value,
                          callback
                        );
                      }
                    }
                  ]
                })(
                  <Input style={{ width: '323px' }}  placeholder={formatMessage({id:'applicationMarket.CreateHelmAppModels.input_name'})}/>
                )}
                <div className={styles.conformDesc}>
                  <FormattedMessage id='applicationMarket.CreateHelmAppModels.input_number'/>
                </div>
              </FormItem>
            ) : (
              <Form.Item {...formItemLayout}  label={<FormattedMessage id='applicationMarket.CreateHelmAppModels.select_app'/>}>
                {getFieldDecorator('group_id', {
                  rules: [
                    {
                      required: true,
                      message:formatMessage({id:'applicationMarket.CreateHelmAppModels.input_app'})
                    }
                  ]
                })(
                  <Select
                    placeholder={formatMessage({id:'applicationMarket.CreateHelmAppModels.input_name'})}
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
                <Button onClick={this.onAddGroup}>
                {formatMessage({id:'popover.newApp.title'})}
                </Button>
                <div className={styles.conformDesc}><FormattedMessage id='applicationMarket.CreateHelmAppModels.input_install'/></div>
              </Form.Item>
            )}

            <FormItem {...formItemLayout}  label={<FormattedMessage id='applicationMarket.CreateHelmAppModels.version'/>}>
              {getFieldDecorator('version', {
                initialValue:
                  versions && (versions[0].version || versions[0].app_version),
                rules: [
                  {
                    required: true,
                    message:formatMessage({id:'applicationMarket.CreateHelmAppModels.select_version'})
                  }
                ]
              })(
                <Select style={{ width: '323px' }}>
                  {versions &&
                    versions.map(item => {
                      const val = item.version || item.app_version;
                      return (
                        <Option key={item.version} value={val}>
                          {val}
                        </Option>
                      );
                    })}
                </Select>
              )}
              <div className={styles.conformDesc}><FormattedMessage id='applicationMarket.CreateHelmAppModels.select_version_app'/></div>
            </FormItem>
            <FormItem {...formItemLayout}  label={<FormattedMessage id='applicationMarket.CreateHelmAppModels.install'/>}>
              {getFieldDecorator('note', {
                initialValue: appInfo.versions
                  ? appInfo.versions[0].description || appInfo.describe
                  : '',
                rules: [
                  {
                    max: 255,
                    message:formatMessage({id:'applicationMarket.CreateHelmAppModels.max_num'})
                  }
                ]
              })(
                <Input.TextArea
                  placeholder={formatMessage({id:'applicationMarket.CreateHelmAppModels.remarks'})}
                  style={{ width: '323px' }}
                />
              )}
              <div className={styles.conformDesc}><FormattedMessage id='applicationMarket.CreateHelmAppModels.describe'/></div>
            </FormItem>

            {appTypes !== 'helmContent' && (
              <FormItem {...formItemLayout}  label={<FormattedMessage id='applicationMarket.CreateHelmAppModels.start'/>}>
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
