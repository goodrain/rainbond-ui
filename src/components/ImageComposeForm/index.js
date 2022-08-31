import { Button, Card, Form, Input } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import CodeMirrorForm from '../../components/CodeMirrorForm';

@connect(
  ({ global, loading }) => ({
    groups: global.groups,
    createAppByCompose: loading.effects['createApp/createAppByCompose']
  }),
  null,
  null,
  { withRef: true }
)
@Form.create()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      showUsernameAndPass: false
    };
  }
  handleSubmit = e => {
    e.preventDefault();
    const { form, onSubmit } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (!err && onSubmit) {
        onSubmit(fieldsValue);
      }
    });
  };
  // 团队命名空间的检验
  handleValiateNameSpace = (_, value, callback) => {
    if (!value) {
      return callback(new Error(formatMessage({id: 'placeholder.k8s_component_name'})));
    }
    if (value && value.length <= 32) {
      const Reg = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
      if (!Reg.test(value)) {
        return callback(
          formatMessage({id: 'placeholder.nameSpaceReg'})
        );
      }
      callback();
    }
    if (value.length > 32) {
      return callback(new Error(formatMessage({id: 'placeholder.max32'})));
    }
  };
  render() {
    const formItemLayout = {
      labelCol: {
        span: 7
      },
      wrapperCol: {
        span: 17
      }
    };
    const {
      form,
      data = {},
      createAppByCompose,
      showSubmitBtn = true
    } = this.props;
    const { getFieldDecorator, setFieldsValue } = form;
    return (
      <Fragment>
        <Card style={{ width: '800px', margin: '0 auto' }} bordered={false}>
          <Form
            autocomplete="off"
            onSubmit={this.handleSubmit}
            layout="horizontal"
            hideRequiredMark
          >
            <Form.Item {...formItemLayout} label={formatMessage({id: 'teamAdd.create.form.appName'})}>
              {getFieldDecorator('group_name', {
                initialValue: data.group_name || '',
                rules: [{ required: true, message: formatMessage({id: 'placeholder.appName'}) }]
              })(
                <Input
                  style={{ maxWidth: 300 }}
                  placeholder={formatMessage({id: 'placeholder.appName'})}
                  autocomplete="off"
                />
              )}
            </Form.Item>
            <Form.Item {...formItemLayout} label={formatMessage({id: 'teamAdd.create.form.k8s_component_name'})}>
              {getFieldDecorator('k8s_app', {
                rules: [
                  { required: true, validator: this.handleValiateNameSpace }
                ]
              })(<Input placeholder={formatMessage({id: 'placeholder.k8s_component_name'})} />)}
            </Form.Item>
            <CodeMirrorForm
              setFieldsValue={setFieldsValue}
              formItemLayout={formItemLayout}
              Form={Form}
              // width="594px"
              getFieldDecorator={getFieldDecorator}
              name="yaml_content"
              label={formatMessage({id: 'teamAdd.create.image.config'})}
              message={formatMessage({id: 'placeholder.yaml_content'})}
              mode="yaml"
              data={data.yaml_content || ''}
            />

            <Form.Item {...formItemLayout} label={formatMessage({id: 'teamAdd.create.image.notice'})}>
              {formatMessage({id: 'teamAdd.create.image.configHint'})}{' '}
              <a
                onClick={() => {
                  this.setState({ showUsernameAndPass: true });
                }}
                href="javascript:;"
              >
                {formatMessage({id: 'teamAdd.create.image.hint2'})}
              </a>
            </Form.Item>
            <Form.Item
              style={{ display: this.state.showUsernameAndPass ? '' : 'none' }}
              {...formItemLayout}
              label={formatMessage({id: 'teamAdd.create.form.user'})}
            >
              {getFieldDecorator('user_name', {
                initialValue: data.user_name || '',
                rules: [{ required: false, message: formatMessage({id: 'placeholder.user_name'}) }]
              })(
                <Input
                  style={{ maxWidth: 300 }}
                  autoComplete="off"
                  placeholder={formatMessage({id: 'placeholder.user_name'})}
                />
              )}
            </Form.Item>
            <Form.Item
              style={{ display: this.state.showUsernameAndPass ? '' : 'none' }}
              {...formItemLayout}
              label={formatMessage({id: 'teamAdd.create.form.password'})}
            >
              {getFieldDecorator('password', {
                initialValue: data.password || '',
                rules: [{ required: false, message: formatMessage({id: 'placeholder.password'}) }]
              })(
                <Input
                  autoComplete="new-password"
                  type="password"
                  style={{ maxWidth: 300 }}
                  placeholder={formatMessage({id: 'placeholder.password'})}
                />
              )}
            </Form.Item>
            {showSubmitBtn ? (
              <Form.Item
                wrapperCol={{
                  xs: { span: 24, offset: 0 },
                  sm: {
                    span: formItemLayout.wrapperCol.span,
                    offset: formItemLayout.labelCol.span
                  }
                }}
                label=""
              >
                <Button
                  onClick={this.handleSubmit}
                  type="primary"
                  loading={createAppByCompose}
                >
                  {formatMessage({id: 'teamAdd.create.btn.create'})}
                </Button>
              </Form.Item>
            ) : null}
          </Form>
        </Card>
      </Fragment>
    );
  }
}
