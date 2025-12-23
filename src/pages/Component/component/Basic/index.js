/* eslint-disable no-nested-ternary */
import { Card, Col, Form, Row, Skeleton, Tooltip } from 'antd';
import moment from 'moment';
import numeral from 'numeral';
import React, { Fragment, PureComponent } from 'react';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import cookie from '../../../../utils/cookie';
import globalUtil from '../../../../utils/global';
import Svg from '../../../../utils/pageHeaderSvg.js';
import styles from '../../Index.less';

// 构建来源类型
const BUILD_SOURCE_TYPE = {
  SOURCE_CODE: 'source_code',
  PACKAGE_BUILD: 'package_build'
};

// 构建类型
const BUILD_KIND = {
  SOURCE: '源码构建',
  LOCAL_FILE: '本地文件'
};

@Form.create()
class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      language: cookie.get('language') === 'zh-CN'
    };
  }

  handleMore = state => {
    const { handleMore, onPageChange } = this.props;
    if (handleMore && onPageChange) {
      onPageChange(1);
      handleMore(state);
    }
  };

  titleCase = str => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // 获取构建详情配置
  getBuildDetailConfig = () => {
    const { beanData, buildSource } = this.props;
    const isSourceCode = buildSource === BUILD_SOURCE_TYPE.SOURCE_CODE;
    const isPackageBuild = buildSource === BUILD_SOURCE_TYPE.PACKAGE_BUILD;
    const isSourceBuild = beanData?.kind === BUILD_KIND.SOURCE;
    const isLocalFile = beanData?.kind === BUILD_KIND.LOCAL_FILE;

    return [
      {
        icon: isSourceCode ? 'code' : isPackageBuild ? 'MD5' : 'dizhi',
        labelId: isSourceCode
          ? 'componentOverview.body.tab.overview.codeVersion'
          : isPackageBuild
          ? 'componentOverview.body.tab.overview.file'
          : 'componentOverview.body.tab.overview.warehouse.address',
        tooltip: isSourceBuild ? '' : isLocalFile ? beanData?.code_version : beanData?.image_domain,
        value:
          isSourceBuild && beanData?.code_version && isSourceCode
            ? beanData.code_version.substr(0, 8)
            : isLocalFile && beanData?.code_version && isPackageBuild
            ? beanData.code_version
            : beanData?.image_domain
      },
      {
        icon: isSourceCode ? 'msg' : isPackageBuild ? 'fileName' : 'jingxiang',
        labelId: isSourceCode
          ? 'componentOverview.body.tab.overview.submit'
          : isPackageBuild
          ? 'componentOverview.body.tab.overview.fileName'
          : 'componentOverview.body.tab.overview.imageName',
        tooltip: isSourceBuild || isLocalFile ? beanData?.code_commit_msg : beanData?.image_repo,
        value: isSourceBuild || isLocalFile ? beanData?.code_commit_msg : beanData?.image_repo
      },
      {
        icon: isSourceCode ? 'fenzhi' : isPackageBuild ? 'upLoad' : 'jingxiangTga',
        labelId: isSourceCode
          ? 'componentOverview.body.tab.overview.codeBranch'
          : isPackageBuild
          ? 'componentOverview.body.tab.overview.uploadTime'
          : 'componentOverview.body.tab.overview.image',
        tooltip: isSourceBuild
          ? beanData?.code_branch
          : isLocalFile && beanData?.code_branch
          ? moment(beanData.code_branch).format('YYYY-MM-DD HH:mm:ss')
          : beanData?.image_tag,
        value: isSourceBuild
          ? beanData?.code_branch
          : isLocalFile && beanData?.code_branch
          ? moment(beanData.code_branch).format('YYYY-MM-DD HH:mm:ss')
          : beanData?.image_tag
      }
    ];
  };

  // 渲染构建详情项
  renderBuildDetailItem = item => (
    <div className={styles.basicInfoItem} key={item.labelId}>
      {Svg.getSvg(item.icon, 16, 'text-color-secondary')}
      <FormattedMessage id={item.labelId} />
      <Tooltip title={item.tooltip}>
        <span className={styles.basicInfoValue}>
          {item.value || <FormattedMessage id="componentOverview.body.tab.overview.not" />}
        </span>
      </Tooltip>
    </div>
  );

  render() {
    const { language } = this.state;
    const {
      status,
      beanData,
      more,
      resourcesLoading,
      memory,
      disk,
      dataList,
      isThird,
      method,
      showStorageUsed,
      storageUsed
    } = this.props;

    // 第三方组件不渲染
    if (isThird) {
      return <Row />;
    }

    // 计算显示值
    const memoryDisplay =
      memory === 0 && !showStorageUsed ? (
        <FormattedMessage id="componentOverview.body.tab.overview.unlimited" />
      ) : (
        numeral(memory).format('0,0')
      );
    const diskDisplay = showStorageUsed ? storageUsed?.value : numeral(disk).format('0,0');
    const diskUnit = showStorageUsed ? storageUsed?.unit : 'MB';

    // 状态相关
    const hasStatus = status && Object.keys(status).length > 0;
    const currentStatus = status?.status || '';
    const statusDisplay =
      status && language
        ? this.titleCase(status.status_cn || currentStatus)
        : this.titleCase(currentStatus);
    const isRunning = currentStatus !== 'undeploy' && currentStatus !== 'closed';

    // 样式
    const statusBgColor = globalUtil.fetchStateBJColor(currentStatus);
    const statusTextColor = globalUtil.fetchStateColor(currentStatus);

    // 版本显示
    const versionValue = method === 'vm' ? beanData?.vm_image : beanData?.build_version;
    const versionLabelId =
      method === 'vm'
        ? 'componentOverview.body.tab.overview.vmImage'
        : 'componentOverview.body.tab.overview.version';

    // 构建详情配置
    const buildDetailConfig = this.getBuildDetailConfig();

    // 加载态
    if (!hasStatus) {
      return (
        <Row>
          <Card style={{ margin: '0px 12px', height: 170 }} bodyStyle={{ padding: '5px 20px 5px' }}>
            <Skeleton active />
          </Card>
        </Row>
      );
    }

    return (
      <Row>
        <Col xs={24} xm={24} md={24} lg={24} xl={24}>
          <div className={styles.basicCard} style={{ background: statusBgColor, borderColor: statusTextColor }}>
            {/* 第一行：运行状态 */}
            <div className={styles.basicRow}>
              <div className={styles.basicRowLeft}>
                <span className={styles.basicStatus} style={{ color: statusTextColor }}>
                  {statusDisplay}
                </span>
              </div>
            </div>

            {/* 第二行：左列（运行天数/分配/占用/版本号） + 右列（构建详情） */}
            <div className={styles.basicColumns}>
              {/* 左列：运行天数、资源分配、资源占用、版本号 */}
              <div className={styles.basicColumnLeft}>
                {/* 运行天数 */}
                {isRunning && (
                  <div className={styles.basicInfoItem}>
                    {Svg.getSvg('runTime', 16, 'text-color-secondary')}
                    <FormattedMessage id="componentOverview.body.tab.overview.run" />
                    <Tooltip
                      title={
                        status?.start_time
                          ? globalUtil.fetchTime(Date.now() - new Date(status.start_time).getTime())
                          : ''
                      }
                    >
                      <span className={styles.basicInfoValue}>
                        {status?.start_time
                          ? globalUtil.fetchTime(Date.now() - new Date(status.start_time).getTime())
                          : ''}
                      </span>
                    </Tooltip>
                  </div>
                )}
                {/* 资源分配 */}
                <div className={styles.basicInfoItem}>
                  {Svg.getSvg('fenpei', 16, 'text-color-secondary')}
                  <FormattedMessage id="componentOverview.body.tab.overview.allocation" />
                  {!resourcesLoading && (
                    <Fragment>
                      <Tooltip title={memoryDisplay}>
                        <span className={styles.basicInfoValue}>{memoryDisplay}</span>
                      </Tooltip>
                      {(memory !== 0 || showStorageUsed) && (
                        <FormattedMessage id="componentOverview.body.tab.overview.memory" />
                      )}
                    </Fragment>
                  )}
                </div>
                {/* 资源占用 */}
                <div className={styles.basicInfoItem}>
                  {Svg.getSvg('zhanyong', 16, 'text-color-secondary')}
                  <FormattedMessage id="componentOverview.body.tab.overview.occupy" />
                  {!resourcesLoading && (
                    <Fragment>
                      <Tooltip title={diskDisplay}>
                        <span className={styles.basicInfoValue}>{diskDisplay}</span>
                      </Tooltip>
                      {diskUnit}&nbsp;
                      {formatMessage({ id: 'componentOverview.body.tab.overview.disk' })}
                    </Fragment>
                  )}
                </div>
                {/* 版本号 + 查看更多版本 */}
                <div className={styles.basicInfoItem} style={{ minWidth: 'auto' }}>
                  {method === 'vm'
                    ? globalUtil.fetchSvg('basicInfo')
                    : Svg.getSvg('banben', 16, 'text-color-secondary')}
                  <FormattedMessage id={versionLabelId} />
                  <Tooltip title={versionValue || ''}>
                    <span className={styles.basicInfoValue}>
                      {versionValue || <FormattedMessage id="componentOverview.body.tab.overview.not" />}
                    </span>
                  </Tooltip>
                  {dataList && dataList.length > 0 && !more && (
                    <a onClick={() => this.handleMore(true)} style={{ marginLeft: 8 }}>
                      <FormattedMessage id="componentOverview.body.tab.overview.moreVersion" />
                    </a>
                  )}
                  {more && (
                    <a onClick={() => this.handleMore(false)} style={{ marginLeft: 8 }}>
                      <FormattedMessage id="componentOverview.body.tab.overview.return" />
                    </a>
                  )}
                </div>
              </div>

              {/* 右列：构建详情 */}
              {method !== 'vm' && (
                <div className={styles.basicColumnRight}>
                  {buildDetailConfig.map(item => this.renderBuildDetailItem(item))}
                </div>
              )}
            </div>
          </div>
        </Col>
      </Row>
    );
  }
}

export default Index;
