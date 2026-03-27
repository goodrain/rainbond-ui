import { Button, Card, Form, Input, Radio, Upload, Icon, message } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import globalUtil from '../../utils/global';
import { pinyin } from 'pinyin-pro';
import cookie from '../../utils/cookie';
import handleAPIError from '../../utils/error';
import {
  getGroupNameRules,
  getK8sAppNameRules,
  getUsernameRules,
  getPasswordRules,
  getArchRules
} from './validations';

const { Dragger } = Upload;

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
      language: cookie.get('language') === 'zh-CN' ? true : false,
      // 文件上传相关
      fileList: [],
      event_id: '',
      upload_url: ''
    };
  }

  componentDidMount() {
    // 初始化上传事件
    this.initUploadEvent();
  }

  // 初始化上传事件
  initUploadEvent = () => {
    const { dispatch } = this.props;
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();

    dispatch({
      type: "createApp/createJarWarServices",
      payload: {
        region: regionName,
        team_name: teamName,
        component_id: '',
      },
      callback: (res) => {
        if (res && res.status_code === 200) {
          this.setState({
            event_id: res.bean.event_id,
            upload_url: res.bean.upload_url
          });
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };

  componentWillUnmount() {
    // 清理工作
  }

  // 处理文件上传变化
  handleFileChange = (info) => {
    let fileList = [...info.fileList];
    // 只保留最新上传的文件
    fileList = fileList.slice(-1);

    this.setState({ fileList });

    if (info.file.status === 'done') {
      message.success(`${info.file.name} 文件上传成功`);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} 文件上传失败`);
    }
  };

  // 移除文件
  handleFileRemove = () => {
    this.setState({ fileList: [] });
  };
  handleSubmit = e => {
    e.preventDefault();
    const { form, onSubmit, archInfo } = this.props;
    const { event_id, fileList } = this.state;
    const group_id = globalUtil.getAppID();

    form.validateFields((err, fieldsValue) => {
      if (!err && onSubmit) {
        // 检查是否已上传文件
        if (fileList.length === 0) {
          message.error('请先上传 Docker Compose 项目文件');
          return;
        }

        // 处理架构信息
        if (archInfo && archInfo.length !== 2 && archInfo.length !== 0) {
          fieldsValue.arch = archInfo[0];
        }

        // 设置应用组 ID
        if (group_id) {
          fieldsValue.group_id = group_id;
        }

        // 设置应用组名称和 K8s 应用名
        if (!fieldsValue.k8s_app || !fieldsValue.group_name) {
          fieldsValue.group_name = fieldsValue.service_cname;
          fieldsValue.k8s_app = this.generateEnglishName(fieldsValue.service_cname);
        }

        // 添加 event_id 和 compose_file_path
        fieldsValue.event_id = event_id;
        fieldsValue.compose_file_path = fieldsValue.compose_file_path || 'docker-compose.yml';

        onSubmit(fieldsValue);
      }
    });
  };
  // 生成英文名
  generateEnglishName = (name) => {
    if (name === undefined) {
      return '';
    }

    const { appNames } = this.props;
    const pinyinName = pinyin(name, { toneType: 'none' }).replace(/\s/g, '');
    const cleanedPinyinName = pinyinName.toLowerCase();

    if (appNames && appNames.length > 0) {
      const isExist = appNames.some(item => item === cleanedPinyinName);
      if (isExist) {
        const random = Math.floor(Math.random() * 10000);
        return `${cleanedPinyinName}${random}`;
      }
    }
    return cleanedPinyinName;
  }
  render() {
    const formItemLayout = {
      labelCol: {
        span: 24
      },
      wrapperCol: {
        span: 24
      }
    };
    const en_formItemLayout = {
      labelCol: {
        span: 24
      },
      wrapperCol: {
        span: 24
      }
    };
    const {
      form,
      data = {},
      createAppByCompose,
      showSubmitBtn = true,
      archInfo,
      groups
    } = this.props;
    const { getFieldDecorator, setFieldsValue } = form;
    const { language, fileList, upload_url } = this.state;
    const is_language = language ? formItemLayout : en_formItemLayout;
    const group_id = globalUtil.getAppID();

    // 直接使用后端返回的完整 upload_url，不需要再拼接
    const uploadProps = {
      name: 'packageTarFile',  // 后端接收的字段名
      action: upload_url,  // 直接使用完整的 URL
      onChange: this.handleFileChange,
      onRemove: this.handleFileRemove,
      fileList: fileList,
      accept: '.tar,.tgz,.tar.gz,.zip',
      withCredentials: true,
      headers: {
        'X-TEAM-NAME': globalUtil.getCurrTeamName(),
        'X-REGION-NAME': globalUtil.getCurrRegionName()
      }
    };

    let arch = 'amd64';
    const archLength = archInfo?.length || 0;
    if (archLength === 2) {
      arch = 'amd64';
    } else if (archLength === 1) {
      arch = archInfo && archInfo[0];
    }
    return (
      <Fragment>
        <Card bordered={false}>
          <Form
            autocomplete="off"
            onSubmit={this.handleSubmit}
            layout="vertical"
            hideRequiredMark
          >
            {!group_id &&
              <>
                <Form.Item
                  label={"名称"}
                  {...formItemLayout}
                >
                  {getFieldDecorator('group_name', {
                    initialValue: '',
                    rules: getGroupNameRules()
                  })(<Input placeholder={formatMessage({ id: 'popover.newApp.appName.placeholder' })} />)}
                </Form.Item>
                <Form.Item {...formItemLayout} label={"英文名称"}>
                  {getFieldDecorator('k8s_app', {
                    initialValue: this.generateEnglishName(this.props.form.getFieldValue('group_name') || ''),
                    rules: getK8sAppNameRules()
                  })(<Input placeholder={formatMessage({ id: 'placeholder.k8s_component_name' })} />)}
                </Form.Item>
              </>}

            {/* Docker Compose 项目文件上传 */}
            <Form.Item
              {...is_language}
              label="Docker Compose 项目文件"
              extra="支持上传 .tar, .tgz, .zip 格式的压缩包，包含 docker-compose.yml 及相关文件"
            >
              <Dragger {...uploadProps}>
                <p className="ant-upload-drag-icon">
                  <Icon type="inbox" />
                </p>
                <p className="ant-upload-text">
                  点击或拖拽文件到此区域上传
                </p>
                <p className="ant-upload-hint">
                  支持 .tar, .tgz, .zip 格式的压缩包
                </p>
              </Dragger>
            </Form.Item>

            {/* Compose 文件路径（可选） */}
            <Form.Item
              {...is_language}
              label="Compose 文件路径（可选）"
              extra="如果 docker-compose.yml 不在项目根目录，请指定相对路径"
            >
              {getFieldDecorator('compose_file_path', {
                initialValue: 'docker-compose.yml'
              })(<Input placeholder="docker-compose.yml" />)}
            </Form.Item>

            <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.image.notice' })}>
              {formatMessage({ id: 'teamAdd.create.image.configHint' })}{' '}
              <a
                onClick={() => {
                  this.setState({ showUsernameAndPass: true });
                }}
                href="javascript:;"
              >
                {formatMessage({ id: 'teamAdd.create.image.hint2' })}
              </a>
            </Form.Item>
            <Form.Item
              style={{ display: this.state.showUsernameAndPass ? '' : 'none' }}
              {...is_language}
              label={formatMessage({ id: 'teamAdd.create.form.user' })}
            >
              {getFieldDecorator('user_name', {
                initialValue: data.user_name || '',
                rules: getUsernameRules()
              })(
                <Input
                  style={{ maxWidth: 300 }}
                  autoComplete="off"
                  placeholder={formatMessage({ id: 'placeholder.user_name' })}
                />
              )}
            </Form.Item>
            <Form.Item
              style={{ display: this.state.showUsernameAndPass ? '' : 'none' }}
              {...is_language}
              label={formatMessage({ id: 'teamAdd.create.form.password' })}
            >
              {getFieldDecorator('password', {
                initialValue: data.password || '',
                rules: getPasswordRules()
              })(
                <Input
                  autoComplete="new-password"
                  type="password"
                  style={{ maxWidth: 300 }}
                  placeholder={formatMessage({ id: 'placeholder.password' })}
                />
              )}
            </Form.Item>
            {archLength === 2 &&
              <Form.Item {...is_language} label={formatMessage({ id: 'enterpriseColony.mgt.node.framework' })}>
                {getFieldDecorator('arch', {
                  initialValue: arch,
                  rules: getArchRules()
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
                    span: 24,
                    offset: 0
                  }
                }}
                label=""
              >
                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                  <Button
                    onClick={this.handleSubmit}
                    type="primary"
                    loading={createAppByCompose}
                  >
                    {formatMessage({ id: 'teamAdd.create.btn.create' })}
                  </Button>
                </div>
              </Form.Item>
            ) : null}
          </Form>
        </Card>
      </Fragment>
    );
  }
}
