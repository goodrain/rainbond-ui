import { Alert, Divider, Form, Icon, Input, Modal, Select } from 'antd';
import { Link } from 'dva/router';
import React, { PureComponent } from 'react';
import globalUtil from '../../utils/global';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import cookie from '../../utils/cookie';

const FormItem = Form.Item;
const Option = Select.Option;

@Form.create()
export default class AddDomain extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      language: cookie.get('language') === 'zh-CN' ? true : false
    };
  }
  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields(
      {
        force: true
      },
      (err, values) => {
        if (!err) {
          if(values.certificate_id){
            values.certificate_id = values.certificate_id.key
          }
          this.props.onOk && this.props.onOk(values);
        }
      }
    );
  };
  handleCancel = () => {
    this.props.onCancel && this.props.onCancel();
  };
  checkKey = (rule, value, callback) => {
    const visitType = this.props.form.getFieldValue('protocol');
    if (visitType == 'http') {
      callback();
      return;
    }

    if (visitType != 'http' && value) {
      callback();
      return;
    }

    callback();

  };
  render() {
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const { language } = this.state;
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 5
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 16
        }
      }
    };
    const en_formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 7
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 16
        }
      }
    };
    const is_language = language ? formItemLayout : en_formItemLayout
    const protocol = getFieldValue('protocol') || 'http';
    const { isAddLicense, certificates, addLicense } = this.props;
    return (
      <Modal
        title={<FormattedMessage id='componentOverview.body.AddDomain.title'/>}
        onOk={this.handleSubmit}
        visible
        onCancel={this.handleCancel}
      >
        <Alert
          style={{ textAlign: 'center', marginBottom: 16 }}
          message={<FormattedMessage id='componentOverview.body.AddDomain.message'/>}
          type="warning"
        />
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...is_language}  label={<FormattedMessage id='componentOverview.body.AddDomain.title'/>}>
            {getFieldDecorator('protocol', {
              initialValue: 'http',
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'componentOverview.body.AddDomain.label_protocol.required'})

                }
              ]
            })(
              <Select getPopupContainer={triggerNode => triggerNode.parentNode}>
                <Option value="http">HTTP</Option>
                <Option value="https">HTTPS</Option>
                <Option value="httptohttps"><FormattedMessage id='componentOverview.body.AddDomain.httptohttps'/></Option>
                <Option value="httpandhttps"><FormattedMessage id='componentOverview.body.AddDomain.httpandhttps'/></Option>
              </Select>
            )}
          </FormItem>
          <FormItem {...is_language} label={<FormattedMessage id='componentOverview.body.AddDomain.label_protocol.domain'/>}>
            {getFieldDecorator('domain', {
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'componentOverview.body.AddDomain.label_protocol.requireds'})

                },
                {
                  pattern: /^(?=^.{3,255}$)[a-zA-Z0-9*][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/,
                  message: formatMessage({id:'componentOverview.body.AddDomain.label_protocol.pattern'})

                }
              ]
            })(<Input placeholder={formatMessage({id:'componentOverview.body.AddDomain.label_protocol.placeholder'})}/>)}
          </FormItem>
          {protocol == 'http' ? (
            ''
          ) : (
            <FormItem {...is_language} label={formatMessage({id:'componentOverview.body.AddDomain.lable_certificate_id'})} title={<FormattedMessage id='componentOverview.body.AddDomain.lable_certificate_id'/>}>
              {getFieldDecorator('certificate_id', {
                initialValue: '',
                rules: [
                  { required: true, message: formatMessage({id:'componentOverview.body.AddDomain.callback'}) },
                  {
                    validator: this.checkKey
                  }
                ]
              })(
                <Select
                  showSearch
                  allowClear
                  labelInValue
                  optionFilterProp="children"
                  filterOption={(input, option) => 
                    option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                  placeholder={formatMessage({id:'componentOverview.body.AddDomain.select.placeholder'})}
                >
                  {certificates.map(item => (
                    <Option key={item.id} value={item.id}>
                      {item.alias}
                    </Option>
                  ))}
                </Select>
              )}
              <p>
                <FormattedMessage id='componentOverview.body.AddDomain.no_available'/>
                <a
                  onClick={() => {
                    this.props.onCreateKey();
                  }}
                  href="javascript:;"
                >
                  <FormattedMessage id='componentOverview.body.AddDomain.new'/>
                </a>
              </p>
            </FormItem>
          )}

          <div>
            <FormattedMessage id='componentOverview.body.AddDomain.setting'/>
            <Link
              to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/gateway/control/http/true`}
              style={{
                wordBreak: 'break-all',
                wordWrap: 'break-word',
                color: '#1890ff'
              }}
            >
              <FormattedMessage id='componentOverview.body.AddDomain.into'/>
            </Link>
          </div>
        </Form>
      </Modal>
    );
  }
}
