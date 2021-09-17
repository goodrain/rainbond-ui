/* eslint-disable no-nested-ternary */
import { Form, Icon, Input, Modal, Upload } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import apiconfig from '../../../config/api.config';
import { addGroup } from '../../services/application';
import handleAPIError from '../../utils/error';
import globalUtil from '../../utils/global';
import styles from '../CreateTeam/index.less';
const FormItem = Form.Item;
@connect()
@Form.create()
export default class EditGroupName extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      appLoading: false,
      fileList: [],
      previewVisible: false,
      previewImage: '',
      previewTitle: '',
      // PUT 接口图片路径参数
      paramsSrc: ''
    };
  }

  handleSubmit = e => {
    e.preventDefault();
    const {
      form,
      onOk,
      teamName,
      regionName,
      dispatch,
      isAddGroup = true,
      isGetGroups = true,
      handleAppLoading = false
    } = this.props;
    form.validateFields({ force: true }, (err, vals) => {
      vals.logo = this.state.paramsSrc || '';
      const setTeamName = teamName || globalUtil.getCurrTeamName();
      const setRegionName = regionName || globalUtil.getCurrRegionName();
      const parameters = { team_name: setTeamName, region_name: setRegionName };
      if (!err && onOk) {
        if (isAddGroup) {
          this.handleLoading(true);
          addGroup({
            ...parameters,
            ...vals,
            showMessage: false,
            noModels: true
          })
            .then(res => {
              const groupId = res && res.bean && res.bean.group_id;
              if (groupId && isGetGroups) {
                dispatch({
                  type: 'global/fetchGroups',
                  payload: parameters,
                  callback: groups => {
                    onOk(groupId, groups);
                    handleAppLoading && handleAppLoading();
                    this.handleLoading(false);
                  },
                  handleError: () => {
                    this.handleLoading(false);
                  }
                });
              } else {
                if (groupId) {
                  onOk(vals);
                }
                this.handleLoading(false);
              }
            })
            .catch(errs => {
              handleAPIError(errs);
              this.handleLoading(false);
            });
        } else {
          onOk(vals);
        }
      }
    });
  };
  handleLoading = appLoading => {
    this.setState({
      appLoading
    });
  };
  // 图片的Change
  handleChange = ({ fileList, file }) => {
    this.setState({
      fileList: [...fileList]
    });
    if (
      file &&
      file.status === 'done' &&
      file.response &&
      file.response.data &&
      file.response.data.bean &&
      file.response.data.bean.file_url
    ) {
      this.setState({
        paramsSrc: file.response.data.bean.file_url
      });
    }
  };
  // 预览图片
  handlePreview = info => {
    if (info.thumbUrl || info.url) {
      this.setState({
        previewVisible: true,
        previewImage: info.thumbUrl || info.url,
        previewTitle: '预览图片'
      });
    }
  };
  // 关闭预览
  handleCancel = () => {
    this.setState({
      previewVisible: false
    });
  };
  // 图片的删除
  handleRemove = () => {
    // 删除置位空
    this.setState({
      paramsSrc: ''
    });
  };
  componentDidMount() {
    const { logo } = this.props;
    if (logo) {
      this.setState({
        fileList: [
          {
            uid: '-1',
            name: 'image.png',
            status: 'done',
            url: logo
          }
        ]
      });
    }
  }
  render() {
    const {
      title,
      onCancel,
      form,
      group_name: groupName,
      note,
      logo,
      isNoEditName = false,
      loading = false
    } = this.props;
    const { getFieldDecorator } = form;
    const {
      appLoading,
      previewVisible,
      previewImage,
      fileList,
      previewTitle
    } = this.state;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 }
      }
    };
    const uploadButton = (
      <div>
        <Icon type={'plus'} />
        <div className="ant-upload-text">上传图标</div>
      </div>
    );
    return (
      <Modal
        title={title || '新建应用'}
        visible
        confirmLoading={appLoading || loading}
        className={styles.TelescopicModal}
        onCancel={onCancel}
        onOk={this.handleSubmit}
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...formItemLayout} label="应用名称">
            {getFieldDecorator('group_name', {
              initialValue: groupName || '',
              rules: [
                { required: true, message: '请填写应用名称' },
                {
                  max: 24,
                  message: '最大长度24位'
                }
              ]
            })(<Input disabled={isNoEditName} placeholder="请填写应用名称" />)}
          </FormItem>

          {/* 应用Logo */}
          <FormItem
            {...formItemLayout}
            label="Logo"
            extra="请上传 48 × 48 的图片"
          >
            <Upload
              action={apiconfig.imageUploadUrl}
              listType="picture-card"
              accept="image/jpg,image/jpeg,image/png"
              fileList={fileList}
              onPreview={this.handlePreview}
              onChange={this.handleChange}
              onRemove={this.handleRemove}
            >
              {fileList.length > 0 ? null : uploadButton}
            </Upload>
            <Modal
              visible={previewVisible}
              title={previewTitle}
              footer={null}
              onCancel={this.handleCancel}
            >
              <img alt="example" style={{ width: '100%' }} src={previewImage} />
            </Modal>
          </FormItem>

          <FormItem {...formItemLayout} label="应用备注">
            {getFieldDecorator('note', {
              initialValue: note || '',
              rules: [
                {
                  max: 255,
                  message: '最大长度255位'
                }
              ]
            })(<Input.TextArea placeholder="请填写应用备注信息" />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
