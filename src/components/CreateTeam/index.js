import { Button, Form, Input, Modal, Select, Upload, Icon } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { getAllRegion } from '../../services/api';
import apiconfig from '../../../config/api.config';
import cookie from '../../utils/cookie';
import { pinyin } from 'pinyin-pro';
import styles from './index.less';

const FormItem = Form.Item;
const { Option } = Select;
@connect(({ loading }) => ({
  loading: loading.effects['teamControl/createTeam']
}))
@Form.create()
class CreateTeam extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      regions: [],
      regionLoading: true,
      imageBase64:'',
      imageUrl: '',
      teamNames: []
    };
  }
  componentDidMount() {
    const { enterprise_id: ID } = this.props;
    if (ID) {
      this.getUnRelationedApp(ID);
      this.getTeamName();
    }
  }
  // 获取集群下所有的团队英文名称
  getTeamName = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/fetchTeamNames',
      payload: {
        eid: this.props.enterprise_id
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            teamNames: res.bean && res.bean.tenant_names && res.bean.tenant_names.length > 0 ? res.bean.tenant_names : []
          });
        }
      }
    });
  };
  // 生成英文名
  generateEnglishName = (name) => {
    if(name != undefined){
      const { teamNames } = this.state;
      const pinyinName = pinyin(name, {toneType: 'none'}).replace(/\s/g, '');
      const cleanedPinyinName = pinyinName.toLowerCase();
      if (teamNames && teamNames.length > 0) {
        const isExist = teamNames.some(item => item === cleanedPinyinName);
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

  getUnRelationedApp = ID => {
    getAllRegion({ enterprise_id: ID, status: '1' })
      .then(data => {
        this.setState({
          regions: (data && data.list) || [],
          regionLoading: false
        });
      })
      .catch(() => {
        this.setState({
          regionLoading: false
        });
      });
  };
  handleSubmit = () => {
    const { onOk, form, handleGuideStep } = this.props;
    const {imageUrl} = this.state
    if (handleGuideStep && handleGuideStep) {
      handleGuideStep(3);
    }
    form.validateFields((err, values) => {
     
      if (!err && onOk) {
        if(values.logo){
          values.logo = imageUrl
        }
        onOk(values);
      }
    });
  };
  // 团队命名空间的检验
  handleValiateNameSpace = (_, value, callback) => {
    if (!value) {
      return callback(new Error(`${formatMessage({ id: 'popover.enterpriseOverview.setUpTeam.message.englishName' })}`));
    }
    if (value && value.length <= 32) {
      const Reg = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
      if (!Reg.test(value)) {
        return callback(
          new Error(`${formatMessage({ id: 'placeholder.nameSpaceReg' })}`)
        );
      }
      callback();
    }
    if (value.length > 24) {
      return callback(new Error(`${formatMessage({ id: 'popover.enterpriseOverview.setUpTeam.placeholder.max' })}`));
    }
  };

  handleLogoChange = info => {
    if (info.file.status === 'uploading') {
      this.setState({ loading: true });
      return;
    }
    if (info.file.status === 'done') {
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
    this.setState({ imageUrl: '', imageBase64: '' });
  };
  getLogoBase64 = (img, callback) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result));
    reader.readAsDataURL(img);
  };

  render() {
    const {
      onCancel,
      form,
      loading,
      title,
      guideStep,
      handleNewbieGuiding,
      enterprise_id,
    } = this.props;
    const token = cookie.get('token');
    const { getFieldDecorator } = form;
    const { regions, regionLoading, imageBase64, imageUrl } = this.state;
    const myheaders = {};
    if (token) {
      myheaders.Authorization = `GRJWT ${token}`;
    }
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 8 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 14 }
      }
    };
    const uploadButton = (
      <div>
        <Icon type="plus" />
        <div className="ant-upload-text">上传图标</div>
      </div>
    );
    const isRegions = regions && regions.length;
    return (
      <Modal
        title={title || <FormattedMessage id='popover.enterpriseOverview.setUpTeam.title' />}
        visible
        maskClosable={false}
        className={styles.TelescopicModal}
        onOk={this.handleSubmit}
        onCancel={onCancel}
        footer={
          <Fragment>
            <Button onClick={onCancel}> <FormattedMessage id='button.cancel' /></Button>
            <Button
              type="primary"
              onClick={this.handleSubmit}
              loading={loading}
            >
              <FormattedMessage id='button.confirm' />
            </Button>
            {guideStep &&
              !regionLoading &&
              handleNewbieGuiding({
                tit: formatMessage({ id: 'popover.enterpriseOverview.setUpTeam.title' }),
                desc: isRegions ? formatMessage({ id: 'popover.enterpriseOverview.setUpTeam.creat_name' }) : formatMessage({ id: 'popover.enterpriseOverview.setUpTeam.creat_colony' }),
                isCoverScreen: false,
                prevStep: false,
                nextStep: 1,
                jumpUrl:
                  !isRegions &&
                  `/enterprise/${enterprise_id}/clusters?init=true`,
                isSuccess: isRegions,
                conPosition: { right: 0, bottom: '-136px' },
                svgPosition: { left: '65%', marginTop: '-19px' }
              })}
          </Fragment>
        }
      >
        <Form onSubmit={this.handleSubmit} layout="horizontal">
          <FormItem {...formItemLayout} label={<FormattedMessage id='popover.enterpriseOverview.setUpTeam.label.name' />}
            extra={<div className={styles.conformDesc}>
              <FormattedMessage id='popover.enterpriseOverview.setUpTeam.conformDesc.name' />
            </div>}
          >
            {getFieldDecorator('team_name', {
              rules: [
                {
                  required: true,
                  message: formatMessage({ id: 'popover.enterpriseOverview.setUpTeam.placeholder.name' })
                },
                {
                  max: 24,
                  message: formatMessage({ id: 'popover.enterpriseOverview.setUpTeam.placeholder.max' })
                }
              ]
            })(<Input placeholder={formatMessage({ id: 'popover.enterpriseOverview.setUpTeam.placeholder.name' })} />)}
          </FormItem>
          {/* 团队的命名空间 */}
          <FormItem {...formItemLayout} label={<FormattedMessage id='popover.enterpriseOverview.setUpTeam.label.englishName' />}
            extra={
              <div className={styles.conformDesc}>
                <FormattedMessage id='popover.enterpriseOverview.setUpTeam.conformDesc.englishName' />
              </div>
            }
          >
            {getFieldDecorator('namespace', {
              initialValue: this.generateEnglishName(form.getFieldValue('team_name')),
              rules: [
                {
                  required: true,
                  validator: this.handleValiateNameSpace
                }
              ]
            })(<Input placeholder={formatMessage({ id: 'popover.enterpriseOverview.setUpTeam.placeholder.englishName' })} />)}

          </FormItem>
          <FormItem {...formItemLayout} label={<FormattedMessage id='popover.enterpriseOverview.setUpTeam.label.colony' />} extra={
            <div className={styles.conformDesc}> <FormattedMessage id='popover.enterpriseOverview.setUpTeam.conformDesc.colony' /></div>
          }>
            {getFieldDecorator('useable_regions', {
              rules: [
                {
                  required: true,
                  message: formatMessage({ id: 'popover.enterpriseOverview.setUpTeam.message.colony' })
                }
              ]
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                mode="multiple"
                style={{ width: '100%' }}
                placeholder={formatMessage({ id: 'popover.enterpriseOverview.setUpTeam.message.colony' })}
              >
                {(regions || []).map(item => {
                  return (
                    <Option key={item.region_name}>{item.region_alias}</Option>
                  );
                })}
              </Select>
            )}

          </FormItem>
          {/* 团队头像 */}
          <FormItem {...formItemLayout} label='LOGO'
            extra={
              <div className={styles.conformDesc}>
                <FormattedMessage id='popover.enterpriseOverview.setUpTeam.label.logo' />
              </div>
            }
          >
            {getFieldDecorator('logo', {
              rules: [
                {
                  required: false,
                  message: formatMessage({ id: 'popover.enterpriseOverview.setUpTeam.input_logo' })
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
              >
                {imageUrl ? (
                  <img
                    src={imageBase64 || imageUrl}
                    alt="LOGO"
                    style={{ width: '100%' }}
                  />
                ) : (
                  uploadButton
                )}
              </Upload>
            )}

          </FormItem>
        </Form>
      </Modal>
    );
  }
}
export default CreateTeam;
