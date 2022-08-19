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
import styles from '../../Index.less';
import LogShow from '../LogShow';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';

@connect()
@Form.create()
class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      logVisible: false,
      EventID: '',
    };
  }
  componentDidMount() {}

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
        return '构建中';
      case 'success':
        return '构建成功';
      case 'failure':
        return '构建失败';
      default:
        return '未知';
    }
  };

  render() {
    const {
      dataList,
      current_version,
      componentPermissions: { isRollback, isDelete },
      pages,
      pageSize,
      total,
      onPageChange,
      onShowSizeChange,
    } = this.props;
    const { EventID, logVisible } = this.state;
    return (
      <Row gutter={24}>
        {logVisible && (
          <LogShow
            // title="构建日志"
            title={<FormattedMessage id='componentOverview.body.tab.overview.buildHistory.buildLog'/>}
            EventID={EventID}
            onOk={this.handleOk}
            onCancel={this.handleCancel}
            width="1200px"
          />
        )}
        <Col xs={24} xm={24} md={24} lg={24} xl={24}>
          <Card
            bordered={false}
            // title="构建版本历史"
            title={<FormattedMessage id='componentOverview.body.tab.overview.buildHistory.buildVersionHistory'/>}
            style={{ margin: '20px 0' }}
          >
            <div className={styles.buildHistoryBox}>
              <ul className={styles.buildHistoryList}>
                {dataList &&
                  dataList.length > 0 &&
                  dataList.map(item => {
                    const {
                      code_commit_msg,
                      image_domain,
                      build_user,
                      code_version,
                      status,
                      create_time,
                      build_version,
                      finish_time,
                      upgrade_or_rollback,
                      event_id,
                      image_repo,
                      code_branch,
                      image_tag,
                      kind,
                    } = item;
                    return (
                      <li
                        key={build_version}
                        className={`${styles.rowLi} ${styles.prRow} ${
                          status === 'success'
                            ? styles.passed
                            : status === 'failure'
                            ? styles.failed
                            : styles.canceled
                        } `}
                      >
                        <div className={`${styles.lineone} ${styles.fadeOute}`}>
                          <div
                            className={`${styles.rowRtem} ${styles.buildInfo}`}
                          >
                            <div
                              className={` ${styles.alcen}  ${
                                styles.rowBranch
                              }`}
                            >
                              <span className={`${styles.statusIcon} `}>
                                {status === 'success' ? (
                                  globalUtil.fetchSvg('success')
                                ) : status === 'failure' ? (
                                  <span
                                    className={styles.icon}
                                    style={{
                                      textAlign: 'center',
                                      color: '#db4545',
                                      display: 'inline-block',
                                      lineHeight: 1,
                                    }}
                                  >
                                    !
                                  </span>
                                ) : (
                                  globalUtil.fetchSvg('close')
                                )}
                              </span>
                              <a
                                className={` ${styles.alcen} ${
                                  styles.passeda
                                } `}
                              >
                                <font
                                  className={styles.nowarpCorolText}
                                  style={{
                                    width: '100%',
                                    color:
                                      status === 'success'
                                        ? '#39aa56'
                                        : status === 'failure'
                                        ? '#db4545'
                                        : '#9d9d9d',
                                  }}
                                >
                                  {build_version}
                                  {build_version &&
                                    current_version &&
                                    build_version === current_version &&
                                    // '(当前版本)'
                                    <FormattedMessage id='componentOverview.body.tab.overview.buildHistory.currentVersion'/>}
                                </font>
                              </a>
                            </div>
                            <div
                              className={` ${styles.alcen} ${
                                styles.rowMessage
                              } `}
                            >
                              <Tooltip
                                title={
                                  kind &&
                                  (kind === '源码构建'
                                    ? 
                                    // '提交信息'
                                    <FormattedMessage id='componentOverview.body.tab.overview.buildHistory.submitInformation'/>
                                    : kind === '本地文件'
                                    ? 
                                    // '文件名称'
                                    <FormattedMessage id='componentOverview.body.tab.overview.buildHistory.fileName'/>
                                    : 
                                    // '源镜像仓库地址'
                                    <FormattedMessage id='componentOverview.body.tab.overview.buildHistory.address'/>)
                                }
                              >
                                {kind &&
                                  (kind === '源码构建'
                                    ? globalUtil.fetchSvg('basicInfo')
                                    : globalUtil.fetchSvg('warehouse'))}
                              </Tooltip>

                              <Tooltip
                                title={
                                  kind &&
                                  (kind === '源码构建'
                                    ? code_commit_msg && code_commit_msg
                                    : kind === '本地文件'
                                    ? code_commit_msg && code_commit_msg
                                    : image_domain && image_domain)
                                }
                              >
                                <span
                                  className={styles.nowarpCorolText}
                                  style={{
                                    width: '90%',
                                  }}
                                >
                                  {kind &&
                                    (kind === '源码构建'
                                      ? code_commit_msg && code_commit_msg
                                      : kind === '本地文件'
                                      ? code_commit_msg && code_commit_msg
                                      : image_domain && image_domain)}
                                </span>
                              </Tooltip>
                            </div>
                          </div>

                          <div
                            className={`${styles.rowRtem} ${
                              styles.buildCommitter
                            } ${styles.alcen}`}
                          >
                            <div
                              style={{
                                width: '210px',
                              }}
                            >
                              <a
                                style={{
                                  width: '100%',
                                  cursor: 'auto',
                                }}
                              >
                                <font
                                  className={styles.nowarpCorolText}
                                  style={{
                                    width: '90%',
                                  }}
                                >
                                  {build_user && ` @&nbsp;${build_user}`}
                                </font>
                              </a>
                            </div>
                            <div
                              className={` ${styles.alcen} ${styles.calcwd} `}
                            >
                              <a
                                className={`${styles.alcen}`}
                                style={{
                                  width: '50%',
                                  cursor: 'auto',
                                }}
                              >
                                <Tooltip
                                  title={
                                    kind &&
                                    (kind === '源码构建'
                                      ? 
                                      // '代码分支'
                                      <FormattedMessage id='componentOverview.body.tab.overview.buildHistory.CodeBranch'/>
                                      : kind === '本地文件'
                                      ? 
                                      // '上传时间'
                                      <FormattedMessage id='componentOverview.body.tab.overview.buildHistory.uploadTime'/>
                                      : 
                                      // '源镜像名称'
                                      <FormattedMessage id='componentOverview.body.tab.overview.buildHistory.imageName'/>)
                                  }
                                >
                                  {kind &&
                                    (kind === '源码构建'
                                      ? globalUtil.fetchSvg('branch')
                                      : globalUtil.fetchSvg('basicInfo'))}
                                </Tooltip>

                                <Tooltip
                                  title={
                                    kind &&
                                    (kind === '源码构建'
                                      ? code_branch && code_branch
                                      : kind === '本地文件'
                                      ? code_branch && code_branch
                                      : image_repo && image_repo)
                                  }
                                >
                                  <span
                                    className={styles.nowarpCorolText}
                                    style={{
                                      width: '90%',
                                    }}
                                  >
                                    {kind &&
                                      (kind === '源码构建'
                                        ? code_branch && code_branch
                                        : kind === '本地文件'
                                        ? code_branch && code_branch
                                        : image_repo && image_repo)}
                                  </span>
                                </Tooltip>
                              </a>
                              <a
                                className={` ${styles.alcen} `}
                                style={{
                                  width: '50%',
                                  cursor: 'auto',
                                }}
                              >
                                <Tooltip
                                  title={
                                    kind &&
                                    (kind === '源码构建'
                                      ? 
                                      // '代码版本'
                                      <FormattedMessage id='componentOverview.body.tab.overview.buildHistory.codeVersion'/>
                                      : kind === '本地文件'
                                      ? 
                                      // '文件MD5'
                                      <FormattedMessage id='componentOverview.body.tab.overview.buildHistory.file'/>
                                      : 
                                      // '源镜像TAG'
                                      <FormattedMessage id='componentOverview.body.tab.overview.buildHistory.tag'/>)
                                  }
                                >
                                  <span
                                    className={` ${styles.alcen} ${
                                      styles.buildwidth
                                    } `}
                                    style={{ color: 'rgba(0, 0, 0, 0.65)' }}
                                  >
                                    {kind &&
                                      (kind === '源码构建'
                                        ? globalUtil.fetchSvg('warehouse')
                                        : globalUtil.fetchSvg('branch'))}
                                  </span>
                                </Tooltip>

                                <Tooltip
                                  title={
                                    kind &&
                                    (kind === '源码构建'
                                      ? code_version
                                      : kind === '本地文件'
                                      ? code_version
                                      : image_tag && image_tag)
                                  }
                                >
                                  <font
                                    className={styles.nowarpCorolText}
                                    style={{
                                      width: '90%',
                                    }}
                                  >
                                    {kind &&
                                      (kind === '源码构建'
                                        ? code_version && code_version.substr(0, 8)
                                        : kind === '本地文件'
                                        ? code_version && code_version
                                        : image_tag || '')}
                                  </font>
                                </Tooltip>
                              </a>
                            </div>
                          </div>
                        </div>
                        <div className={`${styles.linetwo}`}>
                          <div className={`${styles.rowRtem} ${styles.alcen}`}>
                            <a
                              className={
                                status === 'success'
                                  ? styles.passeda
                                  : status === 'failure'
                                  ? styles.faileda
                                  : styles.canceleda
                              }
                            >
                              {globalUtil.fetchSvg(
                                'logState',
                                status === 'failure'
                                  ? '#39AA56#db4545'
                                  : '#39AA56'
                              )}
                              <font
                                style={{
                                  fontSize: '14px',
                                  color:
                                    status === 'failure'
                                      ? '#39AA56#db4545'
                                      : '#39AA56',
                                }}
                              >
                                {this.showStatus(status)}
                              </font>
                            </a>
                          </div>
                          <div className={`${styles.rowRtem} `} />
                        </div>
                        <div className={`${styles.linestree}`}>
                          <div
                            className={`${styles.rowRtem} ${
                              styles.rowDuration
                            }`}
                          >
                            <div className={styles.alcen}>
                              <Tooltip 
                              // title="运行时间"
                              title={<FormattedMessage id='componentOverview.body.tab.overview.buildHistory.runTime'/>}
                              >
                                {globalUtil.fetchSvg('runTime')}
                              </Tooltip>

                              <time className={styles.labelAlign}>
                                <font
                                  style={{
                                    display: 'inline-block',
                                    color: 'rgba(0,0,0,0.45)',
                                  }}
                                >
                                  {globalUtil.fetchTime(
                                    finish_time
                                      ? new Date(finish_time).getTime() -
                                          new Date(create_time).getTime()
                                      : Date.parse(new Date()) -
                                          new Date(create_time).getTime()
                                  )}
                                </font>
                              </time>
                            </div>
                          </div>
                          <div
                            className={`${styles.rowRtem} ${
                              styles.rowCalendar
                            } ${styles.alcen}`}
                          >
                            <div className={styles.alcen}>
                              <Tooltip 
                              // title="创建时间"
                              title={<FormattedMessage id='componentOverview.body.tab.overview.buildHistory.creationTime'/>}
                              >
                                {globalUtil.fetchSvg('createTime')}
                              </Tooltip>

                              <time className={styles.labelAlign}>
                                <font
                                  style={{
                                    display: 'inline-block',
                                    color: 'rgba(0,0,0,0.45)',
                                  }}
                                >
                                  {create_time &&
                                    moment(create_time)
                                      .locale('zh-cn')
                                      .format('YYYY-MM-DD HH:mm:ss')}
                                </font>
                              </time>
                            </div>
                          </div>
                        </div>
                        <div className={`${styles.linefour}`}>
                          <span>
                            <a
                              style={{ fontSize: '12px' }}
                              onClick={() => {
                                this.showModal(event_id);
                              }}
                            >
                              {/* 日志 */}
                              <FormattedMessage id='componentOverview.body.tab.overview.buildHistory.log'/>
                            </a>
                          </span>
                          {upgrade_or_rollback == 1 && isRollback ? (
                            <Popconfirm
                              title="确定要升级到此版本吗?"
                              onConfirm={() => {
                                this.handleRolback(item);
                              }}
                            >
                              <span>
                                <Divider type="vertical" />
                                <a style={{ fontSize: '12px' }}>
                                  {/* 升级 */}
                                  <FormattedMessage id='componentOverview.body.tab.overview.buildHistory.upgrade'/>
                                </a>
                              </span>
                            </Popconfirm>
                          ) : upgrade_or_rollback == -1 &&
                            status == 'success' &&
                            build_version != current_version &&
                            isRollback &&
                            current_version ? (
                            <Popconfirm
                              title="确定要回滚到此版本吗?"
                              onConfirm={() => {
                                this.handleRolback(item);
                              }}
                            >
                              <span>
                                <Divider type="vertical" />
                                <a style={{ fontSize: '12px' }}>
                                  {/* 回滚 */}
                                  <FormattedMessage id='componentOverview.body.tab.overview.buildHistory.roolback'/>
                                </a>
                              </span>
                            </Popconfirm>
                          ) : (
                            ''
                          )}

                          <Popconfirm
                            title="确定要删除此版本吗?"
                            onConfirm={() => {
                              this.handleDel(item);
                            }}
                          >
                            {build_version !== current_version &&
                              isDelete &&
                              current_version && (
                                <span>
                                  <Divider type="vertical" />
                                  <a style={{ fontSize: '12px' }}>
                                    {/* 删除 */}
                                    <FormattedMessage id='componentOverview.body.tab.overview.buildHistory.delete'/>
                                  </a>
                                </span>
                              )}
                          </Popconfirm>
                        </div>
                      </li>
                    );
                  })}
              </ul>
            </div>
            <div style={{ textAlign: 'right', marginTop: '24px' }}>
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
            </div>
          </Card>
        </Col>
      </Row>
    );
  }
}

export default Index;
