/* eslint-disable eqeqeq */
/* eslint-disable react/jsx-indent */
/* eslint-disable camelcase */
/* eslint-disable no-nested-ternary */
import {
  Card,
  Col,
  Divider,
  Form,
  Pagination,
  Popconfirm,
  Row,
  Tooltip,
} from 'antd';
import { connect } from 'dva';
import moment from 'moment';
import React, { PureComponent } from 'react';
import globalUtil from '../../../../utils/global';
import roleUtil from '../../../../utils/newRole';
import cookie from '../../../../utils/cookie';
import styles from '../../Index.less';
import LogShow from '../LogShow';
import operationCardStyle from '../Basic/operation.less'
import Svg from '../../../../utils/pageHeaderSvg';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';

// 构建类型常量
const BUILD_KIND = {
  SOURCE: '源码构建',
  LOCAL_FILE: '本地文件'
};

@connect(({ appControl, teamControl }) => ({
  appDetail: appControl.appDetail,
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
}))
@Form.create()
class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      logVisible: false,
      EventID: '',
      language: cookie.get('language') === 'zh-CN',
      appUpgradePermission: this.handlePermissions()
    };
  }
  handlePermissions = () => {
    const { currentTeamPermissionsInfo, appDetail } = this.props;
    if(currentTeamPermissionsInfo && appDetail){
      return roleUtil.queryPermissionsInfo(
        currentTeamPermissionsInfo?.team,
        'app_upgrade',
        `app_${appDetail?.service?.group_id}`
      );
    }
  };

  showModal = EventID => {
    this.setState({
      EventID,
      logVisible: true,
    });
  };

  handleOk = () => {
    this.setState({
      logVisible: false,
    });
  };

  handleCancel = () => {
    this.setState({
      logVisible: false,
    });
  };

  handleRolback = item => {
    const { onRollback } = this.props;
    if (onRollback) {
      onRollback(item);
    }
  };

  handleDel = item => {
    const { handleDel } = this.props;
    if (handleDel) {
      handleDel(item);
    }
  };
  showStatus = status => {
    switch (status) {
      case '':
        return formatMessage({id:'componentOverview.body.tab.overview.buildHistory.under'});
      case 'success':
        return formatMessage({id:'componentOverview.body.tab.overview.buildHistory.success'});
      case 'failure':
        return formatMessage({id:'componentOverview.body.tab.overview.buildHistory.fail'});
      default:
        return formatMessage({id:'componentOverview.body.tab.overview.buildHistory.unknown'});
    }
  };

  // 根据构建类型获取对应的值
  getKindValue = (kind, sourceValue, packageValue, imageValue) => {
    if (kind === BUILD_KIND.SOURCE) return sourceValue;
    if (kind === BUILD_KIND.LOCAL_FILE) return packageValue;
    return imageValue;
  };

  // 判断是否为源码构建
  isSourceBuild = kind => kind === BUILD_KIND.SOURCE;

  // 判断是否为本地文件构建
  isLocalFileBuild = kind => kind === BUILD_KIND.LOCAL_FILE;

  // 获取构建详情配置
  getBuildDetailConfig = item => {
    const { kind, code_commit_msg, image_domain, code_branch, image_repo, code_version, image_tag } = item;
    const isSource = this.isSourceBuild(kind);
    const isLocal = this.isLocalFileBuild(kind);

    return [
      {
        icon: isSource ? 'msg' : isLocal ? 'fileName' : 'jingxiang',
        labelId: isSource
          ? 'componentOverview.body.tab.overview.buildHistory.submitInformation'
          : isLocal
          ? 'componentOverview.body.tab.overview.buildHistory.fileName'
          : 'componentOverview.body.tab.overview.buildHistory.address',
        value: isSource || isLocal ? code_commit_msg : image_domain
      },
      {
        icon: isSource ? 'fenzhi' : isLocal ? 'upLoad' : 'jingxiang',
        labelId: isSource
          ? 'componentOverview.body.tab.overview.buildHistory.CodeBranch'
          : isLocal
          ? 'componentOverview.body.tab.overview.buildHistory.uploadTime'
          : 'componentOverview.body.tab.overview.buildHistory.imageName',
        value: isSource || isLocal ? code_branch : image_repo
      },
      {
        icon: isSource ? 'code' : isLocal ? 'MD5' : 'jingxiangTga',
        labelId: isSource
          ? 'componentOverview.body.tab.overview.buildHistory.codeVersion'
          : isLocal
          ? 'componentOverview.body.tab.overview.buildHistory.file'
          : 'componentOverview.body.tab.overview.buildHistory.tag',
        value: isSource ? (code_version ? code_version.substr(0, 8) : '') : isLocal ? code_version : image_tag
      }
    ];
  };

  // 获取状态背景类名
  getStatusClassName = status => {
    if (status === 'success') return styles.historyCardSuccess;
    if (status === 'failure') return styles.historyCardFailure;
    return styles.historyCardUnknown;
  };

  // 获取状态文字颜色
  getStatusTextColor = status => {
    if (status === 'success') return globalUtil.getPublicColor('rbd-success-status');
    if (status === 'failure') return globalUtil.getPublicColor('rbd-error-status');
    return '#9d9d9d';
  };

  // 渲染构建详情项
  renderBuildDetailItem = (item, index) => (
    <div className={styles.historyInfoItem} key={index}>
      <Tooltip title={<FormattedMessage id={item.labelId} />}>
        {Svg.getSvg(item.icon, 14, 'text-color-secondary')}
      </Tooltip>
      <Tooltip title={item.value || ''}>
        <span className={styles.historyInfoValue}>{item.value || '-'}</span>
      </Tooltip>
    </div>
  );

  // 渲染操作按钮
  renderActions = (item, current_version, isUpgrade, isRollback, isDelete) => {
    const { build_version, status, upgrade_or_rollback, event_id } = item;

    return (
      <div className={styles.historyActions}>
        <a onClick={() => this.showModal(event_id)}>
          <FormattedMessage id="componentOverview.body.tab.overview.buildHistory.log" />
        </a>
        {upgrade_or_rollback == 1 && isUpgrade && (
          <Popconfirm
            title={<FormattedMessage id="componentOverview.body.tab.overview.buildHistory.popUpgrade" />}
            onConfirm={() => this.handleRolback(item)}
          >
            <span>
              <Divider type="vertical" />
              <a><FormattedMessage id="componentOverview.body.tab.overview.buildHistory.upgrade" /></a>
            </span>
          </Popconfirm>
        )}
        {upgrade_or_rollback == -1 && status == 'success' && build_version != current_version && isRollback && current_version && (
          <Popconfirm
            title={<FormattedMessage id="componentOverview.body.tab.overview.buildHistory.poprollback" />}
            onConfirm={() => this.handleRolback(item)}
          >
            <span>
              <Divider type="vertical" />
              <a><FormattedMessage id="componentOverview.body.tab.overview.buildHistory.roolback" /></a>
            </span>
          </Popconfirm>
        )}
        {build_version !== current_version && isDelete && current_version && status.length > 0 && (
          <Popconfirm
            title={<FormattedMessage id="componentOverview.body.tab.overview.buildHistory.popDelete" />}
            onConfirm={() => this.handleDel(item)}
          >
            <span>
              <Divider type="vertical" />
              <a><FormattedMessage id="componentOverview.body.tab.overview.buildHistory.delete" /></a>
            </span>
          </Popconfirm>
        )}
      </div>
    );
  };

  render() {
    const {
      dataList,
      current_version,
      componentPermissions: { isDelete },
      pages,
      pageSize,
      total,
      onPageChange,
      onShowSizeChange,
    } = this.props;
    const { EventID, logVisible, appUpgradePermission: { isUpgrade, isRollback } } = this.state;

    return (
      <Row gutter={24}>
        {logVisible && (
          <LogShow
            title={<FormattedMessage id="componentOverview.body.tab.overview.buildHistory.buildLog" />}
            EventID={EventID}
            onOk={this.handleOk}
            onCancel={this.handleCancel}
            width="1200px"
          />
        )}
        <Col xs={24} xm={24} md={24} lg={24} xl={24}>
          <Card
            title={<FormattedMessage id="componentOverview.body.tab.overview.buildHistory.buildVersionHistory" />}
            style={{ margin: '12px 0 0 ' }}
            className={operationCardStyle.operationCard}
          >
            <div className={styles.historyListWrapper}>
              {dataList &&
                dataList.length > 0 &&
                dataList.map(item => {
                  const { build_version, build_user, status, create_time, finish_time } = item;
                  const statusClassName = this.getStatusClassName(status);
                  const statusTextColor = this.getStatusTextColor(status);
                  const buildDetailConfig = this.getBuildDetailConfig(item);
                  const isCurrentVersion = build_version && current_version && build_version === current_version;

                  return (
                    <div
                      key={build_version}
                      className={`${styles.historyCard} ${statusClassName}`}
                    >
                      {/* 第一行：版本号 + 状态 + 操作 */}
                      <div className={styles.historyRow}>
                        <div className={styles.historyRowLeft}>
                          <span className={styles.historyStatus} style={{ color: statusTextColor }}>
                            {status === 'success' ? globalUtil.fetchSvg('success') : status === 'failure' ? (
                              <span style={{ color: statusTextColor, fontWeight: 'bold', marginRight: 4 }}>!</span>
                            ) : globalUtil.fetchSvg('close')}
                            <Tooltip
                              title={isCurrentVersion
                                ? build_version + formatMessage({ id: 'componentOverview.body.tab.overview.buildHistory.currentVersion' })
                                : build_version}
                            >
                              <span className={styles.historyVersion}>
                                {build_version}
                                {isCurrentVersion && (
                                  <FormattedMessage id="componentOverview.body.tab.overview.buildHistory.currentVersion" />
                                )}
                              </span>
                            </Tooltip>
                          </span>
                          <span className={styles.historyStatusText} style={{ color: statusTextColor }}>
                            {this.showStatus(status)}
                          </span>
                        </div>
                        <div className={styles.historyRowRight}>
                          {this.renderActions(item, current_version, isUpgrade, isRollback, isDelete)}
                        </div>
                      </div>

                      {/* 第二行：左列（构建详情） + 右列（时间信息） */}
                      <div className={styles.historyColumns}>
                        {/* 左列：构建详情 */}
                        <div className={styles.historyColumnLeft}>
                          {buildDetailConfig.map((config, index) => this.renderBuildDetailItem(config, index))}
                          {build_user && (
                            <div className={styles.historyInfoItem}>
                              {Svg.getSvg('user', 14, 'text-color-secondary')}
                              <Tooltip title={build_user}>
                                <span className={styles.historyInfoValue}>@{build_user}</span>
                              </Tooltip>
                            </div>
                          )}
                        </div>

                        {/* 右列：时间信息 */}
                        <div className={styles.historyColumnRight}>
                          <div className={styles.historyInfoItem}>
                            <Tooltip title={<FormattedMessage id="componentOverview.body.tab.overview.buildHistory.runTime" />}>
                              {Svg.getSvg('runTime', 14, 'text-color-secondary')}
                            </Tooltip>
                            <span className={styles.historyInfoValue}>
                              {globalUtil.fetchTime(
                                finish_time
                                  ? new Date(finish_time).getTime() - new Date(create_time).getTime()
                                  : Date.parse(new Date()) - new Date(create_time).getTime()
                              )}
                            </span>
                          </div>
                          <div className={styles.historyInfoItem}>
                            <Tooltip title={<FormattedMessage id="componentOverview.body.tab.overview.buildHistory.creationTime" />}>
                              {globalUtil.fetchSvg('runTime', 14, 'text-color-secondary')}
                            </Tooltip>
                            <span className={styles.historyInfoValue}>
                              {create_time && moment(create_time).locale('zh-cn').format('YYYY-MM-DD HH:mm:ss')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            <div style={{ textAlign: 'right', marginTop: '24px' }}>
              {Number(total) > pageSize && (
                <Pagination
                  current={pages}
                  pageSize={pageSize}
                  showSizeChanger
                  total={Number(total)}
                  defaultCurrent={1}
                  onChange={onPageChange}
                  pageSizeOptions={['5', '10', '20', '50']}
                  onShowSizeChange={onShowSizeChange}
                />
              )}
            </div>
          </Card>
        </Col>
      </Row>
    );
  }
}

export default Index;
