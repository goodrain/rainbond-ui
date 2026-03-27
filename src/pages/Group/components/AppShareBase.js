/* eslint-disable react/jsx-no-bind */
import React, { Fragment, PureComponent } from 'react';
import {
  Button,
  Card,
  Drawer,
  Form,
  message,
  Modal,
  notification,
  Table,
  Tabs,
  Tag
} from 'antd';
import { routerRedux } from 'dva/router';
import { formatMessage } from '@/utils/intl';
import FooterToolbar from '../../../components/FooterToolbar';
import CodeMirrorForm from '../../../components/CodeMirrorForm';
import BatchEditPublishComponent from './BatchEditPublishComponent';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import {
  createApp,
  createEnterprise,
  createTeam
} from '../../../utils/breadcrumb';
import globalUtil from '../../../utils/global';
import pluginUtil from '../../../utils/plugin';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import AppShareAppInfo from './AppShareAppInfo';
import {
  collectShareServiceData,
  validateShareVersion
} from './appShareHelpers';
import mytabcss from '../mytab.less';
import styles from '../publish.less';

const { TabPane } = Tabs;
const { confirm } = Modal;

export default class AppShareBase extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      info: null,
      tabk: '',
      shareList: [],
      sharearrs: [],
      plugin_list: [],
      share_service_list: [],
      share_k8s_resources: [],
      appDetail: {},
      record: {},
      submitLoading: false,
      batchEditShow: false,
      currentPage: 1,
      showDrawerSwitchVal: false,
      k8sContent: '',
      k8sName: '',
      shareModal: false,
      dep_service_name: [],
      del_component_share_key: '',
      activeSection: 'basic',
      visitedSections: {
        basic: true
      },
      ...this.getInitialState()
    };
    this.com = [];
    this.sectionRefs = {};
  }

  componentDidMount() {
    this.afterCommonMount();
    this.fetchAppDetail();
    this.fetchRecord();
    this.getShareInfo();
  }

  getInitialState = () => ({});

  afterCommonMount = () => {};

  afterFetchRecord = () => {};

  onShareInfoLoaded = () => {};

  isSnapshotMode = () => false;

  shouldConfirmSubmit = () => false;

  renderBasicStage = () => null;

  renderComponentsTopSection = () => null;

  renderModeModals = () => null;

  handleModeSubmit = () => {};

  handleGiveup = () => {};

  checkVersion = (rules, value, callback) => {
    const errorMessage = validateShareVersion(value);
    if (errorMessage) {
      callback(errorMessage);
      return;
    }
    callback();
  };

  onCancels = () => {
    this.setState({
      shareModal: false,
      dep_service_name: []
    });
  };

  getParams() {
    return {
      groupId: this.props.match.params.appID,
      shareId: this.props.match.params.shareId
    };
  }

  setSectionRef = key => node => {
    if (node) {
      this.sectionRefs[key] = node;
    }
  };

  activateSection = key => {
    this.setState(
      prevState => ({
        activeSection: key,
        visitedSections: {
          ...prevState.visitedSections,
          [key]: true
        }
      }),
      () => {
        const target = this.sectionRefs[key];
        if (target && target.scrollIntoView) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    );
  };

  getShareInfo() {
    const { dispatch } = this.props;
    const params = this.getParams();
    dispatch({
      type: 'application/getShareInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        ...params
      },
      callback: data => {
        if (!data || !data.bean) {
          return;
        }
        const shareServiceList = data.bean.share_service_list || [];
        const selectedApp =
          shareServiceList[0] && shareServiceList[0].service_alias;
        const nextState = {
          info: data.bean,
          selectedApp,
          plugin_list: data.bean.share_plugin_list || [],
          tabk:
            shareServiceList[0] && shareServiceList[0].service_share_uuid,
          share_service_list: shareServiceList,
          share_k8s_resources: data.bean.share_k8s_resources || []
        };
        if (shareServiceList.length > 0) {
          const arr = shareServiceList.map(item => item.service_share_uuid);
          nextState.shareList = arr;
          nextState.sharearrs = arr;
        }
        this.setState(nextState, () => {
          this.onShareInfoLoaded(data.bean);
        });
      },
      handleError: res => {
        if (res && res.status === 404) {
          this.props.dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/exception/404`
            )
          );
        }
      }
    });
  }

  fetchRecord = () => {
    this.setState({ loading: true });
    const { teamName, appID, shareId } = this.props.match.params;
    const { dispatch } = this.props;
    dispatch({
      type: 'application/fetchShareRecord',
      payload: {
        team_name: teamName,
        app_id: appID,
        record_id: shareId
      },
      callback: data => {
        if (data && data.bean && data.status_code === 200) {
          this.setState({ record: data.bean, loading: false }, () => {
            this.afterFetchRecord(data.bean);
          });
        }
      }
    });
  };

  fetchAppDetail = () => {
    const { dispatch } = this.props;
    const { teamName, regionName, appID } = this.props.match.params;
    this.setState({ loadingDetail: true });
    dispatch({
      type: 'application/fetchGroupDetail',
      payload: {
        team_name: teamName,
        region_name: regionName,
        group_id: appID
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            appDetail: res.bean,
            loadingDetail: false
          });
        }
      },
      handleError: res => {
        if (res && res.code === 404) {
          this.props.dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/index`
            )
          );
        }
      }
    });
  };

  collectSubmissionData = () => {
    const { sharearrs, share_service_list, plugin_list, share_k8s_resources } =
      this.state;
    const result = collectShareServiceData({
      shareServiceList: share_service_list,
      selectedShareKeys: sharearrs,
      componentRefs: this.com
    });
    if (result.componentFormHasError) {
      this.setState({ submitLoading: false });
      this.activateSection('components');
      notification.warning({ message: '请先完善组件配置后再提交' });
      return null;
    }
    return {
      ...result,
      plugin_list,
      share_k8s_resources
    };
  };

  handleSubmitConditions = () => {
    const { form } = this.props;
    form.validateFieldsAndScroll(
      { scroll: { offsetTop: 80 } },
      (err, values) => {
        if (err) {
          this.activateSection('basic');
          return;
        }
        if (this.shouldConfirmSubmit(values)) {
          confirm({
            title: formatMessage({ id: 'appPublish.shop.pages.confirm.title' }),
            content: '',
            okText: formatMessage({ id: 'popover.confirm' }),
            cancelText: formatMessage({ id: 'popover.cancel' }),
            onOk: () => {
              this.handleModeSubmit(values);
            }
          });
          return;
        }
        this.handleModeSubmit(values);
      }
    );
  };

  save = val => {
    if (this.com.indexOf(val) === -1) {
      this.com.push(val);
    }
  };

  tabClick = val => {
    this.setState({ tabk: val });
  };

  removeComponent = component_share_key => {
    const { share_service_list } = this.state;
    const dep_service_name = [];
    if (share_service_list.length === 1) {
      message.info(formatMessage({ id: 'placeholder.appShare.leastOne' }));
      return;
    }
    share_service_list.forEach(component => {
      (component.dep_service_map_list || []).forEach(c => {
        if (c.dep_service_key === component_share_key) {
          dep_service_name.push(component.service_cname);
        }
      });
    });

    if (dep_service_name.length > 0) {
      this.setState({
        del_component_share_key: component_share_key,
        dep_service_name,
        shareModal: true
      });
    } else {
      this.removeComponentReal(component_share_key);
    }
  };

  removeComponentReal = component_share_key => {
    const { share_service_list, tabk } = this.state;
    const newComponents = share_service_list.filter(
      item => item.service_share_uuid !== component_share_key
    );
    if (tabk !== component_share_key) {
      this.setState({ share_service_list: newComponents }, () => {
        this.update_publish_plugins();
      });
      return;
    }
    this.setState(
      {
        share_service_list: newComponents,
        tabk: newComponents.length > 0 && newComponents[0].service_share_uuid
      },
      () => {
        this.update_publish_plugins();
      }
    );
  };

  update_publish_plugins = () => {
    const { share_service_list, info } = this.state;
    const plugin_ids = [];
    share_service_list.forEach(item => {
      if (item.service_related_plugin_config) {
        item.service_related_plugin_config.forEach(plu =>
          plugin_ids.push(plu.plugin_id)
        );
      }
    });
    if (info && info.share_plugin_list) {
      const newPlugins = info.share_plugin_list.filter(
        item => plugin_ids.indexOf(item.plugin_id) > -1
      );
      this.setState({ plugin_list: newPlugins });
    }
  };

  updateSelectComponents = checked => {
    const { info, tabk } = this.state;
    const newComponents = (info.share_service_list || []).filter(
      item => checked.indexOf(item.service_share_uuid) > -1
    );
    if (checked.indexOf(tabk) > -1) {
      this.setState(
        {
          batchEditShow: false,
          share_service_list: newComponents
        },
        () => {
          this.update_publish_plugins();
        }
      );
      return;
    }
    this.setState(
      {
        batchEditShow: false,
        share_service_list: newComponents,
        tabk: newComponents.length > 0 && newComponents[0].service_share_uuid
      },
      () => {
        this.update_publish_plugins();
      }
    );
  };

  getPageContent = page => {
    this.setState({
      currentPage: page
    });
  };

  onClose = () => {
    this.setState({
      showDrawerSwitchVal: false
    });
  };

  showDrawer = (text, record) => {
    this.setState({
      k8sContent: text,
      k8sName: record.name,
      showDrawerSwitchVal: !this.state.showDrawerSwitchVal
    });
  };

  render() {
    const {
      info,
      tabk,
      share_service_list,
      plugin_list,
      share_k8s_resources,
      currentPage,
      k8sContent,
      k8sName,
      activeSection,
      loadingModels,
      models = [],
      appDetail,
      model = {},
      record,
      versionInfo,
      versions = [],
      submitLoading,
      batchEditShow,
      recoders = [],
      snapshotNextVersion
    } = this.state;
    if (!info) {
      return null;
    }
    const apps = share_service_list || [];
    const plugins = plugin_list || [];
    const {
      loading,
      form,
      currentEnterprise,
      currentTeam,
      currentRegionName
    } = this.props;
    const { getFieldDecorator, getFieldValue, setFieldsValue } = form;
    const { shareModal, dep_service_name } = this.state;
    const snapshotMode = this.isSnapshotMode();
    const Application = getFieldValue('app_id');
    const isPlatformPluginEnabled = !!getFieldValue('is_platform_plugin');
    const activeApp =
      apps.find(item => item.service_share_uuid === tabk) || apps[0] || null;
    const count = (share_k8s_resources && share_k8s_resources.length) || 0;
    const perPageNum = 5;
    const curPageData =
      share_k8s_resources &&
      share_k8s_resources.slice(
        (currentPage - 1) * perPageNum,
        currentPage * perPageNum
      );
    const pagination = {
      onChange: this.getPageContent,
      total: count,
      pageSize: perPageNum
    };
    const platformPluginReady =
      !isPlatformPluginEnabled ||
      (!!getFieldValue('plugin_id') &&
        !!getFieldValue('plugin_name') &&
        !!getFieldValue('plugin_type') &&
        !!getFieldValue('entry_path') &&
        ((getFieldValue('inject_position') || []).length > 0));
    const selectedModel = models.find(item => item.app_id === Application) || model;
    const selectedModelName = (selectedModel && selectedModel.app_name) || '-';
    const pluginChecklist = {
      done: platformPluginReady
    };
    const stepItems = [
      {
        key: 'basic',
        title: snapshotMode ? '快照信息' : '版本与模板',
        desc: snapshotMode
          ? '先确认快照版本和版本说明，再把当前应用状态固化为一个可追溯的版本。'
          : '优先填写模板、版本号和说明，先把发布的基础信息确认完整。'
      },
      {
        key: 'components',
        title: '组件信息',
        desc: snapshotMode
          ? '组件配置会随快照一起保存，回滚时会按这里的参数恢复。'
          : '在这里精简组件、校对环境变量，并补全平台插件配置。'
      },
      {
        key: 'resources',
        title: '资源确认',
        desc: '这里会列出将随模板或快照一起保留的资源，方便你在提交前做最终检查。'
      }
    ];
    let breadcrumbList = [];
    breadcrumbList = createApp(
      createTeam(
        createEnterprise(breadcrumbList, currentEnterprise),
        currentTeam,
        currentRegionName
      ),
      currentTeam,
      currentRegionName,
      { appName: appDetail.group_name, appID: appDetail.group_id }
    );
    breadcrumbList.push({
      title: formatMessage({ id: 'appVersion.page.title' }),
      href: `/team/${currentTeam.team_name}/region/${currentRegionName}/apps/${appDetail.group_id}/version`
    });
    if (record && record.scope === 'goodrain') {
      breadcrumbList.push({
        title: formatMessage({ id: 'appPublish.btn.market' })
      });
    } else {
      breadcrumbList.push({
        title: formatMessage({ id: 'appPublish.btn.local' })
      });
    }
    const renderContext = {
      Application,
      activeApp,
      appDetail,
      apps,
      form,
      getFieldDecorator,
      getFieldValue,
      loadingModels,
      model,
      models,
      pluginChecklist,
      plugins,
      recoders,
      selectedModelName,
      setFieldsValue,
      snapshotMode,
      snapshotNextVersion,
      versionInfo,
      versions
    };
    const componentsSectionContent = (
      <div className={styles.publishCardBody}>
        {this.renderComponentsTopSection(renderContext)}
        {apps && apps.length > 0 ? (
          <Fragment>
            <div className={styles.tabsShell}>
              <div className={mytabcss.mytabtit} id="mytabtit">
                <Tabs
                  hideAdd
                  activeKey={tabk}
                  onChange={this.tabClick}
                  onEdit={(targetKey, action) => {
                    if (action === 'remove') {
                      this.removeComponent(targetKey);
                    }
                  }}
                >
                  {apps.map(apptit => {
                    const id = apptit.service_share_uuid;
                    return (
                      <TabPane
                        key={id}
                        tab={
                          <span className={mytabcss.cont}>
                            <a
                              tab={apptit.service_cname}
                              onClick={() => {
                                this.tabClick(id);
                              }}
                            >
                              {apptit.service_cname}
                            </a>
                          </span>
                        }
                      >
                        <AppShareAppInfo
                          key={id}
                          form={form}
                          app={apptit}
                          getref={this.save}
                          tab={apptit.service_alias}
                          ID={apptit.service_id}
                        />
                      </TabPane>
                    );
                  })}
                </Tabs>
              </div>
            </div>
          </Fragment>
        ) : (
          <div className={styles.sectionEmpty}>
            当前没有可发布的组件，请至少保留一个组件后再继续。
          </div>
        )}
        {plugins && plugins.length > 0 && (
          <div className={styles.sectionSubCard}>
            <div className={styles.sectionSubHead}>
              <div>
                <div className={styles.cardTitle}>
                  {formatMessage({
                    id: 'appPublish.btn.record.list.title.publish_pluginMsg'
                  })}
                </div>
                <div className={styles.cardDesc}>
                  当前选中组件关联到的插件会在这里统一展示，便于发布前快速核对。
                </div>
              </div>
              <Tag color="cyan">{`${plugins.length} 个插件`}</Tag>
            </div>
            <Table
              size="middle"
              rowKey={(records, index) => index}
              dataSource={plugins}
              columns={[
                {
                  title: formatMessage({
                    id: 'appPublish.btn.record.list.table.plugin_alias'
                  }),
                  dataIndex: 'plugin_alias'
                },
                {
                  title: formatMessage({
                    id: 'appPublish.btn.record.list.table.category'
                  }),
                  dataIndex: 'category',
                  render: v => pluginUtil.getCategoryCN(v)
                },
                {
                  title: formatMessage({
                    id: 'appPublish.btn.record.list.table.build_version'
                  }),
                  dataIndex: 'build_version'
                }
              ]}
            />
          </div>
        )}
      </div>
    );
    const resourcesSectionContent = (
      <div className={styles.publishCardBody}>
        {count > 0 ? (
          <Table
            size="middle"
            rowKey={(records, index) => index}
            dataSource={curPageData}
            columns={[
              {
                title: formatMessage({
                  id: 'appPublish.btn.record.list.table.name'
                }),
                dataIndex: 'name',
                key: 'name',
                align: 'left'
              },
              {
                title: formatMessage({
                  id: 'appPublish.btn.record.list.table.kind'
                }),
                dataIndex: 'kind',
                key: 'kind',
                align: 'left'
              },
              {
                title: formatMessage({
                  id: 'appPublish.btn.record.list.table.content'
                }),
                dataIndex: 'content',
                key: 'content',
                align: 'center',
                render: (text, item) => (
                  <Button onClick={() => this.showDrawer(text, item)}>
                    {formatMessage({
                      id: 'appPublish.btn.record.list.table.view_details'
                    })}
                  </Button>
                )
              }
            ]}
            pagination={pagination}
          />
        ) : (
          <div className={styles.sectionEmpty}>
            当前还没有可确认的资源内容，建议先检查分享记录是否完整。
          </div>
        )}
      </div>
    );
    const snapshotUnifiedContent = (
      <Card className={styles.publishCard} bodyStyle={{ padding: 0 }}>
        <div
          className={`${styles.snapshotMergedSection} ${
            activeSection === 'basic' ? styles.snapshotMergedSectionActive : ''
          }`}
          ref={this.setSectionRef('basic')}
        >
          <div className={styles.snapshotMergedSectionHeader}>
            <div className={styles.cardTitle}>{stepItems[0].title}</div>
            <div className={styles.cardDesc}>
              {stepItems[0].desc}
            </div>
          </div>
          <div className={styles.publishCardBody}>
            {this.renderBasicStage(renderContext)}
          </div>
        </div>
        <div
          className={`${styles.snapshotMergedSection} ${
            activeSection === 'components'
              ? styles.snapshotMergedSectionActive
              : ''
          }`}
          ref={this.setSectionRef('components')}
        >
          <div className={styles.snapshotMergedSectionHeader}>
            <div className={styles.cardTitle}>{stepItems[1].title}</div>
            <div className={styles.snapshotMergedSectionHeadRow}>
              <div className={styles.cardDesc}>
                {stepItems[1].desc}
              </div>
              {apps && apps.length > 0 && (
                <Button
                  onClick={() => {
                    this.setState({ batchEditShow: true });
                  }}
                >
                  {formatMessage({
                    id: 'appPublish.btn.record.list.title.bulk_edit'
                  })}
                </Button>
              )}
            </div>
          </div>
          {componentsSectionContent}
        </div>
        <div
          className={`${styles.snapshotMergedSection} ${
            activeSection === 'resources'
              ? styles.snapshotMergedSectionActive
              : ''
          } ${styles.snapshotMergedSectionLast}`}
          ref={this.setSectionRef('resources')}
        >
          <div className={styles.snapshotMergedSectionHeader}>
            <div className={styles.cardTitle}>{stepItems[2].title}</div>
            <div className={styles.cardDesc}>
              {stepItems[2].desc}
            </div>
          </div>
          {resourcesSectionContent}
        </div>
      </Card>
    );

    return (
      <PageHeaderLayout
        title={snapshotMode ? '创建快照' : '发布应用'}
        breadcrumbList={breadcrumbList}
        content={
          snapshotMode
            ? '创建快照是指将当前应用的状态固化为一个版本，用于后续回滚或发布。'
            : '发布应用是指将当前运行的应用进行模型化，形成应用模版发布到当前平台的组件库或开源应用商店，供当前平台或开源应用商店的用户使用。'
        }
        titleSvg={pageheaderSvg.getPageHeaderSvg('publish', 18)}
      >
        <div className={styles.publishPage}>
          <div className={`${styles.publishLayout} ${styles.publishLayoutSingle}`}>
            <div className={styles.publishMain}>
              {snapshotUnifiedContent}
            </div>
          </div>

          <Drawer
            title={formatMessage({
              id: 'appPublish.btn.record.list.title.detailMsg'
            })}
            placement="right"
            closable
            onClose={this.onClose}
            visible={this.state.showDrawerSwitchVal}
            width={500}
          >
            <CodeMirrorForm
              setFieldsValue={setFieldsValue}
              Form={Form}
              style={{ marginBottom: '20px' }}
              getFieldDecorator={getFieldDecorator}
              data={k8sContent || ''}
              name={k8sName}
              mode="yaml"
              isUpload={false}
              disabled
            />
          </Drawer>

          {shareModal && (
            <Modal
              title={formatMessage({
                id: 'appPublish.btn.record.list.title.check'
              })}
              visible={shareModal}
              onOk={() => {
                this.removeComponentReal(this.state.del_component_share_key);
                this.onCancels();
              }}
              onCancel={this.onCancels}
              okText={formatMessage({ id: 'popover.confirm' })}
              cancelText={formatMessage({ id: 'popover.cancel' })}
            >
              <div>
                {formatMessage({
                  id: 'appPublish.btn.record.list.pages.needPublish'
                })}
                {dep_service_name &&
                  dep_service_name.length > 0 &&
                  dep_service_name.map((item, index) => (
                    <span
                      style={{ marginLeft: '5px', color: '#4d73b1' }}
                      key={index}
                    >
                      {item}
                    </span>
                  ))}
                {formatMessage({
                  id: 'appPublish.btn.record.list.pages.componentPublish'
                })}
              </div>
            </Modal>
          )}

          {batchEditShow && (
            <BatchEditPublishComponent
              allcomponents={info.share_service_list}
              components={apps}
              onCancel={() => {
                this.setState({ batchEditShow: false });
              }}
              onOk={this.updateSelectComponents}
            />
          )}

          {this.renderModeModals(renderContext)}

          <FooterToolbar>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitLoading}
              onClick={this.handleSubmitConditions}
            >
              {formatMessage({ id: 'button.submit' })}
            </Button>
            <Button
              disabled={loading.effects['application/giveupShare']}
              onClick={this.handleGiveup}
            >
              {formatMessage({
                id: snapshotMode
                  ? 'button.cancel_snapshot'
                  : 'button.give_up_release'
              })}
            </Button>
          </FooterToolbar>
        </div>
      </PageHeaderLayout>
    );
  }
}
