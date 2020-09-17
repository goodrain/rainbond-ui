import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import {
  Form,
  Input,
  Card,
  Switch,
  Checkbox,
  Row,
  Col,
  Button,
  notification,
  Modal
} from 'antd';
import Parameterinput from '@/components/Parameterinput';
import styles from './index.less';

const FormItem = Form.Item;
const { confirm } = Modal;

@connect(({ loading }) => ({
  AddConfigurationLoading: loading.effects['groupControl/AddConfiguration'],
  EditConfigurationLoading: loading.effects['groupControl/EditConfiguration']
}))
@Form.create()
export default class ConfigurationDetails extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      apps: [],
      info: {}
    };
  }
  componentDidMount() {
    this.loadComponents();
  }
  onOk = e => {
    e.preventDefault();
    const { form } = this.props;
    form.validateFields({ force: true }, (err, vals) => {
      if (!err) {
        this.handleConfiguration(
          Object.assign({}, vals, { deploy_type: 'env' })
        );
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
  handleConfiguration = vals => {
    const { dispatch } = this.props;
    const { teamName, appID, id } = this.handleParameter();
    const parameter = {
      team_name: teamName,
      group_id: appID,
      ...vals
    };
    const { service_ids: serviceIds } = vals;
    const { info } = this.state;
    if (id === 'add') {
      dispatch({
        type: 'groupControl/AddConfiguration',
        payload: {
          ...parameter
        },
        callback: res => {
          if (res) {
            notification.success({ message: '添加成功' });
            if (serviceIds && serviceIds.length > 0) {
              this.showRemind();
            }
          }
        }
      });
    } else if (info) {
      dispatch({
        type: 'groupControl/EditConfiguration',
        payload: {
          ...parameter
        },
        callback: res => {
          if (res) {
            notification.success({ message: '保存成功' });
            if (serviceIds && serviceIds.length > 0) {
              this.showRemind();
            }
          }
        }
      });
    }
  };

  showRemind = () => {
    confirm({
      title: '更新组件',
      content: '是否立即更新组件',
      onOk() {
        this.handlePromptModalOpen();
      },
      onCancel() {
        this.onCancel();
      }
    });
  };

  handlePromptModalOpen = () => {
    const { teamName, appID } = this.handleParameter();
    const { dispatch } = this.props;
    dispatch({
      type: 'global/buildShape',
      payload: {
        tenantName: teamName,
        group_id: appID,
        action: 'upgrade'
      },
      callback: data => {
        notification.success({
          message: data.msg_show,
          duration: '3'
        });
        this.onCancel();
      }
    });
  };

  loadComponents = () => {
    const { dispatch } = this.props;
    const { teamName, regionName, appID } = this.handleParameter();
    dispatch({
      type: 'groupControl/fetchApps',
      payload: {
        team_name: teamName,
        region_name: regionName,
        group_id: appID,
        page: 1,
        page_size: 999
      },
      callback: data => {
        if (data && data._code == 200) {
          this.setState({
            apps: data.list || []
          });
        }
      }
    });
  };
  checkConfiguration = (rule, value, callback) => {
    const visit = this.props.form.getFieldValue('configuration');
    if (visit && visit.length > 0) {
      const arr = visit.filter(item => item.key === '' || item.value === '');
      if (arr && arr.length > 0) {
        callback('配置项不能为空');
      }
      callback();
      return;
    }

    callback();
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
  render() {
    const {
      form,
      AddConfigurationLoading,
      EditConfigurationLoading
    } = this.props;
    const { apps, info } = this.state;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 3 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 19 }
      }
    };
    const formItemLayouts = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 14 }
      }
    };

    const serviceIds = [];
    if (info && info.services && info.services.length > 0) {
      info.services.map(item => {
        serviceIds.push(item.service_id);
      });
    }

    const { id } = this.handleParameter();
    return (
      <Card
        style={{ minHeight: '600px' }}
        title={id === 'add' ? '添加配置组' : '修改配置组'}
        extra={[
          <Button onClick={this.onCancel} style={{ marginRight: '20px' }}>
            取消
          </Button>,
          <Button
            type="primary"
            onClick={this.onOk}
            loading={AddConfigurationLoading || EditConfigurationLoading}
          >
            {id === 'add' ? '确定' : '保存'}
          </Button>
        ]}
      >
        <Form onSubmit={this.onOk}>
          <Row>
            <Col span={12}>
              <FormItem {...formItemLayouts} label="配置组名称">
                {getFieldDecorator('config_group_name', {
                  initialValue: (info && info.config_group_name) || '',
                  rules: [
                    { required: true, message: '请填写配置组名称' },
                    {
                      min: 2,
                      message: '最小长度2位'
                    },
                    {
                      max: 64,
                      message: '最大长度64位'
                    },
                    {
                      pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
                      message:
                        '必须由小写的字母、数字和-组成，并且必须以字母数字开始和结束'
                    }
                  ]
                })(
                  <Input
                    disabled={info && info.config_group_name}
                    placeholder="请填写配置组名称"
                  />
                )}
              </FormItem>
            </Col>
            <Col span={8} style={{ marginLeft: '-30px' }}>
              <Form.Item {...formItemLayout} label="状态">
                {getFieldDecorator('state', {
                  initialValue: (info && info.state) || true,
                  rules: [{ required: true }]
                })(<Switch />)}
              </Form.Item>
            </Col>
          </Row>
          <FormItem {...formItemLayout} label="配置项">
            {getFieldDecorator('config_items', {
              initialValue: (info && info.config_items) || '',
              rules: [
                { required: true, message: '请填写配置项' },
                {
                  validator: this.checkConfiguration
                }
              ]
            })(<Parameterinput editInfo={(info && info.config_items) || ''} />)}
          </FormItem>
          <FormItem {...formItemLayout} label="组件">
            {getFieldDecorator('service_ids', {
              initialValue: serviceIds,
              rules: [{ required: true, message: '请选择组件' }]
            })(
              <Checkbox.Group className={styles.setCheckbox}>
                <Row span={24}>
                  {apps.map(item => {
                    const { service_cname: name, service_id: id } = item;
                    return (
                      <Checkbox key={id} value={id}>
                        {name}
                      </Checkbox>
                    );
                  })}
                </Row>
              </Checkbox.Group>
            )}
          </FormItem>
        </Form>
      </Card>
    );
  }
}
