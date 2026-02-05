import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Button, Spin, Icon, Tabs, Modal, Form, Select, Radio, Input, Tag, notification, Tooltip, Empty } from 'antd';
import { Link, routerRedux } from 'dva/router';
import ReactMarkdown from 'react-markdown';
import { pinyin } from 'pinyin-pro';
import globalUtil from '../../utils/global';
import handleAPIError from '../../utils/error';
import role from '../../utils/newRole';
import userUtil from '../../utils/user';
import styles from './Detail.less';

const { TabPane } = Tabs;
const { Option } = Select;

const formItemLayout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

@Form.create()
@connect(({ user, global }) => ({
  currentUser: user.currentUser,
  groups: global.groups
}))
class ExploreDetail extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      detail: null,
      currentPreviewIndex: 0,
      // 安装弹窗相关状态
      installModalVisible: false,
      installType: 'new', // 'new' | 'existing'
      selectedVersion: '',
      currentVersionInfo: null,
      submitLoading: false,
      // 团队相关状态
      teamList: [],
      teamLoading: false,
      selectedTeam: null,
      groupsLoading: false,
      // 权限相关状态
      creatAppPermission: {},
      creatComPermission: {},
      teamPermissionsInfo: null
    };
  }

  componentDidMount() {
    const {
      match: {
        params: { id }
      }
    } = this.props;
    this.loadData();
  }

  loadData = () => {
    const {
      dispatch,
      match: {
        params: { id }
      }
    } = this.props;

    this.setState({ loading: true });

    dispatch({
      type: 'explore/fetchAppDetail',
      payload: { app_id: id },
      callback: res => {
        this.setState({ loading: false });
        if (res?.response_data) {
          this.setState({ detail: res.response_data });
        }
      }
    });
  };

  // 获取版本号
  getVersion = () => {
    const { detail } = this.state;
    if (!detail) return '';

    if (detail.models && detail.models[0]?.versions?.[0]?.appVersion) {
      return detail.models[0].versions[0].appVersion;
    }
    if (detail.maxVersion) {
      return detail.maxVersion;
    }
    return '';
  };

  // 获取分类标签
  getCategoryTag = () => {
    const { detail } = this.state;
    if (!detail) return '';

    // 优先使用子分类
    if (detail.subClassification?.appClassificationName) {
      return detail.subClassification.appClassificationName;
    }
    // 其次使用分类列表的第一个
    if (detail.appClassifications && detail.appClassifications.length > 0) {
      return detail.appClassifications[0].appClassificationName;
    }
    return '';
  };

  // 获取所有版本列表
  getVersionList = () => {
    const { detail } = this.state;
    if (!detail?.models?.[0]?.versions) return [];
    return detail.models[0].versions;
  };

  // 获取第一个版本信息
  getSelectedVersion = () => {
    const versions = this.getVersionList();
    return versions[0] || null;
  };

  // 格式化内存显示 (MB)
  formatMemory = (mb) => {
    if (!mb) return '-';
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  };

  // 格式化内存显示 (Mi -> MB/GB, 1024换算)
  formatMemoryMi = (mi) => {
    if (!mi) return '-';
    if (mi >= 1024) {
      return `${(mi / 1024).toFixed(1)} GB`;
    }
    return `${mi} MB`;
  };

  // 格式化 CPU 显示 (m -> Core, 1000换算)
  formatCPU = (millicores) => {
    if (!millicores) return '-';
    if (millicores >= 1000) {
      return `${(millicores / 1000).toFixed(1)} Core`;
    }
    return `${millicores} m`;
  };

  // 格式化数量显示 (下载量/浏览量)
  formatCount = (count) => {
    if (!count && count !== 0) return '-';
    if (count >= 10000) {
      return `${(count / 10000).toFixed(1)}w 次`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k 次`;
    }
    return `${count} 次`;
  };

  // 从 useDoc 中解析图片列表
  getPreviewImages = () => {
    const { detail } = this.state;
    if (!detail?.useDoc) return [];

    const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const images = [];
    let match;

    while ((match = imgRegex.exec(detail.useDoc)) !== null) {
      images.push({
        alt: match[1] || '预览图',
        url: match[2]
      });
    }

    return images;
  };

  // 切换预览图
  handlePreviewChange = (index) => {
    this.setState({ currentPreviewIndex: index });
  };

  // 上一张
  handlePrevPreview = () => {
    const images = this.getPreviewImages();
    const { currentPreviewIndex } = this.state;
    const newIndex = currentPreviewIndex > 0 ? currentPreviewIndex - 1 : images.length - 1;
    this.setState({ currentPreviewIndex: newIndex });
  };

  // 下一张
  handleNextPreview = () => {
    const images = this.getPreviewImages();
    const { currentPreviewIndex } = this.state;
    const newIndex = currentPreviewIndex < images.length - 1 ? currentPreviewIndex + 1 : 0;
    this.setState({ currentPreviewIndex: newIndex });
  };

  // 返回上一页
  handleGoBack = () => {
    const { dispatch, match: { params: { eid } }, location } = this.props;
    // 获取 URL 中的 teamName 参数并传递回列表页
    const query = new URLSearchParams(location?.search || '');
    const teamName = query.get('teamName') || '';
    let path = `/explore/${eid}/index`;
    if (teamName) {
      path = `${path}?teamName=${teamName}`;
    }
    dispatch(routerRedux.push(path));
  };

  // 获取应用列表
  fetchGroupsList = (teamName,regionName) => {
    const { dispatch } = this.props;
    const team = teamName || globalUtil.getCurrTeamName();
    if (!team) return;

    this.setState({ groupsLoading: true });
    dispatch({
      type: 'global/fetchGroups',
      payload: {
        team_name: team,
        region_name: regionName
      },
      callback: () => {
        this.setState({ groupsLoading: false });
      },
      handleError: () => {
        this.setState({ groupsLoading: false });
      }
    });
  };

  // 获取团队列表
  fetchTeamList = () => {
    const { dispatch, match: { params: { eid } }, location } = this.props;

    if (!eid) return;

    // 获取 URL 中的 teamName 参数
    const query = new URLSearchParams(location?.search || '');
    const urlTeamName = query.get('teamName') || '';

    this.setState({ teamLoading: true });
    dispatch({
      type: 'global/fetchMyTeams',
      payload: {
        enterprise_id: eid,
        name: '',
        page: 1,
        page_size: 100
      },
      callback: res => {
        if (res && res.status_code === 200) {
          const teams = res.list || [];
          this.setState({
            teamList: teams,
            teamLoading: false
          });
          // 如果有团队，根据 URL 参数或默认选中第一个
          if (teams.length > 0) {
            let targetTeam = null;
            // 如果 URL 中有 teamName 参数，尝试找到对应的团队
            if (urlTeamName) {
              targetTeam = teams.find(t => t.team_name === urlTeamName);
            }
            // 如果没找到或没有参数，选中第一个团队
            if (!targetTeam) {
              targetTeam = teams[0];
            }
            this.setState({ selectedTeam: targetTeam });
            const regionName = targetTeam.region?.[0]?.region_name || targetTeam.region_list?.[0]?.region_name;
            this.fetchGroupsList(targetTeam.team_name, regionName);
            // 获取团队权限信息
            this.fetchTeamPermissions(targetTeam.team_name);
          }
        } else {
          this.setState({ teamLoading: false });
        }
      },
      handleError: err => {
        handleAPIError(err);
        this.setState({ teamLoading: false });
      }
    });
  };

  // 获取团队权限信息
  fetchTeamPermissions = (teamName) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'user/fetchCurrent',
      payload: {
        team_name: teamName
      },
      callback: res => {
        if (res && res.bean) {
          const team = userUtil.getTeamByTeamName(res.bean, teamName);
          const tenantActions = team?.tenant_actions;
          // 获取应用创建权限
          const creatAppPermission = role.queryPermissionsInfo(tenantActions?.team, 'team_app_create');
          this.setState({
            teamPermissionsInfo: tenantActions,
            creatAppPermission: creatAppPermission
          });
        }
      },
      handleError: err => {
        console.error('获取团队权限失败:', err);
      }
    });
  };

  // 处理团队选择变更
  handleTeamChange = (teamName) => {
    const { teamList } = this.state;
    const { form } = this.props;
    const team = teamList.find(t => t.team_name === teamName);
    this.setState({
      selectedTeam: team,
      // 重置权限状态
      creatAppPermission: {},
      creatComPermission: {},
      teamPermissionsInfo: null
    });
    // 清空已选择的应用
    form.setFieldsValue({ group_id: undefined });
    // 获取该团队的应用列表
    if (team) {
      const regionName = team.region?.[0]?.region_name || team.region_list?.[0]?.region_name;
      this.fetchGroupsList(teamName, regionName);
      // 获取团队权限信息
      this.fetchTeamPermissions(teamName);
    }
  };

  // 选择应用变更（用于权限检查）
  handleGroupChange = (groupId) => {
    const { teamPermissionsInfo } = this.state;
    if (teamPermissionsInfo && groupId) {
      // 获取组件创建权限
      const creatComPermission = role.queryPermissionsInfo(teamPermissionsInfo?.team, 'app_overview', `app_${groupId}`);
      this.setState({ creatComPermission: creatComPermission });
    }
  };

  // 生成英文名
  generateEnglishName = (name) => {
    if (name) {
      const pinyinName = pinyin(name, { toneType: 'none' }).replace(/\s/g, '');
      return pinyinName.toLowerCase();
    }
    return '';
  };

  // 打开安装弹窗
  handleOpenInstallModal = () => {
    const { detail } = this.state;
    const versions = this.getVersionList();
    const firstVersion = versions[0] || null;

    this.setState({
      installModalVisible: true,
      installType: 'new',
      selectedVersion: firstVersion?.appVersion || '',
      currentVersionInfo: firstVersion,
      selectedTeam: null,
      teamList: [],
      // 重置权限状态
      creatAppPermission: {},
      creatComPermission: {},
      teamPermissionsInfo: null
    });

    // 获取团队列表
    this.fetchTeamList();
  };

  // 关闭安装弹窗
  handleCloseInstallModal = () => {
    const { form } = this.props;
    this.setState({
      installModalVisible: false,
      installType: 'new',
      selectedVersion: '',
      currentVersionInfo: null,
      submitLoading: false,
      selectedTeam: null,
      teamList: [],
      // 重置权限状态
      creatAppPermission: {},
      creatComPermission: {},
      teamPermissionsInfo: null
    });
    form.resetFields();
  };

  // 处理版本变更
  handleVersionChange = (version) => {
    const versions = this.getVersionList();
    const versionInfo = versions.find(v => v.appVersion === version);
    this.setState({
      selectedVersion: version,
      currentVersionInfo: versionInfo || null
    });
  };

  // 处理安装类型变更
  handleInstallTypeChange = (e) => {
    const installType = e.target.value;
    const { creatAppPermission, creatComPermission } = this.state;
    this.setState({ installType: installType });
  };

  // 处理安装提交
  handleInstallSubmit = () => {
    const { form, dispatch, match: { params: { eid } } } = this.props;
    const { detail, selectedVersion, selectedTeam } = this.state;

    if (!selectedTeam) {
      notification.warning({
        message: '请选择团队',
        description: '请先选择要安装到的团队'
      });
      return;
    }

    form.validateFields((err, values) => {
      if (err) return;

      this.setState({ submitLoading: true });

      const teamName = selectedTeam.team_name;
      const regionName = selectedTeam.region?.[0]?.region_name || selectedTeam.region_list?.[0]?.region_name;

      if (!regionName) {
        notification.error({
          message: '安装失败',
          description: '该团队没有可用的集群'
        });
        this.setState({ submitLoading: false });
        return;
      }

      // market_name 使用市场的 name 字段
      const marketName = 'RainbondMarket';

      const installApp = (finalGroupId, isNewApp = false) => {
        dispatch({
          type: 'createApp/installApp',
          payload: {
            team_name: teamName,
            group_id: finalGroupId,
            app_id: detail.appKeyID,
            app_version: values.group_version,
            is_deploy: true,
            install_from_cloud: true,
            marketName: marketName
          },
          callback: () => {
            dispatch({
              type: 'global/fetchGroups',
              payload: {
                team_name: teamName
              },
              callback: () => {
                notification.success({
                  message: '安装成功',
                  description: '应用正在部署中，请稍候...'
                });
                // 跳转到应用详情页
                dispatch(
                  routerRedux.push(
                    `/team/${teamName}/region/${regionName}/apps/${finalGroupId}/overview`
                  )
                );
              }
            });
            this.setState({ submitLoading: false });
            this.handleCloseInstallModal();
          },
          handleError: (error) => {
            this.setState({ submitLoading: false });
            handleAPIError(error);
          }
        });
      };

      if (values.install_type === 'new' && values.group_name) {
        // 创建新应用，先创建应用获取 group_id，再安装
        const k8s_app = this.generateEnglishName(values.group_name);
        dispatch({
          type: 'application/addGroup',
          payload: {
            region_name: regionName,
            team_name: teamName,
            group_name: values.group_name,
            k8s_app: k8s_app,
            note: ''
          },
          callback: (res) => {
            if (res && res.group_id) {
              installApp(res.group_id, true);
            } else {
              this.setState({ submitLoading: false });
            }
          },
          handleError: (error) => {
            this.setState({ submitLoading: false });
            handleAPIError(error);
          }
        });
      } else if (values.install_type === 'existing' && values.group_id) {
        // 安装到已有应用
        installApp(values.group_id, true);
      } else {
        this.setState({ submitLoading: false });
      }
    });
  };

  render() {
    const {
      match: {
        params: { eid }
      },
      form,
      groups
    } = this.props;
    const { getFieldDecorator } = form;
    const {
      loading,
      detail,
      currentPreviewIndex,
      installModalVisible,
      installType,
      selectedVersion,
      currentVersionInfo,
      submitLoading,
      teamList,
      teamLoading,
      selectedTeam,
      groupsLoading
    } = this.state;

    const version = this.getVersion();
    const categoryTag = this.getCategoryTag();
    const previewImages = this.getPreviewImages();
    const versions = this.getVersionList();

    return (
      <div className={styles.detailPage}>
        {/* 返回按钮 */}
        <div className={styles.backBar}>
          <div className={styles.backBtn} onClick={this.handleGoBack}>
            <Icon type="left" className={styles.backIcon} />
            <span>返回首页</span>
          </div>
        </div>

        <div className={styles.detailWrapper}>
          {loading ? (
            <div className={styles.pageLoading}>
              <Spin />
            </div>
          ) : detail && (
            <>
              {/* 头部 */}
              <div className={styles.detailHeader}>
                <div className={styles.headerLeft}>
                  <div className={styles.appLogo}>
                    {detail.logo ? (
                      <img src={detail.logo} alt={detail.name} />
                    ) : (
                      globalUtil.fetchSvg('defaulAppImg')
                    )}
                  </div>
                  <div className={styles.appInfo}>
                    <div className={styles.appNameRow}>
                      <h1 className={styles.appName}>{detail.name}</h1>
                      {categoryTag && (
                        <span className={styles.categoryTag}>{categoryTag}</span>
                      )}
                    </div>
                    <p className={styles.appDesc}>{detail.desc || '暂无描述'}</p>
                    {version && (
                      <span className={styles.appVersion}>版本 {version}</span>
                    )}
                  </div>
                </div>
                <div className={styles.headerRight}>
                  <Button
                    type="primary"
                    className={styles.installBtn}
                    onClick={this.handleOpenInstallModal}
                  >
                    <Icon type="caret-right" />
                    安装应用
                  </Button>
                </div>
              </div>

              {/* 内容区域 - 左右两栏 */}
              <div className={styles.detailContent}>
                {/* 左侧 - 预览图 + 使用文档 */}
                <div className={styles.contentLeft}>
                  {/* 预览图区域 - 仅当有预览图时显示 */}
                  {previewImages.length > 0 && (
                    <div className={styles.previewSection}>
                      <h3 className={styles.sectionTitle}>
                        效果展示
                      </h3>
                      <div className={styles.previewContent}>
                        {/* 左侧缩略图列表 */}
                        {previewImages.length > 1 && (
                          <div className={styles.thumbnailList}>
                            {previewImages.map((img, index) => (
                              <div
                                key={index}
                                className={`${styles.thumbnailItem} ${index === currentPreviewIndex ? styles.thumbnailActive : ''}`}
                                onClick={() => this.handlePreviewChange(index)}
                              >
                                <img src={img.url} alt={img.alt} />
                              </div>
                            ))}
                          </div>
                        )}
                        {/* 右侧大图展示 */}
                        <div className={styles.mainPreview}>
                          <img
                            src={previewImages[currentPreviewIndex]?.url}
                            alt={previewImages[currentPreviewIndex]?.alt}
                          />
                          {previewImages.length > 1 && (
                            <>
                              <div
                                className={`${styles.previewArrow} ${styles.previewArrowLeft}`}
                                onClick={this.handlePrevPreview}
                              >
                                <Icon type="left" />
                              </div>
                              <div
                                className={`${styles.previewArrow} ${styles.previewArrowRight}`}
                                onClick={this.handleNextPreview}
                              >
                                <Icon type="right" />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 使用文档区域 */}
                  <div className={styles.docSection}>
                    <Tabs defaultActiveKey="intro" className={styles.docTabs}>
                      <TabPane tab="简介" key="intro">
                        <div className={styles.docContent}>
                          {detail.introduction ? (
                            <ReactMarkdown className={styles.markdown} source={detail.introduction} />
                          ) : (
                            <span className={styles.emptyText}>暂无简介</span>
                          )}
                        </div>
                      </TabPane>
                      {detail.installDoc && (
                        <TabPane tab="安装文档" key="install">
                          <div className={styles.docContent}>
                            <ReactMarkdown className={styles.markdown} source={detail.installDoc} />
                          </div>
                        </TabPane>
                      )}
                    </Tabs>
                  </div>
                </div>

                {/* 右侧 - 基础信息 + 系统要求 */}
                <div className={styles.contentRight}>
                  {/* 基础信息区域 */}
                  <div className={styles.infoSection}>
                    <h3 className={styles.sectionTitle}>基础信息</h3>
                    <div className={styles.infoContent}>
                      {/* 下载量 */}
                      <div className={styles.infoRow}>
                        <div className={styles.infoRowLeft}>
                          <Icon type="download" className={`${styles.infoIcon} ${styles.iconBlue}`} />
                          <span className={styles.infoLabel}>下载量</span>
                        </div>
                        <span className={styles.infoValue}>{this.formatCount(detail.installCount)}</span>
                      </div>

                      {/* 浏览量 */}
                      <div className={styles.infoRow}>
                        <div className={styles.infoRowLeft}>
                          <Icon type="line-chart" className={`${styles.infoIcon} ${styles.iconOrange}`} />
                          <span className={styles.infoLabel}>浏览量</span>
                        </div>
                        <span className={styles.infoValue}>{this.formatCount(detail.showCount)}</span>
                      </div>

                      {/* 分类 */}
                      <div className={styles.infoRow}>
                        <div className={styles.infoRowLeft}>
                          <Icon type="appstore" className={`${styles.infoIcon} ${styles.iconBlue}`} />
                          <span className={styles.infoLabel}>分类</span>
                        </div>
                        <span className={styles.infoValue}>
                          {detail.appClassifications?.map(cat => cat.appClassificationName).join('、') || '-'}
                        </span>
                      </div>

                      {/* 标签 */}
                      {detail.tags && detail.tags.length > 0 && (
                        <div className={styles.infoRow}>
                          <div className={styles.infoRowLeft}>
                            <Icon type="tags" className={`${styles.infoIcon} ${styles.iconGreen}`} />
                            <span className={styles.infoLabel}>标签</span>
                          </div>
                          <div className={styles.tagListInline}>
                            {detail.tags.map((tag, idx) => (
                              <span key={idx} className={styles.tagGray}>
                                {tag.name || tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 系统要求区域 */}
                  <div className={styles.requirementSection}>
                    <h3 className={styles.sectionTitle}>系统要求</h3>
                    <div className={styles.requirementContent}>
                      {this.getSelectedVersion() ? (
                        <>
                          {/* CPU 占用 */}
                          <div className={styles.infoRow}>
                            <div className={styles.infoRowLeft}>
                              <Icon type="dashboard" className={`${styles.infoIcon} ${styles.iconBlue}`} />
                              <span className={styles.infoLabel}>CPU 占用</span>
                            </div>
                            <span className={styles.infoValue}>
                              {this.formatCPU(this.getSelectedVersion().cpu)}
                            </span>
                          </div>

                          {/* 内存占用 */}
                          <div className={styles.infoRow}>
                            <div className={styles.infoRowLeft}>
                              <Icon type="database" className={`${styles.infoIcon} ${styles.iconGreen}`} />
                              <span className={styles.infoLabel}>内存占用</span>
                            </div>
                            <span className={styles.infoValue}>
                              {this.formatMemoryMi(this.getSelectedVersion().memory)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <span className={styles.emptyText}>暂无版本信息</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 安装弹窗 */}
        <Modal
          title="安装应用"
          visible={installModalVisible}
          onCancel={this.handleCloseInstallModal}
          footer={
            teamLoading || teamList.length === 0 ? null : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '14px', color: '#595959' }}>
                  {currentVersionInfo && (
                    <span>
                      资源占用: CPU {currentVersionInfo.cpu || 0}m / 内存 {currentVersionInfo.memory || 0}MB
                    </span>
                  )}
                </div>
                {(() => {
                  const { creatAppPermission, creatComPermission } = this.state;
                  // 计算权限相关的禁用状态
                  let permissionDisabled = false;
                  let permissionTip = '';

                  if (installType === 'new' && creatAppPermission?.isAccess === false) {
                    permissionDisabled = true;
                    permissionTip = '您没有创建应用的权限';
                  } else if (installType === 'existing' && creatComPermission?.isCreate === false) {
                    permissionDisabled = true;
                    permissionTip = '您没有创建组件的权限';
                  }

                  const isDisabled = !selectedTeam || permissionDisabled;

                  const button = (
                    <Button
                      type="primary"
                      onClick={this.handleInstallSubmit}
                      loading={submitLoading}
                      disabled={isDisabled}
                    >
                      确认安装
                    </Button>
                  );

                  // 如果因权限禁用，显示提示
                  if (permissionDisabled) {
                    return (
                      <Tooltip title={permissionTip}>
                        {button}
                      </Tooltip>
                    );
                  }

                  return button;
                })()}
              </div>
            )
          }
          width={500}
          destroyOnClose
        >
          {teamLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin />
            </div>
          ) : teamList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Empty
                description={
                  <span style={{ color: '#666' }}>
                    暂无可用团队，请联系管理员加入团队后再安装应用
                  </span>
                }
              />
            </div>
          ) : detail && (
            <div className={styles.installFormWrapper}>
              {detail.desc && (
                <p className={styles.appDescriptionBanner}>
                  {detail.desc}
                </p>
              )}
              <Form layout="vertical" hideRequiredMark>
                <Form.Item {...formItemLayout} label="选择团队">
                  <Select
                    placeholder="请选择团队"
                    style={{ width: '100%' }}
                    loading={teamLoading}
                    value={selectedTeam?.team_name}
                    onChange={this.handleTeamChange}
                    getPopupContainer={triggerNode => triggerNode.parentNode}
                  >
                    {teamList.map(team => (
                      <Option key={team.team_name} value={team.team_name}>
                        {team.team_alias || team.team_name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item {...formItemLayout} label="选择版本">
                  {getFieldDecorator('group_version', {
                    initialValue: versions.length > 0 ? versions[0].appVersion : '',
                    rules: [{ required: true, message: '请选择版本' }]
                  })(
                    <Select
                      getPopupContainer={triggerNode => triggerNode.parentNode}
                      onChange={this.handleVersionChange}
                      style={{ width: '100%' }}
                    >
                      {versions.map((item, index) => (
                        <Option key={index} value={item.appVersion}>
                          {item.appVersion}
                          {item.arch && (
                            <Tag color="blue" style={{ marginLeft: '8px', lineHeight: '18px' }}>
                              {item.arch}
                            </Tag>
                          )}
                        </Option>
                      ))}
                    </Select>
                  )}
                </Form.Item>

                <Form.Item {...formItemLayout} label="安装类型">
                  {getFieldDecorator('install_type', {
                    initialValue: 'new',
                    rules: [{ required: true, message: '请选择安装类型' }]
                  })(
                    <Radio.Group onChange={this.handleInstallTypeChange} buttonStyle="solid">
                      <Radio.Button value="new">创建新应用</Radio.Button>
                      <Radio.Button value="existing">安装到已有应用</Radio.Button>
                    </Radio.Group>
                  )}
                </Form.Item>

                {installType === 'new' && (
                  <Form.Item {...formItemLayout} label="应用名称">
                    {getFieldDecorator('group_name', {
                      initialValue: detail.name || '',
                      rules: [
                        { required: true, message: '请输入应用名称' },
                        { max: 24, message: '最多24个字符' }
                      ]
                    })(<Input placeholder="请输入应用名称" />)}
                  </Form.Item>
                )}

                {installType === 'existing' && (
                  <Form.Item {...formItemLayout} label="选择应用">
                    {getFieldDecorator('group_id', {
                      initialValue: '',
                      rules: [{ required: true, message: '请选择应用' }]
                    })(
                      <Select
                        placeholder={groupsLoading ? '加载中...' : '请选择应用'}
                        style={{ width: '100%' }}
                        loading={groupsLoading}
                        disabled={!selectedTeam}
                        getPopupContainer={triggerNode => triggerNode.parentNode}
                        onChange={this.handleGroupChange}
                      >
                        {(groups || []).map(group => (
                          <Option key={group.group_id} value={group.group_id}>
                            {group.group_name}
                          </Option>
                        ))}
                      </Select>
                    )}
                    <div className={styles.installHint}>
                      将组件安装到已有应用中
                    </div>
                  </Form.Item>
                )}
              </Form>
            </div>
          )}
        </Modal>
      </div>
    );
  }
}

export default ExploreDetail;
