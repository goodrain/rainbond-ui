/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
import cloud from '@/utils/cloud';
import { Button, Form, Modal, notification, Select, Table } from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { PureComponent } from 'react';
import styles from '../CreateTeam/index.less';

const { Option } = Select;
const FormItem = Form.Item;

@Form.create()
@connect()
export default class componentVersion extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      list: []
    };
  }

  componentDidMount() {
    this.fetchComponentVersion();
  }
  onOk = e => {
    e.preventDefault();
    const { form, onOk } = this.props;
    form.validateFields({ force: true }, (err, vals) => {
      if (!err && onOk) {
        onOk(vals);
      }
    });
  };

  fetchComponentVersion = serviceAlias => {
    const { dispatch, form, data = {}, team_name, group_id } = this.props;
    const { setFieldsValue } = form;

    dispatch({
      type: 'application/fetchComponentVersion',
      payload: {
        team_name,
        template_name: data.group_key,
        group_id
      },
      callback: res => {
        if (res && res.status_code === 200) {
          if (serviceAlias) {
            let setServiceAlias = '';
            if (res.list && res.list.length > 0) {
              res.list.map(item => {
                const { upgradable_versions: version } = item;
                if (serviceAlias === item.service_alias) {
                  setServiceAlias =
                    (version && version.length > 0 && version[0]) ||
                    (data.current_version &&
                      `当前版本:${data.current_version}`);
                }
              });
            }
            setFieldsValue({ [serviceAlias]: setServiceAlias });
          }
          this.setState({
            loading: false,
            list: res.list
          });
        }
      },
      handleError: errs => {
        cloud.handleCloudAPIError(errs);
        this.handleCancel();
      }
    });
  };
  handleDeploy = data => {
    const { team_name: teamName, dispatch, ok } = this.props;
    const { form } = this.props;
    const serviceAlias = data.service_alias;
    form.validateFields([`${serviceAlias}`], (err, fieldsValue) => {
      if (!err) {
        this.setState({
          loading: true
        });
        dispatch({
          type: 'appControl/putDeploy',
          payload: {
            team_name: teamName,
            app_alias: serviceAlias,
            group_version: fieldsValue[serviceAlias]
          },
          callback: res => {
            if (res && res.status_code === 200) {
              this.fetchComponentVersion(serviceAlias);
              if (ok) {
                ok();
              }
              notification.success({ message: `升级成功` });
            }
          },
          handleError: errs => {
            cloud.handleCloudAPIError(errs);
            this.handleCancel();
          }
        });
      }
    });
  };

  handleCancel = () => {
    this.setState({
      loading: false
    });
  };
  render() {
    const {
      title,
      onCancel,
      form,
      data: dataPro = {},
      team_name: teamName,
      region_name: regionName
    } = this.props;
    const { list, loading } = this.state;
    const { getFieldDecorator } = form;

    const dataSource = [
      {
        component_name: 'pariatur laborum fugiat',
        component_id: 'voluptate in ut do',
        component_key: 'ut',
        upgradable_versions: [
          'dolore mollit est',
          'mollit ullamco eu est',
          'labore consectetur ut dolor proident'
        ]
      },
      {
        component_name: 'dolor',
        component_id: 'commodo est',
        component_key: 'dolor sunt Excepteur dolore enim',
        upgradable_versions: [
          'dolore quis',
          'incididunt',
          'labore cillum',
          'elit adipisicing',
          'laboris in in tempor'
        ]
      }
    ];
    const columns = [
      {
        title: '组件名称',
        dataIndex: 'service_cname',
        key: 'service_cname',
        width: '40%',
        render: (v, data) => {
          return (
            <Link
              to={`/team/${teamName}/region/${regionName}/components/${data.service_alias}/overview`}
            >
              {v}
            </Link>
          );
        }
      },
      {
        title: '可升级版本',
        dataIndex: 'upgradable_versions',
        key: 'upgradable_versions',
        render: (val, data) => {
          const setVal = val && val.length > 0 && val[0];
          return (
            <Form>
              <FormItem style={{ margin: 0 }}>
                {getFieldDecorator(`${data.service_alias}`, {
                  initialValue:
                    setVal ||
                    (dataPro.current_version &&
                      `当前版本:${dataPro.current_version}`),
                  rules: [
                    {
                      required: true,
                      message: '不能为空!'
                    }
                  ]
                })(
                  <Select disabled={!setVal} onChange={this.handleChange}>
                    {val.map(item => {
                      return (
                        <Option key={item} value={item}>
                          {item}
                        </Option>
                      );
                    })}
                  </Select>
                )}
              </FormItem>
            </Form>
          );
        }
      },
      {
        title: '操作',
        dataIndex: 'component_id',
        rowKey: 'component_id',
        width: 130,
        render: (_, data) => {
          if (data.upgradable_versions && data.upgradable_versions.length > 0) {
            return (
              <Button
                type="link"
                style={{ padding: 0 }}
                onClick={() => {
                  this.handleDeploy(data);
                }}
              >
                升级
              </Button>
            );
          }
          return (
            <span
              style={{
                color: 'rgba(0, 0, 0, 0.45)'
              }}
            >
              无可升级的变更
            </span>
          );
        }
      }
    ];
    return (
      <Modal
        title={title || '组件版本'}
        visible
        width={800}
        confirmLoading={loading}
        className={styles.TelescopicModal}
        onCancel={onCancel}
        onOk={this.onOk}
        footer={[
          <Button style={{ marginTop: '20px' }} onClick={onCancel}>
            关闭
          </Button>
        ]}
      >
        <Table
          dataSource={list}
          columns={columns}
          loading={loading}
          pagination={false}
        />
      </Modal>
    );
  }
}
