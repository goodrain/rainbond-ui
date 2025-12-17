/* eslint-disable camelcase */
import Parameterinput from '@/components/Parameterinput';
import { batchOperation } from '@/services/app';
import { createEnterprise, createTeam } from '@/utils/breadcrumb';
import globalUtil from '@/utils/global';
import roleUtil from '@/utils/role';
import {
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  Modal,
  notification,
  Row,
  Switch
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import ConfigurationHeader from '../Header';
import styles from './index.less';

const FormItem = Form.Item;
const { confirm } = Modal;

@connect(({ loading, teamControl, enterprise }) => ({
  AddConfigurationLoading: loading.effects['global/AddConfiguration'],
  EditConfigurationLoading: loading.effects['global/EditConfiguration'],
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
}))
@Form.create()
export default class ConfigurationDetails extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      apps: [],
      info: {},
      loading: true,
      helpfulVisable: false,
      // appConfigGroupPermissions: this.handlePermissions(
      //   'queryAppConfigGroupInfo'
      // ),
      allChecked: false
    };
  }
  componentWillMount() {
    const { dispatch } = this.props;
    // const {
    //   appConfigGroupPermissions: { isCreate, isEdit }
    // } = this.state;
    // if (!isCreate && !isEdit) {
    //   globalUtil.withoutPermission(dispatch);
    // }
  }
  componentDidMount() {
    this.loadConfigurationDetails();
  }
  onChangeGroup = checkedValues => {
    this.setState({
      allChecked: this.state.apps.length === checkedValues.length
    });
  };
  onOk = e => {
    e.preventDefault();
    const { form } = this.props;
    const { id } = this.handleParameter();

    form.validateFields({ force: true }, (err, vals) => {
      if (!err) {
        if (vals.enable === undefined) {
          vals.enable = false;
        }
        if (
          vals.config_items &&
          vals.config_items.length === 1 &&
          vals.config_items[0].item_key === '' &&
          (vals.config_items[0].item_value === '' ||
            vals.config_items[0].item_value)
        ) {
          vals.config_items = [];
        }
        const parameter = Object.assign({}, vals, { deploy_type: 'env' });
        this.handleHelpfulVisable(parameter);
      }
    });
  };

  onCancel = () => {
    const { dispatch } = this.props;
    const { regionName, teamName, appID } = this.handleParameter();
    dispatch(
      routerRedux.push(
        `/team/${teamName}/region/${regionName}/apps/${appID}/configgroups`
      )
    );
  };
  handlePermissions = type => {
    const { currentTeamPermissionsInfo } = this.props;
    return roleUtil.querySpecifiedPermissionsInfo(
      currentTeamPermissionsInfo,
      type
    );
  };
  handleConfiguration = vals => {
    const { dispatch } = this.props;
    const { info } = this.state;
    const { teamName, regionName, appID, id } = this.handleParameter();

    const parameter = {
      region_name: regionName,
      team_name: teamName,
      group_id: appID,
      ...vals
    };
    const { service_ids: serviceIds, enable } = vals;
    if (`${id}` === 'add') {
      dispatch({
        type: 'global/AddConfiguration',
        payload: {
          ...parameter
        },
        callback: res => {
          if (res) {
            this.handleClose();
            notification.success({ message: formatMessage({id:'notification.success.add'}) });
            if (serviceIds && serviceIds.length > 0 && enable) {
              this.showRemind(serviceIds);
            } else {
              this.onCancel();
            }
          }
        }
      });
    } else {
      dispatch({
        type: 'global/EditConfiguration',
        payload: {
          name: id,
          ...parameter
        },
        callback: res => {
          if (res) {
            const arr = [];
            let UpDataList = [];
            if (info && info.services && info.services.length > 0) {
              info.services.map(item => {
                if (item.service_id) {
                  arr.push(item.service_id);
                }
              });
            }
            if ((serviceIds && serviceIds.length > 0) || arr.length > 0) {
              UpDataList = Array.from(new Set([...serviceIds, ...arr]));
            }

            notification.success({ message: formatMessage({id:'notification.success.save'}) });
            this.handleClose();
            if (UpDataList.length > 0) {
              this.showRemind(UpDataList);
            } else {
              this.onCancel();
            }
          }
        }
      });
    }
  };

  showRemind = serviceIds => {
    const th = this;
    confirm({
      title: formatMessage({id:'notification.hint.confiuration.update.title'}),
      content: formatMessage({id:'notification.hint.confiuration.update.content'}),
      okText: formatMessage({id:'button.update'}),
      cancelText: formatMessage({id:'button.cancel'}),
      onOk() {
        th.handleBatchOperation(serviceIds);
        return new Promise((resolve, reject) => {
          setTimeout(Math.random() > 0.5 ? resolve : reject, 2000);
        }).catch(() => console.log('Oops errors!'));
      },
      onCancel() {
        th.onCancel();
      }
    });
  };
  handleBatchOperation = serviceIds => {
    const { teamName } = this.handleParameter();
    batchOperation({
      action: 'upgrade',
      team_name: teamName,
      serviceIds:
        serviceIds && serviceIds.length > 0 ? serviceIds.join(',') : ''
    }).then(data => {
      if (data) {
        this.onCancel();
      }
    });
  };

  loadComponents = () => {
    const { dispatch } = this.props;
    const { info } = this.state;
    const { teamName, regionName, appID, id } = this.handleParameter();
    dispatch({
      type: 'application/fetchApps',
      payload: {
        team_name: teamName,
        region_name: regionName,
        group_id: appID,
        page: 1,
        page_size: 999
      },
      callback: res => {
        if (res && res.status_code === 200) {
          if (res.list && res.list.length > 0) {
            const arr = res.list.filter(
              item => item.service_source !== 'third_party'
            );
            this.setState({
              apps: arr
            });
            if (info && info.services && info.services.length > 0) {
              this.setState({
                allChecked: arr.length === info.services.length
              });
            }
          }
          if (id === 'add') {
            this.setState({
              loading: false
            });
          }
        }
      }
    });
  };

  loadConfigurationDetails = () => {
    const { dispatch } = this.props;
    const { teamName, appID, id } = this.handleParameter();
    if (id !== 'add') {
      dispatch({
        type: 'global/fetchConfigurationDetails',
        payload: {
          team_name: teamName,
          group_id: appID,
          name: id
        },
        callback: res => {
          if (res && res.status_code === 200) {
            this.setState(
              {
                info: res.bean,
                loading: false
              },
              () => {
                this.loadComponents();
              }
            );
          }
        }
      });
    } else {
      this.loadComponents();
    }
  };

  checkConfiguration = (rule, value, callback) => {
    if (value && value.length > 0) {
      const arr = value.filter(item => item.item_key === '');
      if (value[0].item_key === '' && value[0].item_value === '') {
        callback();
      } else if (arr && arr.length > 0) {
        callback(formatMessage({id:'placeholder.contiguration.msg.not_null'}));
      } else {
        let judge = false;
        let isMax = false;
        value.map(item => {
          const { item_key, item_value } = item;
          if (!/^[-._a-zA-Z][-._a-zA-Z0-9]*$/.test(item_key)) {
            judge = true;
          }
          if (item_key.length > 65535 || item_value.length > 65535) {
            isMax = true;
          }
        });
        if (judge) {
          callback(formatMessage({id:'placeholder.contiguration.msg.rule'}));
          return;
        }
        if (isMax) {
          callback(formatMessage({id:'placeholder.max65535'}));
          return;
        }
        callback();
      }
    }
    callback();
  };
  handleHelpfulVisable = parameter => {
    this.setState({ helpfulVisable: parameter });
  };
  handleClose = () => {
    this.setState({ helpfulVisable: false });
  };

  handleParameter = () => {
    const { match } = this.props;
    const { teamName, regionName, appID, id } = match.params;
    return {
      regionName,
      teamName,
      appID,
      id
    };
  };
  handleIsAll = () => {
    const { setFieldsValue } = this.props.form;
    const { apps, allChecked } = this.state;
    const serviceId = allChecked ? [] : apps.map(item => item.service_id);
    setFieldsValue({ service_ids: serviceId });
    this.setState({ allChecked: !allChecked });
  };

  render() {
    const {
      form,
      AddConfigurationLoading,
      EditConfigurationLoading,
      currentEnterprise,
      currentTeam,
      currentRegionName
    } = this.props;
    const { apps, info, loading, helpfulVisable, allChecked } = this.state;
    const { getFieldDecorator } = form;
    const serviceIds = [];
    if (info && info.services && info.services.length > 0) {
      info.services.map(item => {
        serviceIds.push(item.service_id);
      });
    }

    const { id } = this.handleParameter();
    const isCreate = id === 'add';
    let breadcrumbList = [];
    breadcrumbList = createTeam(
      createEnterprise(breadcrumbList, currentEnterprise),
      currentTeam,
      currentRegionName
    );

    return (
      <ConfigurationHeader breadcrumbList={breadcrumbList}>
        {helpfulVisable && (
          <Modal
            visible
            title={formatMessage({id:"appConfiguration.table.title"})}
            confirmLoading={AddConfigurationLoading || EditConfigurationLoading}
            onOk={() => {
              this.handleConfiguration(helpfulVisable);
            }}
            onCancel={this.handleClose}
          >
            <p>{formatMessage({id:'appConfiguration.table.save'})}</p>

          </Modal>
        )}
        <Card
          loading={loading}
          style={{ minHeight: '600px' }}
          title={isCreate ? formatMessage({id:'appConfiguration.btn.add'}) : formatMessage({id:'appConfiguration.btn.edit'})}
          extra={[
            <Button onClick={this.onCancel} style={{ marginRight: '20px' }}>
              {formatMessage({id:'button.cancel'})}
            </Button>,
            <Button
              type="primary"
              onClick={this.onOk}
              loading={AddConfigurationLoading || EditConfigurationLoading}
            >
              {isCreate ? formatMessage({id:'button.confirm'}) : formatMessage({id:'button.save'})}
            </Button>
          ]}
        >
          <Form
            onSubmit={this.onOk}
            style={{ margin: '0 auto', width: '820px' }}
          >
            <Row style={{ display: 'flex', alignItems: 'center' }}>
              <FormItem style={{ width: '370px' }} label={formatMessage({id:'appConfiguration.table.name'})}>
                {getFieldDecorator('config_group_name', {
                  initialValue: (info && info.config_group_name) || '',
                  rules: [
                    { required: true, message: formatMessage({id:'placeholder.contiguration.msg.config_group_name'}) },
                    {
                      min: 2,
                      message: formatMessage({id:'placeholder.contiguration.msg.min2'})
                    },
                    {
                      max: 64,
                      message: formatMessage({id:'placeholder.appShare.max64'})
                    },
                    {
                      pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
                      message: formatMessage({id:'placeholder.k8s_service_name.msg'})
                    }
                  ]
                })(
                  <Input
                    style={{ width: '370px' }}
                    disabled={info && info.config_group_name}
                    placeholder={formatMessage({id:'placeholder.contiguration.msg.config_group_name'})}
                  />
                )}
              </FormItem>
              <Form.Item
                style={{ width: '370px', marginLeft: '24px' }}
                label={formatMessage({id:'appConfiguration.table.enable'})}
              >
                {getFieldDecorator('enable', {
                  initialValue: info && info.enable,
                  rules: [{ required: false }]
                })(<Switch defaultChecked={info && info.enable} />)}
              </Form.Item>
            </Row>
            <FormItem label={formatMessage({id:'appConfiguration.table.config_items'})}>
              {getFieldDecorator('config_items', {
                initialValue: (info && info.config_items) || [],
                rules: [
                  { required: false, message: formatMessage({id:'placeholder.contiguration.msg.config_items'}) },
                  {
                    validator: this.checkConfiguration
                  }
                ]
              })(
                <Parameterinput editInfo={(info && info.config_items) || ''} />
              )}
            </FormItem>
            {apps.length > 0 && (
              <FormItem label={formatMessage({id:'appConfiguration.table.service_ids'})}>
                <Checkbox checked={allChecked} onChange={this.handleIsAll}>
                  {formatMessage({id:'appConfiguration.table.btn.all'})}
                </Checkbox>
                {getFieldDecorator('service_ids', {
                  initialValue: serviceIds,
                  rules: [{ required: false, message: formatMessage({id:'placeholder.contiguration.msg.service_ids'}) }]
                })(
                  <Checkbox.Group
                    className={styles.setCheckbox}
                    onChange={this.onChangeGroup}
                  >
                    <Row span={24}>
                      {apps.map(item => {
                        const {
                          service_cname: name,
                          service_id: serviceId
                        } = item;
                        return (
                          <Checkbox key={id} value={serviceId}>
                            <div title={name}>{name}</div>
                          </Checkbox>
                        );
                      })}
                    </Row>
                  </Checkbox.Group>
                )}
              </FormItem>
            )}
          </Form>
        </Card>
      </ConfigurationHeader>
    );
  }
}
