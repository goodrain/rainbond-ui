import React, { PureComponent } from 'react';
import {
  Button,
  Icon,
  Modal,
  Form,
  Upload,
  Select,
  Input,
  Radio,
  Tag,
  Checkbox,
  Tooltip,
} from 'antd';
import { connect } from 'dva';
import { getAllRegion } from '../../services/api';
import globalUtil from '../../utils/global';
import styles from '../CreateTeam/index.less';
import apiconfig from '../../../config/api.config';
import cookie from '../../utils/cookie';

const FormItem = Form.Item;
const Option = Select.Option;
const { TextArea } = Input;

@Form.create()
@connect(({ user, global }) => ({
  user: user.currentUser,
  rainbondInfo: global.rainbondInfo,
}))
class CreateAppModels extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      actions: [],
      regions: [],
      previewImage: '',
      previewVisible: false,
      scope: props.appInfo ? props.appInfo.scope : 'enterprise',
      tagList: [],
      inputVisible: false,
      inputValue: '',
      imageUrl: props.appInfo ? props.appInfo.pic : '',
      loading: false,
    };
  }
  componentDidMount() {
    this.getTags();
  }

  getTags = () => {
    const { dispatch, eid } = this.props;
    dispatch({
      type: 'market/fetchAppModelsTags',
      payload: {
        enterprise_id: eid,
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            tagList: res.list,
          });
        }
      },
    });
  };
  handleSubmit = () => {
    const { form, appInfo } = this.props;
    form.validateFields((err, values) => {
      console.log('values', values);

      if (!err) {
        if (appInfo) {
          this.upAppModel(values);
        } else {
          this.createAppModel(values);
        }
      }
    });
  };

  createAppModels = () => {
    const { dispatch, user, eid } = this.props;
    const { page, page_size, name, scope, tags } = this.state;
    dispatch({
      type: 'market/createAppModels',
      payload: {
        enterprise_id: eid,
        user_id: user.user_id,
        app_name: name,
        scope,
        page,
        page_size,
        tags,
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            componentList: res.list,
            userTeamsLoading: false,
          });
        }
      },
    });
  };

  getLogoBase64 = (img, callback) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result));
    reader.readAsDataURL(img);
  };

  handleLogoChange = info => {
    if (info.file.status === 'uploading') {
      this.setState({ loading: true });
      return;
    }
    // if (info.file.status === 'done') {
    // Get this url from response in real world.
    this.getLogoBase64(info.file.originFileObj, imageUrl =>
      this.setState({
        imageUrl,
        loading: false,
      })
    );
    // }
  };

  handleLogoRemove = () => {
    this.setState({ imageUrl: '' });
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

  handleClose = removedTagID => {
    const tagList = this.state.tagList.filter(
      item => item.tag_id !== removedTagID
    );
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
      tagList = [...tagList, { name: inputValue, id: new Date() }];
    }
    console.log(tagList);
    this.setState({
      tagList,
      inputVisible: false,
      inputValue: '',
    });
  };

  createTag = name => {
    const { dispatch, eid } = this.props;
    dispatch({
      type: 'market/createTag',
      payload: {
        enterprise_id: eid,
        name,
      },
      callback: res => {
        if (res && res._code === 200) {
          console.log('res', res);
          this.setState({
            tagList: res.list,
          });
        }
      },
    });
  };

  saveInputRef = input => (this.input = input);

  upAppModel = values => {
    const { dispatch, eid, appInfo, onOk } = this.props;
    const { imageUrl, tagList } = this.state;
    const arr = [];
    if (tagList && tagList.length > 0) {
      tagList.map(item => {
        arr.push(item.name);
      });
    }
    dispatch({
      type: 'market/upAppModel',
      payload: {
        enterprise_id: eid,
        app_id: appInfo.app_id,
        name: values.name,
        pic: imageUrl,
        describe: values.describe,
        tags: arr,
      },
      callback: res => {
        if (res && res._code === 200) {
          onOk && onOk();
        }
      },
    });
  };

  createAppModel = values => {
    const { dispatch, eid, onOk } = this.props;
    const { imageUrl, tagList } = this.state;

    dispatch({
      type: 'market/createAppModel',
      payload: {
        enterprise_id: eid,
        name: values.name,
        pic: imageUrl,
        scope: values.scope,
        dev_status: values.dev_status,
        describe: values.describe,
        tag_ids: values.tag_ids,
      },
      callback: res => {
        if (res && res._code === 200) {
          onOk && onOk();
        }
      },
    });
  };

  onChangeRadio = e => {
    this.setState({
      scope: e.target.value,
    });
  };

  handleOnSelect = value => {
  
    const { tagList } = this.state;

    if (value && tagList.length > 0) {
    console.log('value', value);

      let arr = tagList.filter(item => item.tag_id+''.indexOf(value) > -1);
      // let arr = tagList.filter(item => console.log('item',item));
      
      console.log('arr', arr);
      debugger

      console.log('arr', arr);

      // this.createTag(value)
    } else if (tagList && tagList.length === 0) {
      this.createTag(value);
    }
  };

  handleOnDeselect = value => {
    console.log(`dele`, value);
  };
  handleChangeSelect = value => {
    const { tagList } = this.state;

    const set = '';
    if (value && tagList) {
      value.map(item => {
        tagList.map(items => {});
      });
    }

    // {inputVisible && (
    //   <Input
    //     ref={this.saveInputRef}
    //     type="text"
    //     size="small"
    //     style={{ width: 78 }}
    //     value={inputValue}
    //     onChange={this.handleInputChange}
    //     onBlur={this.handleInputConfirm}
    //     onPressEnter={this.handleInputConfirm}
    //   />
    // )}
    // {!inputVisible && (
    //   <Tag
    //     onClick={this.showInput}
    //     style={{ background: '#fff', borderStyle: 'dashed' }}
    //   >
    //     <Icon type="plus" /> New Tag
    //   </Tag>
    // )}

    console.log(`selected`, value);
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    const { onCancel, actions, title, appInfo } = this.props;

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
    const arr = [];

    if (appInfo && appInfo.tags && appInfo.tags.length > 0) {
      appInfo.tags.map(item => {
        arr.push(item.tag_id);
      });
    }

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
      imageUrl,
      previewImage,
      previewVisible,
      tagList,
      inputVisible,
      inputValue,
      scope,
    } = this.state;
    console.log('111tagList', tagList);
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
            <FormItem {...formItemLayout} label="应用分享">
              {getFieldDecorator('scope', {
                initialValue: scope,

                rules: [
                  {
                    required: true,
                    message: '请选择应用分享范围',
                  },
                ],
              })(
                <Radio.Group onChange={this.onChangeRadio}>
                  <Radio.Button value="enterprise">企业</Radio.Button>
                  <Radio.Button value="team">团队</Radio.Button>
                </Radio.Group>
              )}
              <div className={styles.conformDesc}>选择应用分享范围</div>
            </FormItem>

            <FormItem {...formItemLayout} label="应用状态">
              {getFieldDecorator('dev_status', {
                initialValue: appInfo && appInfo.dev_status ? true : '',
              })(<Checkbox>release</Checkbox>)}
              <div className={styles.conformDesc}>请选择当前应用的开发状态</div>
            </FormItem>

            <FormItem {...formItemLayout} label="应用名称" hasFeedback>
              {getFieldDecorator('name', {
                initialValue: appInfo ? appInfo.app_name : '',
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
              {getFieldDecorator('describe', {
                initialValue: appInfo ? appInfo.describe : '',
                rules: [
                  {
                    required: true,
                    message: '请输入应用描述',
                  },
                ],
              })(<TextArea placeholder="请输入应用描述" />)}
              <div className={styles.conformDesc}>
                请输入创建的应用名称，最多10字
              </div>
            </FormItem>

            <Form.Item {...formItemLayout} label="应用标签" hasFeedback>
              {getFieldDecorator('tag_ids', {
                initialValue: arr,
                rules: [
                  {
                    required: false,
                    message: '请添加应用标签',
                  },
                ],
              })(
                <Select
                  mode="tags"
                  style={{ width: '100%' }}
                  onChange={this.handleChangeSelect}
                  onSelect={this.handleOnSelect}
                  onDeselect={this.handleOnDeselect}
                  tokenSeparators={[',']}
                  // optionLabelProp="label"
                >
                  {tagList.map(item => {
                    const { tag_id, name } = item;
                    return (
                      <Option value={`${tag_id}`} label={name}>
                        {name}
                      </Option>
                    );
                  })}
                </Select>
              )}
            </Form.Item>

            <Form.Item {...formItemLayout} label="应用图标" hasFeedback>
              {getFieldDecorator('pic', {
                initialValue: appInfo ? appInfo.pic : '',
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
                  headers={myheaders}
                  showUploadList={false}
                  onChange={this.handleLogoChange}
                  onRemove={this.handleLogoRemove}
                  onPreview={this.handlePreview}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="avatar"
                      style={{ width: '100%' }}
                    />
                  ) : (
                    uploadButton
                  )}
                </Upload>
              )}
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  }
}

export default CreateAppModels;
