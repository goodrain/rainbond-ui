import React, { PureComponent } from "react";
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
  Spin,
  Checkbox
} from "antd";
import { connect } from "dva";
import userUtil from "../../utils/user";
import { getAllRegion } from "../../services/api";
import globalUtil from "../../utils/global";
import styles from "../CreateTeam/index.less";
import apiconfig from "../../../config/api.config";
import cookie from "../../utils/cookie";

const FormItem = Form.Item;
const Option = Select.Option;
const { TextArea } = Input;

@Form.create()
@connect(({ user, global, teamControl }) => ({
  user: user.currentUser,
  rainbondInfo: global.rainbondInfo,
  currentTeam: teamControl.currentTeam
}))
class CreateAppModels extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      actions: [],
      regions: [],
      previewImage: "",
      previewVisible: false,
      tagList: [],
      inputVisible: false,
      inputValue: "",
      imageBase64: "",
      imageUrl: props.appInfo ? props.appInfo.pic : "",
      loading: false,
      Checkboxvalue: !!(props.appInfo && props.appInfo.dev_status)
    };
  }
  componentDidMount() {
    this.getTags();
  }

  getTags = () => {
    const { dispatch, eid, form } = this.props;
    dispatch({
      type: "market/fetchAppModelsTags",
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            tagList: res.list
          });
        }
      }
    });
  };
  handleSubmit = () => {
    const { form, appInfo } = this.props;
    form.validateFields((err, values) => {
      if (!err) {
        if (appInfo) {
          this.upAppModel(values);
        } else {
          this.createAppModel(values);
        }
      }
    });
  };

  getLogoBase64 = (img, callback) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => callback(reader.result));
    reader.readAsDataURL(img);
  };

  handleLogoChange = info => {
    if (info.file.status === "uploading") {
      this.setState({ loading: true });
      return;
    }
    if (info.file.status === "done") {
      this.setState({
        imageUrl:
          info.file &&
          info.file.response &&
          info.file.response.data &&
          info.file.response.data.bean &&
          info.file.response.data.bean.file_url,
        loading: false
      });

      this.getLogoBase64(info.file.originFileObj, imageBase64 =>
        this.setState({
          imageBase64
        })
      );
    }
  };

  handleLogoRemove = () => {
    this.setState({ imageUrl: "", imageBase64: "" });
  };
  handlePreview = async file => {
    if (!file.url && !file.preview) {
      file.preview = await this.getBase64(file.originFileObj);
    }
    this.setState({
      previewImage: file.url || file.preview,
      previewVisible: true
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

  createTag = name => {
    const { dispatch, eid } = this.props;
    dispatch({
      type: "market/createTag",
      payload: {
        enterprise_id: eid,
        name
      },
      callback: res => {
        if (res && res._code === 200) {
          this.getTags();
        }
      }
    });
  };

  // handleRemoveTag = tag_id => {
  //   const { dispatch, eid, appInfo } = this.props;

  //   dispatch({
  //     type: 'market/deleteTag',
  //     payload: {
  //       enterprise_id: eid,
  //       app_id: appInfo.app_id,
  //       tag_id,
  //     },
  //     callback: () => {
  //       notification.success({ message: '删除成功' });
  //       this.fetchTags();
  //     },
  //   });
  // };

  saveInputRef = input => (this.input = input);

  upAppModel = values => {
    const { dispatch, eid, appInfo, onOk } = this.props;
    const { imageUrl, tagList, tags } = this.state;

    const arr = [];
    if (
      values.tag_ids &&
      values.tag_ids.length > 0 &&
      tagList &&
      tagList.length > 0
    ) {
      values.tag_ids.map(items => {
        tagList.map(item => {
          if (items === item.name) {
            arr.push(parseFloat(item.tag_id));
          }
        });
      });
    }
    dispatch({
      type: "market/upAppModel",
      payload: {
        enterprise_id: eid,
        app_id: appInfo.app_id,
        name: values.name,
        pic: imageUrl,
        dev_status: values.dev_status ? "release" : "",
        describe: values.describe,
        tag_ids: arr
      },
      callback: res => {
        if (res && res._code === 200) {
          onOk && onOk();
        }
      }
    });
  };

  createAppModel = values => {
    const { dispatch, eid, onOk, currentTeam, market_id } = this.props;
    const { imageUrl, tagList } = this.state;
    const arr = [];
    if (
      values.tag_ids &&
      values.tag_ids.length > 0 &&
      tagList &&
      tagList.length > 0
    ) {
      values.tag_ids.map(items => {
        tagList.map(item => {
          if (items === item.name) {
            arr.push(parseFloat(item.tag_id));
          }
        });
      });
    }

    const body = {
      enterprise_id: eid,
      name: values.name,
      pic: imageUrl,
      scope: values.scope,
      team_name: currentTeam && currentTeam.team_name,
      dev_status: values.dev_status,
      describe: values.describe,
      tag_ids: arr
    };
    if (market_id) {
      body.scope_target = { market_id };
      body.scope = "goodrain";
    }
    dispatch({
      type: "market/createAppModel",
      payload: body,
      callback: res => {
        if (res && res._code === 200) {
          onOk && onOk();
        }
      }
    });
  };

  onChangeRadio = e => {
    this.setState({
      scope: e.target.value
    });
  };

  handleOnSelect = value => {
    const { tagList } = this.state;
    const { dispatch, eid, form } = this.props;
    if (value && tagList.length > 0) {
      let judge = true;
      tagList.map(item => {
        if (item.name === value) {
          judge = false;
        }
      });

      if (judge) {
        this.createTag(value);
      }
    } else if (tagList && tagList.length === 0) {
      this.createTag(value);
    }
  };

  // handleOnDeselect = value => {
  //   console.log(`dele`, value);
  // };
  handleChangeSelect = value => {
    const { tagList } = this.state;

    const set = "";
    if (value && tagList) {
      value.map(item => {
        tagList.map(items => {});
      });
    }
  };
  onChangeCheckbox = value => {
    this.setState({
      Checkboxvalue: !this.state.Checkboxvalue
    });
  };

  render() {
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const {
      onCancel,
      actions,
      title,
      appInfo,
      defaultScope,
      market_id
    } = this.props;
    const {
      imageUrl,
      previewImage,
      previewVisible,
      tagList,
      imageBase64,
      Checkboxvalue
    } = this.state;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 5 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 19 }
      }
    };
    const arr = [];

    if (
      appInfo &&
      appInfo.tags &&
      appInfo.tags.length > 0 &&
      tagList &&
      tagList.length > 0
    ) {
      appInfo.tags.map(items => {
        arr.push(items.name);
      });
    }

    const token = cookie.get("token");
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

    return (
      <div>
        <Modal
          visible={previewVisible}
          footer={null}
          onCancel={this.handleCancel}
        >
          <img alt="example" style={{ width: "100%" }} src={previewImage} />
        </Modal>
        <Modal
          title={title}
          visible
          width={500}
          className={styles.TelescopicModal}
          onOk={this.handleSubmit}
          onCancel={onCancel}
          footer={[
            <Button onClick={onCancel}> 取消 </Button>,
            <Button type="primary" onClick={this.handleSubmit}>
              确定
            </Button>
          ]}
        >
          <Form onSubmit={this.handleSubmit} layout="horizontal">
            <FormItem {...formItemLayout} label="名称">
              {getFieldDecorator("name", {
                initialValue: appInfo ? appInfo.app_name : "",
                rules: [
                  {
                    required: true,
                    message: "请输入名称"
                  }
                ]
              })(<Input placeholder="请输入名称" />)}
              <div className={styles.conformDesc}>
                请输入创建的应用模板名称，最多64字.
              </div>
            </FormItem>
            {!market_id && (
              <FormItem {...formItemLayout} label="发布范围">
                {getFieldDecorator("scope", {
                  initialValue: appInfo
                    ? appInfo.scope
                    : defaultScope || "enterprise",
                  rules: [
                    {
                      required: true,
                      message: "请输入名称"
                    }
                  ]
                })(
                  <Radio.Group name="scope">
                    <Radio value="team">当前团队</Radio>
                    <Radio value="enterprise">企业</Radio>
                  </Radio.Group>
                )}
                <div className={styles.conformDesc}>发布模型的可视范围</div>
              </FormItem>
            )}

            <FormItem {...formItemLayout} label="描述">
              {getFieldDecorator("describe", {
                initialValue: appInfo ? appInfo.describe : "",
                rules: [
                  {
                    required: true,
                    message: "请输入描述"
                  }
                ]
              })(<TextArea placeholder="请输入描述" />)}
              <div className={styles.conformDesc}>请输入创建的应用模板描述</div>
            </FormItem>

            {appInfo && (
              <FormItem {...formItemLayout} label="是否Release">
                {getFieldDecorator("dev_status", {
                  initialValue: appInfo && appInfo.dev_status ? true : ""
                })(
                  <Checkbox
                    onChange={this.onChangeCheckbox}
                    checked={Checkboxvalue}
                  >
                    release
                  </Checkbox>
                )}
                <div className={styles.conformDesc}>
                  请选择当前应用的开发状态
                </div>
              </FormItem>
            )}

            <Form.Item {...formItemLayout} label="分类标签">
              {getFieldDecorator("tag_ids", {
                initialValue: arr,
                rules: [
                  {
                    required: false,
                    message: "请添加标签"
                  }
                ]
              })(
                <Select
                  mode="tags"
                  style={{ width: "100%" }}
                  onSelect={this.handleOnSelect}
                  tokenSeparators={[","]}
                  placeholder="请选择分类标签"
                >
                  {tagList.map(item => {
                    const { tag_id, name } = item;
                    return (
                      <Option key={tag_id} value={name} label={name}>
                        {name}
                      </Option>
                    );
                  })}
                </Select>
              )}
            </Form.Item>
            <Form.Item {...formItemLayout} label="LOGO">
              {getFieldDecorator("pic", {
                initialValue: appInfo ? appInfo.pic : "",
                rules: [
                  {
                    required: false,
                    message: "请上传图标"
                  }
                ]
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
                      src={imageBase64 || imageUrl}
                      alt="avatar"
                      style={{ width: "100%" }}
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
