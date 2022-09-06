import { Button, Form, Input, Modal, Select } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import globalUtil from '../../utils/global';
import styles from '../CreateTeam/index.less';

const { Option } = Select;
const formItemLayout = {
  labelCol: {
    span: 7
  },
  wrapperCol: {
    span: 17
  }
};
const FormItem = Form.Item;

@connect(({ global }) => ({ groups: global.groups }), null, null, {
  withRef: true
})
@Form.create()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      appName: ''
    };
  }
  componentDidMount() {
    this.handleCheckAppName(true);
  }
  fetchGroup = () => {
    this.props.dispatch({
      type: 'global/fetchGroups',
      payload: {
        team_name: globalUtil.getCurrTeamName()
      }
    });
  };

  handleCheckAppName = (initial, name, callbacks) => {
    const { dispatch, data } = this.props;
    const versions =
      data && data.versions && data.versions.length > 0 && data.versions;
    const appName = (initial && versions && versions[0].name) || name;
    dispatch({
      type: 'application/checkAppName',
      payload: {
        app_name: appName,
        regionName: globalUtil.getCurrRegionName(),
        tenantName: globalUtil.getCurrTeamName()
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
              name === (res.list && res.list.name) ? '' : `${formatMessage({id:'teamOther.CreateAppFromHelmForm.name'})}`;
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
    const { form, onSubmit, data } = this.props;
    // app_store_name;
    const versions =
      data && data.versions && data.versions.length > 0 && data.versions;
    form.validateFields((err, fieldsValue) => {
      const info = Object.assign({}, fieldsValue, {
        app_template_name: (versions && versions[0].name) || '',
        app_store_name: data.app_store_name,
        app_store_url: data.url
      });
      if (!err && onSubmit) {
        onSubmit(info, true);
      }
    });
  };

  render() {
    const { onCancel, data, form, installLoading = false } = this.props;
    const { getFieldDecorator } = form;
    const { appName } = this.state;
    const versions =
      data && data.versions && data.versions.length > 0 && data.versions;
    return (
      <Modal
        className={styles.TelescopicModal}
        visible={data}
        onCancel={onCancel}
        onOk={this.handleSubmit}
        title={formatMessage({id:'teamOther.CreateAppFromMarketForm.title'})}
        footer={[
          <Button onClick={onCancel}>{formatMessage({id:"button.cancel"})}</Button>,
          <Button
            onClick={this.handleSubmit}
            type="primary"
            style={{ marginRight: '5px' }}
            loading={installLoading}
          >
            {formatMessage({id:'button.install'})}
          </Button>
        ]}
      >
        <Form onSubmit={this.handleSubmit} layout="horizontal">
          <FormItem {...formItemLayout} label={formatMessage({id:'teamOther.CreateAppFromHelmForm.name_app'})}>
            {getFieldDecorator('app_name', {
              initialValue: appName,
              validateTrigger: 'onBlur',
              rules: [
                { required: true, message: formatMessage({id:'teamOther.CreateAppFromHelmForm.input_name'}) },
                {
                  min: 4,
                  message: formatMessage({id:'teamOther.CreateAppFromHelmForm.min'})
                },
                {
                  max: 53,
                  message: formatMessage({id:'teamOther.CreateAppFromHelmForm.max'})
                },
                {
                  pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/,
                  message: formatMessage({id:'teamOther.CreateAppFromHelmForm.only'})
                },
                {
                  validator: (_, value, callback) => {
                    this.handleCheckAppName(false, value, callback);
                  }
                }
              ]
            })(
              <Input placeholder={formatMessage({id:'teamOther.CreateAppFromHelmForm.input_name'})} style={{ width: '284px' }} />
            )}
          </FormItem>
          <FormItem {...formItemLayout} label={formatMessage({id:'teamOther.CreateAppFromHelmForm.version_app'})}>
            {getFieldDecorator('version', {
              initialValue: versions ? versions[0].version : '',
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'teamOther.CreateAppFromMarketForm.setect'})
                }
              ]
            })(
              <Select style={{ width: '284px' }}>
                {versions &&
                  versions.map((item, index) => {
                    return (
                      <Option key={index} value={item.version}>
                        {item.version}
                      </Option>
                    );
                  })}
              </Select>
            )}
          </FormItem>
          <FormItem {...formItemLayout} label={formatMessage({id:'teamOther.CreateAppFromHelmForm.note'})}>
            {getFieldDecorator('note', {
              initialValue: versions ? versions[0].description : '',
              rules: [
                {
                  max: 255,
                  message: formatMessage({id:'teamOther.CreateAppFromHelmForm.max_length'})
                }
              ]
            })(
              <Input.TextArea
                placeholder={formatMessage({id:'teamOther.CreateAppFromHelmForm.note_app'})}
                style={{ width: '284px' }}
              />
            )}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
