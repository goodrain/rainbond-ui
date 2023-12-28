import { Button, Card, Form, Input, Radio } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import CodeMirrorForm from '../../components/CodeMirrorForm';
import { pinyin } from 'pinyin-pro';
import cookie from '../../utils/cookie';

@connect(
  ({ global, loading, teamControl }) => ({
    groups: global.groups,
    createAppByCompose: loading.effects['createApp/createAppByCompose'],
    appNames: teamControl.allAppNames
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
      showUsernameAndPass: false,
      language: cookie.get('language') === 'zh-CN' ? true : false
    };
  }
  handleSubmit = e => {
    e.preventDefault();
    const { form, onSubmit, archInfo } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (!err && onSubmit) {
        if(archInfo && archInfo.length != 2 && archInfo.length != 0){
          fieldsValue.arch = archInfo[0]
        }
        onSubmit(fieldsValue);
      }
    });
  };
  // 团队命名空间的检验
  handleValiateNameSpace = (_, value, callback) => {
    if (!value) {
      return callback(new Error(formatMessage({id: 'placeholder.appEngName'})));
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
  // 生成英文名
  generateEnglishName = (name) => {
    if(name != undefined){
      const { appNames } = this.props;
      const pinyinName = pinyin(name, {toneType: 'none'}).replace(/\s/g, '');
      const cleanedPinyinName = pinyinName.toLowerCase();
      if (appNames && appNames.length > 0) {
        const isExist = appNames.some(item => item === cleanedPinyinName);
        if (isExist) {
          const random = Math.floor(Math.random() * 10000);          
          return `${cleanedPinyinName}${random}`;
        }
        return cleanedPinyinName;
      }
      return cleanedPinyinName;
    }
    return ''
  }
  render() {
    const formItemLayout = {
      labelCol: {
        span: 5
      },
      wrapperCol: {
        span: 19
      }
    };
    const en_formItemLayout = {
      labelCol: {
        span: 8
      },
      wrapperCol: {
        span: 16
      }
    };
    const {
      form,
      data = {},
      createAppByCompose,
      showSubmitBtn = true,
      archInfo
    } = this.props;
    const { getFieldDecorator, setFieldsValue } = form;
    const {language } = this.state;
    const is_language = language ? formItemLayout : en_formItemLayout;
    let arch = 'amd64'
    let archLegnth = archInfo.length
    if(archLegnth == 2){
      arch = 'amd64'
    }else if(archInfo.length == 1){
      arch = archInfo && archInfo[0]
    }
    return (
      <Fragment>
        <Card style={{ width: '800px', margin: '0 auto' }} bordered={false}>
          <Form
            autocomplete="off"
            onSubmit={this.handleSubmit}
            layout="horizontal"
            hideRequiredMark
          >
            <Form.Item {...is_language} label={formatMessage({id: 'teamAdd.create.form.appName'})}>
              {getFieldDecorator('group_name', {
                initialValue: data.group_name || '',
                rules: [{ required: true, message: formatMessage({id: 'placeholder.appName'}) }]
              })(
                <Input
                  style={{ maxWidth: 300 }}
                  placeholder={formatMessage({id: 'placeholder.group_name'})}
                  autocomplete="off"
                />
              )}
            </Form.Item>
            <Form.Item {...is_language} label={formatMessage({id: 'popover.newApp.appEngName'})}>
              {getFieldDecorator('k8s_app', {
              initialValue: this.generateEnglishName(form.getFieldValue('group_name')),
                rules: [
                  { required: true, validator: this.handleValiateNameSpace }
                ]
              })(<Input placeholder={formatMessage({id: 'popover.newApp.appEngName.placeholder'})} />)}
            </Form.Item>
            <CodeMirrorForm
              setFieldsValue={setFieldsValue}
              formItemLayout={is_language}
              Form={Form}
              // width="594px"
              getFieldDecorator={getFieldDecorator}
              name="yaml_content"
              label={formatMessage({id: 'teamAdd.create.image.config'})}
              message={formatMessage({id: 'placeholder.yaml_content'})}
              mode="yaml"
              data={data.yaml_content || ''}
            />

            <Form.Item {...is_language} label={formatMessage({id: 'teamAdd.create.image.notice'})}>
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
              {...is_language}
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
              {...is_language}
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
           {archLegnth == 2 &&
          <Form.Item {...is_language} label={formatMessage({id:'enterpriseColony.mgt.node.framework'})}>
            {getFieldDecorator('arch', {
              initialValue: arch,
              rules: [{ required: true, message: formatMessage({ id: 'placeholder.code_version' }) }]
            })(
              <Radio.Group>
                <Radio value='amd64'>amd64</Radio>
                <Radio value='arm64'>arm64</Radio>
              </Radio.Group>
            )}
          </Form.Item>}
            {showSubmitBtn ? (
              <Form.Item
                wrapperCol={{
                  xs: { span: 24, offset: 0 },
                  sm: {
                    span: is_language.wrapperCol.span,
                    offset: is_language.labelCol.span
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
