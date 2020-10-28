/* eslint-disable no-unused-expressions */
import React, { PureComponent } from 'react';
import {
  Icon,
  Form,
  Upload,
  Select,
  Input,
  Radio,
  Spin,
  Divider,
  Row,
  Col,
  Card,
  notification,
  Table,
  Button
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import userUtil from '../../utils/user';
import styles from '../../components/CreateTeam/index.less';
import apiconfig from '../../../config/api.config';
import cookie from '../../utils/cookie';
import ConfirmModal from '../../components/ConfirmModal';
import EditAppVersion from '../../components/EditAppVersion';
import moment from 'moment';
import editClusterInfo from '@/components/Cluster/BaseAddCluster';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';

import styless from './index.less';

const FormItem = Form.Item;
const { Option } = Select;
const { TextArea } = Input;

@Form.create()
@connect(({ user, groupControl, enterprise, teamControl, loading }) => ({
  currUser: user.currentUser,
  apps: groupControl.apps,
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  groupDetail: groupControl.groupDetail || {},
  loading
}))
@Form.create()
export default class Main extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
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
      toDelete: false,
      editAppVersion: false,
      isEdit: false
    };
  }
  componentWillMount() {
    this.getTags();
    this.getEnterpriseTeams();
    this.getAppModelsDetails();
  }
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
        if (res && res._code === 200) {
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
        if (res && res._code === 200) {
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
      }
    } = this.props;

    dispatch({
      type: 'market/fetchAppModelsDetails',
      payload: {
        enterprise_id: eid,
        appId
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            imageUrl: res.bean.pic,
            appInfo: res.bean,
            appList: res.list
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
        if (res && res._code === 200) {
          this.handleCloseEditAppVersion();
          this.getAppModelsDetails();
          notification.success({ message: '编辑成功' });
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
        if (res && res._code === 200) {
          notification.success({ message: '删除成功' });
          this.handleCancelDelete();
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
  upAppModel = () => {
    const {
      dispatch,
      match: {
        params: { eid, appId }
      },
      form
    } = this.props;
    const { imageUrl, tagList } = this.state;
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
          name: values.name,
          pic: imageUrl,
          tag_ids: arr,
          app_id: appId,
          describe: values.describe,
          details: values.details,
          scope: values.scope
        };
        dispatch({
          type: 'market/upAppModel',
          payload: parameter,
          callback: res => {
            if (res && res._code === 200) {
              notification.success({ message: '保存成功' });
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
  handleCancel = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch(routerRedux.push(`/enterprise/${eid}/shared`));
  };

  render() {
    const {
      loading,
      form,
      match: {
        params: { appId }
      }
    } = this.props;
    const {
      appInfo,
      isShared,
      isAddLicense,
      tagList,
      imageUrl,
      enterpriseTeamsLoading,
      teamList,
      imageBase64,
      appList,
      toDelete,
      editAppVersion,
      isEdit
    } = this.state;
    const { getFieldDecorator, getFieldValue } = form;
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
    const formItemLayouts = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 3 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 21 }
      }
    };
    const token = cookie.get('token');
    const myheaders = {};
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
        {toDelete && (
          <ConfirmModal
            title="删除应用版本"
            desc="确定要删除应用版本?"
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
          title="应用市场管理"
          content="应用模型是指模型化、标准化的应用制品包，是企业数字资产的应用化产物，可以通过标准的方式安装到任何Rainbond平台或其他支持的云原生平台"
        >
          <Form onSubmit={this.handleSubmit} layout="horizontal">
            <Card
              extra={
                <div>
                  <a
                    style={{ marginRight: '20px' }}
                    onClick={() => {
                      this.handleIsEdit(!isEdit);
                    }}
                  >
                    {isEdit ? '切换到展示模式' : '切换到编辑模式'}
                  </a>
                </div>
              }
              style={{
                marginBottom: 24
              }}
              title="基础信息"
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
                <Row gutter={24}>
                  <Col span="12">
                    <FormItem {...formItemLayout} label="名称">
                      {isEdit ? (
                        <div>
                          {getFieldDecorator('name', {
                            initialValue: (appInfo && appInfo.app_name) || '',
                            rules: [
                              {
                                required: true,
                                message: '请输入名称'
                              }
                            ]
                          })(<Input placeholder="请输入名称" />)}
                          <div className={styles.conformDesc}>
                            请输入应用模版名称，最多64字.
                          </div>
                        </div>
                      ) : (
                        appInfo && appInfo.app_name
                      )}
                    </FormItem>
                  </Col>
                  <Col span="12">
                    <FormItem {...formItemLayout} label="发布范围">
                      {isEdit ? (
                        <div>
                          {getFieldDecorator('scope', {
                            initialValue:
                              (appInfo && appInfo.scope) || 'enterprise',
                            rules: [
                              {
                                required: true,
                                message: '请输入名称'
                              }
                            ]
                          })(
                            isShared ? (
                              <Select
                                placeholder="请选择发布范围"
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
                                            onMouseDown={e =>
                                              e.preventDefault()
                                            }
                                            onClick={() => {
                                              this.addTeams();
                                            }}
                                          >
                                            <Icon type="plus" /> 加载更多
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              >
                                <Option value="enterprise" key="enterprise">
                                  <div
                                    style={{ borderBottom: '1px solid #ccc' }}
                                  >
                                    当前企业
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
                            ) : (
                              <Radio.Group name="scope">
                                <Radio value="team">当前团队</Radio>
                                <Radio value="enterprise">企业</Radio>
                              </Radio.Group>
                            )
                          )}
                          <div className={styles.conformDesc}>
                            发布模型的可视范围
                          </div>
                        </div>
                      ) : (
                        appInfo && appInfo.scope
                      )}
                    </FormItem>
                  </Col>
                  <Col span="12">
                    <Form.Item {...formItemLayout} label="分类标签">
                      {isEdit ? (
                        <div>
                          {getFieldDecorator('tag_ids', {
                            initialValue: arr,
                            rules: [
                              {
                                required: false,
                                message: '请添加标签'
                              }
                            ]
                          })(
                            <Select
                              mode="tags"
                              style={{ width: '100%' }}
                              // onSelect={this.handleOnSelect}
                              tokenSeparators={[',']}
                              placeholder="请选择分类标签"
                            >
                              {tagList.map(item => {
                                const { tag_id, name } = item;
                                return (
                                  <Option
                                    key={tag_id}
                                    value={name}
                                    label={name}
                                  >
                                    {name}
                                  </Option>
                                );
                              })}
                            </Select>
                          )}
                          <div className={styles.conformDesc}>
                            请选择分类标签
                          </div>
                        </div>
                      ) : (
                        arr
                      )}
                    </Form.Item>
                  </Col>
                  <Col span="12">
                    <FormItem {...formItemLayout} label="简介">
                      {isEdit ? (
                        <div>
                          {getFieldDecorator('describe', {
                            initialValue: (appInfo && appInfo.describe) || '',
                            rules: [
                              {
                                required: false,
                                message: '请输入简介'
                              }
                            ]
                          })(<TextArea placeholder="请输入简介" />)}
                          <div className={styles.conformDesc}>
                            请输入应用模版简介
                          </div>
                        </div>
                      ) : (
                        appInfo && appInfo.describe
                      )}
                    </FormItem>
                  </Col>
                  <Col span="12">
                    <Form.Item {...formItemLayout} label="LOGO">
                      {isEdit ? (
                        <div>
                          {getFieldDecorator('pic', {
                            initialValue: (appInfo && appInfo.pic) || '',
                            rules: [
                              {
                                required: false,
                                message: '请上传图标'
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
                        </div>
                      ) : (
                        <img
                          src={imageBase64 || imageUrl}
                          alt="LOGO"
                          style={{ width: '86px', height: '86px' }}
                        />
                      )}
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            </Card>
            <Card
              style={{
                marginBottom: 24
              }}
              title="应用版本管理"
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
                  style={{ width: '100%', overflowX: 'auto' }}
                  columns={[
                    {
                      title: '版本号',
                      dataIndex: 'version',
                      render: (val, data) => {
                        return (
                          <span>
                            {val}({data.version_alias})
                          </span>
                        );
                      }
                    },
                    {
                      title: '发布时间',
                      dataIndex: 'create_time',
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
                      title: '发布人',
                      dataIndex: 'share_user',
                      align: 'center'
                    },
                    {
                      title: '状态',
                      dataIndex: 'dev_status',
                      align: 'center',
                      render: val => {
                        return (
                          <div>
                            {val ? (
                              <span className={styless.devStatus}>release</span>
                            ) : (
                              '无'
                            )}
                          </div>
                        );
                      }
                    },
                    {
                      title: '负责人',
                      dataIndex: 'release_user',
                      align: 'center'
                    },
                    {
                      title: '描述',
                      dataIndex: 'app_version_info',
                      width: '300px'
                    },
                    {
                      title: '操作',
                      dataIndex: 'action',
                      key: 'action',
                      align: 'center',
                      render: (_data, record) => (
                        <div>
                          <a style={{ marginRight: '10px' }} onClick={() => {}}>
                            同步
                          </a>
                          <a
                            style={{ marginRight: '10px' }}
                            onClick={() => {
                              this.handleEditAppVersionInfo(record);
                            }}
                          >
                            编辑
                          </a>
                          {appList && appList.length > 1 && (
                            <a
                              style={{ marginRight: '10px' }}
                              onClick={() => {
                                this.handleToDelete(record);
                              }}
                            >
                              删除
                            </a>
                          )}
                        </div>
                      )
                    }
                  ]}
                />
              </div>
            </Card>
            <Card
              style={{
                marginBottom: 24
              }}
              title="应用详情"
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
                <Row gutter={24}>
                  <FormItem {...formItemLayouts} label="详情">
                    {isEdit ? (
                      <div>
                        {getFieldDecorator('details', {
                          initialValue: (appInfo && appInfo.details) || '',
                          rules: [
                            {
                              required: false,
                              message: '请输入详情'
                            }
                          ]
                        })(
                          <TextArea
                            placeholder="请输入详情"
                            autosize={{ minRows: 3, maxRows: 6 }}
                          />
                        )}
                        <div className={styles.conformDesc}>
                          请输入应用详情.
                        </div>
                      </div>
                    ) : (
                      appInfo && appInfo.details
                    )}
                  </FormItem>
                </Row>
              </div>
            </Card>
            <div style={{ textAlign: 'center' }}>
              {isEdit && (
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={false}
                  disabled={loading.effects['market/upAppModel']}
                  style={{ marginRight: '20px' }}
                  onClick={this.upAppModel}
                >
                  保存
                </Button>
              )}
              <Button onClick={this.handleCancel}>返回</Button>
            </div>
          </Form>
        </PageHeaderLayout>
      </div>
    );
  }
}
