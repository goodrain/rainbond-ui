import React, { useImperativeHandle, forwardRef } from 'react';
import { Input, Button, Icon, Spin, Tabs, Form, Select, Radio, Avatar, Row, Col, Tag } from 'antd';
import globalUtil from '@/utils/global';
import app_Icon from '../../../public/images/app_icon.jpg';
import styles from './index.less';

const { Search } = Input;
const { TabPane } = Tabs;
const { Option } = Select;

const formItemLayout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

const AppMarketContent = forwardRef(({
  // 视图状态
  currentView,

  // 列表相关
  apps,
  loading,
  loadingMore,
  searchValue,
  onSearchChange,
  onSearch,
  activeTab,
  onTabChange,
  tabs,
  listRef,
  onInstall,
  total,

  // 表单相关
  selectedApp,
  form,
  groups,
  onChangeVersion,
  installType,
  onInstallTypeChange,
  onSubmit,
  submitLoading,

  // 其他配置
  showResourceInfo = true,
  showSubmitBtn = true,
  appIcon,
  currentVersionInfo
}, ref) => {
  const { getFieldDecorator, validateFields } = form || {};
  const versionsInfo = selectedApp?.versions_info || [];
  const appVersions = selectedApp?.versions || [];

  // 用于显示资源信息的版本信息,如果有 currentVersionInfo 则使用它,否则使用默认的第一个版本
  const displayVersionInfo = currentVersionInfo || (versionsInfo.length > 0 ? versionsInfo[0] : appVersions.length > 0 ? appVersions[0] : {});

  // 处理安装提交
  const handleSubmit = () => {
    if (validateFields) {
      validateFields((err, values) => {
        if (!err && onSubmit) {
          onSubmit(values);
        }
      });
    }
  };

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    handleSubmit
  }));

  if (currentView === 'list') {
    return (
      <div className={styles.marketListContainer}>
        <div className={styles.searchWrapper}>
          <Search
            placeholder="搜索应用..."
            value={searchValue}
            onChange={onSearchChange}
            onSearch={onSearch}
            className={styles.searchInput}
          />
          <span className={styles.totalInfo}>共 {total || 0} 个应用</span>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <Spin size="large" />
          </div>
        ) : (
          <div className={styles.appListWrapper} ref={listRef}>
            <div className={styles.appList}>
              {apps.length > 0 ? (
                <>
                  {apps.map((app) => (
                    <div key={app.app_id} className={styles.appCard}>
                      <div className={styles.appIcon}>
                        <Avatar
                          src={app.pic || app.logo || appIcon || app_Icon}
                          shape="square"
                          size={48}
                        />
                      </div>
                      <div className={styles.appInfo}>
                        <div className={styles.appHeader}>
                          <span className={styles.appName}>{app.app_name || app.name}</span>
                          {app.arch && app.arch.length > 0 && (
                            <span className={styles.archTag}>{app.arch[0]}</span>
                          )}
                          {app.versions_info && app.versions_info[0] && (
                            <span className={styles.versionTag}>
                              {app.versions_info[0].version}
                            </span>
                          )}
                        </div>
                        <div className={styles.appDescription}>{app.describe || app.description}</div>
                      </div>
                      <div className={styles.appActions}>
                        <Button onClick={() => onInstall(app)}>
                          安装
                        </Button>
                      </div>
                    </div>
                  ))}
                  {loadingMore && (
                    <div className={styles.loadingMoreState}>
                      <Spin size="small" />
                      <span>加载中...</span>
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.emptyState}>
                  <Icon type="inbox" style={{ fontSize: 48, color: '#d9d9d9' }} />
                  <div className={styles.emptyText}>暂无应用</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 安装表单视图
  // 检查是否已经在应用中
  const hasExistingAppId = globalUtil.getAppID();

  return (
    <div className={styles.installFormWrapper}>
      {selectedApp?.describe && (
        <p className={styles.appDescriptionBanner}>
          {selectedApp.describe}
        </p>
      )}
      <Form layout="vertical" hideRequiredMark>
        <Form.Item {...formItemLayout} label="选择版本">
          <Row>
            <Col span={24}>
              {getFieldDecorator && getFieldDecorator('group_version', {
                initialValue: versionsInfo.length > 0
                  ? versionsInfo[0].version
                  : appVersions.length > 0
                  ? appVersions[0].app_version
                  : '',
                rules: [
                  {
                    required: true,
                    message: '请选择版本'
                  }
                ]
              })(
                <Select
                  getPopupContainer={triggerNode => triggerNode.parentNode}
                  onChange={onChangeVersion}
                  style={{ width: '100%' }}
                >
                  {versionsInfo.length > 0
                    ? versionsInfo.map((item, index) => {
                      return (
                        <Option key={index} value={item.version}>
                          {item.version}
                          {item.arch &&
                            <Tag
                              color="blue"
                              style={{ marginLeft: '8px', lineHeight: '18px' }}
                            >
                              {item.arch}
                            </Tag>}
                        </Option>
                      );
                    })
                    : appVersions.map((item, index) => {
                      return (
                        <Option key={index} value={item.app_version}>
                          {item.app_version}
                          {item.arch &&
                            <Tag
                              color="blue"
                              style={{ marginLeft: '8px', lineHeight: '18px' }}
                            >
                              {item.arch}
                            </Tag>}
                        </Option>
                      );
                    })}
                </Select>
              )}
            </Col>
          </Row>
          {showResourceInfo && selectedApp && (
            <div className={styles.resourceInfo}>
              {`资源占用: CPU ${displayVersionInfo?.cpu || 0}m / 内存 ${displayVersionInfo?.memory || 0}MB`}
            </div>
          )}
        </Form.Item>

        {!hasExistingAppId && (
          <Form.Item {...formItemLayout} label="安装类型">
            {getFieldDecorator && getFieldDecorator('install_type', {
              initialValue: 'new',
              rules: [
                {
                  required: true,
                  message: '请选择安装类型'
                }
              ]
            })(
              <Radio.Group onChange={onInstallTypeChange} buttonStyle="solid">
                <Radio.Button value="new">创建新应用</Radio.Button>
                <Radio.Button value="existing">安装到已有应用</Radio.Button>
              </Radio.Group>
            )}
          </Form.Item>
        )}

        {!hasExistingAppId && installType === 'new' && (
          <Form.Item {...formItemLayout} label="应用名称">
            {getFieldDecorator && getFieldDecorator('group_name', {
              initialValue: selectedApp?.app_name || selectedApp?.name || '',
              rules: [
                { required: true, message: '请输入应用名称' },
                {
                  max: 24,
                  message: '最多24个字符'
                }
              ]
            })(<Input placeholder="请输入应用名称" />)}
          </Form.Item>
        )}

        {!hasExistingAppId && installType === 'existing' && (
          <Form.Item {...formItemLayout} label="选择应用">
            {getFieldDecorator && getFieldDecorator('group_id', {
              initialValue: '',
              rules: [
                {
                  required: true,
                  message: '请选择应用'
                }
              ]
            })(
              <Select
                placeholder="请选择应用"
                style={{ width: '100%' }}
                getPopupContainer={triggerNode => triggerNode.parentNode}
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

        {showSubmitBtn && (
          <Form.Item>
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <Button
                type="primary"
                size="large"
                onClick={handleSubmit}
                loading={submitLoading}
              >
                确认安装
              </Button>
            </div>
          </Form.Item>
        )}
      </Form>
    </div>
  );
});

export default AppMarketContent;
