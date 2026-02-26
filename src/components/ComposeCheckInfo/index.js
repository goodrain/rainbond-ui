import React, { PureComponent } from 'react';
import { Icon, Collapse, Descriptions, Table, Button, Tag, Modal, Upload, message } from 'antd';
import { formatMessage } from '@/utils/intl';
import globalUtil from '@/utils/global';
import cookie from '@/utils/cookie';

const { Panel } = Collapse;
const { Dragger } = Upload;

export default class ComposeCheckInfo extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      uploadModalVisible: false,
      currentRecord: null,
      currentService: null,
      uploading: false,
      fileList: []
    };
  }

  componentDidMount() {
    // 组件挂载后通知父组件上传状态
    this.notifyUploadStatus();
  }

  componentDidUpdate(prevProps) {
    // 当 props 变化时的处理
    if (prevProps.serviceInfo !== this.props.serviceInfo) {
      // serviceInfo 变化时，重新通知上传状态
      this.notifyUploadStatus();
    }
    if (prevProps.errorInfo !== this.props.errorInfo) {
      // errorInfo 变化时的处理
    }
  }

  componentWillUnmount() {
    // 组件卸载前的清理操作
  }

  // 处理上传操作 - 打开弹窗
  handleUpload = (record, serviceItem) => {
    this.setState({
      uploadModalVisible: true,
      currentRecord: record,
      currentService: serviceItem,
      fileList: []
    });
  };

  // 关闭上传弹窗
  handleUploadModalClose = () => {
    this.setState({
      uploadModalVisible: false,
      currentRecord: null,
      currentService: null,
      fileList: [],
      uploading: false
    });
  };

  // 获取上传地址
  getUploadUrl = (service_alias) => {
    const teamName = globalUtil.getCurrTeamName();
    if (!teamName || !service_alias) {
      return '';
    }
    return `/console/teams/${teamName}/apps/${service_alias}/volumes/upload`;
  };

  // 处理文件上传
  handleUploadChange = (info) => {
    const { status } = info.file;

    if (status === 'uploading') {
      this.setState({ uploading: true, fileList: info.fileList });
    }
    if (status === 'done') {
      this.setState({ uploading: false, fileList: info.fileList });
      message.success(formatMessage({ id: 'composeCheckInfo.upload_success' }));
      this.handleUploadModalClose();
      // 回调刷新数据
      const { onUploadSuccess } = this.props;
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } else if (status === 'error') {
      this.setState({ uploading: false, fileList: info.fileList });
      message.error(formatMessage({ id: 'composeCheckInfo.upload_failed' }));
    }
  };

  // 上传前校验
  beforeUpload = (file) => {
    // 可以添加文件类型、大小等校验
    return true;
  };

  // 渲染上传弹窗
  renderUploadModal = () => {
    const { uploadModalVisible, currentRecord, currentService, uploading, fileList } = this.state;

    if (!currentRecord || !currentService) {
      return null;
    }
    const uploadUrl = this.getUploadUrl(currentService.service_alias);
    return (
      <Modal
        title={formatMessage({ id: 'composeCheckInfo.upload_config_file' })}
        visible={uploadModalVisible}
        onCancel={this.handleUploadModalClose}
        footer={null}
        destroyOnClose
      >
        <div style={{ marginBottom: 16 }}>
          <p>
            <strong>{formatMessage({ id: 'componentOverview.body.tab.env.setting.volume_name' })}:</strong> {currentRecord.volume_name}
          </p>
          <p>
            <strong>{formatMessage({ id: 'componentOverview.body.tab.env.setting.volume_path' })}:</strong> {currentRecord.volume_path}
          </p>
        </div>
        <Dragger
          name='file'
          multiple={false}
          action={uploadUrl}
          method='post'
          data={{
            volume_id: currentRecord.ID
          }}
          fileList={fileList}
          beforeUpload={this.beforeUpload}
          onChange={this.handleUploadChange}
        >
          <p className="ant-upload-drag-icon">
            <Icon type={uploading ? 'loading' : 'inbox'} />
          </p>
          <p className="ant-upload-text">
            {formatMessage({ id: 'composeCheckInfo.upload_hint' })}
          </p>
          <p className="ant-upload-hint">
            {formatMessage({ id: 'composeCheckInfo.upload_hint_desc' })}
          </p>
        </Dragger>
      </Modal >
    );
  };

  // 获取 volumes 表格列配置
  getVolumesColumns = (serviceItem) => {
    return [
      {
        title: formatMessage({ id: 'componentOverview.body.tab.env.setting.volume_name' }),
        dataIndex: 'volume_name',
        key: 'volume_name'
      },
      {
        title: formatMessage({ id: 'componentOverview.body.tab.env.setting.volume_path' }),
        dataIndex: 'volume_path',
        key: 'volume_path'
      },
      {
        title: formatMessage({ id: 'componentOverview.body.tab.env.setting.volume_type' }),
        dataIndex: 'volume_type',
        key: 'volume_type'
      },
      {
        title: formatMessage({ id: 'componentOverview.body.tab.env.setting.volume_status' }),
        dataIndex: 'file_content',
        key: 'upload_status',
        render: (file_content) => {
          const isUploaded = file_content && file_content !== '';
          return isUploaded ? (
            <Tag color="green">
              <Icon type="check-circle" style={{ marginRight: 4 }} />
              {formatMessage({ id: 'composeCheckInfo.status_uploaded' })}
            </Tag>
          ) : (
            <Tag color="orange">
              <Icon type="clock-circle" style={{ marginRight: 4 }} />
              {formatMessage({ id: 'composeCheckInfo.status_pending' })}
            </Tag>
          );
        }
      },
      {
        title: formatMessage({ id: 'componentOverview.body.tab.env.setting.action' }),
        key: 'action',
        render: (text, record) => {
          const isUploaded = record.file_content && record.file_content !== '';
          return (
            <Button
              type={isUploaded ? 'default' : 'primary'}
              size="small"
              icon={isUploaded ? 'reload' : 'upload'}
              onClick={() => this.handleUpload(record, serviceItem)}
            >
              {isUploaded
                ? formatMessage({ id: 'composeCheckInfo.reupload' })
                : formatMessage({ id: 'button.upload' })}
            </Button>
          );
        }
      }
    ];
  };

  // 渲染 service_info 的 Descriptions
  renderServiceDescriptions = (serviceInfoList) => {
    if (!serviceInfoList || !serviceInfoList.length) {
      return null;
    }
    return (
      <div style={{ marginBottom: 24 }}>
        <Descriptions bordered column={1} size="small">
          {serviceInfoList.map((info, idx) => (
            <Descriptions.Item key={idx} label={info.key}>
              {Array.isArray(info.value) ? (
                <div>
                  {info.value.map((val, i) => (
                    <div key={i}>{val}</div>
                  ))}
                </div>
              ) : (
                info.value
              )}
            </Descriptions.Item>
          ))}
        </Descriptions>
      </div>
    );
  };

  // 渲染 volumes 表格
  renderVolumesTable = (volumes, serviceItem) => {
    if (!volumes || !volumes.length) {
      return null;
    }
    return (
      <Table
        dataSource={volumes}
        columns={this.getVolumesColumns(serviceItem)}
        rowKey="ID"
        pagination={false}
      />
    );
  };

  // 获取镜像名称
  getImageName = (serviceInfoList) => {
    if (!serviceInfoList || !serviceInfoList.length) {
      return '';
    }
    const imageInfo = serviceInfoList.find(info => info.type === 'image');
    return imageInfo ? imageInfo.value : '';
  };

  // 计算总的配置文件数量
  getTotalVolumesCount = () => {
    const { serviceInfo = [] } = this.props;
    return serviceInfo.reduce((total, item) => {
      return total + (item.volumes ? item.volumes.length : 0);
    }, 0);
  };

  // 计算已上传数量（file_content 不为空）
  getTotalUploadedCount = () => {
    const { serviceInfo = [] } = this.props;
    return serviceInfo.reduce((total, item) => {
      if (!item.volumes) return total;
      return total + item.volumes.filter(v => v.file_content && v.file_content !== '').length;
    }, 0);
  };

  // 计算总的待上传数量（file_content 为空）
  getTotalPendingCount = () => {
    const { serviceInfo = [] } = this.props;
    return serviceInfo.reduce((total, item) => {
      if (!item.volumes) return total;
      return total + item.volumes.filter(v => !v.file_content || v.file_content === '').length;
    }, 0);
  };

  // 计算单个服务的待上传数量
  getServicePendingCount = (volumes) => {
    if (!volumes || !volumes.length) return 0;
    return volumes.filter(v => !v.file_content || v.file_content === '').length;
  };

  // 计算单个服务的已上传数量
  getServiceUploadedCount = (volumes) => {
    if (!volumes || !volumes.length) return 0;
    return volumes.filter(v => v.file_content && v.file_content !== '').length;
  };

  // 检查是否所有文件都已上传
  isAllUploaded = () => {
    const totalVolumesCount = this.getTotalVolumesCount();
    const totalPendingCount = this.getTotalPendingCount();
    // 如果没有配置文件，则视为全部上传完成
    if (totalVolumesCount === 0) return true;
    return totalPendingCount === 0;
  };

  // 通知父组件上传状态
  notifyUploadStatus = () => {
    const { onUploadStatusChange } = this.props;
    if (onUploadStatusChange) {
      const isAllUploaded = this.isAllUploaded();
      const pendingCount = this.getTotalPendingCount();
      const totalCount = this.getTotalVolumesCount();
      onUploadStatusChange({
        isAllUploaded,
        pendingCount,
        totalCount
      });
    }
  };

  // 渲染顶部统计信息
  renderSummary = () => {
    const { serviceInfo = [] } = this.props;
    const serviceCount = serviceInfo.length;
    const totalVolumesCount = this.getTotalVolumesCount();
    const totalUploadedCount = this.getTotalUploadedCount();
    const totalPendingCount = this.getTotalPendingCount();

    return (
      <div style={{ marginBottom: 16, color: '#666', fontSize: 14 }}>
        <span>{formatMessage({ id: 'composeCheckInfo.detected_services' }, { count: serviceCount })}</span>
        <span style={{ margin: '0 8px' }}>·</span>
        <span>{formatMessage({ id: 'composeCheckInfo.config_files' })} {totalUploadedCount}/{totalVolumesCount} {formatMessage({ id: 'composeCheckInfo.uploaded' })}</span>
        {totalPendingCount > 0 && (
          <Tag color="orange" style={{ marginLeft: 8 }}>
            {totalPendingCount} {formatMessage({ id: 'composeCheckInfo.pending_upload' })}
          </Tag>
        )}
        {totalPendingCount === 0 && totalVolumesCount > 0 && (
          <Tag color="green" style={{ marginLeft: 8 }}>
            <Icon type="check-circle" style={{ marginRight: 4 }} />
            {formatMessage({ id: 'composeCheckInfo.all_uploaded' })}
          </Tag>
        )}
      </div>
    );
  };

  // 渲染 Panel header，包含待上传个数
  renderPanelHeader = (item) => {
    const pendingCount = this.getServicePendingCount(item.volumes);
    const uploadedCount = this.getServiceUploadedCount(item.volumes);
    const totalCount = item.volumes ? item.volumes.length : 0;
    const imageName = this.getImageName(item.service_info);
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <span>
          <span style={{ fontWeight: 'bold' }}>{item.service_cname}</span>
          {imageName && (
            <Tag style={{ marginLeft: 8 }}>{imageName}</Tag>
          )}
        </span>
        <span>
          {pendingCount > 0 && (
            <Tag color="orange">
              <Icon type="file" style={{ marginRight: 4 }} />
              {pendingCount} {formatMessage({ id: 'composeCheckInfo.pending_upload' })}
            </Tag>
          )}
          {pendingCount === 0 && totalCount > 0 && (
            <Tag color="green">
              <Icon type="check-circle" style={{ marginRight: 4 }} />
              {uploadedCount}/{totalCount} {formatMessage({ id: 'composeCheckInfo.uploaded' })}
            </Tag>
          )}
        </span>
      </div>
    );
  };

  // 统计错误类型数量
  getErrorCounts = () => {
    const { errorInfo = [] } = this.props;
    const fatalCount = errorInfo.filter(item => item.error_type === 'FatalError').length;
    const negligibleCount = errorInfo.filter(item => item.error_type === 'NegligibleError').length;
    return { fatalCount, negligibleCount };
  };

  // 渲染错误信息 Panel header
  renderErrorHeader = () => {
    const { fatalCount, negligibleCount } = this.getErrorCounts();
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Icon type="warning" style={{ color: '#faad14', marginRight: 8 }} />
        <span style={{ fontWeight: 'bold' }}>{formatMessage({ id: 'composeCheckInfo.conversion_notes' })}</span>
        {fatalCount > 0 && (
          <Tag color="red" style={{ marginLeft: 8 }}>
            {fatalCount} {formatMessage({ id: 'composeCheckInfo.not_supported' })}
          </Tag>
        )}
        {negligibleCount > 0 && (
          <Tag color="orange" style={{ marginLeft: 8 }}>
            {negligibleCount} {formatMessage({ id: 'composeCheckInfo.need_attention' })}
          </Tag>
        )}
      </div>
    );
  };

  renderErrorInfo = () => {
    const { errorInfo = [] } = this.props;
    if (!errorInfo.length) {
      return null;
    }

    // 分组：FatalError 和 NegligibleError
    const fatalErrors = errorInfo.filter(item => item.error_type === 'FatalError');
    const negligibleErrors = errorInfo.filter(item => item.error_type === 'NegligibleError');

    return (
      <div style={{ marginBottom: 16 }}>
        <Collapse>
          <Panel header={this.renderErrorHeader()} key="error">
            {/* FatalError - 不支持 */}
            {fatalErrors.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 8, fontWeight: 'bold', color: '#ff4d4f' }}>
                  <Icon type="close-circle" style={{ marginRight: 8 }} />
                  {formatMessage({ id: 'composeCheckInfo.not_supported' })} ({fatalErrors.length})
                </div>
                {fatalErrors.map((item, index) => (
                  <div
                    key={`fatal-${index}`}
                    style={{
                      marginBottom: 8,
                      padding: '8px 12px',
                      backgroundColor: '#fff1f0',
                      borderRadius: 4,
                      borderLeft: '3px solid #ff4d4f'
                    }}
                  >
                    <div>{item.error_info}</div>
                    {item.solve_advice && (
                      <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                        {formatMessage({ id: 'composeCheckInfo.solve_advice' })}: {item.solve_advice}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {/* NegligibleError - 需留意 */}
            {negligibleErrors.length > 0 && (
              <div>
                <div style={{ marginBottom: 8, fontWeight: 'bold', color: '#faad14' }}>
                  <Icon type="exclamation-circle" style={{ marginRight: 8 }} />
                  {formatMessage({ id: 'composeCheckInfo.need_attention' })} ({negligibleErrors.length})
                </div>
                {negligibleErrors.map((item, index) => (
                  <div
                    key={`negligible-${index}`}
                    style={{
                      marginBottom: 8,
                      padding: '8px 12px',
                      backgroundColor: '#fffbe6',
                      borderRadius: 4,
                      borderLeft: '3px solid #faad14'
                    }}
                  >
                    <div>{item.error_info}</div>
                    {item.solve_advice && (
                      <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                        {formatMessage({ id: 'composeCheckInfo.solve_advice' })}: {item.solve_advice}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </Collapse>
      </div>
    );
  };

  render() {
    const { loading } = this.state;
    const { serviceInfo = [], errorInfo = [] } = this.props;

    if (loading) {
      return <div>Loading...</div>;
    }

    // 默认展开所有面板
    const defaultActiveKeys = serviceInfo.map((_, index) => String(index));

    return (
      <div>
        {errorInfo.length > 0 && this.renderErrorInfo()}
        {serviceInfo.length > 0 && (
          <>
            {this.renderSummary()}
            <Collapse defaultActiveKey={defaultActiveKeys}>
              {serviceInfo.map((item, index) => (
                <Panel
                  header={this.renderPanelHeader(item)}
                  key={String(index)}
                >
                  {this.renderServiceDescriptions(item.service_info)}
                  {this.renderVolumesTable(item.volumes, item)}
                </Panel>
              ))}
            </Collapse>
          </>
        )}
        {this.renderUploadModal()}
      </div>
    );
  }
}
