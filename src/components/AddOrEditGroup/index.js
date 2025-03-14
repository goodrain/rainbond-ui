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
import userUtil from '../../utils/user';
import { pinyin } from 'pinyin-pro';
import cookie from '../../utils/cookie';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;
@connect(({ teamControl }) => ({
  appNames: teamControl.allAppNames
}))
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
      paramsSrc: '',
      language: cookie.get('language') === 'zh-CN' ? true : false
    };
  }
  // 生成英文名
  generateEnglishName = (name) => {
    if(name != undefined && name != ''){
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
              this.fetchGroup()
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

  fetchGroup = () => {
    const { dispatch } = this.props;

    dispatch({
      type: 'user/fetchCurrent',
      callback: res => {
        if (res && res.bean) {
         const team = userUtil.getTeamByTeamName(res.bean, globalUtil.getCurrTeamName());
          this.setState({
            currentTeam: team,
            indexLoading: false
          });
          dispatch({
            type: 'teamControl/fetchCurrentTeamPermissions',
            payload: team && team.tenant_actions
          });
          dispatch({
            type: 'teamControl/fetchCurrentTeam',
            payload: team
          });
        }
      },
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
      previewTitle,
      language
    } = this.state;
    const formItemLayout = {
      labelCol: {
        xs: { span: 23 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 17 }
      }
    };
    const en_formItemLayout = {
      labelCol: {
        xs: { span: 23 },
        sm: { span: 7 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 }
      }
    };
    const is_language = language ? formItemLayout : en_formItemLayout;
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
          <FormItem {...is_language} label={formatMessage({id:'popover.newApp.appName'})}>
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
            {...is_language}
            label={formatMessage({id:'popover.newApp.appEngName'})}
          >
            {getFieldDecorator('k8s_app', {
              initialValue: isDisabled ? this.generateEnglishName(k8sApp || form.getFieldValue('group_name')) : k8sApp,
              rules: [
                {
                  required: true,
                  validator: this.handleValiateNameSpace
                }
              ]
            })(<Input placeholder={formatMessage({id:'popover.newApp.appEngName.placeholder'})} disabled={!isDisabled} />)}
          </FormItem>

          <FormItem {...is_language
          } label={formatMessage({id:'popover.newApp.appRemark'})} style={{display:'none'}}>
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
