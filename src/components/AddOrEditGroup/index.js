/* eslint-disable consistent-return */
/* eslint-disable no-unused-expressions */
/* eslint-disable react/sort-comp */
/* eslint-disable no-nested-ternary */
import { Form, Icon, Input, Modal, Upload } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
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
      teamId,
      dispatch,
      isAddGroup = true,
      isGetGroups = true,
      handleAppLoading = false
    } = this.props;
    form.validateFields({ force: true }, (err, vals) => {
      vals.logo = this.state.paramsSrc || this.props.logo;
      const setTeamName = teamName || globalUtil.getCurrTeamName();
      const setRegionName = regionName || globalUtil.getCurrRegionName();
      const setAppId = teamId || globalUtil.getAppID();
      const parameters = {
        team_name: setTeamName,
        region_name: setRegionName,
        app_id: setAppId
      };
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
        previewTitle: formatMessage({id:'placeholder.preview_image'})
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
  handleValiateNameSpace = (_, value, callback) => {
    if (!value) {
      return callback(new Error(formatMessage({id:'placeholder.appEngName'})));
    }
    if (value && value.length <= 32) {
      const Reg = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
      if (!Reg.test(value)) {
        return callback(
          new Error(
            formatMessage({id:'placeholder.nameSpaceReg'})
          )
        );
      }
      callback();
    }
    if (value.length > 32) {
      return callback(new Error(formatMessage({id:'placeholder.max32'})));
    }
  };
  render() {
    const {
      title,
      onCancel,
      form,
      group_name: groupName,
      note,
      logo,
      isNoEditName = false,
      loading = false,
      k8s_app: k8sApp,
      isEditEnglishName,
      isAddGroup = true,
      copyFlag
    } = this.props;
    const isDisabled = (isAddGroup ? true : isEditEnglishName) || copyFlag;
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
        xs: { span: 23 },
        sm: { span: 7 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 }
      }
    };
    const uploadButton = (
      <div>
        <Icon type="plus" />
        <div className="ant-upload-text">{formatMessage({id:'popover.newApp.upload_pictures'})}</div>
      </div>
    );
    return (
      <Modal
        title={title || formatMessage({id:'popover.newApp.title'})}
        visible
        confirmLoading={appLoading || loading}
        className={styles.TelescopicModal}
        onCancel={onCancel}
        onOk={this.handleSubmit}
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...formItemLayout} label={formatMessage({id:'popover.newApp.appName'})}>
            {getFieldDecorator('group_name', {
              initialValue: groupName || '',
              rules: [
                { required: true, message: formatMessage({id:'popover.newApp.appName.placeholder'}) },
                {
                  max: 24,
                  message: formatMessage({id:'placeholder.max24'})
                }
              ]
            })(<Input disabled={isNoEditName} placeholder={formatMessage({id:'popover.newApp.appName.placeholder'})} />)}
          </FormItem>
          <FormItem
            {...formItemLayout}
            label={formatMessage({id:'popover.newApp.appEngName'})}
            extra={formatMessage({id:'popover.newApp.appEngName.extra'})}
          >
            {getFieldDecorator('k8s_app', {
              initialValue: k8sApp || '',
              rules: [
                {
                  required: true,
                  validator: this.handleValiateNameSpace
                }
              ]
            })(<Input placeholder={formatMessage({id:'popover.newApp.appEngName.placeholder'})} disabled={!isDisabled} />)}
          </FormItem>
          {/* 应用Logo */}
          <FormItem
            {...formItemLayout}
            label={formatMessage({id:'popover.newApp.logo'})}
            extra={formatMessage({id:'popover.newApp.upload_pictures.extra'})}
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

          <FormItem {...formItemLayout} label={formatMessage({id:'popover.newApp.appRemark'})}>
            {getFieldDecorator('note', {
              initialValue: note || '',
              rules: [
                {
                  max: 255,
                  message: formatMessage({id:'placeholder.max255'})
                }
              ]
            })(<Input.TextArea placeholder={formatMessage({id:'popover.newApp.appRemark.placeholder'})} />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
