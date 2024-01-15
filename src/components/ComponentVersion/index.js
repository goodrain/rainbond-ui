/* eslint-disable camelcase */
/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
import {
  Button,
  Form,
  Modal,
  notification,
  Select,
  Table,
  Tooltip
} from 'antd';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { Link } from 'dva/router';
import React, { PureComponent } from 'react';
import handleAPIError from '../../utils/error';
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

  fetchComponentVersion = () => {
    const { dispatch, form, data = {}, team_name, group_id } = this.props;
    const { setFieldsValue } = form;

    dispatch({
      type: 'application/fetchComponentVersion',
      payload: {
        team_name,
        app_model_key: data.group_key,
        upgrade_group_id: data.upgrade_group_id,
        group_id
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            list: res.list
          });
        }
        this.handleCancel();
      },
      handleError: errs => {
        this.handleError(errs);
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
          type: 'appControl/putUpgrade',
          payload: {
            team_name: teamName,
            app_alias: serviceAlias,
            group_version: fieldsValue[serviceAlias]
          },
          callback: res => {
            if (res && res.status_code === 200) {
              this.fetchComponentVersion();
              if (ok) {
                ok();
              }
              notification.success({ message: formatMessage({id:'notification.success.upgrade_successfully'}) });
            }
          },
          handleError: errs => {
            this.handleError(errs);
          }
        });
      }
    });
  };

  handleError = errs => {
    handleAPIError(errs);
    this.handleCancel();
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

    const columns = [
      {
        title: '组件名称',
        dataIndex: 'service_cname',
        key: 'service_cname',
        width: 180,
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
        title: '当前版本',
        dataIndex: 'current_version',
        key: 'current_version',
        width: 180,
        render: val => {
          return (
            <Tooltip title={val}>
              <div className={styles.over}>{val}</div>
            </Tooltip>
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
                  initialValue: setVal || `无`,
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
        align: 'center',
        width: 150,
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
              无可升级的版本
            </span>
          );
        }
      }
    ];
    return (
      <Modal
        title={title || '组件列表'}
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
          rowKey={(record,index) => index}
          dataSource={list}
          columns={columns}
          loading={loading}
          pagination={false}
        />
      </Modal>
    );
  }
}
