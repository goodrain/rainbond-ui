import { Button, Card, Form, Input } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
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
  render() {
    const formItemLayout = {
      labelCol: {
        span: 5
      },
      wrapperCol: {
        span: 19
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
            <Form.Item {...formItemLayout} label="应用名称">
              {getFieldDecorator('group_name', {
                initialValue: data.group_name || '',
                rules: [{ required: true, message: '应用名称' }]
              })(
                <Input
                  style={{ maxWidth: 300 }}
                  placeholder="应用名称"
                  autocomplete="off"
                />
              )}
            </Form.Item>
            <CodeMirrorForm
              setFieldsValue={setFieldsValue}
              formItemLayout={formItemLayout}
              Form={Form}
              width="594px"
              getFieldDecorator={getFieldDecorator}
              name="yaml_content"
              label="DockerCompose配置"
              message="请输入DockerCompose配置内容"
              mode="yaml"
              data={data.yaml_content || ''}
            />

            <Form.Item {...formItemLayout} label="注意">
              将解析 DockerCompose
              配置中的组件相关属性用来便捷创建组件，其中的动态变量不支持解析赋值,
              其中使用了私有仓库的镜像?{' '}
              <a
                onClick={() => {
                  this.setState({ showUsernameAndPass: true });
                }}
                href="javascript:;"
              >
                填写仓库账号密码
              </a>
            </Form.Item>
            <Form.Item
              style={{ display: this.state.showUsernameAndPass ? '' : 'none' }}
              {...formItemLayout}
              label="仓库用户名"
            >
              {getFieldDecorator('user_name', {
                initialValue: data.user_name || '',
                rules: [{ required: false, message: '请输入仓库用户名' }]
              })(
                <Input
                  style={{ maxWidth: 300 }}
                  autoComplete="off"
                  placeholder="请输入仓库用户名"
                />
              )}
            </Form.Item>
            <Form.Item
              style={{ display: this.state.showUsernameAndPass ? '' : 'none' }}
              {...formItemLayout}
              label="仓库密码"
            >
              {getFieldDecorator('password', {
                initialValue: data.password || '',
                rules: [{ required: false, message: '请输入仓库密码' }]
              })(
                <Input
                  autoComplete="new-password"
                  type="password"
                  style={{ maxWidth: 300 }}
                  placeholder="请输入仓库密码"
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
                  确认创建
                </Button>
              </Form.Item>
            ) : null}
          </Form>
        </Card>
      </Fragment>
    );
  }
}
