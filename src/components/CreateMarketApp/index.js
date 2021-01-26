import {
    Button,


    Form, Icon,




    Input, Modal,


    Select,

    Tag,
    Tooltip, Upload
} from 'antd';
import React, { PureComponent } from 'react';
import apiconfig from '../../../config/api.config';
import { getAllRegion } from '../../services/api';
import cookie from '../../utils/cookie';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;
const Option = Select.Option;
const { TextArea } = Input;

@Form.create()
class CreateMarketApp extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      actions: [],
      regions: [],
      fileList: [],
      previewImage: '',
      previewVisible: false,
      tagList: ['Tag 2', 'Tag 3'],
      inputVisible: false,
      inputValue: '',
      scope: 'enterprise',
    };
  }
  componentDidMount() {
    this.getUnRelationedApp();
  }

  getUnRelationedApp = () => {
    getAllRegion().then(data => {
      if (data) {
        this.setState({ regions: data.list || [] });
      }
    });
  };

  handleSubmit = () => {
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.props.onOk && this.props.onOk(values);
      }
    });
  };
  handleLogoChange = ({ fileList }) => {
    this.setState({ fileList });
  };
  handleLogoRemove = () => {
    this.setState({ fileList: [] });
  };
  handlePreview = async file => {
    if (!file.url && !file.preview) {
      file.preview = await this.getBase64(file.originFileObj);
    }
    this.setState({
      previewImage: file.url || file.preview,
      previewVisible: true,
    });
  };

  getBase64 = file => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  handleCancel = () => this.setState({ previewVisible: false });

  handleClose = removedTag => {
    const tagList = this.state.tagList.filter(tag => tag !== removedTag);
    this.setState({ tagList });
  };

  showInput = () => {
    this.setState({ inputVisible: true }, () => this.input.focus());
  };

  handleInputChange = e => {
    this.setState({ inputValue: e.target.value });
  };

  handleInputConfirm = () => {
    const { inputValue } = this.state;
    let { tagList } = this.state;
    if (inputValue && tagList.indexOf(inputValue) === -1) {
      tagList = [...tagList, inputValue];
    }
    this.setState({
      tagList,
      inputVisible: false,
      inputValue: '',
    });
  };

  saveInputRef = input => (this.input = input);

  onChangeRadio = e => {
    this.setState({
      scope: e.target.value,
    });
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    const { onOk, onCancel, actions, title } = this.props;

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 14 },
      },
    };
    const tailFormItemLayout = {
      wrapperCol: {
        xs: {
          span: 24,
          offset: 0,
        },
        sm: {
          span: 14,
          offset: 6,
        },
      },
    };

    const options = actions || [];
    const token = cookie.get('token');
    const myheaders = {};
    if (token) {
      myheaders.Authorization = `GRJWT ${token}`;
    }
    const uploadButton = (
      <div>
        <Icon type="plus" />
        <div className="ant-upload-text">上传图标</div>
      </div>
    );
    const {
      fileList,
      previewImage,
      previewVisible,
      tagList,
      inputVisible,
      inputValue,
    } = this.state;
    return (
      <div>
        <Modal
          visible={previewVisible}
          footer={null}
          onCancel={this.handleCancel}
        >
          <img alt="example" style={{ width: '100%' }} src={previewImage} />
        </Modal>
        <Modal
          title={title}
          visible
          className={styles.TelescopicModal}
          onOk={this.handleSubmit}
          onCancel={onCancel}
          footer={[
            <Button onClick={onCancel}> 取消 </Button>,
            <Button type="primary" onClick={this.handleSubmit}>
              确定
            </Button>,
          ]}
        >
          <Form
            onSubmit={this.handleSubmit}
            layout="horizontal"
            hideRequiredMark
          >
            <FormItem {...formItemLayout} label="应用发布范围" hasFeedback>
              {getFieldDecorator('scope', {
                rules: [
                  {
                    required: true,
                    message: '请选择应用发布范围',
                  },
                ],
              })(
                <Radio.Group
                  onChange={this.onChangeRadio}
                  defaultValue="enterprise"
                >
                  <Radio.Button value="enterprise">企业</Radio.Button>
                  <Radio.Button value="team">团队</Radio.Button>
                </Radio.Group>
              )}
              <div className={styles.conformDesc}>选择应用发布范围</div>
            </FormItem>

            <FormItem {...formItemLayout} label="应用名称" hasFeedback>
              {getFieldDecorator('name', {
                rules: [
                  {
                    required: true,
                    message: '请输入应用名称',
                  },
                ],
              })(<Input placeholder="请输入应用名称" />)}
              <div className={styles.conformDesc}>
                请输入创建的应用名称，最多64字.
              </div>
            </FormItem>

            <FormItem {...formItemLayout} label="应用描述" hasFeedback>
              {getFieldDecorator('name', {
                // initialValue: appinfo.describe,
                rules: [
                  {
                    required: true,
                    message: '请输入应用描述',
                  },
                ],
              })(<TextArea placeholder="请输入应用描述" />)}
              <div className={styles.conformDesc}>请输入应用描述.</div>
            </FormItem>

            <Form.Item {...formItemLayout} label="应用标签" hasFeedback>
              {getFieldDecorator('tag', {
                rules: [
                  {
                    required: false,
                    message: '请上传图标',
                  },
                ],
              })(
                <div>
                  {tagList.map((tag, index) => {
                    return (
                      <Tooltip title={tag} key={tag}>
                        <Tag
                          key={tag}
                          closable={index !== 0}
                          onClose={() => this.handleClose(tag)}
                        >
                          {tag}
                        </Tag>
                      </Tooltip>
                    );
                  })}
                  {inputVisible && (
                    <Input
                      ref={this.saveInputRef}
                      type="text"
                      size="small"
                      style={{ width: 78 }}
                      value={inputValue}
                      onChange={this.handleInputChange}
                      onBlur={this.handleInputConfirm}
                      onPressEnter={this.handleInputConfirm}
                    />
                  )}
                  {!inputVisible && (
                    <Tag
                      onClick={this.showInput}
                      style={{ background: '#fff', borderStyle: 'dashed' }}
                    >
                      <Icon type="plus" /> New Tag
                    </Tag>
                  )}
                </div>
              )}
            </Form.Item>

            <Form.Item {...formItemLayout} label="应用图标" hasFeedback>
              {getFieldDecorator('pic', {
                rules: [
                  {
                    required: false,
                    message: '请上传图标',
                  },
                ],
              })(
                <Upload
                  className="logo-uploader"
                  name="file"
                  accept="image/jpg,image/jpeg,image/png"
                  action={apiconfig.imageUploadUrl}
                  listType="picture-card"
                  fileList={fileList}
                  headers={myheaders}
                  onChange={this.handleLogoChange}
                  onRemove={this.handleLogoRemove}
                  onPreview={this.handlePreview}
                >
                  {fileList.length > 0 ? null : uploadButton}
                </Upload>
              )}
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  }
}

export default CreateMarketApp;
