/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-expressions */
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Icon,
  Input,
  Modal,
  notification,
  Row,
  Select,
  Spin,
  Table,
  Upload
} from 'antd';
import BraftEditor from 'braft-editor';
import 'braft-editor/dist/index.css';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import moment from 'moment';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import apiconfig from '../../../config/api.config';
import ConfirmModal from '../../components/ConfirmModal';
import styles from '../../components/CreateTeam/index.less';
import EditAppVersion from '../../components/EditAppVersion';
import detailstyles from '../../components/MarketAppDetailShow/index.less';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import cookie from '../../utils/cookie';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import globalUtil from '../../utils/global';
import userUtil from '../../utils/user';
import styless from './index.less';

const FormItem = Form.Item;
const { Option } = Select;
const { TextArea } = Input;
const { confirm } = Modal;

@connect(({ user, application, enterprise, teamControl, loading }) => ({
  currUser: user.currentUser,
  apps: application.apps,
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  groupDetail: application.groupDetail || {},
  loading
}))
@Form.create()
export default class Main extends PureComponent {
  constructor(props) {
    super(props);
    const { currUser } = this.props;
    const appStoreAdmin = userUtil.isPermissions(currUser, 'app_store');
    this.state = {
      appStoreAdmin,
      appInfo: {},
      isShared: window.location.href.indexOf('shared') > -1,
      isAddLicense: false,
      tagList: [],
      teamList: [],
      imageUrl: '',
      enterpriseTeamsLoading: true,
      imageBase64: '',
      page: 1,
      page_size: 10,
      appList: [],
      versionPag: 1,
      versionPageSize: 10,
      total: 0,
      toDelete: false,
      editAppVersion: false,
      isEdit: false,
      isAppDetails: false
    };
  }
  componentWillMount() {
    this.getTags();
    this.getEnterpriseTeams();
    this.getAppModelsDetails();
  }
  onPageChange = page => {
    this.setState({ versionPag: page }, () => {
      this.getAppModelsDetails();
    });
  };
  getLogoBase64 = (img, callback) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result));
    reader.readAsDataURL(img);
  };
  getEnterpriseTeams = name => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    const { page, page_size } = this.state;
    dispatch({
      type: 'global/fetchEnterpriseTeams',
      payload: {
        name,
        page,
        page_size,
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.status_code === 200) {
          if (res.bean && res.bean.list) {
            const listNum = (res.bean && res.bean.total_count) || 0;
            const isAdd = !!(listNum && listNum > page_size);

            this.setState({
              teamList: res.bean.list,
              isAddLicense: isAdd,
              enterpriseTeamsLoading: false
            });
          }
        }
      }
    });
  };
  getTags = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: 'market/fetchAppModelsTags',
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            tagList: res.list
          });
        }
      }
    });
  };

  getAppModelsDetails = () => {
    const {
      dispatch,
      match: {
        params: { eid, appId }
      },
      form
    } = this.props;
    const { versionPag, versionPageSize, total } = this.state;
    dispatch({
      type: 'market/fetchAppModelsDetails',
      payload: {
        enterprise_id: eid,
        appId,
        page: versionPag,
        page_size: versionPageSize,
        total
      },
      callback: res => {
        if (res && res.status_code === 200) {
          // 异步设置编辑器内容
          const text = res.bean && res.bean.details;
          const details = form.getFieldValue('details');
          if (details) {
            form.setFieldsValue({
              details: BraftEditor.createEditorState(text)
            });
          }
          this.setState({
            imageUrl: res.bean.pic,
            appInfo: res.bean,
            appList: res.list,
            total: res.total
          });
        }
      }
    });
  };
  upDataAppVersionInfo = value => {
    const {
      dispatch,
      match: {
        params: { eid, appId }
      }
    } = this.props;
    const { editAppVersion } = this.state;
    dispatch({
      type: 'market/upDataAppVersionInfo',
      payload: {
        enterprise_id: eid,
        appId,
        version: editAppVersion.version,
        ...value
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.handleCloseEditAppVersion();
          this.getAppModelsDetails();
          notification.success({ message: formatMessage({id:'notification.success.edit'}) });
        }
      }
    });
  };
  handleRelease = value => {
    const {
      dispatch,
      match: {
        params: { eid, appId }
      }
    } = this.props;
    const parameter = Object.assign(value, {
      dev_status: value.dev_status ? '' : 'release'
    });
    dispatch({
      type: 'market/upDataAppVersionInfo',
      payload: {
        enterprise_id: eid,
        appId,
        ...value
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.handleCloseEditAppVersion();
          this.getAppModelsDetails();
        }
      }
    });
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
  handleToDelete = info => {
    this.setState({
      toDelete: info
    });
  };
  handleCancelDelete = () => {
    this.setState({
      toDelete: false
    });
  };
  handleCloseEditAppVersion = () => {
    this.setState({
      editAppVersion: false
    });
  };
  handleEditAppVersionInfo = info => {
    this.setState({
      editAppVersion: info
    });
  };
  handleDeleteVersion = () => {
    const {
      dispatch,
      match: {
        params: { eid, appId }
      }
    } = this.props;
    const { toDelete } = this.state;
    dispatch({
      type: 'market/deleteAppVersion',
      payload: {
        enterprise_id: eid,
        appId,
        version: toDelete.version
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({ message: formatMessage({id:'notification.success.delete'}) });
          this.handleCancelDelete();
          this.getAppModelsDetails();
        }
      }
    });
  };
  addTeams = () => {
    this.setState(
      {
        enterpriseTeamsLoading: true,
        page_size: this.state.page_size + 10
      },
      () => {
        this.getEnterpriseTeams();
      }
    );
  };
  upAppModel = (appInfo, tagId, details) => {
    const {
      dispatch,
      match: {
        params: { eid, appId }
      },
      form
    } = this.props;
    const { imageUrl, tagList, isEdit, isAppDetails } = this.state;
    form.validateFields((err, values) => {
      if (!err) {
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
        const parameter = {
          enterprise_id: eid,
          name: appInfo ? appInfo.app_name : values.name,
          pic: imageUrl,
          tag_ids: tagId || arr,
          app_id: appId,
          describe: appInfo ? appInfo.describe : values.describe,
          details: details || (values.details && values.details.toHTML()),
          scope: appInfo ? appInfo.scope : values.scope
        };
        if (parameter.scope !== 'enterprise') {
          parameter.create_team = parameter.scope;
          parameter.scope = 'team';
        }
        dispatch({
          type: 'market/upAppModel',
          payload: parameter,
          callback: res => {
            if (res && res.status_code === 200) {
              notification.success({ message: formatMessage({id:'notification.success.save'}) });
              if (appInfo) {
                this.handleAppDetails(!isAppDetails);
              } else {
                this.handleIsEdit(!isEdit);
              }
              this.getAppModelsDetails();
            }
          }
        });
      }
    });
  };
  handleIsEdit = isEdit => {
    this.setState({ isEdit });
  };
  handleAppDetails = isAppDetails => {
    const { appInfo } = this.state;
    const { form } = this.props;
    const text = appInfo && appInfo.details;
    this.setState({ isAppDetails }, () => {
      if (isAppDetails) {
        form.setFieldsValue({
          details: BraftEditor.createEditorState(text)
        });
      }
    });
  };
  handleCancel = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch(routerRedux.push(`/enterprise/${eid}/shared/local`));
  };
  handleIsRelease = record => {
    const _th = this;
    confirm({
      title: record.dev_status
        ? formatMessage({id:'applicationMarket.appsetting.cancel'})
        : formatMessage({id:'applicationMarket.appsetting.determine'}),
      content: '',
      okText: formatMessage({id:'button.confirm'}),
      cancelText: formatMessage({id:'button.cancel'}),
      onOk() {
        _th.handleRelease(record);
      }
    });
  };

  handleOnSelect = value => {
    const { tagList } = this.state;
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

  createTag = name => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: 'market/createTag',
      payload: {
        enterprise_id: eid,
        name
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.getTags();
        }
      }
    });
  };

  render() {
    const {
      loading,
      form
    } = this.props;
    const {
      appInfo,
      isAddLicense,
      tagList,
      imageUrl,
      enterpriseTeamsLoading,
      teamList,
      imageBase64,
      appList,
      toDelete,
      editAppVersion,
      isEdit,
      isAppDetails,
      versionPag,
      versionPageSize,
      total,
      appStoreAdmin: { isEditApp, isEditVersionApp, isDeleteAppVersion }
    } = this.state;
    const { getFieldDecorator } = form;
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
    const token = cookie.get('token');
    const controls = [
      'bold',
      'italic',
      'underline',
      'text-color',
      'separator',
      'link',
      'separator'
    ];
    const myheaders = {};
    const arr = [];
    const tagId = [];

    if (
      appInfo &&
      appInfo.tags &&
      appInfo.tags.length > 0 &&
      tagList &&
      tagList.length > 0
    ) {
      appInfo.tags.map(items => {
        arr.push(items.name);
        tagId.push(items.tag_id);
      });
    }

    if (token) {
      myheaders.Authorization = `GRJWT ${token}`;
    }
    const uploadButton = (
      <div>
        <Icon type="plus" />
        <div className="ant-upload-text"><FormattedMessage id='applicationMarket.appsetting.logo'/></div>
      </div>
    );
    const defaulAppImg = globalUtil.fetchSvg('defaulAppImg');

    return (
      <div>
        {toDelete && (
          <ConfirmModal
            title={formatMessage({id:'confirmModal.app_versions.delete.title'})}
            desc={formatMessage({id:'confirmModal.delete.app_versions.desc'})}
            loading={loading.effects['market/deleteAppVersion']}
            onCancel={this.handleCancelDelete}
            onOk={this.handleDeleteVersion}
          />
        )}
        {editAppVersion && (
          <EditAppVersion
            loading={loading.effects['market/upDataAppVersionInfo']}
            appInfo={editAppVersion}
            onOk={this.upDataAppVersionInfo}
            onCancel={this.handleCloseEditAppVersion}
          />
        )}
        <PageHeaderLayout
          title={<FormattedMessage id="applicationMarket.pageHeaderLayout.title"/>}
          content={<FormattedMessage id="applicationMarket.PageHeaderLayout.content"/>}
          titleSvg={pageheaderSvg.getSvg('storeSvg',18)}
        >
          <Form onSubmit={this.handleSubmit} layout="horizontal">
            <Card
              style={{
                marginBottom: 24,
                borderRadius: 5,
                boxShadow:'rgb(36 46 66 / 16%) 2px 4px 10px 0px',
              }}
              bordered={false}
              bodyStyle={{
                padding: 0
              }}
            >
              <div
                style={{
                  padding: '24px'
                }}
              >
                <div
                  style={{
                    textAlign: 'right',
                    margin: '-14px 0 10px 0'
                  }}
                />
                {isEdit && (
                  <Row gutter={24}>
                    <Col span="12">
                      <FormItem {...formItemLayout}  label={<FormattedMessage id='applicationMarket.appsetting.name'/>}>
                        <div>
                          {getFieldDecorator('name', {
                            initialValue: (appInfo && appInfo.app_name) || '',
                            rules: [
                              {
                                required: true,
                                message: formatMessage({id:'applicationMarket.appsetting.input_name'})
                              },
                              {
                                max: 32,
                                message: formatMessage({id:'applicationMarket.appsetting.max'})
                              }
                            ]
                          })(<Input  placeholder={formatMessage({id:'applicationMarket.appsetting.input_name'})}/>)}
                          <div className={styles.conformDesc}>
                            <FormattedMessage id='applicationMarket.appsetting.input_max'/>
                          </div>
                        </div>
                      </FormItem>
                    </Col>
                    <Col span="12">
                      <FormItem {...formItemLayout}  label={<FormattedMessage id='applicationMarket.appsetting.release'/>}>
                        {getFieldDecorator('scope', {
                          initialValue:
                            (appInfo &&
                              appInfo.scope &&
                              appInfo.scope === 'team' &&
                              appInfo.create_team) ||
                            'enterprise',
                          rules: [
                            {
                              required: true,
                              message: formatMessage({id:'applicationMarket.appsetting.input_name'})
                            }
                          ]
                        })(
                          <Select
                            getPopupContainer={triggerNode =>
                              triggerNode.parentNode
                            }
                            placeholder={formatMessage({id:'applicationMarket.appsetting.select_release'})}
                            dropdownRender={menu => (
                              <div>
                                {menu}
                                {isAddLicense && (
                                  <div>
                                    <Divider style={{ margin: '4px 0' }} />
                                    {enterpriseTeamsLoading ? (
                                      <Spin size="small" />
                                    ) : (
                                      <div
                                        style={{
                                          padding: '4px 8px',
                                          cursor: 'pointer'
                                        }}
                                        onMouseDown={e => e.preventDefault()}
                                        onClick={() => {
                                          this.addTeams();
                                        }}
                                      >
                                        <Icon type="plus" /> <FormattedMessage id='applicationMarket.appsetting.more'/>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          >
                            <Option value="enterprise" key="enterprise">
                              <div style={{ borderBottom: '1px solid #ccc' }}>
                                <FormattedMessage id='applicationMarket.appsetting.now'/>
                              </div>
                            </Option>

                            {teamList &&
                              teamList.map(item => {
                                return (
                                  <Option
                                    key={item.team_name}
                                    value={item.team_name}
                                  >
                                    {item.team_alias}
                                  </Option>
                                );
                              })}
                          </Select>
                        )}
                        <div className={styles.conformDesc}>
                          <FormattedMessage id='applicationMarket.appsetting.visual'/>
                        </div>
                      </FormItem>
                    </Col>
                    <Col span="12">
                      <FormItem {...formItemLayout}  label={<FormattedMessage id='applicationMarket.appsetting.introduction'/>}>
                        {getFieldDecorator('describe', {
                          initialValue: (appInfo && appInfo.describe) || '',
                          rules: [
                            {
                              required: false,
                              message: formatMessage({id:'applicationMarket.appsetting.input_introduction'})
                            },
                            {
                              max: 255,
                              message: formatMessage({id:'applicationMarket.AuthCompany.max'})
                            }
                          ]
                        })(<TextArea  placeholder={formatMessage({id:'applicationMarket.appsetting.input_introduction'})}/>)}
                        <div className={styles.conformDesc}>
                          <FormattedMessage id='applicationMarket.appsetting.input_app_introduction'/>
                        </div>
                      </FormItem>
                    </Col>
                    <Col span="12">
                      <Form.Item {...formItemLayout} label="LOGO">
                        {getFieldDecorator('pic', {
                          initialValue: (appInfo && appInfo.pic) || '',
                          rules: [
                            {
                              required: false,
                              message: formatMessage({id:'applicationMarket.appsetting.input_logo'})
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
                      </Form.Item>
                    </Col>
                  </Row>
                )}
                {isEdit && (
                  <div style={{ textAlign: 'center' }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={false}
                      disabled={loading.effects['market/upAppModel']}
                      style={{ marginRight: '20px' }}
                      onClick={() => {
                        this.upAppModel(
                          false,
                          false,
                          appInfo && appInfo.details
                        );
                      }}
                    >
                      <FormattedMessage id='button.save'/>
                    </Button>
                    <Button
                      onClick={() => {
                        this.handleIsEdit(!isEdit);
                      }}
                    >
                      <FormattedMessage id='button.cancel'/>
                    </Button>
                  </div>
                )}
                {appInfo && !isEdit && (
                  <div className={styless.appBoxs}>
                    <div>
                      <Icon type="arrow-left" onClick={this.handleCancel} />
                    </div>
                    <div>
                      {imageBase64 || imageUrl ? (
                        <img
                          src={imageBase64 || imageUrl}
                          alt="LOGO"
                          style={{
                            margin: '0 auto',
                            maxWidth: '60px',
                            maxHeight: '60px'
                          }}
                        />
                      ) : (
                        appInfo &&
                        appInfo.app_name && (
                          <div
                            style={{
                            margin: '0 auto',
                            maxWidth: '60px',
                            maxHeight: '60px'
                          }}
                          >
                            {defaulAppImg}
                          </div>
                        )
                      )}
                    </div>

                    <div>
                      <h3 title={appInfo.app_name}>{appInfo.app_name}</h3>
                      <div>{appInfo.describe}</div>
                    </div>
                    <div>
                      {arr.map(item => {
                        return <div className={styless.appVersion}>{item}</div>;
                      })}
                    </div>
                    {!isEdit && isEditApp && (
                      <a
                        onClick={() => {
                          this.handleIsEdit(!isEdit);
                        }}
                      >
                        <FormattedMessage id='button.edit'/>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </Card>
            <Card
              style={{
                marginBottom: 24,
                borderRadius: 5,
                boxShadow:'rgb(36 46 66 / 16%) 2px 4px 10px 0px',
              }}
              title={<FormattedMessage id='applicationMarket.appsetting.edition'/>}
              bordered={false}
              bodyStyle={{
                padding: 0
              }}
            >
              <div
                style={{
                  padding: '24px'
                }}
              >
                <Table
                  dataSource={appList}
                  rowKey={(record,index) => index}
                  scroll={{ x: 1200 }}
                  style={{ width: '100%', overflowX: 'auto' }}
                  columns={[
                    {
                      title: formatMessage({id:'applicationMarket.appsetting.edition_nmu'}),
                      dataIndex: 'version',
                      width: 220,
                      fixed: 'left',
                      render: (val, data) => {
                        return (
                          <span>
                            {val}({data.version_alias})
                          </span>
                        );
                      }
                    },
                    {
                      title: formatMessage({id:'applicationMarket.appsetting.state'}),
                      dataIndex: 'dev_status',
                      align: 'center',
                      width: 100,
                      fixed: 'left',
                      render: val => {
                        return (
                          <div>
                            {val ? (
                              <span className={styless.devStatus}>Release</span>
                            ) : (
                              '-'
                            )}
                          </div>
                        );
                      }
                    },
                    {
                      title: formatMessage({id:'applicationMarket.appsetting.Issued'}),
                      dataIndex: 'share_user',
                      align: 'center',
                      width: 150
                    },
                    {
                      title: formatMessage({id:'applicationMarket.appsetting.msg'}),
                      dataIndex: 'app_version_info'
                    },
                    {
                      title: formatMessage({id:'applicationMarket.appsetting.time'}),
                      dataIndex: 'create_time',
                      width: 190,
                      align: 'center',
                      render: val => {
                        return (
                          <span>
                            {moment(val)
                              .locale('zh-cn')
                              .format('YYYY-MM-DD HH:mm:ss')}
                          </span>
                        );
                      }
                    },
                    {
                      title: formatMessage({id:'applicationMarket.appsetting.updata_time'}),
                      dataIndex: 'update_time',
                      width: 190,
                      align: 'center',
                      render: val => {
                        return (
                          <span>
                            {moment(val)
                              .locale('zh-cn')
                              .format('YYYY-MM-DD HH:mm:ss')}
                          </span>
                        );
                      }
                    },
                    {
                      title: formatMessage({id:'applicationMarket.appsetting.operation'}),
                      dataIndex: 'action',
                      width: 230,
                      fixed: 'right',
                      align: 'center',
                      render: (_data, record) => (
                        <div>
                          <div>
                            {isEditVersionApp && (
                              <a
                                style={{ marginRight: '5px' }}
                                onClick={() => {
                                  this.handleEditAppVersionInfo(record);
                                }}
                              >
                                <FormattedMessage id='button.edit'/>
                              </a>
                            )}
                            {isEditVersionApp && (
                              <a
                                style={{ marginRight: '5px' }}
                                onClick={() => {
                                  this.handleIsRelease(record);
                                }}
                              >
                                {record.dev_status
                                  ? <FormattedMessage id='applicationMarket.appsetting.cancel_release'/>
                                  : <FormattedMessage id='applicationMarket.appsetting.determine_release'/>}
                              </a>
                            )}
                            {isDeleteAppVersion && (
                              <a
                                onClick={() => {
                                  this.handleToDelete(record);
                                }}
                              >
                                <FormattedMessage id='button.delete'/>
                              </a>
                            )}
                          </div>
                        </div>
                      )
                    }
                  ]}
                  pagination={{
                    current: versionPag,
                    pageSize: versionPageSize,
                    total,
                    onChange: this.onPageChange
                  }}
                />
              </div>
            </Card>
            <Card
              style={{
                marginBottom: 24,
                borderRadius: 5,
                boxShadow:'rgb(36 46 66 / 16%) 2px 4px 10px 0px',
              }}
              title={<FormattedMessage id='applicationMarket.appsetting.details'/>}
              bordered={false}
              extra={
                <div>
                  {!isAppDetails && isEditApp && (
                    <a onClick={() => this.handleAppDetails(!isAppDetails)}>
                      <FormattedMessage id='button.edit'/>
                    </a>
                  )}
                </div>
              }
              bodyStyle={{
                padding: 0
              }}
            >
              <div
                style={{
                  padding: '36px'
                }}
              >
                <Row gutter={24}>
                  {isAppDetails ? (
                    <FormItem
                      labelCol={{ span: 0 }}
                      wrapperCol={{ span: 24 }}
                      label=""
                    >
                      {getFieldDecorator('details', {
                        validateTrigger: 'onBlur',
                        rules: [
                          {
                            required: true,
                            validator: (_, value, callback) => {
                              if (value.isEmpty()) {
                                callback(`${formatMessage({id:'applicationMarket.appsetting.input_details'})}`);
                              } else {
                                callback();
                              }
                            }
                          }
                        ]
                      })(
                        <BraftEditor
                          className="my-editor"
                          controls={controls}
                          placeholder={formatMessage({id:'applicationMarket.appsetting.input_details'})}
                        />
                      )}
                    </FormItem>
                  ) : (
                    <div
                      className={detailstyles.markdown}
                      style={{ minHeight: '490px' }}
                      dangerouslySetInnerHTML={{
                        __html: appInfo && appInfo.details
                      }}
                    />
                  )}
                  {isAppDetails && (
                    <div style={{ textAlign: 'center' }}>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={false}
                        disabled={loading.effects['market/upAppModel']}
                        style={{ marginRight: '20px' }}
                        onClick={() => {
                          this.upAppModel(appInfo, tagId);
                        }}
                      >
                        <FormattedMessage id='button.save'/>
                      </Button>
                      <Button
                        onClick={() => {
                          this.handleAppDetails(!isAppDetails);
                        }}
                      >
                        <FormattedMessage id='button.cancel'/>
                      </Button>
                    </div>
                  )}
                </Row>
              </div>
            </Card>
          </Form>
        </PageHeaderLayout>
      </div>
    );
  }
}
