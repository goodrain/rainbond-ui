import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import {
  Avatar,
  Button,
  Card,
  Collapse,
  Empty,
  Form,
  Icon,
  Input,
  List,
  Modal,
  Popconfirm,
  Select,
  Spin,
  Table,
  Tag,
  Upload,
} from 'antd';
import Result from '@/components/Result';
import { getSortedHelmValuesFileKeys } from '../helmValues';
import HelmIcon from './HelmIcon';
import StatusDot from './StatusDot';
import { getLatestRevision } from '../helpers';
import styles from '../index.less';
import { formatToBeijingTime } from '../utils';

const { TextArea } = Input;
const { Option } = Select;
const t = (id, defaultMessage, values) => formatMessage({ id, defaultMessage }, values);

class HelmModals extends PureComponent {
  getStateValue(key, fallback) {
    const modalState = this.props.modalState || {};
    return modalState[key] !== undefined ? modalState[key] : fallback;
  }

  getFormState(sourceType) {
    const { getFormState } = this.props;
    return getFormState ? getFormState(sourceType) : {};
  }

  renderHelmUpgradeAssistant() {
    const helmModalMode = this.getStateValue('helmModalMode', 'install');
    const helmTargetRelease = this.getStateValue('helmTargetRelease', null);
    if (helmModalMode !== 'upgrade') {
      return null;
    }
    return (
      <div className={styles.modalBanner} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div className={styles.modalBannerTitle}>
              {t('resourceCenter.helm.modal.upgradeRelease', '升级 Release：')}{(helmTargetRelease && helmTargetRelease.name) || '-'}
            </div>
            <div className={styles.modalBannerMeta}>
              {t('resourceCenter.helm.modal.currentChart', '当前 Chart：')}{(helmTargetRelease && helmTargetRelease.chart) || '-'}
              <span style={{ marginLeft: 8 }}>
                {t('resourceCenter.helm.modal.currentVersion', '当前版本：')}{(helmTargetRelease && helmTargetRelease.chart_version) || '-'}
              </span>
            </div>
          </div>
        </div>
        <div className={styles.modalBannerText}>
          {t('resourceCenter.helm.modal.upgradeGuide', '请从 Helm 商店、第三方仓库 / OCI 或上传 Chart 包中手动选择目标应用与版本进行升级。')}
        </div>
      </div>
    );
  }

  renderHelmBrowse() {
    const helmRepos = this.getStateValue('helmRepos', []);
    const helmRepoLoading = this.getStateValue('helmRepoLoading', false);
    const helmCurrentRepo = this.getStateValue('helmCurrentRepo', '');
    const helmCharts = this.getStateValue('helmCharts', []);
    const helmChartLoading = this.getStateValue('helmChartLoading', false);
    const helmChartSearch = this.getStateValue('helmChartSearch', '');
    const helmChartPage = this.getStateValue('helmChartPage', 1);
    const helmChartPageSize = this.getStateValue('helmChartPageSize', 8);
    const helmChartTotal = this.getStateValue('helmChartTotal', 0);
    const helmSelectedChart = this.getStateValue('helmSelectedChart', null);
    const helmPreviewStatus = this.getStateValue('helmPreviewStatus', 'idle');
    const helmPreviewLoading = this.getStateValue('helmPreviewLoading', false);
    const helmPreviewData = this.getStateValue('helmPreviewData', null);
    const getHelmChartIcon = this.props.getHelmChartIcon;

    if (helmRepoLoading) {
      return (
        <div className={styles.modalLoadingBlock}>
          <Spin tip={t('resourceCenter.helm.modal.loadingRepos', '加载仓库列表...')} />
        </div>
      );
    }

    if (!helmRepos.length) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<span className={styles.modalEmptyText}>{t('resourceCenter.helm.modal.noRepos', '暂无 Helm 仓库，请先在应用市场中添加 Helm 仓库')}</span>}
          className={styles.modalLoadingBlock}
        />
      );
    }

    return (
      <div style={{ display: 'flex', minHeight: 400 }}>
        <div className={styles.modalRepoSidebar} style={{ width: 160, flexShrink: 0, paddingRight: 0 }}>
          <div className={styles.modalSidebarTitle}>{t('resourceCenter.helm.modal.repoTitle', '仓库列表')}</div>
          {helmRepos.map(repo => {
            const name = repo.name || repo.repo_name || repo;
            const active = helmCurrentRepo === name;
            return (
              <div
                key={name}
                onClick={() => this.props.onRepoSelect(name)}
                className={`${styles.modalRepoItem} ${active ? styles.modalRepoItemActive : ''}`}
              >
                <Icon type="database" className={`${styles.modalMutedText} ${styles.modalRepoItemIcon}`} />
                <span className={styles.modalRepoItemText}>{name}</span>
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1, paddingLeft: 16, overflow: 'hidden' }}>
          <div
            style={{
              marginBottom: 12,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <Input.Search
              placeholder={t('resourceCenter.helm.modal.searchChart', '搜索 Chart 名称...')}
              value={helmChartSearch}
              onChange={e => this.props.onChartSearch(e.target.value)}
              onSearch={this.props.onChartSearch}
              allowClear
              size="small"
              style={{ width: 240 }}
            />
            {helmSelectedChart && (
              <div className={styles.modalSelectedPill} style={{ maxWidth: 'calc(100% - 252px)' }}>
                <span className={styles.modalSelectedName}>
                  {t('resourceCenter.helm.modal.selectedChart', '已选 {name}', { name: helmSelectedChart.name })}
                </span>
              </div>
            )}
          </div>

          {helmChartLoading ? (
            <div className={styles.modalLoadingBlock}>
              <Spin tip={t('resourceCenter.helm.modal.loadingCharts', '加载 Chart 列表...')} />
            </div>
          ) : helmCharts.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('resourceCenter.helm.modal.noCharts', '暂无 Chart')} className={styles.modalLoadingBlock} />
          ) : (
            <>
              <List
                grid={{ gutter: 12, column: 2 }}
                dataSource={helmCharts}
                renderItem={chart => {
                  const versions = chart.versions || [];
                  const latestVersion = (versions[0] && versions[0].version) || chart.version || '';
                  const selected = helmSelectedChart && helmSelectedChart.name === chart.name;
                  const chartStatusText = helmPreviewStatus === 'error'
                    ? t('resourceCenter.helm.modal.detectFailed', '检测失败')
                    : helmPreviewLoading
                      ? t('resourceCenter.helm.modal.detecting', '检测中...')
                      : helmPreviewData
                        ? t('resourceCenter.helm.modal.readyNext', '可下一步')
                        : t('resourceCenter.helm.modal.selected', '已选择');
                  const chartStatusClassName = helmPreviewStatus === 'error'
                    ? styles.modalChartStatusError
                    : helmPreviewLoading
                      ? styles.modalChartStatusLoading
                      : helmPreviewData
                        ? styles.modalChartStatusReady
                        : styles.modalChartStatusDefault;
                  return (
                    <List.Item style={{ marginBottom: 8 }}>
                      <Card
                        size="small"
                        hoverable
                        onClick={() => this.props.onChartSelect(chart)}
                        bodyStyle={{ padding: '12px 14px' }}
                        className={`${styles.modalCard} ${styles.modalChartCard} ${selected ? styles.modalCardActive : ''}`}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className={styles.modalChartCardHeader}>
                          <div className={styles.modalChartCardMeta}>
                            <Avatar
                              shape="square"
                              size={20}
                              src={getHelmChartIcon(chart)}
                              icon="appstore"
                              className={styles.modalCardIcon}
                            />
                            <span className={styles.modalCardTitle} title={chart.name}>
                              {chart.name}
                            </span>
                          </div>
                          {selected && (
                            <span className={`${styles.modalChartStatus} ${chartStatusClassName}`}>
                              {chartStatusText}
                            </span>
                          )}
                        </div>
                        {chart.description && (
                          <div className={styles.modalCardDesc} title={chart.description} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>
                            {chart.description}
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          {latestVersion && (
                            <Tag className={`${styles.smallTag} ${styles.tagPrimary} ${styles.modalTagPrimary}`}>{latestVersion}</Tag>
                          )}
                          {versions.length > 1 && (
                            <span className={styles.modalMutedText}>{t('resourceCenter.helm.modal.versionCount', '共 {count} 个版本', { count: versions.length })}</span>
                          )}
                        </div>
                      </Card>
                    </List.Item>
                  );
                }}
              />
              {helmChartTotal > helmChartPageSize && (
                <div style={{ textAlign: 'right', marginTop: 8 }}>
                  <span className={styles.modalMutedText} style={{ marginRight: 8 }}>{t('resourceCenter.helm.modal.chartCount', '共 {count} 个 Chart', { count: helmChartTotal })}</span>
                  {Array.from({ length: Math.ceil(helmChartTotal / helmChartPageSize) }, (_, index) => index + 1).map(page => (
                    <Button
                      key={page}
                      size="small"
                      type={page === helmChartPage ? 'primary' : 'default'}
                      style={{ margin: '0 2px', minWidth: 28 }}
                      onClick={() => this.props.onChartPageChange(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  renderHelmPreviewHeader() {
    const helmSourceType = this.getStateValue('helmSourceType', 'store');
    const helmSelectedChart = this.getStateValue('helmSelectedChart', null);
    const helmPreviewData = this.getStateValue('helmPreviewData', null);
    const helmCurrentRepo = this.getStateValue('helmCurrentRepo', '');
    const helmUploadEventId = this.getStateValue('helmUploadEventId', '');
    const helmForm = this.getStateValue('helmForm', {});
    const helmUploadForm = this.getStateValue('helmUploadForm', {});
    const getHelmChartIcon = this.props.getHelmChartIcon;
    const buildHelmExternalChartUrl = this.props.buildHelmExternalChartUrl;

    const preview = helmPreviewData || {};
    const chartName = preview.name || (helmSelectedChart && helmSelectedChart.name) || t('resourceCenter.helm.modal.chartLabel', 'Helm Chart');
    const chartDesc = preview.description || (helmSelectedChart && helmSelectedChart.description) || '';
    const chartVersion = preview.version
      || (helmSourceType === 'store' && helmForm.version)
      || (helmSourceType === 'upload' && helmUploadForm.version)
      || (helmSelectedChart && helmSelectedChart.versions && helmSelectedChart.versions[0] && helmSelectedChart.versions[0].version)
      || '-';
    const chartIcon = getHelmChartIcon(helmSelectedChart) || preview.icon;
    const keywords = preview.keywords || [];

    if (!preview.name && !helmSelectedChart) {
      return null;
    }

    const sourceLabel = helmSourceType === 'store'
      ? t('resourceCenter.helm.modal.repoSource', '仓库：{value}', { value: helmCurrentRepo || '-' })
      : helmSourceType === 'external'
        ? t('resourceCenter.helm.modal.sourceUrl', '来源：{value}', { value: buildHelmExternalChartUrl() || '-' })
        : t('resourceCenter.helm.modal.uploadSession', '上传会话：{value}', { value: helmUploadEventId || '-' });

    return (
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <Avatar
            shape="square"
            size={48}
            src={chartIcon}
            icon="appstore"
            className={styles.modalCardIcon}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={styles.modalSectionTitle} style={{ marginBottom: 4 }}>{chartName}</div>
            {chartDesc && (
              <div className={styles.modalSoftText} style={{ marginBottom: 8 }}>
                {chartDesc}
              </div>
            )}
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }} className={styles.modalMutedText}>
              <span>{sourceLabel}</span>
              <span>{t('resourceCenter.helm.modal.versionLabel', '版本号 {value}', { value: chartVersion })}</span>
              {keywords.length > 0 && (
                <span>
                  {t('resourceCenter.helm.modal.keywords', '关键字')}
                  <span style={{ marginLeft: 8 }}>
                    {keywords.slice(0, 3).map(item => (
                      <Tag key={item} className={styles.tagInfo} style={{ marginRight: 6 }}>{item}</Tag>
                    ))}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  renderHelmDetectState() {
    const helmPreviewStatus = this.getStateValue('helmPreviewStatus', 'idle');
    const helmPreviewError = this.getStateValue('helmPreviewError', '');

    if (helmPreviewStatus === 'checking') {
      return (
        <Card>
          <Result type="ing" title={t('resourceCenter.helm.modal.checkingTitle', '应用包检验中')} description={t('resourceCenter.helm.modal.checkingDesc', '应用包检验中，请耐心等候...')} style={{ marginTop: 36, marginBottom: 12 }} />
        </Card>
      );
    }
    if (helmPreviewStatus === 'success') {
      return (
        <Card>
          <Result
            type="success"
            title={t('resourceCenter.helm.modal.checkSuccessTitle', '应用包检验成功')}
            description={t('resourceCenter.helm.modal.checkSuccessDesc', '应用包检验成功，可点击下一步继续填写安装参数。')}
            style={{ marginTop: 36, marginBottom: 12 }}
          />
        </Card>
      );
    }
    if (helmPreviewStatus === 'error') {
      return (
        <Card>
          <Result
            type="error"
            title={t('resourceCenter.helm.modal.checkFailedTitle', '应用包检验失败')}
            description={helmPreviewError || t('resourceCenter.helm.modal.checkFailedDesc', 'Chart 检测失败，请检查地址、权限或 Chart 内容。')}
            style={{ marginTop: 36, marginBottom: 12 }}
          />
        </Card>
      );
    }
    return null;
  }

  renderHelmBasicForm() {
    const helmSourceType = this.getStateValue('helmSourceType', 'store');
    const helmSelectedChart = this.getStateValue('helmSelectedChart', null);
    const helmPreviewData = this.getStateValue('helmPreviewData', null);
    const helmModalMode = this.getStateValue('helmModalMode', 'install');
    const currentForm = this.getFormState(helmSourceType);
    const versions = (helmSelectedChart && helmSelectedChart.versions) || [];

    return (
      <div>
        {this.renderHelmPreviewHeader()}
        <div
          className={styles.modalSectionNotice}
          style={{ marginBottom: 16 }}
        >
          {t('resourceCenter.helm.modal.basicNotice', '当前步骤只保留必要的基础安装信息，Values 配置会放到下一步集中处理。')}
        </div>
        <Form layout="vertical">
          {helmSourceType === 'store' && (
            <Form.Item label={t('resourceCenter.common.version', '版本')} required style={{ marginBottom: 16 }}>
              {versions.length > 0 ? (
                <Select value={currentForm.version} onChange={this.props.onStoreVersionChange} style={{ width: '100%' }}>
                  {versions.map(version => (
                    <Option key={version.version} value={version.version}>{version.version}</Option>
                  ))}
                </Select>
              ) : (
                <Input
                  value={currentForm.version}
                  onChange={e => this.props.updateFormState('store', { version: e.target.value })}
                  placeholder={t('resourceCenter.helm.modal.versionPlaceholder', '如：1.2.3')}
                />
              )}
            </Form.Item>
          )}
          {helmSourceType === 'upload' && (
            <Form.Item label={t('resourceCenter.common.version', '版本')} style={{ marginBottom: 16 }}>
              <Input
                value={currentForm.version || (helmPreviewData && helmPreviewData.version) || ''}
                onChange={e => this.props.updateFormState('upload', { version: e.target.value })}
                placeholder={t('resourceCenter.helm.modal.defaultVersionHint', '默认使用解析出的版本')}
              />
            </Form.Item>
          )}
          <Form.Item label={t('resourceCenter.common.releaseName', 'Release 名称')} required style={{ marginBottom: 16 }}>
            <Input
              value={currentForm.release_name}
              onChange={e => this.props.updateFormState(helmSourceType, { release_name: e.target.value })}
              disabled={helmModalMode === 'upgrade'}
              placeholder={
                helmSourceType === 'external'
                  ? t('resourceCenter.helm.modal.releasePlaceholderExternal', '如：thirdparty-nginx')
                  : t('resourceCenter.helm.modal.releasePlaceholder', '如：my-nginx（小写字母、数字、连字符）')
              }
            />
          </Form.Item>
        </Form>
        {!helmPreviewData && (this.renderHelmDetectState() || <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('resourceCenter.helm.modal.finishPrevStep', '请先在上一步完成 Chart 检测')} />)}
      </div>
    );
  }

  renderHelmConfigPanel(sourceType) {
    const helmPreviewData = this.getStateValue('helmPreviewData', null);
    const helmPreviewFileKey = this.getStateValue('helmPreviewFileKey', '');
    const decodeBase64Text = this.props.decodeBase64Text;
    const currentForm = this.getFormState(sourceType);
    const previewValues = (helmPreviewData && helmPreviewData.values) || {};
    const valueFiles = getSortedHelmValuesFileKeys(previewValues);
    const readme = helmPreviewData && decodeBase64Text(helmPreviewData.readme);
    const emptyValuesHint = !!helmPreviewData && valueFiles.length === 0 && !currentForm.values;

    return (
      <div>
        <Collapse bordered={false} defaultActiveKey={['config']}>
          <Collapse.Panel
            key="config"
              header={(
                <div>
                  <div className={styles.modalSectionTitle}>{t('resourceCenter.helm.modal.configOptions', '配置选项')}</div>
                  <div className={styles.modalMutedText} style={{ marginTop: 2 }}>{t('resourceCenter.helm.modal.configOptionsDesc', '基于 Helm 规范应用配置的查看与设置')}</div>
                </div>
              )}
            >
              <div style={{ padding: '8px 12px 0' }}>
              {valueFiles.length > 0 && (
                <Form.Item label={t('resourceCenter.common.valuesFile', 'Values 文件')} style={{ marginBottom: 16 }}>
                  <Select value={helmPreviewFileKey} onChange={this.props.onPreviewFileChange}>
                    {valueFiles.map(fileKey => (
                      <Option key={fileKey} value={fileKey}>{fileKey}</Option>
                    ))}
                  </Select>
                </Form.Item>
              )}
              {emptyValuesHint && (
                <div
                  className={styles.modalWarningNotice}
                  style={{ marginBottom: 16 }}
                >
                  {t('resourceCenter.helm.modal.noValuesFile', '当前 Chart 没有返回可展示的 values.yaml，你可以直接在下面手动填写 YAML。')}
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                  gap: 12,
                }}
              >
                <div className={styles.modalSectionLabel}>values.yaml</div>
                <Button size="small" onClick={() => this.props.onOpenValuesEditor(sourceType)}>
                  <Icon type="arrows-alt" />{t('resourceCenter.helm.modal.expandEditor', '放大编辑')}
                </Button>
              </div>
              <Form.Item style={{ marginBottom: 16 }}>
                <TextArea
                  rows={12}
                  value={currentForm.values}
                  onChange={e => this.props.updateFormState(sourceType, { values: e.target.value })}
                  placeholder={emptyValuesHint
                    ? t('resourceCenter.helm.modal.valuesFallbackPlaceholder', '当前 Chart 未返回 values.yaml，请按需手动填写 YAML')
                    : t('resourceCenter.helm.modal.valuesPlaceholder', 'Chart 检测完成后会在这里展示真实 values.yaml')}
                  className={styles.modalDarkEditor}
                  style={{ minHeight: 280, resize: 'vertical' }}
                />
              </Form.Item>
            </div>
          </Collapse.Panel>
          {readme && (
            <Collapse.Panel
              key="readme"
              header={(
                <div>
                  <div className={styles.modalSectionTitle}>{t('resourceCenter.helm.modal.readmeTitle', '应用说明')}</div>
                  <div className={styles.modalMutedText} style={{ marginTop: 2 }}>{t('resourceCenter.helm.modal.readmeDesc', '来自 Chart README 的原始内容')}</div>
                </div>
              )}
            >
              <div
                className={styles.modalReadme}
                style={{ maxHeight: 240, overflowY: 'auto' }}
              >
                {readme}
              </div>
            </Collapse.Panel>
          )}
        </Collapse>
      </div>
    );
  }

  renderHelmSourceTabs() {
    const helmSourceType = this.getStateValue('helmSourceType', 'store');
    const tabs = [
      { key: 'store', label: t('resourceCenter.helm.modal.tabStore', 'Helm 商店'), helper: t('resourceCenter.helm.modal.tabStoreHelper', '从已配置仓库中选择 Chart') },
      { key: 'external', label: t('resourceCenter.helm.modal.tabExternal', '第三方仓库 / OCI'), helper: t('resourceCenter.helm.modal.tabExternalHelper', '支持官方、自建 Repo 与 OCI') },
      { key: 'upload', label: t('resourceCenter.helm.modal.tabUpload', '上传 Chart 包'), helper: t('resourceCenter.helm.modal.tabUploadHelper', '上传 .tgz 后直接安装 Release') },
    ];

    return (
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {tabs.map(tab => {
          const active = helmSourceType === tab.key;
          return (
            <div
              key={tab.key}
              onClick={() => this.props.onSourceChange(tab.key)}
              className={`${styles.modalCard} ${styles.modalSourceOption} ${active ? `${styles.modalCardActive} ${styles.modalSourceOptionActive}` : ''}`}
              style={{ flex: 1, cursor: 'pointer', padding: '12px 14px' }}
            >
              <div className={active ? styles.resourceLink : styles.modalSectionLabel}>{tab.label}</div>
              <div className={styles.modalMutedText} style={{ marginTop: 4 }}>{tab.helper}</div>
            </div>
          );
        })}
      </div>
    );
  }

  renderHelmExternalSourceForm() {
    const helmExternalForm = this.getStateValue('helmExternalForm', {});
    const helmPreviewStatus = this.getStateValue('helmPreviewStatus', 'idle');
    const chartValidationMessage = this.props.getHelmExternalChartValidationMessage
      ? this.props.getHelmExternalChartValidationMessage()
      : '';
    const isBasicAuth = helmExternalForm.auth_type === 'basic';
    return (
      <div>
        <div className={styles.modalSectionNotice} style={{ marginBottom: 20 }}>
          {t('resourceCenter.helm.modal.externalNotice', '请直接填写 Chart 地址，支持 Helm 官方或自建 Helm Repo 中的 Chart 包地址，以及使用 OCI 格式的制品仓库。点击下一步后会自动检测并解析 Chart。')}
        </div>
        <Form layout="vertical">
          <Form.Item
            label={t('resourceCenter.common.chartAddress', 'Chart 地址')}
            required
            style={{ marginBottom: 8 }}
            validateStatus={chartValidationMessage ? 'error' : undefined}
            help={chartValidationMessage || undefined}
          >
            <Input.Group compact>
              <Select
                value={helmExternalForm.chart_protocol}
                onChange={value => this.props.onExternalFieldChange('chart_protocol', value)}
                style={{ width: 120 }}
              >
                <Option value="https://">https://</Option>
                <Option value="http://">http://</Option>
                <Option value="oci://">oci://</Option>
              </Select>
              <Input
                value={helmExternalForm.chart_address}
                onChange={e => this.props.onExternalFieldChange('chart_address', e.target.value)}
                style={{ width: 'calc(100% - 120px)' }}
                placeholder={
                  helmExternalForm.chart_protocol === 'oci://'
                    ? 'registry-1.docker.io/bitnamicharts/nginx:15.9.0'
                    : 'charts.bitnami.com/bitnami/nginx-15.9.0.tgz'
                }
              />
            </Input.Group>
          </Form.Item>
          <div className={styles.modalMutedText} style={{ marginBottom: 18 }}>
            {t('resourceCenter.helm.modal.externalSupport', '支持 Helm 官方或自建 Helm Repo 仓库，以及使用 OCI 格式的制品仓库。')}
          </div>
          <Form.Item label={t('resourceCenter.common.authType', '鉴权方式')} required style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <Button className={`${styles.modalAuthButton} ${helmExternalForm.auth_type === 'none' ? styles.modalAuthButtonActive : ''}`} onClick={() => this.props.onExternalFieldChange('auth_type', 'none')}>
                None
              </Button>
              <Button className={`${styles.modalAuthButton} ${helmExternalForm.auth_type === 'basic' ? styles.modalAuthButtonActive : ''}`} onClick={() => this.props.onExternalFieldChange('auth_type', 'basic')}>
                Basic
              </Button>
            </div>
          </Form.Item>
          {isBasicAuth && (
            <>
              <Form.Item label={t('resourceCenter.common.username', '用户名')} required style={{ marginBottom: 16 }}>
                <Input
                  value={helmExternalForm.username}
                  onChange={e => this.props.onExternalFieldChange('username', e.target.value)}
                  placeholder={t('resourceCenter.helm.modal.usernamePlaceholder', '请输入用户名')}
                />
              </Form.Item>
              <Form.Item label={t('resourceCenter.common.password', '密码')} required style={{ marginBottom: 16 }}>
                <Input.Password
                  value={helmExternalForm.password}
                  onChange={e => this.props.onExternalFieldChange('password', e.target.value)}
                  placeholder={t('resourceCenter.helm.modal.passwordPlaceholder', '请输入密码')}
                />
              </Form.Item>
            </>
          )}
        </Form>
        {helmPreviewStatus === 'checking' || helmPreviewStatus === 'error'
          ? this.renderHelmDetectState()
          : (
            <div
              className={styles.modalDashedNotice}
            >
              {t('resourceCenter.helm.modal.externalNextHint', '填写完成后点击下一步，系统会自动检测 Chart 并进入安装信息填写。')}
            </div>
          )}
      </div>
    );
  }

  renderHelmUploadSourceForm() {
    const helmUploadRecord = this.getStateValue('helmUploadRecord', {});
    const helmUploadFileList = this.getStateValue('helmUploadFileList', []);
    const helmUploadExistFiles = this.getStateValue('helmUploadExistFiles', []);
    const helmUploadLoading = this.getStateValue('helmUploadLoading', false);
    const helmPreviewStatus = this.getStateValue('helmPreviewStatus', 'idle');

    return (
      <div>
        <div className={styles.modalSectionNotice} style={{ marginBottom: 20 }}>
          {t('resourceCenter.helm.modal.uploadNotice', '上传 `.tgz` Chart 包后，点击下一步时系统会自动解析版本与默认 values，并继续安装流程。')}
        </div>

        <Form layout="vertical">
          <Form.Item label={t('resourceCenter.helm.modal.uploadChartLabel', '上传 Chart 包')} required style={{ marginBottom: 12 }}>
            <Upload
              name="packageTarFile"
              fileList={helmUploadFileList}
              action={helmUploadRecord && helmUploadRecord.upload_url}
              onChange={this.props.onUploadChange}
              onRemove={this.props.onResetUploadFileList}
              accept=".tgz"
            >
              <Button icon="upload" loading={helmUploadLoading} disabled={!helmUploadRecord || !helmUploadRecord.upload_url}>
                {t('resourceCenter.helm.modal.selectChartPackage', '选择 Chart 包')}
              </Button>
            </Upload>
          </Form.Item>

          {!!helmUploadExistFiles.length && (
            <Form.Item label={t('resourceCenter.helm.modal.uploadedFiles', '已上传文件')} style={{ marginBottom: 12 }}>
              <div className={styles.modalUploadBox} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ minWidth: 0 }}>
                  {helmUploadExistFiles.map(item => (
                    <div key={item} className={styles.modalUploadFile}>
                      <Icon type="inbox" className={styles.modalUploadIcon} />
                      {item}
                    </div>
                  ))}
                </div>
                <Button type="link" style={{ paddingRight: 0 }} onClick={this.props.onUploadRemove} loading={helmUploadLoading}>
                  {t('resourceCenter.common.delete', '删除')}
                </Button>
              </div>
            </Form.Item>
          )}
        </Form>
        {helmPreviewStatus === 'checking' || helmPreviewStatus === 'error'
          ? this.renderHelmDetectState()
          : (
            <div
              className={styles.modalDashedNotice}
            >
              {t('resourceCenter.helm.modal.uploadNextHint', '上传完成后点击下一步，系统会自动检测 Chart 并进入安装信息填写。')}
            </div>
          )}
      </div>
    );
  }

  renderHelmModalFooter() {
    const helmModalMode = this.getStateValue('helmModalMode', 'install');
    const helmSourceType = this.getStateValue('helmSourceType', 'store');
    const helmStep = this.getStateValue('helmStep', 'source');
    const helmInstallLoading = this.getStateValue('helmInstallLoading', false);
    const helmPreviewLoading = this.getStateValue('helmPreviewLoading', false);
    const actionText = helmModalMode === 'upgrade'
      ? t('resourceCenter.common.upgrade', '升级')
      : t('resourceCenter.common.install', '安装');
    const isLastStep = helmStep === 'values';
    const nextLoading = helmStep === 'source' && helmSourceType !== 'store' && helmPreviewLoading;

    return (
      <span>
        {helmStep !== 'source' && (
          <Button onClick={this.props.onPrevStep} style={{ marginRight: 8 }}>
            <Icon type="left" />{t('resourceCenter.helm.modal.prevStep', '上一步')}
          </Button>
        )}
        <Button onClick={this.props.onCloseWizard} style={{ marginRight: 8 }}>{t('resourceCenter.common.cancel', '取消')}</Button>
        {isLastStep ? (
          <Button type="primary" loading={helmInstallLoading} onClick={this.props.onSubmitWizard} disabled={!this.props.canInstall()}>
            {actionText}
          </Button>
        ) : (
          <Button type="primary" loading={nextLoading} onClick={this.props.onNextStep} disabled={!this.props.canProceedStep()}>
            {t('resourceCenter.helm.modal.nextStep', '下一步')}
          </Button>
        )}
      </span>
    );
  }

  renderHelmSourceStep() {
    const helmSourceType = this.getStateValue('helmSourceType', 'store');
    if (helmSourceType === 'store') {
      return this.renderHelmBrowse();
    }
    if (helmSourceType === 'external') {
      return this.renderHelmExternalSourceForm();
    }
    return this.renderHelmUploadSourceForm();
  }

  renderHelmValuesStep() {
    const helmSourceType = this.getStateValue('helmSourceType', 'store');
    const helmModalMode = this.getStateValue('helmModalMode', 'install');
    const helmPreviewData = this.getStateValue('helmPreviewData', null);

    return (
      <div>
        {this.renderHelmPreviewHeader()}
        <div className={styles.modalSectionNotice} style={{ marginBottom: 16 }}>
          {t('resourceCenter.helm.modal.valuesStepHint', '最后一步统一编辑 values.yaml，确认无误后即可直接{action}。', {
            action: helmModalMode === 'upgrade'
              ? t('resourceCenter.common.upgrade', '升级')
              : t('resourceCenter.common.install', '安装'),
          })}
        </div>
        {helmPreviewData
          ? this.renderHelmConfigPanel(helmSourceType)
          : (this.renderHelmDetectState() || <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('resourceCenter.helm.modal.completePreview', '请先完成 Chart 检测')} />)}
      </div>
    );
  }

  renderHelmStepContent() {
    const helmStep = this.getStateValue('helmStep', 'source');
    if (helmStep === 'basic') {
      return this.renderHelmBasicForm();
    }
    if (helmStep === 'values') {
      return this.renderHelmValuesStep();
    }
    return this.renderHelmSourceStep();
  }

  renderWizardModal() {
    const helmModalVisible = this.getStateValue('helmModalVisible', false);
    const helmModalMode = this.getStateValue('helmModalMode', 'install');
    const helmStep = this.getStateValue('helmStep', 'source');

    return (
      <Modal
        title={(
          <span>
            <HelmIcon size={16} className={styles.modalMutedText} style={{ marginRight: 8 }} />
            {helmModalMode === 'upgrade'
              ? t('resourceCenter.helm.modal.upgradeTitle', '升级 Helm Release')
              : t('resourceCenter.helm.modal.installTitle', '安装 Helm 应用')}
          </span>
        )}
        visible={helmModalVisible}
        footer={this.renderHelmModalFooter()}
        onCancel={this.props.onCloseWizard}
        width={800}
        bodyStyle={{ padding: '16px 24px', minHeight: 560 }}
      >
        {this.renderHelmUpgradeAssistant()}
        {helmStep === 'source' && this.renderHelmSourceTabs()}
        {this.renderHelmStepContent()}
      </Modal>
    );
  }

  renderValuesEditorModal() {
    const helmValuesEditorVisible = this.getStateValue('helmValuesEditorVisible', false);
    const helmValuesEditorSourceType = this.getStateValue('helmValuesEditorSourceType', 'store');
    const helmEditorForm = this.getFormState(helmValuesEditorSourceType);

    return (
      <Modal
        title={(
          <span>
            <Icon type="edit" className={styles.modalMutedText} style={{ marginRight: 8 }} />
            {t('resourceCenter.helm.modal.valuesEditorTitle', '放大编辑 values.yaml')}
          </span>
        )}
        visible={helmValuesEditorVisible}
        onCancel={this.props.onCloseValuesEditor}
        footer={<Button onClick={this.props.onCloseValuesEditor}>{t('resourceCenter.common.close', '关闭')}</Button>}
        width={980}
        bodyStyle={{ padding: '16px 24px 24px' }}
        destroyOnClose={false}
      >
        <div className={styles.modalSectionNotice} style={{ marginBottom: 12 }}>
          {t('resourceCenter.helm.modal.valuesEditorHint', '这里的修改会实时同步到安装表单，你可以在大编辑区里直接调整 values.yaml。')}
        </div>
        <TextArea
          rows={26}
          value={helmEditorForm.values}
          onChange={e => this.props.updateFormState(helmValuesEditorSourceType, { values: e.target.value })}
          placeholder={t('resourceCenter.helm.modal.valuesPlaceholder', 'Chart 检测完成后会在这里展示真实 values.yaml')}
          className={styles.modalDarkEditor}
          style={{ minHeight: 560, resize: 'vertical' }}
        />
      </Modal>
    );
  }

  renderHistoryModal() {
    const helmHistoryVisible = this.getStateValue('helmHistoryVisible', false);
    const helmHistoryLoading = this.getStateValue('helmHistoryLoading', false);
    const helmHistoryList = this.getStateValue('helmHistoryList', []);
    const helmHistoryRelease = this.getStateValue('helmHistoryRelease', null);
    const helmRollbackLoading = this.getStateValue('helmRollbackLoading', false);
    const latestRevision = getLatestRevision(helmHistoryList);

    const columns = [
      { title: t('resourceCenter.detail.revision', 'Revision'), dataIndex: 'revision', key: 'revision', width: 100 },
      {
        title: t('resourceCenter.common.chart', 'Chart'),
        dataIndex: 'chart',
        key: 'chart',
        width: 220,
        render: (value, record) => (
          <span>
            <span className={styles.metricValueDefault}>{value || '-'}</span>
            {record.chart_version && <span className={styles.chartVersionText}>@{record.chart_version}</span>}
          </span>
        ),
      },
      { title: t('resourceCenter.common.status', '状态'), dataIndex: 'status', key: 'status', width: 120, render: value => <StatusDot status={value} /> },
      { title: t('resourceCenter.common.appVersion', '应用版本'), dataIndex: 'app_version', key: 'app_version', width: 120, render: value => value || '-' },
      { title: t('resourceCenter.common.updatedAt', '更新时间'), dataIndex: 'updated', key: 'updated', width: 180, render: value => <span className={styles.tableAuxText}>{formatToBeijingTime(value)}</span> },
      {
        title: t('resourceCenter.common.operation', '操作'),
        key: 'action',
        width: 120,
        render: (_, record) => (
          record.revision === latestRevision
            ? <span className={styles.modalCurrentVersion}>{t('resourceCenter.detail.currentVersion', '当前版本')}</span>
            : (
              <Popconfirm
                title={t('resourceCenter.helm.modal.rollbackConfirm', '确认回滚 {name} 到 revision {revision}？', {
                  name: helmHistoryRelease ? helmHistoryRelease.name : '',
                  revision: record.revision,
                })}
                onConfirm={() => helmHistoryRelease && this.props.onRollbackHistory(helmHistoryRelease.name, record.revision)}
              >
                <a className={styles.resourceLink}>{t('resourceCenter.detail.rollbackToVersion', '回滚到此版本')}</a>
              </Popconfirm>
            )
        ),
      },
    ];

    return (
      <Modal
        title={(
          <span>
            <Icon type="history" className={styles.modalMutedText} style={{ marginRight: 8 }} />
            {t('resourceCenter.helm.modal.rollbackHistory', '回滚历史')} {helmHistoryRelease ? `· ${helmHistoryRelease.name}` : ''}
          </span>
        )}
        visible={helmHistoryVisible}
        footer={<Button onClick={this.props.onCloseHistory}>{t('resourceCenter.common.close', '关闭')}</Button>}
        onCancel={this.props.onCloseHistory}
        width={860}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <Table
          loading={helmHistoryLoading || helmRollbackLoading}
          dataSource={helmHistoryList}
          columns={columns}
          rowKey={record => String(record.revision)}
          pagination={false}
          locale={{ emptyText: t('resourceCenter.helm.modal.noRollbackHistory', '暂无可回滚历史版本') }}
        />
      </Modal>
    );
  }

  renderDetailModal() {
    const helmDetailVisible = this.getStateValue('helmDetailVisible', false);
    const helmDetailRelease = this.getStateValue('helmDetailRelease', null);
    const release = helmDetailRelease || {};
    const sourceInfo = release.source_info || {};
    const upgradeTypeText = sourceInfo.upgrade_mode === 'store_locked'
      ? t('resourceCenter.helm.modal.storeLockedUpgrade', 'Helm 商店固定升级')
      : t('resourceCenter.helm.modal.genericUpgrade', '通用升级（第三方仓库 / OCI 或上传 Chart 包）');
    const infoRows = [
      { label: t('resourceCenter.common.releaseName', 'Release 名称'), value: release.name || '-' },
      {
        label: t('resourceCenter.common.chart', 'Chart'),
        value: (
          <span>
            <span className={styles.metricValueDefault}>{release.chart || '-'}</span>
            {release.chart_version ? <span className={styles.chartVersionText}>@{release.chart_version}</span> : null}
          </span>
        ),
      },
      { label: t('resourceCenter.common.appVersion', '应用版本'), value: release.app_version || '-' },
      { label: t('resourceCenter.common.status', '状态'), value: <StatusDot status={release.status} /> },
      { label: t('resourceCenter.detail.revision', 'Revision'), value: release.version || '-' },
      { label: t('resourceCenter.common.namespace', '命名空间'), value: <code className={styles.monoCode}>{release.namespace || '-'}</code> },
      { label: t('resourceCenter.common.updatedAt', '更新时间'), value: formatToBeijingTime(release.updated) },
      { label: t('resourceCenter.detail.installSource', '安装来源'), value: sourceInfo.source_type || 'legacy' },
      { label: t('resourceCenter.common.upgradeMode', '升级方式'), value: upgradeTypeText },
    ];

    return (
      <Modal
        title={(
          <span>
            <Icon type="profile" className={styles.modalMutedText} style={{ marginRight: 8 }} />
            {t('resourceCenter.helm.modal.releaseDetailTitle', 'Helm Release 详情')}
          </span>
        )}
        visible={helmDetailVisible}
        onCancel={this.props.onCloseDetail}
        footer={(
          <span>
            <Button
              style={{ marginRight: 8 }}
              onClick={() => {
                if (helmDetailRelease) {
                  this.props.onOpenHistoryFromDetail(helmDetailRelease);
                }
                this.props.onCloseDetail();
              }}
            >
              {t('resourceCenter.helm.modal.viewRollbackHistory', '查看回滚历史')}
            </Button>
            <Button
              type="primary"
              style={{ marginRight: 8 }}
              onClick={() => {
                if (helmDetailRelease) {
                  this.props.onJumpToUpgradeFromDetail(helmDetailRelease);
                }
                this.props.onCloseDetail();
              }}
            >
              {t('resourceCenter.helm.modal.goUpgrade', '去升级')}
            </Button>
            <Button onClick={this.props.onCloseDetail}>{t('resourceCenter.common.close', '关闭')}</Button>
          </span>
        )}
        width={720}
      >
        <div className={styles.modalSectionNotice} style={{ marginBottom: 18 }}>
          {t('resourceCenter.helm.modal.releaseDetailHint', '这里展示当前 Release 的基础信息。点击“去升级”会进入详情页，并根据安装来源打开对应的升级内容。')}
        </div>
        <div className={styles.modalInfoGrid}>
          {infoRows.map(item => (
            <React.Fragment key={item.label}>
              <div className={styles.modalInfoLabel}>{item.label}</div>
              <div className={styles.modalInfoValue}>{item.value}</div>
            </React.Fragment>
          ))}
        </div>
      </Modal>
    );
  }

  render() {
    return (
      <>
        {this.renderWizardModal()}
        {this.renderValuesEditorModal()}
        {this.renderDetailModal()}
        {this.renderHistoryModal()}
      </>
    );
  }
}

export default HelmModals;
