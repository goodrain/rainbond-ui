/* eslint-disable eqeqeq */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-nested-ternary */
import {
  Button,
  Card,
  Divider,
  Form,
  Icon,
  Input,
  Modal,
  notification,
  Select,
  Spin,
  Tabs
} from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import CodeBuildConfig from '../../components/CodeBuildConfig';
import MarketAppDetailShow from '../../components/MarketAppDetailShow';
import NoPermTip from '../../components/NoPermTip';
import appUtil from '../../utils/app';
import globalUtil from '../../utils/global';
import rainbondUtil from '../../utils/rainbond';
import { languageObj } from '../../utils/utils';
import styles from './resource.less';
import AutoDeploy from './setting/auto-deploy';
import ChangeBuildSource from './setting/edit-buildsource';

const { TabPane } = Tabs;
const FormItem = Form.Item;
const { Option, OptGroup } = Select;

@connect(
  ({ user, appControl, global }) => ({
    currUser: user.currentUser,
    createWay: appControl.createWay,
    rainbondInfo: global.rainbondInfo,
    enterprise: global.enterprise
  }),
  null,
  null,
  { withRef: true }
)
@Form.create()
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      runtimeInfo: '',
      changeBuildSource: false,
      editOauth: false,
      buildSource: null,
      showMarketAppDetail: false,
      showApp: {},
      create_status: '',
      languageBox: false,
      service_info: '',
      error_infos: '',
      thirdInfo: false,
      tags: [],
      tagsLoading: true,
      tabType: 'branches',
      fullList: [],
      tabList: [],
      OauthLoading: true,
      isAddComponents: false,
      page: 1
    };
  }
  componentDidMount() {
    const { rainbondInfo, enterprise } = this.props;
    const tabList = [];
    if (
      rainbondUtil.OauthbEnable(rainbondInfo) &&
      rainbondUtil.OauthEnterpriseEnable(enterprise)
    ) {
      enterprise.oauth_services.value.map((item) => {
        const { oauth_type, service_id, is_git } = item;
        if (is_git) {
          tabList.push({
            type: oauth_type,
            id: `${service_id}`
          });
        }
      });
      this.setState({
        tabList
      });
    }

    this.getRuntimeInfo();
    this.loadBuildSourceInfo();
  }
  getParams() {
    return {
      group_id: this.props.match.params.appID,
      compose_id: this.props.match.params.composeId
    };
  }
  onChangeBuildSource = () => {
    this.hideBuildSource();
    this.loadBuildSourceInfo();
  };
  getRuntimeInfo = () => {
    this.props.dispatch({
      type: 'appControl/getRuntimeBuildInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias
      },
      callback: (data) => {
        if (data) {
          this.setState({ runtimeInfo: data.bean ? data.bean : {} });
        }
      }
    });
  };
  handleEditRuntime = (build_env_dict) => {
    this.props.dispatch({
      type: 'appControl/editRuntimeBuildInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        build_env_dict
      },
      callback: (res) => {
        if (res && res._code == 200) {
          notification.success({ message: '修改成功.' });
          this.getRuntimeInfo();
        }
      }
    });
  };
  handleEditInfo = (val = {}) => {
    this.props.dispatch({
      type: 'appControl/editAppCreateInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        ...val
      },
      callback: (data) => {
        if (data) {
          this.props.updateDetail();
        }
      }
    });
  };

  changeBuildSource = () => {
    this.setState({ changeBuildSource: true });
  };
  hideBuildSource = () => {
    this.setState({ changeBuildSource: false });
  };

  changeEditOauth = () => {
    this.handleProvinceChange();
    this.setState({ editOauth: true });
  };
  hideEditOauth = () => {
    this.setState({ editOauth: false });
  };

  loadBuildSourceInfo = () => {
    const { dispatch } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    dispatch({
      type: 'appControl/getAppBuidSource',
      payload: {
        team_name,
        service_alias: this.props.appDetail.service.service_alias
      },
      callback: (data) => {
        if (data) {
          const { bean } = data;
          this.setState({ buildSource: bean }, () => {
            if (
              bean &&
              bean.code_from &&
              bean.code_from.indexOf('oauth') > -1
            ) {
              this.loadThirdInfo();
            }
          });
        }
      }
    });
  };

  loadThirdInfo = () => {
    const { dispatch } = this.props;
    const { buildSource } = this.state;

    dispatch({
      type: 'global/codeThirdInfo',
      payload: {
        full_name: buildSource.full_name,
        oauth_service_id: buildSource.oauth_service_id
      },
      callback: (res) => {
        if (res && res._code === 200) {
          this.setState({
            thirdInfo: res.bean
          });
        }
      }
    });
  };

  handleToDetect = () => {
    this.setState({ languageBox: true });
  };
  handlelanguageBox = () => {
    this.setState({ languageBox: false, create_status: '' });
  };
  handleDetectGetLanguage = () => {
    const { dispatch } = this.props;
    const _th = this;
    dispatch({
      type: 'appControl/getLanguage',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        service_alias: this.props.appDetail.service.service_alias,
        check_uuid: this.state.check_uuid
      },
      callback: (res) => {
        if (res) {
          if (res._code == 200) {
            if (
              res.bean &&
              res.bean.check_status != 'success' &&
              res.bean.check_status != 'failure'
            ) {
              setTimeout(function () {
                _th.handleDetectGetLanguage();
              }, 3000);
            } else {
              this.loadBuildSourceInfo();
              this.setState({
                create_status: res.bean && res.bean.check_status,
                service_info: res.bean && res.bean.service_info,
                error_infos: res.bean && res.bean.error_infos
              });
            }
          }
        }
      }
    });
  };

  handleDetectPutLanguage = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'appControl/putLanguage',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        service_alias: this.props.appDetail.service.service_alias
      },
      callback: (res) => {
        if (res) {
          this.setState(
            {
              create_status: res.bean && res.bean.create_status,
              check_uuid: res.bean && res.bean.check_uuid
            },
            () => {
              if (this.state.create_status == 'failure') {
              } else {
                this.handleDetectGetLanguage();
              }
            }
          );
        }
      }
    });
  };

  hideMarketAppDetail = () => {
    this.setState({
      showApp: {},
      showMarketAppDetail: false
    });
  };

  // 获取类型
  handleCodeWarehouseType = (props) => {
    const { dispatch, type } = props;
    const { tabType, buildSource } = this.state;
    const oauth_service_id = this.props.form.getFieldValue('oauth_service_id');
    const project_full_name = this.props.form.getFieldValue('full_name');

    dispatch({
      type: 'global/codeWarehouseType',
      payload: {
        type: tabType,
        full_name: project_full_name || buildSource.full_name,
        oauth_service_id: oauth_service_id || buildSource.oauth_service_id
      },
      callback: (res) => {
        if (res && res._code === 200) {
          this.setState({
            tags: res.bean ? res.bean[tabType] : [],
            tagsLoading: false,
            OauthLoading: false
          });
        }
      }
    });
  };

  onTabChange = (tabType) => {
    this.setState({ tabType, tagsLoading: true }, () => {
      this.handleCodeWarehouseType(this.props);
    });
  };

  onPagePre = () => {
    const { page } = this.state;
    if (page > 1) {
      const pages = page - 1;
      const firstPage = page == 1;
      this.setState({ firstPage, page: pages }, () => {
        this.handleProvinceChange();
      });
    }
  };
  onPageNext = () => {
    const { lastPage, page } = this.state;
    if (!lastPage) {
      const pages = page + 1;
      this.setState({ page: pages }, () => {
        this.handleProvinceChange();
      });
    }
  };

  handleProvinceChange = (id) => {
    // 获取代码仓库信息
    const { dispatch, form } = this.props;
    const { setFieldsValue } = this.props.form;
    const { tabList, buildSource, page } = this.state;
    const oauth_service_id = this.props.form.getFieldValue('oauth_service_id');
    this.setState({ OauthLoading: true });

    dispatch({
      type: 'global/codeWarehouseInfo',
      payload: {
        page,
        oauth_service_id:
          id ||
          oauth_service_id ||
          (buildSource && buildSource.oauth_service_id) ||
          (tabList.length > 0 ? tabList[0].id : '')
      },
      callback: (res) => {
        if (
          res &&
          res._code === 200 &&
          res.bean &&
          res.bean.repositories &&
          res.bean.repositories.length > 0
        ) {
          const firstPage = page == 1;
          const lastPage = res.bean.repositories.length < 10;

          const setFullName = res.bean.repositories[0].project_full_name;
          const setUrl = res.bean.repositories[0].project_url;
          const setVersion = res.bean.repositories[0].project_default_branch;
          if (id) {
            setFieldsValue({
              full_name: setFullName,
              git_url: setUrl,
              code_version: setVersion
            });
          }
          this.setState(
            {
              firstPage,
              lastPage,
              fullList: res.bean.repositories
            },
            () => {
              this.handleCodeWarehouseType(this.props);
            }
          );
        } else {
          this.setState({ tagsLoading: false, OauthLoading: false });
        }
      }
    });
  };

  handleProjectChange = (project_full_name) => {
    this.setState({ OauthLoading: true });
    const { form } = this.props;
    const { setFieldsValue } = this.props.form;
    const { fullList } = this.state;

    fullList.map((item) => {
      if (item.project_full_name === project_full_name) {
        setFieldsValue(
          {
            git_url: item.project_url,
            code_version: item.project_default_branch
          },
          () => {
            this.handleCodeWarehouseType(this.props);
            this.setState({ OauthLoading: false });
          }
        );
      }
    });
  };

  handleSubmitOauth = () => {
    const { form } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (err) return;

      this.props.dispatch({
        type: 'appControl/putAppBuidSource',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          service_alias: this.props.appAlias,
          is_oauth: true,
          oauth_service_id: fieldsValue.oauth_service_id,
          full_name: fieldsValue.full_name,
          git_url: fieldsValue.git_url,
          code_version: fieldsValue.code_version,
          service_source: 'source_code'
        },
        callback: () => {
          notification.success({ message: '修改成功，下次构建部署时生效' });
          this.loadBuildSourceInfo();
          this.hideEditOauth();
        }
      });
    });
  };
  // 是否可以浏览当前界面
  canView() {
    const {
      componentPermissions: { isSource }
    } = this.props;
    return isSource;
  }
  render() {
    if (!this.canView()) return <NoPermTip />;

    const { form, match, appDetail } = this.props;
    const {
      runtimeInfo,
      thirdInfo,
      buildSource,
      tags,
      tagsLoading,
      fullList,
      tabList,
      firstPage,
      lastPage
    } = this.state;
    const language = appUtil.getLanguage(appDetail);
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 3
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 21
        }
      }
    };

    const formOauthLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 5
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 19
        }
      }
    };

    const { teamName, regionName } = match.params;
    const { getFieldDecorator } = form;
    const versionLanguage = buildSource ? buildSource.language : '';
    const buildShared = appUtil.getCreateTypeCNByBuildSource(buildSource);
    const isLocalShared = buildShared && buildShared === '本地共享库';
    const languageType = versionLanguage || '';
    return (
      <Fragment>
        {buildSource && (
          <Card
            title="构建源"
            style={{
              marginBottom: 24
            }}
            extra={[
              appUtil.isOauthByBuildSource(buildSource) ? (
                <a onClick={this.changeEditOauth} href="javascript:;">
                  编辑
                </a>
              ) : (
                !appUtil.isMarketAppByBuildSource(buildSource) && (
                  <a onClick={this.changeBuildSource} href="javascript:;">
                    更改
                  </a>
                )
              )
            ]}
          >
            <div>
              <FormItem
                style={{
                  marginBottom: 0
                }}
                {...formItemLayout}
                label="创建方式"
              >
                <Link
                  to={
                    isLocalShared &&
                    `/team/${teamName}/region/${regionName}/create/market`
                  }
                  style={{ color: !isLocalShared && 'rgba(0, 0, 0, 0.65)' }}
                >
                  {appUtil.isOauthByBuildSource(buildSource) && thirdInfo
                    ? thirdInfo.service_type
                    : buildShared}
                </Link>
              </FormItem>
            </div>

            {appUtil.isImageAppByBuildSource(buildSource) ? (
              <div>
                <FormItem
                  style={{
                    marginBottom: 0
                  }}
                  {...formItemLayout}
                  label="镜像名称"
                >
                  {buildSource.image}
                </FormItem>
                <FormItem
                  style={{
                    marginBottom: 0
                  }}
                  {...formItemLayout}
                  label="版本"
                >
                  {buildSource.version}
                </FormItem>
                <FormItem
                  style={{
                    marginBottom: 0
                  }}
                  {...formItemLayout}
                  label="启动命令"
                >
                  {buildSource.cmd || ''}
                </FormItem>
              </div>
            ) : (
              ''
            )}
            {appUtil.isMarketAppByBuildSource(buildSource) ? (
              <Fragment>
                <FormItem
                  style={{
                    marginBottom: 0
                  }}
                  {...formItemLayout}
                  label="应用模版名称"
                >
                  {buildSource.group_key ? (
                    <a
                      href="javascript:;"
                      onClick={() => {
                        this.setState({
                          showApp: {
                            details: buildSource.details,
                            group_name: buildSource.rain_app_name,
                            group_key: buildSource.group_key
                          },
                          showMarketAppDetail: true
                        });
                      }}
                    >
                      {buildSource.rain_app_name}
                    </a>
                  ) : (
                    '无法找到源应用，可能已删除'
                  )}
                </FormItem>
                <FormItem
                  style={{
                    marginBottom: 0
                  }}
                  {...formItemLayout}
                  label="版本"
                >
                  {buildSource.version}
                </FormItem>
              </Fragment>
            ) : (
              ''
            )}

            {appUtil.isOauthByBuildSource(buildSource) && (
              <FormItem
                style={{
                  marginBottom: 0
                }}
                {...formItemLayout}
                label="项目名称"
              >
                <a href={buildSource.git_url} target="_blank">
                  {buildSource.full_name}
                </a>
              </FormItem>
            )}

            {appUtil.isCodeAppByBuildSource(buildSource) ? (
              <Fragment>
                <FormItem
                  style={{
                    marginBottom: 0
                  }}
                  {...formItemLayout}
                  label="仓库地址"
                >
                  <a href={buildSource.git_url} target="_blank">
                    {buildSource.git_url}
                  </a>
                </FormItem>
                <FormItem
                  style={{
                    marginBottom: 0
                  }}
                  {...formItemLayout}
                  label="代码版本"
                >
                  {buildSource.code_version}
                </FormItem>

                <FormItem
                  style={{
                    marginBottom: 0
                  }}
                  {...formItemLayout}
                  className={styles.ant_form_item}
                  label="语言"
                >
                  {languageType != 'static' ? (
                    <a target="blank" href={languageObj[`${languageType}`]}>
                      {languageType}
                    </a>
                  ) : (
                    <a href="javascript:void(0);">{languageType}</a>
                  )}
                  <Button
                    size="small"
                    type="primary"
                    onClick={this.handleToDetect}
                  >
                    重新检测
                  </Button>
                </FormItem>
              </Fragment>
            ) : (
              ''
            )}
            {/* <ChangeBranch
                  isCreateFromCustomCode={appUtil.isCreateFromCustomCode(appDetail)}
                  appAlias={this.props.appAlias}
                  isShowDeployTips={(onoffshow) => {
                    this.props.onshowDeployTips(onoffshow);
                  }}
                /> */}
          </Card>
        )}

        {buildSource && (
          <AutoDeploy
            app={this.props.appDetail}
            service_source={appUtil.getCreateTypeCNByBuildSource(buildSource)}
          />
        )}

        {this.state.languageBox && (
          <Modal
            visible={this.state.languageBox}
            onCancel={this.handlelanguageBox}
            title="重新检测"
            footer={
              !this.state.create_status
                ? [
                    <Button key="back" onClick={this.handlelanguageBox}>
                      关闭
                    </Button>,
                    <Button
                      key="submit"
                      type="primary"
                      onClick={this.handleDetectPutLanguage}
                    >
                      检测
                    </Button>
                  ]
                : this.state.create_status == 'success'
                ? [
                    <Button key="back" onClick={this.handlelanguageBox}>
                      关闭
                    </Button>,
                    <Button
                      key="submit"
                      type="primary"
                      onClick={this.handlelanguageBox}
                    >
                      确认
                    </Button>
                  ]
                : [<Button key="back">关闭</Button>]
            }
          >
            <div>
              {this.state.create_status == 'checking' ||
              this.state.create_status == 'complete' ? (
                <div>
                  <p style={{ textAlign: 'center' }}>
                    <Spin />
                  </p>
                  <p style={{ textAlign: 'center', fontSize: '14px' }}>
                    检测中，请稍后(请勿关闭弹窗)
                  </p>
                </div>
              ) : (
                ''
              )}
              {this.state.create_status == 'failure' ? (
                <div>
                  <p
                    style={{
                      textAlign: 'center',
                      color: '#28cb75',
                      fontSize: '36px'
                    }}
                  >
                    <Icon
                      style={{
                        color: '#f5222d',
                        marginRight: 8
                      }}
                      type="close-circle-o"
                    />
                  </p>
                  {this.state.error_infos &&
                    this.state.error_infos.map((item) => {
                      return (
                        <div>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: `<span>${item.error_info || ''} ${
                                item.solve_advice || ''
                              }</span>`
                            }}
                          />
                        </div>
                      );
                      // <p style={{ textAlign: 'center', fontSize: '14px' }}>{item.key}:{item.value} </p>
                    })}
                </div>
              ) : (
                ''
              )}
              {this.state.create_status == 'success' ? (
                <div>
                  <p
                    style={{
                      textAlign: 'center',
                      color: '#28cb75',
                      fontSize: '36px'
                    }}
                  >
                    <Icon type="check-circle-o" />
                  </p>

                  {this.state.service_info &&
                    this.state.service_info.map((item) => {
                      return (
                        <p style={{ textAlign: 'center', fontSize: '14px' }}>
                          {item.key}:{item.value}{' '}
                        </p>
                      );
                    })}
                </div>
              ) : (
                ''
              )}
              {this.state.create_status == 'failed' ? (
                <div>
                  <p
                    style={{
                      textAlign: 'center',
                      color: '999',
                      fontSize: '36px'
                    }}
                  >
                    <Icon type="close-circle-o" />
                  </p>
                  <p style={{ textAlign: 'center', fontSize: '14px' }}>
                    检测失败，请重新检测
                  </p>
                </div>
              ) : (
                ''
              )}

              {!this.state.create_status && (
                <div>
                  <p style={{ textAlign: 'center', fontSize: '14px' }}>
                    确定要重新检测吗?
                  </p>
                </div>
              )}
            </div>
          </Modal>
        )}

        {language && runtimeInfo && (
          <CodeBuildConfig
            appDetail={this.props.appDetail}
            onSubmit={this.handleEditRuntime}
            language={language}
            runtimeInfo={this.state.runtimeInfo}
          />
        )}

        {this.state.changeBuildSource && (
          <ChangeBuildSource
            onOk={this.onChangeBuildSource}
            buildSource={buildSource}
            appAlias={this.props.appDetail.service.service_alias}
            title="更改组件构建源"
            onCancel={this.hideBuildSource}
          />
        )}

        {this.state.editOauth && (
          <Modal
            visible={this.state.editOauth}
            onCancel={this.hideEditOauth}
            onOk={this.handleSubmitOauth}
            loading={this.state.OauthLoading}
            title="编辑"
          >
            <Spin spinning={this.state.OauthLoading}>
              <Form onSubmit={this.handleSubmitOauth}>
                <FormItem {...formOauthLayout} label="创建方式">
                  {getFieldDecorator('oauth_service_id', {
                    initialValue: thirdInfo ? `${thirdInfo.service_id}` : '',
                    rules: [{ required: true, message: '请选择创建方式' }]
                  })(
                    <Select
                      onChange={this.handleProvinceChange}
                      placeholder="请选择要创建方式"
                    >
                      {tabList.length > 0 &&
                        tabList.map((item) => (
                          <Option key={item.id} value={item.id}>
                            {item.type}
                          </Option>
                        ))}
                    </Select>
                  )}
                </FormItem>

                <FormItem {...formOauthLayout} label="项目名称">
                  {getFieldDecorator('full_name', {
                    initialValue: buildSource
                      ? buildSource.full_name
                      : fullList.length > 0 && fullList[0].project_full_name,
                    rules: [{ required: true, message: '请选择项目' }]
                  })(
                    <Select
                      onChange={this.handleProjectChange}
                      dropdownRender={(menu) => (
                        <div>
                          {menu}
                          {!firstPage && (
                            <div>
                              <Divider style={{ margin: '4px 0' }} />
                              <div
                                style={{
                                  padding: '4px 8px',
                                  cursor: 'pointer'
                                }}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={this.onPagePre}
                              >
                                上一页
                              </div>
                            </div>
                          )}

                          {!lastPage && (
                            <div>
                              <Divider style={{ margin: '4px 0' }} />
                              <div
                                style={{
                                  padding: '4px 8px',
                                  cursor: 'pointer'
                                }}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={this.onPageNext}
                              >
                                下一页
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      placeholder="请选择项目"
                    >
                      {fullList.length > 0 &&
                        fullList.map((item) => (
                          <Option
                            key={item.project_url}
                            value={item.project_full_name}
                          >
                            {item.project_full_name}
                          </Option>
                        ))}
                    </Select>
                  )}
                </FormItem>

                <FormItem {...formOauthLayout} label="仓库地址">
                  {getFieldDecorator('git_url', {
                    initialValue: buildSource
                      ? buildSource.git_url
                      : fullList.length > 0 && fullList[0].git_url,
                    rules: [{ required: true, message: '请选择创建方式' }]
                  })(<Input placeholder="请输入配置组名" disabled />)}
                </FormItem>

                <Form.Item
                  className={styles.clearConform}
                  {...formOauthLayout}
                  label="代码版本"
                >
                  {getFieldDecorator('code_version', {
                    initialValue: buildSource ? buildSource.code_version : '',
                    rules: [{ required: true, message: '请输入代码版本' }]
                  })(
                    <Select placeholder="请输入代码版本">
                      <OptGroup
                        label={
                          <Tabs
                            defaultActiveKey="branches"
                            onChange={this.onTabChange}
                            className={styles.selectTabs}
                          >
                            <TabPane tab="分支" key="branches" />
                            <TabPane tab="Tags" key="tags" />
                          </Tabs>
                        }
                      >
                        {tags.length > 0 ? (
                          tags.map((item) => {
                            return (
                              <Option key={item} value={item}>
                                {item}
                              </Option>
                            );
                          })
                        ) : (
                          <Option value="loading">
                            <Spin spinning={tagsLoading} />
                          </Option>
                        )}
                      </OptGroup>
                    </Select>
                  )}
                </Form.Item>
              </Form>
            </Spin>{' '}
          </Modal>
        )}
        {this.state.showMarketAppDetail && (
          <MarketAppDetailShow
            onOk={this.hideMarketAppDetail}
            onCancel={this.hideMarketAppDetail}
            app={this.state.showApp}
          />
        )}
      </Fragment>
    );
  }
}
