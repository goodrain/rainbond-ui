import React, { Component } from 'react'
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { Card, Spin, Button, Table, Input, Select, Pagination, Tooltip, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import ImageNameForm from '../../pages/Create/image-name';
import { formatMessage } from '@/utils/intl';
import globalUtil from '@/utils/global';
import styles from './index.less';

@connect(({ loading, user }) => ({
  currentUser: user.currentUser,
  loading: loading.effects['user/fetchCurrent'],
}))
export default class ImgRepository extends Component {
  constructor(props) {
    super(props)
    this.state = {
      imageList: [],
      namespaces: [],
      currentNamespace: '',
      loading: false,
      secretId: '',
      selectedImage: null,
      tagList: [],
      showDetail: false,
      imagePagination: {
        current: 1,
        pageSize: 20,
        total: 0,
      },
      tagPagination: {
        current: 1,
        pageSize: 20,
        total: 0,
      },
      imageSearchKey: '',
      tagSearchKey: '',
      showInstall: false,
      imageUrl: '',
      tag: '',
      imgRepostoryList: [],
      imageLoadingMore: false,
      tagLoadingMore: false,
      imageHasMore: true,
      tagHasMore: true,
    }
    this.imageListRef = React.createRef();
    this.tagListRef = React.createRef();
  }

  componentDidMount() {
    this.getSecretId();
    this.fetchImageHubList();
  }

  fetchImageHubList = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/fetchPlatformImageHub',
      callback: data => {
        if (data && data.list) {
          this.setState({
            imgRepostoryList: data.list
          });
        }
      }
    });
  }

  getSecretId = () => {
    const { imgSecretId } = this.props
    const { location } = window;
    const hash = location.hash;
    const match = hash.match(/image\/([^?]+)/);
    if (match && match[1]) {
      const secretId = match[1];
      this.setState({ secretId });
      this.fetchNamespaces(secretId);
    } else if (imgSecretId) {
      this.setState({ secretId: imgSecretId });
      this.fetchNamespaces(imgSecretId);
    }
  }

  // 获取命名空间列表
  fetchNamespaces = (secretId) => {
    this.setState({ loading: true });
    const { dispatch } = this.props;
    dispatch({
      type: 'user/getImageList',
      payload: {
        secret_id: secretId
      },
      callback: res => {
        if (res && res.list) {
          this.setState({
            namespaces: res.list,
            currentNamespace: res.list[0],
          }, () => {
            if (this.state.currentNamespace) {
              this.fetchImages(secretId, this.state.currentNamespace);
            }
          });
        }
        this.setState({ loading: false });
      },
      handleError: err => {
        console.error('获取命名空间失败:', err);
        this.setState({ loading: false });
      }
    });
  }

  // 获取镜像列表
  fetchImages = (secretId, namespace, append = false) => {
    const { imagePagination, imageSearchKey, imageList } = this.state;
    this.setState({ tableLoading: !append, imageLoadingMore: append });
    const { dispatch } = this.props;
    dispatch({
      type: 'user/getImageList',
      payload: {
        secret_id: secretId,
        namespace: namespace,
        page: imagePagination.current,
        page_size: imagePagination.pageSize,
        search_key: imageSearchKey,
      },
      callback: res => {
        if (res) {
          const newList = append ? [...imageList, ...res.list] : res.list;
          const hasMore = newList.length < res.total;
          this.setState({
            imageList: newList,
            imagePagination: {
              ...imagePagination,
              total: res.total,
            },
            imageHasMore: hasMore,
          });
        }
        this.setState({ tableLoading: false, imageLoadingMore: false });
      },
      handleError: err => {
        console.error('获取命名空间失败:', err);
        this.setState({ tableLoading: false, imageLoadingMore: false });
      }
    });
  }

  // 获取镜像的 tag 列表
  fetchImageTags = (imageName) => {
    this.setState({ loading: true });
    const { secretId, currentNamespace, tagPagination, tagSearchKey } = this.state;
    const { dispatch } = this.props;
    dispatch({
      type: 'user/getImageList',
      payload: {
        secret_id: secretId,
        namespace: currentNamespace,
        name: imageName,
        page: tagPagination.current,
        page_size: tagPagination.pageSize,
        search_key: tagSearchKey,
      },
      callback: res => {
        if (res && res.list) {
          this.setState({
            loading: false,
            tagList: res.list,
            tagPagination: {
              ...tagPagination,
              total: res.total,
            }
          });
        }
      },
      handleError: err => {
        console.error('获取���像标签列表失败:', err);
        this.setState({ loading: false });
      }
    });
  }

  // 处理镜像点击事件
  handleImageClick = (image) => {
    this.setState({
      selectedImage: image,
      showDetail: true
    });
    this.fetchImageTags(image.name);
  }

  // 返回列表
  handleBack = () => {
    this.setState({
      selectedImage: null,
      showDetail: false,
      showInstall: false,
      tagList: [],
      tagPagination: {
        current: 1,
        pageSize: 20,
        total: 0,
      },
      tagSearchKey: '',
      tagHasMore: true,
    }, () => {
      this.fetchImages(this.state.secretId, this.state.currentNamespace);
    });
  }

  // 修改处理镜像列表分页变化的方法
  handleImageListChange = (page, pageSize) => {
    this.setState({
      imagePagination: {
        ...this.state.imagePagination,
        current: page,
        pageSize: pageSize,
      }
    }, () => {
      this.fetchImages(this.state.secretId, this.state.currentNamespace);
    });
  }

  // 修改处理标签列表分页变化的方法
  handleTagListChange = (page, pageSize) => {
    this.setState({
      tagPagination: {
        ...this.state.tagPagination,
        current: page,
        pageSize: pageSize,
      }
    }, () => {
      this.fetchImageTags(this.state.selectedImage.name);
    });
  }

  // ��理镜像搜索
  handleImageSearch = (value) => {
    this.setState({
      imageSearchKey: value,
      imagePagination: {
        ...this.state.imagePagination,
        current: 1, // 重置页码
      }
    }, () => {
      this.fetchImages(this.state.secretId, this.state.currentNamespace);
    });
  }

  // 处理标签搜索
  handleTagSearch = (value) => {
    this.setState({
      tagSearchKey: value,
      tagPagination: {
        ...this.state.tagPagination,
        current: 1, // 重置页码
      }
    }, () => {
      this.fetchImageTags(this.state.selectedImage.name);
    });
  }

  // 处理命名空间选择
  handleNamespaceChange = (namespace) => {
    this.setState({
      currentNamespace: namespace,
      imageList: [],
      imagePagination: {
        ...this.state.imagePagination,
        current: 1,
      },
      imageHasMore: true,
    }, () => {
      this.fetchImages(this.state.secretId, namespace);
    });
  }

  // 处理镜像列表滚动加载
  handleImageScroll = (e) => {
    const { imageLoadingMore, imageHasMore, imagePagination } = this.state;
    const { scrollTop, scrollHeight, clientHeight } = e.target;

    // 当滚动到距离底部50px时触发加载
    if (scrollHeight - scrollTop - clientHeight < 50 && !imageLoadingMore && imageHasMore) {
      this.setState({
        imagePagination: {
          ...imagePagination,
          current: imagePagination.current + 1
        }
      }, () => {
        this.fetchImages(this.state.secretId, this.state.currentNamespace, true);
      });
    }
  }

  // 添加安装处理方法
  handleInstall = (record) => {
    const { currentNamespace, selectedImage, secretId } = this.state;
    const { dispatch } = this.props;
    dispatch({
      type: 'user/getImageList',
      payload: {
        secret_id: this.state.secretId,
        namespace: currentNamespace,
        name: selectedImage.name,
        tag: record.name,
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            imageUrl: res?.bean?.image,
            tag: record.name,
            showInstall: true,
          })
        }
      },
      handleError: err => {
        console.error('获取镜像标签列表失败:', err);
      }
    });
  }

  // 暴露给父组件的方法,用于触发表单提交
  getFormRef = () => {
    return this.imageFormRef;
  }

  render() {
    const {
      imageList,
      loading,
      namespaces,
      currentNamespace,
      selectedImage,
      showDetail,
      tagList,
      imagePagination,
      tagPagination,
      imageSearchKey,
      tagSearchKey,
      tableLoading,
      showInstall,
      imageUrl,
      tag,
      secretId,
      imgRepostoryList,
      imageLoadingMore,
      imageHasMore
    } = this.state;
    const { handleType } = this.props;
    const columns = [
      {
      title: 'Tag',
      dataIndex: 'name',
      key: 'name',
      },
      {
      title: formatMessage({ id: 'versionUpdata_6_1.size' }),
      dataIndex: 'size',
      key: 'size',
      render: (size) => `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`
      },
      ...(handleType !== 'Service' ? [
      {
        title: formatMessage({ id: 'versionUpdata_6_1.os' }),
        key: 'platform',
        render: (_, record) => `${record.os || '-'}/${record.architecture || '-'}`
      },
      {
        title: formatMessage({ id: 'versionUpdata_6_1.updated_at.title' }),
        dataIndex: 'updated_at',
        key: 'updated_at',
        render: (updated_at) => new Date(updated_at).toLocaleString()
      }
      ] : []),
      {
      title: formatMessage({ id: 'versionUpdata_6_1.status' }),
      dataIndex: 'status',
      key: 'status',
      render: (status) => status === 'active' ? '活跃' : status
      },
      {
      title: formatMessage({ id: 'versionUpdata_6_1.action' }),
      key: 'action',
      render: (_, record) => (
        <a
        onClick={() => this.handleInstall(record)}
        >
        {formatMessage({ id: 'versionUpdata_6_1.install' })}
        </a>
      )
      }
    ];
    return (
      <Spin spinning={loading}>
        <Card
          bordered={false}
          padding={0}
          title={
            showDetail ? formatMessage({ id: 'versionUpdata_6_1.imageDetail.name' }, { name: selectedImage.name }) : (
              <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
                <Select
                  style={{ width: 200 }}
                  value={currentNamespace}
                  onChange={this.handleNamespaceChange}
                  placeholder={formatMessage({ id: 'versionUpdata_6_1.namespace' })}
                >
                  {namespaces.map(ns => (
                    <Select.Option key={ns} value={ns}>
                      {ns}
                    </Select.Option>
                  ))}
                </Select>
                <Input.Search
                  placeholder={formatMessage({ id: 'versionUpdata_6_1.imageSearch' })}
                  allowClear
                  enterButton={<SearchOutlined />}
                  onSearch={this.handleImageSearch}
                  style={{ width: 300 }}
                  defaultValue={imageSearchKey}
                />
              </div>
            )
          }
          className={styles.rbd_card}
          extra={
            (showDetail && handleType != 'Service') ? (
              <Button
                onClick={this.handleBack}
              >
                {formatMessage({ id: 'versionUpdata_6_1.back' })}
              </Button>
            ) : null
          }
        >
          {!showDetail ? (
            <div>
              {tableLoading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Spin />
                </div>
              ) : (
                <>
                  {imageList.length > 0 ? (
                    <>
                      <div
                        className={styles.imageList}
                        ref={this.imageListRef}
                        onScroll={this.handleImageScroll}
                        style={{ maxHeight: '600px', overflowY: 'auto' }}
                      >
                        {imageList.map(item => (
                          <div
                            key={item.name}
                            className={styles.imageItem}
                            onClick={() => this.handleImageClick(item)}
                          >
                            <div className={styles.imageCount}>
                              <Tooltip placement="top" title={formatMessage({ id: 'versionUpdata_6_1.imageCount' }, { count: item.pull_count })}>
                                {item.pull_count < 100 ? item.pull_count : '99+'}
                              </Tooltip>
                            </div>
                            <div className={styles.imageIcon} >
                              {globalUtil.fetchSvg('dockerIcon')}
                            </div>
                            <div className={styles.imageContent}>
                              <div className={styles.imageTitle}>{item.name}</div>
                              {handleType != 'Service' && <div className={styles.imageDesc}>{item.description || formatMessage({ id: 'versionUpdata_6_1.noDesc' })}</div>}
                            </div>
                            {handleType != 'Service' && (
                              <span className={styles.imageDate}>
                                {formatMessage({ id: 'versionUpdata_6_1.updated_at.title' })} {new Date(item.created_at).toLocaleDateString()}
                              </span>
                            )}
                            <div className={styles.imageDetail}>
                              <Button type="link" onClick={() => this.handleImageClick(item)}>
                                {formatMessage({ id: 'versionUpdata_6_1.imageDetail' })}
                              </Button>
                            </div>
                          </div>
                        ))}
                        {imageLoadingMore && (
                          <div style={{ textAlign: 'center', padding: '20px' }}>
                            <Spin tip="加载更多..." />
                          </div>
                        )}
                        {!imageHasMore && imageList.length > 0 && (
                          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                            已加载全部镜像
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <Empty />
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            showInstall ? (
              <ImageNameForm
                wrappedComponentRef={(ref) => { this.imageFormRef = ref; }}
                groupId={globalUtil.getAppID()}
                selectedImage={selectedImage}
                imageUrl={imageUrl}
                tag={tag}
                secretId={secretId}
                isPublic={false}
                imgRepostoryList={imgRepostoryList}
                showSubmitBtn={this.props.showSubmitBtn !== false}
                {...this.props}
              />
            ) : (
              <div>
                <div className={styles.rbd_title_container}>
                  <Input.Search
                    placeholder={formatMessage({ id: 'versionUpdata_6_1.tagSearch' })}
                    allowClear
                    enterButton={<SearchOutlined />}
                    onSearch={this.handleTagSearch}
                    style={{ width: 300 }}
                    defaultValue={tagSearchKey}
                  />
                </div>
                <Table
                  columns={columns}
                  dataSource={tagList}
                  rowKey="tag"
                  pagination={{
                    ...tagPagination,
                    showTotal: total => formatMessage({ id: 'versionUpdata_6_1.tagTotal' }, { total }),
                    showSizeChanger: true,
                    showQuickJumper: true,
                    pageSizeOptions: ['10', '20', '50', '100'],
                    hideOnSinglePage: tagPagination.total < 10,
                    onShowSizeChange: this.handleTagListChange,
                    onChange: this.handleTagListChange,
                  }}
                />
              </div>
            )
          )}
        </Card>
      </Spin>
    )
  }
}