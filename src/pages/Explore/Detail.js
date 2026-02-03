import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Button, Spin, Icon, Tabs } from 'antd';
import { Link, routerRedux } from 'dva/router';
import ReactMarkdown from 'react-markdown';
import globalUtil from '../../utils/global';
import styles from './Detail.less';

const { TabPane } = Tabs;

@connect(({ user }) => ({
  currentUser: user.currentUser
}))
class ExploreDetail extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      detail: null,
      currentPreviewIndex: 0
    };
  }

  componentDidMount() {
    const {
      match: {
        params: { id }
      }
    } = this.props;
    console.log('appId:', id);
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
    const { dispatch, match: { params: { eid } } } = this.props;
    dispatch(routerRedux.push(`/explore/${eid}/index`));
  };

  render() {
    const {
      match: {
        params: { eid }
      }
    } = this.props;
    const { loading, detail, currentPreviewIndex } = this.state;

    const version = this.getVersion();
    const categoryTag = this.getCategoryTag();
    const previewImages = this.getPreviewImages();

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
                  <Button type="primary" className={styles.installBtn}>
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
      </div>
    );
  }
}

export default ExploreDetail;
